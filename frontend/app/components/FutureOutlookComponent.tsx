'use client';

import type { ReactNode } from 'react';
import GenZCard from './GenZCard';

type FutureOutlookContent = string | string[] | null | undefined;

interface FutureOutlookProps {
  title: string;
  icon: ReactNode;
  content: FutureOutlookContent;
  color: string;
  emptyMessage?: string;
}

const normalizeList = (content: string[]) =>
  content
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);

const isEmptyContent = (content: FutureOutlookContent) => {
  if (Array.isArray(content)) {
    return normalizeList(content).length === 0;
  }
  if (typeof content === 'string') {
    return content.trim().length === 0;
  }
  return content == null;
};

export default function FutureOutlookComponent({
  title,
  icon,
  content,
  color,
  emptyMessage = 'No prediction available yet.',
}: FutureOutlookProps) {
  const empty = isEmptyContent(content);
  const listItems = Array.isArray(content) ? normalizeList(content) : [];

  return (
    <GenZCard variant="neon" className="h-full">
      <div
        className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold mb-4 text-white">{title}</h3>
      {empty ? (
        <p className="text-white/60 italic">{emptyMessage}</p>
      ) : Array.isArray(content) ? (
        <ul className="space-y-2">
          {listItems.map((item, i) => (
            <li key={`${title}-${i}`} className="text-white/80 flex items-start gap-2">
              <span className="text-genz-electric-blue mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-white/80">{content}</p>
      )}
    </GenZCard>
  );
}
