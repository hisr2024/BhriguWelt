'use client';

/**
 * Feedback Widget Component
 * Collects user feedback and ratings
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Star, ThumbsUp, ThumbsDown, Smile, Meh, Frown } from 'lucide-react';

interface Feedback {
  id?: number;
  type: 'rating' | 'comment' | 'bug' | 'feature-request' | 'general';
  rating?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  category?: string;
  message: string;
  page: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const FEEDBACK_STORE = 'feedback';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<Feedback['type']>('general');
  const [rating, setRating] = useState<number>(0);
  const [sentiment, setSentiment] = useState<Feedback['sentiment']>();
  const [message, setMessage] = useState('');
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const feedback: Feedback = {
        type: feedbackType,
        rating: feedbackType === 'rating' ? rating : undefined,
        sentiment,
        message,
        page: window.location.pathname,
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          screenSize: `${window.screen.width}x${window.screen.height}`,
        },
      };

      // Save to IndexedDB
      await saveFeedback(feedback);

      // Track in analytics
      if (window.trackEvent) {
        window.trackEvent('interaction', 'feedback', 'submit', {
          label: feedbackType,
          metadata: { rating, sentiment },
        });
      }

      setSubmitted(true);

      // Clear previous timeout if exists
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }

      // Set new timeout with cleanup
      resetTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage('');
        setRating(0);
        setSentiment(undefined);
        setFeedbackType('general');
        resetTimeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const saveFeedback = async (feedback: Feedback): Promise<void> => {
    const request = indexedDB.open('BhriguWeltDB', 2);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(FEEDBACK_STORE)) {
        const store = db.createObjectStore(FEEDBACK_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(FEEDBACK_STORE, 'readwrite');
        const store = transaction.objectStore(FEEDBACK_STORE);
        const addRequest = store.add(feedback);

        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(new Error('Failed to save feedback'));
      };

      request.onerror = () => reject(new Error('Failed to open database'));
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-110 z-40"
        aria-label="Send feedback"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="font-semibold">Send Feedback</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Close feedback form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {submitted ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Thank You!
          </h4>
          <p className="text-gray-600 dark:text-gray-300">
            Your feedback helps us improve BhriguWelt
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback Type
            </label>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value as Feedback['type'])}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="general">General Feedback</option>
              <option value="rating">Rating</option>
              <option value="bug">Bug Report</option>
              <option value="feature-request">Feature Request</option>
              <option value="comment">Comment</option>
            </select>
          </div>

          {/* Rating (if type is rating) */}
          {feedbackType === 'rating' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate your experience
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="transition-transform hover:scale-110"
                    aria-label={`Rate ${value} out of 5`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        value <= rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How do you feel?
            </label>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setSentiment('positive')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  sentiment === 'positive'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <Smile className="w-6 h-6 mx-auto text-green-600 dark:text-green-400" />
                <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">Happy</div>
              </button>
              <button
                type="button"
                onClick={() => setSentiment('neutral')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  sentiment === 'neutral'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <Meh className="w-6 h-6 mx-auto text-yellow-600 dark:text-yellow-400" />
                <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">Okay</div>
              </button>
              <button
                type="button"
                onClick={() => setSentiment('negative')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  sentiment === 'negative'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <Frown className="w-6 h-6 mx-auto text-red-600 dark:text-red-400" />
                <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">Unhappy</div>
              </button>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Tell us what you think..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Feedback
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

// Add window type declaration for trackEvent
declare global {
  interface Window {
    trackEvent?: (type: string, category: string, action: string, options?: any) => void;
  }
}
