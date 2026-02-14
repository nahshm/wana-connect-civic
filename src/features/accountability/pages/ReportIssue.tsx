import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { aiClient, RoutingResult } from '@/services/aiClient';
import {
    Droplet,
    Car,
    Trash2,
    Lightbulb,
    Shield,
    Home,
    AlertCircle,
    Building,
    ArrowLeft,
    MapPin,
    Camera
} from 'lucide-react';

const ReportIssue = () => {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [description, setDescription] = useState('');
    const [locationText, setLocationText] = useState('');
    const [locationCoords, setLocationCoords] = useState<{lat: number; lng: number} | undefined>(undefined);
    const [photos, setPhotos] = useState<string[]>([]); // Future: Store URLs
    const [loading, setLoading] = useState(false);
    
    // AI State
    const [routing, setRouting] = useState<RoutingResult | null>(null);
    const [routingLoading, setRoutingLoading] = useState(false);

    // Get user location
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast({ title: "Error", description: "Geolocation is not supported by your browser", variant: "destructive" });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocationCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                toast({ title: "Location Captured", description: "Coordinates attached to report." });
            },
            (error) => {
                toast({ title: "Error", description: "Unable to retrieve location", variant: "destructive" });
            }
        );
    };

    const handleRouteIssue = async () => {
        if (!user) {
            authModal.open('login');
            return;
        }
        if (!description.trim()) {
            toast({ title: "Required", description: "Please describe the issue first.", variant: "destructive" });
            return;
        }

        setRoutingLoading(true);
        try {
            // Get user profile for location context if available
            const { data: profile } = await supabase
                .from('profiles')
                .select('ward, constituency, county') // Assuming these fields exist or are joined
                .eq('id', user.id)
                .single();

            const locationContext = {
                lat: locationCoords?.lat,
                lng: locationCoords?.lng,
                text: locationText,
                ward: (profile as any)?.ward || undefined, // Fallbacks
                constituency: (profile as any)?.constituency || undefined,
                county: (profile as any)?.county || 'Nairobi'
            };

            const result = await aiClient.routing(description, locationContext, photos);
            setRouting(result);
            
        } catch (error) {
            console.error('Routing failed:', error);
            toast({ title: "AI Routing Failed", description: "Could not classify issue. Please try again.", variant: "destructive" });
        } finally {
            setRoutingLoading(false);
        }
    };

    const handleConfirmSubmit = async () => {
        if (!user || !routing) return;
        setLoading(true);

        try {
            // Map AI result to database columns
            // Table: civic_actions
            const { data: action, error } = await supabase
                .from('civic_actions')
                .insert({
                    user_id: user.id,
                    action_type: 'report_issue',
                    title: description.substring(0, 50) + '...', // Generate title from desc
                    description: description,
                    location_text: locationText || 'Pinned Location',
                    // AI Fields
                    category: routing.issue_type, // Use issue_type as category
                    action_level: routing.jurisdiction,
                    issue_type: routing.issue_type,
                    jurisdiction: routing.jurisdiction,
                    severity: routing.severity,
                    ai_routing_confidence: routing.confidence,
                    estimated_resolution_days: routing.estimated_resolution_days,
                    // urgency: Map severity to low/medium/high ??
                    urgency: routing.severity >= 7 ? 'high' : routing.severity >= 4 ? 'medium' : 'low'
                })
                .select()
                .single();

            if (error) throw error;

            toast({
                title: "Report Submitted Successfully",
                description: `Ticket #${action.case_number || action.id.substring(0,8)} routed to ${routing.department_name}.`,
            });
            
            navigate('/dashboard');

        } catch (error) {
            console.error('Error submitting report:', error);
            toast({ title: "Submission Failed", description: "Could not save report.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-6 h-6" />
                        Report an Issue (AI Assisted)
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Describe the problem usage and our AI will route it to the correct department.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Step 1: Input */}
                    {!routing && (
                        <div className="space-y-4">
                            <div>
                                <Label>Describe the Issue</Label>
                                <Textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g. Broken streetlight on Moxie Avenue causing safety concerns..."
                                    rows={4}
                                />
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Location</Label>
                                    <Input 
                                        value={locationText}
                                        onChange={(e) => setLocationText(e.target.value)}
                                        placeholder="Specific landmark or street name"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={handleGetLocation}
                                        className="w-full gap-2"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        {locationCoords ? "Location Captured" : "Use GPS"}
                                    </Button>
                                </div>
                            </div>

                            <Button 
                                onClick={handleRouteIssue} 
                                disabled={routingLoading || !description}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {routingLoading ? "Analyzing & Routing..." : "Route Issue"}
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Review Routing */}
                    {routing && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 p-6">
                                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                    <Building className="w-5 h-5" />
                                    Routed to: {routing.department_name}
                                </h3>

                                <div className="grid grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Jurisdiction</p>
                                        <p className="font-medium capitalize">{routing.jurisdiction}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Issue Type</p>
                                        <p className="font-medium capitalize">{routing.issue_type.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Severity</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2.5 w-24 rounded-full bg-gray-200 overflow-hidden`}>
                                                <div 
                                                    className={`h-full ${routing.severity >= 7 ? 'bg-red-500' : routing.severity >= 4 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                                    style={{ width: `${routing.severity * 10}%` }}
                                                />
                                            </div>
                                            <span className="font-bold">{routing.severity}/10</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Est. Resolution</p>
                                        <p className="font-medium">{routing.estimated_resolution_days || 7} Days</p>
                                    </div>
                                </div>

                                {routing.required_forms && routing.required_forms.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Required Actions:</p>
                                        <ul className="list-disc pl-5 text-sm text-gray-600">
                                            {routing.required_forms.map(form => (
                                                <li key={form.form_id}>{form.form_name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                <p className="text-xs text-muted-foreground mt-4">
                                    AI Confidence: {Math.round(routing.confidence * 100)}%
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    onClick={handleConfirmSubmit} 
                                    disabled={loading}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {loading ? "Submitting Report..." : "Confirm & Submit Report"}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setRouting(null)}
                                    disabled={loading}
                                >
                                    Edit Details
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportIssue;
