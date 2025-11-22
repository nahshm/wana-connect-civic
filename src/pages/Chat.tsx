import React, { useState } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { UserSearch } from '@/components/chat/UserSearch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Chat() {
    const [activeTab, setActiveTab] = useState<'direct' | 'group' | 'mod_mail' | 'unread'>('direct');
    const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
    const [selectedChatType, setSelectedChatType] = useState<'direct' | 'group' | 'mod_mail'>('direct');
    const [isNewChat, setIsNewChat] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleSelectChat = (chatId: string, type: 'direct' | 'group' | 'mod_mail') => {
        setSelectedChatId(chatId);
        setSelectedChatType(type);
        setIsNewChat(false);
    };

    const handleNewChat = () => {
        setIsNewChat(true);
        setSelectedChatId(undefined);
    };

    const handleStartChat = async (userId: string) => {
        if (!user) return;

        try {
            // Check if chat already exists
            // This is a simplified check. In reality, we'd query chat_participants to find a common room of type 'direct'
            // For now, we'll just create a new one or return existing if we can find it easily.
            // Since we don't have a complex RPC for "find common room", we will just create a new room for this demo
            // OR we can try to find it.

            // Let's create a new room for simplicity in this iteration
            const { data: room, error: roomError } = await supabase
                .from('chat_rooms')
                .insert({
                    type: 'direct',
                    created_by: user.id
                })
                .select()
                .single();

            if (roomError) throw roomError;

            // Add participants
            const { error: participantsError } = await supabase
                .from('chat_participants')
                .insert([
                    { room_id: room.id, user_id: user.id },
                    { room_id: room.id, user_id: userId }
                ]);

            if (participantsError) throw participantsError;

            setSelectedChatId(room.id);
            setSelectedChatType('direct');
            setIsNewChat(false);

        } catch (error) {
            console.error('Error starting chat:', error);
            toast({
                title: "Error",
                description: "Failed to start chat.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background relative">
            <div className={`${selectedChatId || isNewChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r`}>
                <ChatSidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onSelectChat={handleSelectChat}
                    selectedChatId={selectedChatId}
                    onNewChat={handleNewChat}
                />
            </div>

            <div className={`${!selectedChatId && !isNewChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col w-full`}>
                {(selectedChatId || isNewChat) && (
                    <div className="md:hidden flex items-center p-2 border-b">
                        <button
                            onClick={() => {
                                setSelectedChatId(undefined);
                                setIsNewChat(false);
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center"
                        >
                            ← Back to chats
                        </button>
                    </div>
                )}

                {isNewChat ? (
                    <div className="flex-1 flex flex-col">
                        <div className="h-16 border-b flex items-center px-6 font-bold text-lg">
                            New Chat
                        </div>
                        <UserSearch onStartChat={handleStartChat} />
                    </div>
                ) : selectedChatId ? (
                    <ChatWindow chatId={selectedChatId} type={selectedChatType} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
                        <div className="p-4 bg-sidebar-accent rounded-full">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <p>Select a conversation or start a new one</p>
                    </div>
                )}
            </div>
        </div>
    );
}
