'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface PredictionErrorProps {
  error: string;
  onRetry?: () => void;
}

export default function PredictionError({ error, onRetry }: PredictionErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Unable to Load Prediction
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {error || 'An unexpected error occurred while loading your prediction.'}
        </p>

        {/* Action Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
        )}

        {/* Help Text */}
        <p className="text-xs text-gray-500 text-center mt-6">
          If this problem persists, please contact support or try again later.
        </p>
      </div>
    </div>
  );
}
