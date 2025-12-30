"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

const baseClass =
  "w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Field({ label, className, ...props }: InputProps) {
  const id = props.id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
      <span>{label}</span>
      <input id={id} className={twMerge(clsx(baseClass, className))} {...props} />
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function TextareaField({ label, className, ...props }: TextareaProps) {
  const id = props.id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
      <span>{label}</span>
      <textarea id={id} className={twMerge(clsx(baseClass, "min-h-[120px]", className))} {...props} />
    </label>
  );
}
