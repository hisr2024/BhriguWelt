import React from 'react';
import {
  Heart,
  Star,
  BookOpen,
  Briefcase,
  Stethoscope,
  Coins,
  Sparkles,
  Clock,
  Shield,
  Users,
  Home,
  GraduationCap,
  Globe,
  Baby,
  TrendingUp,
  AlertCircle,
  Compass,
  Zap,
  Moon,
  Sun,
  Target,
  Award,
  Gem,
  HandHeart,
  Wind,
  Mountain,
  Waves,
  FlameKindling,
  TreePine,
  LucideIcon,
} from 'lucide-react';

/**
 * Type definition for icon sizes
 */
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Predefined icon size classes for Tailwind CSS
 */
export const ICON_SIZES: Record<IconSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

/**
 * Props for the SectionIcon component
 */
export interface SectionIconProps {
  /** The section key to match against the icon mapping */
  sectionKey: string;
  /** Optional CSS classes for the icon */
  className?: string;
  /** Whether to show background container */
  showBackground?: boolean;
  /** Background color class for the container */
  backgroundColor?: string;
}

/**
 * Comprehensive mapping of section keys to their corresponding Lucide icons
 * Organized by category for maintainability
 */
const SECTION_ICONS: Record<string, LucideIcon> = {
  // Soul Blueprint
  soul_purpose: Star,
  karmic_blueprint: Compass,
  evolution_stage: TrendingUp,
  life_mission: Target,
  karmic_lessons: BookOpen,
  soul_connections: Users,
  timing: Clock,
  spiritual_gifts: Sparkles,

  // Past Lives
  recent_life: Moon,
  significant_lives: Star,
  karmic_patterns: Waves,
  past_skills: Award,
  traumas_healing: HandHeart,
  past_relationships: Heart,
  karmic_debts: Coins,
  spiritual_progress: Mountain,

  // Future Births
  next_incarnation: Sun,
  evolution_trajectory: TrendingUp,
  final_birth_conditions: Target,
  future_scenarios: Compass,
  moksha_timeline: Clock,
  higher_realms: Sparkles,
  bodhisattva_path: Mountain,
  ultimate_destiny: Star,

  // Current Life
  current_phase: Clock,
  career: Briefcase,
  relationships: Heart,
  romantic_marriage: Heart,
  health: Stethoscope,
  finances: Coins,
  spiritual_growth: Sparkles,
  education: GraduationCap,
  life_purpose: Target,
  challenges: AlertCircle,

  // Predictions & Timing
  yearly_forecast: Sun,
  marriage_timing: Heart,
  career_milestones: Briefcase,
  children_family: Baby,
  financial_events: Coins,
  health_alerts: Stethoscope,
  spiritual_milestones: Sparkles,
  relocations: Globe,
  favorable_periods: TrendingUp,
  challenging_periods: AlertCircle,
  transits: Waves,
  age_milestones: Clock,

  // Remedies & Solutions
  mantras: Wind,
  gemstones: Gem,
  yantras: Star,
  charitable_activities: HandHeart,
  fasting: Moon,
  deity_worship: Sparkles,
  pilgrimage: Mountain,
  lifestyle: Home,
  planetary_rituals: Sun,
  karmic_cleansing: Waves,
  service: Users,
  meditation: Sparkles,

  // Relationship & Social
  family: Home,
  friendships: Users,
  professional: Briefcase,
  communication: BookOpen,

  // Health & Wellness
  healing: Stethoscope,
  healthy_practices: Shield,

  // Time Periods
  daily: Sun,
  weekly: Moon,
  monthly: Waves,
  yearly: Star,

  // Additional Categories
  fire: FlameKindling,
  earth: Mountain,
  water: Waves,
  air: Wind,
  nature: TreePine,
  energy: Zap,
};

/**
 * Cache for memoized icon lookups to improve performance
 */
const iconCache = new Map<string, LucideIcon>();

