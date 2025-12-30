import type { ElementType } from "react";

export type FilterState = {
  range: "7d" | "30d" | "90d";
  segment: "all" | "students" | "creators" | "seekers";
  region: "global" | "americas" | "emea" | "apac";
  engines: string[];
};

export type MetricCard = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  helper?: string;
  icon: ElementType;
};

export type InsightItem = {
  label: string;
  value: string;
  description: string;
  delta: string;
};

export type RealtimePulse = {
  activeUsers: number;
  sessions: number;
  sentiment: number;
  syncHealth: number;
};
