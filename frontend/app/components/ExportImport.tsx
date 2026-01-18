'use client';

/**
 * Export/Import Component
 * Allows users to export all their data to a JSON file and import it back
 * Supports encrypted and unencrypted exports
 */

import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, FileJson, Lock, Unlock, Check, X } from 'lucide-react';
import { exportDatabase, importDatabase } from '@/lib/storage';
import { ExportData } from '@/lib/types';

interface ExportImportProps {
  encryptionKey?: CryptoKey;
  onComplete?: () => void;
}

export default function ExportImport({ encryptionKey, onComplete }: ExportImportProps) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exportFormat, setExportFormat] = useState<'encrypted' | 'plain'>('encrypted');
  const exportTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const importTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (exportTimeoutRef.current) {
        clearTimeout(exportTimeoutRef.current);
      }
      if (importTimeoutRef.current) {
        clearTimeout(importTimeoutRef.current);
      }
    };
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      setMessage(null);

      const key = exportFormat === 'encrypted' ? encryptionKey : undefined;
      const jsonData = await exportDatabase(key);

      // Parse to add metadata
      const exportData: ExportData = JSON.parse(jsonData);
      const enrichedData = {
        ...exportData,
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
      };

      // Create download
      const blob = new Blob([JSON.stringify(enrichedData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bhriguwelt-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Data exported successfully!' });

      // Clear previous timeout if exists
      if (exportTimeoutRef.current) {
        clearTimeout(exportTimeoutRef.current);
      }

      // Set new timeout with cleanup
      exportTimeoutRef.current = setTimeout(() => {
        setMessage(null);
        exportTimeoutRef.current = null;
      }, 3000);
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ type: 'error', text: 'Failed to export data. Please try again.' });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setMessage(null);

      const text = await file.text();
      const data = JSON.parse(text);

      // Validate export data structure
      if (!data.profiles && !data.reports && !data.settings) {
        throw new Error('Invalid export file format');
      }

      const key = exportFormat === 'encrypted' ? encryptionKey : undefined;
      await importDatabase(text, key);

      setMessage({ type: 'success', text: 'Data imported successfully!' });

      // Clear previous timeout if exists
      if (importTimeoutRef.current) {
        clearTimeout(importTimeoutRef.current);
      }

      // Set new timeout with cleanup
      importTimeoutRef.current = setTimeout(() => {
        setMessage(null);
        onComplete?.();
        importTimeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to import data. Please check the file.'
      });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900 rounded-lg">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Data Management
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Export your data for backup or import previously saved data
        </p>
      </div>

      {/* Format Selection */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Export/Import Format
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setExportFormat('encrypted')}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
              exportFormat === 'encrypted'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Encrypted</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Secure with passcode</div>
            </div>
          </button>
          <button
            onClick={() => setExportFormat('plain')}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
              exportFormat === 'plain'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <Unlock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Plain</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">No encryption</div>
            </div>
          </button>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Export Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Download all your profiles, reports, and settings
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || (exportFormat === 'encrypted' && !encryptionKey)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Exporting...
            </>
          ) : (
            <>
              <FileJson className="w-5 h-5" />
              Export to JSON
            </>
          )}
        </button>
        {exportFormat === 'encrypted' && !encryptionKey && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Encryption key required for encrypted export
          </p>
        )}
      </div>

      {/* Import Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Import Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Restore from a previously exported JSON file
            </p>
          </div>
        </div>
        <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors">
          {importing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Select JSON File
            </>
          )}
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing || (exportFormat === 'encrypted' && !encryptionKey)}
            className="hidden"
          />
        </label>
        {exportFormat === 'encrypted' && !encryptionKey && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Encryption key required for encrypted import
          </p>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Tip:</strong> Regular backups help protect your data. Encrypted exports require
          your passcode to import. Plain exports can be imported without a passcode but are less secure.
        </p>
      </div>
    </div>
  );
}
