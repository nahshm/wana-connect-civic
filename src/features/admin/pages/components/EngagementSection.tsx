import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy, Award, Video, Building, CheckCircle, XCircle,
  Loader2, RefreshCw, Eye, Users, Target, Star
} from 'lucide-react';
import { toast } from 'sonner';

export default function EngagementSection() {
  return (
    <Tabs defaultValue="quests" className="space-y-6">
      <TabsList>
        <TabsTrigger value="quests" className="gap-2"><Target className="w-4 h-4" />Quests</TabsTrigger>
        <TabsTrigger value="badges" className="gap-2"><Award className="w-4 h-4" />Badges</TabsTrigger>
        <TabsTrigger value="clips" className="gap-2"><Video className="w-4 h-4" />CivicClips</TabsTrigger>
        <TabsTrigger value="ngos" className="gap-2"><Building className="w-4 h-4" />NGO Partners</TabsTrigger>
      </TabsList>

      <TabsContent value="quests"><QuestsSubTab /></TabsContent>
      <TabsContent value="badges"><BadgesSubTab /></TabsContent>
      <TabsContent value="clips"><CivicClipsSubTab /></TabsContent>
      <TabsContent value="ngos"><NGOPartnersSubTab /></TabsContent>
    </Tabs>
  );
}

function QuestsSubTab() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');

  const { data: quests, isLoading, refetch } = useQuery({
    queryKey: ['admin-quests', filter],
    queryFn: async () => {
      let query = supabase
        .from('quests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'active') {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: questStats } = useQuery({
    queryKey: ['admin-quest-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_quests')
        .select('quest_id, status', { count: 'exact' });

      const stats: Record<string, { total: number; completed: number }> = {};
      (data || []).forEach(uq => {
        if (!stats[uq.quest_id]) stats[uq.quest_id] = { total: 0, completed: 0 };
        stats[uq.quest_id].total++;
        if (uq.status === 'completed') stats[uq.quest_id].completed++;
      });
      return stats;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quest Management</h3>
        <div className="flex gap-2">
          {(['all', 'active'] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !quests?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3" />
            No quests found for current filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quests.map(quest => {
            const stats = questStats?.[quest.id] || { total: 0, completed: 0 };
            const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

            return (
              <Card key={quest.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm">{quest.title}</h4>
                        <Badge
                          variant={quest.is_active ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {quest.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {quest.description && quest.description.length > 100
                          ? `${quest.description.substring(0, 100)}...`
                          : quest.description
                        }
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div>Participants: {stats.total}</div>
                        <div>Completion Rate: {completionRate}%</div>
                        {quest.points && <div>Reward: {quest.points} points</div>}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BadgesSubTab() {
  const { data: badges, isLoading } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: badgeStats } = useQuery({
    queryKey: ['admin-badge-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_badges')
        .select('badge_id', { count: 'exact' });

      const stats: Record<string, number> = {};
      (data || []).forEach(ub => {
        stats[ub.badge_id] = (stats[ub.badge_id] || 0) + 1;
      });
      return stats;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Badge Management</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !badges?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Award className="w-12 h-12 mx-auto mb-3" />
            No badges found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map(badge => {
            const awardedCount = badgeStats?.[badge.id] || 0;

            return (
              <Card key={badge.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      {badge.icon ? (
                        <span className="text-2xl">{badge.icon}</span>
                      ) : (
                        <Star className="w-6 h-6 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{badge.name}</h4>
                      <div className="text-xs text-muted-foreground">{badge.category}</div>
                    </div>
                  </div>
                  {badge.description && (
                    <div className="text-xs text-muted-foreground mb-3">
                      {badge.description}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Awarded: {awardedCount} times
                    </div>
                    <Badge
                      variant={badge.is_active ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {badge.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CivicClipsSubTab() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');

  const { data: clips, isLoading, refetch } = useQuery({
    queryKey: ['admin-civic-clips', filter],
    queryFn: async () => {
      let query = supabase
        .from('civic_clips')
        .select(`
          *,
          posts(title, created_at, profiles(display_name))
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'featured') {
        query = query.eq('is_featured', true);
      } else if (filter === 'pending') {
        query = query.eq('processing_status', 'pending');
      } else if (filter === 'approved') {
        query = query.eq('processing_status', 'completed');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const featureMutation = useMutation({
    mutationFn: async ({ clipId, featured }: { clipId: string; featured: boolean }) => {
      const { error } = await supabase
        .from('civic_clips')
        .update({
          is_featured: featured,
          featured_at: featured ? new Date().toISOString() : null,
        })
        .eq('id', clipId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Clip updated successfully');
      refetch();
    },
    onError: () => toast.error('Failed to update clip'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">CivicClips Moderation</h3>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'featured'] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !clips?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-3" />
            No clips found for current filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clips.map(clip => (
            <Card key={clip.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {clip.thumbnail_url && (
                      <img
                        src={clip.thumbnail_url}
                        alt="Clip thumbnail"
                        className="w-16 h-16 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">
                          {clip.posts?.title || 'Untitled'}
                        </h4>
                        {clip.is_featured && (
                          <Badge variant="default" className="text-xs">Featured</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {clip.posts?.profiles?.display_name} • {clip.category} • {clip.duration}s
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            clip.processing_status === 'completed' ? 'secondary' :
                            clip.processing_status === 'failed' ? 'destructive' : 'outline'
                          }
                          className="text-xs"
                        >
                          {clip.processing_status}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          Views: {clip.views_count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => featureMutation.mutate({
                        clipId: clip.id,
                        featured: !clip.is_featured
                      })}
                    >
                      {clip.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NGOPartnersSubTab() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'active'>('all');

  const { data: partners, isLoading, refetch } = useQuery({
    queryKey: ['admin-ngo-partners', filter],
    queryFn: async () => {
      let query = supabase
        .from('ngo_partners')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ partnerId, status }: { partnerId: string; status: string }) => {
      const { error } = await supabase
        .from('ngo_partners')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Partner status updated');
      refetch();
    },
    onError: () => toast.error('Failed to update partner status'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">NGO Partner Applications</h3>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'active'] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !partners?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-3" />
            No NGO partners found for current filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {partners.map(partner => (
            <Card key={partner.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm">{partner.organization_name}</h4>
                      <Badge
                        variant={
                          partner.status === 'approved' ? 'default' :
                          partner.status === 'active' ? 'secondary' :
                          partner.status === 'pending' ? 'outline' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {partner.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {partner.focus_areas?.join(', ') || 'No focus areas'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Contact: {partner.contact_email}
                    </div>
                  </div>
                  {partner.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600"
                        onClick={() => updateStatusMutation.mutate({
                          partnerId: partner.id,
                          status: 'approved'
                        })}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatusMutation.mutate({
                          partnerId: partner.id,
                          status: 'rejected'
                        })}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}