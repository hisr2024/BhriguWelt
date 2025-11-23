import path from "path";
import { spawnSync } from "child_process";

import { NatalChart, AstrologyMetadata } from "@/types/natal";

type ParsedBirthDetails = {
  date: { year: number; month: number; day: number; label: string };
  time: { hour: number; minute: number; label: string };
};

type ValidatedBirthDetails = {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  parsed: ParsedBirthDetails;
};

function parseBirthDate(dateOfBirth: string) {
  const trimmed = dateOfBirth.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const reversedMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return { year: Number(year), month: Number(month), day: Number(day), label: `${year}-${month}-${day}` };
  }

  if (reversedMatch) {
    const [, day, month, year] = reversedMatch;
    return { year: Number(year), month: Number(month), day: Number(day), label: `${year}-${month}-${day}` };
  }

  throw new Error("Invalid date format. Use YYYY-MM-DD or DD-MM-YYYY.");
}

function parseBirthTime(timeOfBirth: string) {
  const trimmed = timeOfBirth.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    throw new Error("Invalid time format. Use HH:mm in 24h format.");
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    throw new Error("Birth time is out of range.");
  }

  return {
    hour,
    minute,
    label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
  };
}

function normalizeDateLabel(year: number, month: number, day: number) {
  const normalizedMonth = month.toString().padStart(2, "0");
  const normalizedDay = day.toString().padStart(2, "0");
  const normalizedYear = year.toString().padStart(4, "0");
  return `${normalizedYear}-${normalizedMonth}-${normalizedDay}`;
}

function buildMetadata(
  parsed: ParsedBirthDetails,
  placeOfBirth: string,
  timezone: string,
  normalizedDate: string,
  bharatTraditional: string
): AstrologyMetadata {
  return {
    name: "",
    date_of_birth: parsed.date.label,
    time_of_birth: parsed.time.label,
    place_of_birth: placeOfBirth.trim(),
    timezone,
    calendar: {
      gregorian: normalizedDate,
      bharat_traditional: bharatTraditional,
    },
  };
}

export function validateBirthDetails(input: {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
}): ValidatedBirthDetails {
  if (!input) {
    throw new Error("Birth details are required.");
  }

  const name = input.name?.trim();
  if (!name) {
    throw new Error("Name is required and cannot be empty.");
  }

  const placeOfBirth = input.placeOfBirth?.trim();
  if (!placeOfBirth) {
    throw new Error("Place of birth is required and cannot be empty.");
  }

  if (!input.dateOfBirth) {
    throw new Error("Date of birth is required.");
  }
  const parsedDate = parseBirthDate(input.dateOfBirth);
  const dateLabel = normalizeDateLabel(parsedDate.year, parsedDate.month, parsedDate.day);
  const parsedDateNormalized = { ...parsedDate, label: dateLabel };

  if (!input.timeOfBirth) {
    throw new Error("Time of birth is required.");
  }
  const parsedTime = parseBirthTime(input.timeOfBirth);

  return {
    name,
    placeOfBirth,
    dateOfBirth: dateLabel,
    timeOfBirth: parsedTime.label,
    parsed: {
      date: parsedDateNormalized,
      time: parsedTime,
    },
  };
}

/**
 * TODO: Replace placeholder calculations with real ephemeris-based math and time zone derivation.
 */
export async function generateNatalChart(input: {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
}): Promise<NatalChart> {
  const validated = validateBirthDetails(input);
  const { parsed } = validated;

  const chart = await runEphemerisPipeline({
    name: validated.name,
    dateOfBirth: parsed.date.label,
    timeOfBirth: parsed.time.label,
    placeOfBirth: validated.placeOfBirth,
  });

  chart.metadata = buildMetadata(
    parsed,
    validated.placeOfBirth,
    chart.metadata.timezone,
    chart.metadata.calendar.gregorian,
    chart.metadata.calendar.bharat_traditional
  );
  chart.metadata.name = validated.name;

  return chart;
}

function parseEphemerisOutput(output: string): NatalChart {
  const parsed = JSON.parse(output) as NatalChart;

  if (
    !parsed?.chart?.ascendant?.sign ||
    !parsed?.chart?.houses?.length ||
    !parsed?.chart?.planets?.length
  ) {
    throw new Error("Ephemeris output missing required chart details");
  }

  return parsed;
}

