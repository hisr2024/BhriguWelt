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
          <li>If you use Listen, the text of the reading is turned into speech and the audio is kept on our server for a limited time so a replay is not produced twice. Your device keeps it only while the app is open.</li>
          <li>Account (optional): if you sign in with Google or an e-mail code, we store your e-mail address (and name from Google), the link to your Premium purchase and, so they appear on your other devices, your birth profiles encrypted on our server (Art. 6(1)(b) GDPR). Sign-in codes are stored only as a hash and expire after 10 minutes. You can delete your account at any time under Me → Account, or at bhriguwelt.app/account.</li>
          <li>Premium: we store no card details. Your device keeps a signed code naming your Google Play purchase or Stripe customer, and we count listening minutes per month against an anonymous number derived from it (Art. 6(1)(b) GDPR).</li>
        </ul>
      </Section>

      <Section title="Service providers">
        <ul className="ml-5 list-disc space-y-1">
          <li>Vercel Inc. hosts this website.</li>
          <li>Render Services, Inc. hosts our API and database.</li>
          <li>Sarvam AI (India) writes the text of readings from your computed chart. It receives chart data and your question, not your name.</li>
          <li>OpenStreetMap Nominatim and Komoot Photon convert the place name you enter into coordinates.</li>
          <li>Sarvam AI (India) turns reading text into speech when you press Listen.</li>
          <li>Google Play (in the Android app) or Stripe Payments Europe (on the website) take payment for Premium; their own privacy terms apply to payment data. Sign-in codes and restore links are e-mailed through Resend (or Twilio SendGrid). Google sign-in is provided by Google.</li>
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
