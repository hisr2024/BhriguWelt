/**
 * Digital Asset Links for the Android app (Trusted Web Activity).
 *
 * Android checks this file to confirm that bhriguwelt.app and the Play app
 * belong together; only then does the app open without a browser address bar.
 * Set in Vercel → Settings → Environment Variables (then redeploy):
 *   ANDROID_PACKAGE_NAME              e.g. app.bhriguwelt.twa
 *   ANDROID_SHA256_CERT_FINGERPRINTS  one or more SHA-256 fingerprints, comma-separated
 *                                     (the upload key from PWABuilder and, once the
 *                                     app is on Play, the Play App Signing key)
 * Fingerprints are public values, not secrets.
 */
export const dynamic = 'force-static';

import { assetLinks } from '@/lib/assetLinks';

export function GET() {
  const body = assetLinks(process.env);
  if (!body) {
    return new Response('[]', { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
  });
}
