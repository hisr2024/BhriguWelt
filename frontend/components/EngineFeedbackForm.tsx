"use client";

import { useState } from "react";
import { MessageSquare, Star } from "lucide-react";

const ratings = [1, 2, 3, 4, 5];

type EngineFeedbackFormProps = {
  engineTitle: string;
};

export default function EngineFeedbackForm({ engineTitle }: EngineFeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!rating) {
      setError("Pick a star rating before sharing feedback.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 650));
      setStatus("success");
      setMessage("");
    } catch (submitError) {
      const messageText = submitError instanceof Error ? submitError.message : "Unable to save feedback right now.";
      setError(messageText);
      setStatus("error");
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Feedback</p>
          <h3 className="text-xl font-semibold text-white">How did {engineTitle} perform?</h3>
        </div>
        <MessageSquare className="h-5 w-5 text-indigo-300" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {ratings.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setRating(value);
              setStatus("idle");
              setError(null);
            }}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              rating === value
                ? "border-indigo-400 bg-indigo-500/20 text-white"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/30"
            }`}
          >
            <Star className="h-4 w-4" />
            {value}
          </button>
        ))}
      </div>
      <label className="mt-4 flex flex-col gap-2 text-sm text-slate-300">
        Share a quick note
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell us what felt great or what needs improvement"
          className="min-h-[110px] rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
        />
      </label>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === "submitting"}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/60"
      >
        {status === "submitting" ? "Submitting..." : "Submit feedback"}
      </button>
      <div className="mt-3 space-y-2 text-xs" aria-live="polite">
        {status === "success" && <p className="text-emerald-200">Feedback saved. Thank you for the insight!</p>}
        {error && <p className="text-rose-200">{error}</p>}
      </div>
    </section>
  );
}
