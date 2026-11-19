'use client';

import { Scale } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useActiveProfile } from '@/lib/hooks/useActiveProfile';
import { useI18n } from '@/lib/context/I18nContext';

export default function KarmicDebtsPage() {
  const { t } = useI18n();
  const { profile, profileReady } = useActiveProfile();

  if (!profileReady) {
    return <PredictionViewSkeleton />;
  }

  return (
    <PredictionErrorBoundary context="karmic-debts">
      <BhriguPredictionView
        category="karmic-debts"
        title={t('bhriguPages.karmicDebts.title')}
        description={t('bhriguPages.karmicDebts.description')}
        icon={<Scale className="w-10 h-10 text-purple-400" />}
        fetchPrediction={bhriguPredictionsAPI.getKarmicDebts}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
