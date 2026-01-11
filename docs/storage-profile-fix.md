# Profile Storage Fix: Fallback & Backward Compatibility

## Overview

This document describes the comprehensive fix for the profile/storage mismatch issue that was causing "Please complete your profile first" messages across all UI pages.

## Problem Statement

### Root Cause

Pages were calling `getItem(STORES.PROFILES, 'current_profile', encryptionKey)`, but:
- The PROFILES object store has `keyPath: 'id'` with `autoIncrement: true`
- Some records were stored in legacy shape: `{ key, value, encrypted }`
- Direct get by literal key 'current_profile' returned `null`

This caused every page to show "Please complete your profile first" even when a profile existed.

## Solution

### Three-Layer Approach

1. **Storage Fallback** (frontend/lib/storage.ts)
   - Enhanced `getItem` with cursor-based fallback search
   - Searches for: `entry.key === key`, `entry.value?.key === key`, `entry.value?.id === key`
   - Non-destructive: no automatic writes or migrations

2. **Profile Helpers** (frontend/lib/profileHelpers.ts)
   - New `loadCurrentProfile(encryptionKey)` function
   - Multi-strategy loading:
     - Try `localStorage.current_profile_id` first
     - Fall back to literal key 'current_profile'
     - Last resort: scan for most recent profile by timestamp

3. **Profile ID Persistence** (frontend/app/get-started/page.tsx)
   - `setItem` now returns assigned ID
   - ID persisted to `localStorage.current_profile_id`
   - Enables fast direct lookups on subsequent loads

## Files Changed

### Modified

- `frontend/lib/storage.ts` - Fallback cursor + setItem returns ID
- `frontend/app/get-started/page.tsx` - Persist profile ID
- `frontend/app/horoscope/page.tsx` - Use loadCurrentProfile
- `frontend/app/daily-insights/page.tsx` - Use loadCurrentProfile
- `frontend/app/birth-chart/page.tsx` - Use loadCurrentProfile
- `frontend/app/life-events/page.tsx` - Use loadCurrentProfile
- `frontend/app/present-life/page.tsx` - Use loadCurrentProfile
- `frontend/app/past-lives/page.tsx` - Use loadCurrentProfile
- `frontend/app/future-lives/page.tsx` - Use loadCurrentProfile
- `frontend/app/karmic-journey/page.tsx` - Use loadCurrentProfile
- `frontend/app/relationships/page.tsx` - Use loadCurrentProfile
- `frontend/app/karmic-remedies/page.tsx` - Use loadCurrentProfile
- `frontend/app/predictions/page.tsx` - Use loadCurrentProfile
- `frontend/app/dashboard/page.tsx` - Use loadCurrentProfile
- `.github/workflows/frontend.yml` - Added test jobs

### Created

- `frontend/lib/profileHelpers.ts` - Profile loading utilities
- `frontend/__tests__/lib/storageFallback.test.ts` - Storage fallback tests
- `frontend/__tests__/lib/profileHelpers.test.ts` - Profile helper tests
- `docs/storage-profile-fix.md` - This document

### Updated

- `frontend/e2e/profile-predictions.spec.ts` - Added fallback scenarios

## Backward Compatibility

### Non-Destructive Design

✅ **No automatic migrations** - existing records unchanged
✅ **Read-time fallback** - resilient reads without destructive writes
✅ **Feature flag** - `FRONTEND_ENABLE_STORAGE_FALLBACK` (default: enabled)
✅ **Encryption preserved** - decryption logic unchanged

### Behavior Changes

| Scenario | Before | After |
|----------|--------|-------|
| Direct ID lookup | ❌ Not supported | ✅ Supported via localStorage |
| Literal key lookup | ❌ Failed | ✅ Works via fallback cursor |
| Legacy records | ❌ Not found | ✅ Found via cursor scan |
| New profiles | ❌ ID not tracked | ✅ ID persisted to localStorage |

## Testing

### Unit Tests

```bash
cd frontend
npm test
```

Tests cover:
- ✅ `setItem` returns assigned ID
- ✅ `getItem` direct match
- ✅ `getItem` cursor fallback for legacy records
- ✅ Encrypted entry fallback
- ✅ Decryption failure handling
- ✅ `loadCurrentProfile` all three strategies
- ✅ `setCurrentProfileId` / `getCurrentProfileId`

### E2E Tests

```bash
cd frontend
npx playwright test
```

Scenarios:
- ✅ Legacy-shaped records load without errors
- ✅ Profile creation sets `localStorage.current_profile_id`
- ✅ Pages load profile by ID from localStorage
- ✅ No "Please complete your profile first" on valid profiles

## Manual Verification Checklist

### Local Testing

1. **Create Profile Flow**
   ```bash
   npm run dev
   ```
   - Navigate to `/get-started`
   - Fill out profile form
   - Submit and verify redirect to `/dashboard`
   - Open DevTools → Application → Local Storage
   - Verify `current_profile_id` is set

2. **Profile Loading**
   - Navigate to `/horoscope`
   - Should load predictions (no "complete profile" message)
   - Navigate to `/daily-insights`
   - Should load insights
   - Open DevTools → Console
   - Look for "Profile loaded by ID: X" log

3. **Legacy Data Simulation**
   - Open DevTools → Application → IndexedDB → BhriguWeltDB → profiles
   - Manually add entry: `{ id: 99, key: 'current_profile', value: {...}, encrypted: false }`
   - Reload page
   - Profile should load (check console for "Storage fallback" logs)

### Staging Deployment

1. **Deploy to Staging**
   ```bash
   git push origin claude/fix-profile-storage-mismatch-wvDg2
   # Deploy to staging environment
   ```

