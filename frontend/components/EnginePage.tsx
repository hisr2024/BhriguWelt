"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  ChartLine,
  CircleAlert,
  Download,
  FileDown,
  Info,
  Mic,
  Sparkles,
  Stars,
  Wand2,
  Zap,
} from "lucide-react";
import { Space_Grotesk, Manrope } from "next/font/google";
import type { EngineConfig, EngineField } from "@/lib/engineConfig";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

type EnginePageProps = {
  engine: EngineConfig;
};

type FieldErrors = Record<string, string>;

const formFieldIcons: Record<EngineField["type"], typeof Wand2> = {
  text: Wand2,
  email: BadgeCheck,
  date: Stars,
  time: Sparkles,
  select: Zap,
  number: ChartLine,
  textarea: Wand2,
};

const initialChartData = [32, 64, 48, 78, 54, 88, 62];

const validateField = (field: EngineField, value: string) => {
  if (field.required && !value.trim()) {
    return `${field.label} is required.`;
  }

  if (field.type === "email" && value) {
    const isValid = /\S+@\S+\.\S+/.test(value);
    if (!isValid) {
      return "Enter a valid email address.";
    }
  }

  if (field.type === "number" && value) {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return `${field.label} should be a number.`;
    }
    if (numericValue <= 0) {
      return `${field.label} should be greater than 0.`;
    }
  }

  return "";
};

