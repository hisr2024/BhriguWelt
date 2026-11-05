'use client';

import { Heart } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useActiveProfile } from '@/lib/hooks/useActiveProfile';
import { useI18n } from '@/lib/context/I18nContext';

export default function RelationshipsPage() {
  const { t } = useI18n();
  const { profile, profileReady } = useActiveProfile();

  if (!profileReady) {
    return <PredictionViewSkeleton />;
  }

  return (
    <PredictionErrorBoundary context="relationships">
      <BhriguPredictionView
        category="relationships"
        title={t('bhriguPages.relationships.title')}
        description={t('bhriguPages.relationships.description')}
        icon={<Heart className="w-10 h-10 text-red-400" />}
        fetchPrediction={bhriguPredictionsAPI.getRelationships}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
