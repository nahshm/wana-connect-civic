import { useState, useEffect } from 'react'
import { FileText, Image, Link2, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CommunitySelector } from './CommunitySelector'
import { FlairSelector } from './FlairSelector'
import { ContentSensitivitySelector, ContentSensitivity } from './ContentSensitivitySelector'
import { RichTextEditor } from './RichTextEditor'
import { MediaUploadZone } from './MediaUploadZone'
import { LinkPostInput } from './LinkPostInput'
import { cn } from '@/lib/utils'

interface Community {
  id: string
  name: string
  display_name: string
  member_count: number
}

interface CreatePostFormProps {
  communities: Community[]
  onSubmit: (data: PostFormData) => void
  disabled?: boolean
  initialValues?: Partial<PostFormData & { title?: string; content?: string }>
  isEditing?: boolean
}

export interface PostFormData {
  title: string
  content: string
  communityId?: string
  tags: string[]
  contentSensitivity: ContentSensitivity
  evidenceFiles: File[]
  postType: 'text' | 'media' | 'link'
  linkUrl?: string
  flairIds?: string[]
}

const POST_TYPES = [
  {
    id: 'text' as const,
    label: 'Text',
    icon: FileText,
    description: 'Create a discussion post with rich text formatting'
  },
  {
    id: 'media' as const,
    label: 'Image & Video',
    icon: Image,
    description: 'Share images, videos, or documents'
  },
  {
    id: 'link' as const,
    label: 'Link',
    icon: Link2,
    description: 'Share a link to an article or website'
  }
]

const DRAFT_STORAGE_KEY = 'wana_post_draft'

export const CreatePostForm = ({ communities, onSubmit, disabled, initialValues, isEditing }: CreatePostFormProps) => {
  // Form state
  const [postType, setPostType] = useState<'text' | 'media' | 'link'>(initialValues?.postType || 'text')
  const [title, setTitle] = useState(initialValues?.title || '')
  const [content, setContent] = useState(initialValues?.content || '')
  const [communityId, setCommunityId] = useState<string | undefined>(initialValues?.communityId)
  const [flairIds, setFlairIds] = useState<string[]>(initialValues?.flairIds || [])
  const [contentSensitivity, setContentSensitivity] = useState<ContentSensitivity>(initialValues?.contentSensitivity || 'public')
  const [files, setFiles] = useState<File[]>([])
  const [linkUrl, setLinkUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setPostType(draft.postType || 'text')
        setTitle(draft.title || '')
        setContent(draft.content || '')
        setCommunityId(draft.communityId)
        setFlairIds(draft.flairIds || [])
        setContentSensitivity(draft.contentSensitivity || 'public')
        setLinkUrl(draft.linkUrl || '')
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [])

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = {
      postType,
      title,
      content,
      communityId,
      flairIds,
      contentSensitivity,
      linkUrl,
      timestamp: Date.now()
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  }, [postType, title, content, communityId, flairIds, contentSensitivity, linkUrl])

  const handleSaveDraft = () => {
    // Draft is auto-saved, just notify user
    alert('Draft saved! Your post will be restored when you return.')
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    setTitle('')
    setContent('')
    setCommunityId(undefined)
    setFlairIds([])
    setContentSensitivity('public')
    setFiles([])
    setLinkUrl('')
  }

  const validateForm = (): string | null => {
    if (!title.trim()) {
      return 'Please enter a title for your post'
    }

    if (title.length > 300) {
      return 'Title must be 300 characters or less'
    }

    if (postType === 'link' && !linkUrl.trim()) {
      return 'Please enter a URL for your link post'
    }

    if (postType === 'link') {
      try {
        new URL(linkUrl)
      } catch {
        return 'Please enter a valid URL'
      }
    }

    if (postType === 'media' && files.length === 0) {
      return 'Please upload at least one file for your media post'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const validationError = validateForm()
    if (validationError) {
      alert(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      const formData: PostFormData = {
        title: title.trim(),
        content: content.trim(),
        communityId,
        tags: flairIds,
        contentSensitivity,
        evidenceFiles: files,
        postType,
        linkUrl: postType === 'link' ? linkUrl.trim() : undefined,
        flairIds
      }

      await onSubmit(formData)

      // Clear form and draft on successful submission
      clearDraft()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* Community Selection */}
      <CommunitySelector
        communities={communities}
        selectedCommunityId={communityId}
        onSelectCommunity={setCommunityId}
        disabled={disabled || isSubmitting}
      />

      {/* Post Type Tabs */}
      <Tabs value={postType} onValueChange={(v) => setPostType(v as typeof postType)}>
        <TabsList className="grid w-full grid-cols-3">
          {POST_TYPES.map(type => {
            const Icon = type.icon
            return (
              <TabsTrigger
                key={type.id}
                value={type.id}
                disabled={disabled || isSubmitting}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Title Input (shown for all types) */}
        <div className="mt-6 space-y-2">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
            disabled={disabled || isSubmitting}
            required
            className="text-lg font-medium"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>A clear, descriptive title helps others understand your post</span>
            <span>{title.length}/300</span>
          </div>
        </div>

        {/* Text Post Content */}
        <TabsContent value="text" className="space-y-4 mt-6">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Share your thoughts about civic matters, ask questions, or start a discussion..."
            disabled={disabled || isSubmitting}
          />

          {/* Optional file attachments for text posts */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Add supporting files (optional)
            </summary>
            <div className="mt-4">
              <MediaUploadZone
                files={files}
                onFilesChange={setFiles}
                disabled={disabled || isSubmitting}
                maxFiles={5}
                maxSizeMB={40}
              />
            </div>
          </details>
        </TabsContent>

        {/* Media Post Content */}
        <TabsContent value="media" className="space-y-4 mt-6">
          <MediaUploadZone
            files={files}
            onFilesChange={setFiles}
            disabled={disabled || isSubmitting}
            maxFiles={10}
            maxSizeMB={100}
          />

          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Add a description or context for your media..."
            disabled={disabled || isSubmitting}
          />
        </TabsContent>

        {/* Link Post Content */}
        <TabsContent value="link" className="space-y-4 mt-6">
          <LinkPostInput
            url={linkUrl}
            onUrlChange={setLinkUrl}
            disabled={disabled || isSubmitting}
          />

          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Add your commentary or thoughts about this link..."
            disabled={disabled || isSubmitting}
          />
        </TabsContent>
      </Tabs>

      {/* Flair Selection */}
      <FlairSelector
        selectedFlairIds={flairIds}
        onSelectFlairs={setFlairIds}
        disabled={disabled || isSubmitting}
      />

      {/* Content Sensitivity */}
      <ContentSensitivitySelector
        value={contentSensitivity}
        onValueChange={setContentSensitivity}
        disabled={disabled || isSubmitting}
      />

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span className="hidden sm:inline">
            {contentSensitivity === 'crisis'
              ? 'Crisis reports are immediately escalated'
              : contentSensitivity === 'sensitive'
                ? 'Sensitive posts undergo additional verification'
                : 'Your post will be reviewed by moderators'}
          </span>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={disabled || isSubmitting}
          >
            Save Draft
          </Button>
          <Button
            type="submit"
            disabled={disabled || isSubmitting || !title.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>

      {/* Posting Guidelines */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Posting Guidelines
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span>•</span>
              <span>Ensure your title is clear and descriptive</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Provide evidence for corruption or accountability claims</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Be respectful and avoid personal attacks</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Check community rules before posting</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Videos: Max 100MB • Images/Docs: Max 40MB per file</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </form>
  )
}
