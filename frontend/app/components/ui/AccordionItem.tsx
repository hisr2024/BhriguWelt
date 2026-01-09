'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
  panelClassName
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

  return (
    <div className={className} data-accordion-item>
      <button
        type="button"
        id={triggerId}
        data-accordion-trigger="true"
        aria-expanded={openState}
        aria-controls={panelId}
        onClick={() => setOpenState(!openState)}
        className={`w-full text-left flex items-center justify-between gap-4 ${triggerClassName ?? ''}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2
          focus-visible:ring-offset-gray-900/80`}
      >
        <span className="flex-1">{title}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${openState ? 'rotate-180 text-cyan-300' : ''}`}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!openState}
        className={`${panelClassName ?? ''} ${openState ? 'block' : 'hidden'}`}
      >
        {children}
      </div>
    </div>
  );
};
