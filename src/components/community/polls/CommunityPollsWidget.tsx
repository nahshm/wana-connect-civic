import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BarChart2, Plus, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CreatePollDialog } from './CreatePollDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface CommunityPollsWidgetProps {
    communityId: string;
    isAdmin: boolean;
}

export const CommunityPollsWidget: React.FC<CommunityPollsWidgetProps> = ({ communityId, isAdmin }) => {
    const [polls, setPolls] = useState<any[]>([]);
    const [userVotes, setUserVotes] = useState<Record<string, number>>({});
    const [pollResults, setPollResults] = useState<Record<string, number[]>>({}); // pollId -> [countValidOption0, countValidOption1...]
    const [loading, setLoading] = useState(true);
    const [createPollOpen, setCreatePollOpen] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchPolls = async () => {
        try {
            const { data: pollsData, error } = await supabase
                .from('community_polls')
                .select('*')
                .eq('community_id', communityId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(3);

            if (error) throw error;

            if (!pollsData || pollsData.length === 0) {
                setPolls([]);
                return;
            }

            setPolls(pollsData);

            // Fetch user votes
            if (user) {
                const pollIds = pollsData.map(p => p.id);
                const { data: votesData } = await supabase
                    .from('community_poll_votes')
                    .select('poll_id, option_index')
                    .in('poll_id', pollIds)
                    .eq('user_id', user.id);

                const votesMap: Record<string, number> = {};
                votesData?.forEach((v: any) => {
                    votesMap[v.poll_id] = v.option_index;
                });
                setUserVotes(votesMap);

                // Fetch aggregation (simplified: fetch all votes for these polls)
                // For scalability, this should be a stored procedure or view, but safe for < 1000 votes
                const { data: allVotes } = await supabase
                    .from('community_poll_votes')
                    .select('poll_id, option_index')
                    .in('poll_id', pollIds);

                const resultsMap: Record<string, number[]> = {};
                pollsData.forEach(p => {
                    resultsMap[p.id] = new Array(p.options.length).fill(0);
                });

                allVotes?.forEach((v: any) => {
                    if (resultsMap[v.poll_id]) {
                        resultsMap[v.poll_id][v.option_index]++;
                    }
                });
                setPollResults(resultsMap);
            }
        } catch (error) {
            console.error('Error fetching polls:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolls();
    }, [communityId, user]);

    const handleVote = async (pollId: string, optionIndex: number) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('community_poll_votes')
                .insert({
                    poll_id: pollId,
                    user_id: user.id,
                    option_index: optionIndex
                });

            if (error) throw error;

            toast({
                title: 'Vote recorded',
                description: 'Thanks for voting!',
            });

            fetchPolls(); // Refresh to show results
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to vote',
                variant: 'destructive',
            });
        }
    };

    if (loading) return null;

    return (
        <>
            <Card className="bg-sidebar-background border-sidebar-border">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase text-sidebar-muted-foreground flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" />
                        Active Polls
                    </CardTitle>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setCreatePollOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                    {polls.length === 0 ? (
                        <div className="text-sm text-sidebar-muted-foreground text-center py-4">
                            No active polls.
                            {isAdmin && <div className="mt-2 text-xs text-primary cursor-pointer" onClick={() => setCreatePollOpen(true)}>Create one?</div>}
                        </div>
                    ) : (
                        polls.map(poll => {
                            const hasVoted = userVotes.hasOwnProperty(poll.id);
                            const totalVotes = pollResults[poll.id]?.reduce((a, b) => a + b, 0) || 0;

                            return (
                                <div key={poll.id} className="space-y-3 pb-4 border-b border-sidebar-border last:border-0 last:pb-0">
                                    <h3 className="font-semibold text-sm">{poll.question}</h3>

                                    {!hasVoted ? (
                                        <RadioGroup onValueChange={(val) => handleVote(poll.id, parseInt(val))}>
                                            <div className="space-y-2">
                                                {poll.options.map((option: string, idx: number) => (
                                                    <div key={idx} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={idx.toString()} id={`poll-${poll.id}-${idx}`} />
                                                        <Label htmlFor={`poll-${poll.id}-${idx}`} className="text-sm cursor-pointer font-normal">
                                                            {option}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </RadioGroup>
                                    ) : (
                                        <div className="space-y-2">
                                            {poll.options.map((option: string, idx: number) => {
                                                const count = pollResults[poll.id]?.[idx] || 0;
                                                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                                const isWinner = totalVotes > 0 && count === Math.max(...pollResults[poll.id]);
                                                const isUserChoice = userVotes[poll.id] === idx;

                                                return (
                                                    <div key={idx} className="space-y-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span className={`flex items-center gap-1 ${isWinner ? 'font-bold text-primary' : ''}`}>
                                                                {option}
                                                                {isUserChoice && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                                            </span>
                                                            <span>{percentage}%</span>
                                                        </div>
                                                        <Progress value={percentage} className="h-2" />
                                                    </div>
                                                );
                                            })}
                                            <div className="text-xs text-sidebar-muted-foreground text-right mt-1">
                                                {totalVotes} votes
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>

            <CreatePollDialog
                isOpen={createPollOpen}
                onClose={() => setCreatePollOpen(false)}
                communityId={communityId}
                onPollCreated={fetchPolls}
            />
        </>
    );
};
