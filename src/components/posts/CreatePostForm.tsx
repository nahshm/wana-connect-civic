import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Image, Video, Link, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Community } from '@/types';

interface CreatePostFormProps {
  communities: Community[];
  onClose?: () => void;
  onSubmit?: (postData: any) => void;
}

export const CreatePostForm = ({ communities, onClose, onSubmit }: CreatePostFormProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [contentType, setContentType] = useState<'text' | 'image' | 'video' | 'link'>('text');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [flair, setFlair] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !selectedCommunity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        communityId: selectedCommunity,
        contentType,
        tags,
        flair: flair || undefined,
      };

      onSubmit?.(postData);
      
      toast({
        title: "Post Created",
        description: "Your post has been published successfully.",
      });

      // Reset form
      setTitle('');
      setContent('');
      setSelectedCommunity('');
      setContentType('text');
      setTags([]);
      setFlair('');
      onClose?.();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentTypeIcons = {
    text: Hash,
    image: Image,
    video: Video,
    link: Link,
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Create Post
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Community Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Community *</label>
            <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a community" />
              </SelectTrigger>
              <SelectContent>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    r/{community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Post Type</label>
            <div className="flex gap-2">
              {Object.entries(contentTypeIcons).map(([type, Icon]) => (
                <Button
                  key={type}
                  type="button"
                  variant={contentType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContentType(type as any)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening in your community?"
              maxLength={300}
              className="text-base"
            />
            <div className="text-xs text-muted-foreground">
              {title.length}/300 characters
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Content *</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, ideas, or civic concerns..."
              rows={6}
              maxLength={10000}
              className="text-base resize-none"
            />
            <div className="text-xs text-muted-foreground">
              {content.length}/10,000 characters
            </div>
          </div>

          {/* Flair */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Flair (Optional)</label>
            <Select value={flair} onValueChange={setFlair}>
              <SelectTrigger>
                <SelectValue placeholder="Select a flair" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discussion">Discussion</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="accountability">Accountability</SelectItem>
                <SelectItem value="civic-education">Civic Education</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags (Optional)</label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                maxLength={20}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addTag}
                disabled={!newTag.trim() || tags.length >= 5}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {tags.length}/5 tags
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !title.trim() || !content.trim() || !selectedCommunity}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};