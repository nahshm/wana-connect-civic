import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, ShieldCheck, Vote, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GovernmentPosition, OfficeHolder } from '@/types/governance';
import { ClaimPositionModal } from '@/components/governance/ClaimPositionModal';

interface PositionWithHolder extends GovernmentPosition {
    current_holder?: {
        id: string;
        user_id: string;
        term_start: string;
        term_end: string;
        verification_status: string;
        user?: {
            id: string;
            display_name: string;
            avatar_url?: string;
        };
    } | null;
}

interface LeadersGridProps {
    levelType: 'COUNTY' | 'CONSTITUENCY' | 'WARD' | 'COMMUNITY';
    locationValue: string;
    communityId?: string; // For membership validation in claim modal
}

const LeadersGrid: React.FC<LeadersGridProps> = ({ levelType, locationValue, communityId }) => {
    const [positions, setPositions] = useState<PositionWithHolder[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Claim modal state
    const [claimModalOpen, setClaimModalOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<{
        id: string;
        title: string;
        governanceLevel: string;
        jurisdictionName: string;
        countryCode: string;
    } | null>(null);

    const handleClaimClick = (position: PositionWithHolder) => {
        setSelectedPosition({
            id: position.id,
            title: position.title,
            governanceLevel: position.governance_level,
            jurisdictionName: position.jurisdiction_name,
            countryCode: position.country_code,
        });
        setClaimModalOpen(true);
    };

    useEffect(() => {
        fetchPositionsAndHolders();
    }, [levelType, locationValue]);

    const fetchPositionsAndHolders = async () => {
        try {
            setLoading(true);

            // Map levelType to governance_level
            const governanceLevel = levelType.toLowerCase();

            // Clean locationValue: remove level suffixes and create flexible match pattern
            const cleanedLocation = locationValue
                .replace(/\s*(county|constituency|ward)\s*$/i, '')  // Remove level suffix
                .trim();

            const jurisdictionCode = cleanedLocation.toLowerCase().replace(/\s+/g, '-');

            console.log('[LeadersGrid] Query params:', {
                governanceLevel,
                jurisdictionCode,
                cleanedLocation,
                originalLocationValue: locationValue
            });

            // Query positions - use flexible matching on jurisdiction_code or jurisdiction_name
            const { data: positionsData, error: posError } = await supabase
                .from('government_positions')
                .select('*')
                .eq('governance_level', governanceLevel)
                .or(`jurisdiction_code.ilike.%${jurisdictionCode}%,jurisdiction_name.ilike.%${cleanedLocation}%`)
                .order('authority_level', { ascending: false });

            console.log('[LeadersGrid] Query result:', { count: positionsData?.length, posError, sample: positionsData?.[0]?.title });

            if (posError) {
                console.error('Error fetching positions:', posError);
                throw posError;
            }

            // For each position, fetch the current active verified holder (if any)
            const positionsWithHolders: PositionWithHolder[] = await Promise.all(
                (positionsData || []).map(async (position) => {
                    const { data: holderData } = await supabase
                        .from('office_holders')
                        .select(`
                            id,
                            user_id,
                            term_start,
                            term_end,
                            verification_status,
                            user:profiles!user_id(id, display_name, avatar_url)
                        `)
                        .eq('position_id', position.id)
                        .eq('is_active', true)
                        .eq('verification_status', 'verified')
                        .single();

                    return {
                        ...position,
                        current_holder: holderData || null
                    };
                })
            );

            setPositions(positionsWithHolders);

        } catch (error) {
            console.error('Error fetching positions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-KE', {
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (positions.length === 0) {
        return (
            <div className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Positions Found</h3>
                <p className="text-muted-foreground">
                    No government positions defined for {locationValue} yet.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    Run the seed migration to populate positions.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        Our Leaders
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Government positions for <span className="font-semibold text-foreground">{locationValue}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positions.map((position) => (
                    <Card
                        key={position.id}
                        className={`hover:shadow-md transition-shadow ${!position.current_holder ? 'border-dashed border-muted-foreground/40 bg-muted/30' : ''
                            }`}
                    >
                        <CardContent className="p-6">
                            {position.current_holder ? (
                                /* OCCUPIED POSITION */
                                <div className="flex items-start gap-4">
                                    <Avatar className="w-14 h-14 border-2 border-primary/20">
                                        <AvatarImage src={position.current_holder.user?.avatar_url} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {getInitials(position.current_holder.user?.display_name || 'UN')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">
                                            {position.title}
                                        </p>
                                        <h3 className="font-bold text-lg truncate">
                                            {position.current_holder.user?.display_name || 'Unknown'}
                                        </h3>
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {/* Verification Status Badge */}
                                            {position.current_holder.verification_status === 'verified' ? (
                                                <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                                    Verified Official
                                                </Badge>
                                            ) : position.current_holder.verification_status === 'pending' ? (
                                                <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-600 dark:text-yellow-400">
                                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                                    Pending Verification
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] border-muted-foreground/40 text-muted-foreground">
                                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                                    Unverified
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="text-[10px]">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {formatDate(position.current_holder.term_start)} - {formatDate(position.current_holder.term_end)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* VACANT POSITION */
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center">
                                        <UserPlus className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                                            {position.title}
                                        </p>
                                        <h3 className="font-bold text-lg text-foreground/70">
                                            Position Vacant
                                        </h3>
                                        <div className="flex gap-2 mt-2 flex-wrap items-center">
                                            <Badge variant="outline" className="text-[10px] border-muted-foreground/40 text-muted-foreground">
                                                Awaiting Claim
                                            </Badge>
                                            {position.next_election_date && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    <Vote className="h-3 w-3 mr-1" />
                                                    Next: {formatDate(position.next_election_date)}
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            className="mt-3"
                                            onClick={() => handleClaimClick(position)}
                                        >
                                            <UserPlus className="h-4 w-4 mr-1" />
                                            Claim This Office
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Claim Position Modal */}
            <ClaimPositionModal
                isOpen={claimModalOpen}
                onClose={() => setClaimModalOpen(false)}
                position={selectedPosition}
                communityId={communityId}
            />
        </div>
    );
};

export default LeadersGrid;

