import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ChatSidebarProps {
  activeTab: 'direct' | 'group' | 'mod_mail' | 'unread';
  onTabChange: (tab: 'direct' | 'group' | 'mod_mail' | 'unread') => void;
  onSelectChat: (chatId: string, type: 'direct' | 'group' | 'mod_mail') => void;
  selectedChatId?: string;
  onNewChat: () => void;
  onCreateGroup?: (name: string, memberIds: string[]) => void;
}

interface ChatItem {
  id: string;
  name: string | null;
  type: string;
  updated_at: string | null;
  otherUser?: { id: string; username: string | null; avatar_url: string | null; display_name: string | null };
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unread?: boolean;
  subject?: string;
  community?: { name: string; avatar_url?: string | null };
  status?: string;
}

export const ChatSidebar = ({
  activeTab,
  onTabChange,
  onSelectChat,
  selectedChatId,
  onNewChat,
  onCreateGroup,
}: ChatSidebarProps) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);

  const fetchChats = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (activeTab === 'mod_mail') {
        const { data: threads } = await supabase
          .from('mod_mail_threads')
          .select('*, community:communities(name, avatar_url)')
          .order('updated_at', { ascending: false });

        setChats(
          (threads || []).map((t: any) => ({
            id: t.id,
            name: t.subject,
            type: 'mod_mail',
            updated_at: t.updated_at,
            subject: t.subject,
            community: t.community,
            status: t.status,
          }))
        );
      } else {
        // Fetch rooms the user is in
        const { data: myParticipations } = await supabase
          .from('chat_participants')
          .select('room_id, last_read_at')
          .eq('user_id', user.id);

        if (!myParticipations?.length) {
          setChats([]);
          setLoading(false);
          return;
        }

        const roomIds = myParticipations.map(p => p.room_id);
        const lastReadMap = Object.fromEntries(myParticipations.map(p => [p.room_id, p.last_read_at]));

        // Fetch rooms
        const typeFilter = activeTab === 'unread' ? undefined : activeTab;
        let query = supabase
          .from('chat_rooms')
          .select('*')
          .in('id', roomIds)
          .order('updated_at', { ascending: false });

        if (typeFilter) query = query.eq('type', typeFilter);

        const { data: rooms } = await query;
        if (!rooms?.length) {
          setChats([]);
          setLoading(false);
          return;
        }

        // For direct chats, fetch other participants' profiles
        const directRoomIds = rooms.filter(r => r.type === 'direct').map(r => r.id);
        let otherUsersMap: Record<string, any> = {};

        if (directRoomIds.length > 0) {
          const { data: allParticipants } = await supabase
            .from('chat_participants')
            .select('room_id, user_id')
            .in('room_id', directRoomIds)
            .neq('user_id', user.id);

          if (allParticipants?.length) {
            const otherUserIds = [...new Set(allParticipants.map(p => p.user_id))];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, username, avatar_url, display_name')
              .in('id', otherUserIds);

            const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
            allParticipants.forEach(p => {
              if (profileMap[p.user_id]) {
                otherUsersMap[p.room_id] = profileMap[p.user_id];
              }
            });
          }
        }

        // Fetch last message per room
        const { data: lastMessages } = await supabase
          .from('chat_messages')
          .select('room_id, content, created_at')
          .in('room_id', roomIds)
          .order('created_at', { ascending: false });

        const lastMsgMap: Record<string, { content: string; created_at: string }> = {};
        (lastMessages || []).forEach(m => {
          if (!lastMsgMap[m.room_id!]) {
            lastMsgMap[m.room_id!] = { content: m.content, created_at: m.created_at! };
          }
        });

        const chatItems: ChatItem[] = rooms.map(room => {
          const lastMsg = lastMsgMap[room.id];
          const lastRead = lastReadMap[room.id];
          const unread = lastMsg && lastRead ? new Date(lastMsg.created_at) > new Date(lastRead) : !!lastMsg && !lastRead;

          return {
            id: room.id,
            name: room.type === 'direct'
              ? otherUsersMap[room.id]?.display_name || otherUsersMap[room.id]?.username || 'Unknown'
              : room.name,
            type: room.type,
            updated_at: room.updated_at,
            otherUser: otherUsersMap[room.id] || undefined,
            lastMessage: lastMsg?.content || null,
            lastMessageAt: lastMsg?.created_at || room.updated_at,
            unread,
          };
        });

        // Filter unread tab
        if (activeTab === 'unread') {
          setChats(chatItems.filter(c => c.unread));
        } else {
          setChats(chatItems);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, activeTab]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Group search
  const handleGroupSearch = async (q: string) => {
    setGroupSearch(q);
    if (!q.trim() || !user) {
      setGroupSearchResults([]);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, display_name')
      .ilike('username', `%${q}%`)
      .neq('id', user.id)
      .limit(10);
    setGroupSearchResults(data || []);
  };

  const toggleMember = (profile: any) => {
    setSelectedMembers(prev =>
      prev.find(m => m.id === profile.id)
        ? prev.filter(m => m.id !== profile.id)
        : [...prev, profile]
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedMembers.length === 0 || !onCreateGroup) return;
    onCreateGroup(groupName.trim(), selectedMembers.map(m => m.id));
    setGroupDialogOpen(false);
    setGroupName('');
    setSelectedMembers([]);
    setGroupSearch('');
  };

  const filteredChats = searchQuery
    ? chats.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  return (
    <div className="w-full border-r bg-sidebar-background flex flex-col h-full">
      <div className="p-3 border-b flex gap-2">
        <Button onClick={onNewChat} className="flex-1 justify-start gap-2" variant="outline" size="sm">
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
        {onCreateGroup && (
          <Button onClick={() => setGroupDialogOpen(true)} variant="outline" size="sm" className="gap-2">
            <Users className="w-4 h-4" />
            Group
          </Button>
        )}
      </div>

      <div className="flex p-2 gap-1 overflow-x-auto no-scrollbar border-b">
        {(['direct', 'group', 'mod_mail', 'unread'] as const).map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onTabChange(tab)}
            className="flex-1 text-xs capitalize"
          >
            {tab === 'mod_mail' ? 'Mod Mail' : tab}
          </Button>
        ))}
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-8 h-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 px-2 pb-2">
          {loading ? (
            <div className="text-center p-4 text-muted-foreground text-sm">Loading...</div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              {activeTab === 'unread' ? 'All caught up!' : 'No chats found.'}
            </div>
          ) : (
            filteredChats.map(chat => (
              <button
                key={chat.id}
                onClick={() =>
                  onSelectChat(chat.id, activeTab === 'mod_mail' ? 'mod_mail' : (chat.type as 'direct' | 'group'))
                }
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                  selectedChatId === chat.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50'
                )}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  {chat.otherUser?.avatar_url ? (
                    <img src={chat.otherUser.avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
                  ) : chat.community?.avatar_url ? (
                    <img src={chat.community.avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {(chat.name || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-sm truncate', chat.unread && 'font-bold')}>
                      {activeTab === 'mod_mail'
                        ? `${chat.community?.name}: ${chat.subject}`
                        : chat.name || 'Chat'}
                    </span>
                    {chat.lastMessageAt && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                        {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs truncate', chat.unread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                      {activeTab === 'mod_mail'
                        ? chat.status
                        : chat.lastMessage
                          ? chat.lastMessage.slice(0, 50)
                          : 'No messages yet'}
                    </span>
                    {chat.unread && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Group Creation Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group Chat</DialogTitle>
            <DialogDescription>Add a name and invite members to your group.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Group name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedMembers.map(m => (
                  <Badge key={m.id} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleMember(m)}>
                    {m.display_name || m.username} ✕
                  </Badge>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users to add..."
                className="pl-8"
                value={groupSearch}
                onChange={e => handleGroupSearch(e.target.value)}
              />
            </div>

            {groupSearchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {groupSearchResults.map(profile => {
                  const selected = selectedMembers.find(m => m.id === profile.id);
                  return (
                    <button
                      key={profile.id}
                      onClick={() => toggleMember(profile)}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 rounded-md text-sm text-left transition-colors',
                        selected ? 'bg-primary/10' : 'hover:bg-muted'
                      )}
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-xs">{profile.username?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{profile.display_name || profile.username}</span>
                      {selected && <span className="ml-auto text-primary text-xs">Added</span>}
                    </button>
                  );
                })}
              </div>
            )}

            <Button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedMembers.length === 0}
              className="w-full"
            >
              Create Group ({selectedMembers.length} members)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
