import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, UserPlus, MessageSquare, AlertTriangle, ThumbsUp, Flag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  new_follower: UserPlus,
  post_comment: MessageSquare,
  post_vote: ThumbsUp,
  civic_reference: Flag,
  user_warning: AlertTriangle,
  accountability_alert: AlertTriangle,
  chat_message: MessageSquare,
};

export const NotificationDropdown = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('comment_notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comment_notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev].slice(0, 30));
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comment_notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotif = payload.new as Notification;

          setNotifications(prev => prev.map(notif =>
            notif.id === updatedNotif.id ? updatedNotif : notif
          ));
          setUnreadCount(prev => {
            const existing = notifications.find(notif => notif.id === updatedNotif.id);
            if (!existing) return prev;
            if (!!existing.is_read === !!updatedNotif.is_read) return prev;
            return updatedNotif.is_read ? Math.max(0, prev - 1) : prev + 1;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, notifications]);

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase
      .from('comment_notifications')
      .update({ is_read: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.is_read) {
      await supabase
        .from('comment_notifications')
        .update({ is_read: true })
        .eq('id', notif.id);

      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Navigate if action URL exists
    if (notif.action_url) {
      setOpen(false);
      if (notif.notification_type === 'chat_message') {
        navigate('/chat');
      } else {
        navigate(notif.action_url);
      }
    }
  };

  const IconComponent = (type: string) => ICON_MAP[type] || Bell;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors h-8 w-8 sm:h-9 sm:w-9"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] flex items-center justify-center rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notif => {
                const Icon = IconComponent(notif.notification_type);
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                      !notif.is_read && 'bg-primary/5'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 p-1.5 rounded-full flex-shrink-0',
                      !notif.is_read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {notif.title ? (
                        <p className="text-xs font-medium text-foreground/80 mb-1 truncate">{notif.title}</p>
                      ) : null}
                      <p className={cn(
                        'text-sm leading-tight',
                        !notif.is_read && 'font-medium'
                      )}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
