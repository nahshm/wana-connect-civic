# Clips look like normal posts in the feed

## Goal
Use one post card for every kind of post. A clip shows exactly like a normal post: the same header (avatar, name, community, time), title, text, and vote/comment/share bar. The only change is that the video sits where a photo would go. No separate clip card design.

## What changes for viewers
- In the home feed and on community pages, clips look the same as text and photo posts.
- The video plays in the post's photo spot. It starts muted when you scroll to it and pauses when you scroll past. It keeps the seek bar and the speed/captions menu, and remembers your speed and captions choices.
- Clicking the video opens the full clip viewer. Clicking the title or text opens the post, like any other post.
- Polls, events, guides and issues keep using the small extra section the post card already shows for them, so the card design stays the same.
- The Clips tab and the full-screen clips viewer stay as they are.

## Technical details
- `UnifiedFeedItem.tsx`: send `clip` / `clip_uploaded` items to `PostCard`. Map clip data (video_url, thumbnail, views, linked post fields) into the post shape. If the clip came from a post, use that post's data directly.
- `PostCard.tsx` media slot: when the post has a video (in post media or in clip data), render the shared `VideoPlayer` with its overlays (`VideoSeekBar`, `VideoSettingsMenu`, `usePlaybackPrefs`) in place of the current inline `<video>`. Keep the existing auto-pause logic, and show the view count in the action bar.
- `ClipPreviewCard.tsx`: no longer used by the feed. Delete it once nothing else imports it.
- Check: the feed with a clip, a photo post and a poll at desktop and mobile widths. Check the build.
