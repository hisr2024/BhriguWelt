import { setItem, STORES } from './storage';

export interface BirthChartInput {
  name?: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  latitude?: number;
  longitude?: number;
}

export function validateBirthChart(chart: BirthChartInput): string | null {
  const trimmedName = chart.name?.trim();
  const trimmedPlace = chart.placeOfBirth?.trim();
  const today = new Date().toISOString().split('T')[0];

  if (trimmedName && (trimmedName.length < 2 || trimmedName.length > 80)) {
    return 'Please enter a valid name (2-80 characters).';
  }
  if (!chart.dateOfBirth) return 'Please enter your date of birth.';
  if (chart.dateOfBirth < '1900-01-01' || chart.dateOfBirth > today) {
    return 'Please enter a valid birth date.';
  }
  if (!chart.timeOfBirth) return 'Please enter your time of birth.';
  const timeMatch = chart.timeOfBirth.match(/^([01]\\d|2[0-3]):([0-5]\\d)$/);
  if (!timeMatch) {
    return 'Please enter a valid birth time.';
  }
  if (!trimmedPlace || trimmedPlace.length < 2) {
    return 'Please enter your place of birth.';
  }
  if (!/[a-zA-Z]/.test(trimmedPlace)) {
    return 'Please enter a valid place of birth.';
  }
  return null;
}

export async function createAndSaveBirthChart(
  chart: BirthChartInput,
  encryptionKey?: CryptoKey
): Promise<{ success: boolean; id?: string | number; message?: string }> {
  const validationError = validateBirthChart(chart);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const reportData = {
    profileId: 1,
    type: 'birth-chart',
    title: 'Birth Chart',
    data: {
      name: chart.name,
      dateOfBirth: chart.dateOfBirth,
      timeOfBirth: chart.timeOfBirth,
      placeOfBirth: chart.placeOfBirth,
      latitude: chart.latitude,
      longitude: chart.longitude,
    },
    generatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const id = await setItem(STORES.REPORTS, 'current_birth_chart', reportData, encryptionKey);
    return { success: true, id: id as string | number };
  } catch (error) {
    console.warn('Birth chart save failed, falling back to localStorage', error);
  }

  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    try {
      const sanitizedReportData = {
        ...reportData,
        data: {
          ...reportData.data,
          dateOfBirth: undefined,
          timeOfBirth: undefined,
          latitude: undefined,
          longitude: undefined,
        },
      };
      window.localStorage.setItem('current_birth_chart', JSON.stringify(sanitizedReportData));
      return { success: true, id: 'local' };
    } catch (error) {
      console.warn('Birth chart localStorage save failed', error);
    }
  }

  return { success: false, message: 'Unable to save birth chart. Please try again.' };
}
