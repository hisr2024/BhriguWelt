import { ResultEngine } from "@/types/astro";

export interface FeedbackRequest {
  engine: ResultEngine;
  rating: number;
  seekerName?: string;
  notes?: string;
  inputs?: Record<string, unknown>;
}

export interface FeedbackNote {
  seeker_name?: string;
  rating: number;
  notes: string;
  created_at: string;
}

export interface QuarterlyReview {
  label: string;
  average_rating: number | null;
  submissions: number;
  promoters: number;
  recent_notes: FeedbackNote[];
}

export interface QuarterlySummaryResponse {
  quarters: QuarterlyReview[];
}
