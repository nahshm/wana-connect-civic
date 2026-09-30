# X-style video player for Civic Clips

## Assessment: does it fit, and is it better?

The X player is a good match for WanaIQ, better than TikTok-style copying, because civic video lives next to text. Our feed already behaves this way: clips appear as still thumbnail cards in the feed, and the full-screen swipe feed is a separate page. X's "hybrid" model is exactly that idea, done better.

What genuinely beats what we have today:

- **Inline autoplay on mute in the feed.** Today a clip in the feed is a static image with a play button; you must leave the feed to watch. X plays it quietly in place. This is the single biggest improvement.
- **Native aspect ratio in the feed.** Ours forces every clip into a 16:9 box, so portrait phone footage (most citizen evidence) gets cropped. X keeps the shape the recorder used.
- **A real scrub bar with timestamps.** Ours shows a thin progress line you cannot drag in the immersive feed, so you cannot re-watch the moment that matters. For accountability footage, being able to scrub back is essential, not cosmetic.
- **Captions toggle and playback speed.** Speed and captions matter for long statements in Kiswahili/English and for viewers without sound.
- **Prominent view count on the player.** We already collect views; X surfaces them as a signal of reach.

What does not fit and should be dropped:

- **Picture-in-picture and cast to TV.** Heavy to build, little civic value, and PiP fights our bottom navigation.
- **Manual quality selector.** Our video is served through the media proxy as a single stream; adding a resolution switcher would mean re-encoding every clip at several sizes, which costs real money.
- **Zoom / fill toggle.** Marginal once we respect native aspect ratio.

Verdict: adopt the inline-to-immersive behaviour, the scrub bar, captions and speed. Skip PiP, casting and quality switching. Keep our own civic layer — upvote/downvote, accountability badge, community tag — rather than copying X's like/repost ribbon.

## What we would build

1. **Feed clips play in place.** Replace the static thumbnail card with a muted, looping, auto-playing player that starts when the card scrolls into view and pauses when it leaves. Tap opens the full-screen feed at that clip.
2. **Keep the original shape.** Portrait, square and landscape clips each keep their own proportions in the feed, with a sensible maximum height so one tall video cannot fill the whole screen.
3. **Draggable scrub bar.** In full screen, replace the non-interactive progress line with a seek bar showing elapsed and total time, draggable by touch, that reveals itself on tap and fades away during playback.
4. **Playback controls menu.** A small settings control in full screen offering speed (0.25x to 2x) and a captions on/off switch, remembered between clips.
5. **View count on the player.** Show the clip's view total on the player surface itself.
6. **Keep our engagement panel.** The existing right-hand civic actions stay; only their spacing changes so they never sit under the new seek bar.

Phasing: items 1-2 first (biggest gain, lowest risk), then 3-5, then polish.

## Technical notes

- `src/components/feed/ClipPreviewCard.tsx` becomes a thin wrapper over `VideoPlayer` with `autoPlay`, `muted`, `loop`, `lazyLoad`, and `showControls={false}`; intersection observer already exists in `VideoPlayer`, so pause-on-exit needs an `isActive` prop driven by a non-`triggerOnce` observer.
- `VideoPlayer` already tracks `aspectRatio` from `loadedmetadata`; use it for the container instead of the fixed `aspect-video`.
- Replace `CivicClipProgressIndicator` usage in `CivicClipCard` with a Radix `Slider`-based seek bar bound to `VideoPlayerRef.seekTo`; suppress the card's tap-to-vote handler while dragging.
- Speed via `video.playbackRate`; captions via a `<track>` element toggled with `textTracks[0].mode`. Requires a caption/VTT column on clips — if none exists the toggle stays hidden until captions are generated.
- Only ever one unmuted video: lift a single "active clip id" into the feed so autoplaying feed clips stay muted.
- Skipped by design: PiP (`requestPictureInPicture`), Remote Playback / cast, HLS multi-bitrate.

## Note on the current preview error

The preview is reporting a failed dynamic import of `AppLayout.tsx`, which is a stale module-loading failure rather than a code fault; it clears on reload. Verifying and, if it persists, hardening the lazy-route loading would be the first step once we start building.
