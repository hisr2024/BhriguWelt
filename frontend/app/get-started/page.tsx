'use client';

import { useState, useEffect } from 'react';
import { GenderField, BirthTimeAccuracyField } from '@/app/components/BirthPrecisionFields';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield } from 'lucide-react';
import { type BirthDetails } from '@/lib/api';
import { useEncryption } from '@/lib/context/EncryptionContext';
import {
  createProfileWithRetry,
  type ProfileData,
  type ProfileCreationProgress,
} from '@/lib/services/profileCreationService';
import ProfileCreationProgressComponent from '@/components/ProfileCreationProgress';
import { unlockHref } from '@/lib/unlockRedirect';

export default function GetStartedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BirthDetails & { name: string }>({
    name: '',
    date_of_birth: '',
    time_of_birth: '',
    place_of_birth: '',
  });
  const [manualCoordsEnabled, setManualCoordsEnabled] = useState(false);
  const [manualCoords, setManualCoords] = useState({ latitude: '', longitude: '' });
  const [creationProgress, setCreationProgress] = useState<ProfileCreationProgress | null>(null);
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const today = new Date().toISOString().split('T')[0] ?? '';

  const validateName = (value: string) => value.trim().length >= 2 && value.trim().length <= 80;
  const validateDate = (value: string) => {
    if (!value) return false;
    if (value > today) return false;
    return value >= '1900-01-01';
  };
  const validateTime = (value: string) => Boolean(value && value.length >= 4);
  const validatePlace = (value: string) => /[a-zA-Z]/.test(value) && value.trim().length >= 2;

  useEffect(() => {
    if (!encryptionLoading && !isSetup) {
      router.push('/setup-passcode');
    }
  }, [encryptionLoading, isSetup, router]);

  useEffect(() => {
    if (!encryptionLoading && isSetup && !isUnlocked) {
      router.push(unlockHref());
    }
  }, [encryptionLoading, isSetup, isUnlocked, router]);

  const runProfileCreation = async () => {
    if (!encryptionKey) {
      setError('Please unlock the app first');
      return;
    }
    if (!validateName(formData.name) || !validateDate(formData.date_of_birth) || !validateTime(formData.time_of_birth) || !validatePlace(formData.place_of_birth)) {
      setError('Please enter valid birth details so we can calculate an accurate chart.');
      return;
    }
    const latitudeValue = manualCoords.latitude.trim() === '' ? undefined : Number(manualCoords.latitude);
    const longitudeValue = manualCoords.longitude.trim() === '' ? undefined : Number(manualCoords.longitude);
    if (manualCoordsEnabled && ((latitudeValue !== undefined && Number.isNaN(latitudeValue)) || (longitudeValue !== undefined && Number.isNaN(longitudeValue)))) {
      setError('Please enter valid numeric values for latitude and longitude.');
      return;
    }
    setLoading(true);
    setError('');
    setCreationProgress(null);

    try {
      // Build profile data
      const profileData: ProfileData = {
        name: formData.name,
        date_of_birth: formData.date_of_birth,
        time_of_birth: formData.time_of_birth,
        place_of_birth: formData.place_of_birth,
        gender: formData.gender,
        birth_time_accuracy: formData.birth_time_accuracy,
      };

      // Only add coordinates if both are present and are valid numbers
      if (
        latitudeValue !== undefined &&
        longitudeValue !== undefined &&
        !Number.isNaN(latitudeValue) &&
        !Number.isNaN(longitudeValue)
      ) {
        profileData.latitude = latitudeValue;
        profileData.longitude = longitudeValue;
      }

      // Ensure encryption key is available
      if (!encryptionKey) {
        setError('Encryption key not available. Please unlock your profile first.');
        setLoading(false);
        return;
      }

      // Create profile with progress tracking and retry logic
      const result = await createProfileWithRetry(
        profileData,
        {
          encryptionKey,
          onProgress: (progress) => {
            setCreationProgress(progress);
          },
        },
        2 // Max 3 attempts total (2 retries)
      );

      if (result.success) {
        // Navigate to dashboard on success
        router.push('/dashboard');
      } else {
        // Handle error with user-friendly message
        const errorMessage = result.error?.message || 'Failed to create profile. Please try again.';
        setError(errorMessage);
        setCreationProgress(null);
      }
    } catch (err: any) {
      // Fallback error handling
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setCreationProgress(null);
      console.error('Profile creation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runProfileCreation();
  };

  if (encryptionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loading-spinner" role="status" aria-label="Loading" />
      </div>
    );
  }

  const isStepValid = () => {
    if (step === 1) return validateName(formData.name);
    if (step === 2) return validateDate(formData.date_of_birth);
    if (step === 3) return validateTime(formData.time_of_birth);
    if (step === 4) return validatePlace(formData.place_of_birth);
    return false;
  };

  const STEPS = [
    { title: "What's your name?", note: 'Your readings will be addressed to you.' },
    { title: 'When were you born?', note: 'Your birth date sets the planetary positions.' },
    { title: 'What time?', note: 'The exact time fixes your ascendant and houses.' },
    { title: 'Where were you born?', note: 'The place gives the coordinates and time zone.' },
  ];
  const current = STEPS[step - 1] ?? STEPS[0]!;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-10">
      <p className="text-center font-display text-lg uppercase tracking-[0.08em] text-gold-200">BhriguWelt</p>

      <div className="mt-10 text-center">
        <p className="nadi-eyebrow">Step {step} of 4</p>
        <h1 className="mt-2 text-3xl text-ivory md:text-4xl">{current.title}</h1>
        <p className="mt-2 text-sm text-ivory-2">{current.note}</p>
      </div>

      <form onSubmit={handleSubmit} className="nadi-card mt-8 space-y-6">
        <div className="flex gap-2" aria-hidden>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-gold-400' : 'bg-white/10'}`} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <label htmlFor="onb-name" className="mb-2 block text-sm text-ivory-2">Your name</label>
            <input id="onb-name" type="text" required placeholder="Arjun Kumar" autoComplete="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="nadi-input text-lg" autoFocus />
            <div className="mt-5">
              <GenderField value={formData.gender} onChange={(gender) => setFormData({ ...formData, gender })} />
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <label htmlFor="onb-date" className="mb-2 block text-sm text-ivory-2">Date of birth</label>
            <input id="onb-date" type="date" required min="1900-01-01" max={today} value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="nadi-input text-lg" autoFocus />
          </div>
        )}
        {step === 3 && (
          <div>
            <label htmlFor="onb-time" className="mb-2 block text-sm text-ivory-2">Time of birth</label>
            <input id="onb-time" type="time" required value={formData.time_of_birth} onChange={(e) => setFormData({ ...formData, time_of_birth: e.target.value })} className="nadi-input text-lg" autoFocus />
            <p className="mt-2 text-xs text-ivory-muted">An exact time gives more precise dates in your readings.</p>
            <div className="mt-5">
              <BirthTimeAccuracyField value={formData.birth_time_accuracy} onChange={(birth_time_accuracy) => setFormData({ ...formData, birth_time_accuracy })} />
            </div>
          </div>
        )}
        {step === 4 && (
          <div>
            <label htmlFor="onb-place" className="mb-2 block text-sm text-ivory-2">Place of birth</label>
            <input id="onb-place" type="text" required placeholder="New Delhi, India" autoComplete="address-level2" value={formData.place_of_birth} onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })} className="nadi-input text-lg" autoFocus />
            <p className="mt-2 text-xs text-ivory-muted">City and country.</p>
            <div className="mt-5 space-y-4">
              <label className="flex min-h-[44px] items-center gap-3 text-sm text-ivory-2">
                <input type="checkbox" checked={manualCoordsEnabled} onChange={(e) => setManualCoordsEnabled(e.target.checked)} className="h-5 w-5 accent-[#D4AF5F]" />
                Enter latitude and longitude myself
              </label>
              {manualCoordsEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="onb-lat" className="mb-1 block text-xs text-ivory-muted">Latitude</label>
                    <input id="onb-lat" type="number" step="0.0001" placeholder="28.6139" value={manualCoords.latitude} onChange={(e) => setManualCoords({ ...manualCoords, latitude: e.target.value })} className="nadi-input" />
                  </div>
                  <div>
                    <label htmlFor="onb-lon" className="mb-1 block text-xs text-ivory-muted">Longitude</label>
                    <input id="onb-lon" type="number" step="0.0001" placeholder="77.2090" value={manualCoords.longitude} onChange={(e) => setManualCoords({ ...manualCoords, longitude: e.target.value })} className="nadi-input" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-kumkum-500/50 bg-kumkum-900/40 px-4 py-3 text-sm text-kumkum-100">{error}</p>
        )}
        {loading && creationProgress && (
          <ProfileCreationProgressComponent progress={creationProgress} error={error} onRetry={error ? runProfileCreation : undefined} />
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="nadi-btn-ghost flex-1">Back</button>
          )}
          {step < 4 ? (
            <button type="button" onClick={() => setStep(step + 1)} disabled={!isStepValid()} className="nadi-btn flex-1">
              Continue <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
          ) : (
            <button type="submit" disabled={loading || !isStepValid()} className="nadi-btn flex-1">
              {loading ? 'Calculating…' : 'Calculate my chart'}
            </button>
          )}
        </div>

        <p className="flex items-center justify-center gap-2 text-xs text-ivory-muted">
          <Shield className="h-4 w-4 text-gold-400" aria-hidden /> Encrypted on this device with your passcode
        </p>
      </form>
    </div>
  );
}
