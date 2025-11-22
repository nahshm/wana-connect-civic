import { Button } from '@/components/ui/button';
import { ImagePlus, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Step3Props {
    data: {
        name: string;
        banner_url: string;
        avatar_url: string;
    };
    onChange: (data: any) => void;
}

export const Step3_Styling = ({ data, onChange }: Step3Props) => {
    const { toast } = useToast();
    const [uploading, setUploading] = useState<'banner' | 'icon' | null>(null);

    const handleImageUpload = async (file: File, type: 'banner' | 'icon') => {
        if (!data.name) {
            toast({
                title: "Error",
                description: "Please set a community name first",
                variant: "destructive"
            });
            return;
        }

        setUploading(type);

        try {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('File size must be less than 5MB');
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('File must be an image');
            }

            const fileExt = file.name.split('.').pop();
            const filePath = `communities/${data.name}/${type}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('community-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('community-assets')
                .getPublicUrl(filePath);

            if (type === 'banner') {
                onChange({ ...data, banner_url: publicUrl });
            } else {
                onChange({ ...data, avatar_url: publicUrl });
            }

            toast({
                title: "Success",
                description: `${type === 'banner' ? 'Banner' : 'Icon'} uploaded successfully`
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                title: "Upload failed",
                description: error.message || "Failed to upload image",
                variant: "destructive"
            });
        } finally {
            setUploading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Style your community</h2>
                <p className="text-muted-foreground text-sm">
                    Adding visual flair will catch new members attention and help establish your community's culture!
                    You can update this at any time.
                </p>
            </div>

            {/* Banner Upload */}
            <div className="space-y-3">
                <h3 className="font-medium text-sm">Banner</h3>
                <div className="flex items-center gap-3">
                    {data.banner_url ? (
                        <div className="flex-1">
                            <div
                                className="h-24 rounded-lg bg-cover bg-center border-2 border-border"
                                style={{ backgroundImage: `url(${data.banner_url})` }}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Banner uploaded</p>
                        </div>
                    ) : (
                        <div className="flex-1 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                            <div className="text-center">
                                <ImagePlus className="w-8 h-8 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xs text-muted-foreground">No banner yet</p>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('banner-upload')?.click()}
                            disabled={uploading === 'banner'}
                            className="gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            {uploading === 'banner' ? 'Uploading...' : data.banner_url ? 'Change' : 'Add'}
                        </Button>
                        {data.banner_url && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onChange({ ...data, banner_url: '' })}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                </div>
                <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')}
                />
                <p className="text-xs text-muted-foreground">
                    Recommended: 1920x384px. Max 5MB. JPG, PNG, or GIF.
                </p>
            </div>

            {/* Icon Upload */}
            <div className="space-y-3">
                <h3 className="font-medium text-sm">Icon</h3>
                <div className="flex items-center gap-3">
                    {data.avatar_url ? (
                        <div className="w-20 h-20 rounded-full bg-cover bg-center border-4 border-border" style={{ backgroundImage: `url(${data.avatar_url})` }} />
                    ) : (
                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-border flex items-center justify-center bg-muted/30">
                            <ImagePlus className="w-6 h-6 text-muted-foreground" />
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('icon-upload')?.click()}
                            disabled={uploading === 'icon'}
                            className="gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            {uploading === 'icon' ? 'Uploading...' : data.avatar_url ? 'Change' : 'Add'}
                        </Button>
                        {data.avatar_url && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onChange({ ...data, avatar_url: '' })}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                </div>
                <input
                    id="icon-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'icon')}
                />
                <p className="text-xs text-muted-foreground">
                    Recommended: 256x256px. Max 5MB. JPG, PNG, or GIF.
                </p>
            </div>
        </div>
    );
};
