# Nadi Jyotisha & Bhrigu Samhita Astrology System

An **offline-first** astrology system providing detailed birth chart analysis, horoscopes, matchmaking, and daily insights based solely on **Nadi Jyotisha** and **Bhrigu Samhita** traditions.

## 🌟 Key Features

- **100% Offline Operation**: All calculations performed locally using pyswisseph
- **Four Powerful Engines**:
  - 🔮 Birth Chart Engine
  - 📜 Horoscope Engine
  - 💑 Match Making Engine
  - 🌙 Daily Insights Engine
- **Deterministic Results**: Same input always produces identical output
- **Detailed Rule Tracing**: Every prediction includes rule IDs and citations
- **Vedic Traditions Only**: Strictly adheres to Nadi Jyotisha and Bhrigu Samhita principles

## 📋 Requirements

- Python 3.9+
- Swiss Ephemeris data files (included with pyswisseph)
- All dependencies in `requirements.txt`

## 🚀 Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

## 💻 Usage

### Command-Line Interface (CLI)

#### 1. Calculate Birth Chart

```bash
python -m app.cli chart --file tests/fixtures/person1_raj.json
```

#### 2. Generate Horoscope

```bash
python -m app.cli horoscope \
  --file tests/fixtures/person1_raj.json \
  --output outputs/horoscope_raj.txt
```

#### 3. Analyze Matchmaking Compatibility

```bash
python -m app.cli matchmaking \
  --partner-a tests/fixtures/person1_raj.json \
  --partner-b tests/fixtures/person2_priya.json \
  --output outputs/compatibility.txt
```

#### 4. Generate Daily Insights

```bash
python -m app.cli daily-insights \
  --file tests/fixtures/person1_raj.json \
  --date 2025-01-15 \
  --output outputs/daily_insights.txt
```

### REST API (FastAPI)

#### Start the server:

```bash
python -m app.api.main
# or
uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8000
```

#### API Endpoints:

- `POST /api/chart` - Calculate birth chart
- `POST /api/horoscope` - Generate horoscope
- `POST /api/matchmaking` - Analyze compatibility
- `POST /api/daily-insights` - Get daily insights

API documentation available at: `http://localhost:8000/docs`

### Birth Info JSON Format

```json
{
  "name": "Rajesh Kumar",
  "date_of_birth": "1985-07-15",
  "time_of_birth": "14:30:00",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "timezone": "Asia/Kolkata"
}
```

## 🧪 Testing

### Run All Tests

```bash
pytest tests/ -v
```

### Generate Golden Test Outputs

```bash
python scripts/generate_golden_outputs.py
```

## 📁 Project Structure

```
BhriguWelt/
├── core_wisdom/                 # Astrological knowledge base
│   ├── bhrigu_samhita_rules.md
│   ├── nadi_jyotisha_rules.md
│   ├── rule_index.json          # Structured rules with DSL triggers
│   └── glossary.md
├── app/
│   ├── domain/
│   │   └── models.py            # Pydantic data models
│   ├── services/
│   │   ├── ephemeris.py         # Swiss Ephemeris wrapper
│   │   ├── chart.py             # Chart calculation
│   │   ├── horoscope.py         # Horoscope generation
│   │   ├── matchmaking.py       # Compatibility analysis
│   │   └── daily_insights.py    # Transit-based insights
│   ├── rules/
│   │   ├── dsl.py               # DSL parser/evaluator
│   │   └── engine.py            # Rule matching engine
│   ├── api/
│   │   └── main.py              # FastAPI application
│   └── cli.py                   # Command-line interface
├── tests/
│   ├── fixtures/                # Test birth data (6 people)
│   ├── golden/generated/        # Golden test outputs
│   └── test_services.py         # Comprehensive tests
└── requirements.txt
```

## 🔍 How It Works

### Rule System DSL

The system uses a custom DSL for matching astrological patterns:

- `planet_in_house(planet, house)` - Check planet placement
- `planet_in_sign(planet, sign)` - Check planet sign
- `lord_of_house_in_house(source, target)` - House lord placement
- `nakshatra(planet) == nakshatra_name` - Nakshatra check
- `aspect(planet, target_house, type)` - Aspect relationships
- `conjunction(planet1, planet2, orb)` - Conjunction check

### Rule Structure

Each rule in `rule_index.json` contains rule_id, tradition, triggers, priority, narrative_template, and citations.

## 📄 License

MIT License - See LICENSE file.

---

**Note**: This system provides interpretive guidance based on Vedic traditions. Use for self-reflection and awareness, not absolute prediction.
