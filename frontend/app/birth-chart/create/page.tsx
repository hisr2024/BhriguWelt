'use client';

import AnimatedBackground, { FloatingElements } from '../../components/AnimatedBackground';
import CreateBirthChartForm from '../CreateBirthChartForm';

export default function CreateBirthChartPage() {
  return (
    <div className="min-h-screen relative overflow-hidden px-4 py-12 pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="relative z-10">
        <CreateBirthChartForm />
      </div>

    </div>
  );
}
