/**
 * Wisdom Cards management for offline access
 * Provides traditional Vedic wisdom based on chart features
 */

import { WisdomCard } from './types';
import { initDB, setItem, getAllItems, STORES } from './storage';

/**
 * Load wisdom cards from local JSON file
 */
export async function loadWisdomCards(): Promise<WisdomCard[]> {
  try {
    const response = await fetch('/data/wisdom_cards.json');
    if (!response.ok) {
      throw new Error('Failed to load wisdom cards');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading wisdom cards:', error);
    return [];
  }
}

/**
 * Seed wisdom cards into IndexedDB
 * Should be called on first app launch or when updating card database
 */
export async function seedWisdomCards(encryptionKey?: CryptoKey): Promise<number> {
  try {
    // Load cards from JSON
    const cards = await loadWisdomCards();
    
    if (cards.length === 0) {
      console.warn('[WisdomCards] No cards to seed');
      return 0;
    }
    
    // Initialize database
    await initDB();
    
    // Store each card
    for (const card of cards) {
      await setItem(STORES.WISDOM_CARDS, card.id, card, encryptionKey);
    }
    
    console.log(`[WisdomCards] Seeded ${cards.length} wisdom cards`);
    return cards.length;
  } catch (error) {
    console.error('[WisdomCards] Error seeding cards:', error);
    return 0;
  }
}

/**
 * Get all wisdom cards from storage
 */
export async function getWisdomCards(encryptionKey?: CryptoKey): Promise<WisdomCard[]> {
  try {
    await initDB();
    return await getAllItems(STORES.WISDOM_CARDS, encryptionKey);
  } catch (error) {
    console.error('[WisdomCards] Error getting cards:', error);
    return [];
  }
}

/**
 * Match wisdom cards based on birth chart features
 */
export async function matchWisdomCards(
  chartFeatures: {
    zodiac_sign?: string;
    nakshatra?: string;
    moon_sign?: string;
    ascendant?: string;
    elements?: string[];
    planets?: string[];
    houses?: number[];
  },
  encryptionKey?: CryptoKey,
  limit: number = 10
): Promise<WisdomCard[]> {
  try {
    const allCards = await getWisdomCards(encryptionKey);
    
    // Score each card based on matching conditions
    const scored = allCards.map((card) => {
      let score = 0;
      const conditions = card.conditions || {};
      
      // Exact matches
      if (conditions.zodiac_signs && chartFeatures.zodiac_sign) {
        if (conditions.zodiac_signs.includes(chartFeatures.zodiac_sign)) {
          score += 50;
        }
      }
      
      if (conditions.nakshatra && chartFeatures.nakshatra) {
        if (chartFeatures.nakshatra === conditions.nakshatra) {
          score += 100; // Nakshatra is highly specific
        }
      }
      
      // Element matches
      if (conditions.elements && chartFeatures.elements) {
        const matchingElements = conditions.elements.filter((e) =>
          chartFeatures.elements?.includes(e)
        );
        score += matchingElements.length * 30;
      }
      
      // Planet matches
      if (conditions.planets && chartFeatures.planets) {
        const matchingPlanets = conditions.planets.filter((p) =>
          chartFeatures.planets?.includes(p)
        );
        score += matchingPlanets.length * 40;
      }
      
      // House matches
      if (conditions.houses && chartFeatures.houses) {
        const matchingHouses = conditions.houses.filter((h) =>
          chartFeatures.houses?.includes(h)
        );
        score += matchingHouses.length * 35;
      }
      
      // Add priority bonus
      score += (card.priority || 0);
      
      return { card, score };
    });
    
    // Filter cards with score > 0 and sort by score
    return scored
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ card }) => card);
  } catch (error) {
    console.error('[WisdomCards] Error matching cards:', error);
    return [];
  }
}

/**
 * Get cards by category
 */
export async function getCardsByCategory(
  category: string,
  encryptionKey?: CryptoKey
): Promise<WisdomCard[]> {
  try {
    const allCards = await getWisdomCards(encryptionKey);
    return allCards.filter((card) => card.category === category);
  } catch (error) {
    console.error('[WisdomCards] Error getting cards by category:', error);
    return [];
  }
}

/**
 * Get cards by tags
 */
