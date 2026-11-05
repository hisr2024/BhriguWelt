/**
 * Operator details for the Impressum and privacy policy (§ 5 DDG, Art. 13 GDPR).
 * Set these in Vercel → Settings → Environment Variables; nothing is invented here.
 */
export const LEGAL = {
  name: process.env.NEXT_PUBLIC_LEGAL_NAME || '',
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || '',
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL || '',
  phone: process.env.NEXT_PUBLIC_LEGAL_PHONE || '',
  vatId: process.env.NEXT_PUBLIC_LEGAL_VAT_ID || '',
};

export const LEGAL_COMPLETE = Boolean(LEGAL.name && LEGAL.address && LEGAL.email);
export const LEGAL_UPDATED = '5 November 2026';
