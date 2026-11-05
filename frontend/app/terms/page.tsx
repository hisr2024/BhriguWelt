import type { Metadata } from 'next';
import { LegalPage, Section } from '@/components/legal/LegalPage';
import { LEGAL_UPDATED } from '@/lib/legal';

export const metadata: Metadata = { title: 'Terms of use', alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated={LEGAL_UPDATED}>
      <Section title="The service">
        <p>
          BhriguWelt computes Vedic astrology charts and writes readings based on Bhrigu Samhita and Nadi Jyotisha
          principles. Readings are offered for reflection and personal insight.
        </p>
      </Section>
      <Section title="Not professional advice">
        <p>
          Readings are not medical, psychological, legal or financial advice and do not replace a qualified
          professional. Do not make health, legal or financial decisions on the basis of a reading alone.
        </p>
      </Section>
      <Section title="Your data and passcode">
        <p>
          Your profiles are encrypted with your passcode on your device. If you forget the passcode we cannot recover
          your data. See the privacy policy for what is sent to our server.
        </p>
      </Section>
      <Section title="Fair use">
        <p>Do not misuse the service, attempt to overload it or access it by automated means beyond normal use.</p>
      </Section>
      <Section title="Availability">
        <p>We aim to keep the service available but do not guarantee uninterrupted access or that every reading can be generated at all times.</p>
      </Section>
    </LegalPage>
  );
}
