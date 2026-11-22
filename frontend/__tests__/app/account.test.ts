const store: any[] = [];
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(async () => ({ status: 200, data: { profiles: [
      { name: 'Asha', dateOfBirth: '1990-05-15', timeOfBirth: '10:30', placeOfBirth: 'New Delhi' },
      { name: 'Ravi', dateOfBirth: '1985-01-02', timeOfBirth: '06:00', placeOfBirth: 'Pune' },
    ] } })),
    put: jest.fn(async () => ({ status: 200, data: {} })),
  },
}));
jest.mock('@/lib/storage', () => ({
  STORES: { PROFILES: 'profiles' },
  getAllItems: jest.fn(async () => store.map((p, i) => ({ ...p, id: i + 1 }))),
  setItem: jest.fn(async (_s: string, _k: string, data: any) => { store.push(data); return store.length; }),
}));

import { api } from '@/lib/api';
import { syncProfiles } from '@/lib/account';
import { saveSession } from '@/lib/accountStore';

describe('profile sync', () => {
  it('adds missing profiles locally and uploads the union without ids', async () => {
    store.push({ name: 'asha ', dateOfBirth: '1990-05-15', timeOfBirth: '10:30', placeOfBirth: 'new delhi' });
    store.push({ name: 'Mira', dateOfBirth: '2000-03-03', timeOfBirth: '12:00', placeOfBirth: 'Berlin' });
    saveSession('s', { email: 'a@example.com' });
    const result = await syncProfiles({} as CryptoKey);
    expect(result).toEqual({ added: 1, total: 3 });
    expect(store.map((p) => p.name)).toEqual(['asha ', 'Mira', 'Ravi']);
    const uploaded = (api.put as jest.Mock).mock.calls[0][1].profiles;
    expect(uploaded).toHaveLength(3);
    expect(uploaded.every((p: any) => !('id' in p))).toBe(true);
  });

  it('does nothing when signed out', async () => {
    saveSession(null, null);
    expect(await syncProfiles({} as CryptoKey)).toEqual({ added: 0, total: 0 });
  });
});
