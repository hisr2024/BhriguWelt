'use client';

import { TrendingUp } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useActiveProfile } from '@/lib/hooks/useActiveProfile';
import { useI18n } from '@/lib/context/I18nContext';

export default function FutureLivesPage() {
  const { t } = useI18n();
  const { profile, profileReady } = useActiveProfile();

  if (!profileReady) {
    return <PredictionViewSkeleton />;
  }

  return (
    <PredictionErrorBoundary context="future-lives">
      <BhriguPredictionView
        category="future-lives"
        title={t('bhriguPages.futureLives.title')}
        description={t('bhriguPages.futureLives.description')}
        icon={<TrendingUp className="w-10 h-10 text-orange-400" />}
        fetchPrediction={bhriguPredictionsAPI.getFutureLives}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
