'use client';

import { Calendar } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useActiveProfile } from '@/lib/hooks/useActiveProfile';
import { useI18n } from '@/lib/context/I18nContext';

export default function LifeEventsPage() {
  const { t } = useI18n();
  const { profile, profileReady } = useActiveProfile();

  if (!profileReady) {
    return <PredictionViewSkeleton />;
  }

  return (
    <PredictionErrorBoundary context="life-events">
      <BhriguPredictionView
        category="life-events"
        title={t('bhriguPages.lifeEvents.title')}
        description={t('bhriguPages.lifeEvents.description')}
        icon={<Calendar className="w-10 h-10 text-green-400" />}
        fetchPrediction={bhriguPredictionsAPI.getLifeEvents}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
