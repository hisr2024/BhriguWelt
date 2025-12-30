import type { ReactNode } from "react";

import Link, { LinkProps } from "next/link";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300";

const variants: Record<string, string> = {
  primary: "bg-amber-400 text-slate-900 hover:bg-amber-300",
  ghost: "border border-slate-700 text-slate-100 hover:border-slate-500 hover:bg-slate-900",
  subtle: "bg-slate-900/60 text-slate-100 hover:bg-slate-900",
};

type LinkButtonProps = LinkProps & {
  className?: string;
  variant?: keyof typeof variants;
  children: ReactNode;
};

export function LinkButton({ className, variant = "primary", children, ...props }: LinkButtonProps) {
  return (
    <Link className={twMerge(clsx(baseStyles, variants[variant], className))} {...props}>
      {children}
    </Link>
  );
}
