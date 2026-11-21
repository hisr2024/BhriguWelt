import { webPrices, FREE_READINGS, type BillingConfig } from '@/lib/premium';

jest.mock('@/lib/api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));

const config = (prices: any): BillingConfig => ({
  enforced: true,
  trial_days: 7,
  voice_minutes: 30,
  play: { available: false, package: 'app.bhriguwelt.twa', products: { monthly: 'premium_monthly', yearly: 'premium_yearly' } },
  stripe: { available: true, prices },
  restore_by_email: false,
  voice: { available: true, engine: 'sarvam' },
});

describe('premium prices', () => {
  const prices = {
    monthly: { currency: 'eur', amount: 599, options: { eur: 599, inr: 24900, usd: 599, gbp: 499 } },
    yearly: { currency: 'eur', amount: 4499, options: { eur: 4499, inr: 229900, usd: 4499, gbp: 3999 } },
  };

  it('uses the currency option for the reader', () => {
    const p = webPrices(config(prices), 'inr')!;
    expect(p.monthly).toContain('249');
    expect(p.yearly).toContain('2,299');
    expect(p.savePercent).toBe(23);
  });

  it('falls back to the default currency', () => {
    const p = webPrices(config(prices), 'jpy')!;
    expect(p.monthly).toContain('5.99');
    expect(p.savePercent).toBe(37);
  });

  it('returns null without Stripe prices', () => {
    expect(webPrices(config(null))).toBeNull();
  });

  it('keeps the Karmic journey free', () => {
    expect(FREE_READINGS.has('karmic-journey')).toBe(true);
    expect(FREE_READINGS.has('past-lives')).toBe(false);
  });
});
