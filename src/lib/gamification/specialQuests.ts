export interface QuestWindow { is_special?: boolean | null; starts_at?: string | null; ends_at?: string | null }

/** Special quests (former challenges) only show while their time window is open; ordinary quests always show. */
export function isQuestOpen(q: QuestWindow, now: Date = new Date()): boolean {
  if (!q.is_special) return true;
  if (q.starts_at && new Date(q.starts_at) > now) return false;
  if (q.ends_at && new Date(q.ends_at) <= now) return false;
  return true;
}
