"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import type { EngineField, EngineResult } from "@/lib/engineConfig";
import Tooltip from "@/components/Tooltip";
import VoiceInputButton from "@/components/VoiceInputButton";
import EngineResultPanel from "@/components/EngineResultPanel";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const transition = { duration: 0.4, ease: [0.2, 0.65, 0.3, 0.9] };

const getSampleValue = (field: EngineField) => {
  switch (field.type) {
    case "email":
      return "seer@bhriguwelt.ai";
    case "date":
      return "1994-08-12";
    case "time":
      return "07:30";
    case "number":
      return "6";
    case "select":
      return field.options?.[0] ?? "";
    case "textarea":
      return "Seeking clarity on upcoming milestones and growth.";
    default:
      return "Sample entry";
  }
};

type EngineFormProps = {
  fields: EngineField[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => Promise<EngineResult>;
  accent: string;
  engineTitle: string;
};

export default function EngineForm({
  fields,
  submitLabel = "Generate insight",
  onSubmit,
  accent,
  engineTitle,
}: EngineFormProps) {
  const formId = useId();
  const initialValues = useMemo(
    () => fields.reduce((acc, field) => ({ ...acc, [field.name]: "" }), {} as Record<string, string>),
    [fields],
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [offline, setOffline] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    setValues(initialValues);
    setActiveStep(0);
  }, [initialValues]);

  useEffect(() => {
    if (!loading) {
      if (result) setProgress(100);
      return;
    }
    setProgress(12);
    const timer = window.setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 12 + 6, 94));
    }, 240);
    return () => window.clearInterval(timer);
  }, [loading, result]);

  useEffect(() => {
    const updateStatus = () => setOffline(!navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  const steps = useMemo(() => {
    if (fields.length <= 3) return [fields];
    const chunkSize = 2;
    const chunks: EngineField[][] = [];
    for (let index = 0; index < fields.length; index += chunkSize) {
      chunks.push(fields.slice(index, index + chunkSize));
    }
    return chunks;
  }, [fields]);

  const visibleFields = steps[activeStep] ?? fields;
  const isLastStep = activeStep === steps.length - 1;
  const requiredFields = useMemo(() => fields.filter((field) => field.required), [fields]);
  const requiredCount = requiredFields.length;
  const totalFields = fields.length;
  const completion = useMemo(() => {
    if (requiredFields.length === 0) return 0;
    const completed = requiredFields.filter((field) => values[field.name]?.trim()).length;
    return Math.round((completed / requiredFields.length) * 100);
  }, [requiredFields, values]);
  const sampleValues = useMemo(
    () =>
      fields.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: getSampleValue(field),
        }),
        {} as Record<string, string>,
      ),
    [fields],
  );

  const validate = (fieldsToValidate: EngineField[] = fields) => {
    const nextErrors: Record<string, string> = { ...errors };
    fieldsToValidate.forEach((field) => {
      const value = values[field.name]?.trim();
      if (field.required && !value) {
        nextErrors[field.name] = "This field is required.";
        return;
      }
      if (field.type === "email" && value && !emailPattern.test(value)) {
        nextErrors[field.name] = "Enter a valid email.";
        return;
      }
      if (field.type === "number" && value && Number.isNaN(Number(value))) {
        nextErrors[field.name] = "Enter a valid number.";
        return;
      }
      delete nextErrors[field.name];
    });
    if (fieldsToValidate.length === fields.length) {
      Object.keys(nextErrors).forEach((key) => {
        if (!fields.find((field) => field.name === key)) {
          delete nextErrors[key];
        }
      });
    }
    setErrors(nextErrors);
    return fieldsToValidate.every((field) => !nextErrors[field.name]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLastStep && steps.length > 1) {
      if (!validate(visibleFields)) {
        setProgress(0);
        return;
      }
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }
    if (!validate()) {
      setProgress(0);
      return;
    }
    setLoading(true);
    setSubmitError(null);
    setResult(null);
    setLastSubmitted(values);
    try {
      const nextResult = await onSubmit(values);
      setResult(nextResult);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!lastSubmitted) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const nextResult = await onSubmit(lastSubmitted);
      setResult(nextResult);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setResult(null);
    setSubmitError(null);
    setProgress(0);
    setActiveStep(0);
  };

  const handleFillSample = () => {
    setValues(sampleValues);
    setErrors({});
    setActiveStep(0);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <form className="space-y-6" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        {steps.length > 1 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                Step {activeStep + 1} of {steps.length}
              </span>
              <span className="text-slate-400">Completion {completion}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/5">
              <div className="h-2 rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400" style={{ width: `${completion}%` }} />
            </div>
          </div>
        ) : null}

        {offline ? (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            You are offline. Submissions will use cached guidance and sync when reconnected.
          </div>
        ) : null}
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Form status</p>
              <p className="text-sm text-slate-200">
                {loading ? "Calibrating chart signals" : result ? "Insight stream ready" : "Awaiting your details"}
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-indigo-300" />
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/5">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={transition}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {requiredCount} required · {totalFields} fields
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Avg. completion {Math.max(2, Math.ceil(totalFields / 2))} min
            </span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {visibleFields.map((field) => {
            const hasError = Boolean(errors[field.name]);
            const fieldId = `${formId}-${field.name}`;
            const baseClass =
              "w-full rounded-2xl border px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40";
            const inputClass = `${baseClass} bg-slate-900/70 ${hasError ? "border-red-400" : "border-white/10"}`;

            return (
              <label key={field.name} className="flex flex-col gap-2 text-sm text-slate-300" htmlFor={fieldId}>
                <span className="flex items-center gap-2 font-medium text-slate-200">
                  {field.label}
                  {field.required ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.2em] text-slate-400">
                      Required
                    </span>
                  ) : null}
                  {field.helper ? <Tooltip content={field.helper} /> : null}
                </span>
                {field.type === "textarea" ? (
                  <div className="relative">
                    <textarea
                      id={fieldId}
                      className={`${inputClass} min-h-[120px] resize-none pr-12`}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={values[field.name]}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                      }
                      onBlur={() => validate([field])}
                      aria-invalid={hasError}
                      aria-describedby={hasError ? `${fieldId}-error` : undefined}
                    />
                    <div className="absolute right-3 top-3">
                      <VoiceInputButton
                        onTranscript={(value) =>
                          setValues((prev) => ({ ...prev, [field.name]: `${prev[field.name]} ${value}`.trim() }))
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>
                ) : field.type === "select" ? (
                  <select
                    id={fieldId}
                    className={inputClass}
                    name={field.name}
                    value={values[field.name]}
                    onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                    onBlur={() => validate([field])}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `${fieldId}-error` : undefined}
                  >
                    <option value="">Select</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="relative">
                    <input
                      id={fieldId}
                      className={`${inputClass} pr-12`}
                      name={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={values[field.name]}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                      }
                      onBlur={() => validate([field])}
                      aria-invalid={hasError}
                      aria-describedby={hasError ? `${fieldId}-error` : undefined}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <VoiceInputButton
                        onTranscript={(value) =>
                          setValues((prev) => ({ ...prev, [field.name]: `${prev[field.name]} ${value}`.trim() }))
                        }
                        disabled={loading || field.type !== "text"}
                      />
                    </div>
                  </div>
                )}
                {hasError ? (
                  <span id={`${fieldId}-error`} className="text-xs text-red-400">
                    {errors[field.name]}
                  </span>
                ) : field.helper ? (
                  <span className="text-xs text-slate-500">{field.helper}</span>
                ) : null}
              </label>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {steps.length > 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
              disabled={activeStep === 0}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Processing" : isLastStep ? submitLabel : "Continue"}
          </button>
          <button
            type="button"
            onClick={handleFillSample}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30"
          >
            Autofill sample
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30"
            onClick={resetForm}
          >
            Reset
          </button>
        </div>
        <AnimatePresence>
          {submitError ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100"
              role="alert"
            >
              <AlertTriangle className="mt-1 h-4 w-4" />
              <div className="space-y-2">
                <p>{submitError}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white/30"
                >
                  Retry submission
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>

      <AnimatePresence mode="wait">
        {result ? (
          <EngineResultPanel result={result} accent={accent} engineTitle={engineTitle} />
        ) : (
          <motion.aside
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="result-frame flex h-full flex-col items-start justify-center gap-3 border border-dashed border-white/20 bg-white/5 p-6 text-sm text-slate-400"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Results dock</p>
            <p className="text-base font-semibold text-slate-200">Results will appear here.</p>
            <p className="text-slate-400">Submit the form to view a highlighted report with interactive orbit cards.</p>
            <div className={`mt-2 h-1.5 w-full rounded-full bg-gradient-to-r ${accent} opacity-60`} />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
