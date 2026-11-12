import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, PlusCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VerificationPanel from '@/components/verification/VerificationPanel';
import { useVerification } from '@/hooks/useVerification';

interface PromiseItem {
    id: string;
    title: string;
    description: string;
    status: string;
    category: string;
    location: string;
    progress_percentage: number;
    budget_allocated?: number;
    budget_used?: number;
    beneficiaries_count?: number;
    created_at: string;
    official?: {
        id: string;
        name: string;
        position: string;
        photo_url?: string;
    };
}

interface PromisesGridProps {
    levelType: 'COUNTY' | 'CONSTITUENCY' | 'WARD';
    locationValue: string;
}

const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'kept':
            return 'border-emerald-500 text-emerald-600 bg-emerald-500/10';
        case 'ongoing':
        case 'in_progress':
            return 'border-yellow-500 text-yellow-600 bg-yellow-500/10';
        case 'cancelled':
        case 'broken':
        case 'stalled':
            return 'border-red-500 text-red-600 bg-red-500/10';
        default:
            return 'border-muted-foreground text-muted-foreground bg-muted';
    }
};

/** Extracted component to safely call useVerification per-promise */
const PromiseCard: React.FC<{ promise: PromiseItem }> = ({ promise }) => {
    const navigate = useNavigate();
    const { verification, castVote, isCastingVote } = useVerification({
        contentId: promise.id,
        contentType: 'promise',
    });

    return (
        <div
            className="bg-card rounded-lg p-5 border border-border shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/pr/${promise.id}`)}
        >
            <div className="flex-1">
                <div className="flex items-center mb-2 gap-2">
                    {promise.official && (
                        <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {promise.official.name}
                        </span>
                    )}
                    <Badge className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(promise.status)}`}>
                        {promise.status}
                    </Badge>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2">{promise.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{promise.description}</p>

                {/* Progress */}
                {promise.progress_percentage !== undefined && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-bold">{promise.progress_percentage}%</span>
                        </div>
                        <Progress value={promise.progress_percentage} className="h-2" />
                    </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {promise.beneficiaries_count && (
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{promise.beneficiaries_count.toLocaleString()} beneficiaries</span>
                        </div>
                    )}
                    {promise.location && (
                        <div className="text-xs bg-muted px-2 py-1 rounded">
                            {promise.location}
                        </div>
                    )}
                </div>
            </div>

            {/* Verification Panel */}
            <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <VerificationPanel
                    verification={verification}
                    onVote={castVote}
                    isLoading={isCastingVote}
                    isExpanded={true}
                />
            </div>
        </div>
    );
};

const PromisesGrid: React.FC<PromisesGridProps> = ({ levelType, locationValue }) => {
    const [promises, setPromises] = useState<PromiseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPromises();
    }, [levelType, locationValue]);

    const fetchPromises = async () => {
        try {
            setLoading(true);

            // Promises come from the single office promises list, matched to this place's offices
            let query = supabase
                .from('office_promises')
                .select(`
                    id, title, description, status, category, progress, created_at,
                    office_holder:office_holders!inner(id, position:government_positions!inner(title, jurisdiction_name), profile:profiles!office_holders_user_id_fkey(display_name, username, avatar_url))
                `)
                .order('created_at', { ascending: false })
                .limit(100);
            if (locationValue) query = query.ilike('office_holder.position.jurisdiction_name', `%${locationValue}%`);

            const { data: rows, error } = await query;
            if (error) throw error;
            const statusLabel: Record<string, string> = { pending: 'not_started', in_progress: 'ongoing', completed: 'completed', failed: 'broken' };
            const data: PromiseItem[] = ((rows as any[]) || []).map(r => ({
                id: r.id, title: r.title, description: r.description || '', status: statusLabel[r.status] || r.status,
                category: r.category || '', location: r.office_holder?.position?.jurisdiction_name || '',
                progress_percentage: r.progress ?? 0, created_at: r.created_at,
                official: r.office_holder ? { id: r.office_holder.id, name: r.office_holder.profile?.display_name || r.office_holder.profile?.username || 'Office holder', position: r.office_holder.position?.title || '', photo_url: r.office_holder.profile?.avatar_url || undefined } : undefined,
            }));
            setPromises(data || []);
        } catch (error) {
            console.error('Error fetching promises:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border border-border p-5 animate-pulse">
                        <div className="h-24 bg-muted rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center">
                        <FileText className="mr-3 h-8 w-8 text-purple-600" />
                        Promise Tracker
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Track & verify campaign promises for {locationValue}
                    </p>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Log Promise
                </Button>
            </div>

            {promises.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-semibold mb-2">No Promises Tracked</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Be the first to log a campaign promise for your leaders in {locationValue}.
                    </p>
                    <Button>Log First Promise</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {promises.map((promise) => (
                        <PromiseCard key={promise.id} promise={promise} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PromisesGrid;
