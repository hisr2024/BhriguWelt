"""
FastAPI application for Bhrigu-Nadi Astrology System.
Provides REST API endpoints for all astrology engines.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.domain.models import (
    PersonInput, MatchMakingInput,
    BirthChartOutput, HoroscopeOutput, MatchMakingOutput, DailyInsightsOutput
)
from app.services.chart import ChartService
from app.services.horoscope import HoroscopeService
from app.services.matchmaking import MatchMakingService
from app.services.daily_insights import DailyInsightsService
from app.config import REFUSAL_MESSAGE, ENGINE_VERSION

# Initialize FastAPI app
app = FastAPI(
    title="Bhrigu-Nadi Astrology System",
    description="Offline-first astrology system based on Bhrigu Samhita and Nadi Jyotisha",
    version=ENGINE_VERSION
)

# CORS middleware (adjust origins as needed for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Bhrigu-Nadi Astrology System",
        "version": ENGINE_VERSION,
        "description": "Offline-first astrology system supporting ONLY Nadi Jyotisha & Bhrigu Samhita",
        "endpoints": [
            {"path": "/chart", "method": "POST", "description": "Generate birth chart"},
            {"path": "/horoscope", "method": "POST", "description": "Generate comprehensive horoscope"},
            {"path": "/matchmaking", "method": "POST", "description": "Analyze compatibility between two people"},
            {"path": "/daily-insights", "method": "POST", "description": "Generate daily insights and 7-day forecast"}
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": ENGINE_VERSION}


@app.post("/chart", response_model=BirthChartOutput)
async def generate_chart(person: PersonInput):
    """
    Generate birth chart for a person.

    Args:
        person: PersonInput with birth details

    Returns:
        BirthChartOutput with planetary positions, houses, and yogas
    """
    try:
        chart_service = ChartService()
        chart_data = chart_service.calculate_chart(person)

        # Create output with key yogas
        from app.rules.engine import RulesEngine
        rules_engine = RulesEngine()

        # Match rules for chart analysis
        rule_traces = rules_engine.match_rules(chart_data, min_priority=85)

        # Generate summary
        summary = [
            f"Birth chart calculated for {person.name}",
            f"Ascendant: {chart_data.ascendant.sign.value} at {chart_data.ascendant.sign_longitude:.2f}°",
            f"Moon: {chart_data.moon_nakshatra.nakshatra.value} nakshatra",
            f"Ayanamsa: {chart_data.ayanamsa:.4f}° (Lahiri)"
        ]

        # Extract key yogas from high-priority rules
        key_yogas = []
        for trace in rule_traces[:5]:  # Top 5
            from app.domain.models import Interpretation
            yoga = Interpretation(
                title=f"Rule {trace.rule_id}",
                summary=trace.rendered_narrative[:200],
                details=trace.rendered_narrative,
                rule_traces=[trace]
            )
            key_yogas.append(yoga)

        meta = {
            "engine_version": ENGINE_VERSION,
            "calculation_notes": f"Lahiri ayanamsa {chart_data.ayanamsa:.4f}°, JD {chart_data.julian_day:.4f}",
            "timestamp_utc": chart_data.calculation_datetime_utc
        }

        output = BirthChartOutput(
            meta=meta,
            summary=summary,
            chart_data=chart_data,
            key_yogas=key_yogas,
            rule_traces=rule_traces,
            disclaimers=["This is a Nadi Jyotisha & Bhrigu Samhita analysis only"]
        )

        chart_service.close()
        return output

    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chart calculation error: {str(e)}")


@app.post("/horoscope", response_model=HoroscopeOutput)
async def generate_horoscope(person: PersonInput):
    """
    Generate comprehensive horoscope with domain-wise analysis.

    Args:
        person: PersonInput with birth details

    Returns:
        HoroscopeOutput with detailed predictions across all life domains
    """
    try:
        horoscope_service = HoroscopeService()
        horoscope = horoscope_service.generate_horoscope(person)
        horoscope_service.close()
        return horoscope

    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Horoscope generation error: {str(e)}")


@app.post("/matchmaking", response_model=MatchMakingOutput)
async def analyze_matchmaking(input_data: MatchMakingInput):
    """
    Analyze compatibility between two people.

    Args:
        input_data: MatchMakingInput with both partners' details

    Returns:
        MatchMakingOutput with compatibility analysis and timing
    """
    try:
        matchmaking_service = MatchMakingService()
        result = matchmaking_service.analyze_compatibility(
            input_data.partner_a,
            input_data.partner_b
        )
        matchmaking_service.close()
        return result

    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matchmaking analysis error: {str(e)}")


@app.post("/daily-insights", response_model=DailyInsightsOutput)
async def generate_daily_insights(person: PersonInput):
    """
    Generate daily insights and 7-day forecast.

    Args:
        person: PersonInput with birth details

    Returns:
        DailyInsightsOutput with today's insights and weekly forecast
    """
    try:
        daily_service = DailyInsightsService()
        insights = daily_service.generate_daily_insights(person)
        daily_service.close()
        return insights

    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Daily insights error: {str(e)}")


@app.get("/refusal")
async def refusal_message():
    """
    Endpoint that demonstrates the system's scope limitation.
    Any non-astrology queries should receive this message.
    """
    return {"message": REFUSAL_MESSAGE}


# Exception handlers
@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    """Handle Pydantic validation errors."""
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
