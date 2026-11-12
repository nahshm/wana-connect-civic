import { describe, it, expect } from '@jest/globals';
import { isQuestOpen } from './specialQuests';

const now = new Date('2026-11-12T12:00:00Z');
describe('isQuestOpen', () => {
  it('always shows ordinary quests', () => {
    expect(isQuestOpen({ is_special: false, ends_at: '2020-01-01T00:00:00Z' }, now)).toBe(true);
  });
  it('hides a special quest that has ended', () => {
    expect(isQuestOpen({ is_special: true, ends_at: '2026-11-12T11:59:00Z' }, now)).toBe(false);
  });
  it('hides a special quest that has not started', () => {
    expect(isQuestOpen({ is_special: true, starts_at: '2026-11-13T00:00:00Z' }, now)).toBe(false);
  });
  it('shows a special quest inside its window', () => {
    expect(isQuestOpen({ is_special: true, starts_at: '2026-11-01T00:00:00Z', ends_at: '2026-12-01T00:00:00Z' }, now)).toBe(true);
  });
});
