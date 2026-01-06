# BhriguWelt Setup Instructions

## Critical Fixes Applied

### 1. ✅ Name Field Issue - FIXED
- Added name field as the first step in profile creation form
- Form now has 4 steps: Name → Date of Birth → Time of Birth → Place of Birth
- Name is properly saved to profile instead of using place_of_birth as a fallback

### 2. ✅ Profile Loading Error - FIXED
- Fixed `Cannot read properties of undefined (reading 'toString')` error
- Updated storage.ts to include IndexedDB ID in decrypted profile objects
- Profile IDs are now properly available in all components

## Remaining Setup Required

### Backend Configuration

The AI features (chatbot, predictions, interpretations) require the backend to be running with OpenAI API configured.

1. **Create Backend Environment File**

```bash
cd backend
cp .env.example .env
```

2. **Configure OpenAI API Key in backend/.env**

```env
# OpenAI API Configuration (REQUIRED for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4

# Enable AI Features
AI_FEATURES_ENABLED=true

# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production

# Database
DATABASE_URL=sqlite:///bhriguwelt.db

# CORS Settings (for local development)
FRONTEND_URL=http://localhost:3000

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

3. **Install Backend Dependencies**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. **Start Backend Server**

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

The backend should now be running on http://localhost:8000

### Frontend Configuration

1. **Create Frontend Environment File**

```bash
cd frontend
cp .env.example .env.local
```

2. **Configure API URL in frontend/.env.local**

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# App Configuration
NEXT_PUBLIC_APP_NAME=BhriguWelt
NEXT_PUBLIC_APP_DESCRIPTION=Discover Your Soul's Journey Through Vedic Astrology
```

3. **Install Frontend Dependencies**

```bash
cd frontend
npm install
```

4. **Start Frontend Development Server**

```bash
cd frontend
npm run dev
```

The frontend should now be running on http://localhost:3000

## Testing the Fixes

### 1. Test Name Field
1. Navigate to http://localhost:3000/get-started
2. Verify you see 4 steps: Name, Date of Birth, Time of Birth, Place of Birth
3. Enter all information and submit
4. Go to Profile page and verify your name is displayed correctly

### 2. Test Profile Loading
1. Create a profile through get-started
2. Navigate to /profile page
3. Verify no console errors about "Cannot read properties of undefined"
4. Verify profile name, date, time, and place are all displayed

### 3. Test AI Chatbot (requires OpenAI API key)
1. Ensure backend is running with valid OPENAI_API_KEY
2. Navigate to /ai-chat
3. Ask a question about your birth chart
4. Verify you receive an AI-generated response (not "I encountered an error")

### 4. Test Predictions (requires OpenAI API key)
1. Navigate to /bhrigu-predictions
2. Click on any category (e.g., "Karmic Journey")
3. Verify predictions are generated (not showing errors)
4. Check that category-specific detailed analysis is displayed

### 5. Test Birth Chart Interpretations
1. Navigate to /birth-chart
2. Click on "Interpretation" tab
3. Verify interpretations are displayed for Sun, Moon, Ascendant, and Overall

## Current Status

### ✅ Fixed
- Name field missing in profile form
- Profile ID undefined error
- Profile save using wrong field for name
- Storage not returning IDs with decrypted data

### ⚠️ Requires Configuration
- OpenAI API key for AI features
- Backend server to be started
- Frontend environment variables
- Dependencies to be installed

### 📝 Notes
- The application uses encrypted local storage (IndexedDB) for all user data
- A passcode is required on first use to set up encryption
- All AI features require a valid OpenAI API key in the backend
- Predictions are cached locally for offline access
- The app is a Progressive Web App (PWA) and works offline after initial data is cached

## Troubleshooting

### "Cannot read properties of undefined (reading 'toString')"
This has been fixed in the latest commit. If you still see this:
1. Clear browser cache and IndexedDB
2. Delete existing profiles and recreate them with the updated form

### "AI encountered an error" in chatbot
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Verify OPENAI_API_KEY is set in backend/.env
3. Check backend logs for API key errors

### Predictions not working
1. Ensure backend is running and accessible
2. Check browser console for API errors
3. Verify NEXT_PUBLIC_API_URL in frontend/.env.local points to backend

### No interpretations in Birth Chart
1. This is expected if backend is not running - mock data is shown
2. Start backend with OpenAI configured for AI-generated interpretations

## Getting OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Create a new API key
4. Copy the key and add it to `backend/.env` as `OPENAI_API_KEY=sk-...`
5. Note: OpenAI API usage is paid - monitor your usage at https://platform.openai.com/usage

## Next Steps

After completing the setup above:
1. Test all features thoroughly
2. If everything works, the application is ready for production deployment
3. For production: Update environment variables with production URLs and secure keys
4. Enable HTTPS for production deployment
5. Configure proper CORS settings for your production domain
