'use client';

import { FormEvent, useMemo, useState } from "react";
import { submitAccuracyFeedback } from "@/lib/api";
import { ResultEngine } from "@/types/astro";
import { useImmersiveFeedback } from "@/lib/immersive";

const ratingLabels: Record<number, string> = {
  1: "Way off",
  2: "Needs refinement",
  3: "Somewhat accurate",
  4: "On point",
  5: "Precise",
};

interface Props {
  engine: ResultEngine;
  seekerName?: string;
}

export default function FeedbackPrompt({ engine, seekerName }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const { triggerSubmitFeedback } = useImmersiveFeedback();

  const helper = useMemo(() => {
    if (!rating) return "Tell us how closely the guidance matched your reality.";
    return ratingLabels[rating];
  }, [rating]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rating) {
      setError("Please choose a rating to submit accuracy feedback.");
      return;
    }

    triggerSubmitFeedback();

    setStatus("submitting");
    setError(null);

    try {
      await submitAccuracyFeedback({ engine, rating, notes, seekerName });
      setStatus("success");
      setNotes("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to store feedback.";
      setError(message);
      setStatus("error");
    }
  };

  return (
    <section className="card feedback-card" aria-live="polite">
      <header className="section-heading">
        <p className="eyebrow">Rate accuracy</p>
        <h3>Help us strengthen Bhrigu clarity</h3>
        <p className="muted">{helper}</p>
      </header>
      <form onSubmit={handleSubmit} className="feedback-grid">
        <div className="rating-row" role="group" aria-label="Accuracy rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              type="button"
              key={value}
              className={`pill ${rating === value ? "pill-active" : ""}`.trim()}
              onClick={() => setRating(value)}
              aria-pressed={rating === value}
              aria-label={`${value} - ${ratingLabels[value]}`}
            >
              {value}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor={`${engine}-notes`}>
          Optional notes about accuracy
        </label>
        <textarea
          id={`${engine}-notes`}
          rows={3}
          value={notes}
          placeholder="Share details that help us tune the folios for seekers like you"
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="feedback-actions">
          <button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Saving..." : "Submit feedback"}
          </button>
          {status === "success" && <span className="success-chip">Saved for the next quarterly review</span>}
          {error && (
            <span className="error-chip" role="alert">
              {error}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
