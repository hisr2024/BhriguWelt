/**
 * Nadi Gold line icons: engraved-style SVG, 1.3px stroke, currentColor.
 * Decorative by default (aria-hidden); pass a label for standalone use.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; label?: string };

function Base({ size = 22, label, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const SunIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></Base>
);
export const LeafIcon = (p: IconProps) => (
  <Base {...p}><rect x="2.5" y="8" width="19" height="8" rx="4" /><circle cx="6" cy="12" r=".9" /><circle cx="18" cy="12" r=".9" /><path d="M8.5 11h7M8.5 13h5" /></Base>
);
export const ChartIcon = (p: IconProps) => (
  <Base {...p}><rect x="3" y="3" width="18" height="18" /><path d="M3 3l18 18M21 3L3 21M12 3l9 9-9 9-9-9z" /></Base>
);
export const UnionIcon = (p: IconProps) => (
  <Base {...p}><circle cx="9" cy="12" r="5.5" /><circle cx="15" cy="12" r="5.5" /></Base>
);
export const SelfIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" /></Base>
);
export const WheelIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2" /><path d="M12 3.5V10M12 14v6.5M3.5 12H10M14 12h6.5M6 6l4.6 4.6M13.4 13.4L18 18M18 6l-4.6 4.6M10.6 13.4L6 18" /></Base>
);
export const LotusIcon = (p: IconProps) => (
  <Base {...p}><path d="M12 5c2 2.5 2 7 0 10-2-3-2-7.5 0-10zM12 15c-3-.5-6.5-2.5-8-6 3 .2 6 2 8 6zM12 15c3-.5 6.5-2.5 8-6-3 .2-6 2-8 6zM4 18h16" /></Base>
);
export const HourglassIcon = (p: IconProps) => (
  <Base {...p}><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9" /></Base>
);
export const FlameIcon = (p: IconProps) => (
  <Base {...p}><path d="M12 3c1 3 5 5 5 10a5 5 0 01-10 0c0-2.5 1.5-3.5 2-5 1 1 1.5 2 1.5 3 1-2 1.5-5 1.5-8z" /></Base>
);
export const ArrowIcon = (p: IconProps) => (
  <Base {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Base>
);
export const BackIcon = (p: IconProps) => (
  <Base {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Base>
);
export const AskIcon = (p: IconProps) => (
  <Base {...p}><path d="M4 5h16v11H9l-5 4z" /><path d="M10 9.5a2 2 0 113 1.7c-.7.4-1 .8-1 1.6M12 14.5v.1" /></Base>
);
export const RebirthIcon = (p: IconProps) => (
  <Base {...p}><path d="M20 12a8 8 0 11-2.3-5.6M20 4v4h-4" /><circle cx="12" cy="12" r="2.2" /></Base>
);
export const StarIcon = (p: IconProps) => (
  <Base {...p}><path d="M12 3l2.2 6.3H21l-5.4 4 2 6.4L12 16l-5.6 3.7 2-6.4L3 9.3h6.8z" /></Base>
);

/** North-Indian diamond chart emblem (the brand mark). */
export function DiamondChartEmblem({ size = 150, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 150 150" width={size} height={size} fill="none" stroke="#D4AF5F" strokeWidth={0.9} className={className} aria-hidden>
      <circle cx="75" cy="75" r="72" strokeOpacity=".35" />
      <circle cx="75" cy="75" r="58" strokeOpacity=".6" />
      <rect x="34" y="34" width="82" height="82" strokeOpacity=".9" />
      <path d="M34 34l82 82M116 34l-82 82M75 34l41 41-41 41-41-41z" strokeOpacity=".9" />
      <g fill="#EBCB86" stroke="none">
        <circle cx="75" cy="3" r="1.6" /><circle cx="147" cy="75" r="1.6" /><circle cx="75" cy="147" r="1.6" /><circle cx="3" cy="75" r="1.6" />
      </g>
    </svg>
  );
}
