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
import { Clock, CheckCircle, AlertTriangle, ChevronRight, Plus, FolderOpen, Pencil, Trash2, Loader2 } from 'lucide-react';
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

interface ContentFlag {
    id: string;
    reason: string;
    status: string;
    created_at: string;
    content_type: string;
    community_id: string | null;
}

export const ModToolsTab: React.FC = () => {
    const { user } = useAuth();

    // Fetch communities where user is mod/admin
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

    // Fetch pending flags in communities where user is mod
    const { data: pendingFlags, isLoading: flagsLoading } = useQuery<ContentFlag[]>({
        queryKey: ['mod-pending-flags', communityIds],
        queryFn: async () => {
            // Disabled: content_flags table does not exist yet in schema
            return [];
        },
        enabled: communityIds.length > 0,
        staleTime: 60 * 1000,
    });

    const isLoading = rolesLoading || flagsLoading;

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
            </div>
        );
    }

    // Not a mod anywhere
    if (!modRoles?.length) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center space-y-2">
                    <div className="text-4xl">🛡️</div>
                    <p className="font-medium">No moderator roles</p>
                    <p className="text-sm text-muted-foreground">
                        You're not an admin or moderator of any community yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Communities where user is mod */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        🛡️ Your Communities
                        <Badge variant="secondary" className="text-[10px]">{modRoles.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                    {modRoles.map((role) => (
                        <div key={role.community_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div>
                                <p className="text-sm font-medium">{role.communities?.name ?? 'Unknown Community'}</p>
                                <Badge variant="outline" className={`text-[10px] ${role.role === 'admin' ? 'border-orange-500/30 text-orange-600' : 'border-blue-500/30 text-blue-600'}`}>
                                    {role.role}
                                </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                <Link to={`/c/${role.communities?.name ?? role.community_id}`}>
                                    Manage <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Pending flags */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        🚩 Pending Reports
                        {(pendingFlags?.length ?? 0) > 0 && (
                            <Badge className="text-[10px] bg-red-500 text-white border-0">
                                {pendingFlags?.length}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {!pendingFlags?.length ? (
                        <div className="text-center py-6">
                            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No pending reports. Queue is clear! ✅</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingFlags.map((flag) => (
                                <div key={flag.id} className="flex items-start gap-3 p-2 border rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-600">
                                                {flag.content_type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{flag.reason}</p>
                                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                            {new Date(flag.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full text-xs mt-2" asChild>
                                <Link to="/admin/dashboard">View Full Moderation Queue</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
