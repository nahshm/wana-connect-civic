import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Send,
    Lock,
    Hash,
    Search,
    Pin,
    Users,
    Bell,
    Settings,
    Plus,
    Smile,
    Image as ImageIcon,
    Paperclip,
    Reply,
    Copy,
    Flag,
    MoreHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

// Quick reaction emojis
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '✅'];

interface Message {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    reply_to_id?: string | null;
    sender?: {
        id: string;
        username: string;
        display_name?: string;
        avatar_url?: string;
        role?: string;
    };
    reactions?: { [emoji: string]: string[] };
}

interface ChannelChatWindowProps {
    channelId: string;
    channelName: string;
    channelDescription?: string;
    channelEmoji?: string;
    isReadOnly?: boolean;
}

export function ChannelChatWindow({
    channelId,
    channelName,
    channelDescription,
    channelEmoji,
    isReadOnly = false
}: ChannelChatWindowProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null);
    const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!channelId) return;

        fetchMessages();

        // Realtime Subscription
        const channel = supabase
            .channel(`channel:${channelId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `channel_id=eq.${channelId}`
                },
                async (payload) => {
                    const { data: senderData } = await supabase
                        .from('profiles')
                        .select('id, username, display_name, avatar_url, role')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg: Message = {
                        id: payload.new.id,
                        content: payload.new.content,
                        created_at: payload.new.created_at,
                        sender_id: payload.new.sender_id,
                        reply_to_id: payload.new.reply_to_id,
                        sender: senderData || { id: payload.new.sender_id, username: 'Unknown' },
                        reactions: {}
                    };

                    setMessages((prev) => [...prev, newMsg]);

                    if (isNearBottom()) {
                        scrollToBottom();
                    } else {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `channel_id=eq.${channelId}`
                },
                (payload) => {
                    setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelId]);

    const isNearBottom = () => {
        const container = document.querySelector('[data-radix-scroll-area-viewport]');
        if (!container) return true;
        const { scrollTop, scrollHeight, clientHeight } = container;
        return scrollHeight - scrollTop - clientHeight < 100;
    };

    const fetchMessages = async () => {
        setIsLoading(true);

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
            .from('chat_messages')
            .select(`
                *,
                reply_to_id,
                sender:profiles!sender_id(id, username, display_name, avatar_url, role)
            `)
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true })
            .limit(100);

        if (messagesError) {
            console.error('Error fetching messages:', messagesError);
            toast.error('Failed to load messages');
            setIsLoading(false);
            return;
        }

        // Fetch reactions for these messages
        // Note: reactions feature disabled until types are regenerated
        const messagesWithReactions = (messagesData || []).map(msg => ({
            ...(msg as any),
            reactions: {}
        }));
        setMessages(messagesWithReactions as Message[]);
        setTimeout(scrollToBottom, 100);
        setIsLoading(false);
    };

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const content = newMessage.trim();
        const replyId = replyingTo?.id || null;

        // Create optimistic message with temp ID
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            content,
            created_at: new Date().toISOString(),
            sender_id: user.id,
            reply_to_id: replyId,
            sender: {
                id: user.id,
                username: user.email?.split('@')[0] || 'You',
                display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
                avatar_url: user.user_metadata?.avatar_url
            },
            reactions: {}
        };

        // Optimistically add to UI immediately
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setReplyingTo(null);

        // Scroll to bottom
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        // Send to server (real-time subscription will update with actual message)
        const { error } = await supabase
            .from('chat_messages')
            .insert({
                channel_id: channelId,
                sender_id: user.id,
                content: content,
                reply_to_id: replyId
            });

        if (error) {
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error('Failed to send message');
            setNewMessage(content);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        // Optimistically remove immediately
        const deletedMessage = messages.find(m => m.id === messageId);
        setMessages(prev => prev.filter(m => m.id !== messageId));

        const { error } = await supabase
            .from('chat_messages')
            .delete()
            .eq('id', messageId);

        if (error) {
            // Restore message on error
            if (deletedMessage) {
                setMessages(prev => [...prev, deletedMessage].sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ));
            }
            toast.error('Failed to delete message');
        } else {
            toast.success('Message deleted');
        }
    };

    const handleCopyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success('Message copied');
    };

    const handleReply = (msg: Message) => {
        setReplyingTo(msg);
        inputRef.current?.focus();
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        if (!user) return;

        // Check if user already reacted with this emoji
        const currentMessage = messages.find(m => m.id === messageId);
        const hasReacted = currentMessage?.reactions?.[emoji]?.includes(user.id);

        // Optimistic update
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const reactions = { ...msg.reactions };
                if (!reactions[emoji]) {
                    reactions[emoji] = [];
                }
                if (hasReacted) {
                    reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
                    if (reactions[emoji].length === 0) {
                        delete reactions[emoji];
                    }
                } else {
                    reactions[emoji] = [...reactions[emoji], user.id];
                }
                return { ...msg, reactions };
            }
            return msg;
        }));
        setEmojiPickerOpen(null);

        // Note: Database persistence disabled until types are regenerated
        // Reactions are optimistic-only for now
        console.log('Reaction toggled (local only):', { messageId, emoji, hasReacted });
    };

    const formatMessageDate = (date: Date) => {
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMMM d, yyyy');
    };

    const getRoleBadge = (role?: string) => {
        if (!role) return null;
        const badges: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
            admin: { label: 'ADMIN', variant: 'destructive' },
            moderator: { label: 'MOD', variant: 'default' },
            official: { label: 'OFFICIAL', variant: 'secondary' },
            super_admin: { label: 'SUPER', variant: 'destructive' },
        };
        return badges[role];
    };

    const getRoleColor = (role?: string) => {
        const colors: { [key: string]: string } = {
            admin: 'text-red-500 dark:text-red-400',
            moderator: 'text-blue-500 dark:text-blue-400',
            official: 'text-green-500 dark:text-green-400',
            super_admin: 'text-purple-500 dark:text-purple-400',
        };
        return colors[role || ''] || 'text-foreground';
    };

    // Group messages by date and thread
    // Separate parent messages (no reply_to_id) from replies
    const parentMessages = messages.filter(m => !m.reply_to_id);
    const repliesMap: { [parentId: string]: Message[] } = {};

    messages.forEach(msg => {
        if (msg.reply_to_id) {
            if (!repliesMap[msg.reply_to_id]) {
                repliesMap[msg.reply_to_id] = [];
            }
            repliesMap[msg.reply_to_id].push(msg);
        }
    });

    // Group parent messages by date
    const groupedMessages: { date: Date; messages: Message[] }[] = [];
    parentMessages.forEach((msg) => {
        const msgDate = new Date(msg.created_at);
        const lastGroup = groupedMessages[groupedMessages.length - 1];
        if (!lastGroup || !isSameDay(lastGroup.date, msgDate)) {
            groupedMessages.push({ date: msgDate, messages: [msg] });
        } else {
            lastGroup.messages.push(msg);
        }
    });

    // Toggle thread expansion
    const toggleThread = (messageId: string) => {
        setExpandedThreads(prev => {
            const next = new Set(prev);
            if (next.has(messageId)) {
                next.delete(messageId);
            } else {
                next.add(messageId);
            }
            return next;
        });
    };

    // Get visible replies for a message
    const getVisibleReplies = (messageId: string) => {
        const replies = repliesMap[messageId] || [];
        const isExpanded = expandedThreads.has(messageId);
        return isExpanded ? replies : replies.slice(0, 1);
    };

    const getHiddenReplyCount = (messageId: string) => {
        const replies = repliesMap[messageId] || [];
        return Math.max(0, replies.length - 1);
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full bg-background">
                {/* Header - Theme Aware */}
                <div className="px-4 py-3 border-b flex items-center justify-between bg-card/50 backdrop-blur shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-2">
                            {channelEmoji ? (
                                <span className="text-xl">{channelEmoji}</span>
                            ) : (
                                <Hash className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className="font-semibold">{channelName}</span>
                            {isReadOnly && <Lock className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        {channelDescription && (
                            <>
                                <div className="w-px h-4 bg-border" />
                                <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                                    {channelDescription}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Pin className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Pinned Messages</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Users className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Member List</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Search</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Unread Messages Banner */}
                {unreadCount > 0 && (
                    <div className="bg-primary text-primary-foreground px-4 py-1.5 flex items-center justify-between text-sm font-medium">
                        <span>{unreadCount}+ new messages</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary-foreground hover:bg-primary-foreground/10 h-6"
                            onClick={() => {
                                scrollToBottom();
                                setUnreadCount(0);
                            }}
                        >
                            Mark As Read 🔔
                        </Button>
                    </div>
                )}

                {/* Messages Area */}
                <ScrollArea className="flex-1 px-4">
                    {isLoading ? (
                        <div className="text-center text-muted-foreground py-10">
                            Loading messages...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Hash className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">
                                Welcome to #{channelName}!
                            </h2>
                            <p className="text-muted-foreground">
                                This is the start of the #{channelName} channel.
                            </p>
                        </div>
                    ) : (
                        <div className="py-4">
                            {groupedMessages.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                    {/* Date Separator */}
                                    <div className="flex items-center gap-4 my-4">
                                        <div className="flex-1 h-px bg-border" />
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {formatMessageDate(group.date)}
                                        </span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>

                                    {/* Messages */}
                                    {group.messages.map((msg) => {
                                        const isMe = msg.sender_id === user?.id;
                                        const roleBadge = getRoleBadge(msg.sender?.role);
                                        const isHovered = hoveredMessageId === msg.id;

                                        return (
                                            <div key={msg.id}>
                                                <ContextMenu>
                                                    <ContextMenuTrigger>
                                                        <div
                                                            className={cn(
                                                                'group relative flex gap-4 py-1.5 px-2 -mx-2 rounded-md transition-colors',
                                                                isHovered && 'bg-accent/50'
                                                            )}
                                                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                                                            onMouseLeave={() => setHoveredMessageId(null)}
                                                        >
                                                            {/* Avatar */}
                                                            <Avatar className="w-10 h-10 flex-shrink-0 mt-0.5">
                                                                <AvatarImage src={msg.sender?.avatar_url || undefined} />
                                                                <AvatarFallback>
                                                                    {(msg.sender?.display_name || msg.sender?.username)?.[0]?.toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>

                                                            {/* Message Content */}
                                                            <div className="flex-1 min-w-0">
                                                                {/* Header */}
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className={cn(
                                                                        'font-medium hover:underline cursor-pointer',
                                                                        getRoleColor(msg.sender?.role)
                                                                    )}>
                                                                        {msg.sender?.display_name || msg.sender?.username}
                                                                    </span>
                                                                    {roleBadge && (
                                                                        <Badge variant={roleBadge.variant} className="text-[10px] px-1.5 py-0 h-4">
                                                                            {roleBadge.label}
                                                                        </Badge>
                                                                    )}
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {format(new Date(msg.created_at), 'HH:mm')}
                                                                    </span>
                                                                </div>

                                                                {/* Content */}
                                                                <p className="text-foreground leading-relaxed break-words whitespace-pre-wrap">
                                                                    {msg.content}
                                                                </p>

                                                                {/* Reactions */}
                                                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                                                                            users.length > 0 && (
                                                                                <Button
                                                                                    key={emoji}
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className={cn(
                                                                                        'h-6 px-2 text-xs rounded-full',
                                                                                        users.includes(user?.id || '') && 'bg-primary/20 border-primary'
                                                                                    )}
                                                                                    onClick={() => handleReaction(msg.id, emoji)}
                                                                                >
                                                                                    {emoji} {users.length}
                                                                                </Button>
                                                                            )
                                                                        ))}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100"
                                                                            onClick={() => setEmojiPickerOpen(msg.id)}
                                                                        >
                                                                            <Plus className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Hover Actions Toolbar */}
                                                            {isHovered && (
                                                                <div className="absolute -top-3 right-2 flex items-center bg-background rounded-md border shadow-lg">
                                                                    <Popover open={emojiPickerOpen === msg.id} onOpenChange={(open) => setEmojiPickerOpen(open ? msg.id : null)}>
                                                                        <PopoverTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                <Smile className="h-4 w-4" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-auto p-2" align="end">
                                                                            <div className="flex gap-1 flex-wrap max-w-[200px]">
                                                                                {QUICK_REACTIONS.map(emoji => (
                                                                                    <Button
                                                                                        key={emoji}
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-8 w-8 p-0 text-lg"
                                                                                        onClick={() => handleReaction(msg.id, emoji)}
                                                                                    >
                                                                                        {emoji}
                                                                                    </Button>
                                                                                ))}
                                                                            </div>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0"
                                                                                onClick={() => handleReply(msg)}
                                                                            >
                                                                                <Reply className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Reply</TooltipContent>
                                                                    </Tooltip>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0"
                                                                                onClick={() => handleCopyMessage(msg.content)}
                                                                            >
                                                                                <Copy className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Copy</TooltipContent>
                                                                    </Tooltip>
                                                                    {isMe && (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Delete</TooltipContent>
                                                                        </Tooltip>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ContextMenuTrigger>
                                                    <ContextMenuContent className="w-48">
                                                        <ContextMenuItem onClick={() => handleReply(msg)}>
                                                            <Reply className="h-4 w-4 mr-2" />
                                                            Reply
                                                        </ContextMenuItem>
                                                        <ContextMenuItem onClick={() => handleCopyMessage(msg.content)}>
                                                            <Copy className="h-4 w-4 mr-2" />
                                                            Copy Text
                                                        </ContextMenuItem>
                                                        <ContextMenuSeparator />
                                                        <ContextMenuItem className="text-destructive focus:text-destructive">
                                                            <Flag className="h-4 w-4 mr-2" />
                                                            Report Message
                                                        </ContextMenuItem>
                                                        {isMe && (
                                                            <ContextMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => handleDeleteMessage(msg.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete Message
                                                            </ContextMenuItem>
                                                        )}
                                                    </ContextMenuContent>
                                                </ContextMenu>

                                                {/* Threaded Replies */}
                                                {repliesMap[msg.id] && repliesMap[msg.id].length > 0 && (
                                                    <div className="ml-10 mt-1">
                                                        {getVisibleReplies(msg.id).map((reply) => {
                                                            const replyIsMe = reply.sender_id === user?.id;
                                                            const replyHovered = hoveredMessageId === reply.id;

                                                            return (
                                                                <div
                                                                    key={reply.id}
                                                                    className="relative"
                                                                    onMouseEnter={() => setHoveredMessageId(reply.id)}
                                                                    onMouseLeave={() => setHoveredMessageId(null)}
                                                                >
                                                                    {/* Curved connector line */}
                                                                    <div className="absolute -left-6 top-0 flex items-start">
                                                                        <div className="w-6 h-6 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
                                                                    </div>

                                                                    <div className={cn(
                                                                        "flex gap-3 py-1.5 px-2 -mx-2 rounded-md transition-colors",
                                                                        replyHovered && "bg-accent/50"
                                                                    )}>
                                                                        <Avatar className="w-7 h-7 flex-shrink-0">
                                                                            <AvatarImage src={reply.sender?.avatar_url || undefined} />
                                                                            <AvatarFallback className="text-xs">
                                                                                {(reply.sender?.display_name || reply.sender?.username)?.[0]?.toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                                <Reply className="h-3 w-3 text-muted-foreground" />
                                                                                <span className={cn("font-medium", getRoleColor(reply.sender?.role))}>
                                                                                    {reply.sender?.display_name || reply.sender?.username}
                                                                                </span>
                                                                                <span className="text-muted-foreground">
                                                                                    {format(new Date(reply.created_at), 'HH:mm')}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>

                                                                            {/* Reply reactions */}
                                                                            {reply.reactions && Object.keys(reply.reactions).length > 0 && (
                                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                                    {Object.entries(reply.reactions).map(([emoji, users]) => (
                                                                                        users.length > 0 && (
                                                                                            <Button
                                                                                                key={emoji}
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                className={cn(
                                                                                                    "h-5 px-1.5 text-[10px] rounded-full",
                                                                                                    users.includes(user?.id || '') && "bg-primary/20 border-primary"
                                                                                                )}
                                                                                                onClick={() => handleReaction(reply.id, emoji)}
                                                                                            >
                                                                                                {emoji} {users.length}
                                                                                            </Button>
                                                                                        )
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Reply actions */}
                                                                        {replyHovered && (
                                                                            <div className="flex items-center gap-0.5">
                                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleReply(reply)}>
                                                                                    <Reply className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleCopyMessage(reply.content)}>
                                                                                    <Copy className="h-3 w-3" />
                                                                                </Button>
                                                                                {replyIsMe && (
                                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteMessage(reply.id)}>
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Show more replies button */}
                                                        {getHiddenReplyCount(msg.id) > 0 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-xs text-primary ml-1 mt-1"
                                                                onClick={() => toggleThread(msg.id)}
                                                            >
                                                                {expandedThreads.has(msg.id)
                                                                    ? "Collapse replies"
                                                                    : `Show ${getHiddenReplyCount(msg.id)} more ${getHiddenReplyCount(msg.id) === 1 ? 'reply' : 'replies'}`
                                                                }
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    )}
                </ScrollArea>

                {/* Reply Preview */}
                {replyingTo && (
                    <div className="px-4 py-2 border-t bg-muted/50 flex items-center gap-3">
                        <Reply className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground">Replying to </span>
                            <span className="text-xs font-medium">{replyingTo.sender?.display_name || replyingTo.sender?.username}</span>
                            <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Input Bar */}
                <div className="p-4 border-t bg-card/50">
                    {isReadOnly ? (
                        <div className="flex items-center justify-center py-3 bg-muted rounded-lg text-muted-foreground text-sm">
                            <Lock className="w-4 h-4 mr-2" />
                            You do not have permission to send messages in this channel.
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="relative">
                            <div className="flex items-center bg-background border rounded-lg">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-11 w-11"
                                >
                                    <Plus className="h-5 w-5" />
                                </Button>
                                <Input
                                    ref={inputRef}
                                    placeholder={replyingTo ? 'Type your reply...' : `Message #${channelName}`}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-11"
                                />
                                <div className="flex items-center gap-1 pr-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
                                                <Paperclip className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Attach File</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
                                                <ImageIcon className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Upload Image</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
                                                <Smile className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Emoji</TooltipContent>
                                    </Tooltip>
                                    {newMessage.trim() && (
                                        <Button type="submit" size="icon" className="h-9 w-9">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}