const PYTHON_EPHEMERIS_SCRIPT = String.raw`
import json
import math
import sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from bhriguwelt.astronomical_calculations import geocode_location, normalize_birth_datetime, has_swisseph
from bhriguwelt.calendar_conversion import convert_birth_details

ZODIAC_SIGNS = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]


def sign_name(longitude: float) -> str:
    return ZODIAC_SIGNS[int(math.floor((longitude % 360) / 30))]


def degree_in_sign(longitude: float) -> float:
    return (longitude % 30)


def house_from_longitude(longitude: float, cusps: list[float]) -> int:
    for idx, start in enumerate(cusps):
        end = cusps[(idx + 1) % 12]
        adjusted_longitude = longitude
        if end < start:
            end += 360
            if adjusted_longitude < start:
                adjusted_longitude += 360
        if start <= adjusted_longitude < end:
            return idx + 1
    return 1


def build_chart(payload: dict) -> dict:
    place = payload.get("placeOfBirth", "")
    birth_date = payload.get("dateOfBirth")
    birth_time = payload.get("timeOfBirth")

    latitude, longitude, tz_name = geocode_location(place)
    dt_utc = normalize_birth_datetime(birth_date, birth_time, timezone_name=tz_name)
    local_dt = dt_utc.astimezone(ZoneInfo(tz_name)) if tz_name else dt_utc
    offset_hours = (local_dt.utcoffset().total_seconds() / 3600.0) if local_dt.utcoffset() else 0.0
    tz_label = f"{tz_name} (UTC{offset_hours:+.1f})" if tz_name else "UTC (UTC+0)"
    ut_dt = dt_utc.astimezone(timezone.utc)

    bharat = convert_birth_details(birth_date, birth_time, place)
    bharat_label = " ".join(
        [
            f"{bharat.saka_date.day} {bharat.saka_date.month} {bharat.saka_date.year} Śaka",
            f"Tithi {bharat.tithi_number} ({bharat.tithi_name})",
            f"Nakshatra {bharat.nakshatra}",
            f"Yoga {bharat.yoga}",
            f"Karana {bharat.karana}",
            f"Weekday {bharat.weekday}",
        ]
    )

    if not has_swisseph():
        raise RuntimeError(
            "Swiss Ephemeris is required for natal chart calculations; please install pyswisseph."
        )

    import swisseph as swe

    swe.set_ephe_path(".")
    swe.set_topo(longitude or 0.0, latitude or 0.0, 0)
    jd = swe.julday(
        ut_dt.year,
        ut_dt.month,
        ut_dt.day,
        ut_dt.hour + ut_dt.minute / 60.0 + ut_dt.second / 3600.0,
        swe.GREG_CAL,
    )
    cusps_raw, ascmc = swe.houses_ex(jd, latitude or 0.0, longitude or 0.0, b"P")
    cusps = list(cusps_raw[:12])
    asc_longitude = float(ascmc[0])

    planet_codes = {
        "Sun": swe.SUN,
        "Moon": swe.MOON,
        "Mercury": swe.MERCURY,
        "Venus": swe.VENUS,
        "Mars": swe.MARS,
        "Jupiter": swe.JUPITER,
        "Saturn": swe.SATURN,
        "Rahu": swe.TRUE_NODE,
    }

    planetary_states: dict[str, tuple[float, float]] = {}
    for name, code in planet_codes.items():
        coords, _flags = swe.calc_ut(jd, code)
        longitude_value = float(coords[0])
        speed_long = float(coords[3]) if len(coords) > 3 else 0.0
        planetary_states[name] = (longitude_value, speed_long)
    rahu_longitude, rahu_speed = planetary_states.get("Rahu", (0.0, 0.0))
    planetary_states["Ketu"] = ((rahu_longitude + 180.0) % 360, -rahu_speed)

    ascendant = {
        "sign": sign_name(asc_longitude),
        "degree": round(degree_in_sign(asc_longitude), 2),
    }

    houses = [
        {
            "number": idx + 1,
            "sign": sign_name(value),
            "start_degree": round(value, 2),
        }
        for idx, value in enumerate(cusps)
    ]

    planets = []
    for name in ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]:
        longitude_value, speed = planetary_states.get(name, (0.0, 0.0))
        house_number = house_from_longitude(longitude_value, cusps)
        planets.append(
            {
                "name": name,
                "sign": sign_name(longitude_value),
                "house": house_number,
                "degree": round(degree_in_sign(longitude_value), 2),
                "retrograde": speed < 0,
            }
        )

    return {
        "metadata": {
            "name": payload.get("name", ""),
            "date_of_birth": birth_date,
            "time_of_birth": birth_time,
            "place_of_birth": place,
            "timezone": tz_label,
            "calendar": {
                "gregorian": ut_dt.isoformat(),
                "bharat_traditional": bharat_label,
            },
        },
        "chart": {
            "ascendant": ascendant,
            "houses": houses,
            "planets": planets,
        },
    }


def main():
    try:
        payload = json.loads(sys.stdin.read())
        chart = build_chart(payload)
        json.dump(chart, sys.stdout)
    except Exception as exc:  # pragma: no cover - executed in a subprocess
        sys.stderr.write(str(exc))
        sys.exit(1)


if __name__ == "__main__":
    main()
`;

async function runEphemerisPipeline(payload: {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
}): Promise<NatalChart> {
  const pythonPath = path.join(process.cwd(), "backend", "src");
  const result = spawnSync("python", ["-c", PYTHON_EPHEMERIS_SCRIPT], {
    input: JSON.stringify(payload),
    encoding: "utf-8",
    env: { ...process.env, PYTHONPATH: pythonPath },
  });

  if (result.error) {
    throw new Error(`Ephemeris execution failed: ${result.error.message}`);
  }

  if (result.status !== 0 || !result.stdout) {
    const reason = result.stderr?.toString()?.trim() || "Unknown ephemeris error";
    throw new Error(reason);
  }

  return parseEphemerisOutput(result.stdout.toString());
}
