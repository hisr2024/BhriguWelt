'use client';

/**
 * Bookmarks Panel Component
 * Displays and manages user bookmarks
 */

import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Trash2, Search, Star, Clock, TrendingUp } from 'lucide-react';
import {
  getAllBookmarks,
  deleteBookmark,
  searchBookmarks,
  getRecentBookmarks,
  getPopularBookmarks,
  trackBookmarkAccess,
  Bookmark as BookmarkType,
} from '@/lib/bookmarks';
import { useRouter } from 'next/navigation';

type ViewMode = 'all' | 'recent' | 'popular';
type FilterType = 'all' | 'report' | 'wisdom-card' | 'page' | 'prediction';

export default function BookmarksPanel() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');

  useEffect(() => {
    loadBookmarks();
  }, [viewMode, filterType]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchBookmarks(searchQuery).then(setFilteredBookmarks);
    } else {
      setFilteredBookmarks(bookmarks);
    }
  }, [searchQuery, bookmarks]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      let data: BookmarkType[] = [];

      if (viewMode === 'recent') {
        data = await getRecentBookmarks(20);
      } else if (viewMode === 'popular') {
        data = await getPopularBookmarks(20);
      } else {
        data = await getAllBookmarks();
      }

      if (filterType !== 'all') {
        data = data.filter(b => b.type === filterType);
      }

      setBookmarks(data);
      setFilteredBookmarks(data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return;

    try {
      await deleteBookmark(id);
      await loadBookmarks();
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  const handleBookmarkClick = async (bookmark: BookmarkType) => {
    try {
      if (bookmark.id) {
        await trackBookmarkAccess(bookmark.id);
      }
      router.push(bookmark.url);
    } catch (error) {
      console.error('Failed to track bookmark access:', error);
      router.push(bookmark.url);
    }
  };

  const getTypeIcon = (type: BookmarkType['type']) => {
    switch (type) {
      case 'report':
        return '📊';
      case 'wisdom-card':
        return '🎴';
      case 'page':
        return '📄';
      case 'prediction':
        return '🔮';
      default:
        return '📌';
    }
  };

  const getTypeColor = (type: BookmarkType['type']) => {
    switch (type) {
      case 'report':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'wisdom-card':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'page':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'prediction':
        return 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900 rounded-lg">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📚 Your Bookmarks
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Quick access to your saved reports, wisdom cards, and pages
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
        />
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('all')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            viewMode === 'all'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          All
        </button>
        <button
          onClick={() => setViewMode('recent')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            viewMode === 'recent'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Recent
        </button>
        <button
          onClick={() => setViewMode('popular')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            viewMode === 'popular'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Popular
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'report', 'wisdom-card', 'page', 'prediction'] as FilterType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterType === type
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {type === 'all' ? 'All Types' : type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Bookmarks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading bookmarks...</p>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <BookmarkCheck className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Try a different search term' : 'Bookmark your favorite reports and pages for quick access'}
            </p>
          </div>
        ) : (
          filteredBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getTypeIcon(bookmark.type)}</div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleBookmarkClick(bookmark)}
                    className="text-left w-full group"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                      {bookmark.title}
                    </h3>
                    {bookmark.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {bookmark.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(bookmark.type)}`}>
                        {bookmark.type}
                      </span>
                      {bookmark.tags && bookmark.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {bookmark.accessCount ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {bookmark.accessCount} visits
                        </span>
                      ) : null}
                    </div>
                  </button>
                </div>
                <button
                  onClick={() => bookmark.id && handleDelete(bookmark.id)}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  aria-label="Delete bookmark"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {!loading && filteredBookmarks.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            📊 Showing {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
}
