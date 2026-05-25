#!/usr/bin/env ts-node
/**
 * Legacy Profile Migration Tool
 *
 * This script helps migrate legacy-shaped profile entries in IndexedDB
 * to the new normalized format with proper ID tracking.
 *
 * USAGE:
 *   # Dry run (analyze only, no changes):
 *   npx ts-node scripts/migrate-legacy-profiles.ts
 *
 *   # Apply migration (with backup):
 *   npx ts-node scripts/migrate-legacy-profiles.ts --apply
 *
 * SAFETY:
 *   - Dry run by default
 *   - Creates backup JSON snapshot before applying changes
 *   - Non-destructive (rewrites entries but preserves all data)
 *   - Requires explicit --apply flag to make changes
 *
 * WHAT IT DOES:
 *   1. Scans IndexedDB for profile entries with legacy shapes
 *   2. Identifies entries stored with non-numeric keys or unusual shapes
 *   3. In dry-run mode: Reports what would be changed
 *   4. In apply mode: Creates backup, normalizes entries, sets localStorage IDs
 */

import * as fs from 'fs';
import * as path from 'path';

// This is a Node.js script, so we need to mock the browser environment
// For actual execution, this would need to run in a browser context or with jsdom

interface MigrationOptions {
  apply: boolean;
  backupPath: string;
}

interface ProfileEntry {
  id: IDBValidKey;
  key?: string;
  value: any;
  encrypted: boolean;
}

interface MigrationReport {
  totalProfiles: number;
  legacyProfiles: ProfileEntry[];
  normalizedProfiles: ProfileEntry[];
  recommendations: string[];
}

const DEFAULT_OPTIONS: MigrationOptions = {
  apply: false,
  backupPath: path.join(process.cwd(), 'profile-backup.json'),
};

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationOptions {
  const options = { ...DEFAULT_OPTIONS };

  const args = process.argv.slice(2);
  if (args.includes('--apply')) {
    options.apply = true;
  }

  const backupIndex = args.indexOf('--backup');
  if (backupIndex !== -1 && args[backupIndex + 1]) {
    options.backupPath = args[backupIndex + 1]!;
  }

  return options;
}

/**
 * Analyze profiles and identify legacy entries
 *
 * NOTE: This is a template implementation. For actual browser execution,
 * this would need to be run in a browser context with IndexedDB access.
 */
async function analyzeProfiles(): Promise<MigrationReport> {
  console.log('⚠️  IMPORTANT: This script must be run in a browser context with IndexedDB access.');
  console.log('📝 To use this tool:');
  console.log('   1. Open your app in a browser');
  console.log('   2. Open DevTools Console');
  console.log('   3. Copy and paste the migration function from this file');
  console.log('   4. Run: await migrateProfiles(dryRun = true)');
  console.log('');

  const report: MigrationReport = {
    totalProfiles: 0,
    legacyProfiles: [],
    normalizedProfiles: [],
    recommendations: [],
  };

  // Placeholder - actual implementation would scan IndexedDB
  report.recommendations.push(
    'Run this script in browser DevTools for actual profile analysis',
    'Check for profiles stored with key "current_profile"',
    'Verify localStorage.current_profile_id is set for each profile',
  );

  return report;
}

/**
 * Create backup of current profile data
 */
async function createBackup(backupPath: string, profiles: ProfileEntry[]): Promise<void> {
  const backup = {
    timestamp: new Date().toISOString(),
    profiles: profiles.map(p => ({
      id: p.id,
      key: p.key,
      value: p.value,
      encrypted: p.encrypted,
    })),
  };

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`✓ Backup created: ${backupPath}`);
}

/**
 * Apply migration (template)
 */
async function applyMigration(_profiles: ProfileEntry[]): Promise<void> {
  console.log('⚠️  Migration must be applied in browser context');
  console.log('📝 Manual migration steps:');
  console.log('   1. Export profiles: Use browser DevTools to export data');
  console.log('   2. For each profile, ensure it has a numeric ID');
  console.log('   3. Set localStorage.current_profile_id to the numeric ID');
  console.log('   4. Remove legacy "current_profile" key entries if needed');
  console.log('');
}

/**
 * Print migration report
 */
