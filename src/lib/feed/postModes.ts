export type PostMode = 'discussion' | 'issue' | 'poll' | 'event' | 'guide';
export type FeedTab = 'all' | 'issues' | 'discussions' | 'clips';

export const POST_MODES: { id: PostMode; label: string; hint: string }[] = [
  { id: 'discussion', label: 'Discussion', hint: 'Start a conversation' },
  { id: 'issue', label: 'Issue / Receipt', hint: 'Show a problem with proof' },
  { id: 'poll', label: 'Poll', hint: 'Ask people to vote' },
  { id: 'event', label: 'Event', hint: 'Invite people to something' },
  { id: 'guide', label: 'Guide', hint: 'Explain how something works' },
];

export const FEED_TABS: { id: FeedTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'issues', label: 'Civic Issues' },
  { id: 'discussions', label: 'Discussions' },
  { id: 'clips', label: 'Clips' },
];

/** Builds the extra details saved with a post; throws a readable message when they are incomplete. */
export function buildModeData(mode: PostMode, input: { pollOptions?: string[]; eventStart?: string; eventLocation?: string }): Record<string, unknown> {
  if (mode === 'poll') {
    const options = (input.pollOptions || []).map(o => o.trim()).filter(Boolean);
    if (options.length < 2) throw new Error('A poll needs at least two options.');
    if (new Set(options.map(o => o.toLowerCase())).size !== options.length) throw new Error('Poll options must be different.');
    return { options };
  }
  if (mode === 'event') {
    if (!input.eventStart) throw new Error('Please choose when the event starts.');
    return { start_time: new Date(input.eventStart).toISOString(), location: (input.eventLocation || '').trim() || null };
  }
  return {};
}
