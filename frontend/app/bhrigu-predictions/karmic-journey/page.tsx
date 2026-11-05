'use client';

import { Target } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useActiveProfile } from '@/lib/hooks/useActiveProfile';
import { useI18n } from '@/lib/context/I18nContext';

export default function KarmicJourneyPage() {
  const { t } = useI18n();
  const { profile, profileReady } = useActiveProfile();

  if (!profileReady) {
    return <PredictionViewSkeleton />;
  }

  return (
    <PredictionErrorBoundary context="karmic-journey">
      <BhriguPredictionView
        category="karmic-journey"
        title={t('bhriguPages.karmicJourney.title')}
        description={t('bhriguPages.karmicJourney.description')}
        icon={<Target className="w-10 h-10 text-cyan-400" />}
        fetchPrediction={bhriguPredictionsAPI.getKarmicJourney}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
