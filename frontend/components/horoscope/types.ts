import { NatalChart } from "@/types/natal";

export type FormState = {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
};

export type ChartResponse = NatalChart | Record<string, unknown>;

export type Interpretation = {
  english?: string;
  hindi?: string;
  raw?: string;
  summary?: string;
};

export type FormStatus = "idle" | "success";