2. **Create New Profile**
   - Visit staging URL
   - Go through Get Started flow
   - Inspect IndexedDB for profile record
   - Verify `localStorage.current_profile_id` is set

3. **Visit All Pages**
   - `/horoscope` - Should show predictions
   - `/daily-insights` - Should show insights
   - `/birth-chart` - Should show chart
   - `/life-events` - Should show events
   - All pages should load without "Please complete your profile first"

4. **Check Console**
   - No error spikes in browser console
   - Look for "Profile loaded by..." messages
   - Verify fallback logs only appear for legacy data

## Rollout Plan

### Phase 1: Canary (5% users, 48 hours)

1. Deploy to production with feature flag enabled for 5% of users
2. Monitor Sentry for:
   - Increased error rates
   - Profile loading failures
   - Storage errors
3. Check analytics:
   - "Profile missing" message occurrences
   - Page load success rates

### Phase 2: Ramp Up (25% users, 48 hours)

1. If Phase 1 stable, increase to 25%
2. Continue monitoring metrics
3. Collect user feedback

### Phase 3: Full Rollout (100% users)

1. Deploy to all users
2. Monitor for 7 days
3. Document any edge cases

## Rollback Instructions

### Quick Rollback

If issues arise:

```bash
# Revert the PR
git revert <commit-sha>
git push origin claude/fix-profile-storage-mismatch-wvDg2

# Or disable feature flag
# Set FRONTEND_ENABLE_STORAGE_FALLBACK=false in environment
```

### Rollback Impact

- Pages revert to direct `getItem` calls
- May re-introduce "Please complete your profile first" for some users
- No data loss - all records remain intact

### Post-Rollback Steps

1. Identify root cause of failure
2. Fix issue in new PR
3. Re-run full test suite
4. Deploy fix

## Feature Flag

### Disable Fallback

Set environment variable:
```bash
FRONTEND_ENABLE_STORAGE_FALLBACK=false
```

Default is `true` (enabled).

### Use Cases

- Emergency rollback without code revert
- Debugging: isolate whether fallback causes issues
- Gradual rollout: enable for specific environments

## Manual Workarounds for Users

### If Profile Not Loading

Users can manually set `localStorage.current_profile_id`:

1. **Open DevTools** (F12 or Cmd+Opt+I)
2. **Go to Application tab → Local Storage**
3. **Find Profile ID**:
   - Go to IndexedDB → BhriguWeltDB → profiles
   - Note the `id` field of your profile (e.g., `3`)
4. **Set localStorage**:
   - In Console tab, run:
     ```javascript
     localStorage.setItem('current_profile_id', '3');
     ```
   - Replace `3` with your actual profile ID
5. **Reload page** - Profile should now load

### If Profile Still Not Found

1. **Check IndexedDB**:
   - Application → IndexedDB → BhriguWeltDB → profiles
   - Verify profile record exists
2. **Check for multiple profiles**:
   - Note the most recent `updatedAt` timestamp
   - Use that profile's ID
3. **Re-create Profile**:
   - If no profile exists, go to `/get-started`
   - Fill out form to create new profile

## Monitoring & Analytics

### Metrics to Track

1. **Profile Loading Success Rate**
   - % of page loads that successfully load profile
   - Target: >99%

2. **Fallback Usage**
   - Track console.warn for "Storage fallback" messages
   - Should decrease over time as new profiles use localStorage ID

3. **Error Rates**
   - Sentry errors related to storage
   - Profile loading failures

4. **Performance**
   - Cursor scan duration (if fallback triggered)
   - Should be <100ms for most cases

### Adding Analytics

Consider adding:
```typescript
// In pages showing "Please complete your profile first"
if (!profile) {
  // Track this event
  analytics.track('profile_missing', {
    page: window.location.pathname,
    hasLocalStorageId: !!localStorage.getItem('current_profile_id'),
  });
}
```

## Future Work

### Optional Migration Script (Separate PR)

To normalize legacy records:

```typescript
// migrate-profiles.ts (NOT included in this PR)
async function migrateProfiles(encryptionKey: CryptoKey) {
  // 1. Scan all profiles
  // 2. For each legacy-shaped record:
  //    - Extract value
  //    - Delete old record
  //    - Re-insert with correct shape
  // 3. Track migrated count
  // 4. Dry-run mode: log changes without applying
}
```

**Safety Requirements:**
- ✅ Dry-run mode first
- ✅ Backup before migration
- ✅ Rollback mechanism
- ✅ User consent
- ✅ Separate opt-in step

## Support & Troubleshooting

### Common Issues

**Issue**: "Please complete your profile first" still appears

**Solutions**:
1. Check localStorage has `current_profile_id`
2. Verify profile exists in IndexedDB
3. Check console for "Storage fallback" warnings
4. Try manual workaround (see above)

**Issue**: Multiple profiles exist

**Solutions**:
1. Use `loadCurrentProfile` - automatically picks most recent
2. Manually set `current_profile_id` to desired profile
3. Consider adding profile selection UI (future work)

**Issue**: Encrypted profile fails to load

**Solutions**:
1. Ensure encryption key is correct
2. Check for "Failed to decrypt" errors in console
3. May need to re-create profile if encryption key lost

## Contact

For questions or issues:
- GitHub Issues: [hisr2024/BhriguWelt](https://github.com/hisr2024/BhriguWelt/issues)
- Pull Request: #XXX (to be filled after PR creation)

## References

- Original Issue: Profile/storage mismatch
- Related PRs: TBD
- Architecture Doc: `docs/architecture.md`
- Storage Encryption Doc: `docs/encryption.md`
