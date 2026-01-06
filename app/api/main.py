"""
FastAPI application for astrology system.
Provides REST API endpoints for all engines.
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.domain.models import (
    ChartRequest, HoroscopeRequest, MatchmakingRequest,
    DailyInsightsRequest, Chart, HoroscopeOutput,
    MatchmakingOutput, DailyInsightsOutput
)
from app.services.chart import ChartService
from app.services.horoscope import HoroscopeService
from app.services.matchmaking import MatchmakingService
from app.services.daily_insights import DailyInsightsService
from datetime import date
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Nadi Jyotisha & Bhrigu Samhita Astrology System",
    description="Offline-first astrology system for birth charts, horoscopes, matchmaking, and daily insights",
    version="1.0.0"
)

# CORS middleware for web access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
chart_service = ChartService()
horoscope_service = HoroscopeService()
matchmaking_service = MatchmakingService()
daily_insights_service = DailyInsightsService()

# Refusal message for non-astrology queries
REFUSAL_MESSAGE = {
    "error": "Invalid Request",
    "message": "This system ONLY provides astrological analysis based on Nadi Jyotisha and Bhrigu Samhita traditions. "
               "Non-astrology queries are not supported. Please provide birth information for astrological consultation."
}


@app.middleware("http")
async def validate_astrology_only(request: Request, call_next):
    """Middleware to ensure only astrology requests are processed."""
    # Allow health check and docs
    if request.url.path in ["/", "/health", "/docs", "/openapi.json", "/redoc"]:
        return await call_next(request)

    # All other endpoints must be astrology-related (already enforced by endpoint structure)
    response = await call_next(request)
    return response


@app.get("/")
async def root():
    """Root endpoint with system information."""
    return {
        "system": "Nadi Jyotisha & Bhrigu Samhita Astrology System",
        "version": "1.0.0",
        "mode": "offline-first",
        "traditions": ["Nadi Jyotisha", "Bhrigu Samhita"],
        "engines": [
            {"name": "Birth Chart Engine", "endpoint": "/api/chart"},
            {"name": "Horoscope Engine", "endpoint": "/api/horoscope"},
            {"name": "Match Making Engine", "endpoint": "/api/matchmaking"},
            {"name": "Daily Insights Engine", "endpoint": "/api/daily-insights"}
        ],
        "note": "This system provides astrological analysis ONLY. Non-astrology queries will be refused."
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "chart_service": "operational",
            "horoscope_service": "operational",
            "matchmaking_service": "operational",
            "daily_insights_service": "operational"
        }
    }


@app.post("/api/chart", response_model=Chart)
async def calculate_chart(request: ChartRequest):
    """
    Calculate birth chart.

    Requires:
    - name
    - date_of_birth
    - time_of_birth (HH:MM:SS)
    - latitude
    - longitude
    - timezone

    Returns: Complete birth chart with planetary positions and house cusps.
    """
    try:
        logger.info(f"Calculating chart for {request.birth_info.name}")
        chart = chart_service.calculate_chart(request.birth_info)
        return chart
    except Exception as e:
        logger.error(f"Chart calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/horoscope", response_model=HoroscopeOutput)
async def generate_horoscope(request: HoroscopeRequest):
    """
    Generate complete horoscope.

    Requires:
    - name
    - date_of_birth
    - time_of_birth (HH:MM:SS)
    - latitude
    - longitude
    - timezone

    Returns: Comprehensive horoscope analysis with domain-wise predictions and rule traces.
    """
    try:
        logger.info(f"Generating horoscope for {request.birth_info.name}")
        horoscope = horoscope_service.generate_horoscope(request.birth_info)
        return horoscope
    except Exception as e:
        logger.error(f"Horoscope generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/matchmaking", response_model=MatchmakingOutput)
async def analyze_matchmaking(request: MatchmakingRequest):
    """
    Analyze marriage compatibility between two partners.

    Requires:
    - partner_a: Birth information of first partner
    - partner_b: Birth information of second partner

    Returns: Compatibility analysis with synastry rules, scores, and recommendations.
    """
    try:
        logger.info(
            f"Analyzing matchmaking for {request.partner_a.name} and {request.partner_b.name}"
        )
        compatibility = matchmaking_service.analyze_compatibility(
            request.partner_a,
            request.partner_b
        )
        return compatibility
    except Exception as e:
        logger.error(f"Matchmaking analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/daily-insights", response_model=DailyInsightsOutput)
async def generate_daily_insights(request: DailyInsightsRequest):
    """
    Generate daily insights based on transits.

    Requires:
    - birth_info: Birth information
    - target_date (optional): Date for insights (default: today)

    Returns: Daily insights with focus areas, do/don't lists, and transit triggers.
    """
    try:
        target_date = request.target_date if request.target_date else date.today()
        logger.info(
            f"Generating daily insights for {request.birth_info.name} on {target_date}"
        )
        insights = daily_insights_service.generate_daily_insights(
            request.birth_info,
            target_date
        )
        return insights
    except Exception as e:
        logger.error(f"Daily insights generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors with astrology-only message."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint Not Found",
            "message": "This is an astrology-only system. Available endpoints: /api/chart, /api/horoscope, "
                      "/api/matchmaking, /api/daily-insights"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
