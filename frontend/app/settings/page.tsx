'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Bell,
  Moon,
  Sun,
  Globe,
  Lock,
  Trash2,
  ArrowLeft,
  Save,
  ChevronRight,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';

export default function SettingsPage() {
  const router = useRouter();
  const { isSetup, isUnlocked, lock } = useEncryption();
  const [settings, setSettings] = useState({
    notifications: true,
    dailyReminders: true,
    darkMode: true,
    language: 'en',
    showPasscode: false,
    aiEnabled: true,
    offlineMode: false,
  });
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearAllData = async () => {
    if (!showClearDataConfirm) {
      setShowClearDataConfirm(true);
      return;
    }

    try {
      // Clear all data
      localStorage.clear();
      sessionStorage.clear();

      // Clear IndexedDB databases
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }

      // Redirect to get started
      router.push('/get-started');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const handleChangePasscode = () => {
    // Lock and redirect to passcode setup
    lock();
    router.push('/setup-passcode');
  };

  const settingSections = [
    {
      title: 'General',
      items: [
        {
          icon: <Bell className="w-5 h-5" />,
          label: 'Notifications',
          description: 'Receive app notifications',
          type: 'toggle',
          key: 'notifications',
        },
        {
          icon: <Bell className="w-5 h-5" />,
          label: 'Daily Reminders',
          description: 'Get daily cosmic insights',
          type: 'toggle',
          key: 'dailyReminders',
        },
        {
          icon: <Globe className="w-5 h-5" />,
          label: 'Language',
          description: 'App language',
          type: 'select',
          key: 'language',
          options: [
            { value: 'en', label: 'English' },
            { value: 'hi', label: 'हिंदी (Hindi)' },
            { value: 'es', label: 'Español' },
          ],
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          icon: <Lock className="w-5 h-5" />,
          label: 'Change Passcode',
          description: 'Update your security passcode',
          type: 'button',
          action: handleChangePasscode,
        },
        {
          icon: <Eye className="w-5 h-5" />,
          label: 'Show Passcode',
          description: 'Display passcode on unlock screen',
          type: 'toggle',
          key: 'showPasscode',
        },
        {
          icon: <Shield className="w-5 h-5" />,
          label: 'Offline Mode',
          description: 'Use app without internet',
          type: 'toggle',
          key: 'offlineMode',
        },
      ],
    },
    {
      title: 'AI Features',
      items: [
        {
          icon: <SettingsIcon className="w-5 h-5" />,
          label: 'AI Insights',
          description: 'Enable Sarvam AI predictions',
          type: 'toggle',
          key: 'aiEnabled',
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          icon: <Trash2 className="w-5 h-5" />,
          label: 'Clear All Data',
          description: 'Delete all profiles and predictions',
          type: 'danger',
          action: handleClearAllData,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="genz-container py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <GenZButton variant="ghost" size="sm">
            <Link href="/profile" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
          </GenZButton>

          <GenZButton
            variant={saved ? 'primary' : 'outline'}
            size="sm"
            onClick={handleSaveSettings}
          >
            {saved ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </GenZButton>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <GenZBadge variant="neon" className="mb-4">
            ⚙️ Settings
          </GenZBadge>
          <h1 className="genz-title mb-4">Settings & Preferences</h1>
          <p className="text-xl text-white/80">Customize your cosmic experience</p>
        </motion.div>

        {/* Settings Sections */}
        <div className="max-w-3xl mx-auto space-y-8">
          {settingSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                {section.title}
              </h2>

              <GenZCard variant="glass">
                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors ${
                        itemIndex < section.items.length - 1 ? 'mb-2' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze flex items-center justify-center shadow-genz-glow">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium mb-1">{item.label}</p>
                          <p className="text-sm text-white/60">{item.description}</p>
                        </div>
                      </div>

                      {/* Toggle */}
                      {item.type === 'toggle' && item.key && (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[item.key as keyof typeof settings] as boolean}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                [item.key!]: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-genz-electric-blue peer-checked:to-genz-purple-haze"></div>
                        </label>
                      )}

                      {/* Select */}
                      {item.type === 'select' && item.key && item.options && (
                        <select
                          value={settings[item.key as keyof typeof settings] as string}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              [item.key!]: e.target.value,
                            }))
                          }
                          className="bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-genz-electric-blue"
                        >
                          {item.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Button */}
                      {item.type === 'button' && (
                        <GenZButton variant="outline" size="sm" onClick={item.action}>
                          Change
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </GenZButton>
                      )}

                      {/* Danger Button */}
                      {item.type === 'danger' && (
                        <GenZButton
                          variant="outline"
                          size="sm"
                          onClick={item.action}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          {showClearDataConfirm ? 'Confirm?' : 'Clear'}
                        </GenZButton>
                      )}
                    </div>
                  ))}
                </div>
              </GenZCard>
            </motion.div>
          ))}

          {/* App Info */}
          <GenZCard variant="neon" className="text-center">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-display font-bold text-white mb-2">
              BhriguWelt
            </h3>
            <p className="text-white/60 mb-2">Version 1.0.0</p>
            <GenZBadge variant="neon" size="sm">
              Powered by Sarvam AI
            </GenZBadge>
          </GenZCard>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
