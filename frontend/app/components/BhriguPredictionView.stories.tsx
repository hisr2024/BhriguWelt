import type { Meta, StoryObj } from '@storybook/react';
import { Sparkles } from 'lucide-react';
import BhriguPredictionView from './BhriguPredictionView';
import type { BhriguPrediction, PredictionResult, Profile } from '@/lib/types';

const baseProfile: Profile = {
  id: 101,
  name: 'Aanya Kapoor',
  dateOfBirth: '1992-08-17',
  timeOfBirth: '06:45',
  placeOfBirth: 'Mumbai, India',
  latitude: 19.076,
  longitude: 72.8777,
  createdAt: '2024-02-12T10:00:00.000Z',
  updatedAt: '2024-02-12T10:00:00.000Z'
};

const baseArgs = {
  category: 'present-life',
  title: 'Present Life',
  description: 'Comprehensive analysis of your current life path and opportunities.',
  icon: <Sparkles className="h-6 w-6 text-cyan-400" />,
  profile: baseProfile
};

const createPredictionResult = (prediction: BhriguPrediction): PredictionResult => ({
  status: 'success',
  message: 'Prediction ready',
  data: prediction,
  timestamp: new Date('2024-06-15T12:00:00.000Z').toISOString()
});

const parsedFullAnalysis = `## Current Life Phase\n\nYou are transitioning into a phase of decisive leadership where clarity arrives through mindful routines and supportive allies. This period encourages you to stabilize your energy before accelerating new ambitions.\n\n## Career & Professional Life\n\nProfessional growth favors deliberate planning, strategic networking, and steady skill upgrades. A balanced approach between creativity and discipline will unlock a more fulfilling role.\n\n## Relationships & Love\n\nEmotional bonds deepen when you prioritize honest conversations and shared goals. Your openness creates space for mutual respect and a stronger partnership foundation.\n\n## Health & Wellness\n\nFocus on restorative habits, hydration, and light movement to recalibrate your vitality. Small, consistent rituals will have the biggest impact on your wellbeing.\n\n## Financial Prospects\n\nYou benefit from structured budgeting and mindful investing. Avoid impulsive decisions and favor long-term stability over short-term gains.\n`;

const parsedPrediction: BhriguPrediction = {
  category: 'present-life',
  title: 'Present Life Reading',
  full_analysis: parsedFullAnalysis,
  metadata: {
    zodiac_sign: 'Leo',
    nakshatra: 'Magha',
    tradition: 'Bhrigu Samhita'
  },
  generated_at: '2024-06-15T12:00:00.000Z'
};

const fullAnalysisOnlyPrediction: BhriguPrediction = {
  category: 'present-life',
  title: 'Full Analysis Only',
  full_analysis:
    'Your journey emphasizes steady progress, intuitive decision-making, and mindful connection with the people who inspire you. Lean into the practices that keep you grounded and allow your creativity to guide each step forward.',
  metadata: {
    zodiac_sign: 'Virgo',
    nakshatra: 'Hasta',
    tradition: 'Nadi Jyotisa'
  },
  generated_at: '2024-06-15T12:00:00.000Z'
};

const meta: Meta<typeof BhriguPredictionView> = {
  title: 'Predictions/BhriguPredictionView',
  component: BhriguPredictionView,
  parameters: {
    layout: 'fullscreen'
  }
};

export default meta;

type Story = StoryObj<typeof BhriguPredictionView>;

export const Loading: Story = {
  args: {
    ...baseArgs,
    profile: {
      ...baseProfile,
      id: 201
    },
    fetchPrediction: () => new Promise<PredictionResult>(() => {})
  }
};

export const Error: Story = {
  args: {
    ...baseArgs,
    profile: {
      ...baseProfile,
      id: 202
    },
    fetchPrediction: async () => {
      const error = new Error('Service unavailable');
      (error as Error & { response?: { status: number; data: { message: string } } }).response = {
        status: 503,
        data: { message: 'Prediction engine is warming up. Please retry shortly.' }
      };
      throw error;
    }
  }
};

export const Parsed: Story = {
  args: {
    ...baseArgs,
    profile: {
      ...baseProfile,
      id: 203
    },
    fetchPrediction: async () => createPredictionResult(parsedPrediction)
  }
};

export const FullAnalysisOnly: Story = {
  args: {
    ...baseArgs,
    profile: {
      ...baseProfile,
      id: 204
    },
    fetchPrediction: async () => createPredictionResult(fullAnalysisOnlyPrediction)
  }
};
