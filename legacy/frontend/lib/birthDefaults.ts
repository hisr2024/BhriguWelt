import { BirthDetails } from "@/types/astro";

export const DEFAULT_BIRTH_DETAILS: BirthDetails = {
  name: "",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  timezone: "",
  tradition: "universal",
  lunarTithi: "5",
  moonElement: "water",
  marsHouse: "1",
  saturnHouse: "2",
  venusHouse: "3",
  rahuAspectsAscendant: false,
  ketuHouse: "12",
  mercuryHouse: "5",
  jupiterHouse: "5",
  saturnRetrograde: false,
};
