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

export interface ChartHouse {
  index: number;
  sign: string;
  focus?: string;
  occupants: string[];
  bhrigu_notes: string[];
}

export interface DashaPeriod {
  lord: string;
  start: string;
  end: string;
  anchor_rule: string;
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
