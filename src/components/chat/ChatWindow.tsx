import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MoreVertical, Trash2, Smile, Paperclip, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { EmojiPicker } from './EmojiPicker';
import { TypingIndicator } from './TypingIndicator';
import { MessageMedia } from './MessageMedia';

interface PendingFile {
  file: File;
  preview?: string;
  isImage: boolean;
}

interface ChatWindowProps {
  chatId: string;
  type: 'direct' | 'group' | 'mod_mail';
  onChatDeleted?: () => void;
  onReadStateChange?: () => void;
}

export const ChatWindow = ({ chatId, type, onChatDeleted, onReadStateChange }: ChatWindowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatDetails, setChatDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ id: string; username: string }[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (valid.length < files.length) toast({ title: 'Some files exceeded 10MB limit', variant: 'destructive' });

    const pending = valid.map(f => ({
      file: f,
      isImage: f.type.startsWith('image/'),
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setPendingFiles(prev => [...prev, ...pending]);
    e.target.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const file = prev[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFiles = async (): Promise<{ urls: string[]; type: string } | null> => {
    if (!user || pendingFiles.length === 0) return null;
    setIsUploading(true);
    const urls: string[] = [];
    let mediaType = 'file';

    try {
      for (const pf of pendingFiles) {
        const path = `${user.id}/${Date.now()}_${pf.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
        const { error } = await supabase.storage.from('chat-media').upload(path, pf.file);
        if (error) { toast({ title: `Failed to upload ${pf.file.name}`, variant: 'destructive' }); continue; }
        urls.push(path);
        if (pf.isImage) mediaType = 'image';
      }
    } finally {
      setIsUploading(false);
      pendingFiles.forEach(pf => { if (pf.preview) URL.revokeObjectURL(pf.preview); });
      setPendingFiles([]);
    }
    return urls.length > 0 ? { urls, type: mediaType } : null;
  };

  const broadcastTyping = useCallback(() => {
    if (!user || !typingChannelRef.current) return;
    const username = user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split('@')[0] || 'Someone';
    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, username },
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingChannelRef.current?.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { user_id: user.id },
      });
    }, 2000);
  }, [user]);

  // Mark chat as read
  const markAsRead = async () => {
    if (!user || !chatId || type === 'mod_mail') return;
    const { error } = await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', chatId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking chat as read:', error);
      return;
    }

    const { error: notificationError } = await supabase
        .from('comment_notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('notification_type', 'chat_message')
        .eq('is_read', false)
        .contains('metadata', { room_id: chatId });

    if (notificationError) {
      console.error('Error marking chat notifications as read:', notificationError);
    }

    onReadStateChange?.();
  };

  useEffect(() => {
    if (!user || !chatId) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        if (type === 'mod_mail') {
          const { data: messagesData } = await supabase
            .from('mod_mail_messages')
            .select('*')
            .eq('thread_id', chatId)
            .order('created_at', { ascending: true });

          if (messagesData && messagesData.length > 0) {
            const senderIds = [...new Set(messagesData.map(m => m.sender_id).filter(Boolean))];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .in('id', senderIds);

            setMessages(messagesData.map(msg => ({
              ...msg,
              sender: profiles?.find(p => p.id === msg.sender_id)
            })));
          } else {
            setMessages(messagesData || []);
          }

          const { data: thread } = await supabase
            .from('mod_mail_threads')
            .select(`*, community:communities(name)`)
            .eq('id', chatId)
            .single();
          setChatDetails(thread);
        } else {
          const { data: messagesData } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('room_id', chatId)
            .order('created_at', { ascending: true });

          if (messagesData && messagesData.length > 0) {
            const senderIds = [...new Set(messagesData.map(m => m.sender_id).filter(Boolean))];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .in('id', senderIds);

            setMessages(messagesData.map(msg => ({
              ...msg,
              sender: profiles?.find(p => p.id === msg.sender_id)
            })));
          } else {
            setMessages(messagesData || []);
          }

          // Fetch room details + resolve name for direct chats
          const { data: room } = await supabase
            .from('chat_rooms')
            .select('*')
            .eq('id', chatId)
            .single();

          if (room && room.type === 'direct') {
            const { data: participants } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('room_id', chatId)
              .neq('user_id', user.id);

            if (participants?.[0]) {
              const { data: otherProfile } = await supabase
                .from('profiles')
                .select('display_name, username, avatar_url')
                .eq('id', participants[0].user_id)
                .single();

              const resolvedName = otherProfile?.display_name || otherProfile?.username || 'Chat';

              setChatDetails({
                ...room,
                name: resolvedName,
                avatar_url: otherProfile?.avatar_url,
              });

              await markAsRead();
            } else {
              setChatDetails(room);
              await markAsRead();
            }
          } else {
            setChatDetails(room);
            await markAsRead();
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: type === 'mod_mail' ? 'mod_mail_messages' : 'chat_messages',
          filter: `${type === 'mod_mail' ? 'thread_id' : 'room_id'}=eq.${chatId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          // Fetch sender profile for the new message
          if (newMsg.sender_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();
            newMsg.sender = profile;
          }
          setMessages((prev) => {
            const filtered = prev.filter(m => m.id !== newMsg.id && !(m.id.startsWith('temp-') && m.content === newMsg.content && m.sender_id === newMsg.sender_id));
            return [...filtered, newMsg];
          });
          // Mark as read when receiving messages while chat is open
          void markAsRead();
        }
      )
      .subscribe();

    const typingChannel = supabase.channel(`typing_dm:${chatId}`);
    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload: p }) => {
        if (p.user_id === user?.id) return;
        setTypingUsers(prev => {
          if (!prev.find(u => u.id === p.user_id)) return [...prev, { id: p.user_id, username: p.username }];
          return prev;
        });
        setTimeout(() => setTypingUsers(prev => prev.filter(u => u.id !== p.user_id)), 3000);
      })
      .on('broadcast', { event: 'stop_typing' }, ({ payload: p }) => {
        setTypingUsers(prev => prev.filter(u => u.id !== p.user_id));
      })
      .subscribe();
    typingChannelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, type, user?.id, onReadStateChange]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingFiles.length === 0) || !user) return;

    const content = newMessage.trim();
    const uploaded = await uploadFiles();
    if (!content && !uploaded) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content,
      media_urls: uploaded?.urls || [],
      media_type: uploaded?.type || null,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      sender: {
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url
      }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingChannelRef.current?.send({ type: 'broadcast', event: 'stop_typing', payload: { user_id: user.id } });
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' }); }, 50);

    const insertPayload: any = {
      sender_id: user.id,
      content,
    };
    if (uploaded) {
      insertPayload.media_urls = uploaded.urls;
      insertPayload.media_type = uploaded.type;
    }

    try {
      if (type === 'mod_mail') {
        const { error } = await supabase.from('mod_mail_messages').insert({
          ...insertPayload,
          thread_id: chatId,
          is_internal: false
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('chat_messages').insert({
          ...insertPayload,
          room_id: chatId,
        });
        if (error) throw error;
        // Update last_read_at after sending
        await markAsRead();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(content);
      toast({
        title: 'Error sending message',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteChat = async () => {
    if (!user || !chatId) return;
    try {
      if (type === 'mod_mail') {
        toast({ title: 'Cannot delete mod mail threads', variant: 'destructive' });
        return;
      }

      const { error: messageDeleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('room_id', chatId)
        .eq('sender_id', user.id);

      if (messageDeleteError) throw messageDeleteError;

      const { error: participantDeleteError } = await supabase
        .from('chat_participants')
        .delete()
        .eq('room_id', chatId)
        .eq('user_id', user.id);

      if (participantDeleteError) throw participantDeleteError;

      await supabase
        .from('comment_notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('notification_type', 'chat_message')
        .eq('is_read', false);
        
      await supabase
        .from('comment_notifications')
        .delete()
        .eq('recipient_id', user.id)
        .eq('notification_type', 'chat_message')
        .contains('metadata', { room_id: chatId });

      toast({ title: type === 'group' ? 'You left the chat' : 'Conversation removed' });
      onChatDeleted?.();
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: 'Failed to delete chat',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      });
    }
    setDeleteDialogOpen(false);
  };

  if (loading || !chatDetails) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-sidebar-background/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <Avatar>
            {chatDetails.avatar_url ? (
              <AvatarImage src={chatDetails.avatar_url} />
            ) : null}
            <AvatarFallback>{(chatDetails.name || 'C').charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold">
              {type === 'mod_mail'
                ? `Mod Mail: ${chatDetails.subject}`
                : chatDetails.name || 'Chat'}
            </div>
            <div className="text-xs text-muted-foreground">
              {type === 'mod_mail' ? `r/${chatDetails.community?.name}` : 'Active now'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src={msg.sender?.avatar_url} />
                      <AvatarFallback>{msg.sender?.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <div
                      className={`p-3 rounded-2xl ${isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-muted text-foreground rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.media_urls && msg.media_urls.length > 0 && (
                      <MessageMedia urls={msg.media_urls} mediaType={msg.media_type} />
                    )}
                    <div className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'text-right' : ''}`}>
                      {msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : 'Sending...'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-sidebar-background relative">
        <TypingIndicator typingUsers={typingUsers} className="absolute bottom-full left-0 mb-1" />
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/30 rounded-lg">
            {pendingFiles.map((pf, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded border bg-background flex items-center justify-center overflow-hidden">
                {pf.preview ? (
                  <img src={pf.preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] truncate px-1">{pf.file.name}</span>
                )}
                <button
                  type="button"
                  onClick={() => removePendingFile(idx)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,.gif"
            onChange={handleFileSelect}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="w-4 h-4" />
          </Button>
          <EmojiPicker onSelect={(emoji) => setNewMessage(prev => prev + emoji)} />
          <Input
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); broadcastTyping(); }}
            placeholder="Type a message..."
            className="flex-1 border-sidebar-border bg-sidebar"
          />
          <Button type="submit" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the conversation and all messages. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
