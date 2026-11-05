import type { Metadata } from 'next';
import { LegalPage, OperatorBlock, Section } from '@/components/legal/LegalPage';
import { LEGAL, LEGAL_UPDATED } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What BhriguWelt stores, where it goes and the rights you have under the GDPR.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated={LEGAL_UPDATED}>
      <Section title="Who is responsible">
        <OperatorBlock name={LEGAL.name} address={LEGAL.address} email={LEGAL.email} />
      </Section>

      <Section title="What stays on your device">
        <p>
          Your profiles (name, birth date, time and place, optional gender and birth-time accuracy) and saved readings
          are stored in your browser&apos;s IndexedDB, encrypted with a key derived from your passcode. We cannot read
          them. Clearing your browser data or using “Clear All Data” in Settings removes them.
        </p>
      </Section>

      <Section title="What is sent to our server, and why">
        <p>
          To compute a chart or reading, your birth date, time, place (or coordinates) and the options you chose are sent
          over HTTPS to our API. Legal basis: Art. 6(1)(b) GDPR, to provide the service you request.
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Our logs record request metadata (time, route, status) and the names of fields sent, never their values.</li>
          <li>Computed readings may be cached for up to 30 days under a keyed hash of the birth data so the same chart is not computed twice. Questions you type are stored only as a hash.</li>
          <li>Rate limiting uses your IP address and a random device ID for a short period to prevent abuse (Art. 6(1)(f) GDPR).</li>
        </ul>
      </Section>

      <Section title="Service providers">
        <ul className="ml-5 list-disc space-y-1">
          <li>Vercel Inc. hosts this website.</li>
          <li>Render Services, Inc. hosts our API and database.</li>
          <li>Sarvam AI (India) writes the text of readings from your computed chart. It receives chart data and your question, not your name.</li>
          <li>OpenStreetMap Nominatim converts the place name you enter into coordinates.</li>
        </ul>
        <p className="mt-2">
          Where a provider processes data outside the EU, the transfer relies on the safeguards that provider offers (such
          as standard contractual clauses).
        </p>
      </Section>

      <Section title="Cookies and storage">
        <p>
          We set no advertising or tracking cookies. Local storage holds your preferences, the GDPR notice choice and the
          encrypted data described above. Fonts are served from our own domain.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You may request access, correction, deletion, restriction or portability of your data and object to processing
          (Art. 15–21 GDPR). Contact us at the address above. You may also complain to a data protection supervisory
          authority.
        </p>
      </Section>
    </LegalPage>
  );
}
