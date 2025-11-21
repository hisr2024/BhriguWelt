"""Gregorian to Hindu (Śaka) calendar conversion utilities."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timezone
from typing import Dict, List

from zoneinfo import ZoneInfo

from .astronomical_calculations import has_swisseph

_SAKA_MONTHS = [
    "Chaitra",
    "Vaisakha",
    "Jyaishtha",
    "Ashadha",
    "Shravana",
    "Bhadra",
    "Ashwin",
    "Kartika",
    "Agrahayana",
    "Pausha",
    "Magha",
    "Phalguna",
]

_NAKSHATRAS = [
    "Ashwini",
    "Bharani",
    "Krittika",
    "Rohini",
    "Mrigashirsha",
    "Ardra",
    "Punarvasu",
    "Pushya",
    "Ashlesha",
    "Magha",
    "Purva Phalguni",
    "Uttara Phalguni",
    "Hasta",
    "Chitra",
    "Swati",
    "Vishakha",
    "Anuradha",
    "Jyeshtha",
    "Mula",
    "Purva Ashadha",
    "Uttara Ashadha",
    "Shravana",
    "Dhanishta",
    "Shatabhisha",
    "Purva Bhadrapada",
    "Uttara Bhadrapada",
    "Revati",
]

_YOGAS = [
    "Vishkumbha",
    "Preeti",
    "Ayushman",
    "Saubhagya",
    "Shobhana",
    "Atiganda",
    "Sukarma",
    "Dhriti",
    "Shoola",
    "Ganda",
    "Vriddhi",
    "Dhruva",
    "Vyaghata",
    "Harshana",
    "Vajra",
    "Siddhi",
    "Vyatipata",
    "Variyana",
    "Parigha",
    "Shiva",
    "Siddha",
    "Sadhya",
    "Shubha",
    "Shukla",
    "Brahma",
    "Indra",
    "Vaidhriti",
]

_TITHI_NAMES = [
    "Pratipada",
    "Dwitiya",
    "Tritiya",
    "Chaturthi",
    "Panchami",
    "Shashthi",
    "Saptami",
    "Ashtami",
    "Navami",
    "Dashami",
    "Ekadashi",
    "Dwadashi",
    "Trayodashi",
    "Chaturdashi",
    "Purnima",
    "Pratipada",
    "Dwitiya",
    "Tritiya",
    "Chaturthi",
    "Panchami",
    "Shashthi",
    "Saptami",
    "Ashtami",
    "Navami",
    "Dashami",
    "Ekadashi",
    "Dwadashi",
    "Trayodashi",
    "Chaturdashi",
    "Amavasya",
]

_KARANA_CYCLE = [
    "Kimstughna",
    "Bava",
    "Balava",
    "Kaulava",
    "Taitila",
    "Garaja",
    "Vanija",
    "Vishti",
]

_KARANA_SEQUENCE = [
    _KARANA_CYCLE[0],
    *_KARANA_CYCLE[1:] * 8,
    "Shakuni",
    "Chatushpada",
    "Naga",
]

_KARANAS = list(dict.fromkeys(_KARANA_SEQUENCE))

_IST_REFERENCE_LONGITUDE = 82.5  # Allahabad Observatory meridian adopted in IST
_AUTHENTIC_SOURCES = [
    "Government of India Calendar Reform Committee Report (1955)",
    "Surya Siddhanta translation by Bapu Deva Sastri (Calcutta, 1860)",
]


@dataclass(frozen=True)
class SakaDate:
    """Representation of the national Śaka calendar date."""

    year: int
    month: str
    month_index: int
    day: int
    leap_year: bool


@dataclass(frozen=True)
class HinduCalendarContext:
    """Contextual Hindu calendar data tied to a birth record."""

    birth_date: date
    birth_time: time
    birth_place: str
    saka_date: SakaDate
    conversion_factor_years: int
    ist_reference_longitude: float
    sources: List[str]
    nakshatra: str
    nakshatra_index: int
    yoga: str
    yoga_index: int
    karana: str
    karana_index: int
    tithi_name: str
    tithi_number: int
    weekday: str

    def as_payload(self) -> Dict[str, object]:
        return {
            "birth_date": self.birth_date.isoformat(),
            "birth_time": self.birth_time.isoformat(timespec="minutes"),
            "birth_place": self.birth_place,
            "saka_date": {
                "year": self.saka_date.year,
                "month": self.saka_date.month,
                "month_index": self.saka_date.month_index,
                "day": self.saka_date.day,
                "leap_year": self.saka_date.leap_year,
            },
            "conversion_factor_years": self.conversion_factor_years,
            "ist_reference_longitude": self.ist_reference_longitude,
            "sources": list(self.sources),
            "nakshatra": self.nakshatra,
            "nakshatra_index": self.nakshatra_index,
            "yoga": self.yoga,
            "yoga_index": self.yoga_index,
            "karana": self.karana,
            "karana_index": self.karana_index,
            "tithi_name": self.tithi_name,
            "tithi_number": self.tithi_number,
            "weekday": self.weekday,
        }


def convert_birth_details(birth_date: str, birth_time: str, birth_place: str) -> HinduCalendarContext:
    """Parse ISO strings and convert a Gregorian record into Śaka metrics."""

    parsed_date = datetime.fromisoformat(birth_date).date()
    parsed_time = time.fromisoformat(birth_time)
    saka_date = _gregorian_to_saka(parsed_date)
    conversion_factor = parsed_date.year - saka_date.year
    panchang = _derive_panchang(parsed_date, parsed_time)
    return HinduCalendarContext(
        birth_date=parsed_date,
        birth_time=parsed_time,
        birth_place=birth_place,
        saka_date=saka_date,
        conversion_factor_years=conversion_factor,
        ist_reference_longitude=_IST_REFERENCE_LONGITUDE,
        sources=_AUTHENTIC_SOURCES,
        nakshatra=panchang["nakshatra"],
        nakshatra_index=panchang["nakshatra_index"],
        yoga=panchang["yoga"],
        yoga_index=panchang["yoga_index"],
        karana=panchang["karana"],
        karana_index=panchang["karana_index"],
        tithi_name=panchang["tithi_name"],
        tithi_number=panchang["tithi_number"],
        weekday=panchang["weekday"],
    )


def _gregorian_to_saka(gregorian_date: date) -> SakaDate:
    leap_year_for_start = _is_gregorian_leap(gregorian_date.year)
    saka_start = date(gregorian_date.year, 3, 21 if leap_year_for_start else 22)

    if gregorian_date < saka_start:
        reference_year = gregorian_date.year - 1
        leap_year_for_start = _is_gregorian_leap(reference_year)
        saka_start = date(reference_year, 3, 21 if leap_year_for_start else 22)
        saka_year = gregorian_date.year - 79
    else:
        reference_year = gregorian_date.year
        saka_year = gregorian_date.year - 78

    day_index = (gregorian_date - saka_start).days
    month_lengths = _saka_month_lengths(leap_year_for_start)
    for idx, month_length in enumerate(month_lengths):
        if day_index < month_length:
            return SakaDate(
                year=saka_year,
                month=_SAKA_MONTHS[idx],
                month_index=idx + 1,
                day=day_index + 1,
                leap_year=leap_year_for_start,
            )
        day_index -= month_length

    raise ValueError("Gregorian date outside supported Śaka calendar range")


def _cyclic_value(seed: int, modulus: int) -> int:
    return (seed % modulus) + 1


def _tithi_label(index: int) -> str:
    phase = "Shukla" if index <= 15 else "Krishna"
    name = _TITHI_NAMES[index - 1]
    return f"{phase} {name}"


def _karana_name(index: int) -> str:
    capped_index = min(index, len(_KARANA_SEQUENCE))
    return _KARANA_SEQUENCE[capped_index - 1]


def _ist_datetime(gregorian_date: date, gregorian_time: time) -> datetime:
    ist_tz = ZoneInfo("Asia/Kolkata")
    naive = datetime.combine(gregorian_date, gregorian_time)
    return naive.replace(tzinfo=ist_tz)


def _derive_panchang(gregorian_date: date, gregorian_time: time) -> Dict[str, object]:
    dt = _ist_datetime(gregorian_date, gregorian_time)
    weekday = dt.strftime("%A")

    if has_swisseph():
        panchang = _swisseph_panchang(dt)
    else:
        panchang = _fallback_panchang(dt)

    return {**panchang, "weekday": weekday}


def _swisseph_panchang(dt: datetime) -> Dict[str, object]:  # pragma: no cover - optional dependency
    import swisseph as swe  # type: ignore

    ut_dt = dt.astimezone(timezone.utc)
    swe.set_ephe_path(".")

    julian_day = swe.julday(
        ut_dt.year,
        ut_dt.month,
        ut_dt.day,
        ut_dt.hour + ut_dt.minute / 60.0 + ut_dt.second / 3600.0,
    )
    sun_longitude = swe.calc_ut(julian_day, swe.SUN)[0][0]
    moon_longitude = swe.calc_ut(julian_day, swe.MOON)[0][0]
    angle_difference = (moon_longitude - sun_longitude) % 360.0

    tithi_number = int(angle_difference // 12) + 1
    nakshatra_index = int((moon_longitude % 360) // (360 / len(_NAKSHATRAS))) + 1
    yoga_index = int(((sun_longitude + moon_longitude) % 360) // (360 / len(_YOGAS))) + 1
    karana_index = int(angle_difference // 6) + 1

    return {
        "tithi_number": tithi_number,
        "tithi_name": _tithi_label(tithi_number),
        "nakshatra_index": nakshatra_index,
        "nakshatra": _NAKSHATRAS[nakshatra_index - 1],
        "yoga_index": yoga_index,
        "yoga": _YOGAS[yoga_index - 1],
        "karana_index": karana_index,
        "karana": _karana_name(karana_index),
    }


def _fallback_panchang(dt: datetime) -> Dict[str, object]:
    ordinal_hash = abs(hash((dt.date().toordinal(), dt.hour, dt.minute)))
    tithi_number = _cyclic_value(ordinal_hash, 30)
    nakshatra_index = _cyclic_value(ordinal_hash, len(_NAKSHATRAS))
    yoga_index = _cyclic_value(ordinal_hash, len(_YOGAS))
    karana_index = _cyclic_value(ordinal_hash, len(_KARANA_SEQUENCE))

    return {
        "tithi_number": tithi_number,
        "tithi_name": _tithi_label(tithi_number),
        "nakshatra_index": nakshatra_index,
        "nakshatra": _NAKSHATRAS[nakshatra_index - 1],
        "yoga_index": yoga_index,
        "yoga": _YOGAS[yoga_index - 1],
        "karana_index": karana_index,
        "karana": _karana_name(karana_index),
    }


def _is_gregorian_leap(year: int) -> bool:
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


def _saka_month_lengths(leap_year: bool) -> List[int]:
    chaitra_length = 31 if leap_year else 30
    return [
        chaitra_length,
        31,
        31,
        31,
        31,
        31,
        30,
        30,
        30,
        30,
        30,
        30,
    ]


__all__ = ["SakaDate", "HinduCalendarContext", "convert_birth_details"]
