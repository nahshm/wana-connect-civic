import { VideoFeed } from '@/components/video/VideoFeed'
import { useSearchParams } from 'react-router-dom'

export const CivicClipsPage = () => {
    const [searchParams] = useSearchParams()
    const category = searchParams.get('category') || undefined
    const hashtag = searchParams.get('hashtag') || undefined

    return (
        <div className="fixed inset-0 bg-black">
            <VideoFeed category={category} hashtag={hashtag} />
        </div>
    )
}
