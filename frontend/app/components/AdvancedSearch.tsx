'use client';

/**
 * Advanced Search Component
 * Global search across all app content
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, FileText, User, BookOpen, Star, Clock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAllItems, STORES } from '@/lib/storage';
import { getAllBookmarks } from '@/lib/bookmarks';
import { navigationHistory } from '@/lib/navigation-history';

interface SearchResult {
  id: string;
  type: 'profile' | 'report' | 'wisdom-card' | 'bookmark' | 'page';
  title: string;
  description?: string;
  url: string;
  relevance: number;
  icon: string;
}

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdvancedSearch({ isOpen, onClose }: AdvancedSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches
    try {
      const stored = localStorage.getItem('recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const lowerQuery = searchQuery.toLowerCase();
      const allResults: SearchResult[] = [];

      // Search profiles
      try {
        const profiles = await getAllItems(STORES.PROFILES);
        profiles.forEach((profile: any) => {
          const relevance = calculateRelevance(lowerQuery, [
            profile.name,
            profile.placeOfBirth,
            profile.notes,
          ]);
          if (relevance > 0) {
            allResults.push({
              id: `profile-${profile.id}`,
              type: 'profile',
              title: profile.name,
              description: `Born: ${profile.dateOfBirth} at ${profile.placeOfBirth}`,
              url: `/profile?id=${profile.id}`,
              relevance,
              icon: '👤',
            });
          }
        });
      } catch (error) {
        console.error('Error searching profiles:', error);
      }

      // Search reports
      try {
        const reports = await getAllItems(STORES.REPORTS);
        reports.forEach((report: any) => {
          const relevance = calculateRelevance(lowerQuery, [
            report.title,
            report.type,
            JSON.stringify(report.data),
          ]);
          if (relevance > 0) {
            allResults.push({
              id: `report-${report.id}`,
              type: 'report',
              title: report.title,
              description: `Generated: ${new Date(report.generatedAt).toLocaleDateString()}`,
              url: getReportUrl(report.type, report.profileId),
              relevance,
              icon: '📊',
            });
          }
        });
      } catch (error) {
        console.error('Error searching reports:', error);
      }

      // Search wisdom cards
      try {
        const wisdomCards = await getAllItems(STORES.WISDOM_CARDS);
        wisdomCards.forEach((card: any) => {
          const relevance = calculateRelevance(lowerQuery, [
            card.title,
            card.content,
            card.interpretation,
            card.category,
            ...(card.tags || []),
          ]);
          if (relevance > 0) {
            allResults.push({
              id: `wisdom-${card.id}`,
              type: 'wisdom-card',
              title: card.title,
              description: card.category,
              url: `/wisdom-cards?id=${card.id}`,
              relevance,
              icon: '🎴',
            });
          }
        });
      } catch (error) {
        console.error('Error searching wisdom cards:', error);
      }

      // Search bookmarks
      try {
        const bookmarks = await getAllBookmarks();
        bookmarks.forEach((bookmark) => {
          const relevance = calculateRelevance(lowerQuery, [
            bookmark.title,
            bookmark.description,
            ...(bookmark.tags || []),
          ]);
          if (relevance > 0) {
            allResults.push({
              id: `bookmark-${bookmark.id}`,
              type: 'bookmark',
              title: bookmark.title,
              description: bookmark.description || bookmark.type,
              url: bookmark.url,
              relevance,
              icon: '🔖',
            });
          }
        });
      } catch (error) {
        console.error('Error searching bookmarks:', error);
      }

      // Search navigation history
      const historyResults = navigationHistory.search(searchQuery);
      historyResults.forEach((entry, index) => {
        allResults.push({
          id: `history-${index}`,
          type: 'page',
          title: entry.title,
          description: `Visited: ${new Date(entry.timestamp).toLocaleDateString()}`,
          url: entry.path,
          relevance: 0.5, // Lower relevance for history
          icon: '🕐',
        });
      });

      // Sort by relevance
      allResults.sort((a, b) => b.relevance - a.relevance);

      setResults(allResults.slice(0, 20)); // Limit to top 20
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateRelevance = (query: string, fields: (string | undefined)[]): number => {
    let score = 0;
    const queryWords = query.split(' ').filter(Boolean);

    fields.forEach((field) => {
      if (!field) return;
      const lowerField = field.toLowerCase();

      queryWords.forEach((word) => {
        if (lowerField === word) score += 10; // Exact match
        else if (lowerField.startsWith(word)) score += 5; // Starts with
        else if (lowerField.includes(word)) score += 2; // Contains
      });
    });

    return score;
  };

  const getReportUrl = (type: string, profileId: number): string => {
    const urlMap: Record<string, string> = {
      'birth-chart': '/birth-chart',
      'karmic-journey': '/karmic-journey',
      'past-lives': '/past-lives',
      'future-lives': '/future-lives',
      'present-life': '/present-life',
      'life-events': '/life-events',
      'karmic-remedies': '/karmic-remedies',
      'daily-prediction': '/daily-insights',
      'bhrigu-predictions': '/bhrigu-predictions',
    };
    return `${urlMap[type] || '/dashboard'}?profileId=${profileId}`;
  };

  const saveRecentSearch = (searchQuery: string) => {
    try {
      const updated = [searchQuery, ...recentSearches.filter(q => q !== searchQuery)].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query);
    router.push(result.url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, performSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search everything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          {loading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.trim() === '' && recentSearches.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Searches
              </h3>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(search)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && query.trim() !== '' && !loading && (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No results found</p>
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-purple-50 dark:bg-purple-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-2xl">{result.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {result.title}
                </h3>
                {result.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {result.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {result.type}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          {results.length > 0 && (
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}
