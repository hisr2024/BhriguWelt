import { apiBase, backendUrl, enableProxyMode, PROXY_BASE } from '@/lib/backendUrl';

describe('backendUrl', () => {
  beforeEach(() => window.localStorage.clear());

  it('goes straight to the backend by default', () => {
    expect(apiBase()).not.toBe(PROXY_BASE);
    expect(backendUrl('/api/ai/compose')).toMatch(/^https?:\/\/.+\/api\/ai\/compose$/);
  });

  it('uses the same-origin proxy once a device has switched to it', () => {
    enableProxyMode();
    expect(apiBase()).toBe(PROXY_BASE);
    expect(backendUrl('api/ai/compose')).toBe('/backend/api/ai/compose');
  });
});
