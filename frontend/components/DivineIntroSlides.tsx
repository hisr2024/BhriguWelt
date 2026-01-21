'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

// Intro slide data with Krishna theme
const slides = [
  {
    id: 1,
    icon: '🙏',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    title: 'Welcome to Divine Presence',
    subtitle: 'Experience the loving guidance of Krishna. You are never alone on this journey.',
    buttonText: "Receive Krishna's Darshan",
    buttonAction: 'darshan',
  },
  {
    id: 2,
    icon: '💙',
    iconBg: 'bg-gradient-to-br from-amber-600 to-yellow-700',
    title: 'Gentle morning',
    subtitle: 'As the day begins, let your heart awaken too...',
    quote: '"The sacred light shines within me."',
    affirmation: true,
    buttonText: 'Begin My Day with Krishna',
    buttonAction: 'begin',
  },
  {
    id: 3,
    icon: '🙏',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    title: 'Sacred Blessing',
    subtitle: 'May divine grace guide your path today and always.',
    quote: '"Your soul knows the way - trust it."',
    buttonText: 'Receive Blessing',
    buttonAction: 'blessing',
  },
  {
    id: 4,
    icon: '🕉️',
    iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    title: 'Divine Protection',
    subtitle: 'Krishna\'s shield surrounds you. No harm can touch your soul.',
    quote: '"I am always with you. In every thought, every breath, every heartbeat."',
    buttonText: 'Activate Protection',
    buttonAction: 'protection',
  },
  {
    id: 5,
    icon: '💙',
    iconBg: 'bg-gradient-to-br from-amber-600 to-yellow-700',
    title: 'Go in peace, beloved one.',
    subtitle: '"I am always with you. In every thought, every breath, every heartbeat - there I am. You are never alone."',
    buttonText: 'Begin My Day with Krishna',
    buttonAction: 'complete',
  },
];

interface DivineIntroSlidesProps {
  onComplete: () => void;
  isOpen: boolean;
}

export function DivineIntroSlides({ onComplete, isOpen }: DivineIntroSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset slide on open and lock body scroll
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      // Restore scroll position when modal closes
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return;
    if (index >= 0 && index < slides.length) {
      setIsAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 400);
    }
  }, [currentSlide, isAnimating]);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  }, [currentSlide, goToSlide, onComplete]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  const handleButtonClick = useCallback(() => {
    const action = slides[currentSlide].buttonAction;
    if (action === 'complete') {
      onComplete();
    } else {
      nextSlide();
    }
  }, [currentSlide, nextSlide, onComplete]);

  if (!isOpen) return null;

  const slide = slides[currentSlide];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        isolation: 'isolate',
      }}
    >
      {/* Backdrop - covers everything including nav elements */}
      <motion.div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onComplete}
        style={{ willChange: 'opacity' }}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-lg bg-gradient-to-br from-amber-900/98 via-amber-800/98 to-yellow-900/98 rounded-3xl shadow-2xl border border-amber-600/40 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative flute icon - positioned to avoid overlap */}
        <div className="absolute top-4 right-16 text-amber-600/30 pointer-events-none select-none">
          <svg className="w-6 h-6 rotate-45" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="10" width="20" height="4" rx="2" />
            <circle cx="6" cy="12" r="1" fill="white" fillOpacity="0.5" />
            <circle cx="10" cy="12" r="1" fill="white" fillOpacity="0.5" />
            <circle cx="14" cy="12" r="1" fill="white" fillOpacity="0.5" />
            <circle cx="18" cy="12" r="1" fill="white" fillOpacity="0.5" />
          </svg>
        </div>

        {/* Tree decoration - subtle and non-intrusive */}
        <div className="absolute bottom-4 left-4 text-xl opacity-30 pointer-events-none select-none">
          🌳
        </div>

        {/* Content */}
        <div className="relative p-6 sm:p-8 pt-10 sm:pt-12">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col items-center text-center"
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Icon with subtle glow effect */}
              <div className="relative mb-5 flex items-center justify-center">
                {/* Glow ring - subtle to avoid flickering */}
                <div
                  className="absolute w-28 h-28 rounded-full bg-amber-500/20 blur-2xl"
                  style={{ transform: 'translateZ(0)' }}
                />
                {/* Icon container with subtle breathing animation */}
                <motion.div
                  className={`relative w-20 h-20 sm:w-24 sm:h-24 ${slide.iconBg} rounded-full flex items-center justify-center shadow-xl`}
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ willChange: 'transform' }}
                >
                  <span className="text-4xl sm:text-5xl">{slide.icon}</span>
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-100 mb-3 leading-tight">
                {slide.title}
              </h2>

              {/* Subtitle/Quote */}
              <p className={`text-amber-200/90 mb-5 max-w-sm sm:max-w-md leading-relaxed text-sm sm:text-base px-2 ${slide.affirmation ? 'italic' : ''}`}>
                {slide.subtitle}
              </p>

              {/* Affirmation quote if present */}
              {slide.quote && (
                <div className="mb-5 px-3 sm:px-4 py-3 bg-black/25 rounded-xl border border-amber-500/20 max-w-sm sm:max-w-md mx-auto">
                  <p className="text-xs text-amber-300/60 uppercase tracking-wider mb-1">
                    {slide.affirmation ? "Today's Affirmation" : 'Divine Message'}
                  </p>
                  <p className="text-amber-100 font-medium italic text-sm sm:text-base">
                    {slide.quote}
                  </p>
                  {!slide.affirmation && (
                    <p className="text-xs text-amber-300/50 mt-2 flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Your soul knows the way - trust it.
                    </p>
                  )}
                </div>
              )}

              {/* Action button */}
              <motion.button
                onClick={handleButtonClick}
                className="w-full max-w-[280px] sm:max-w-xs px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold rounded-xl shadow-lg transition-colors text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ willChange: 'transform' }}
              >
                {slide.buttonText}
              </motion.button>
            </motion.div>
          </AnimatePresence>

          {/* Dot navigation */}
          <div className="flex justify-center items-center gap-2 mt-6 pb-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-amber-400 w-6'
                    : 'bg-amber-600/40 hover:bg-amber-500/60 w-2.5'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Navigation arrows - hidden on mobile for cleaner look */}
        {currentSlide > 0 && (
          <button
            onClick={prevSlide}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/30 hover:bg-black/40 text-white/80 hover:text-white transition-colors hidden sm:flex items-center justify-center"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
        {currentSlide < slides.length - 1 && (
          <button
            onClick={nextSlide}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/30 hover:bg-black/40 text-white/80 hover:text-white transition-colors hidden sm:flex items-center justify-center"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default DivineIntroSlides;
