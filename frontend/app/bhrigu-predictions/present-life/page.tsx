'use client';

import { Sun } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useActiveProfile } from '@/lib/hooks/useActiveProfile';
import { useI18n } from '@/lib/context/I18nContext';

export default function PresentLifePage() {
  const { t } = useI18n();
  const { profile, profileReady } = useActiveProfile();

  if (!profileReady) {
    return <PredictionViewSkeleton />;
  }

  return (
    <PredictionErrorBoundary context="present-life">
      <BhriguPredictionView
        category="present-life"
        title={t('bhriguPages.presentLife.title')}
        description={t('bhriguPages.presentLife.description')}
        icon={<Sun className="w-10 h-10 text-yellow-400" />}
        fetchPrediction={bhriguPredictionsAPI.getPresentLife}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
