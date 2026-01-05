# Migration Guide: Cloud to Offline-First Architecture

## Overview

This guide covers the transition from the cloud-based architecture (Next.js frontend on Vercel + Python backend on Render) to the **offline-first Progressive Web App (PWA)** architecture with optional AI backend integration.

## Architecture Comparison

### Legacy Cloud Architecture (Pre-Migration)

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Vercel         │      │  Render          │
│  (Next.js)      │◄────►│  (Flask/Python)  │
│  Frontend       │ API  │  Backend         │
└─────────────────┘      └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  OpenAI       │
                         │  (External)      │
                         └──────────────────┘
```

**Characteristics:**
- ❌ Requires internet connection for all features
- ❌ User data transmitted to backend for calculations
- ❌ No offline functionality
- ✅ Centralized AI processing
- ✅ Easy deployment and updates

### New Offline-First PWA Architecture (Post-Migration)

```
┌─────────────────────────────────┐
│  User Device (Browser/PWA)      │
│  ┌────────────────────────┐     │
│  │  Next.js Frontend      │     │
│  │  + Service Worker      │     │
│  │  + IndexedDB           │     │
│  │  + WebCrypto           │     │
│  └────────┬───────────────┘     │
│           │                     │
│           ▼                     │
│  ┌────────────────────────┐     │
│  │  Encrypted Storage     │     │
│  │  (AES-256-GCM)         │     │
│  └────────────────────────┘     │
└───────────────┬─────────────────┘
                │ HTTPS (Optional)
                ▼
       ┌──────────────────┐
       │  Render          │
       │  (Flask/Python)  │──┐
       │  AI Proxy Only   │  │
       └──────────────────┘  │
                             ▼
                    ┌──────────────────┐
                    │  OpenAI       │
                    │  (External)      │
                    └──────────────────┘
```

**Characteristics:**
- ✅ 100% offline functionality
- ✅ All data encrypted on device
- ✅ No network required for core features
- ✅ Optional AI enhancement
- ✅ Progressive enhancement

## Migration Phases

### Phase 1: Data Export (Preparation)

#### 1.1 Export Existing User Data

If you have existing users on the cloud platform, export their data:

```bash
# On your local machine or server
cd backend

# Export all user profiles
python scripts/export_data.py --output users_export.json

# Verify export
python scripts/verify_export.py users_export.json
```

Export format:
```json
{
  "users": [
    {
      "id": "user123",
      "profiles": [
        {
          "name": "John Doe",
          "date_of_birth": "1990-01-15",
          "time_of_birth": "14:30",
          "latitude": 19.0760,
          "longitude": 72.8777,
          "timezone": "Asia/Kolkata",
          "created_at": "2024-01-01T00:00:00Z"
        }
      ],
      "reports": [
        {
          "profile_id": "prof123",
          "type": "birth-chart",
          "data": { ... },
          "created_at": "2024-01-02T00:00:00Z"
        }
      ]
    }
  ],
  "export_date": "2026-01-03T00:00:00Z",
  "version": "1.0"
}
```

#### 1.2 Anonymize Data (GDPR Compliance)

Remove any unnecessary PII before migration:

```python
# scripts/anonymize_export.py
def anonymize_export(export_data):
    for user in export_data['users']:
        # Remove server-side user IDs
        del user['id']
        
        # Keep only essential data
        for profile in user['profiles']:
            # Remove any email, phone, etc.
            profile.pop('email', None)
            profile.pop('phone', None)
    
    return export_data
```

### Phase 2: Frontend Migration

#### 2.1 Install PWA Dependencies

The frontend already includes all necessary dependencies. Verify:

```bash
cd frontend
npm list | grep -E "(next|react|framer-motion|axios)"
```

#### 2.2 Verify Service Worker

Check that service worker is properly configured:

```bash
# Check service worker file
cat public/sw.js

# Check manifest
cat public/manifest.json

# Verify in browser DevTools
# Application > Service Workers
```

#### 2.3 Test Offline Functionality

1. Open the app in browser
2. DevTools > Network > Offline checkbox
3. Verify app loads and functions offline
4. Check caching strategy in DevTools > Application > Cache Storage

#### 2.4 Deploy to Vercel

```bash
# Connect to Vercel (if not already)
vercel login

