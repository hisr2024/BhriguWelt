"use client";

import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<string, string> = {
  primary: "bg-amber-400 text-slate-900 hover:bg-amber-300",
  ghost: "border border-slate-700 text-slate-100 hover:border-slate-500 hover:bg-slate-900",
  subtle: "bg-slate-900/60 text-slate-100 hover:bg-slate-900",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], className))}
      type={props.type ?? "button"}
      {...props}
    />
  );
}
