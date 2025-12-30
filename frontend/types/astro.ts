export interface BirthDetails {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  timezone?: string;
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

export interface CoreWisdomRemedy {
  id?: string;
  sutra_reference?: string;
  description?: string;
  interpretation?: string;
}

export interface CoreWisdomPayload {
  sections?: Record<string, string>;
  rashi_chart?: ChartHouse[];
  bhava_chart?: ChartHouse[];
  dashas?: DashaPeriod[];
  karmic_epoch?: string;
  remedies?: CoreWisdomRemedy[];
}

export interface CalendarDetails {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}

export interface SakaDatePayload {
  year?: number;
  month?: string;
  month_index?: number;
  day?: number;
  leap_year?: boolean;
}

export interface CalendarPayload {
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  interpretation?: string;
  interpretation_hi?: string;
  saka_date?: SakaDatePayload;
  conversion_factor_years?: number;
  ist_reference_longitude?: number;
  nakshatra?: string;
  yoga?: string;
  karana?: string;
  tithi_name?: string;
  weekday?: string;
  ephemeris_source?: string;
  sources?: string[];
}

export interface MatchmakingDetails {
  primary: BirthDetails;
  partner: BirthDetails;
  modernPreferences: string;
}

export type PredictionEngine = "horoscope" | "past-life" | "future";

export type ResultEngine = PredictionEngine | "matchmaking" | "calendar";
