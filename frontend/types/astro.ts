export interface BirthDetails {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  tradition?: string;
  lunarTithi: string;
  moonElement: string;
  marsHouse: string;
  saturnHouse: string;
  venusHouse: string;
  rahuAspectsAscendant: boolean;
  ketuHouse?: string;
  mercuryHouse?: string;
  jupiterHouse?: string;
  saturnRetrograde?: boolean;
}

export interface CalendarDetails {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}

export interface MatchmakingDetails {
  primary: BirthDetails;
  partner: BirthDetails;
  modernPreferences: string;
}

export type PredictionEngine = "horoscope" | "past-life" | "future";

export type ResultEngine = PredictionEngine | "matchmaking" | "calendar";
