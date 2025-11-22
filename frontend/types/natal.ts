export interface AstrologyMetadata {
  name: string;
  date_of_birth: string;
  time_of_birth: string;
  place_of_birth: string;
  timezone: string;
  calendar: {
    gregorian: string;
    bharat_traditional: string;
  };
}

export interface House {
  number: number;
  sign: string;
  start_degree: number;
}

export interface Planet {
  name: string;
  sign: string;
  house: number;
  degree: number;
  retrograde: boolean;
}

export interface NatalChart {
  metadata: AstrologyMetadata;
  chart: {
    ascendant: {
      sign: string;
      degree: number;
    };
    houses: House[];
    planets: Planet[];
  };
}