export default function EnginePage({ engine }: EnginePageProps) {
  const defaultValues = useMemo(
    () =>
      engine.fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {}),
    [engine.fields],
  );
  const [values, setValues] = useState<Record<string, string>>(defaultValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [resultVisible, setResultVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(72);

  const requiredFields = engine.fields.filter((field) => field.required);
  const completedCount = requiredFields.filter((field) => values[field.name]?.trim()).length;
  const progress = Math.round((completedCount / Math.max(requiredFields.length, 1)) * 100);

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    engine.fields.forEach((field) => {
      const message = validateField(field, values[field.name] ?? "");
      if (message) {
        nextErrors[field.name] = message;
      }
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setResultVisible(true);
    }
  };

  const handleVoiceInput = () => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition = (window as typeof window & { webkitSpeechRecognition?: any })
      .webkitSpeechRecognition;
    const SpeechRecognitionStandard = (window as typeof window & { SpeechRecognition?: any }).SpeechRecognition;
    const Recognition = SpeechRecognitionStandard || SpeechRecognition;

    if (!Recognition) {
      setIsListening((prev) => !prev);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      const firstField = engine.fields[0];
      if (firstField) {
        handleChange(firstField.name, transcript);
      }
    };
    recognition.start();
  };

  const handleExport = (format: "pdf" | "csv") => {
    const content = JSON.stringify(
      {
        engine: engine.title,
        inputs: values,
        summary: engine.resultSummary,
        highlights: engine.resultHighlights,
      },
      null,
      2,
    );
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${engine.slug}-report.${format === "pdf" ? "txt" : "csv"}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-hero-gradient text-white`}
    >
      <div className="relative mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em]">
              {engine.category} Engine
            </span>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
              <ChartLine className="h-4 w-4 text-aurora" />
              Live insights · Gen Z ready
            </div>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-fluid-2xl font-semibold text-white">
                {engine.title}
              </h1>
              <p className="mt-3 max-w-2xl text-fluid-base text-white/70">
                {engine.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm transition hover:border-white/40"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                Trending {engine.title}
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm transition hover:border-white/40"
                onClick={handleVoiceInput}
              >
                <Mic className={`h-4 w-4 ${isListening ? "text-rose-300" : "text-cyan-200"}`} />
                {isListening ? "Listening..." : "Voice input"}
              </button>
            </div>
          </div>
        </motion.section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="rounded-3xl border border-white/10 bg-card-gradient p-6 shadow-[0_30px_80px_rgba(15,23,42,0.65)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-fluid-lg font-semibold">{engine.formTitle}</h2>
                <p className="mt-2 text-sm text-white/65">{engine.formDescription}</p>
              </div>
              <div className="w-full max-w-xs">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              {engine.fields.map((field) => {
                const Icon = formFieldIcons[field.type] ?? Wand2;
                const error = errors[field.name];
                return (
                  <label key={field.name} className="space-y-2 text-sm text-white/80">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                          <Icon className="h-4 w-4 text-aurora" />
                        </span>
                        {field.label}
                        {field.required ? <span className="text-rose-300">*</span> : null}
                      </span>
                      {field.helper ? (
                        <span className="group relative flex items-center gap-1 text-xs text-white/50">
                          <Info className="h-4 w-4" />
                          <span className="absolute right-0 top-6 z-10 hidden w-56 rounded-xl border border-white/15 bg-slate-950/95 p-3 text-[11px] text-white/80 shadow-xl group-hover:block">
                            {field.helper}
                          </span>
                        </span>
                      ) : null}
                    </div>
                    {field.type === "select" ? (
                      <select
                        value={values[field.name] ?? ""}
                        onChange={(event) => handleChange(field.name, event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                      >
                        <option value="" disabled>
                          {field.placeholder ?? "Select an option"}
                        </option>
                        {field.options?.map((option) => (
                          <option key={option} value={option} className="text-slate-900">
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        value={values[field.name] ?? ""}
                        onChange={(event) => handleChange(field.name, event.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={values[field.name] ?? ""}
                        onChange={(event) => handleChange(field.name, event.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                      />
                    )}
                    {error ? (
                      <span className="flex items-center gap-2 text-xs text-rose-300">
                        <CircleAlert className="h-3.5 w-3.5" />
                        {error}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Result confidence</h3>
                  <p className="text-xs text-white/60">Adjust how deep the engine should go.</p>
                </div>
                <span className="text-sm text-aurora">{confidence}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={confidence}
                onChange={(event) => setConfidence(Number(event.target.value))}
                className="accent-cyan-400"
              />
              <div className="flex flex-wrap gap-3 text-xs text-white/70">
                {engine.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
              >
                <Stars className="h-4 w-4" />
                Generate results
              </button>
              <button
                type="button"
                onClick={() => setValues(defaultValues)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40"
              >
                Reset flow
              </button>
            </div>
          </motion.form>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <div className="rounded-3xl border border-white/10 bg-card-gradient p-6">
              <h3 className="text-fluid-lg font-semibold">Engine output preview</h3>
              <p className="mt-2 text-sm text-white/60">
                {engine.resultSummary}
              </p>
              <div className="mt-6 grid gap-4">
                {engine.resultHighlights.map((highlight) => (
                  <div
                    key={highlight.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                      {highlight.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold">{highlight.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/60">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  <Download className="mr-2 inline h-3.5 w-3.5 text-aurora" />
                  Smart exports
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  <Mic className="mr-2 inline h-3.5 w-3.5 text-rose-300" />
                  Voice-ready
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  <ChartLine className="mr-2 inline h-3.5 w-3.5 text-sky-300" />
                  Visual insights
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-result-gradient p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-fluid-lg font-semibold">Live insight chart</h3>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs">
                  Updated 5s ago
                </span>
              </div>
              <div className="mt-6 grid grid-cols-7 items-end gap-2">
                {initialChartData.map((value, index) => (
                  <motion.div
                    key={`${value}-${index}`}
                    className="relative flex h-32 items-end overflow-hidden rounded-xl bg-white/10"
                    initial={{ opacity: 0, scaleY: 0.6 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-cyan-400 via-indigo-400 to-fuchsia-400"
                      style={{ height: `${value}%` }}
                    />
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 text-xs text-white/70">
                <div className="flex items-center justify-between">
                  <span>Focus alignment</span>
                  <span>86%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Energy stability</span>
                  <span>72%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
                </div>
              </div>
            </div>
          </motion.aside>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-card-gradient p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-fluid-lg font-semibold">{engine.resultTitle}</h2>
              <p className="mt-2 text-sm text-white/60">{engine.resultSummary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleExport("pdf")}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-white transition hover:border-white/40"
              >
                <FileDown className="h-4 w-4 text-aurora" />
                Export PDF
              </button>
              <button
                type="button"
                onClick={() => handleExport("csv")}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-white transition hover:border-white/40"
              >
                <FileDown className="h-4 w-4 text-emerald-300" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {engine.resultHighlights.map((highlight) => (
              <motion.div
                key={highlight.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">{highlight.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{highlight.value}</p>
                <p className="mt-2 text-xs text-white/50">
                  Tap to explore deeper context and save the highlight.
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold">Interactive next steps</h3>
              <p className="mt-2 text-xs text-white/60">Build your ritual flow with quick actions.</p>
              <div className="mt-4 grid gap-3">
                {engine.nextSteps.map((step, index) => (
                  <button
                    key={step}
                    type="button"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm transition hover:border-cyan-300"
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs text-aurora">
                        {index + 1}
                      </span>
                      {step}
                    </span>
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold">Result status</h3>
              <p className="mt-2 text-xs text-white/60">
                {resultVisible ? "Your engine results are ready." : "Run the engine to unlock insights."}
              </p>
              <div className="mt-4 space-y-3 text-xs text-white/70">
                <div className="flex items-center justify-between">
                  <span>Engine status</span>
                  <span className={resultVisible ? "text-emerald-300" : "text-amber-300"}>
                    {resultVisible ? "Complete" : "Pending"}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
                    initial={{ width: 0 }}
                    animate={{ width: resultVisible ? "100%" : "40%" }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <CircleAlert className="h-4 w-4 text-amber-300" />
                  <span>Tip: Add voice notes to personalize the next run.</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