# Deploy
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_API_URL=https://your-backend.onrender.com (optional)
```

### Phase 3: Backend Migration (Optional AI Features)

#### 3.1 Update Backend Configuration

The backend now acts as an AI proxy only. Update configuration:

```python
# backend/.env
FLASK_ENV=production
SECRET_KEY=your-secure-secret-key
JWT_SECRET_KEY=your-jwt-secret

# OpenAI
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.sarvam.ai/v1

# Frontend (CORS)
FRONTEND_URL=https://your-app.vercel.app

# Rate Limiting
REDIS_URL=redis://your-redis-instance
DAILY_AI_QUOTA=1000
MONTHLY_AI_QUOTA=30000
```

#### 3.2 Test Security Middleware

```bash
# Install dependencies
pip install -r requirements.txt

# Test locally
python app.py

# Test endpoints
curl -X POST http://localhost:8000/api/predictions/daily \
  -H "Content-Type: application/json" \
  -d '{"zodiac_sign": "Aries", "nakshatra": "Ashwini"}'
```

#### 3.3 Deploy to Render

```bash
# Render will auto-deploy from GitHub
# Configure in render.yaml or dashboard:

# Build Command: pip install -r requirements.txt
# Start Command: gunicorn app:app
```

Set environment variables in Render dashboard (same as .env above).

### Phase 4: User Migration

#### 4.1 Inform Users

Send migration notice via email:

```
Subject: Important: BhriguWelt is Going Offline-First!

Dear [User],

We're excited to announce a major upgrade to BhriguWelt! We're transitioning 
to a 100% offline-first architecture for enhanced privacy and security.

What's changing:
✅ All your data will be encrypted and stored locally on your device
✅ No internet required for core astrology features
✅ Faster performance and better privacy
✅ Optional AI enhancement when you want it

