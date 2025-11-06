import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, Shield, AlertTriangle, Upload, Eye, EyeOff, X, File, Image, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FlairTagsModal } from './FlairTagsModal';
import { MediaUploader } from './MediaUploader';
import type { Community } from '@/types';

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(300, "Title cannot exceed 300 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  communityId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isAnonymous: z.boolean().default(false),
  contentSensitivity: z.enum(['public', 'sensitive', 'crisis']).default('public'),
  evidenceFiles: z.array(z.any()).optional(),
  isNgoVerified: z.boolean().default(false),
});

type PostFormValues = z.infer<typeof formSchema>;

interface CreatePostFormProps {
  communities: Community[];
  onSubmit: (data: PostFormValues) => void;
  initialValues?: Partial<PostFormValues>;
  isEditing?: boolean;
}

const sensitiveCommunities = ['corruption', 'justice', 'institution', 'tribalism', 'human-rights'];

export function CreatePostForm({ communities, onSubmit, initialValues, isEditing = false }: CreatePostFormProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [communitySelectorOpen, setCommunitySelectorOpen] = useState(false);
  const [flairTagsModalOpen, setFlairTagsModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialValues?.tags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialValues?.title || '',
      content: initialValues?.content || '',
      communityId: initialValues?.communityId || '',
      tags: initialValues?.tags || [],
      isAnonymous: initialValues?.isAnonymous || false,
      contentSensitivity: initialValues?.contentSensitivity || 'public',
      evidenceFiles: initialValues?.evidenceFiles || [],
    },
  });

  const selectedCommunity = communities.find(c => c.id === form.watch('communityId'));
  const contentSensitivity = form.watch('contentSensitivity');
  const isAnonymous = form.watch('isAnonymous');

  const isSensitiveCommunity = selectedCommunity?.category &&
    sensitiveCommunities.some(cat => selectedCommunity.category.includes(cat));

  const handleFormSubmit = async (values: PostFormValues) => {
    if (!user && !values.isAnonymous) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a post, or enable anonymous posting",
        variant: "destructive",
      });
      return;
    }

    // Check karma requirements for community posting
    if (selectedCommunity?.minimumKarmaToPost && profile) {
      const userTotalKarma = (profile.postKarma || 0) + (profile.commentKarma || 0);
      if (userTotalKarma < selectedCommunity.minimumKarmaToPost) {
        toast({
          title: "Insufficient karma",
          description: `You need at least ${selectedCommunity.minimumKarmaToPost} total karma to post in c/${selectedCommunity.name}. You currently have ${userTotalKarma} karma.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      form.reset();
      setSelectedTags([]);
      setUploadedFiles([]);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSensitivityColor = (level: string) => {
    switch (level) {
      case 'crisis': return 'bg-red-100 text-red-800 border-red-200';
      case 'sensitive': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getSensitivityIcon = (level: string) => {
    switch (level) {
      case 'crisis': return <AlertTriangle className="w-4 h-4" />;
      case 'sensitive': return <Shield className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Content Sensitivity Warning */}
      {(contentSensitivity !== 'public' || isSensitiveCommunity) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-800">
              <Shield className="w-5 h-5" />
              <div>
                <p className="font-medium">Sensitive Content Notice</p>
                <p className="text-sm">
                  {contentSensitivity === 'crisis'
                    ? 'This post will be treated as a crisis report and escalated immediately.'
                    : 'This content involves sensitive civic matters. Additional verification may be required.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Community Selector */}
          <FormField
            control={form.control}
            name="communityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sidebar-foreground">Community (Optional)</FormLabel>
                <FormControl>
                  <Dialog open={communitySelectorOpen} onOpenChange={setCommunitySelectorOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="w-full border border-sidebar-border rounded-md px-3 py-2 text-left flex items-center justify-between bg-sidebar-background text-sidebar-foreground hover:bg-sidebar-accent"
                      >
                        {selectedCommunity ? (
                          <>
                            <Avatar className="w-6 h-6 mr-2">
                              <AvatarFallback className="text-xs">{selectedCommunity.name[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <span className="font-medium">c/{selectedCommunity.name}</span>
                              {isSensitiveCommunity && (
                                <Badge variant="outline" className="ml-2 text-xs bg-orange-100 text-orange-800">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Sensitive
                                </Badge>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-sidebar-muted-foreground">Select a community (optional)</span>
                        )}
                        <ChevronDown className="w-4 h-4 text-sidebar-muted-foreground" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-sidebar-background border-sidebar-border">
                      <DialogHeader>
                        <DialogTitle className="text-sidebar-foreground">Select Community</DialogTitle>
                        <p className="text-sm text-sidebar-muted-foreground">Choose a community to post in, or leave empty for general discussion.</p>
                      </DialogHeader>
                      <Command>
                        <CommandInput
                          placeholder="Search communities..."
                          className="bg-sidebar-background border-sidebar-border text-sidebar-foreground"
                        />
                        <CommandList>
                          <CommandEmpty className="text-sidebar-muted-foreground">No communities found.</CommandEmpty>
                          <CommandGroup>
                            {communities.map((community) => {
                              const isSensitive = sensitiveCommunities.some(cat =>
                                community.category.includes(cat)
                              );
                              return (
                                <CommandItem
                                  key={community.id}
                                  value={community.name}
                                  onSelect={() => {
                                    field.onChange(community.id);
                                    setCommunitySelectorOpen(false);
                                  }}
                                  className="text-sidebar-foreground hover:bg-sidebar-accent"
                                >
                                  <Avatar className="w-6 h-6 mr-2">
                                    <AvatarFallback className="text-xs">{community.name[0].toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <span>c/{community.name}</span>
                                    <p className="text-xs text-sidebar-muted-foreground">{community.description}</p>
                                  </div>
                                  {isSensitive && (
                                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Sensitive
                                    </Badge>
                                  )}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </DialogContent>
                  </Dialog>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Content Sensitivity */}
          <FormField
            control={form.control}
            name="contentSensitivity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sidebar-foreground">Content Sensitivity</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    {[
                      { value: 'public', label: 'Public Discussion', desc: 'Regular civic discussion' },
                      { value: 'sensitive', label: 'Sensitive Topic', desc: 'Corruption, human rights, etc.' },
                      { value: 'crisis', label: 'Crisis Report', desc: 'Urgent safety/emergency issue' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                          field.value === option.value
                            ? getSensitivityColor(option.value)
                            : 'border-sidebar-border bg-sidebar-background hover:bg-sidebar-accent'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getSensitivityIcon(option.value)}
                          <span className="font-medium text-sm">{option.label}</span>
                        </div>
                        <p className="text-xs opacity-75">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Note: Anonymous posting is not currently supported */}
          <div className="rounded-lg border border-sidebar-border p-4 bg-sidebar-background">
            <div className="flex items-center gap-2 text-sidebar-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="text-sm">
                All posts are attributed to your account for transparency and accountability in civic discussions.
              </span>
            </div>
          </div>

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sidebar-foreground">Title *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="What would you like to discuss?"
                    maxLength={300}
                    className="bg-sidebar-background border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Content */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sidebar-foreground">Content *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your thoughts, evidence, or concerns..."
                    className="min-h-[120px] bg-sidebar-background border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted-foreground resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tags and Evidence */}
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFlairTagsModalOpen(true)}
              className="flex items-center gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Shield className="w-4 h-4" />
              Add Tags & Evidence
            </Button>

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="outline" className="bg-sidebar-accent text-sidebar-accent-foreground">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <MediaUploader
              onFilesChange={(files) => {
                setUploadedFiles(files);
                form.setValue('evidenceFiles', files);
              }}
              initialFiles={uploadedFiles}
              uploadProgress={new Map()}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4 border-t border-sidebar-border">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-civic-blue hover:bg-civic-blue/90 text-white"
            >
              {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Post" : "Create Post")}
            </Button>
          </div>
        </form>
      </Form>

      {/* Flair and Tags Modal */}
      <FlairTagsModal
        open={flairTagsModalOpen}
        onOpenChange={setFlairTagsModalOpen}
        selectedFlairId={null} // TODO: Implement flair selection
        onFlairChange={() => {}} // TODO: Implement flair handling
        tags={[]} // TODO: Implement tag management
        onTagToggle={(tag) => {
          setSelectedTags(prev =>
            prev.includes(tag)
              ? prev.filter(t => t !== tag)
              : [...prev, tag]
          );
          const currentTags = form.getValues('tags') || [];
          const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
          form.setValue('tags', newTags);
        }}
      />
    </div>
  );
}
