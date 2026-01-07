import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, MapPin, Star, Shield, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const MyCommunitiesPage = () => {
    const { user, profile } = useAuth();

    // Fetch all communities the user is a member of
    const { data: memberCommunities, isLoading, error, refetch } = useQuery({
        queryKey: ['my-communities', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('community_members')
                .select(`
          joined_at,
          role,
          communities (
            id,
            name,
            description,
            member_count,
            category,
            icon_url,
            banner_url
          )
        `)
                .eq('user_id', user.id)
                .order('joined_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!user?.id,
        retry: 2,
    });

    // Fetch communities where user is a moderator
    const { data: moderatedCommunities } = useQuery({
        queryKey: ['moderated-communities', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('community_moderators')
                .select(`
          communities (
            id,
            name,
            description,
            member_count
          )
        `)
                .eq('user_id', user?.id);

            if (error) throw error;
            return data || [];
        },
        enabled: !!user?.id,
    });

    // Extract location-based communities
    const locationCommunities = memberCommunities?.filter((m: any) =>
        m.communities?.category === 'location' ||
        m.communities?.name?.includes(profile?.county) ||
        m.communities?.name?.includes(profile?.constituency) ||
        m.communities?.name?.includes(profile?.ward)
    ) || [];

    // Extract interest-based communities
    const interestCommunities = memberCommunities?.filter((m: any) =>
        m.communities?.category !== 'location' &&
        !m.communities?.name?.includes(profile?.county) &&
        !m.communities?.name?.includes(profile?.constituency) &&
        !m.communities?.name?.includes(profile?.ward)
    ) || [];

    if (isLoading) {
        return (
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    // Error state with retry
    if (error) {
        return (
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load communities</AlertTitle>
                    <AlertDescription>
                        We couldn't load your communities. Please check your connection and try again.
                    </AlertDescription>
                </Alert>
                <div className="mt-4 flex gap-2">
                    <Button onClick={() => refetch()} variant="outline">
                        Retry
                    </Button>
                    <Button asChild variant="default">
                        <Link to="/communities">Browse All Communities</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Communities</h1>
                <p className="text-muted-foreground">
                    All communities you're part of, organized by type
                </p>
            </div>

            {/* Location Communities */}
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-semibold">Location Communities</h2>
                    <Badge variant="secondary">{locationCommunities.length}</Badge>
                </div>

                {locationCommunities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {locationCommunities.map((member: any) => (
                            <Link key={member.communities.id} to={`/c/${member.communities.name}`}>
                                <Card className="hover:border-primary/50 transition-colors h-full">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-lg">c/{member.communities.name}</CardTitle>
                                            {member.role === 'moderator' && (
                                                <Badge variant="outline">
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Mod
                                                </Badge>
                                            )}
                                        </div>
                                        {member.communities.description && (
                                            <CardDescription className="line-clamp-2">
                                                {member.communities.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Users className="h-4 w-4 mr-1" />
                                            {member.communities.member_count || 0} members
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium mb-2">No Location Communities</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                You're not part of any location-based communities yet
                            </p>
                            <Button asChild variant="outline">
                                <Link to="/communities">Explore Communities</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Interest Communities */}
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-semibold">Interest Communities</h2>
                    <Badge variant="secondary">{interestCommunities.length}</Badge>
                </div>

                {interestCommunities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {interestCommunities.map((member: any) => (
                            <Link key={member.communities.id} to={`/c/${member.communities.name}`}>
                                <Card className="hover:border-primary/50 transition-colors h-full">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-lg">c/{member.communities.name}</CardTitle>
                                            {member.role === 'moderator' && (
                                                <Badge variant="outline">
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Mod
                                                </Badge>
                                            )}
                                        </div>
                                        {member.communities.description && (
                                            <CardDescription className="line-clamp-2">
                                                {member.communities.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Users className="h-4 w-4 mr-1" />
                                            {member.communities.member_count || 0} members
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium mb-2">No Interest Communities</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Join communities based on your interests to get started
                            </p>
                            <Button asChild variant="outline">
                                <Link to="/communities">Browse Communities</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Moderated Communities */}
            {moderatedCommunities && moderatedCommunities.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5 text-primary" />
                        <h2 className="text-2xl font-semibold">Communities I Moderate</h2>
                        <Badge variant="secondary">{moderatedCommunities.length}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {moderatedCommunities.map((mod: any) => (
                            <Link key={mod.communities.id} to={`/c/${mod.communities.name}`}>
                                <Card className="hover:border-primary/50 transition-colors h-full">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            c/{mod.communities.name}
                                            <Badge variant="default">Moderator</Badge>
                                        </CardTitle>
                                        {mod.communities.description && (
                                            <CardDescription className="line-clamp-2">
                                                {mod.communities.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Users className="h-4 w-4 mr-1" />
                                            {mod.communities.member_count || 0} members
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};
