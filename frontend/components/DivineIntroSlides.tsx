'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Shield, BookOpen, Sparkles } from 'lucide-react';

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

  // Reset slide on open
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onComplete}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-lg bg-gradient-to-br from-amber-900/95 via-amber-800/95 to-yellow-900/95 rounded-3xl overflow-hidden shadow-2xl border border-amber-600/30"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Close button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative flute icon */}
        <div className="absolute top-4 right-16 text-amber-600/50">
          <svg className="w-8 h-8 rotate-45" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="10" width="20" height="4" rx="2" />
            <circle cx="6" cy="12" r="1" fill="white" />
            <circle cx="10" cy="12" r="1" fill="white" />
            <circle cx="14" cy="12" r="1" fill="white" />
            <circle cx="18" cy="12" r="1" fill="white" />
          </svg>
        </div>

        {/* Tree decoration */}
        <div className="absolute bottom-4 left-4 text-2xl opacity-60">
          🌳
        </div>

        {/* Content */}
        <div className="relative p-8 pt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon with glow effect */}
              <div className="relative mb-6">
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-amber-500/30 blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                {/* Icon container */}
                <motion.div
                  className={`relative w-24 h-24 ${slide.iconBg} rounded-full flex items-center justify-center shadow-lg`}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <span className="text-5xl">{slide.icon}</span>
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-bold text-amber-100 mb-4">
                {slide.title}
              </h2>

              {/* Subtitle/Quote */}
              <p className={`text-amber-200/90 mb-6 max-w-md leading-relaxed ${slide.affirmation ? 'italic' : ''}`}>
                {slide.subtitle}
              </p>

              {/* Affirmation quote if present */}
              {slide.quote && (
                <div className="mb-6 px-4 py-3 bg-black/20 rounded-xl border border-amber-500/20">
                  <p className="text-xs text-amber-300/60 uppercase tracking-wider mb-1">
                    {slide.affirmation ? "Today's Affirmation" : 'Divine Message'}
                  </p>
                  <p className="text-amber-100 font-medium italic">
                    {slide.quote}
                  </p>
                  {!slide.affirmation && (
                    <p className="text-xs text-amber-300/60 mt-2 flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Your soul knows the way - trust it.
                    </p>
                  )}
                </div>
              )}

              {/* Action button */}
              <motion.button
                onClick={handleButtonClick}
                className="w-full max-w-xs px-8 py-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold rounded-xl shadow-lg transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {slide.buttonText}
              </motion.button>
            </motion.div>
          </AnimatePresence>

          {/* Dot navigation */}
          <div className="flex justify-center gap-2 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-amber-400 w-6'
                    : 'bg-amber-600/50 hover:bg-amber-500/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Navigation arrows */}
        {currentSlide > 0 && (
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white/70 hover:text-white transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {currentSlide < slides.length - 1 && (
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white/70 hover:text-white transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default DivineIntroSlides;
