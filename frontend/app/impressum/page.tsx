import type { Metadata } from 'next';
import { LegalPage, OperatorBlock, Section } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = { title: 'Impressum', alternates: { canonical: '/impressum' } };

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <Section title="Angaben gemäß § 5 DDG">
        <OperatorBlock name={LEGAL.name} address={LEGAL.address} email={LEGAL.email} phone={LEGAL.phone} />
        {LEGAL.vatId && <p className="mt-2">USt-IdNr.: {LEGAL.vatId}</p>}
      </Section>
      <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        <p>{LEGAL.name || 'Siehe oben.'}</p>
      </Section>
      <Section title="Verbraucherstreitbeilegung">
        <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </Section>
    </LegalPage>
  );
}
