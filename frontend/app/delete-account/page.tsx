import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, Section } from '@/components/legal/LegalPage';
import { LEGAL, LEGAL_UPDATED } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Delete your BhriguWelt account and data',
  description: 'How to delete your BhriguWelt account, your synced birth profiles and the data on your device.',
  alternates: { canonical: '/delete-account' },
};

const SUPPORT = LEGAL.email || 'support@kiaanverse.com';

export default function DeleteAccountPage() {
  return (
    <LegalPage title="Delete your BhriguWelt account and data" updated={LEGAL_UPDATED}>
      <Section title="Delete your account (BhriguWelt app or website)">
        <ol className="ml-5 list-decimal space-y-1">
          <li>Open BhriguWelt (the Android app or <Link href="/account" className="underline">bhriguwelt.app/account</Link>).</li>
          <li>Go to <strong>Me → Account</strong> and sign in with the same Google account or e-mail you used.</li>
          <li>Tap <strong>Delete account</strong>, then <strong>Yes, delete my account</strong>.</li>
        </ol>
        <p className="mt-2">
          This deletes immediately and permanently: your account (e-mail address and name), the birth profiles synced to
          your account, the link between your account and your Premium purchase, and any pending sign-in codes.
        </p>
      </Section>

      <Section title="Delete the data on your phone or computer">
        <p>
          Birth profiles and readings saved on a device are stored there, encrypted. Remove them under{' '}
          <strong>Settings → Clear All Data</strong>, or by uninstalling the app or clearing the browser&apos;s site data.
        </p>
      </Section>

      <Section title="Delete without using the app">
        <p>
          E-mail <a href={`mailto:${SUPPORT}`} className="underline">{SUPPORT}</a> from the address of your
          account with the subject “Delete my BhriguWelt account”. We delete it within 30 days and confirm by e-mail. You
          can also ask us to delete only some data (for example your synced profiles) and keep the account.
        </p>
      </Section>

      <Section title="What is kept, and for how long">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Payment records are kept by Google Play or Stripe, not by us, for the period the law requires. Deleting your
            account does not cancel a subscription: cancel it first in Google Play or under Manage or cancel on the
            Premium page.
          </li>
          <li>Cached readings (stored only under a keyed hash of the chart, without your name) expire within 30 days.</li>
          <li>Read-aloud audio kept on our server to avoid producing it twice is removed automatically over time.</li>
          <li>Server logs contain no names or birth details and are deleted on a rolling basis.</li>
        </ul>
      </Section>
    </LegalPage>
  );
}
