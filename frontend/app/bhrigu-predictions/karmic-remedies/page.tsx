'use client';

import { Sparkles } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useActiveProfile } from '@/lib/hooks/useActiveProfile';
import { useI18n } from '@/lib/context/I18nContext';

export default function KarmicRemediesPage() {
  const { t } = useI18n();
  const { profile, profileReady } = useActiveProfile();

  if (!profileReady) {
    return <PredictionViewSkeleton />;
  }

  return (
    <PredictionErrorBoundary context="karmic-remedies">
      <BhriguPredictionView
        category="karmic-remedies"
        title={t('bhriguPages.karmicRemedies.title')}
        description={t('bhriguPages.karmicRemedies.description')}
        icon={<Sparkles className="w-10 h-10 text-pink-400" />}
        fetchPrediction={bhriguPredictionsAPI.getKarmicRemedies}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
