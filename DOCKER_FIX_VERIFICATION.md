# Docker Dependency Fix - Verification Guide

## Problem Fixed
**Issue:** `ModuleNotFoundError: No module named 'flask'`
**Root Cause:** Python packages were installed to `/root/.local` but the app runs as non-root user `appuser` who couldn't access them.

## Changes Made

### 1. Created `backend/Dockerfile`
- ✅ Multi-stage build for optimized image size
- ✅ Properly copies packages to `/home/appuser/.local` (accessible by appuser)
- ✅ Adds `/home/appuser/.local/bin` to PATH
- ✅ Configured for Render.com deployment (PORT 10000)

### 2. Fixed Root `Dockerfile`
- ✅ Updated package copy location to appuser's home
- ✅ Added PATH environment variable

### 3. Created `backend/.dockerignore`
- ✅ Optimizes build by excluding unnecessary files
- ✅ Reduces image size and build time

## Render.com Configuration

### Required Settings

**Service Settings:**
```
Service Type: Web Service
Environment: Docker
Branch: main (or your deployment branch)
```

**Build Settings:**
```
Dockerfile Path: backend/Dockerfile
Docker Context: . (root of repo)
Build Command: (leave empty - uses Dockerfile)
```

**Deploy Settings:**
```
Start Command: (leave empty - uses Dockerfile CMD)
```

**Environment Variables:**
```
OPENAI_API_KEY=sk-proj-...
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
FRONTEND_URL=https://your-frontend.onrender.com
FLASK_ENV=production
PORT=10000
WORKERS=1
TIMEOUT=120
```

## Deployment Verification

### What to Look For in Render Logs

**✅ SUCCESS - You should see:**
```
Step 5/XX : COPY requirements.txt .
 ---> Using cache
Step 6/XX : RUN pip install --user --no-cache-dir -r requirements.txt
 ---> Running in abc123...
Collecting flask==3.1.2
  Downloading Flask-3.1.2-py3-none-any.whl
...
Successfully installed Flask-3.1.2 flask-cors-4.0.0 gunicorn-21.2.0 ...
```

**✅ Then during startup:**
```
================================
BhriguWelt Backend Starting...
================================
Environment: production
Port: 10000
Python version: Python 3.11.9
Current directory: /app/backend
================================
Testing app import...
App imported successfully!
================================
Starting Gunicorn...
================================
[INFO] Listening at: http://0.0.0.0:10000
```

**❌ FAILURE - If you still see:**
```
ModuleNotFoundError: No module named 'flask'
```

Then check:
1. Render is using `backend/Dockerfile` (not root `Dockerfile`)
2. Build logs show pip install succeeded
3. Environment variables are set correctly

## Manual Build Test (If Needed)

If you have Docker locally:

```bash
# From repo root
cd /path/to/BhriguWelt

# Build using backend Dockerfile
docker build -t bhriguwelt-backend -f backend/Dockerfile ./backend

# Test run
docker run -p 10000:10000 \
  -e OPENAI_API_KEY=test \
  -e SECRET_KEY=test \
  -e JWT_SECRET_KEY=test \
  -e FRONTEND_URL=http://localhost:3000 \
  -e FLASK_ENV=production \
  bhriguwelt-backend

# Verify Flask is importable
docker run --rm bhriguwelt-backend python -c "import flask; print('✓ Flask version:', flask.__version__)"
```

**Expected output:**
```
✓ Flask version: 3.1.2
```

## Troubleshooting

### Issue: Build fails with "requirements.txt not found"

**Solution:** Ensure Render's "Docker Context" is set to `.` (repo root) not `backend`

### Issue: Still getting ModuleNotFoundError after fix

**Solution:**
1. Check Render is rebuilding from scratch (not using old cached layers)
2. Try "Manual Deploy" → "Clear build cache & deploy"
3. Verify the commit with the fix is actually deployed

### Issue: Build succeeds but app crashes

**Solution:** Check these environment variables are set:
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `FRONTEND_URL`

These are required in production mode (see `start.sh` lines 18-27).

## Timeline

- **Build time:** 3-5 minutes (first build, ~30 seconds with cache)
- **Startup time:** 10-20 seconds
- **Total deployment time:** 4-6 minutes

## Verification Checklist

After deployment, verify:

- [ ] Build logs show "Successfully installed Flask..."
- [ ] No "ModuleNotFoundError" in startup logs
- [ ] Health check passing at `https://your-app.onrender.com/health`
- [ ] API responds at `https://your-app.onrender.com/api/v1/health`
- [ ] No container restarts in Render dashboard

## Support

If issues persist after this fix:
1. Check Render deployment logs (full logs, not just recent)
2. Verify all environment variables are set
3. Try "Clear build cache & deploy" in Render dashboard
4. Check that the branch being deployed contains these changes

---

**Fix Applied:** 2026-01-17
**Issue Ticket:** Docker Dependencies Not Installed
