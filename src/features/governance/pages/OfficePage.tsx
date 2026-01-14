import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
    Shield,
    CheckCircle,
    Clock,
    MapPin,
    Calendar,
    MessageSquare,
    FileText,
    Users,
    TrendingUp,
    ExternalLink,
    Mail,
    Phone,
    Building,
    Award,
    Target,
    AlertCircle,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import { toast } from 'sonner';

// UUID validation regex for security
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface OfficeHolderData {
    id: string;
    user_id: string;
    position_id: string;
    term_start: string;
    term_end: string;
    verification_status: 'pending' | 'verified' | 'rejected';
    created_at: string;
    profile?: {
        id: string;
        username: string;
        display_name: string;
        avatar_url?: string;
        bio?: string;
    };
    position?: {
        id: string;
        title: string;
        governance_level: string;
        country_code: string;
        jurisdiction_name?: string;
    };
}

interface Promise {
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    deadline: string;
    created_at: string;
}

interface Question {
    id: string;
    question: string;
    answer?: string;
    asked_by: string;
    asked_at: string;
    answered_at?: string;
}

export default function OfficePage() {
    const location = useLocation();
    const { user } = useAuth();

    // Securely extract and validate ID from pathname
    const id = useMemo(() => {
        const rawId = location.pathname.split('/')[2];
        // Validate UUID format to prevent injection attempts
        return rawId && UUID_REGEX.test(rawId) ? rawId : null;
    }, [location.pathname]);

    const [officeHolder, setOfficeHolder] = useState<OfficeHolderData | null>(null);
    const [promises, setPromises] = useState<Promise[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    const isOwner = user?.id === officeHolder?.user_id;

    useEffect(() => {
        const fetchOfficeData = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {

                // Fetch office holder with profile and position
                // Note: Must specify FK name because office_holders has TWO FKs to profiles (user_id AND verified_by)
                const { data: holderData, error: holderError } = await supabase
                    .from('office_holders')
                    .select(`
                        *,
                        profiles!office_holders_user_id_fkey(id, username, display_name, avatar_url, bio),
                        government_positions(id, title, governance_level, country_code, jurisdiction_name)
                    `)
                    .eq('id', id)
                    .single();

                if (holderError) {
                    // Differentiate between not found vs other errors
                    if (holderError.code === 'PGRST116') {
                        // Record not found - this is expected for invalid IDs
                        setOfficeHolder(null);
                    } else {
                        throw holderError;
                    }
                    return;
                }

                // Transform to expected format
                const transformed = holderData ? {
                    ...holderData,
                    created_at: holderData.claimed_at, // Use claimed_at as fallback
                    profile: holderData.profiles,
                    position: holderData.government_positions
                } : null;

                setOfficeHolder(transformed as any);

                // TODO: Fetch promises when table exists
                // TODO: Fetch questions when table exists

            } catch (error) {
                console.error('Error fetching office data:', error);
                toast.error('Failed to load office page. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOfficeData();
    }, [id]);

    const calculateDaysRemaining = () => {
        if (!officeHolder?.term_end) return null;
        const end = new Date(officeHolder.term_end);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const daysRemaining = calculateDaysRemaining();

    if (loading) {
        return (
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <div className="animate-pulse space-y-6">
                    <div className="h-48 bg-muted rounded-lg" />
                    <div className="h-12 bg-muted rounded w-1/3" />
                    <div className="h-64 bg-muted rounded-lg" />
                </div>
            </div>
        );
    }

    // Show error for invalid UUID format
    if (!id) {
        return (
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <Card>
                    <CardContent className="py-16 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Invalid Office ID</h2>
                        <p className="text-muted-foreground mb-4">The office page URL is not valid.</p>
                        <Button asChild>
                            <Link to="/officials">Browse Officials</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!officeHolder) {
        return (
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <Card>
                    <CardContent className="py-16 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Office Not Found</h2>
                        <p className="text-muted-foreground mb-4">This office page doesn't exist or has been removed.</p>
                        <Button asChild>
                            <Link to="/officials">Browse Officials</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const completedPromises = promises.filter(p => p.status === 'completed').length;
    const promiseCompletionRate = promises.length > 0
        ? Math.round((completedPromises / promises.length) * 100)
        : 0;

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            {/* Header Section */}
            <Card className="mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-civic-green/20 to-civic-blue/20 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                            <AvatarImage src={officeHolder.profile?.avatar_url} />
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                {officeHolder.profile?.display_name?.[0] || 'O'}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold">
                                    {officeHolder.profile?.display_name || 'Unknown Official'}
                                </h1>
                                {officeHolder.verification_status === 'verified' && (
                                    <Badge className="bg-civic-green">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Verified
                                    </Badge>
                                )}
                            </div>

                            <p className="text-lg text-muted-foreground mb-2">
                                {officeHolder.position?.title || 'Government Official'}
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {officeHolder.position?.jurisdiction_name && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {officeHolder.position.jurisdiction_name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Term: {new Date(officeHolder.term_start).toLocaleDateString()} - {new Date(officeHolder.term_end).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Term Countdown */}
                        {daysRemaining !== null && daysRemaining > 0 && (
                            <Card className="bg-background/80 backdrop-blur">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-primary">{daysRemaining}</div>
                                    <div className="text-xs text-muted-foreground">days remaining</div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x border-t">
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold">{promiseCompletionRate}%</div>
                        <div className="text-xs text-muted-foreground">Promises Kept</div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold">{questions.filter(q => q.answer).length}/{questions.length}</div>
                        <div className="text-xs text-muted-foreground">Questions Answered</div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-xs text-muted-foreground">Projects</div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold">-</div>
                        <div className="text-xs text-muted-foreground">Citizen Rating</div>
                    </div>
                </div>
            </Card>

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="overview" className="gap-2">
                        <Building className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="promises" className="gap-2">
                        <Target className="h-4 w-4" />
                        Promises ({promises.length})
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Q&A ({questions.length})
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Projects
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Activity
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Bio Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">About</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    {officeHolder.profile?.bio || 'No biography provided yet.'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Contact Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Official email not provided</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Office phone not provided</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">No official website</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Report Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Award className="h-5 w-5 text-primary" />
                                Performance Report Card
                            </CardTitle>
                            <CardDescription>
                                Transparency metrics based on public activity
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Promise Completion</span>
                                    <span className="font-medium">{promiseCompletionRate}%</span>
                                </div>
                                <Progress value={promiseCompletionRate} className="h-2" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Citizen Response Rate</span>
                                    <span className="font-medium">
                                        {questions.length > 0
                                            ? Math.round((questions.filter(q => q.answer).length / questions.length) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <Progress
                                    value={questions.length > 0
                                        ? (questions.filter(q => q.answer).length / questions.length) * 100
                                        : 0}
                                    className="h-2"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Project Transparency</span>
                                    <span className="font-medium">-</span>
                                </div>
                                <Progress value={0} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Promises Tab */}
                <TabsContent value="promises" className="space-y-6">
                    {isOwner && (
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium">Add a Public Promise</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Commit to something and let citizens track your progress
                                    </p>
                                </div>
                                <Button>Add Promise</Button>
                            </CardContent>
                        </Card>
                    )}

                    {promises.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="font-medium mb-2">No Promises Yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    This official hasn't made any public commitments yet.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {promises.map((promise) => (
                                <Card key={promise.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-medium">{promise.title}</h4>
                                                <Badge variant="outline" className="mt-1">{promise.category}</Badge>
                                            </div>
                                            <Badge variant={
                                                promise.status === 'completed' ? 'default' :
                                                    promise.status === 'failed' ? 'destructive' :
                                                        'secondary'
                                            }>
                                                {promise.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{promise.description}</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Progress</span>
                                                <span>{promise.progress}%</span>
                                            </div>
                                            <Progress value={promise.progress} className="h-2" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Q&A Tab */}
                <TabsContent value="questions" className="space-y-6">
                    {/* Ask Question Form */}
                    {user && !isOwner && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Ask a Question</CardTitle>
                                <CardDescription>
                                    Your question will be public. The official can respond publicly.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    placeholder="What would you like to ask this official?"
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    className="mb-4"
                                />
                                <Button disabled={!newQuestion.trim()}>
                                    Submit Question
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {questions.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="font-medium mb-2">No Questions Yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    Be the first to ask this official a question!
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((q) => (
                                <Card key={q.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1">
                                                <p className="font-medium">{q.question}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Asked {new Date(q.asked_at).toLocaleDateString()}
                                                </p>
                                                {q.answer && (
                                                    <div className="mt-4 pl-4 border-l-2 border-primary">
                                                        <p className="text-sm">{q.answer}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Answered {new Date(q.answered_at!).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {!q.answer && (
                                                <Badge variant="outline" className="shrink-0">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-6">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium mb-2">Projects Coming Soon</h3>
                            <p className="text-sm text-muted-foreground">
                                Government projects linked to this office will appear here.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-6">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium mb-2">Activity Feed Coming Soon</h3>
                            <p className="text-sm text-muted-foreground">
                                Posts, updates, and actions by this official will appear here.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
