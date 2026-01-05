import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Upload, X, FileText, Image as ImageIcon, Film } from 'lucide-react';

const SubmitProject = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        status: 'ongoing',
        priority: 'medium',
        budget_allocated: '',
        funding_source: '',
        county: '',
        constituency: '',
        ward: '',
        official_id: '',
        planned_start_date: '',
        planned_completion_date: '',
        project_level: 'county' as 'national' | 'county' | 'constituency' | 'ward'
    });

    // Media State
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [documentFiles, setDocumentFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

    // Data Lists from Database
    const [officials, setOfficials] = useState<{ id: string, name: string, position: string }[]>([]);
    const [counties, setCounties] = useState<string[]>([]);
    const [constituencies, setConstituencies] = useState<string[]>([]);
    const [wards, setWards] = useState<string[]>([]);

    // Fetch real geography data
    useEffect(() => {
        fetchCounties();
    }, []);

    useEffect(() => {
        if (formData.county) {
            fetchConstituencies(formData.county);
        }
    }, [formData.county]);

    useEffect(() => {
        if (formData.constituency) {
            fetchWards(formData.constituency);
        }
    }, [formData.constituency]);

    // Fetch officials based on project level
    useEffect(() => {
        fetchOfficials();
    }, [formData.project_level, formData.county, formData.constituency, formData.ward]);

    const fetchCounties = async () => {
        const { data } = await supabase
            .from('counties')
            .select('name')
            .order('name');
        if (data) setCounties(data.map(c => c.name));
    };

    const fetchConstituencies = async (county: string) => {
        const { data } = await supabase
            .from('constituencies')
            .select('name')
            .eq('county', county)
            .order('name');
        if (data) setConstituencies(data.map(c => c.name));
    };

    const fetchWards = async (constituency: string) => {
        const { data } = await supabase
            .from('wards')
            .select('name')
            .eq('constituency', constituency)
            .order('name');
        if (data) setWards(data.map(w => w.name));
    };

    const fetchOfficials = async () => {
        let query = supabase
            .from('officials')
            .select('id, name, position');

        // Filter by project level
        if (formData.project_level === 'national') {
            query = query.eq('level', 'national');
        } else if (formData.project_level === 'county' && formData.county) {
            query = query.eq('county', formData.county);
        } else if (formData.project_level === 'constituency' && formData.constituency) {
            query = query.eq('constituency', formData.constituency);
        } else if (formData.project_level === 'ward' && formData.ward) {
            query = query.eq('ward', formData.ward);
        }

        const { data } = await query.order('name');
        if (data) setOfficials(data);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'media' | 'document') => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            if (type === 'media') {
                setMediaFiles(prev => [...prev, ...newFiles]);
                // Create previews
                const newPreviews = newFiles.map(file => URL.createObjectURL(file));
                setMediaPreviews(prev => [...prev, ...newPreviews]);
            } else {
                setDocumentFiles(prev => [...prev, ...newFiles]);
            }
        }
    };

    const removeFile = (index: number, type: 'media' | 'document') => {
        if (type === 'media') {
            setMediaFiles(prev => prev.filter((_, i) => i !== index));
            setMediaPreviews(prev => prev.filter((_, i) => i !== index));
        } else {
            setDocumentFiles(prev => prev.filter((_, i) => i !== index));
        }
    };

    const uploadFiles = async (files: File[], bucket: 'project-media' | 'project-documents') => {
        const urls: string[] = [];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user?.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket) // Ensure these buckets exist!
                .upload(filePath, file);

            if (uploadError) {
                console.error(`Error uploading ${file.name}:`, uploadError);
                continue;
            }

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            urls.push(data.publicUrl);
        }
        return urls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: 'Authentication Required', description: 'Please sign in to post a project', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            // 1. Upload Files to Supabase Storage
            const mediaUrls = await uploadFiles(mediaFiles, 'project-media');
            const docUrls = await uploadFiles(documentFiles, 'project-documents');

            // 2. Insert Project
            const { data, error } = await supabase
                .from('government_projects')
                .insert({
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    status: formData.status,
                    priority: formData.priority,
                    budget_allocated: formData.budget_allocated ? parseFloat(formData.budget_allocated) : null,
                    funding_source: formData.funding_source,
                    county: formData.county,
                    constituency: formData.constituency,
                    ward: formData.ward,
                    official_id: formData.official_id || null,
                    planned_start_date: formData.planned_start_date || null,
                    planned_completion_date: formData.planned_completion_date || null,
                    created_by: user.id,
                    is_verified: false, // Explicitly unverified
                    media_urls: mediaUrls,
                    documents_urls: docUrls,
                    progress_percentage: 0
                })
                .select()
                .single();

            if (error) throw error;

            toast({
                title: 'Project Submitted!',
                description: 'Your project has been posted and is pending community verification.',
            });

            navigate(`/projects/${data.id}`);

        } catch (error: any) {
            console.error('Error submitting project:', error);
            toast({
                title: 'Submission Failed',
                description: error.message || 'Failed to submit project',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Submit a Project</CardTitle>
                    <CardDescription>
                        Report a government project in your area. Provide as much evidence as possible.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="title">Project Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Construction of New Market in Westlands"
                                    required
                                />
                            </div>

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe the project details, scope, and current status..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="projectScope">Project Scope *</Label>
                                    <Select
                                        value={formData.project_level}
                                        onValueChange={(val: any) => handleSelectChange('project_level', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select scope" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="national">National</SelectItem>
                                            <SelectItem value="county">County</SelectItem>
                                            <SelectItem value="constituency">Constituency</SelectItem>
                                            <SelectItem value="ward">Ward</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="category">Category</Label>
                                    <Select onValueChange={(val) => handleSelectChange('category', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                                            <SelectItem value="Education">Education</SelectItem>
                                            <SelectItem value="Health">Health</SelectItem>
                                            <SelectItem value="Water">Water</SelectItem>
                                            <SelectItem value="Energy">Energy</SelectItem>
                                            <SelectItem value="Transport">Transport</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="official">Responsible Official (Optional)</Label>
                                    <Select onValueChange={(val) => handleSelectChange('official_id', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select official" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {officials.map(off => (
                                                <SelectItem key={off.id} value={off.id}>{off.name} ({off.position})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Location</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="county">County</Label>
                                    <Select onValueChange={(val) => handleSelectChange('county', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select County" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {counties.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="constituency">Constituency</Label>
                                    <Select onValueChange={(val) => handleSelectChange('constituency', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Constituency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {constituencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="ward">Ward</Label>
                                    <Select onValueChange={(val) => handleSelectChange('ward', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Ward" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {wards.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Financials & Dates */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="budget">Estimated Budget (KES)</Label>
                                    <Input
                                        id="budget"
                                        name="budget_allocated"
                                        type="number"
                                        value={formData.budget_allocated}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="funding">Funding Source</Label>
                                    <Input
                                        id="funding"
                                        name="funding_source"
                                        value={formData.funding_source}
                                        onChange={handleInputChange}
                                        placeholder="e.g. CDF, County Gov"
                                    />
                                </div>
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="start_date">Planned Start</Label>
                                    <Input
                                        id="start_date"
                                        name="planned_start_date"
                                        type="date"
                                        value={formData.planned_start_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="end_date">Planned Completion</Label>
                                    <Input
                                        id="end_date"
                                        name="planned_completion_date"
                                        type="date"
                                        value={formData.planned_completion_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Evidence Upload */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Evidence & Documents</h3>

                            {/* Media Upload */}
                            <div className="space-y-2">
                                <Label>Photos & Videos</Label>
                                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileChange(e, 'media')}
                                    />
                                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Drag & drop photos/videos or click to browse</p>
                                </div>

                                {/* Previews */}
                                {mediaPreviews.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {mediaPreviews.map((url, idx) => (
                                            <div key={idx} className="relative aspect-video bg-muted rounded-md overflow-hidden group">
                                                <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(idx, 'media')}
                                                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Document Upload */}
                            <div className="space-y-2">
                                <Label>Documents (Plans, Gazetted Notices)</Label>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" className="relative">
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => handleFileChange(e, 'document')}
                                        />
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Documents
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        {documentFiles.length} files selected
                                    </span>
                                </div>
                                {documentFiles.length > 0 && (
                                    <ul className="text-sm space-y-1 mt-2">
                                        {documentFiles.map((file, idx) => (
                                            <li key={idx} className="flex items-center justify-between bg-muted p-2 rounded">
                                                <span className="flex items-center truncate">
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    {file.name}
                                                </span>
                                                <button type="button" onClick={() => removeFile(idx, 'document')} className="text-muted-foreground hover:text-destructive">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Project'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SubmitProject;
