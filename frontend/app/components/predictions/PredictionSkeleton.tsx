'use client';

export default function PredictionSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gray-200 rounded-xl h-40 md:h-48" />

      {/* Summary Skeleton */}
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
        </div>
      </div>

      {/* Sections Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-gray-300 rounded-full" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
