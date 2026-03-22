import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle, ChevronRight, Plus, FolderOpen, Pencil, Trash2, Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// MyIssuesTab removed — functionality merged into MyActions tab
// ─────────────────────────────────────────────────────────────────────────────
// MY PROJECTS TAB — government projects created by auth user
// ─────────────────────────────────────────────────────────────────────────────

interface GovProject {
    id: string;
    title: string;
    description: string | null;
    status: string;
    category: string | null;
    created_at: string;
    progress_percentage: number | null;
    is_verified: boolean;
}

const projectStatusConfig: Record<string, { label: string; color: string }> = {
    planning: { label: 'Planning', color: 'border-purple-500/30 text-purple-600 bg-purple-500/5' },
    active: { label: 'Active', color: 'border-blue-500/30 text-blue-600 bg-blue-500/5' },
    completed: { label: 'Completed', color: 'border-green-500/30 text-green-600 bg-green-500/5' },
    stalled: { label: 'Stalled', color: 'border-red-500/30 text-red-600 bg-red-500/5' },
    cancelled: { label: 'Cancelled', color: 'border-muted-foreground/30 text-muted-foreground bg-muted/30' },
};

export const MyProjectsTab: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const qc = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState({ title: '', description: '', status: '' });
    const [editSaving, setEditSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data: projects, isLoading, isError } = useQuery<GovProject[]>({
        queryKey: ['my-gov-projects', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('government_projects')
                .select('id, title, description, status, category, created_at, progress_percentage, is_verified')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user,
        staleTime: 2 * 60 * 1000,
    });

    const startEdit = (project: GovProject) => {
        setEditingId(project.id);
        setEditData({ title: project.title, description: project.description || '', status: project.status });
    };

    const saveEdit = async () => {
        if (!editingId || !user || !editData.title.trim()) return;
        setEditSaving(true);
        const { error } = await supabase
            .from('government_projects')
            .update({ title: editData.title.trim(), description: editData.description.trim(), status: editData.status })
            .eq('id', editingId)
            .eq('created_by', user.id);
        setEditSaving(false);
        setEditingId(null);
        if (error) {
            toast({ title: 'Error', description: 'Failed to update project. Only unverified projects can be edited.', variant: 'destructive' });
        } else {
            qc.invalidateQueries({ queryKey: ['my-gov-projects'] });
            toast({ title: 'Project updated' });
        }
    };

    const deleteProject = async () => {
        if (!deleteId || !user) return;
        setDeleting(true);
        const { error } = await supabase
            .from('government_projects')
            .delete()
            .eq('id', deleteId)
            .eq('created_by', user.id);
        setDeleting(false);
        setDeleteId(null);
        if (error) {
            toast({ title: 'Error', description: 'Failed to delete. Only unverified projects can be deleted.', variant: 'destructive' });
        } else {
            qc.invalidateQueries({ queryKey: ['my-gov-projects'] });
            toast({ title: 'Project deleted' });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
        );
    }

    if (isError) {
        return (
            <Card className="border-destructive/30">
                <CardContent className="py-8 text-center text-destructive">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Failed to load projects.</p>
                </CardContent>
            </Card>
        );
    }

    if (!projects?.length) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center space-y-4">
                    <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto" />
                    <div>
                        <p className="font-medium">No projects yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Submit a government project to track its progress.
                        </p>
                    </div>
                    <Button asChild size="sm">
                        <Link to="/projects/submit">
                            <Plus className="w-4 h-4 mr-2" />
                            Submit Project
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
                <Button asChild size="sm" variant="outline">
                    <Link to="/projects/submit">
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add Project
                    </Link>
                </Button>
            </div>

            {projects.map((project) => {
                const status = projectStatusConfig[project.status] ?? projectStatusConfig.planning;
                const isEditing = editingId === project.id;
                const canModify = !project.is_verified;

                return (
                    <Card key={project.id} className="group hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Input value={editData.title} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} placeholder="Project title" maxLength={200} />
                                    <Textarea value={editData.description} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} placeholder="Description" maxLength={5000} className="min-h-[60px]" />
                                    <Select value={editData.status} onValueChange={v => setEditData(d => ({ ...d, status: v }))}>
                                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(projectStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={saveEdit} disabled={editSaving || !editData.title.trim()}>
                                            {editSaving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}Save
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                                                {status.label}
                                            </Badge>
                                            {project.category && (
                                                <Badge variant="secondary" className="text-[10px]">{project.category}</Badge>
                                            )}
                                            {project.is_verified && (
                                                <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600 bg-green-500/5">
                                                    <CheckCircle className="w-2.5 h-2.5 mr-1" />Verified
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="font-medium text-sm truncate">{project.title}</p>
                                        {project.progress_percentage !== null && (
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: `${project.progress_percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                                    {project.progress_percentage}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {canModify && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEdit(project)} title="Edit">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive" onClick={() => setDeleteId(project.id)} title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                            <Link to={`/projects/${project.id}`}>
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
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
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>This will permanently delete this project and all its updates. This cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={deleteProject} disabled={deleting}>
                            {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
// ─────────────────────────────────────────────────────────────────────────────
// MOD TOOLS TAB — moderation tools for community admins/moderators
// ─────────────────────────────────────────────────────────────────────────────

interface ModRole {
    community_id: string;
    role: string;
    communities: { name: string } | null;
}

interface FlaggedContent {
    id: string;
    reason: string | null;
    status: string;
    verdict: string;
    created_at: string | null;
    post_id: string | null;
    comment_id: string | null;
    flagged_by_ai: boolean | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    posts: { title: string; community_id: string | null; author_id: string } | null;
    project_comments: { comment_text: string } | null;
}

export const ModToolsTab: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const qc = useQueryClient();
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const { data: modRoles, isLoading: rolesLoading } = useQuery<ModRole[]>({
        queryKey: ['mod-roles', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('community_moderators')
                .select('community_id, role, communities(name)')
                .eq('user_id', user.id)
                .in('role', ['admin', 'moderator']);
            if (error) throw error;
            return (data ?? []) as ModRole[];
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000,
    });

    const communityIds = modRoles?.map(r => r.community_id) ?? [];

    const { data: flags, isLoading: flagsLoading } = useQuery<FlaggedContent[]>({
        queryKey: ['mod-flags', communityIds],
        queryFn: async () => {
            if (communityIds.length === 0) return [];
            const { data, error } = await supabase
                .from('content_flags')
                .select('id, reason, status, verdict, created_at, post_id, comment_id, flagged_by_ai, reviewed_by, reviewed_at, posts!content_flags_post_id_fkey(title, community_id, author_id), project_comments(content)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return ((data ?? []) as FlaggedContent[]).filter((f) => {
                if (!f.posts?.community_id) return false;
                return communityIds.includes(f.posts.community_id);
            });
        },
        enabled: communityIds.length > 0,
        staleTime: 60 * 1000,
    });

    const { data: actionsThisWeek } = useQuery<number>({
        queryKey: ['mod-actions-week', user?.id],
        queryFn: async () => {
            if (!user) return 0;
            const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { count } = await supabase
                .from('moderation_log')
                .select('*', { count: 'exact', head: true })
                .eq('actor_id', user.id)
                .gte('created_at', since);
            return count ?? 0;
        },
        enabled: !!user && communityIds.length > 0,
        staleTime: 60 * 1000,
    });

    const handleModAction = async (flagId: string, action: 'approved' | 'removed' | 'dismissed') => {
        if (!user) return;
        setActionLoading(flagId);
        try {
            const { error: flagError } = await supabase
                .from('content_flags')
                .update({ status: action, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
                .eq('id', flagId);
            if (flagError) throw flagError;

            await supabase.from('moderation_log').insert({
                flag_id: flagId,
                actor_id: user.id,
                action,
                reason: `Moderator action: ${action}`,
            });

            qc.invalidateQueries({ queryKey: ['mod-flags'] });
            qc.invalidateQueries({ queryKey: ['mod-actions-week'] });
            toast({ title: `Content ${action}`, description: `Flag has been marked as ${action}.` });
        } catch {
            toast({ title: 'Error', description: 'Failed to process action.', variant: 'destructive' });
        } finally {
            setActionLoading(null);
        }
    };

    const isLoading = rolesLoading || flagsLoading;

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
            </div>
        );
    }

    if (!modRoles?.length) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <Shield className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">No moderator roles</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                            You're not moderating any communities yet. Active members can be invited as moderators by community admins.
                        </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                        <Link to="/communities">Explore Communities</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const pendingCount = flags?.length ?? 0;

    return (
        <div className="space-y-4">
            {/* Overview stats bar */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/60 p-3 bg-card text-center">
                    <p className="text-lg font-bold">{modRoles.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Communities</p>
                </div>
                <div className={`rounded-xl border p-3 text-center ${pendingCount > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-border/60 bg-card'}`}>
                    <p className={`text-lg font-bold ${pendingCount > 0 ? 'text-destructive' : ''}`}>{pendingCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
                </div>
                <div className="rounded-xl border border-border/60 p-3 bg-card text-center">
                    <p className="text-lg font-bold">{actionsThisWeek ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Actions (7d)</p>
                </div>
            </div>

            {/* Moderation Queue */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Moderation Queue
                        {pendingCount > 0 && (
                            <Badge className="text-[10px] bg-destructive text-destructive-foreground border-0">
                                {pendingCount}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {pendingCount === 0 ? (
                        <div className="text-center py-8 space-y-2">
                            <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                            <p className="text-sm font-medium">All clear</p>
                            <p className="text-xs text-muted-foreground">No pending reports need attention</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {flags?.map((flag) => {
                                const isPost = !!flag.post_id;
                                const preview = isPost
                                    ? flag.posts?.title ?? 'Untitled post'
                                    : (flag.project_comments?.content ?? 'Comment').slice(0, 100);
                                const timeSince = flag.created_at
                                    ? `${Math.round((Date.now() - new Date(flag.created_at).getTime()) / (1000 * 60 * 60))}h ago`
                                    : '';
                                const isProcessing = actionLoading === flag.id;

                                return (
                                    <div key={flag.id} className="border rounded-lg p-3 space-y-2">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                    <Badge variant="outline" className={`text-[10px] ${isPost ? 'border-blue-500/30 text-blue-600' : 'border-purple-500/30 text-purple-600'}`}>
                                                        {isPost ? 'Post' : 'Comment'}
                                                    </Badge>
                                                    {flag.flagged_by_ai && (
                                                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600">AI</Badge>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground">{timeSince}</span>
                                                </div>
                                                <p className="text-sm font-medium truncate">{preview}</p>
                                                {flag.reason && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">Reason: {flag.reason}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
                                            <Button
                                                size="sm" variant="outline"
                                                className="h-7 text-xs flex-1"
                                                disabled={isProcessing}
                                                onClick={() => handleModAction(flag.id, 'approved')}
                                            >
                                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm" variant="outline"
                                                className="h-7 text-xs flex-1 text-destructive hover:text-destructive"
                                                disabled={isProcessing}
                                                onClick={() => handleModAction(flag.id, 'removed')}
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                Remove
                                            </Button>
                                            <Button
                                                size="sm" variant="ghost"
                                                className="h-7 text-xs"
                                                disabled={isProcessing}
                                                onClick={() => handleModAction(flag.id, 'dismissed')}
                                            >
                                                Dismiss
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Communities managed */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Your Communities
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                    {modRoles.map((role) => (
                        <div key={role.community_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{role.communities?.name ?? 'Unknown'}</p>
                                <Badge variant="outline" className={`text-[10px] mt-0.5 ${role.role === 'admin' ? 'border-orange-500/30 text-orange-600' : 'border-blue-500/30 text-blue-600'}`}>
                                    {role.role}
                                </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" asChild>
                                <Link to={`/c/${role.communities?.name ?? role.community_id}`}>
                                    Manage <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};
