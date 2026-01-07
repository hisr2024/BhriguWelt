# Quick Start Guide - BhriguWelt Unified Predictions

## 🚀 Get Started in 5 Minutes

### 1. Start the Server

```bash
cd backend
python app.py
```

Server starts on `http://localhost:8000`

### 2. Test Basic Health

```bash
curl http://localhost:8000/api/predictions/health
```

Expected response:
```json
{
  "status": "healthy",
  "features": {
    "online_predictions": false,
    "offline_predictions": true,
    "hybrid_mode": false,
    "trilingual_support": true
  }
}
```

### 3. List Available Categories

```bash
curl http://localhost:8000/api/predictions/categories
```

You'll see 14+ categories including:
- karmic_journey
- past_lives
- future_lives
- present_life
- and more...

### 4. Generate Your First Prediction

```bash
curl -X POST http://localhost:8000/api/predictions/karmic-journey \
  -H "Content-Type: application/json" \
  -d '{
    "date_of_birth": "1990-08-15",
    "time_of_birth": "14:30",
    "place_of_birth": "Mumbai, India",
    "mode": "offline",
    "language": "en"
  }'
```

### 5. Try the Cosmic Blueprint

```bash
curl -X POST http://localhost:8000/api/predictions/cosmic-blueprint \
  -H "Content-Type: application/json" \
  -d '{
    "date_of_birth": "1990-08-15",
    "time_of_birth": "14:30",
    "place_of_birth": "Delhi, India",
    "mode": "offline"
  }'
```

## 📝 Common Use Cases

### Get Hindi Prediction
```bash
curl -X POST http://localhost:8000/api/predictions/past-lives \
  -H "Content-Type: application/json" \
  -d '{
    "date_of_birth": "1990-08-15",
    "time_of_birth": "14:30",
    "place_of_birth": "Varanasi, India",
    "language": "hi"
  }'
```

### Get Remedies
```bash
curl -X POST http://localhost:8000/api/predictions/karmic-remedies \
  -H "Content-Type: application/json" \
  -d '{
    "date_of_birth": "1990-08-15",
    "time_of_birth": "14:30",
    "place_of_birth": "Bangalore, India"
  }'
```

### Get Life Events Timeline
```bash
curl -X POST http://localhost:8000/api/predictions/life-events \
  -H "Content-Type: application/json" \
  -d '{
    "date_of_birth": "1990-08-15",
    "time_of_birth": "14:30",
    "place_of_birth": "Chennai, India"
  }'
```

## 🧪 Validate Installation

Run the validation test:
```bash
cd backend
python test_validation.py
```

Expected output:
```
🎉 All validation tests passed!
Total: 5/5 tests passed
```

## 🌐 Frontend Integration (Coming Soon)

The frontend integration with offline wisdom and mode switching is the next phase. The backend is fully ready and tested!

## ⚙️ Configuration

### Enable Online Mode (Optional)
Add to `.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
```

Then predictions will use hybrid mode (online with offline fallback).

### Without OpenAI
The system works perfectly in offline mode using authentic Bhrigu Samhita and Nadi Jyotisha wisdom!

## 📚 Full Documentation

See [UNIFIED_PREDICTIONS_README.md](./UNIFIED_PREDICTIONS_README.md) for complete documentation.

## ✅ What's Working

- ✅ 14 prediction categories
- ✅ Offline mode (100% guaranteed results)
- ✅ Hybrid mode with automatic fallback
- ✅ Trilingual support (en/hi/sa)
- ✅ Rule engine for planetary configurations
- ✅ Comprehensive wisdom database
- ✅ All tests passing

## 🔜 Next Steps

1. Frontend offline wisdom integration
2. Enhanced UI for category selection
3. Mode switcher in UI
4. More comprehensive tests

---

**Quick Links:**
- API Docs: [UNIFIED_PREDICTIONS_README.md](./UNIFIED_PREDICTIONS_README.md)
- Test: `python backend/test_validation.py`
- Health: `http://localhost:8000/api/predictions/health`
