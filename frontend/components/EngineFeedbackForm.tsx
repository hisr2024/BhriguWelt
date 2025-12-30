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
    <section className="glass-panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Feedback</p>
          <h3 className="text-xl font-semibold text-white">How did {engineTitle} perform?</h3>
        </div>
        <MessageSquare className="h-5 w-5 text-neon-cyan" />
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
                ? "border-neon-cyan bg-neon-cyan/20 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
            }`}
          >
            <Star className="h-4 w-4" />
            {value}
          </button>
        ))}
      </div>
      <label className="mt-4 flex flex-col gap-2 text-sm text-white/70">
        Share a quick note
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell us what felt great or what needs improvement"
          className="glass-input min-h-[110px] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
        />
      </label>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === "submitting"}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-pink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
