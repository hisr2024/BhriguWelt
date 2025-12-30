"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { engineConfigs } from "@/lib/engineConfig";

type EngineSwipeNavigatorProps = {
  currentSlug: string;
};

export default function EngineSwipeNavigator({ currentSlug }: EngineSwipeNavigatorProps) {
  const router = useRouter();
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = touch.clientY - startY.current;
      if (Math.abs(deltaX) < 80 || Math.abs(deltaY) > 60) return;

      const currentIndex = engineConfigs.findIndex((engine) => engine.slug === currentSlug);
      if (currentIndex === -1) return;

      const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
      const nextEngine = engineConfigs[(nextIndex + engineConfigs.length) % engineConfigs.length];
      router.push(`/${nextEngine.slug}`);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentSlug, router]);

  return null;
}
