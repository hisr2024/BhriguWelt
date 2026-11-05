'use client';

import { Activity } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useActiveProfile } from '@/lib/hooks/useActiveProfile';
import { useI18n } from '@/lib/context/I18nContext';

export default function PredictionsPage() {
  const { t } = useI18n();
  const { profile, profileReady } = useActiveProfile();

  if (!profileReady) {
    return <PredictionViewSkeleton />;
  }

  return (
    <PredictionErrorBoundary context="predictions">
      <BhriguPredictionView
        category="predictions"
        title={t('bhriguPages.predictions.title')}
        description={t('bhriguPages.predictions.description')}
        icon={<Activity className="w-10 h-10 text-blue-400" />}
        fetchPrediction={bhriguPredictionsAPI.getPredictions}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
