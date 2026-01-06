"""
Domain models for the Bhrigu-Nadi Astrology System.
All models use Pydantic v2 for validation and serialization.
"""

from datetime import datetime, date, time
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class PlaceOfBirth(BaseModel):
    """Geographic location and timezone information."""
    city: str = Field(..., min_length=1, description="City name")
    country: str = Field(..., min_length=1, description="Country name")
    lat: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    lon: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    tz: str = Field(..., description="IANA timezone string (e.g., 'Asia/Kolkata')")


class PersonInput(BaseModel):
    """Input data for a person's birth chart."""
    name: str = Field(..., min_length=1, description="Person's name")
    date_of_birth: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Date in YYYY-MM-DD format")
    time_of_birth: str = Field(..., pattern=r'^\d{2}:\d{2}$', description="Time in HH:MM 24-hour format")
    place_of_birth: PlaceOfBirth


class ZodiacSign(str, Enum):
    """Zodiac signs in sidereal order."""
    ARIES = "Aries"
    TAURUS = "Taurus"
    GEMINI = "Gemini"
    CANCER = "Cancer"
    LEO = "Leo"
    VIRGO = "Virgo"
    LIBRA = "Libra"
    SCORPIO = "Scorpio"
    SAGITTARIUS = "Sagittarius"
    CAPRICORN = "Capricorn"
    AQUARIUS = "Aquarius"
    PISCES = "Pisces"


class Nakshatra(str, Enum):
    """27 Nakshatras in order."""
    ASHWINI = "Ashwini"
    BHARANI = "Bharani"
    KRITTIKA = "Krittika"
    ROHINI = "Rohini"
    MRIGASHIRA = "Mrigashira"
    ARDRA = "Ardra"
    PUNARVASU = "Punarvasu"
    PUSHYA = "Pushya"
    ASHLESHA = "Ashlesha"
    MAGHA = "Magha"
    PURVA_PHALGUNI = "Purva Phalguni"
    UTTARA_PHALGUNI = "Uttara Phalguni"
    HASTA = "Hasta"
    CHITRA = "Chitra"
    SWATI = "Swati"
    VISHAKHA = "Vishakha"
    ANURADHA = "Anuradha"
    JYESHTHA = "Jyeshtha"
    MOOLA = "Moola"
    PURVA_ASHADHA = "Purva Ashadha"
    UTTARA_ASHADHA = "Uttara Ashadha"
    SHRAVANA = "Shravana"
    DHANISHTA = "Dhanishta"
    SHATABHISHA = "Shatabhisha"
    PURVA_BHADRAPADA = "Purva Bhadrapada"
    UTTARA_BHADRAPADA = "Uttara Bhadrapada"
    REVATI = "Revati"


class Planet(str, Enum):
    """Celestial bodies used in Vedic astrology."""
    SUN = "Sun"
    MOON = "Moon"
    MARS = "Mars"
    MERCURY = "Mercury"
    JUPITER = "Jupiter"
    VENUS = "Venus"
    SATURN = "Saturn"
    RAHU = "Rahu"
    KETU = "Ketu"


class PlanetPosition(BaseModel):
    """Detailed position of a planet."""
    planet: Planet
    longitude: float = Field(..., ge=0, lt=360, description="Absolute longitude in degrees")
    sign: ZodiacSign
    sign_longitude: float = Field(..., ge=0, lt=30, description="Longitude within the sign")
    house: int = Field(..., ge=1, le=12, description="House number")
    nakshatra: Nakshatra
    nakshatra_pada: int = Field(..., ge=1, le=4, description="Pada (quarter) within nakshatra")
    is_retrograde: bool = False


class HouseCusps(BaseModel):
    """House cusp positions (Placidus or similar system)."""
    cusps: List[float] = Field(..., min_length=12, max_length=12, description="12 house cusp longitudes")
    ascendant: float = Field(..., ge=0, lt=360, description="Ascendant degree")
    midheaven: float = Field(..., ge=0, lt=360, description="MC degree")

    @field_validator('cusps')
    @classmethod
    def validate_cusps(cls, v):
        if len(v) != 12:
            raise ValueError("Must have exactly 12 house cusps")
        return v


class NakshatraInfo(BaseModel):
    """Detailed nakshatra information for a point."""
    nakshatra: Nakshatra
    pada: int = Field(..., ge=1, le=4)
    lord: Planet
    longitude_in_nakshatra: float = Field(..., ge=0, lt=13.333333)


