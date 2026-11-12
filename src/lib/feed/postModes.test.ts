import { describe, it, expect } from '@jest/globals';
import { buildModeData } from './postModes';

describe('buildModeData', () => {
  it('rejects a poll with fewer than two options', () => {
    expect(() => buildModeData('poll', { pollOptions: ['Yes', '  '] })).toThrow();
  });
  it('keeps trimmed poll options', () => {
    expect(buildModeData('poll', { pollOptions: [' Yes ', 'No'] })).toEqual({ options: ['Yes', 'No'] });
  });
  it('requires a start time for events', () => {
    expect(() => buildModeData('event', {})).toThrow();
  });
});
