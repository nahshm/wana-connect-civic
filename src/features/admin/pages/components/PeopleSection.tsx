import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Shield, UserCheck, Search, Eye, Loader2,
  CheckCircle, XCircle, Clock, Building, MapPin, Calendar, FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function PeopleSection() {
  return (
    <Tabs defaultValue="users" className="space-y-6">
      <TabsList>
        <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" />Users</TabsTrigger>
        <TabsTrigger value="moderators" className="gap-2"><Shield className="w-4 h-4" />Moderators</TabsTrigger>
        <TabsTrigger value="officials" className="gap-2"><UserCheck className="w-4 h-4" />Officials & Verification</TabsTrigger>
      </TabsList>

      <TabsContent value="users"><UsersSubTab /></TabsContent>
      <TabsContent value="moderators"><ModeratorsSubTab /></TabsContent>
      <TabsContent value="officials"><OfficialsSubTab /></TabsContent>
    </Tabs>
  );
}

function UsersSubTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm],
    queryFn: async () => {
      let q = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
      if (searchTerm) {
        q = q.or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('user_id, role');
      const map: Record<string, string[]> = {};
      (data || []).forEach(r => {
        if (!map[r.user_id]) map[r.user_id] = [];
        map[r.user_id].push(r.role);
      });
      return map;
    },
  });

  const handleSearch = () => setSearchTerm(searchQuery);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name or username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} variant="outline">Search</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !users?.length ? (
            <p className="text-center py-8 text-muted-foreground">No users found.</p>
          ) : (
            <div className="space-y-2">
              {users.map(user => {
                const roles = userRoles?.[user.id] || [];
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        {user.display_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.display_name || user.username || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">@{user.username || user.id.slice(0, 8)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {roles.map(r => (
                        <Badge key={r} variant={r === 'super_admin' ? 'destructive' : r === 'admin' ? 'default' : 'outline'} className="text-xs">
                          {r}
                        </Badge>
                      ))}
                      {user.is_verified && <Badge className="text-xs bg-green-600">Verified</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ModeratorsSubTab() {
  const { data: moderators, isLoading } = useQuery({
    queryKey: ['admin-moderators'],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_moderators')
        .select('*, community:communities(name, display_name)')
        .limit(50);

      if (!data?.length) return [];
      const userIds = data.map(m => m.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', userIds);

      const profilesMap: Record<string, any> = {};
      (profiles || []).forEach(p => { profilesMap[p.id] = p; });
      return data.map(m => ({ ...m, user: profilesMap[m.user_id] || null }));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Community Moderators ({moderators?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !moderators?.length ? (
          <p className="text-center py-8 text-muted-foreground">No moderators found.</p>
        ) : (
          <div className="space-y-2">
            {moderators.map(mod => (
              <div key={mod.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                    {mod.user?.display_name?.[0]?.toUpperCase() || 'M'}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{mod.user?.display_name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">c/{mod.community?.name}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{mod.role}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OfficialsSubTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'pending' | 'verified' | 'all'>('pending');

  const { data: claims, isLoading } = useQuery({
    queryKey: ['admin-official-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_holders')
        .select(`
          *,
          profiles!office_holders_user_id_fkey(id, username, display_name, avatar_url),
          government_positions(id, title, governance_level, country_code, jurisdiction_name)
        `)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(claim => ({
        ...claim,
        profile: claim.profiles,
        position: claim.government_positions
      }));
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ claimId, approved }: { claimId: string; approved: boolean }) => {
      const claim = claims?.find(c => c.id === claimId);
      if (!claim) throw new Error('Claim not found');

      const { error } = await supabase
        .from('office_holders')
        .update({
          verification_status: approved ? 'verified' : 'rejected',
          verified_at: approved ? new Date().toISOString() : null,
          verified_by: approved ? user?.id : null,
          is_active: approved,
        })
        .eq('id', claimId);
      if (error) throw error;

      if (approved && claim.user_id) {
        await supabase.from('profiles').update({
          is_verified: true,
          official_position: claim.position?.title,
          official_position_id: claim.position?.id,
          updated_at: new Date().toISOString(),
        }).eq('id', claim.user_id);
      }
    },
    onSuccess: (_, { approved }) => {
      toast.success(approved ? 'Claim approved!' : 'Claim rejected.');
      queryClient.invalidateQueries({ queryKey: ['admin-official-claims'] });
    },
    onError: () => toast.error('Failed to process claim'),
  });

  const filtered = claims?.filter(c =>
    activeView === 'all' ? true :
    activeView === 'pending' ? c.verification_status === 'pending' :
    c.verification_status === 'verified'
  ) || [];

  const pendingCount = claims?.filter(c => c.verification_status === 'pending').length || 0;
  const verifiedCount = claims?.filter(c => c.verification_status === 'verified').length || 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <Clock className="text-orange-500 mb-1 w-5 h-5" />
          <div className="text-2xl font-bold">{pendingCount}</div>
          <div className="text-xs text-muted-foreground">Pending Claims</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <CheckCircle className="text-green-500 mb-1 w-5 h-5" />
          <div className="text-2xl font-bold">{verifiedCount}</div>
          <div className="text-xs text-muted-foreground">Verified</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Users className="text-blue-500 mb-1 w-5 h-5" />
          <div className="text-2xl font-bold">{claims?.length || 0}</div>
          <div className="text-xs text-muted-foreground">Total Claims</div>
        </CardContent></Card>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {(['pending', 'verified', 'all'] as const).map(v => (
          <Button key={v} size="sm" variant={activeView === v ? 'default' : 'outline'} onClick={() => setActiveView(v)} className="capitalize gap-1.5">
            {v === 'pending' && <Clock className="w-3.5 h-3.5" />}
            {v === 'verified' && <CheckCircle className="w-3.5 h-3.5" />}
            {v === 'all' && <Users className="w-3.5 h-3.5" />}
            {v} {v === 'pending' ? `(${pendingCount})` : v === 'verified' ? `(${verifiedCount})` : ''}
          </Button>
        ))}
      </div>

      {/* Claims list */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !filtered.length ? (
            <p className="text-center py-8 text-muted-foreground">No {activeView} claims found.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(claim => (
                <div key={claim.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        {claim.profile?.display_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{claim.profile?.display_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">@{claim.profile?.username}</div>
                        <div className="mt-1.5 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Building className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-medium">{claim.position?.title || 'Unknown Position'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            {claim.position?.governance_level} — {claim.position?.country_code}
                          </div>
                          {claim.term_start && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(claim.term_start).toLocaleDateString()} — {claim.term_end ? new Date(claim.term_end).toLocaleDateString() : 'N/A'}
                            </div>
                          )}
                        </div>
                        {claim.proof_documents && (
                          <Badge variant="outline" className="text-xs mt-1.5">
                            <FileText className="w-3 h-3 mr-1" />
                            {claim.verification_method === 'document_upload' ? 'Document' : claim.verification_method || 'Proof'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={
                        claim.verification_status === 'verified' ? 'default' :
                        claim.verification_status === 'rejected' ? 'destructive' : 'secondary'
                      } className="text-xs capitalize">{claim.verification_status}</Badge>

                      {claim.verification_status === 'pending' && (
                        <div className="flex gap-2 mt-1">
                          <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            disabled={approvalMutation.isPending}
                            onClick={() => approvalMutation.mutate({ claimId: claim.id, approved: true })}>
                            <CheckCircle className="w-3.5 h-3.5" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                            disabled={approvalMutation.isPending}
                            onClick={() => approvalMutation.mutate({ claimId: claim.id, approved: false })}>
                            <XCircle className="w-3.5 h-3.5" />Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
