import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MoreVertical, Trash2 } from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
          setMessages((prev) => [...prev, newMsg]);
          // Mark as read when receiving messages while chat is open
          void markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, type, user, onReadStateChange]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      if (type === 'mod_mail') {
        await supabase.from('mod_mail_messages').insert({
          thread_id: chatId,
          sender_id: user.id,
          content: newMessage,
          is_internal: false
        });
      } else {
        await supabase.from('chat_messages').insert({
          room_id: chatId,
          sender_id: user.id,
          content: newMessage
        });
        // Update last_read_at after sending
        await markAsRead();
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
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
      <div className="p-4 border-t bg-sidebar-background">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
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