export async function getCardsByTags(
  tags: string[],
  encryptionKey?: CryptoKey
): Promise<WisdomCard[]> {
  try {
    const allCards = await getWisdomCards(encryptionKey);
    return allCards.filter((card) =>
      card.tags.some((tag) => tags.includes(tag))
    );
  } catch (error) {
    console.error('[WisdomCards] Error getting cards by tags:', error);
    return [];
  }
}

/**
 * Get random daily wisdom card
 */
export async function getDailyWisdomCard(encryptionKey?: CryptoKey): Promise<WisdomCard | null> {
  try {
    const allCards = await getWisdomCards(encryptionKey);
    
    if (allCards.length === 0) {
      return null;
    }
    
    // Use date as seed for consistency within a day
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = ((hash << 5) - hash) + today.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    const index = Math.abs(hash) % allCards.length;
    return allCards[index];
  } catch (error) {
    console.error('[WisdomCards] Error getting daily card:', error);
    return null;
  }
}

/**
 * Search wisdom cards by text
 */
export async function searchWisdomCards(
  query: string,
  encryptionKey?: CryptoKey,
  limit: number = 10
): Promise<WisdomCard[]> {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const allCards = await getWisdomCards(encryptionKey);
    const normalizedQuery = query.toLowerCase().trim();
    
    // Score-based search
    const scored = allCards.map((card) => {
      let score = 0;
      
      // Title match
      if (card.title.toLowerCase().includes(normalizedQuery)) {
        score += 50;
      }
      
      // Content match
      if (card.content.toLowerCase().includes(normalizedQuery)) {
        score += 30;
      }
      
      // Tags match
      const matchingTags = card.tags.filter((tag) =>
        tag.toLowerCase().includes(normalizedQuery)
      );
      score += matchingTags.length * 20;
      
      // Category match
      if (card.category.toLowerCase().includes(normalizedQuery)) {
        score += 15;
      }
      
      // Tradition match
      if (card.tradition.toLowerCase().includes(normalizedQuery)) {
        score += 10;
      }
      
      return { card, score };
    });
    
    // Filter and sort
    return scored
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ card }) => card);
  } catch (error) {
    console.error('[WisdomCards] Error searching cards:', error);
    return [];
  }
}

/**
 * Get unique categories
 */
export async function getCategories(encryptionKey?: CryptoKey): Promise<string[]> {
  try {
    const allCards = await getWisdomCards(encryptionKey);
    const categories = new Set(allCards.map((card) => card.category));
    return Array.from(categories).sort();
  } catch (error) {
    console.error('[WisdomCards] Error getting categories:', error);
    return [];
  }
}

/**
 * Get unique traditions
 */
export async function getTraditions(encryptionKey?: CryptoKey): Promise<string[]> {
  try {
    const allCards = await getWisdomCards(encryptionKey);
    const traditions = new Set(allCards.map((card) => card.tradition));
    return Array.from(traditions).sort();
  } catch (error) {
    console.error('[WisdomCards] Error getting traditions:', error);
    return [];
  }
}

/**
 * Check if wisdom cards need seeding
 */
export async function needsSeeding(encryptionKey?: CryptoKey): Promise<boolean> {
  try {
    const cards = await getWisdomCards(encryptionKey);
    return cards.length === 0;
  } catch (error) {
    console.error('[WisdomCards] Error checking seed status:', error);
    return true;
  }
}

/**
 * React hook for wisdom cards
 */
import { useState, useEffect } from 'react';

export function useWisdomCards(encryptionKey: CryptoKey | null) {
  const [cards, setCards] = useState<WisdomCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSeed, setNeedsSeed] = useState(false);

  useEffect(() => {
    if (!encryptionKey) {
      setCards([]);
      setIsLoading(false);
      return;
    }

    loadCards();
  }, [encryptionKey]);

  const loadCards = async () => {
    try {
      setIsLoading(true);
      
      // Check if needs seeding
      const needs = await needsSeeding(encryptionKey!);
      setNeedsSeed(needs);
      
      if (needs) {
        // Auto-seed on first load
        await seedWisdomCards(encryptionKey!);
      }
      
      // Load cards
      const loaded = await getWisdomCards(encryptionKey!);
      setCards(loaded);
    } catch (error) {
      console.error('Error loading wisdom cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const seed = async () => {
    try {
      setIsLoading(true);
      await seedWisdomCards(encryptionKey!);
      await loadCards();
    } catch (error) {
      console.error('Error seeding wisdom cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cards,
    isLoading,
    needsSeed,
    seed,
    reload: loadCards,
  };
}