class DashaPeriod(BaseModel):
    """A single dasha or antardasha period."""
    planet: Planet
    level: Literal["mahadasha", "antardasha", "pratyantardasha"] = "mahadasha"
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    duration_years: float


class DashaTimeline(BaseModel):
    """Complete Vimshottari dasha timeline."""
    system: Literal["Vimshottari"] = "Vimshottari"
    start_planet: Planet
    birth_balance_years: float
    mahadashas: List[DashaPeriod]
    current_mahadasha: Optional[DashaPeriod] = None
    current_antardasha: Optional[DashaPeriod] = None


class TransitSnapshot(BaseModel):
    """Current planetary positions for transit analysis."""
    date: str  # YYYY-MM-DD
    planets: List[PlanetPosition]


class RuleTrace(BaseModel):
    """Trace of a matched rule with computed values."""
    rule_id: str
    tradition: Literal["bhrigu", "nadi", "combined"]
    priority: int
    domain: str
    matched_triggers: List[str]
    computed_facts: Dict[str, Any]
    rendered_narrative: str
    citations: List[str]


class Interpretation(BaseModel):
    """Structured interpretation with supporting data."""
    title: str
    summary: str
    details: str
    timing: Optional[str] = None
    rule_traces: List[RuleTrace] = Field(default_factory=list)


class ChartData(BaseModel):
    """Complete birth chart data."""
    person: PersonInput
    calculation_datetime_utc: str
    julian_day: float
    ayanamsa: float
    ayanamsa_name: str = "Lahiri"

    # Core positions
    ascendant: PlanetPosition
    planets: List[PlanetPosition]
    house_cusps: HouseCusps

    # Nakshatra details
    moon_nakshatra: NakshatraInfo
    ascendant_nakshatra: NakshatraInfo

    # Divisional charts
    d1_chart: Dict[str, Any] = Field(default_factory=dict, description="Rasi chart summary")
    d9_chart: Dict[str, Any] = Field(default_factory=dict, description="Navamsa chart summary")

    # Dasha
    dasha_timeline: DashaTimeline

    # House lordships
    house_lords: Dict[int, Planet] = Field(default_factory=dict)


class BirthChartOutput(BaseModel):
    """Output from Birth Chart Engine."""
    meta: Dict[str, Any]
    summary: List[str]
    chart_data: ChartData
    key_yogas: List[Interpretation]
    rule_traces: List[RuleTrace]
    disclaimers: List[str]


class DomainAnalysis(BaseModel):
    """Analysis of a specific life domain."""
    domain: str
    indicators: List[str]
    nadi_statements: List[str]
    bhrigu_themes: List[str]
    timing_windows: List[str]
    remedial_guidance: Optional[str] = None
    rule_traces: List[RuleTrace]


class HoroscopeOutput(BaseModel):
    """Output from Horoscope Engine."""
    meta: Dict[str, Any]
    summary: List[str]
    domains: Dict[str, DomainAnalysis]  # career, wealth, marriage, etc.
    rule_traces: List[RuleTrace]
    disclaimers: List[str]


class CompatibilityAnalysis(BaseModel):
    """Compatibility analysis for a couple."""
    compatibility_score: float = Field(..., ge=0, le=36, description="Ashtakuta score out of 36")
    kuta_breakdown: Dict[str, float]
    marriage_stability: str
    attraction_patterns: List[str]
    conflict_areas: List[str]
    dasha_synergy: List[str]
    children_indications: str
    mitigation_guidance: List[str]


class MatchMakingOutput(BaseModel):
    """Output from Match Making Engine."""
    meta: Dict[str, Any]
    partner_a_name: str
    partner_b_name: str
    summary: List[str]
    compatibility_overview: str
    compatibility_analysis: CompatibilityAnalysis
    timing_windows: List[str]
    rule_traces: List[RuleTrace]
    disclaimers: List[str]


class DailyInsight(BaseModel):
    """Insight for a specific day."""
    date: str  # YYYY-MM-DD
    overview: str
    do_list: List[str]
    dont_list: List[str]
    focus_areas: List[str]
    key_triggers: List[str]


class DailyInsightsOutput(BaseModel):
    """Output from Daily Insights Engine."""
    meta: Dict[str, Any]
    summary: List[str]
    today: DailyInsight
    next_7_days: List[DailyInsight]
    rule_traces: List[RuleTrace]
    disclaimers: List[str]


class MatchMakingInput(BaseModel):
    """Input for matchmaking analysis."""
    partner_a: PersonInput
    partner_b: PersonInput
