import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Phone, Mail, ExternalLink } from 'lucide-react';

interface Official {
    id: string;
    name: string;
    position: string;
    photo_url?: string;
    email?: string;
    phone?: string;
    office?: string;
    party?: string;
}

interface LeadersGridProps {
    levelType: 'COUNTY' | 'CONSTITUENCY' | 'WARD';
    locationValue: string;
}

const LeadersGrid: React.FC<LeadersGridProps> = ({ levelType, locationValue }) => {
    const [officials, setOfficials] = useState<Official[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOfficials();
    }, [levelType, locationValue]);

    const fetchOfficials = async () => {
        try {
            setLoading(true);
            // Map level type to database column
            const levelColumn = levelType.toLowerCase();

            const { data, error } = await supabase
                .from('officials')
                .select('*')
                .eq(levelColumn, locationValue)
                .order('position');

            if (error) throw error;
            setOfficials(data || []);
        } catch (error) {
            console.error('Error fetching officials:', error);
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

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-20 bg-slate-200 rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (officials.length === 0) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-semibold mb-2">No Officials Found</h3>
                        <p className="text-sm text-muted-foreground">
                            No elected officials registered for this {levelType.toLowerCase()}.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Users className="mr-3 h-8 w-8 text-blue-600" />
                        Our Leaders
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Elected officials for {locationValue}
                    </p>
                </div>
                <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View All Officials
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {officials.map((official) => (
                    <Card key={official.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <Avatar className="w-16 h-16">
                                    <AvatarImage src={official.photo_url} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {getInitials(official.name)}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Info */}
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-900 mb-1">{official.name}</h3>
                                    <p className="text-sm text-slate-600 mb-2">{official.position}</p>

                                    {official.party && (
                                        <Badge variant="secondary" className="mb-3">{official.party}</Badge>
                                    )}

                                    {/* Contact Info */}
                                    <div className="space-y-1 text-sm text-slate-600">
                                        {official.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3" />
                                                <span className="text-xs">{official.email}</span>
                                            </div>
                                        )}
                                        {official.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3" />
                                                <span className="text-xs">{official.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mock Approval Rating */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Approval Rating</span>
                                            <span className="font-bold">65%</span>
                                        </div>
                                        <Progress value={65} className="h-2" />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" size="sm" className="flex-1 text-xs">
                                            Log Promise
                                        </Button>
                                        <Button variant="outline" size="sm" className="flex-1 text-xs">
                                            Review
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default LeadersGrid;
