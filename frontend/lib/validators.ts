import type { Profile } from '@/lib/types';

export type ProfileValidationResult = {
  isValid: boolean;
  missingFields: string[];
};

const REQUIRED_PROFILE_FIELDS: Array<{
  label: string;
  isMissing: (profile: Profile) => boolean;
}> = [
  {
    label: 'Date of birth',
    isMissing: (profile) => !profile.dateOfBirth?.trim()
  },
  {
    label: 'Time of birth',
    isMissing: (profile) => !profile.timeOfBirth?.trim()
  },
  {
    label: 'Place of birth',
    isMissing: (profile) => !profile.placeOfBirth?.trim()
  },
  {
    label: 'Latitude',
    isMissing: (profile) => !Number.isFinite(profile.latitude)
  },
  {
    label: 'Longitude',
    isMissing: (profile) => !Number.isFinite(profile.longitude)
  }
];

export const validateProfile = (profile: Profile | null | undefined): ProfileValidationResult => {
  if (!profile) {
    return {
      isValid: false,
      missingFields: ['Profile information']
    };
  }

  const missingFields = REQUIRED_PROFILE_FIELDS.filter((field) => field.isMissing(profile)).map(
    (field) => field.label
  );

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};
