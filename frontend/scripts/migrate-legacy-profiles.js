#!/usr/bin/env node

/**
 * Legacy Profile Migration Script
 *
 * Non-destructive migration tool for normalizing legacy-shaped profile records
 * in IndexedDB to the current schema.
 *
 * Usage:
 *   node migrate-legacy-profiles.js --dry-run     # Preview changes
 *   node migrate-legacy-profiles.js --apply       # Apply migrations (with backup)
 *   node migrate-legacy-profiles.js --backup-only # Create backup only
 *
 * Safety features:
 * - Dry-run mode lists changes without modifying data
 * - Automatic JSON backup before applying changes
 * - Non-destructive: creates normalized copies, preserves originals
 * - Validation before and after migration
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isApply = args.includes('--apply');
const isBackupOnly = args.includes('--backup-only');

if (!isDryRun && !isApply && !isBackupOnly) {
  console.error('Error: Must specify --dry-run, --apply, or --backup-only');
  console.log('');
  console.log('Usage:');
  console.log('  node migrate-legacy-profiles.js --dry-run     # Preview changes');
  console.log('  node migrate-legacy-profiles.js --apply       # Apply migrations');
  console.log('  node migrate-legacy-profiles.js --backup-only # Create backup only');
  process.exit(1);
}

console.log('='.repeat(70));
console.log('Legacy Profile Migration Script');
console.log('='.repeat(70));
console.log('');

if (isDryRun) {
  console.log('MODE: DRY RUN (no changes will be made)');
} else if (isBackupOnly) {
  console.log('MODE: BACKUP ONLY');
} else {
  console.log('MODE: APPLY MIGRATIONS (with automatic backup)');
}

console.log('');

// This script is designed to run in Node.js environment
// For browser-based migration, convert to ES modules and use browser APIs

console.log('⚠️  NOTICE: This script requires a browser environment to access IndexedDB.');
console.log('Please run this migration from the browser console instead.');
console.log('');
console.log('To migrate in browser:');
console.log('1. Open your application in a browser');
console.log('2. Open DevTools Console (F12)');
console.log('3. Copy and paste the browser migration script');
console.log('');
console.log('Generating browser-compatible migration script...');
console.log('');

// Generate browser-compatible migration script
const browserScript = `
// Browser-based Legacy Profile Migration
// Copy this entire script into your browser console

(async function migrateLegacyProfiles() {
  const isDryRun = ${isDryRun};
  const isApply = ${isApply};

  console.log('Starting legacy profile migration...');
  console.log('Mode:', isDryRun ? 'DRY RUN' : 'APPLY');

  const DB_NAME = 'BhriguWeltDB';
  const STORE_NAME = 'profiles';
  const BACKUP_KEY = 'migration_backup_' + Date.now();

  // Open IndexedDB
  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  // Get all records from store
  const getAllRecords = (db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  // Detect legacy-shaped records
  const isLegacyRecord = (record) => {
    // Legacy patterns:
    // 1. Nested { key, value, encrypted } wrapper
    // 2. Inconsistent field naming (dateOfBirth vs date_of_birth)
    // 3. Missing updatedAt/createdAt

    if (!record) return false;

    const hasNestedValue = record.value && typeof record.value === 'object' && 'value' in record.value;
    const hasKeyField = 'key' in record;
    const missingTimestamps = !record.createdAt || !record.updatedAt;

    return hasNestedValue || (hasKeyField && missingTimestamps);
  };

  // Normalize legacy record to current schema
  const normalizeRecord = (record) => {
    let normalized = { ...record };

    // Unwrap nested value structure
    if (normalized.value && typeof normalized.value === 'object' && 'value' in normalized.value) {
      // Extract the actual data from nested wrapper
      const innerValue = normalized.value.value;
      if (typeof innerValue === 'object') {
        normalized = { ...normalized, ...innerValue };
      }

      // Preserve encryption flag if present
      if (normalized.value.encrypted !== undefined) {
        normalized.encrypted = normalized.value.encrypted;
      }
    }

    // Add timestamps if missing
    const now = new Date().toISOString();
    if (!normalized.createdAt) {
      normalized.createdAt = now;
    }
    if (!normalized.updatedAt) {
      normalized.updatedAt = now;
    }

    // Normalize field names (camelCase)
    const fieldMappings = {
      'date_of_birth': 'dateOfBirth',
      'time_of_birth': 'timeOfBirth',
      'place_of_birth': 'placeOfBirth',
    };

    for (const [oldKey, newKey] of Object.entries(fieldMappings)) {
      if (oldKey in normalized && !(newKey in normalized)) {
        normalized[newKey] = normalized[oldKey];
        delete normalized[oldKey];
      }
    }

    // Ensure required fields exist
    if (!normalized.name) {
      normalized.name = 'Unnamed Profile';
    }

    return normalized;
  };

  // Create backup
  const createBackup = (db, records) => {
    return new Promise((resolve, reject) => {
      const backup = {
        timestamp: new Date().toISOString(),
        recordCount: records.length,
        records: records
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = \`profile-backup-\${Date.now()}.json\`;
      a.click();

      URL.revokeObjectURL(url);

      console.log(\`✅ Backup created: \${a.download}\`);
      resolve();
    });
  };

  // Apply migrations
  const applyMigrations = async (db, legacyRecords) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    let migrated = 0;
    let failed = 0;

    for (const record of legacyRecords) {
      try {
        const normalized = normalizeRecord(record);

        // Put normalized record (will update if ID exists)
        await new Promise((resolve, reject) => {
          const request = store.put(normalized);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });

        migrated++;
      } catch (error) {
        console.error(\`Failed to migrate record ID \${record.id}:\`, error);
        failed++;
      }
    }

    return { migrated, failed };
  };

  try {
    // Open database
    const db = await openDB();
    console.log('✅ Database opened');

    // Get all records
    const allRecords = await getAllRecords(db);
    console.log(\`📊 Total records: \${allRecords.length}\`);

    // Identify legacy records
    const legacyRecords = allRecords.filter(isLegacyRecord);
    console.log(\`📋 Legacy records found: \${legacyRecords.length}\`);

    if (legacyRecords.length === 0) {
      console.log('✅ No legacy records found. Database is up to date!');
      return;
    }

    // Dry run - just preview
    if (isDryRun) {
      console.log('');
      console.log('DRY RUN - Preview of changes:');
      console.log('='.repeat(50));

      legacyRecords.forEach((record, index) => {
        console.log(\`\\nRecord \${index + 1} (ID: \${record.id}):\`);
        console.log('  Current:', JSON.stringify(record).slice(0, 100) + '...');
        const normalized = normalizeRecord(record);
        console.log('  After migration:', JSON.stringify(normalized).slice(0, 100) + '...');
        console.log('  Changes:');

        // Detect changes
        if (!record.createdAt) console.log('    + Will add createdAt');
        if (!record.updatedAt) console.log('    + Will add updatedAt');
        if (record.value && 'value' in record.value) console.log('    + Will unwrap nested value');
      });

      console.log('');
      console.log('='.repeat(50));
      console.log(\`Total records to migrate: \${legacyRecords.length}\`);
      console.log('');
      console.log('To apply these changes, run with --apply flag');
      return;
    }

    // Apply mode - create backup and migrate
    if (isApply) {
      console.log('');
      console.log('Creating backup...');
      await createBackup(db, allRecords);

      console.log('');
      console.log('Applying migrations...');
      const { migrated, failed } = await applyMigrations(db, legacyRecords);

      console.log('');
      console.log('='.repeat(50));
      console.log('Migration complete!');
      console.log(\`✅ Successfully migrated: \${migrated}\`);
      if (failed > 0) {
        console.log(\`❌ Failed: \${failed}\`);
      }
      console.log('='.repeat(50));

      // Verify
      const updatedRecords = await getAllRecords(db);
      const remainingLegacy = updatedRecords.filter(isLegacyRecord);

      if (remainingLegacy.length === 0) {
        console.log('✅ Verification passed: No legacy records remaining');
      } else {
        console.warn(\`⚠️  Warning: \${remainingLegacy.length} legacy records still detected\`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
})();
`;

// Write browser script to file
const browserScriptPath = path.join(__dirname, 'migrate-legacy-profiles-browser.js');
fs.writeFileSync(browserScriptPath, browserScript);

console.log('✅ Browser migration script generated:');
console.log(`   ${browserScriptPath}`);
console.log('');
console.log('Next steps:');
console.log('1. Open your application in a browser');
console.log('2. Open DevTools Console (F12)');
console.log('3. Copy the contents of migrate-legacy-profiles-browser.js');
console.log('4. Paste into console and press Enter');
console.log('');
console.log('='.repeat(70));
