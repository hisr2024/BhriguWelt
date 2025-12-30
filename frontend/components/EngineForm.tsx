"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "@/lib/framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { EngineField, EngineResult } from "@/lib/engineConfig";
import { ResultSkeleton } from "@/components/Skeletons";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EngineFormProps = {
  fields: EngineField[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => Promise<EngineResult>;
};

export default function EngineForm({ fields, submitLabel = "Generate insight", onSubmit }: EngineFormProps) {
  const initialValues = useMemo(
    () => fields.reduce((acc, field) => ({ ...acc, [field.name]: "" }), {} as Record<string, string>),
    [fields],
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const value = values[field.name]?.trim();
      if (field.required && !value) {
        nextErrors[field.name] = "This field is required.";
      }
      if (field.type === "email" && value && !emailPattern.test(value)) {
        nextErrors[field.name] = "Enter a valid email.";
      }
      if (field.type === "number" && value && Number.isNaN(Number(value))) {
        nextErrors[field.name] = "Enter a valid number.";
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setLoading(true);
    setSubmitError(null);
    setResult(null);
    try {
      const nextResult = await onSubmit(values);
      setResult(nextResult);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((field) => {
            const hasError = Boolean(errors[field.name]);
            const baseClass =
              "w-full rounded-2xl border px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none";
            return (
              <label key={field.name} className="flex flex-col gap-2 text-sm text-slate-300">
                <span className="font-medium text-slate-200">{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea
                    className={`${baseClass} min-h-[120px] resize-none bg-slate-900/70 ${
                      hasError ? "border-red-400" : "border-white/10"
                    }`}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={values[field.name]}
                    onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                    aria-invalid={hasError}
                  />
                ) : field.type === "select" ? (
                  <select
                    className={`${baseClass} bg-slate-900/70 ${hasError ? "border-red-400" : "border-white/10"}`}
                    name={field.name}
                    value={values[field.name]}
                    onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                    aria-invalid={hasError}
                  >
                    <option value="">Select</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={`${baseClass} bg-slate-900/70 ${hasError ? "border-red-400" : "border-white/10"}`}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={values[field.name]}
                    onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                    aria-invalid={hasError}
                  />
                )}
                {field.helper ? <span className="text-xs text-slate-500">{field.helper}</span> : null}
                {hasError ? <span className="text-xs text-red-400">{errors[field.name]}</span> : null}
              </label>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Processing" : submitLabel}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30"
            onClick={() => {
              setValues(initialValues);
              setErrors({});
              setResult(null);
              setSubmitError(null);
            }}
          >
            Reset
          </button>
        </div>
        <AnimatePresence>
          {submitError ? (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100"
              role="alert"
            >
              <AlertTriangle className="mt-1 h-4 w-4" />
              <span>{submitError}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.aside
            key="loading"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          >
            <ResultSkeleton />
          </motion.aside>
        ) : result ? (
          <motion.aside
            key={result.title}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            className="result-panel space-y-6 p-6"
          >
            <div className="relative space-y-3">
              <h3 className="text-xl font-semibold text-white">{result.title}</h3>
              <p className="text-sm text-slate-300">{result.summary}</p>
            </div>
            <div className="relative space-y-4">
              {result.highlights.map((highlight) => (
                <div key={highlight.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{highlight.label}</p>
                  <p className="mt-2 text-base font-semibold text-white">{highlight.value}</p>
                </div>
              ))}
            </div>
            <div className="relative space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Next actions</p>
              <ul className="space-y-2 text-sm text-slate-200">
                {result.nextSteps.map((step) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        ) : (
          <motion.aside
            key="empty"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            className="flex h-full flex-col items-start justify-center rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-slate-400"
          >
            <p className="text-base font-semibold text-slate-200">Results will appear here.</p>
            <p className="mt-2 text-slate-400">Submit the form to view a highlighted report.</p>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
