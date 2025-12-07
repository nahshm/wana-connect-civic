import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Video, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { CreateEventDialog } from './CreateEventDialog';
import { useAuth } from '@/contexts/AuthContext';

interface CommunityEventsWidgetProps {
    communityId: string;
    isAdmin: boolean;
}

export const CommunityEventsWidget: React.FC<CommunityEventsWidgetProps> = ({ communityId, isAdmin }) => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [createEventOpen, setCreateEventOpen] = useState(false);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('community_events')
                .select('*')
                .eq('community_id', communityId)
                .gte('start_time', new Date().toISOString()) // Only future events
                .order('start_time', { ascending: true })
                .limit(3);

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [communityId]);

    if (loading) {
        return (
            <Card className="bg-sidebar-background border-sidebar-border">
                <CardContent className="pt-4">
                    <div className="h-20 bg-sidebar-accent/50 animate-pulse rounded"></div>
                </CardContent>
            </Card>
        );
    }

    // If no events and not admin, don't show anything (or show empty state?)
    // Let's show empty state to encourage activity if admin, or just hide if user?
    // Decisions: Show "No upcoming events" to everyone.

    return (
        <>
            <Card className="bg-sidebar-background border-sidebar-border">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase text-sidebar-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Upcoming Events
                    </CardTitle>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setCreateEventOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="pt-0">
                    {events.length === 0 ? (
                        <div className="text-sm text-sidebar-muted-foreground text-center py-4">
                            No upcoming events.
                            {isAdmin && <div className="mt-2 text-xs text-primary cursor-pointer" onClick={() => setCreateEventOpen(true)}>Schedule one?</div>}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.map((event) => (
                                <div key={event.id} className="relative pl-3 border-l-2 border-primary/20">
                                    <div className="text-xs font-bold text-primary mb-0.5">
                                        {format(new Date(event.start_time), 'MMM d, h:mm a')}
                                    </div>
                                    <div className="font-semibold text-sm text-sidebar-foreground line-clamp-1">
                                        {event.title}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-sidebar-muted-foreground mt-1">
                                        {event.location_type === 'online' ? (
                                            <Video className="w-3 h-3" />
                                        ) : (
                                            <MapPin className="w-3 h-3" />
                                        )}
                                        <span className="truncate max-w-[150px]">
                                            {event.location_type === 'online' ? 'Online' : (typeof event.location_data === 'string' ? event.location_data : event.location_data?.address || 'Physical Location')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {events.length >= 3 && (
                                <div className="text-xs text-center pt-1">
                                    <a href="#" className="text-primary hover:underline">View all events</a>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateEventDialog
                isOpen={createEventOpen}
                onClose={() => setCreateEventOpen(false)}
                communityId={communityId}
                onEventCreated={fetchEvents}
            />
        </>
    );
};
