# Bhrigu-Nadi Astrology System

A production-grade, **offline-first** astrology system that provides comprehensive analysis based exclusively on **Bhrigu Samhita** and **Nadi Jyotisha** principles.

## Features

### Four Fully-Functional Engines

1. **Birth Chart Engine** - Complete planetary positions, house cusps, nakshatras, D1 & D9 charts
2. **Horoscope Engine** - Detailed domain-wise analysis (Career, Wealth, Marriage, Health, etc.)
3. **Match Making Engine** - Compatibility analysis using Ashtakuta and Bhrigu principles
4. **Daily Insights Engine** - Transit-based predictions for today + 7-day forecast

### Core Principles

- **100% Offline** - No external API calls, all calculations done locally using Swiss Ephemeris
- **Deterministic** - Same inputs always produce identical outputs
- **Traditional** - Based exclusively on Nadi Jyotisha and Bhrigu Samhita traditions
- **Comprehensive** - 60+ rules with nakshatra-based precision

## System Architecture

```
BhriguWelt/
├── app/
│   ├── domain/          # Pydantic v2 models
│   ├── services/        # Core calculation services
│   │   ├── ephemeris.py # Swiss Ephemeris wrapper
│   │   ├── chart.py     # Chart calculation (D1, D9, nakshatras)
│   │   ├── dasha.py     # Vimshottari Dasha system
│   │   ├── horoscope.py # Domain-wise horoscope generation
│   │   ├── matchmaking.py # Compatibility analysis
│   │   └── daily_insights.py # Transit-based daily predictions
│   ├── rules/           # Rule engine and DSL
│   │   ├── dsl.py       # Domain-specific language evaluator
│   │   └── engine.py    # Rule matching and rendering
│   ├── api/             # FastAPI REST endpoints
│   └── cli.py           # Command-line interface
├── core_wisdom/         # Offline knowledge base
│   ├── bhrigu_samhita_rules.md
│   ├── nadi_jyotisha_rules.md
│   ├── rule_index.json  # 60+ structured rules
│   ├── glossary.md
│   └── examples/        # Annotated example charts
├── tests/
│   ├── unit/            # Comprehensive unit tests
│   ├── fixtures/        # Test input data
│   └── golden/          # Expected outputs
└── Makefile             # Build and test automation
```

## Installation

### Prerequisites

- Python 3.11 or higher
- Swiss Ephemeris data files (will be installed with pyswisseph)

### Setup

```bash
# Install dependencies
make install
# OR manually:
pip install -r requirements.txt
```

## Usage

### Command-Line Interface

#### 1. Generate Birth Chart

```bash
python -m app.cli chart --input tests/fixtures/person1.json
```

#### 2. Generate Comprehensive Horoscope

```bash
python -m app.cli horoscope --input tests/fixtures/person1.json --output horoscope.json
```

#### 3. Analyze Compatibility

```bash
python -m app.cli matchmaking \
  --partner-a tests/fixtures/person1.json \
  --partner-b tests/fixtures/person2.json \
  --output compatibility.json
```

#### 4. Daily Insights

```bash
python -m app.cli daily-insights --input tests/fixtures/person1.json
```

### REST API

Start the FastAPI server:

```bash
make run-api
# OR
uvicorn app.api.main:app --reload
```

API will be available at `http://localhost:8000`

#### Endpoints

- `POST /chart` - Generate birth chart
- `POST /horoscope` - Generate comprehensive horoscope
- `POST /matchmaking` - Analyze compatibility
- `POST /daily-insights` - Generate daily insights

### Input Format

```json
{
  "name": "Person Name",
  "date_of_birth": "YYYY-MM-DD",
  "time_of_birth": "HH:MM",
  "place_of_birth": {
    "city": "City Name",
    "country": "Country Name",
    "lat": 28.6139,
    "lon": 77.2090,
    "tz": "Asia/Kolkata"
  }
}
```

## Testing

```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# Generate sample outputs
make test-samples
```

## Documentation

- **Core Wisdom**: See `core_wisdom/` directory
- **API Docs**: Visit `http://localhost:8000/docs` when server is running
- **Examples**: See `core_wisdom/examples/`

## Version

Current Version: 1.0.0

Built with Python, FastAPI, Pydantic v2, and Swiss Ephemeris.
