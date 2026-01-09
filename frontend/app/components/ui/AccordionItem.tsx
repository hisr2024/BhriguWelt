'use client';

import { useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

type AccordionItemProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  lazyRender?: boolean;
};

export const AccordionItem = ({
  title,
  children,
  id,
  defaultOpen = false,
  isOpen,
  onToggle,
  className,
  triggerClassName,
  panelClassName,
  lazyRender = false
}: AccordionItemProps) => {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const triggerId = `${baseId}-trigger`;
  const panelId = `${baseId}-panel`;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = typeof isOpen === 'boolean';
  const openState = isControlled ? isOpen : internalOpen;

  const setOpenState = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onToggle?.(next);
  };

  // Fix: Define shouldRenderChildren based on lazyRender prop
  // If lazyRender is true, only render children when open
  // If lazyRender is false, always render (but hide with CSS)
  const shouldRenderChildren = !lazyRender || openState;

  // Handle keyboard Enter/Space for better accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpenState(!openState);
    }
  };

  return (
    <div className={className} data-accordion-item>
      <button
        type="button"
        id={triggerId}
        data-accordion-trigger="true"
        aria-expanded={openState}
        aria-controls={panelId}
        onClick={() => setOpenState(!openState)}
        onKeyDown={handleKeyDown}
        className={`w-full text-left flex items-center justify-between gap-4 min-h-[44px] p-4 md:p-6 ${triggerClassName ?? ''}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2
          focus-visible:ring-offset-gray-900/80 cursor-pointer transition-all
          hover:bg-white/5 active:bg-white/10`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="flex-1">{title}</span>
        {openState ? (
          <ChevronUp
            className="w-5 h-5 text-cyan-300 transition-all duration-200"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className="w-5 h-5 text-gray-400 transition-all duration-200"
            aria-hidden="true"
          />
        )}
      </button>

      <AnimatePresence initial={false}>
        {openState && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className={panelClassName ?? 'pt-4'}
            >
              {shouldRenderChildren ? children : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
