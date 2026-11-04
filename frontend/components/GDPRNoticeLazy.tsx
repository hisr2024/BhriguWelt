'use client';

import dynamic from 'next/dynamic';

// The consent banner (and framer-motion) loads after first paint instead of
// being part of every page's initial JavaScript.
const GDPRNotice = dynamic(() => import('./GDPRNotice').then((m) => m.GDPRNotice), { ssr: false });

export function GDPRNoticeLazy() {
  return <GDPRNotice />;
}
