import { plainTiming, readViewMode, saveViewMode } from '@/lib/viewMode';

describe('view mode', () => {
  it('defaults to Simple and remembers Astrologer', () => {
    localStorage.clear();
    expect(readViewMode()).toBe('layman');
    saveViewMode('astrologer');
    expect(readViewMode()).toBe('astrologer');
  });

  it('removes planetary period names from timing in the Simple view', () => {
    expect(plainTiming('Rahu–Sun period, Jun 2026–May 2027')).toBe('Jun 2026–May 2027');
    expect(plainTiming('The debt asks most to be settled in the Jupiter–Venus period, Oct 2037–Jun 2040.'))
      .toBe('The debt asks most to be settled in Oct 2037–Jun 2040.');
    expect(plainTiming('Jupiter main period, Dec 2029–Dec 2045')).toBe('Dec 2029–Dec 2045');
    expect(plainTiming('Ages 36 to 42')).toBe('Ages 36 to 42');
  });
});
