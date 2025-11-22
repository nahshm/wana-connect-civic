import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Lock, Eye } from 'lucide-react';

interface CommunityPreviewProps {
    data: {
        name: string;
        description: string;
        visibility_type: 'public' | 'restricted' | 'private';
        is_mature: boolean;
        banner_url: string;
        avatar_url: string;
    };
}

export const CommunityPreview = ({ data }: CommunityPreviewProps) => {
    const getVisibilityIcon = () => {
        switch (data.visibility_type) {
            case 'private': return Lock;
            case 'restricted': return Eye;
            default: return Globe;
        }
    };

    const VisibilityIcon = getVisibilityIcon();
    const displayName = data.name || 'communityname';
    const displayDesc = data.description || 'Your community description will appear here...';

    return (
        <div className="space-y-3">
            <div className="text-center mb-4">
                <h3 className="text-base font-semibold">Live Preview</h3>
                <p className="text-xs text-muted-foreground">See how your community will look</p>
            </div>

            <Card className="overflow-hidden">
                <div
                    className="h-24 bg-cover bg-center"
                    style={{
                        backgroundImage: data.banner_url
                            ? `url(${data.banner_url})`
                            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 100%)'
                    }}
                />

                <div className="relative px-3 pb-3">
                    <div className="absolute -top-10 left-3">
                        <Avatar className="w-16 h-16 border-4 border-background">
                            {data.avatar_url ? (
                                <AvatarImage src={data.avatar_url} />
                            ) : (
                                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                                    {displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            )}
                        </Avatar>
                    </div>

                    <div className="pt-8">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            c/{displayName}
                            {data.is_mature && <Badge variant="destructive" className="text-xs">18+</Badge>}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <VisibilityIcon className="w-3 h-3" />
                            <span className="capitalize">{data.visibility_type}</span>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs">About Community</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-3">{displayDesc}</p>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t">
                        <div>
                            <div className="font-bold text-sm">0</div>
                            <div className="text-xs text-muted-foreground">Members</div>
                        </div>
                        <div>
                            <div className="font-bold text-sm flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />0
                            </div>
                            <div className="text-xs text-muted-foreground">Online</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs">c/{displayName} Rules</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        No rules yet. Add rules after creating.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
