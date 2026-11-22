const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'p', auth: 'a' } }),
  unsubscribe: jest.fn(async () => true),
};
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(async () => ({ status: 200, data: { available: true, public_key: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U' } })),
    post: jest.fn(async (url: string, body: any) => ({
      status: 200,
      data: { saved: true, personal: Boolean(body.birth), morning: body.morning, evening: body.evening,
        morning_at: body.morning_at, evening_at: body.evening_at },
    })),
  },
}));

import { api } from '@/lib/api';
import { DEFAULT_PREFS, enableNotifications, notificationState, readPrefs } from '@/lib/notifications';

function installPush(permission: NotificationPermission) {
  const pushManager = {
    getSubscription: jest.fn(async () => null as any),
    subscribe: jest.fn(async () => subscription),
  };
  const reg = { pushManager };
  (window as any).PushManager = function PushManager() {};
  (window as any).Notification = { permission, requestPermission: jest.fn(async () => 'granted') };
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: jest.fn(async () => reg), register: jest.fn(async () => reg), ready: Promise.resolve(reg) },
  });
  return pushManager;
}

describe('notifications', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to 07:00 and 20:00, personal', () => {
    expect(readPrefs()).toEqual(DEFAULT_PREFS);
  });

  it('reports off before permission and subscribes with times, time zone and birth', async () => {
    const push = installPush('default');
    expect(await notificationState()).toBe('off');
    const saved = await enableNotifications({ ...DEFAULT_PREFS, morning_at: '06:30' }, {
      dateOfBirth: '1990-05-15', timeOfBirth: '10:30', placeOfBirth: 'New Delhi',
    });
    expect(push.subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }));
    const [url, body] = (api.post as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/notifications/subscribe');
    expect(body.morning_at).toBe('06:30');
    expect(body.birth.date_of_birth).toBe('1990-05-15');
    expect(typeof body.tz).toBe('string');
    expect(saved.personal).toBe(true);
    expect(readPrefs().morning_at).toBe('06:30');
  });

  it('sends no birth details when personal messages are off', async () => {
    installPush('granted');
    (api.post as jest.Mock).mockClear();
    const saved = await enableNotifications({ ...DEFAULT_PREFS, personal: false }, { dateOfBirth: '1990-05-15', timeOfBirth: '10:30' });
    const body = (api.post as jest.Mock).mock.calls[0][1];
    expect(body.birth).toBeUndefined();
    expect(body.personal).toBe(false);
    expect(saved.personal).toBe(false);
  });
});
