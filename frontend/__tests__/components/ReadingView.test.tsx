import { renderToStaticMarkup } from 'react-dom/server';
import { ReadingView, isStructuredReading, type StructuredReading } from '@/app/components/predictions/ReadingView';

jest.mock('@/app/components/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

const reading: StructuredReading = {
  reading_format: 2,
  overview: 'Partnership is the main stage of your life.',
  key_insight: 'Jupiter–Jupiter is your clearest marriage window.',
  section_order: ['romantic_marriage', 'family', 'dup'],
  section_titles: { romantic_marriage: 'Romantic Relationships & Marriage', family: 'Family Dynamics', dup: 'Dup' },
  section_details: {
    romantic_marriage: {
      simple: 'You are drawn to serious partners.',
      timing: 'Dec 2029–Jan 2032',
      technical: 'Saturn (R) own sign in the 7th.',
      guidance: ['Meet people through friends'],
      basis: ['F-BHAVAT-01'],
    },
    family: { simple: 'Family care is practical.' },
  },
  section_generation_status: {
    romantic_marriage: { status: 'generated', precision: { verified: true, specific_refs: 9 } },
    family: { status: 'generated' },
    dup: { status: 'duplicate' },
  },
  rule_findings: [{ id: 'F-DASHA-01', provenance: 'classical', principle: 'Vimshottari', finding: 'Running Rahu mahadasha' }],
};

describe('ReadingView', () => {
  it('detects structured readings', () => {
    expect(isStructuredReading(reading)).toBe(true);
    expect(isStructuredReading({ full_analysis: 'x' })).toBe(false);
  });

  it('simple view: plain text, timing and actions, no technical basis', () => {
    const html = renderToStaticMarkup(<ReadingView prediction={reading} viewMode="layman" />);
    expect(html).toContain('Partnership is the main stage');
    expect(html).toContain('You are drawn to serious partners.');
    expect(html).toContain('Dec 2029–Jan 2032');
    expect(html).toContain('Meet people through friends');
    expect(html).not.toContain('Technical basis');
    expect(html).not.toContain('Rules applied');
    expect(html).not.toContain('data-section="dup"');
    expect(html).not.toContain('{&quot;');
  });

  it('astrologer view: adds technical basis, rule IDs, verification and rules', () => {
    const html = renderToStaticMarkup(<ReadingView prediction={reading} viewMode="astrologer" />);
    expect(html).toContain('Technical basis');
    expect(html).toContain('F-BHAVAT-01');
    expect(html).toContain('Verified against chart');
    expect(html).toContain('Running Rahu mahadasha');
  });
});
