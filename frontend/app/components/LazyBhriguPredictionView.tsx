'use client';

import dynamic from 'next/dynamic';
import { PredictionViewSkeleton } from './LoadingStates';
import type { Profile, BirthDetails, PredictionResult } from '@/lib/types';

/**
 * Lazy-loaded Bhrigu Prediction View with code splitting
 *
 * This component uses Next.js dynamic imports to:
 * - Reduce initial bundle size
 * - Load prediction view only when needed
 * - Show loading skeleton during lazy load
 * - Enable code splitting for better performance
 */

interface LazyBhriguPredictionViewProps {
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fetchPrediction: (
    profileData: BirthDetails & { question?: string; force_regenerate?: boolean; language?: string }
  ) => Promise<PredictionResult>;
  profile: Profile | null;
}

// Dynamically import BhriguPredictionView with loading state
const BhriguPredictionView = dynamic(
  () => import('./BhriguPredictionView'),
  {
    loading: () => <PredictionViewSkeleton />,
    ssr: false, // Disable SSR for client-only prediction view
  }
);

export default function LazyBhriguPredictionView(props: LazyBhriguPredictionViewProps) {
  return <BhriguPredictionView {...props} />;
}
