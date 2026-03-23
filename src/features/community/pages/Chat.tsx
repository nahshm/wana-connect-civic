import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSelectChat = (chatId: string, type: 'direct' | 'group' | 'mod_mail') => {
    setSelectedChatId(chatId);
    setSelectedChatType(type);
    setIsNewChat(false);
    setRefreshKey(k => k + 1);
  };

  const handleNewChat = () => {
    setIsNewChat(true);
    setSelectedChatId(undefined);
  };

  const handleStartChat = async (userId: string) => {
    if (!user) return;

    try {
      // Use the new RLS policy that allows seeing all participants in your rooms
      const { data: myParticipations } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

      if (myParticipations?.length) {
        const myRoomIds = myParticipations.map(p => p.room_id);

        // Now we can see other participants in our rooms
        const { data: sharedParticipations } = await supabase
          .from('chat_participants')
          .select('room_id')
          .eq('user_id', userId)
          .in('room_id', myRoomIds);

        if (sharedParticipations?.length) {
          // Check which shared rooms are direct type
          const sharedRoomIds = sharedParticipations.map(p => p.room_id);
          const { data: directRooms } = await supabase
            .from('chat_rooms')
            .select('id')
            .in('id', sharedRoomIds)
            .eq('type', 'direct')
            .limit(1);

          if (directRooms?.[0]) {
            setSelectedChatId(directRooms[0].id);
            setSelectedChatType('direct');
            setActiveTab('direct');
            setIsNewChat(false);
            setRefreshKey(k => k + 1);
            return;
          }
        }
      }

      // No existing room — create a new direct room
      const roomId = uuidv4();
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .insert({ id: roomId, type: 'direct', created_by: user.id });

      if (roomError) throw roomError;

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { room_id: roomId, user_id: user.id },
          { room_id: roomId, user_id: userId },
        ]);

      if (participantsError) throw participantsError;

      setSelectedChatId(roomId);
      setSelectedChatType('direct');
      setActiveTab('direct');
      setIsNewChat(false);
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start chat.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    if (!user) return;

    try {
      const roomId = uuidv4();
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .insert({ id: roomId, type: 'group', name, created_by: user.id });

      if (roomError) throw roomError;

      const participants = [user.id, ...memberIds].map(uid => ({
        room_id: roomId,
        user_id: uid,
      }));

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      setSelectedChatId(roomId);
      setSelectedChatType('group');
      setIsNewChat(false);
      setActiveTab('group');
      setRefreshKey(k => k + 1);

      toast({ title: 'Group created', description: `${name} is ready to chat.` });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group chat.',
        variant: 'destructive',
      });
    }
  };

  const handleChatDeleted = () => {
    setSelectedChatId(undefined);
    setRefreshKey(k => k + 1);
  };

  const handleChatReadStateChange = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background relative">
      <div
        className={`${
          selectedChatId || isNewChat ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 flex-col border-r`}
      >
        <ChatSidebar
          key={refreshKey}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSelectChat={handleSelectChat}
          selectedChatId={selectedChatId}
          onNewChat={handleNewChat}
          onCreateGroup={handleCreateGroup}
        />
      </div>

      <div
        className={`${
          !selectedChatId && !isNewChat ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col w-full`}
      >
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
          <ChatWindow
            chatId={selectedChatId}
            type={selectedChatType}
            onChatDeleted={handleChatDeleted}
            onReadStateChange={handleChatReadStateChange}
          />
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
