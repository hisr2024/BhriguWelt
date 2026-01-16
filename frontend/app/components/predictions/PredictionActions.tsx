'use client';

import { useState, useEffect } from 'react';
import { Printer, Share2, Download, Bookmark, Check } from 'lucide-react';
import type { ParsedPrediction, ShareMethod, ExportFormat } from '@/lib/types/predictions';
import { addBookmark, deleteBookmark, getBookmarkByUrl, type Bookmark as BookmarkType } from '@/lib/bookmarks';

interface PredictionActionsProps {
  prediction: ParsedPrediction;
  onShare?: (method: ShareMethod) => void;
  onExport?: (format: ExportFormat) => void;
}

export default function PredictionActions({
  prediction,
  onShare,
  onExport
}: PredictionActionsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<number | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Check if prediction is already bookmarked on mount
  useEffect(() => {
    const checkBookmark = async () => {
      try {
        const currentUrl = window.location.href;
        const existingBookmark = await getBookmarkByUrl(currentUrl);

        if (existingBookmark && existingBookmark.id) {
          setIsBookmarked(true);
          setBookmarkId(existingBookmark.id);
        } else {
          setIsBookmarked(false);
          setBookmarkId(null);
        }
      } catch (error) {
        console.error('Failed to check bookmark status:', error);
      }
    };

    checkBookmark();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async (method: ShareMethod) => {
    if (method === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: prediction.category,
          text: prediction.summary,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else if (method === 'copy') {
      const content = `${prediction.category}\n\n${prediction.summary}\n\n${window.location.href}`;
      await navigator.clipboard.writeText(content);
      alert('Link copied to clipboard!');
    }

    if (onShare) {
      onShare(method);
    }
    setShowShareMenu(false);
  };

  const handleExport = (format: ExportFormat) => {
    if (onExport) {
      onExport(format);
    }
    setShowExportMenu(false);
  };

  const handleBookmark = async () => {
    if (bookmarkLoading) return;

    setBookmarkLoading(true);

    try {
      const currentUrl = window.location.href;

      if (isBookmarked && bookmarkId !== null) {
        // Remove bookmark
        await deleteBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
      } else {
        // Add bookmark
        const newBookmark: Omit<BookmarkType, 'id' | 'createdAt'> = {
          type: 'prediction',
          title: prediction.category || 'Prediction',
          description: prediction.summary,
          url: currentUrl,
          metadata: {
            category: prediction.category,
            generatedAt: prediction.generatedAt,
            confidence: prediction.confidence,
          },
          tags: prediction.category ? [prediction.category.toLowerCase()] : [],
        };

        const id = await addBookmark(newBookmark);
        setIsBookmarked(true);
        setBookmarkId(id);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      // Show user-friendly error message
      alert(isBookmarked ? 'Failed to remove bookmark' : 'Failed to add bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden" role="toolbar" aria-label="Prediction actions">
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="flex items-center space-x-2 px-4 py-2 min-h-[44px] bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-purple-600"
        aria-label="Print prediction"
        title="Print prediction"
      >
        <Printer className="w-4 h-4 text-gray-700" aria-hidden="true" />
        <span className="hidden sm:inline text-sm font-medium text-gray-700">Print</span>
      </button>

      {/* Share Button */}
      <div className="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="flex items-center space-x-2 px-4 py-2 min-h-[44px] bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-purple-600"
          aria-label="Share prediction"
          aria-expanded={showShareMenu}
          aria-haspopup="menu"
          title="Share prediction"
        >
          <Share2 className="w-4 h-4 text-gray-700" aria-hidden="true" />
          <span className="hidden sm:inline text-sm font-medium text-gray-700">Share</span>
        </button>

        {showShareMenu && (
          <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] z-10" role="menu" aria-label="Share options">
            <button
              onClick={() => handleShare('native')}
              className="w-full px-4 py-2 min-h-[44px] text-left text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100"
              role="menuitem"
            >
              Share...
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="w-full px-4 py-2 min-h-[44px] text-left text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100"
              role="menuitem"
            >
              Copy Link
            </button>
            <button
              onClick={() => handleShare('whatsapp')}
              className="w-full px-4 py-2 min-h-[44px] text-left text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100"
              role="menuitem"
            >
              WhatsApp
            </button>
            <button
              onClick={() => handleShare('email')}
              className="w-full px-4 py-2 min-h-[44px] text-left text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100"
              role="menuitem"
            >
              Email
            </button>
          </div>
        )}
      </div>

      {/* Download Button */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center space-x-2 px-4 py-2 min-h-[44px] bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          aria-label="Download prediction"
          aria-expanded={showExportMenu}
          aria-haspopup="menu"
          title="Download prediction"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline text-sm font-medium">Download</span>
        </button>

        {showExportMenu && (
          <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] z-10" role="menu" aria-label="Download formats">
            <button
              onClick={() => handleExport('image')}
              className="w-full px-4 py-2 min-h-[44px] text-left text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100"
              role="menuitem"
            >
              Image (.png)
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full px-4 py-2 min-h-[44px] text-left text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100"
              role="menuitem"
            >
              PDF (.pdf)
            </button>
            <button
              onClick={() => handleExport('txt')}
              className="w-full px-4 py-2 min-h-[44px] text-left text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100"
              role="menuitem"
            >
              Text (.txt)
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="w-full px-4 py-2 min-h-[44px] text-left text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100"
              role="menuitem"
            >
              Markdown (.md)
            </button>
          </div>
        )}
      </div>

      {/* Bookmark Button */}
      <button
        onClick={handleBookmark}
        disabled={bookmarkLoading}
        className={`flex items-center space-x-2 px-4 py-2 min-h-[44px] rounded-lg transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-purple-600 ${
          isBookmarked
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
        } ${bookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark prediction'}
        aria-pressed={isBookmarked}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark prediction'}
      >
        {isBookmarked ? (
          <Check className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Bookmark className="w-4 h-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline text-sm font-medium">
          {bookmarkLoading ? 'Loading...' : isBookmarked ? 'Saved' : 'Save'}
        </span>
      </button>
    </div>
  );
}
