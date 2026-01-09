import { tLocale } from '@/lib/locales';

type CategorySection = { key: string; titleKey: string; color: string };

type SectionTitle = { key: string; title: string };

export const CATEGORY_SECTIONS: Record<string, CategorySection[]> = {
  'karmic-journey': [
    { key: 'soul_purpose', titleKey: 'bhriguPrediction.sections.karmic-journey.soul_purpose', color: 'cyan' },
    { key: 'karmic_blueprint', titleKey: 'bhriguPrediction.sections.karmic-journey.karmic_blueprint', color: 'purple' },
    { key: 'evolution_stage', titleKey: 'bhriguPrediction.sections.karmic-journey.evolution_stage', color: 'blue' },
    { key: 'life_mission', titleKey: 'bhriguPrediction.sections.karmic-journey.life_mission', color: 'indigo' },
    { key: 'karmic_lessons', titleKey: 'bhriguPrediction.sections.karmic-journey.karmic_lessons', color: 'violet' },
    { key: 'soul_connections', titleKey: 'bhriguPrediction.sections.karmic-journey.soul_connections', color: 'pink' },
    { key: 'timing', titleKey: 'bhriguPrediction.sections.karmic-journey.timing', color: 'rose' },
    { key: 'spiritual_gifts', titleKey: 'bhriguPrediction.sections.karmic-journey.spiritual_gifts', color: 'amber' }
  ],
  'past-lives': [
    { key: 'recent_life', titleKey: 'bhriguPrediction.sections.past-lives.recent_life', color: 'cyan' },
    { key: 'significant_lives', titleKey: 'bhriguPrediction.sections.past-lives.significant_lives', color: 'purple' },
    { key: 'karmic_patterns', titleKey: 'bhriguPrediction.sections.past-lives.karmic_patterns', color: 'blue' },
    { key: 'past_skills', titleKey: 'bhriguPrediction.sections.past-lives.past_skills', color: 'indigo' },
    { key: 'traumas_healing', titleKey: 'bhriguPrediction.sections.past-lives.traumas_healing', color: 'violet' },
    { key: 'past_relationships', titleKey: 'bhriguPrediction.sections.past-lives.past_relationships', color: 'pink' },
    { key: 'karmic_debts', titleKey: 'bhriguPrediction.sections.past-lives.karmic_debts', color: 'rose' },
    { key: 'spiritual_progress', titleKey: 'bhriguPrediction.sections.past-lives.spiritual_progress', color: 'amber' }
  ],
  'future-lives': [
    { key: 'next_incarnation', titleKey: 'bhriguPrediction.sections.future-lives.next_incarnation', color: 'cyan' },
    { key: 'evolution_trajectory', titleKey: 'bhriguPrediction.sections.future-lives.evolution_trajectory', color: 'purple' },
    { key: 'final_birth_conditions', titleKey: 'bhriguPrediction.sections.future-lives.final_birth_conditions', color: 'blue' },
    { key: 'future_scenarios', titleKey: 'bhriguPrediction.sections.future-lives.future_scenarios', color: 'indigo' },
    { key: 'moksha_timeline', titleKey: 'bhriguPrediction.sections.future-lives.moksha_timeline', color: 'violet' },
    { key: 'higher_realms', titleKey: 'bhriguPrediction.sections.future-lives.higher_realms', color: 'pink' },
    { key: 'bodhisattva_path', titleKey: 'bhriguPrediction.sections.future-lives.bodhisattva_path', color: 'rose' },
    { key: 'ultimate_destiny', titleKey: 'bhriguPrediction.sections.future-lives.ultimate_destiny', color: 'amber' }
  ],
  'present-life': [
    { key: 'current_phase', titleKey: 'bhriguPrediction.sections.present-life.current_phase', color: 'cyan' },
    { key: 'career', titleKey: 'bhriguPrediction.sections.present-life.career', color: 'purple' },
    { key: 'relationships', titleKey: 'bhriguPrediction.sections.present-life.relationships', color: 'blue' },
    { key: 'health', titleKey: 'bhriguPrediction.sections.present-life.health', color: 'indigo' },
    { key: 'finances', titleKey: 'bhriguPrediction.sections.present-life.finances', color: 'violet' },
    { key: 'spiritual_growth', titleKey: 'bhriguPrediction.sections.present-life.spiritual_growth', color: 'pink' },
    { key: 'education', titleKey: 'bhriguPrediction.sections.present-life.education', color: 'rose' },
    { key: 'life_purpose', titleKey: 'bhriguPrediction.sections.present-life.life_purpose', color: 'amber' },
    { key: 'challenges', titleKey: 'bhriguPrediction.sections.present-life.challenges', color: 'orange' },
    { key: 'timing', titleKey: 'bhriguPrediction.sections.present-life.timing', color: 'teal' }
  ],
  'life-events': [
    { key: 'yearly_forecast', titleKey: 'bhriguPrediction.sections.life-events.yearly_forecast', color: 'cyan' },
    { key: 'marriage_timing', titleKey: 'bhriguPrediction.sections.life-events.marriage_timing', color: 'purple' },
    { key: 'career_milestones', titleKey: 'bhriguPrediction.sections.life-events.career_milestones', color: 'blue' },
    { key: 'children_family', titleKey: 'bhriguPrediction.sections.life-events.children_family', color: 'indigo' },
    { key: 'financial_events', titleKey: 'bhriguPrediction.sections.life-events.financial_events', color: 'violet' },
    { key: 'health_alerts', titleKey: 'bhriguPrediction.sections.life-events.health_alerts', color: 'pink' },
    { key: 'spiritual_milestones', titleKey: 'bhriguPrediction.sections.life-events.spiritual_milestones', color: 'rose' },
    { key: 'relocations', titleKey: 'bhriguPrediction.sections.life-events.relocations', color: 'amber' },
    { key: 'education', titleKey: 'bhriguPrediction.sections.life-events.education', color: 'orange' },
    { key: 'favorable_periods', titleKey: 'bhriguPrediction.sections.life-events.favorable_periods', color: 'teal' },
    { key: 'challenging_periods', titleKey: 'bhriguPrediction.sections.life-events.challenging_periods', color: 'red' },
    { key: 'transits', titleKey: 'bhriguPrediction.sections.life-events.transits', color: 'lime' },
    { key: 'age_milestones', titleKey: 'bhriguPrediction.sections.life-events.age_milestones', color: 'emerald' }
  ],
  'karmic-remedies': [
    { key: 'mantras', titleKey: 'bhriguPrediction.sections.karmic-remedies.mantras', color: 'cyan' },
    { key: 'gemstones', titleKey: 'bhriguPrediction.sections.karmic-remedies.gemstones', color: 'purple' },
    { key: 'yantras', titleKey: 'bhriguPrediction.sections.karmic-remedies.yantras', color: 'blue' },
    { key: 'charitable_activities', titleKey: 'bhriguPrediction.sections.karmic-remedies.charitable_activities', color: 'indigo' },
    { key: 'fasting', titleKey: 'bhriguPrediction.sections.karmic-remedies.fasting', color: 'violet' },
    { key: 'deity_worship', titleKey: 'bhriguPrediction.sections.karmic-remedies.deity_worship', color: 'pink' },
    { key: 'pilgrimage', titleKey: 'bhriguPrediction.sections.karmic-remedies.pilgrimage', color: 'rose' },
    { key: 'lifestyle', titleKey: 'bhriguPrediction.sections.karmic-remedies.lifestyle', color: 'amber' },
    { key: 'planetary_rituals', titleKey: 'bhriguPrediction.sections.karmic-remedies.planetary_rituals', color: 'orange' },
    { key: 'karmic_cleansing', titleKey: 'bhriguPrediction.sections.karmic-remedies.karmic_cleansing', color: 'teal' },
    { key: 'service', titleKey: 'bhriguPrediction.sections.karmic-remedies.service', color: 'lime' },
    { key: 'meditation', titleKey: 'bhriguPrediction.sections.karmic-remedies.meditation', color: 'emerald' }
  ],
  relationships: [
    { key: 'romantic_marriage', titleKey: 'bhriguPrediction.sections.relationships.romantic_marriage', color: 'cyan' },
    { key: 'family', titleKey: 'bhriguPrediction.sections.relationships.family', color: 'purple' },
    { key: 'soul_connections', titleKey: 'bhriguPrediction.sections.relationships.soul_connections', color: 'blue' },
    { key: 'friendships', titleKey: 'bhriguPrediction.sections.relationships.friendships', color: 'indigo' },
    { key: 'professional', titleKey: 'bhriguPrediction.sections.relationships.professional', color: 'violet' },
    { key: 'karmic_patterns', titleKey: 'bhriguPrediction.sections.relationships.karmic_patterns', color: 'pink' },
    { key: 'communication', titleKey: 'bhriguPrediction.sections.relationships.communication', color: 'rose' },
    { key: 'timing', titleKey: 'bhriguPrediction.sections.relationships.timing', color: 'amber' },
    { key: 'healing', titleKey: 'bhriguPrediction.sections.relationships.healing', color: 'orange' },
    { key: 'healthy_practices', titleKey: 'bhriguPrediction.sections.relationships.healthy_practices', color: 'teal' }
  ],
  predictions: [
    { key: 'daily', titleKey: 'bhriguPrediction.sections.predictions.daily', color: 'cyan' },
    { key: 'weekly', titleKey: 'bhriguPrediction.sections.predictions.weekly', color: 'purple' },
    { key: 'monthly', titleKey: 'bhriguPrediction.sections.predictions.monthly', color: 'blue' },
    { key: 'yearly', titleKey: 'bhriguPrediction.sections.predictions.yearly', color: 'indigo' }
  ]
};

export const getCategorySections = (category: string): CategorySection[] => {
  return CATEGORY_SECTIONS[category] ?? [];
};

export const getEnglishSectionTitles = (category: string): SectionTitle[] => {
  return getCategorySections(category).map((section) => ({
    key: section.key,
    title: tLocale(section.titleKey, 'en')
  }));
};
