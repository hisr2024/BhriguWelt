'use client';

import { notFound, useParams } from 'next/navigation';
import HoroscopePage from '../page';

const KNOWN = ['daily', 'today', 'day', 'weekly', 'week', 'monthly', 'month', 'yearly', 'year'];

export default function HoroscopeScopePage() {
  const params = useParams<{ scope?: string }>();
  const scope = String(params?.scope ?? '').toLowerCase();
  if (!KNOWN.includes(scope)) notFound();
  return <HoroscopePage />;
}
