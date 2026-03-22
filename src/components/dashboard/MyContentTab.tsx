import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, MessageSquare, AlertTriangle, Pin, PinOff, Pencil, Trash2,
  ChevronRight, Plus, Loader2, ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// ─── MY POSTS ───────────────────────────────────────────────────────────────

const MyPostsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['my-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, upvotes, downvotes, comment_count, created_at, is_pinned, communities!posts_community_id_fkey(name)')
        .eq('author_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const togglePin = async (postId: string, currentlyPinned: boolean) => {
    if (!user) return;
    // Check pin limit (max 3)
    if (!currentlyPinned) {
      const pinnedCount = posts?.filter(p => p.is_pinned).length ?? 0;
      if (pinnedCount >= 3) {
        toast({ title: 'Pin limit reached', description: 'You can pin up to 3 posts.', variant: 'destructive' });
        return;
      }
    }
    await supabase.from('posts').update({ is_pinned: !currentlyPinned }).eq('id', postId).eq('author_id', user.id);
    qc.invalidateQueries({ queryKey: ['my-posts'] });
    toast({ title: currentlyPinned ? 'Post unpinned' : 'Post pinned' });
  };

  const deletePost = async () => {
    if (!deleteId || !user) return;
    setDeleting(true);
    const { error } = await supabase.from('posts').delete().eq('id', deleteId).eq('author_id', user.id);
    setDeleting(false);
    setDeleteId(null);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' });
    } else {
      qc.invalidateQueries({ queryKey: ['my-posts'] });
      toast({ title: 'Post deleted' });
    }
  };

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  if (!posts?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-4">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-medium">No posts yet</p>
          <p className="text-sm text-muted-foreground">Share your thoughts with the community.</p>
          <Button asChild size="sm"><Link to="/create"><Plus className="w-4 h-4 mr-2" />Create Post</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        <Button asChild size="sm" variant="outline"><Link to="/create"><Plus className="w-3.5 h-3.5 mr-1.5" />New Post</Link></Button>
      </div>

      {posts.map(post => (
        <Card key={post.id} className="group hover:border-primary/30 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  {post.is_pinned && <Badge variant="secondary" className="text-[10px] gap-1"><Pin className="w-2.5 h-2.5" />Pinned</Badge>}
                  {(post as any).communities?.name && (
                    <Badge variant="outline" className="text-[10px]">c/{(post as any).communities.name}</Badge>
                  )}
                </div>
                <Link to={`/post/${post.id}`} className="font-medium text-sm hover:text-primary transition-colors line-clamp-2">
                  {post.title || post.content?.slice(0, 80) || 'Untitled'}
                </Link>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  <span>↑{post.upvotes ?? 0} ↓{post.downvotes ?? 0}</span>
                  <span>{post.comment_count ?? 0} comments</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(post.id, !!post.is_pinned)} title={post.is_pinned ? 'Unpin' : 'Pin'}>
                  {post.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/post/${post.id}`)} title="View">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(post.id)} title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>This action cannot be undone. Your post and all its comments will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deletePost} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── MY COMMENTS ────────────────────────────────────────────────────────────

const MyCommentsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['my-comments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, updated_at, upvotes, downvotes, is_deleted, post_id, posts!comments_post_id_fkey(id, title, communities!posts_community_id_fkey(name))')
        .eq('author_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  const canEdit = (createdAt: string) => {
    return Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS;
  };

  const startEdit = (comment: any) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const saveEdit = async () => {
    if (!editingId || !user || !editContent.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('comments')
      .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
      .eq('id', editingId)
      .eq('author_id', user.id);
    setSaving(false);
    setEditingId(null);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update comment', variant: 'destructive' });
    } else {
      qc.invalidateQueries({ queryKey: ['my-comments'] });
      toast({ title: 'Comment updated' });
    }
  };

  const deleteComment = async () => {
    if (!deleteId || !user) return;
    setDeleting(true);
    await supabase.from('comments').update({ is_deleted: true, content: '[deleted]' }).eq('id', deleteId).eq('author_id', user.id);
    setDeleting(false);
    setDeleteId(null);
    qc.invalidateQueries({ queryKey: ['my-comments'] });
    toast({ title: 'Comment deleted' });
  };

  const isEdited = (c: any) => c.updated_at && new Date(c.updated_at).getTime() - new Date(c.created_at).getTime() > 1000;

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  if (!comments?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-2">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-medium">No comments yet</p>
          <p className="text-sm text-muted-foreground">Join conversations to see your comments here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-2">{comments.length} comment{comments.length !== 1 ? 's' : ''}</p>
      {comments.map(comment => {
        const post = (comment as any).posts;
        const editing = editingId === comment.id;

        return (
          <Card key={comment.id} className="group hover:border-primary/30 transition-colors">
            <CardContent className="p-3 sm:p-4">
              {/* Parent post link */}
              {post && (
                <Link to={`/post/${post.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors mb-1.5 block truncate">
                  → {post.communities?.name ? `c/${post.communities.name}` : ''} · {post.title || 'Untitled post'}
                </Link>
              )}

              {editing ? (
                <div className="space-y-2">
                  <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="text-sm min-h-[60px]" maxLength={5000} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={saving || !editContent.trim()}>
                      {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-3">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                      {isEdited(comment) && <span className="italic">(edited)</span>}
                      <span>↑{comment.upvotes ?? 0} ↓{comment.downvotes ?? 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit(comment.created_at) && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(comment)} title="Edit (15min window)">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(comment.id)} title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>This comment will be marked as deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteComment} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── MY INCIDENTS ───────────────────────────────────────────────────────────

const MyIncidentsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: '', description: '', severity: 'medium' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['my-incidents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('incidents')
        .select('id, case_number, title, description, severity, status, created_at, is_anonymous')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const canModify = (incident: any) => incident.status === 'open' && !incident.is_anonymous;

  const startEdit = (incident: any) => {
    setEditingId(incident.id);
    setEditData({ title: incident.title, description: incident.description || '', severity: incident.severity });
  };

  const saveEdit = async () => {
    if (!editingId || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from('incidents')
      .update({ title: editData.title.trim(), description: editData.description.trim(), severity: editData.severity })
      .eq('id', editingId)
      .eq('reporter_id', user.id);
    setSaving(false);
    setEditingId(null);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update incident', variant: 'destructive' });
    } else {
      qc.invalidateQueries({ queryKey: ['my-incidents'] });
      toast({ title: 'Incident updated' });
    }
  };

  const deleteIncident = async () => {
    if (!deleteId || !user) return;
    setDeleting(true);
    const { error } = await supabase.from('incidents').delete().eq('id', deleteId).eq('reporter_id', user.id);
    setDeleting(false);
    setDeleteId(null);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete. Only open incidents can be deleted.', variant: 'destructive' });
    } else {
      qc.invalidateQueries({ queryKey: ['my-incidents'] });
      toast({ title: 'Incident deleted' });
    }
  };

  const severityColor: Record<string, string> = {
    low: 'border-blue-500/30 text-blue-600 bg-blue-500/5',
    medium: 'border-yellow-500/30 text-yellow-600 bg-yellow-500/5',
    high: 'border-orange-500/30 text-orange-600 bg-orange-500/5',
    critical: 'border-red-500/30 text-red-600 bg-red-500/5',
  };

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  if (!incidents?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-medium">No incidents reported</p>
          <p className="text-sm text-muted-foreground">Report an incident to track it here.</p>
          <Button asChild size="sm"><Link to="/report-incident"><Plus className="w-4 h-4 mr-2" />Report Incident</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{incidents.length} incident{incidents.length !== 1 ? 's' : ''}</p>
        <Button asChild size="sm" variant="outline"><Link to="/report-incident"><Plus className="w-3.5 h-3.5 mr-1.5" />Report</Link></Button>
      </div>

      {incidents.map(incident => (
        <Card key={incident.id} className="group hover:border-primary/30 transition-colors">
          <CardContent className="p-3 sm:p-4">
            {editingId === incident.id ? (
              <div className="space-y-3">
                <Input value={editData.title} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} placeholder="Title" maxLength={200} />
                <Textarea value={editData.description} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} placeholder="Description" maxLength={5000} className="min-h-[60px]" />
                <Select value={editData.severity} onValueChange={v => setEditData(d => ({ ...d, severity: v }))}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} disabled={saving || !editData.title.trim()}>
                    {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <Badge variant="outline" className="font-mono text-[10px]">{incident.case_number}</Badge>
                    <Badge variant="outline" className={`text-[10px] capitalize ${severityColor[incident.severity] || ''}`}>{incident.severity}</Badge>
                    <Badge variant="secondary" className="text-[10px] capitalize">{incident.status}</Badge>
                    {incident.is_anonymous && <Badge variant="outline" className="text-[10px]">Anonymous</Badge>}
                  </div>
                  <p className="font-medium text-sm truncate">{incident.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}</p>
                </div>
                {canModify(incident) && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(incident)} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(incident.id)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Incident</DialogTitle>
            <DialogDescription>This will permanently delete this incident report. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteIncident} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── MAIN TAB ───────────────────────────────────────────────────────────────

export const MyContentTab = () => {
  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="w-full grid grid-cols-3 h-9 bg-muted/50 rounded-lg p-0.5">
        <TabsTrigger value="posts" className="text-xs rounded-md gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
          <FileText className="w-3.5 h-3.5" />My Posts
        </TabsTrigger>
        <TabsTrigger value="comments" className="text-xs rounded-md gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
          <MessageSquare className="w-3.5 h-3.5" />My Comments
        </TabsTrigger>
        <TabsTrigger value="incidents" className="text-xs rounded-md gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5" />My Incidents
        </TabsTrigger>
      </TabsList>
      <TabsContent value="posts" className="mt-3"><MyPostsSection /></TabsContent>
      <TabsContent value="comments" className="mt-3"><MyCommentsSection /></TabsContent>
      <TabsContent value="incidents" className="mt-3"><MyIncidentsSection /></TabsContent>
    </Tabs>
  );
};
