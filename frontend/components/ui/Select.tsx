"use client";

import { SelectHTMLAttributes } from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

const baseClass =
  "w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export function SelectField({ label, className, children, ...props }: SelectProps) {
  const id = props.id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
      <span>{label}</span>
      <select id={id} className={twMerge(clsx(baseClass, className))} {...props}>
        {children}
      </select>
    </label>
  );
}
