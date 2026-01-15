'use client';

import { useState } from 'react';
import { Printer, Share2, Download, Bookmark, Check } from 'lucide-react';
import type { ParsedPrediction, ShareMethod, ExportFormat } from '@/lib/types/predictions';

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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement actual bookmark functionality
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
        title="Print prediction"
      >
        <Printer className="w-4 h-4 text-gray-700" />
        <span className="hidden sm:inline text-sm font-medium text-gray-700">Print</span>
      </button>

      {/* Share Button */}
      <div className="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
          title="Share prediction"
        >
          <Share2 className="w-4 h-4 text-gray-700" />
          <span className="hidden sm:inline text-sm font-medium text-gray-700">Share</span>
        </button>

        {showShareMenu && (
          <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] z-10">
            <button
              onClick={() => handleShare('native')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
            >
              Share...
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
            >
              Copy Link
            </button>
            <button
              onClick={() => handleShare('whatsapp')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
            >
              WhatsApp
            </button>
            <button
              onClick={() => handleShare('email')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
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
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          title="Download prediction"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">Download</span>
        </button>

        {showExportMenu && (
          <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[140px] z-10">
            <button
              onClick={() => handleExport('txt')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
            >
              Text (.txt)
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
            >
              PDF (.pdf)
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
            >
              Markdown (.md)
            </button>
          </div>
        )}
      </div>

      {/* Bookmark Button */}
      <button
        onClick={handleBookmark}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow ${
          isBookmarked
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
        }`}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark prediction'}
      >
        {isBookmarked ? (
          <Check className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        <span className="hidden sm:inline text-sm font-medium">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      </button>
    </div>
  );
}
