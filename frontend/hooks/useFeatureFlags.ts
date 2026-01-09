export type FeatureFlags = {
  debugUI: boolean;
  advancedControls: boolean;
};

const parseFlag = (value?: string): boolean => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export default function useFeatureFlags(): FeatureFlags {
  return {
    debugUI: parseFlag(process.env.NEXT_PUBLIC_FEATURE_DEBUG_UI),
    advancedControls: parseFlag(process.env.NEXT_PUBLIC_FEATURE_ADVANCED_CONTROLS)
  };
}
