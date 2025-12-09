import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { OfficeHolder } from '@/types/governance';

// Minimal interface for join data
interface ClaimRequest extends OfficeHolder {
    position: {
        title: string;
        country_code: string;
        jurisdiction_name: string;
    };
    user: {
        id: string;
        full_name: string;
        email?: string;
    };
}

export function PositionVerification() {
    const { user, profile } = useAuth();
    const [pendingClaims, setPendingClaims] = useState<ClaimRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Check Admin Access - use is_platform_admin column
    const isAdmin = profile?.is_platform_admin === true || profile?.role === 'admin';

    useEffect(() => {
        if (!isAdmin) return;
        fetchClaims();
    }, [isAdmin]);

    const fetchClaims = async () => {
        setIsLoading(true);
        // Fetch pending claims with position and user profile info
        const { data, error } = await supabase
            .from('office_holders')
            .select(`
                *,
                position:government_positions(title, country_code, jurisdiction_name),
                user:profiles!user_id(id, full_name, email)
            `)
            .eq('verification_status', 'pending')
            .order('claimed_at', { ascending: false });

        if (error) {
            console.error('Fetch claims error:', error);
            toast.error('Failed to load claims');
        } else {
            setPendingClaims(data as unknown as ClaimRequest[]);
        }
        setIsLoading(false);
    };

    const handleVerdict = async (claimId: string, verdict: 'verified' | 'rejected') => {
        const { error } = await supabase
            .from('office_holders')
            .update({
                verification_status: verdict,
                verified_by: user?.id,
                verified_at: new Date().toISOString(),
                is_active: verdict === 'verified', // Only active if verified
            })
            .eq('id', claimId);

        if (error) {
            toast.error('Failed to update claim');
        } else {
            toast.success(`Claim ${verdict} successfully`);
            setPendingClaims(prev => prev.filter(c => c.id !== claimId));
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-8 text-center text-red-500">
                Access Denied. Admins only.
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Admin Verification Dashboard</h1>
                <Button onClick={fetchClaims} variant="outline" size="sm">Refresh</Button>
            </div>

            <Tabs defaultValue="claims">
                <TabsList>
                    <TabsTrigger value="claims">
                        Position Claims
                        {pendingClaims.length > 0 && <Badge variant="secondary" className="ml-2">{pendingClaims.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="templates">Governance Templates</TabsTrigger>
                </TabsList>

                {/* CLAIM VERIFICATION */}
                <TabsContent value="claims" className="space-y-4">
                    {isLoading ? (
                        <p>Loading claims...</p>
                    ) : pendingClaims.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No pending claims to review.
                            </CardContent>
                        </Card>
                    ) : (
                        pendingClaims.map((claim) => (
                            <Card key={claim.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between">
                                        <div>
                                            <CardTitle>{claim.position.title}</CardTitle>
                                            <CardDescription>
                                                {claim.position.jurisdiction_name} • Applicant: <span className="font-semibold text-foreground">{claim.user?.full_name || 'Unknown User'}</span>
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="h-6">
                                            {claim.position.country_code}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Method:</span> {claim.verification_method}
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Date:</span> {new Date(claim.claimed_at).toLocaleDateString()}
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Proof:</span>
                                            {claim.proof_documents?.document_url ? (
                                                <a href={claim.proof_documents.document_url} target="_blank" rel="noreferrer" className="text-blue-600 underline ml-2 hover:text-blue-800">
                                                    View Document
                                                </a>
                                            ) : (
                                                <span className="ml-2 italic text-muted-foreground">No URL provided</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                        <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleVerdict(claim.id, 'rejected')}>
                                            <X className="w-4 h-4 mr-2" /> Reject
                                        </Button>
                                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleVerdict(claim.id, 'verified')}>
                                            <Check className="w-4 h-4 mr-2" /> Approve & Verify
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* TEMPLATE VERIFICATION (Placeholder for now) */}
                <TabsContent value="templates">
                    <Card>
                        <CardHeader>
                            <CardTitle>Governance Templates Review</CardTitle>
                            <CardDescription>Review new country structures submitted by the community.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                            No pending templates. (Feature coming pending GovernanceBuilder)
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
