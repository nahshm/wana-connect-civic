import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ExternalLink, Loader2 } from 'lucide-react'

interface LinkPostInputProps {
    url: string
    onUrlChange: (url: string) => void
    disabled?: boolean
}

export const LinkPostInput = ({ url, onUrlChange, disabled }: LinkPostInputProps) => {
    const [isValidUrl, setIsValidUrl] = useState(false)

    const validateUrl = (urlString: string) => {
        try {
            new URL(urlString)
            return true
        } catch {
            return false
        }
    }

    const handleUrlChange = (newUrl: string) => {
        onUrlChange(newUrl)
        setIsValidUrl(validateUrl(newUrl))
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="link-url">URL *</Label>
                <div className="relative">
                    <Input
                        id="link-url"
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        disabled={disabled}
                        className="pr-10"
                    />
                    {url && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isValidUrl ? (
                                <ExternalLink className="h-4 w-4 text-green-600" />
                            ) : (
                                <span className="text-xs text-destructive">Invalid URL</span>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    Paste a link to an article, document, or website
                </p>
            </div>

            {/* URL Preview Placeholder */}
            {isValidUrl && (
                <Card className="p-4 bg-muted/50">
                    <div className="flex items-start gap-3">
                        <div className="h-20 w-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            <ExternalLink className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm mb-1 truncate">
                                {new URL(url).hostname}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {url}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 italic">
                        Link preview will be generated when the post is created
                    </p>
                </Card>
            )}
        </div>
    )
}
