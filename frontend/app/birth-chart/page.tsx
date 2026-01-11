'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BirthChartPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/birth-chart/view');
  }, [router]);

  return null;
}
