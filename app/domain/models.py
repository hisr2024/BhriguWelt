"""
Domain models for the astrology system.
All data structures using Pydantic for validation.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional, Literal, Any
from datetime import datetime, date
from enum import Enum


class Planet(str, Enum):
    """Vedic astrology planets including lunar nodes."""
    SUN = "Sun"
    MOON = "Moon"
    MARS = "Mars"
    MERCURY = "Mercury"
    JUPITER = "Jupiter"
    VENUS = "Venus"
    SATURN = "Saturn"
    RAHU = "Rahu"  # North Node
    KETU = "Ketu"  # South Node


class Sign(str, Enum):
    """12 Zodiac signs (Rashis)."""
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
    """27 Nakshatras (Lunar mansions)."""
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
    MULA = "Mula"
    PURVA_ASHADHA = "Purva Ashadha"
    UTTARA_ASHADHA = "Uttara Ashadha"
    SHRAVANA = "Shravana"
    DHANISHTHA = "Dhanishtha"
    SHATABHISHA = "Shatabhisha"
    PURVA_BHADRAPADA = "Purva Bhadrapada"
    UTTARA_BHADRAPADA = "Uttara Bhadrapada"
    REVATI = "Revati"


class BirthInfo(BaseModel):
    """Birth information for chart calculation."""
    name: str = Field(..., min_length=1, description="Person's name")
    date_of_birth: date = Field(..., description="Date of birth")
    time_of_birth: str = Field(..., description="Time of birth in HH:MM:SS format")
    latitude: float = Field(..., ge=-90, le=90, description="Birth place latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Birth place longitude")
    timezone: str = Field(..., description="Timezone (e.g., 'Asia/Kolkata', 'America/New_York')")

    @field_validator('time_of_birth')
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        """Validate time format HH:MM:SS."""
        try:
            parts = v.split(':')
            if len(parts) != 3:
                raise ValueError
            hours, minutes, seconds = int(parts[0]), int(parts[1]), int(parts[2])
            if not (0 <= hours < 24 and 0 <= minutes < 60 and 0 <= seconds < 60):
                raise ValueError
        except (ValueError, AttributeError):
            raise ValueError('Time must be in HH:MM:SS format')
        return v


class PlanetPosition(BaseModel):
    """Position of a planet in the chart."""
    planet: Planet
    longitude: float = Field(..., description="Absolute longitude 0-360 degrees")
    sign: Sign
    degree_in_sign: float = Field(..., description="Degree within sign 0-30")
    nakshatra: Nakshatra
    nakshatra_pada: int = Field(..., ge=1, le=4, description="Pada (quarter) within nakshatra")
    house: int = Field(..., ge=1, le=12, description="House number")
    retrograde: bool = Field(default=False, description="Is planet retrograde")


class HouseCusp(BaseModel):
    """House cusp information."""
    house: int = Field(..., ge=1, le=12)
    longitude: float = Field(..., description="Cusp longitude 0-360 degrees")
    sign: Sign
    degree_in_sign: float


class Chart(BaseModel):
    """Complete birth chart."""
    birth_info: BirthInfo
    ascendant: Sign
    ascendant_longitude: float
    planets: List[PlanetPosition]
    house_cusps: List[HouseCusp]
    calculation_timestamp: datetime = Field(default_factory=datetime.utcnow)


class DashaPeriod(BaseModel):
    """Vimshottari Dasha period."""
    planet: Planet
    start_date: date
    end_date: date
    level: Literal["maha", "antar", "pratyantar"]
    parent_dasha: Optional[Planet] = None  # For bhukti, refers to Maha dasha


class DashaTimeline(BaseModel):
    """Complete Dasha timeline."""
    birth_date: date
    current_maha_dasha: DashaPeriod
    current_antar_dasha: DashaPeriod
    upcoming_maha_dashas: List[DashaPeriod]


class RuleTrigger(BaseModel):
    """Evaluated trigger from rule."""
    expression: str
    evaluated: bool
    context: Dict[str, Any] = Field(default_factory=dict)


class RuleTrace(BaseModel):
    """Trace of a matched rule."""
    rule_id: str
    tradition: Literal["bhrigu", "nadi"]
    domain: str
    matched_triggers: List[RuleTrigger]
    priority: int
    narrative: str
    citations: List[str]


class DomainAnalysis(BaseModel):
    """Analysis for a specific life domain."""
    domain: str
    summary: str
    detailed_narrative: str
    rule_traces: List[RuleTrace]
    timing_windows: Optional[List[str]] = None


class HoroscopeOutput(BaseModel):
    """Complete horoscope output."""
    meta: Dict[str, Any]
    chart_summary: Dict[str, Any]
    nakshatra_summary: Dict[str, Any]
    summary_bullets: List[str]
    domains: List[DomainAnalysis]
    dasha_timeline: Optional[DashaTimeline] = None
    disclaimers: List[str]


class MatchmakingInput(BaseModel):
    """Input for matchmaking analysis."""
    partner_a: BirthInfo
    partner_b: BirthInfo


class PartnerAnalysis(BaseModel):
    """Individual partner analysis in matchmaking."""
    name: str
    personality_summary: str
    key_traits: List[str]
    marriage_house_analysis: str
    venus_analysis: str


class SynastryRule(BaseModel):
    """Synastry rule for matchmaking."""
    rule_id: str
    description: str
    compatibility_score: int = Field(..., ge=0, le=100)
    narrative: str


class MatchmakingOutput(BaseModel):
    """Complete matchmaking output."""
    meta: Dict[str, Any]
    partner_a_analysis: PartnerAnalysis
    partner_b_analysis: PartnerAnalysis
    synastry_rules: List[SynastryRule]
    overall_compatibility: int = Field(..., ge=0, le=100)
    marriage_stability_indicators: List[str]
    timing_overlap_windows: List[str]
    cautions: List[str]
    mitigations: List[str]
    rule_traces: List[RuleTrace]
    disclaimers: List[str]


class TransitTrigger(BaseModel):
    """Transit event triggering insights."""
    transit_planet: Planet
    natal_point: str  # e.g., "natal Moon", "7th house cusp"
    aspect_type: str  # e.g., "conjunction", "opposition"
    orb_degrees: float
    narrative: str


class DailyInsight(BaseModel):
    """Insight for a specific date."""
    date: date
    focus_areas: List[str]
    do_list: List[str]
    dont_list: List[str]
    transit_triggers: List[TransitTrigger]
    energy_level: Literal["low", "medium", "high"]


class DailyInsightsOutput(BaseModel):
    """Complete daily insights output."""
    meta: Dict[str, Any]
    today: DailyInsight
    next_7_days: List[DailyInsight]
    key_transit_triggers: List[TransitTrigger]
    rule_traces: List[RuleTrace]
    disclaimers: List[str]


class ChartRequest(BaseModel):
    """Request for birth chart calculation."""
    birth_info: BirthInfo


class HoroscopeRequest(BaseModel):
    """Request for horoscope generation."""
    birth_info: BirthInfo


class MatchmakingRequest(BaseModel):
    """Request for matchmaking analysis."""
    partner_a: BirthInfo
    partner_b: BirthInfo


class DailyInsightsRequest(BaseModel):
    """Request for daily insights."""
    birth_info: BirthInfo
    target_date: Optional[date] = Field(default=None, description="Target date for insights (default: today)")
