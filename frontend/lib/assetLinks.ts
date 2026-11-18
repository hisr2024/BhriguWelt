/** Digital Asset Links statements for the Android app (see app/.well-known/assetlinks.json). */
const FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

/** The asset-links statements for the given environment, or null when not configured. */
export function assetLinks(env: Record<string, string | undefined>) {
  const pkg = (env.ANDROID_PACKAGE_NAME || '').trim();
  const fingerprints = (env.ANDROID_SHA256_CERT_FINGERPRINTS || '')
    .split(/[\s,]+/)
    .map((f) => f.trim().toUpperCase())
    .filter((f) => FINGERPRINT.test(f));
  if (!pkg || fingerprints.length === 0) return null;
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: fingerprints },
    },
  ];
}
