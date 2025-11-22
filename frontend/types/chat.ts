import { NatalChart } from "@/types/natal";

export interface BirthDetailsInput {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
}

export interface ChatContext {
  isMinor?: boolean;
  birthDetails?: BirthDetailsInput;
  lastChart?: NatalChart;
}
