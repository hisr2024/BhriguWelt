'use client';

import { create } from 'zustand';

type SectionExpansionState = {
  expandedSections: Record<string, boolean>;
  setExpandedSection: (sectionId: string, isOpen: boolean) => void;
};

export const useSectionExpansionStore = create<SectionExpansionState>((set) => ({
  expandedSections: {},
  setExpandedSection: (sectionId, isOpen) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [sectionId]: isOpen
      }
    }))
}));
