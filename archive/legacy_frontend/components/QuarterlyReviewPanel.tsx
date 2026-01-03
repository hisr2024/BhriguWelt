'use client';

import { useEffect, useState } from "react";
import { fetchQuarterlyReviews } from "@/lib/api";
import { QuarterlyReview } from "@/types/feedback";
import { useImmersiveFeedback } from "@/lib/immersive";

export default function QuarterlyReviewPanel() {
  const [reviews, setReviews] = useState<QuarterlyReview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [liveNote, setLiveNote] = useState("");
  const [liveRating, setLiveRating] = useState("5");
  const [submitted, setSubmitted] = useState(false);
  const { triggerSubmitFeedback } = useImmersiveFeedback();

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchQuarterlyReviews();
        setReviews(response.quarters || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load quarterly feedback.";
        setError(message);
      }
    };
    load();
  }, []);

  return (
    <section className="card feedback-card" aria-live="polite">
      <header className="section-heading">
        <p className="eyebrow">Quarterly reviews</p>
        <h3>Accuracy council rollups</h3>
        <p className="muted">Track how seekers score the folios each quarter.</p>
      </header>
      <form
        className="feedback-inline"
        onSubmit={(event) => {
          event.preventDefault();
          triggerSubmitFeedback();
          const note = {
            seeker_name: "You",
            rating: Number(liveRating),
            notes: liveNote || "Quick pulse captured.",
            created_at: new Date().toISOString(),
          };
          setReviews((prev) =>
            prev.length
              ? prev.map((review, index) =>
                  index === 0
                    ? {
                        ...review,
                        submissions: review.submissions + 1,
                        recent_notes: [note, ...review.recent_notes].slice(0, 4),
                      }
                    : review,
                )
              : [
                  {
                    label: "This quarter",
                    average_rating: Number(liveRating),
                    promoters: 1,
                    submissions: 1,
                    recent_notes: [note],
                  },
                ],
          );
          setLiveNote("");
          setSubmitted(true);
        }}
      >
        <label className="sr-only" htmlFor="live-rating">
          Quick rating
        </label>
        <select
          id="live-rating"
          value={liveRating}
          onChange={(event) => setLiveRating(event.target.value)}
          aria-label="Quick rating"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>{`${value} / 5`}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="live-note">
          Quick note
        </label>
        <input
          id="live-note"
          value={liveNote}
          onChange={(event) => setLiveNote(event.target.value)}
          placeholder="Share what felt accurate or unclear"
        />
        <button type="submit" className="button-link small">
          Send feedback
        </button>
        {submitted && <span className="badge">Saved live</span>}
      </form>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div className="quarter-grid">
        {reviews.map((review) => (
          <article key={review.label} className="quarter-card">
            <div className="quarter-heading">
              <h4>{review.label}</h4>
              <span className="badge">{review.submissions} submissions</span>
            </div>
            <p className="muted">
              Avg accuracy {review.average_rating ?? "--"} · {review.promoters} strong approvals
            </p>
            {review.recent_notes.length > 0 ? (
              <ul className="note-list">
                {review.recent_notes.map((note, index) => (
                  <li key={`${note.created_at}-${index}`}>
                    <div className="note-meta">
                      <span className="pill">{note.rating}/5</span>
                      {note.seeker_name && <span className="muted">{note.seeker_name}</span>}
                      <span className="muted">{note.created_at}</span>
                    </div>
                    <p>{note.notes}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No notes captured for this quarter yet.</p>
            )}
          </article>
        ))}
        {!reviews.length && !error && <p className="muted">Collecting the first reviews...</p>}
      </div>
    </section>
  );
}
