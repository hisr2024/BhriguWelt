'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GenZCard from '../components/GenZCard';
import GenZButton from '../components/GenZButton';
import GenZBadge from '../components/GenZBadge';
import { createAndSaveBirthChart, validateBirthChart } from '@/lib/birthChartManager';
import { useEncryption } from '@/lib/context/EncryptionContext';

export default function CreateBirthChartForm() {
  const router = useRouter();
  const { encryptionKey } = useEncryption();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validateBirthChart(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const result = await createAndSaveBirthChart(formData, encryptionKey ?? undefined);
    setLoading(false);

    if (result.success) {
      router.push('/birth-chart/view');
      return;
    }

    setError(result.message ?? 'Unable to create your birth chart right now.');
  };

  return (
    <GenZCard variant="glass" className="max-w-2xl w-full mx-auto">
      <div className="text-center mb-6">
        <GenZBadge variant="neon" size="lg" className="mb-4">
          ✨ Create Birth Chart
        </GenZBadge>
        <h1 className="genz-title mb-2">Start Your Cosmic Blueprint</h1>
        <p className="text-white/80">Enter the essentials so we can generate your chart.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-white/70 mb-2" htmlFor="name">Name (optional)</label>
          <input
            id="name"
            type="text"
            className="genz-input-glass w-full"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-2" htmlFor="dateOfBirth">Date of birth</label>
            <input
              id="dateOfBirth"
              type="date"
              className="genz-input-glass w-full"
              value={formData.dateOfBirth}
              onChange={(event) => setFormData((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2" htmlFor="timeOfBirth">Time of birth</label>
            <input
              id="timeOfBirth"
              type="time"
              className="genz-input-glass w-full"
              value={formData.timeOfBirth}
              onChange={(event) => setFormData((prev) => ({ ...prev, timeOfBirth: event.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2" htmlFor="placeOfBirth">Place of birth</label>
          <input
            id="placeOfBirth"
            type="text"
            className="genz-input-glass w-full"
            value={formData.placeOfBirth}
            onChange={(event) => setFormData((prev) => ({ ...prev, placeOfBirth: event.target.value }))}
            placeholder="City, Country"
            required
          />
        </div>

        {error && (
          <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <GenZButton type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Saving your chart...' : 'Create Birth Chart'}
        </GenZButton>
      </form>
    </GenZCard>
  );
}
