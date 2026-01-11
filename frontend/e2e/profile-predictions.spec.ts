import { test, expect } from '@playwright/test';

type ProfileSeed = {
  id: number | string;
  key: string;
  value: {
    name: string;
    dateOfBirth: string;
    timeOfBirth: string;
    placeOfBirth: string;
    latitude?: number;
    longitude?: number;
    createdAt: string;
    updatedAt: string;
  };
};

const testProfile = {
  name: 'Aarav Sharma',
  dateOfBirth: '1992-04-12',
  timeOfBirth: '09:30',
  placeOfBirth: 'New Delhi, India',
  latitude: 28.6139,
  longitude: 77.2090,
};

const mockPresentLifeResponse = {
  data: {
    comprehensive_analysis: 'Your present life blends ambition with reflective growth.',
    career: 'Leadership opportunities are opening in creative problem-solving roles.',
    relationships: 'Meaningful partnerships thrive when you communicate openly.',
    health: 'Prioritize rest and steady routines to maintain energy.',
    financial: 'Stable gains come from disciplined planning and mindful spending.',
    spiritual_growth: 'Daily mindfulness keeps you aligned with your purpose.',
  },
};

const mockBirthChartResponse = {
  data: {
    chart: 'mock-chart-data',
  },
};

const mockBhriguPredictionResponse = {
  status: 'success',
  prediction: {
    category: 'present-life',
    title: 'Present Life',
    full_analysis: 'A complete reading that goes into detail about your present life journey.',
    current_phase: 'You are entering a phase of thoughtful expansion and steady progress.',
    career: 'Career momentum builds through collaboration and courageous leadership.',
    relationships: 'Relationships deepen through empathy and honest communication.',
  },
};

const seedProfileRecord = async (page, record: ProfileSeed & { encrypted?: boolean }) => {
  await page.evaluate(async (payload) => {
    const openDb = () => new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('BhriguWeltDB', 1);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = () => resolve(request.result);
    });

    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('profiles', 'readwrite');
      const store = transaction.objectStore('profiles');
      store.put({
        ...payload,
        encrypted: payload.encrypted ?? false,
        updatedAt: new Date().toISOString(),
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }, record);
};

const setupPasscode = async (page, passcode = '1234') => {
  await page.goto('/setup-passcode');
  await page.getByLabel('Enter Passcode').fill(passcode);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Confirm Passcode')).toBeVisible();
  await page.getByLabel('Confirm Passcode').fill(passcode);
  await page.getByRole('button', { name: 'Complete Setup' }).click();
  await page.waitForURL('**/get-started');
};

const submitProfile = async (page) => {
  await page.getByLabel('Your Name').fill(testProfile.name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Date of Birth')).toBeVisible();
  await page.getByLabel('Date of Birth').fill(testProfile.dateOfBirth);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Time of Birth')).toBeVisible();
  await page.getByLabel('Time of Birth').fill(testProfile.timeOfBirth);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Place of Birth')).toBeVisible();
  await page.getByLabel('Place of Birth').fill(testProfile.placeOfBirth);
  await page.getByRole('button', { name: 'Calculate My Chart' }).click();
  await page.waitForURL('**/dashboard');
};

test('submit profile and render present life sections', async ({ page }) => {
  await page.route('**/api/astrology/birth-chart', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockBirthChartResponse),
    })
  );
  await page.route('**/api/present-life/comprehensive-analysis', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPresentLifeResponse),
    })
  );

  await setupPasscode(page);
  await submitProfile(page);

  await seedProfileRecord(page, {
    id: 'current_profile',
    key: 'current_profile',
    value: {
      ...testProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  await page.goto('/present-life');
  await expect(page.getByRole('heading', { name: 'Career' })).toBeVisible();
  await expect(page.getByText(mockPresentLifeResponse.data.career)).toBeVisible();
});

test('offline present life fallback shows offline mode', async ({ page }) => {
  await page.route('**/api/present-life/comprehensive-analysis', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'offline' }),
    })
  );

  await setupPasscode(page);
  await seedProfileRecord(page, {
    id: 'current_profile',
    key: 'current_profile',
    value: {
      ...testProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  await page.goto('/present-life');
  await expect(page.getByText('Offline Mode')).toBeVisible();
});

test('uses cached bhrigu predictions when API is unavailable', async ({ page }) => {
  await page.route('**/api/bhrigu-predictions/present-life', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockBhriguPredictionResponse),
    })
  );

  await setupPasscode(page);
  await seedProfileRecord(page, {
    id: 1,
    key: 'profile_seed',
    value: {
      ...testProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  await page.goto('/bhrigu-predictions/present-life');
  await expect(page.getByText('Detailed Insights')).toBeVisible();
  await expect(page.getByText('Career & Professional Life')).toBeVisible();

  await page.unroute('**/api/bhrigu-predictions/present-life');
  await page.route('**/api/bhrigu-predictions/present-life', (route) => route.abort());

  await page.reload();
  await expect(page.getByText('Loaded from cache')).toBeVisible();
});

test('handles legacy-shaped profile records with storage fallback', async ({ page }) => {
  await setupPasscode(page);

  // Seed a legacy-shaped profile record (simulates older client data)
  await seedProfileRecord(page, {
    id: 10,
    key: 'current_profile',
    value: {
      ...testProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    encrypted: false,
  });

  // Mock API to ensure page renders with profile
  await page.route('**/api/bhrigu-predictions/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockBhriguPredictionResponse),
    })
  );

  // Visit horoscope page - should find profile via fallback cursor
  await page.goto('/horoscope');

  // Should not show "Please complete your profile first"
  await expect(page.getByText('Please complete your profile first')).not.toBeVisible();

  // Should show prediction content
  await expect(page.getByText('Your Predictions')).toBeVisible();
});

test('profile creation flow sets localStorage.current_profile_id', async ({ page }) => {
  await page.route('**/api/astrology/birth-chart', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockBirthChartResponse),
    })
  );

  await setupPasscode(page);
  await submitProfile(page);

  // Check that localStorage.current_profile_id is set
  const profileId = await page.evaluate(() => {
    return window.localStorage.getItem('current_profile_id');
  });

  expect(profileId).not.toBeNull();
  expect(profileId).toBeTruthy();

  // Verify profile can be loaded on another page
  await page.route('**/api/bhrigu-predictions/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockBhriguPredictionResponse),
    })
  );

  await page.goto('/horoscope');
  await expect(page.getByText('Your Predictions')).toBeVisible();
});

test('loads profile by ID when localStorage.current_profile_id is set', async ({ page }) => {
  await setupPasscode(page);

  // Seed profile with specific ID
  const profileId = 42;
  await seedProfileRecord(page, {
    id: profileId,
    key: 'test_profile',
    value: {
      ...testProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    encrypted: false,
  });

  // Set localStorage to point to this profile
  await page.evaluate((id) => {
    window.localStorage.setItem('current_profile_id', String(id));
  }, profileId);

  // Mock API
  await page.route('**/api/bhrigu-predictions/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockBhriguPredictionResponse),
    })
  );

  // Visit page - should load profile by ID
  await page.goto('/daily-insights');

  // Should render content
  await expect(page.getByText('Today\'s Forecast')).toBeVisible();
  await expect(page.getByText('Please complete your profile first')).not.toBeVisible();
});