/**
 * Retrieves the appropriate icon component for a given section key
 * Uses partial matching to support flexible key formats
 *
 * @param sectionKey - The section identifier (e.g., "soul_purpose", "career")
 * @param className - Optional CSS classes to apply to the icon
 * @returns React element with the matched icon or Star as fallback
 *
 * @example
 * ```tsx
 * // Direct match
 * getSectionIcon('career', 'w-6 h-6 text-blue-500')
 *
 * // Partial match (will match 'spiritual_gifts')
 * getSectionIcon('spiritual', 'w-5 h-5')
 *
 * // Fallback to Star
 * getSectionIcon('unknown_section', 'w-4 h-4')
 * ```
 */
export const getSectionIcon = (
  sectionKey: string,
  className?: string
): React.ReactNode => {
  // Check cache first for performance
  const cacheKey = `${sectionKey}-${className}`;

  let IconComponent: LucideIcon;

  // Try exact match first
  if (SECTION_ICONS[sectionKey]) {
    IconComponent = SECTION_ICONS[sectionKey];
  } else if (iconCache.has(sectionKey)) {
    // Use cached partial match
    IconComponent = iconCache.get(sectionKey)!;
  } else {
    // Try partial match by iterating through keys
    const matchedKey = Object.keys(SECTION_ICONS).find((key) =>
      sectionKey.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(sectionKey.toLowerCase())
    );

    if (matchedKey) {
      IconComponent = SECTION_ICONS[matchedKey];
      // Cache the result for future lookups
      iconCache.set(sectionKey, IconComponent);
    } else {
      // Fallback to Star icon
      IconComponent = Star;
      iconCache.set(sectionKey, IconComponent);
    }
  }

  return <IconComponent className={className} />;
};

/**
 * A reusable component for rendering section icons with optional background
 * Provides a consistent visual style across the application
 *
 * @component
 * @example
 * ```tsx
 * // With background (default)
 * <SectionIcon sectionKey="career" />
 *
 * // Custom styling
 * <SectionIcon
 *   sectionKey="spiritual_growth"
 *   className="w-6 h-6 text-purple-500"
 *   backgroundColor="bg-purple-500/10"
 * />
 *
 * // Without background
 * <SectionIcon
 *   sectionKey="health"
 *   showBackground={false}
 *   className="w-8 h-8"
 * />
 * ```
 */
export const SectionIcon: React.FC<SectionIconProps> = ({
  sectionKey,
  className = 'w-5 h-5',
  showBackground = true,
  backgroundColor = 'bg-white/5',
}) => {
  const icon = getSectionIcon(sectionKey, className);

  if (showBackground) {
    return (
      <span className={`p-2 rounded-lg ${backgroundColor}`}>
        {icon}
      </span>
    );
  }

  return <>{icon}</>;
};

/**
 * Utility function to get icon size class from size prop
 *
 * @param size - Size identifier (sm, md, lg, xl)
 * @returns Tailwind CSS class string for the size
 *
 * @example
 * ```tsx
 * getIconSizeClass('lg') // Returns 'w-6 h-6'
 * ```
 */
export const getIconSizeClass = (size: IconSize): string => {
  return ICON_SIZES[size];
};

/**
 * Utility function to check if a section key has a mapped icon
 *
 * @param sectionKey - The section identifier to check
 * @returns boolean indicating if an icon mapping exists
 *
 * @example
 * ```tsx
 * hasIcon('career') // true
 * hasIcon('nonexistent') // false
 * ```
 */
export const hasIcon = (sectionKey: string): boolean => {
  return (
    SECTION_ICONS.hasOwnProperty(sectionKey) ||
    Object.keys(SECTION_ICONS).some((key) =>
      sectionKey.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(sectionKey.toLowerCase())
    )
  );
};

/**
 * Get all available section keys that have icon mappings
 *
 * @returns Array of section key strings
 *
 * @example
 * ```tsx
 * const keys = getAllSectionKeys();
 * console.log(keys); // ['soul_purpose', 'karmic_blueprint', ...]
 * ```
 */
export const getAllSectionKeys = (): string[] => {
  return Object.keys(SECTION_ICONS);
};

/**
 * Export the icon mapping for advanced use cases
 * Use with caution as direct access bypasses caching
 */
export { SECTION_ICONS };