Action required:
1. Visit https://your-app.vercel.app before [DATE]
2. Set up your 6-digit passcode
3. Import your existing data (we'll provide a download link)

Your data export is available at:
[Secure download link valid for 30 days]

Important: After import, your data will be encrypted on your device. 
Make sure to remember your passcode!

Questions? support@bhriguwelt.com

Best regards,
The BhriguWelt Team
```

#### 4.2 Provide Data Import Tool

Users can import their data through the app:

```typescript
// In the app: Settings > Import Data
async function importUserData(jsonFile: File, passcode: string) {
  // Read file
  const text = await jsonFile.text();
  const data = JSON.parse(text);
  
  // Validate structure
  if (!validateImportData(data)) {
    throw new Error('Invalid data format');
  }
  
  // Get encryption key
  const key = await getEncryptionKey(passcode);
  
  // Import profiles
  for (const profile of data.profiles) {
    await setItem(STORES.PROFILES, profile.id, profile, key);
  }
  
  // Import reports
  for (const report of data.reports) {
    await setItem(STORES.REPORTS, report.id, report, key);
  }
  
  return {
    profiles: data.profiles.length,
    reports: data.reports.length
  };
}
```

### Phase 5: Legacy System Decommissioning

#### 5.1 Monitor Migration Progress

Track migration metrics:

```sql
-- If using database
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN migrated_at IS NOT NULL THEN 1 ELSE 0 END) as migrated_users,
  SUM(CASE WHEN last_login > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as active_users
FROM users;
```

#### 5.2 Grace Period (30-90 days)

- Keep legacy system running
- Send reminder emails weekly
- Provide support for migration issues
- Export data automatically for inactive users

#### 5.3 Final Shutdown Checklist

**Before shutting down legacy backend:**

- [ ] 95%+ users migrated
- [ ] All active users notified (3 emails minimum)
- [ ] Data backups created
- [ ] Export links sent to all users
- [ ] Support tickets resolved
- [ ] Legal/compliance requirements met

**Shutdown procedure:**

```bash
# 1. Enable read-only mode
export LEGACY_READ_ONLY=true

# 2. Display migration banner
# Add to frontend:
<Banner>
  Legacy backend shutting down on [DATE]. 
  Please migrate to PWA version.
</Banner>

# 3. After grace period, shut down
# Render: Delete service
# Vercel: Remove old deployment

# 4. Archive data
aws s3 cp data_archive.tar.gz s3://bhriguwelt-archives/

# 5. Update DNS (if needed)
# Redirect old URLs to new PWA
```

## Rollback Plan

If issues arise during migration:

### Quick Rollback (< 24 hours)

```bash
# Revert Vercel deployment
vercel rollback [deployment-url]

# Re-enable legacy backend
# Render: Re-deploy previous version
```

### Data Recovery

```bash
# Restore from backup
aws s3 cp s3://bhriguwelt-backups/latest.sql.gz .
gunzip latest.sql.gz
mysql -u user -p database < latest.sql
```

## Post-Migration Checklist

### Week 1
- [ ] Monitor error rates (target: < 1%)
- [ ] Track PWA installation rate
- [ ] Verify offline functionality
- [ ] Check encryption performance
- [ ] Monitor AI API usage and costs

### Month 1
- [ ] User feedback survey
- [ ] Performance optimization
- [ ] Security audit
- [ ] Cost analysis
- [ ] Feature requests prioritization

### Quarter 1
- [ ] Full decommission of legacy systems
- [ ] Cost savings report
- [ ] User growth analysis
- [ ] Security certification (if applicable)

## Troubleshooting

### Issue: Users can't access old data

**Solution:**
1. Provide data export from legacy backend
2. Guide users through import process
3. Offer manual migration support for complex cases

### Issue: PWA not installing

**Solution:**
1. Verify HTTPS is enabled
2. Check manifest.json validity
3. Ensure service worker registers correctly
4. Clear browser cache and retry

### Issue: Encryption too slow

**Solution:**
1. Profile performance with DevTools
2. Consider batch encryption
3. Implement lazy loading
4. Optimize PBKDF2 iterations (balance security vs performance)

### Issue: High backend costs (AI usage)

**Solution:**
1. Review rate limiting configuration
2. Implement aggressive caching
3. Add user quotas
4. Consider AI model optimization

## Cost Comparison

### Legacy Architecture (Monthly)

| Service | Cost |
|---------|------|
| Vercel (Frontend) | $20 |
| Render (Backend) | $25 |
| Database | $15 |
| OpenAI | $100 |
| **Total** | **$160** |

### New Architecture (Monthly)

| Service | Cost |
|---------|------|
| Vercel (Frontend/PWA) | $20 |
| Render (AI Proxy only) | $7 |
| OpenAI (reduced usage) | $30 |
| **Total** | **$57** |

**Savings: $103/month (64% reduction)**

## Security Considerations

### Data Transition

1. **Encrypt exports**: Use GPG or similar for data export files
2. **Secure transfer**: Use HTTPS with certificate pinning
3. **Verify integrity**: Include checksums in export
4. **Audit trail**: Log all exports and imports

### Key Management

1. Users create new passcode (not derived from old password)
2. No key escrow or recovery mechanism
3. Clear communication about passcode responsibility

### Compliance

- **GDPR**: Right to erasure, data portability implemented
- **CCPA**: Same privacy rights as GDPR
- **SOC 2**: Document security controls (if needed)

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Data Export | 1 week | ✅ Complete |
| Phase 2: Frontend Migration | 2 weeks | ✅ Complete |
| Phase 3: Backend Migration | 1 week | ✅ Complete |
| Phase 4: User Migration | 6-8 weeks | 🔄 In Progress |
| Phase 5: Decommission | 2 weeks | ⏳ Pending |

## Support Resources

- **Documentation**: https://docs.bhriguwelt.com/migration
- **Email Support**: migration@bhriguwelt.com
- **Live Chat**: Available during business hours
- **Community Forum**: https://community.bhriguwelt.com

## FAQs

### Q: Will I lose my data during migration?
**A:** No. You'll receive a data export that you can import into the new PWA. Your data is yours to keep.

### Q: Do I need internet for the new version?
**A:** No! The new PWA works 100% offline. Internet is only needed for optional AI features.

### Q: What if I forget my passcode?
**A:** Unfortunately, there's no recovery mechanism for security reasons. Your data will be inaccessible. We recommend storing your passcode securely.

### Q: Can I use both versions during transition?
**A:** Yes, during the grace period (30-90 days) both versions will be available.

### Q: How do I know my data is secure?
**A:** Your data is encrypted with AES-256-GCM on your device. We never have access to your unencrypted data.

---

**Version**: 1.0  
**Last Updated**: 2026-01-03  
**Contact**: migration@bhriguwelt.com
