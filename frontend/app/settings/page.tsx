'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Bell,
  Globe,
  Lock,
  Trash2,
  ArrowLeft,
  Save,
  ChevronRight,
  Shield,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import { applyHighContrast } from '@/lib/accessibility';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { useI18n } from '@/lib/context/I18nContext';

// Type definitions for settings items
type ToggleSettingItem = {
  icon: JSX.Element;
  label: string;
  description: string;
  type: 'toggle';
  key: string;
};

type SelectSettingItem = {
  icon: JSX.Element;
  label: string;
  description: string;
  type: 'select';
  key: string;
  options: { value: string; label: string }[];
};

type ButtonSettingItem = {
  icon: JSX.Element;
  label: string;
  description: string;
  type: 'button';
  action: () => void;
};

type DangerSettingItem = {
  icon: JSX.Element;
  label: string;
  description: string;
  type: 'danger';
  action: () => void;
};

type SettingItem = ToggleSettingItem | SelectSettingItem | ButtonSettingItem | DangerSettingItem;

type SettingSection = {
  title: string;
  items: SettingItem[];
};

export default function SettingsPage() {
  const router = useRouter();
  const { lock } = useEncryption();
  const { t, language, setLanguage, aiLanguage, setAiLanguage } = useI18n();
  const [settings, setSettings] = useState({
    notifications: true,
    dailyReminders: true,
    darkMode: true,
    language,
    aiLanguage,
    showPasscode: false,
    aiEnabled: true,
    offlineMode: false,
    highContrast: false,
  });
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage with error handling
    try {
      const savedSettings = localStorage.getItem('app_settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings((prev) => ({
            ...prev,
            ...parsedSettings,
          }));
          if (parsedSettings.language === 'en' || parsedSettings.language === 'hi' || parsedSettings.language === 'ar') {
            setLanguage(parsedSettings.language);
          }
          if (parsedSettings.aiLanguage === 'en' || parsedSettings.aiLanguage === 'hi' || parsedSettings.aiLanguage === 'sa') {
            setAiLanguage(parsedSettings.aiLanguage);
          }
        } catch (parseError) {
          console.error('Error parsing settings:', parseError);
          // Clear corrupted settings
          try {
            localStorage.removeItem('app_settings');
          } catch (removeError) {
            console.error('Error removing corrupted settings:', removeError);
          }
        }
      }
    } catch (storageError) {
      console.error('Error accessing localStorage:', storageError);
    }
  }, []);

  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      language,
      aiLanguage,
    }));
  }, [language, aiLanguage]);

  useEffect(() => {
    applyHighContrast(settings.highContrast);
  }, [settings.highContrast]);

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
      // Could show user-friendly error message here
    }
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

  const handleSelectChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (key === 'language' && (value === 'en' || value === 'hi' || value === 'ar')) {
      setLanguage(value);
    }

    if (key === 'aiLanguage' && (value === 'en' || value === 'hi' || value === 'sa')) {
      setAiLanguage(value);
    }
  };

  const settingSections: SettingSection[] = [
    {
      title: t('settings.sections.general'),
      items: [
        {
          icon: <Bell className="w-5 h-5" />,
          label: t('settings.items.notifications.label'),
          description: t('settings.items.notifications.description'),
          type: 'toggle',
          key: 'notifications',
        },
        {
          icon: <Bell className="w-5 h-5" />,
          label: t('settings.items.dailyReminders.label'),
          description: t('settings.items.dailyReminders.description'),
          type: 'toggle',
          key: 'dailyReminders',
        },
        {
          icon: <Globe className="w-5 h-5" />,
          label: t('settings.items.language.label'),
          description: t('settings.items.language.description'),
          type: 'select',
          key: 'language',
          options: [
            { value: 'en', label: t('settings.languageOptions.en') },
            { value: 'hi', label: t('settings.languageOptions.hi') },
            { value: 'ar', label: t('settings.languageOptions.ar') },
          ],
        },
      ],
    },
    {
      title: t('settings.sections.privacySecurity'),
      items: [
        {
          icon: <Lock className="w-5 h-5" />,
          label: t('settings.items.changePasscode.label'),
          description: t('settings.items.changePasscode.description'),
          type: 'button',
          action: handleChangePasscode,
        },
        {
          icon: <Eye className="w-5 h-5" />,
          label: t('settings.items.showPasscode.label'),
          description: t('settings.items.showPasscode.description'),
          type: 'toggle',
          key: 'showPasscode',
        },
        {
          icon: <Shield className="w-5 h-5" />,
          label: t('settings.items.offlineMode.label'),
          description: t('settings.items.offlineMode.description'),
          type: 'toggle',
          key: 'offlineMode',
        },
      ],
    },
    {
      title: t('settings.sections.accessibility'),
      items: [
        {
          icon: <Eye className="w-5 h-5" />,
          label: t('settings.items.highContrast.label'),
          description: t('settings.items.highContrast.description'),
          type: 'toggle',
          key: 'highContrast',
        },
      ],
    },
    {
      title: t('settings.sections.aiFeatures'),
      items: [
        {
          icon: <SettingsIcon className="w-5 h-5" />,
          label: t('settings.items.aiInsights.label'),
          description: t('settings.items.aiInsights.description'),
          type: 'toggle',
          key: 'aiEnabled',
        },
        {
          icon: <Globe className="w-5 h-5" />,
          label: t('settings.items.aiLanguage.label'),
          description: t('settings.items.aiLanguage.description'),
          type: 'select',
          key: 'aiLanguage',
          options: [
            { value: 'en', label: t('settings.aiLanguageOptions.en') },
            { value: 'hi', label: t('settings.aiLanguageOptions.hi') },
            { value: 'sa', label: t('settings.aiLanguageOptions.sa') },
          ],
        },
      ],
    },
    {
      title: t('settings.sections.dataManagement'),
      items: [
        {
          icon: <Trash2 className="w-5 h-5" />,
          label: t('settings.items.clearAllData.label'),
          description: t('settings.items.clearAllData.description'),
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
              {t('settings.back')}
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
                {t('settings.saved')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('settings.save')}
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
            {t('settings.badge')}
          </GenZBadge>
          <h1 className="genz-title mb-4">{t('settings.title')}</h1>
          <p className="text-xl text-white/80">{t('settings.subtitle')}</p>
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
                      {item.type === 'select' && item.key && 'options' in item && item.options && (
                        <select
                          value={settings[item.key as keyof typeof settings] as string}
                          onChange={(e) => handleSelectChange(item.key!, e.target.value)}
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
                          {t('settings.buttons.change')}
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
                          {showClearDataConfirm
                            ? t('settings.buttons.confirm')
                            : t('settings.buttons.clear')}
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
            {t('settings.appInfo.appName')}
          </h3>
          <p className="text-white/60 mb-2">{t('settings.appInfo.version')}</p>
          <GenZBadge variant="neon" size="sm">
            {t('settings.appInfo.poweredBy')}
          </GenZBadge>
        </GenZCard>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
