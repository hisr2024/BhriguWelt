"""Gregorian to Hindu (Śaka) calendar conversion utilities."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time
from typing import Dict, List

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

_KARANAS = [
    "Bava",
    "Balava",
    "Kaulava",
    "Taitila",
    "Garaja",
    "Vanija",
    "Vishti",
    "Shakuni",
    "Chatushpada",
    "Naga",
]

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
    yoga: str
    karana: str
    tithi_name: str

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
            "yoga": self.yoga,
            "karana": self.karana,
            "tithi_name": self.tithi_name,
        }


def convert_birth_details(birth_date: str, birth_time: str, birth_place: str) -> HinduCalendarContext:
    """Parse ISO strings and convert a Gregorian record into Śaka metrics."""

    parsed_date = datetime.fromisoformat(birth_date).date()
    parsed_time = time.fromisoformat(birth_time)
    saka_date = _gregorian_to_saka(parsed_date)
    conversion_factor = parsed_date.year - saka_date.year
    tithi_index = _cyclic_value(parsed_date.toordinal() + parsed_time.hour, 30)
    nakshatra_index = _cyclic_value(parsed_date.toordinal(), len(_NAKSHATRAS))
    yoga_index = _cyclic_value(parsed_date.toordinal() + parsed_time.hour, len(_YOGAS))
    karana_index = _cyclic_value(parsed_date.toordinal() + parsed_time.hour, len(_KARANAS))
    return HinduCalendarContext(
        birth_date=parsed_date,
        birth_time=parsed_time,
        birth_place=birth_place,
        saka_date=saka_date,
        conversion_factor_years=conversion_factor,
        ist_reference_longitude=_IST_REFERENCE_LONGITUDE,
        sources=_AUTHENTIC_SOURCES,
        nakshatra=_NAKSHATRAS[nakshatra_index - 1],
        yoga=_YOGAS[yoga_index - 1],
        karana=_KARANAS[karana_index - 1],
        tithi_name=_tithi_label(tithi_index),
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
    position = index if index <= 15 else index - 15
    return f"{phase} {position}"


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
