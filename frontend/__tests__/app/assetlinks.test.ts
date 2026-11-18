import { assetLinks } from '@/lib/assetLinks';

const FP = Array.from({ length: 32 }, (_, i) => ((i * 7) % 256).toString(16).padStart(2, '0')).join(':');

describe('assetlinks.json', () => {
  it('is empty until the package and fingerprint are set', () => {
    expect(assetLinks({})).toBeNull();
    expect(assetLinks({ ANDROID_PACKAGE_NAME: 'app.bhriguwelt.twa' })).toBeNull();
  });

  it('lists the package and every valid fingerprint, upper-cased', () => {
    const [entry] = assetLinks({
      ANDROID_PACKAGE_NAME: 'app.bhriguwelt.twa',
      ANDROID_SHA256_CERT_FINGERPRINTS: `${FP}, not-a-fingerprint`,
    })!;
    expect(entry!.relation).toEqual(['delegate_permission/common.handle_all_urls']);
    expect(entry!.target.package_name).toBe('app.bhriguwelt.twa');
    expect(entry!.target.sha256_cert_fingerprints).toEqual([FP.toUpperCase()]);
  });
});
