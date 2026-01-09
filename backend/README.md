# BhriguWelt Backend API

Comprehensive Vedic astrology API with OpenAI integration.

## Features

- ✨ Complete birth chart calculations
- 🔮 AI-powered predictions (OpenAI)
- 🌟 Karmic Journey analysis
- 🔄 Past Lives regression
- 🚀 Future Lives prediction
- 💫 Present Life guidance
- 📅 Life Events forecasting
- 🛡️ Karmic Remedies recommendations
- 📊 Daily/Weekly/Monthly/Yearly horoscopes

## Quick Start

### Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run the server:
   ```bash
   python app.py
   ```

4. Test the API:
   ```bash
   curl http://localhost:8000/health
   ```

### Production Deployment (Render)

See `DEPLOYMENT_GUIDE.md` for complete instructions.

## API Endpoints

### Health Check
- `GET /` - API status
- `GET /health` - Detailed health check

### Astrology
- `POST /api/astrology/birth-chart`
- `POST /api/astrology/zodiac-analysis`
- `POST /api/astrology/planetary-positions`
- `POST /api/astrology/compatibility`

### Karmic Journey
- `POST /api/karmic-journey/analysis`
- `POST /api/karmic-journey/soul-purpose`
- `POST /api/karmic-journey/karmic-lessons`
- `POST /api/karmic-journey/soul-evolution`
- `POST /api/karmic-journey/dharmic-path`

(See DEPLOYMENT_GUIDE.md for complete endpoint list)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `PROMPT_TOKEN_LIMIT` | No | Maximum tokens allocated to the prompt (context trimming) |
| `RESPONSE_TOKEN_LIMIT` | No | Maximum tokens allowed in the model response |
| `SECRET_KEY` | Yes | Flask secret key |
| `JWT_SECRET_KEY` | Yes | JWT signing key |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |
| `FLASK_ENV` | No | Environment (development/production) |
| `SECTION_PARSER_MIN_LENGTH` | No | Minimum characters required for a parsed section (default: `100`) |
| `SECTION_PARSER_HEADER_MIN_LENGTH` | No | Minimum characters required for header-based extraction (default: `50`) |
| `SECTION_PARSER_KEYWORD_MATCH_RATIO` | No | Keyword match ratio for partial matches (default: `0.5`) |

## Testing

```bash
# Test birth chart
curl -X POST http://localhost:8000/api/astrology/birth-chart \
  -H "Content-Type: application/json" \
  -d '{
    "date_of_birth": "1990-01-15",
    "time_of_birth": "14:30",
    "place_of_birth": "New Delhi, India"
  }'
```

## Architecture

```
backend/
├── app.py                  # Main application
├── requirements.txt        # Python dependencies
├── routes/                 # API route handlers
│   ├── astrology_routes.py
│   ├── karmic_journey_routes.py
│   ├── past_lives_routes.py
│   ├── future_lives_routes.py
│   ├── present_life_routes.py
│   ├── life_events_routes.py
│   ├── karmic_remedies_routes.py
│   ├── predictions_routes.py
│   └── user_routes.py
└── services/               # Business logic
    ├── astrology_calculator.py
    └── openai_service.py
```

## License

MIT License - See LICENSE file
