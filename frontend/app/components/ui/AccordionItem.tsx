'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type AccordionItemProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  defaultOpen?: boolean;
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
  className,
  triggerClassName,
  panelClassName,
  lazyRender = false
}: AccordionItemProps) => {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const triggerId = `${baseId}-trigger`;
  const panelId = `${baseId}-panel`;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const shouldRenderChildren = !lazyRender || isOpen;

  return (
    <div className={className} data-accordion-item>
      <button
        type="button"
        id={triggerId}
        data-accordion-trigger="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full text-left flex items-center justify-between gap-4 ${triggerClassName ?? ''}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2
          focus-visible:ring-offset-gray-900/80`}
      >
        <span className="flex-1">{title}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-cyan-300' : ''}`}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!isOpen}
        className={`${panelClassName ?? ''} ${isOpen ? 'block' : 'hidden'}`}
      >
        {shouldRenderChildren ? children : null}
      </div>
    </div>
  );
};
