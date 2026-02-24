import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SkillsEndorsementPanelProps {
    userId: string;
    isOwnProfile: boolean;
}

export const SkillsEndorsementPanel: React.FC<SkillsEndorsementPanelProps> = ({ userId, isOwnProfile }) => {
    const queryClient = useQueryClient();
    const [verifyingSkill, setVerifyingSkill] = useState<string | null>(null);

    // Fetch skills and endorsements
    const { data: skills, isLoading } = useQuery({
        queryKey: ['resume-skills', userId],
        queryFn: async () => {
            // First get user skills
            const { data: userSkills, error: skillsError } = await supabase
                .from('user_skills')
                .select('*')
                .eq('user_id', userId)
                .order('endorsement_count', { ascending: false });

            if (skillsError) throw skillsError;

            // Get current user's endorsements for this profile
            const { data: authUser } = await supabase.auth.getUser();
            const currentUserId = authUser?.user?.id;

            let myEndorsements: string[] = [];
            if (currentUserId && currentUserId !== userId) {
                const { data: endData, error: endError } = await supabase
                    .from('skill_endorsements')
                    .select('skill_id')
                    .eq('endorser_id', currentUserId)
                    .eq('endorsed_user_id', userId);
                
                if (!endError && endData) {
                    myEndorsements = endData.map(e => e.skill_id);
                }
            }

            return {
                skills: userSkills || [],
                myEndorsements
            };
        },
        enabled: !!userId,
    });

    const endorseSkillMutation = useMutation({
        mutationFn: async (skillId: string) => {
            const { data: authUser } = await supabase.auth.getUser();
            if (!authUser?.user?.id) throw new Error("Must be logged in to endorse");
            
            setVerifyingSkill(skillId);

            // Using our RPC or just direct insert depending on RLS. We'll use insert.
            const { error } = await supabase
                .from('skill_endorsements')
                .insert({
                    endorser_id: authUser.user.id,
                    endorsed_user_id: userId,
                    skill_id: skillId,
                    credibility_score: 1 // Default
                });

            if (error) {
                if (error.code === '23505') throw new Error("Already endorsed this skill");
                throw error;
            }
        },
        onSuccess: () => {
            toast.success("Skill endorsed successfully!");
            queryClient.invalidateQueries({ queryKey: ['resume-skills', userId] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to endorse skill");
        },
        onSettled: () => {
            setVerifyingSkill(null);
        }
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!skills?.skills.length && isOwnProfile) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        Skills & Expertise
                    </CardTitle>
                    <CardDescription>
                        You haven't added any skills yet. Adding skills helps others know what you excel at.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Add Skills
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!skills?.skills.length) {
        return null; // Don't show empty skills panel for visitors
    }

    return (
        <Card>
            <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Skills & Endorsements
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex flex-wrap gap-3">
                    {skills.skills.map((skill) => {
                        const hasEndorsed = skills.myEndorsements.includes(skill.id);
                        const isEndorsing = verifyingSkill === skill.id;

                        return (
                            <div key={skill.id} className="flex items-center bg-muted/30 border border-border/50 rounded-full pl-3 pr-1 py-1 group transition-colors hover:border-primary/50">
                                <span className="text-sm font-medium mr-2">{skill.skill_name}</span>
                                
                                <Badge 
                                    variant="secondary" 
                                    className={`px-1.5 min-w-[24px] flex justify-center ${skill.endorsement_count > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                                >
                                    {skill.endorsement_count}
                                </Badge>

                                {!isOwnProfile && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`w-6 h-6 ml-1 rounded-full transition-all ${
                                            hasEndorsed ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600' : 
                                            'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary hover:bg-primary/10'
                                        }`}
                                        disabled={hasEndorsed || isEndorsing}
                                        onClick={() => endorseSkillMutation.mutate(skill.id)}
                                        title={hasEndorsed ? "You endorsed this" : "Endorse skill"}
                                    >
                                        {hasEndorsed ? (
                                            <Check className="w-3.5 h-3.5" />
                                        ) : isEndorsing ? (
                                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Plus className="w-3.5 h-3.5" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
