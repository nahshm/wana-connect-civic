import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    sender?: {
        username: string;
        avatar_url?: string;
    };
}

interface ChannelChatWindowProps {
    channelId: string; // The UUID from the DB
    channelName: string;
    isReadOnly?: boolean;
}

export function ChannelChatWindow({ channelId, channelName, isReadOnly = false }: ChannelChatWindowProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

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
                    // Fetch sender details for the new message
                    const { data: senderData } = await supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg: Message = {
                        id: payload.new.id,
                        content: payload.new.content,
                        created_at: payload.new.created_at,
                        sender_id: payload.new.sender_id,
                        sender: senderData || { username: 'Unknown' }
                    };

                    setMessages((prev) => [...prev, newMsg]);
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelId]);

    const fetchMessages = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                sender:profiles(username, avatar_url)
            `)
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true }) // Oldest first for chat history
            .limit(50);

        if (error) {
            console.error('Error fetching messages:', error);
        } else {
            // Transform to match interface if needed
            setMessages(data as any[] || []);
            scrollToBottom();
        }
        setIsLoading(false);
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const content = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        const { error } = await supabase
            .from('chat_messages')
            .insert({
                channel_id: channelId,
                sender_id: user.id,
                content: content
            });

        if (error) {
            toast.error('Failed to send message');
            setNewMessage(content); // Restore on failure
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] bg-background">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur">
                <h3 className="font-semibold flex items-center gap-2">
                    # {channelName}
                    {isReadOnly && <Lock className="w-3 h-3 text-muted-foreground" />}
                </h3>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                    <div className="text-center text-muted-foreground py-10">Loading chat...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                        <p>Welcome to #{channelName}!</p>
                        <p className="text-sm">Be the first to say hello.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === user?.id;
                            return (
                                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={msg.sender?.avatar_url} />
                                        <AvatarFallback>{msg.sender?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                {msg.sender?.username}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`px-3 py-2 rounded-lg text-sm ${isMe
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-muted rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-card">
                {isReadOnly ? (
                    <div className="flex items-center justify-center p-3 bg-muted/50 rounded-lg text-muted-foreground text-sm">
                        <Lock className="w-4 h-4 mr-2" />
                        This channel is read-only.
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            placeholder={`Message #${channelName}`}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
