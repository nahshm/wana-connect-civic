

# Channel Chat: Full E2E with Media, Emojis, Links, Reactions

## What We're Building

Making channel chat fully functional: file/image uploads, emoji picker in input, persistent reactions via `message_reactions` table, clickable link detection in messages, and inline media rendering.

## Database Changes

**Migration: `chat_messages` + storage**
- Add `media_urls TEXT[] DEFAULT '{}'` and `media_type TEXT` columns to `chat_messages`
- Create `chat-media` public storage bucket with RLS (authenticated upload, public read, owner delete)

## New Components

### 1. `src/components/chat/EmojiPicker.tsx`
Categorized emoji grid in a Popover. ~100 common emojis across 6 categories (Smileys, Gestures, Hearts, Activities, Objects, Symbols). Clicking an emoji inserts it at cursor position in the input or calls `onSelect(emoji)`.

### 2. `src/components/chat/MessageMedia.tsx`
Renders `media_urls` inline in messages:
- **Images**: Thumbnails (max-w-sm, rounded, clickable to open full-size in a Dialog lightbox)
- **Files**: Download card with filename + download link
- Uses Supabase `getPublicUrl` for the `chat-media` bucket

### 3. `src/components/chat/LinkPreview.tsx`
Simple link detection in message text — wraps URLs in clickable `<a>` tags with `target="_blank"`. No external preview fetching, just makes URLs clickable with proper styling.

## Changes to `ChannelChatWindow.tsx`

### Reactions → Database
- On `fetchMessages`: batch-fetch from `message_reactions` for loaded message IDs, group by `message_id` + `emoji`
- `handleReaction`: upsert/delete in `message_reactions` (replace the console.log placeholder)
- Subscribe to realtime on `message_reactions` for live updates

### Media Upload
- **Paperclip button**: opens file picker (`*/*`, max 10MB), uploads to `chat-media/{userId}/{timestamp}_{filename}`
- **Image button**: opens file picker (`image/*`), same upload flow
- **Plus button**: shows small dropdown with "Upload File" / "Upload Image"
- Preview bar below input showing pending attachments (thumbnails for images, filename chips for files)
- On send: upload files first, then insert message with `media_urls` array and `media_type`

### Emoji Picker
- Wire Smile button in input bar to open `EmojiPicker` popover
- On select: append emoji to `newMessage` text

### Link Detection
- Replace plain `<p>` message rendering with a component that auto-links URLs (`https://...`, `http://...`) into clickable anchors

### Message Rendering
- After text content, render `<MessageMedia urls={msg.media_urls} type={msg.media_type} />` if media exists

## Files to Change

| File | Action |
|------|--------|
| SQL migration | Add columns + storage bucket |
| `src/components/chat/EmojiPicker.tsx` | **New** |
| `src/components/chat/MessageMedia.tsx` | **New** |
| `src/components/chat/MessageContent.tsx` | **New** — renders text with auto-linked URLs |
| `src/components/chat/ChannelChatWindow.tsx` | Wire everything together |

