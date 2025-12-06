import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, PlusCircle, AlertCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VerificationPanel from '@/components/verification/VerificationPanel';
import { useVerification } from '@/hooks/useVerification';

interface Promise {
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

const PromisesGrid: React.FC<PromisesGridProps> = ({ levelType, locationValue }) => {
    const [promises, setPromises] = useState<Promise[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPromises();
    }, [levelType, locationValue]);

    const fetchPromises = async () => {
        try {
            setLoading(true);
            const levelColumn = levelType.toLowerCase();

            const { data, error } = await supabase
                .from('development_promises')
                .select(`
          *,
          official:officials(id, name, position, photo_url)
        `)
                .eq(levelColumn, locationValue)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPromises(data || []);
        } catch (error) {
            console.error('Error fetching promises:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'KEPT':
                return 'border-emerald-500 text-emerald-600 bg-emerald-50';
            case 'ongoing':
            case 'IN_PROGRESS':
                return 'border-yellow-500 text-yellow-600 bg-yellow-50';
            case 'cancelled':
            case 'BROKEN':
                return 'border-red-500 text-red-600 bg-red-50';
            default:
                return 'border-slate-500 text-slate-600 bg-slate-50';
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-slate-200 p-5 animate-pulse">
                        <div className="h-24 bg-slate-200 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <FileText className="mr-3 h-8 w-8 text-purple-600" />
                        Promise Tracker
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
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
                    <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold mb-2">No Promises Tracked</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Be the first to log a campaign promise for your leaders.
                    </p>
                    <Button>Log First Promise</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {promises.map((promise) => {
                        const { verification, castVote, isCastingVote } = useVerification({
                            contentId: promise.id,
                            contentType: 'promise',
                        });

                        return (
                            <div
                                key={promise.id}
                                className="bg-card rounded-lg p-5 border border-border shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/pr/${promise.id}`)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center mb-2 gap-2">
                                        {promise.official && (
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                {promise.official.name}
                                            </span>
                                        )}
                                        <Badge className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(promise.status)}`}>
                                            {promise.status}
                                        </Badge>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{promise.title}</h3>
                                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{promise.description}</p>

                                    {/* Progress */}
                                    {promise.progress_percentage !== undefined && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-500">Progress</span>
                                                <span className="font-bold">{promise.progress_percentage}%</span>
                                            </div>
                                            <Progress value={promise.progress_percentage} className="h-2" />
                                        </div>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        {promise.beneficiaries_count && (
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                <span>{promise.beneficiaries_count.toLocaleString()} beneficiaries</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Verification Panel */}
                                <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                    <VerificationPanel
                                        verification={verification}
                                        onVote={castVote}
                                        isLoading={isCastingVote}
                                        isExpanded={true}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PromisesGrid;
