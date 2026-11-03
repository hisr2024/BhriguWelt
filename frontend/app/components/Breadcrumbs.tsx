'use client';

/**
 * Breadcrumbs Navigation Component
 * Shows current location in the app hierarchy
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    // Split pathname and filter empty strings
    const paths = pathname.split('/').filter(Boolean);

    // Map of path segments to readable labels
    const labelMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'birth-chart': 'Birth Chart',
      'karmic-journey': 'Karmic Journey',
      'past-lives': 'Past Lives',
      'future-lives': 'Future Lives',
      'present-life': 'Present Life',
      'life-events': 'Life Events',
      'karmic-remedies': 'Karmic Remedies',
      'bhrigu-predictions': 'Bhrigu Predictions',
      'daily-insights': 'Daily Insights',
      'horoscope': 'Horoscope',
      'predictions': 'Predictions',
      'relationships': 'Relationships',
      'matchmaking': 'Matchmaking',
      'ai-chat': 'AI Chat',
      'profile': 'Profile',
      'settings': 'Settings',
      'get-started': 'Get Started',
      'setup-passcode': 'Setup Passcode',
      'unlock': 'Unlock',
      'offline': 'Offline Mode',
      'bookmarks': 'Bookmarks',
      'export': 'Export Data',
      'import': 'Import Data',
    };

    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = '';

    paths.forEach((path, _index) => {
      currentPath += `/${path}`;
      const label = labelMap[path] || path.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      breadcrumbs.push({
        label,
        href: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home or if only one level deep
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm py-3 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Home Link */}
      <Link
        href="/dashboard"
        className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <React.Fragment key={breadcrumb.href}>
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />
            {isLast ? (
              <span className="text-gray-900 dark:text-white font-medium truncate max-w-[150px] sm:max-w-none">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors truncate max-w-[100px] sm:max-w-none"
              >
                {breadcrumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