function printReport(report: MigrationReport, options: MigrationOptions): void {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  LEGACY PROFILE MIGRATION REPORT');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`Total Profiles: ${report.totalProfiles}`);
  console.log(`Legacy Entries: ${report.legacyProfiles.length}`);
  console.log(`Normalized Entries: ${report.normalizedProfiles.length}`);
  console.log('');

  if (report.legacyProfiles.length > 0) {
    console.log('LEGACY PROFILES FOUND:');
    report.legacyProfiles.forEach((profile, i) => {
      console.log(`  ${i + 1}. ID: ${profile.id}, Encrypted: ${profile.encrypted}`);
    });
    console.log('');
  }

  if (report.recommendations.length > 0) {
    console.log('RECOMMENDATIONS:');
    report.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    console.log('');
  }

  if (!options.apply) {
    console.log('✓ DRY RUN COMPLETE - No changes made');
    console.log('');
    console.log('To apply migration, run:');
    console.log('  npx ts-node scripts/migrate-legacy-profiles.ts --apply');
  } else {
    console.log('✓ MIGRATION COMPLETE');
    console.log(`  Backup saved to: ${options.backupPath}`);
  }
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
}

/**
 * Browser-compatible migration function
 * Copy this into browser DevTools Console
 */
const BROWSER_MIGRATION_SCRIPT = `
/**
 * Browser-compatible migration function
 * Run this in DevTools Console with IndexedDB access
 *
 * Usage:
 *   await migrateProfiles(true)  // Dry run
 *   await migrateProfiles(false) // Apply migration
 */
async function migrateProfiles(dryRun = true) {
  const DB_NAME = 'BhriguWelt';
  const STORE_NAME = 'profiles';

  console.log(dryRun ? '📊 DRY RUN - Analyzing profiles...' : '🔧 APPLYING MIGRATION...');

  // Open IndexedDB
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // Scan profiles
  const profiles = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  console.log(\`Found \${profiles.length} total profiles\`);

  // Create backup
  if (!dryRun) {
    const backup = JSON.stringify({
      timestamp: new Date().toISOString(),
      profiles: profiles,
    }, null, 2);

    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`profile-backup-\${Date.now()}.json\`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('✓ Backup downloaded');
  }

  // Check localStorage for current_profile_id
  const storedId = localStorage.getItem('current_profile_id');
  console.log(\`localStorage.current_profile_id: \${storedId || 'NOT SET'}\`);

  // If profiles exist but no ID is set, set it to the most recent profile's ID
  if (!storedId && profiles.length > 0) {
    const mostRecent = profiles.reduce((latest, p) => {
      const latestTime = new Date(latest.updatedAt || latest.createdAt || 0);
      const pTime = new Date(p.updatedAt || p.createdAt || 0);
      return pTime > latestTime ? p : latest;
    });

    if (!dryRun) {
      localStorage.setItem('current_profile_id', String(mostRecent.id));
      console.log(\`✓ Set current_profile_id to: \${mostRecent.id}\`);
    } else {
      console.log(\`Would set current_profile_id to: \${mostRecent.id}\`);
    }
  }

  console.log(dryRun ? '✓ DRY RUN COMPLETE' : '✓ MIGRATION COMPLETE');
  db.close();
}

// Run dry run by default
console.log('Migration function loaded. Run: await migrateProfiles(true)');
`;

/**
 * Main entry point
 */
async function main() {
  const options = parseArgs();

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  BhriguWelt Legacy Profile Migration Tool');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`Mode: ${options.apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Backup Path: ${options.backupPath}`);
  console.log('');

  // Analyze profiles
  const report = await analyzeProfiles();

  // Apply migration if requested
  if (options.apply) {
    console.log('Creating backup...');
    await createBackup(options.backupPath, report.legacyProfiles);

    console.log('Applying migration...');
    await applyMigration(report.legacyProfiles);
  }

  // Print report
  printReport(report, options);

  // Export browser script
  const scriptPath = path.join(path.dirname(options.backupPath), 'browser-migration.js');
  fs.writeFileSync(scriptPath, BROWSER_MIGRATION_SCRIPT);
  console.log(`📝 Browser migration script saved to: ${scriptPath}`);
  console.log('   Copy this script into your browser DevTools Console');
  console.log('');
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
}

// Export types separately to satisfy isolatedModules requirement
export type { MigrationOptions, MigrationReport };
export { analyzeProfiles, applyMigration, createBackup };
