# BhriguWelt Deployment Guide

Complete guide to deploying the full-stack astrology application to Vercel (Frontend) and Render (Backend).

## 🎯 Overview

- **Frontend**: Next.js 14 + React + TypeScript → Vercel
- **Backend**: Flask + Python 3.11 → Render
- **AI Integration**: OpenAI API
- **Features**: Karmic Journey, Past Lives, Future Lives, Present Life Analysis, Life Events, Karmic Remedies

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. **OpenAI API Key** - Get from https://www.openai.com/
2. **GitHub Account** - For repository and deployments
3. **Vercel Account** - Sign up at https://vercel.com
4. **Render Account** - Sign up at https://render.com
5. **Node.js 22.11.0 + npm 10.9.2** - Required for frontend builds and Vercel deploys

---

## 🚀 Backend Deployment (Render)

### Step 1: Prepare Backend

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Verify files exist:
   - `app.py`
   - `requirements.txt`
   - `render.yaml`
   - `Procfile`
   - `runtime.txt`

### Step 2: Deploy to Render

1. Push code to GitHub (if not already):
   ```bash
   git add backend/
   git commit -m "Add production-ready backend"
   git push origin main
   ```

2. Go to [Render Dashboard](https://dashboard.render.com/)

3. Click **New +** → **Web Service**

4. Connect your GitHub repository

5. Configure the service:
   - **Name**: `bhriguwelt-api`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120`
   - **Plan**: Free (or Starter for better performance)

6. Set **Environment Variables**:
   ```
   FLASK_ENV=production
   SECRET_KEY=<generate-random-secret-key>
   JWT_SECRET_KEY=<generate-random-jwt-key>
   OPENAI_API_KEY=<your-openai-api-key>
   OPENAI_BASE_URL=https://api.openai.com/v1
   FRONTEND_URL=https://your-app.vercel.app
   ```

7. Click **Create Web Service**

8. Wait for deployment to complete (5-10 minutes)

9. Note your backend URL: `https://bhriguwelt-api.onrender.com`

### Step 3: Verify Backend

Test the API:
```bash
curl https://bhriguwelt-api.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-03T...",
  "services": {
    "api": "operational",
    "database": "operational",
    "openai": "operational"
  }
}
```

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Create `.env.local` file:
   ```bash
   NEXT_PUBLIC_API_URL=https://bhriguwelt-api.onrender.com
   NEXT_PUBLIC_APP_NAME=BhriguWelt
   NEXT_PUBLIC_APP_DESCRIPTION=Discover Your Soul's Journey Through Vedic Astrology
   ```

### Step 2: Deploy to Vercel

1. Install Vercel CLI (optional):
   ```bash
   npm install -g vercel
   ```

2. **Option A: Deploy via Vercel Dashboard**

   a. Go to [Vercel Dashboard](https://vercel.com/dashboard)

   b. Click **Add New** → **Project**

   c. Import your GitHub repository

   d. Configure:
      - **Framework Preset**: Next.js
      - **Root Directory**: `frontend`
      - **Build Command**: `npm run build`
      - **Output Directory**: `.next`

   e. Set **Environment Variables**:
      ```
      NEXT_PUBLIC_API_URL=https://bhriguwelt-api.onrender.com
      NEXT_PUBLIC_APP_NAME=BhriguWelt
      NEXT_PUBLIC_APP_DESCRIPTION=Discover Your Soul's Journey
      ```

   f. Click **Deploy**

3. **Option B: Deploy via CLI**
   ```bash
   cd frontend
   vercel
   # Follow prompts
   vercel --prod
   ```

4. Note your frontend URL: `https://bhriguwelt.vercel.app`

### Step 3: Update Backend CORS

Update the backend's `FRONTEND_URL` environment variable in Render:
```
FRONTEND_URL=https://bhriguwelt.vercel.app
```

Redeploy backend service.

---

## ✅ Testing Deployment

### Test Backend Endpoints

1. **Health Check**:
   ```bash
   curl https://bhriguwelt-api.onrender.com/health
   ```

2. **Birth Chart Calculation**:
   ```bash
   curl -X POST https://bhriguwelt-api.onrender.com/api/astrology/birth-chart \
     -H "Content-Type: application/json" \
     -d '{
       "date_of_birth": "1990-01-15",
       "time_of_birth": "14:30",
       "place_of_birth": "New Delhi, India"
     }'
   ```

3. **Karmic Journey**:
   ```bash
   curl -X POST https://bhriguwelt-api.onrender.com/api/karmic-journey/analysis \
     -H "Content-Type: application/json" \
     -d '{
       "date_of_birth": "1990-01-15",
       "time_of_birth": "14:30",
       "place_of_birth": "New Delhi, India"
     }'
   ```

### Test Frontend

1. Visit: `https://bhriguwelt.vercel.app`

2. Click **Get Started**

3. Enter birth details:
   - Date: `1990-01-15`
   - Time: `14:30`
   - Place: `New Delhi, India`

4. Verify chart calculation works

5. Test each feature:
   - Karmic Journey
   - Past Lives
   - Future Lives
   - Present Life
   - Life Events
   - Karmic Remedies

---

## 🔧 Configuration Details

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FLASK_ENV` | Environment mode | `production` |
| `SECRET_KEY` | Flask secret key | Random 32+ chars |
| `JWT_SECRET_KEY` | JWT signing key | Random 32+ chars |
| `OPENAI_API_KEY` | OpenAI API key | Your API key |
| `OPENAI_BASE_URL` | OpenAI endpoint | `https://api.openai.com/v1` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.vercel.app` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.onrender.com` |
| `NEXT_PUBLIC_APP_NAME` | App name | `BhriguWelt` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | App description | Your description |

---

## 📊 API Endpoints

### Astrology
- `POST /api/astrology/birth-chart` - Calculate birth chart
- `POST /api/astrology/zodiac-analysis` - Zodiac analysis
- `POST /api/astrology/planetary-positions` - Planetary positions
- `POST /api/astrology/compatibility` - Compatibility analysis

### Karmic Journey
- `POST /api/karmic-journey/analysis` - Full analysis
- `POST /api/karmic-journey/soul-purpose` - Soul purpose
- `POST /api/karmic-journey/karmic-lessons` - Karmic lessons
- `POST /api/karmic-journey/soul-evolution` - Soul evolution
- `POST /api/karmic-journey/dharmic-path` - Dharmic path

### Past Lives
- `POST /api/past-lives/analysis` - Full analysis
- `POST /api/past-lives/karmic-patterns` - Karmic patterns
- `POST /api/past-lives/past-relationships` - Past relationships
- `POST /api/past-lives/talents-carried-forward` - Talents
- `POST /api/past-lives/past-traumas` - Past traumas

### Future Lives
- `POST /api/future-lives/prediction` - Prediction
- `POST /api/future-lives/evolution-path` - Evolution path
- `POST /api/future-lives/moksha-timeline` - Moksha timeline
- `POST /api/future-lives/future-missions` - Future missions
- `POST /api/future-lives/soul-advancement` - Soul advancement

### Present Life
- `POST /api/present-life/comprehensive-analysis` - Full analysis
- `POST /api/present-life/career-guidance` - Career guidance
- `POST /api/present-life/relationships` - Relationships
- `POST /api/present-life/health-wellness` - Health & wellness
- `POST /api/present-life/financial-prospects` - Financial
- `POST /api/present-life/spiritual-growth` - Spiritual growth
- `POST /api/present-life/current-dasha` - Current dasha

### Life Events
- `POST /api/life-events/prediction` - Full prediction
- `POST /api/life-events/career-milestones` - Career milestones
- `POST /api/life-events/relationship-events` - Relationship events
- `POST /api/life-events/financial-events` - Financial events
- `POST /api/life-events/health-alerts` - Health alerts
- `POST /api/life-events/spiritual-breakthroughs` - Spiritual events
- `POST /api/life-events/auspicious-timings` - Auspicious times

### Karmic Remedies
- `POST /api/karmic-remedies/comprehensive` - Full remedies
- `POST /api/karmic-remedies/mantras` - Mantras
- `POST /api/karmic-remedies/gemstones` - Gemstones
- `POST /api/karmic-remedies/rituals` - Rituals
- `POST /api/karmic-remedies/charitable-acts` - Charitable acts
- `POST /api/karmic-remedies/lifestyle-modifications` - Lifestyle
- `POST /api/karmic-remedies/meditation-practices` - Meditation
- `POST /api/karmic-remedies/yantra-recommendations` - Yantras

### Predictions
- `POST /api/predictions/daily` - Daily horoscope
- `POST /api/predictions/weekly` - Weekly horoscope
- `POST /api/predictions/monthly` - Monthly horoscope
- `POST /api/predictions/yearly` - Yearly horoscope
- `POST /api/predictions/question` - Specific question

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: API returns 500 errors
- Check Render logs
- Verify environment variables are set
- Ensure OpenAI API key is valid

**Problem**: CORS errors
- Verify `FRONTEND_URL` is set correctly in backend
- Check frontend is using correct API URL

**Problem**: Slow responses
- Upgrade Render plan to Starter
- Check OpenAI rate limits

### Frontend Issues

**Problem**: Build fails on Vercel
- Check all dependencies in `package.json`
- Verify TypeScript errors locally: `npm run build`
- Check Node.js version compatibility

**Problem**: API calls fail
- Verify `NEXT_PUBLIC_API_URL` is set
- Check backend is deployed and healthy
- Open browser dev tools to see actual errors

**Problem**: Blank page
- Check browser console for errors
- Verify environment variables
- Test with `npm run dev` locally

---

## 🔒 Security Checklist

- [x] Change `SECRET_KEY` from default
- [x] Change `JWT_SECRET_KEY` from default
- [x] Use environment variables for secrets
- [x] Enable HTTPS (automatic on Vercel/Render)
- [x] Configure CORS properly
- [x] Rate limiting (add if needed)
- [x] Input validation on all endpoints

---

## 📈 Performance Optimization

### Backend
- Use Render Starter plan for better performance
- Enable Redis caching (optional)
- Optimize OpenAI calls
- Add request timeout handling

### Frontend
- Enable Next.js image optimization
- Implement code splitting
- Use React lazy loading
- Add loading states

---

## 🆘 Support

### Getting Help

1. **Documentation**: Check this guide first
2. **Backend Logs**: Render Dashboard → Logs
3. **Frontend Logs**: Vercel Dashboard → Deployments → Logs
4. **API Testing**: Use Postman or curl

### Common Solutions

**OpenAI API Not Working**:
- Verify API key is correct
- Check API quotas and limits
- Use fallback predictions if API fails

**Deployment Fails**:
- Check build logs carefully
- Verify all files are committed to git
- Ensure correct directory structure

---

## ✨ Features Implemented

✅ Complete Vedic astrology birth chart calculation
✅ AI-powered predictions via OpenAI integration
✅ Karmic Journey analysis
✅ Past Lives regression and analysis
✅ Future Lives prediction
✅ Present Life comprehensive analysis
✅ Important Life Events prediction
✅ Personalized Karmic Remedies
✅ Daily/Weekly/Monthly/Yearly predictions
✅ Beautiful cosmic-themed UI/UX
✅ Responsive design for all devices
✅ Production-ready deployment configuration

---

## 🎉 Success!

Your BhriguWelt application is now deployed and ready to serve users!

**Frontend**: https://bhriguwelt.vercel.app
**Backend**: https://bhriguwelt-api.onrender.com

May your application bring wisdom and guidance to all souls! 🙏

ॐ शान्तिः शान्तिः शान्तिः
