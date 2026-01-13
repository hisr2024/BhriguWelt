'use client';

import BirthChartForm from '@/components/BirthChartForm';

export default function BirthChartNewPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BirthChartForm />
      </div>
    </main>
  );
}
