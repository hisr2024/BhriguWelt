'use client';

import { History } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useActiveProfile } from '@/lib/hooks/useActiveProfile';
import { useI18n } from '@/lib/context/I18nContext';

export default function PastLivesPage() {
  const { t } = useI18n();
  const { profile, profileReady } = useActiveProfile();

  if (!profileReady) {
    return <PredictionViewSkeleton />;
  }

  return (
    <PredictionErrorBoundary context="past-lives">
      <BhriguPredictionView
        category="past-lives"
        title={t('bhriguPages.pastLives.title')}
        description={t('bhriguPages.pastLives.description')}
        icon={<History className="w-10 h-10 text-purple-400" />}
        fetchPrediction={bhriguPredictionsAPI.getPastLives}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
