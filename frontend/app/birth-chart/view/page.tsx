'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Moon, Sun, ArrowLeft, MessageSquare, Eye, Download, Share2, Printer } from 'lucide-react';
import Link from 'next/link';
import AnimatedBackground, { FloatingElements } from '../../components/AnimatedBackground';
import GenZCard from '../../components/GenZCard';
import GenZBadge from '../../components/GenZBadge';
import GenZButton from '../../components/GenZButton';
import BottomNav from '../../components/BottomNav';
import BirthChartVisualization from '../../components/BirthChartVisualization';
import AIChatInterface from '../../components/AIChatInterface';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { STORES } from '@/lib/storage';
import { getItemSafe } from '@/lib/storage-safe';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { useRouter } from 'next/navigation';
import { astrologyAPI } from '@/lib/api';
import ErrorBoundary from '../../components/ErrorBoundary';
import { PDFGenerator, downloadBirthChartPDF, type BirthData, type ChartData as PDFChartData, type Interpretation } from '@/lib/export/pdfGenerator';
import { ShareUtils, showShareSuccess, showShareError } from '@/lib/export/shareUtils';

export default function BirthChartViewPage() {
  const [chartData, setChartData] = useState<any>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'details' | 'interpretation'>('chart');
  const [missingChart, setMissingChart] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);
  const [loadingChart, setLoadingChart] = useState(true);
  const [chartSize, setChartSize] = useState(600);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [sharingChart, setSharingChart] = useState(false);
  const [printingChart, setPrintingChart] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const router = useRouter();
  const zodiacSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];

  // Redirect to passcode setup if encryption not configured
  useEffect(() => {
    if (!encryptionLoading && !isSetup) {
      router.push('/setup-passcode');
    }
  }, [encryptionLoading, isSetup, router]);

  // Redirect to unlock if not unlocked
  useEffect(() => {
    if (!encryptionLoading && isSetup && !isUnlocked) {
      router.push('/unlock');
    }
  }, [encryptionLoading, isSetup, isUnlocked, router]);

  // Load birth chart data from encrypted storage
  useEffect(() => {
    if (encryptionKey) {
      loadChartData();
    }
  }, [encryptionKey]);

  useEffect(() => {
    const updateChartSize = () => {
      const viewportWidth = window.innerWidth;
      const nextSize = Math.min(600, Math.max(280, viewportWidth - 80));
      setChartSize(nextSize);
    };
    updateChartSize();
    window.addEventListener('resize', updateChartSize);
    return () => window.removeEventListener('resize', updateChartSize);
  }, []);

  const loadChartData = async () => {
    if (!encryptionKey) return;

    try {
      setLoadingChart(true);
      const profile = await loadCurrentProfile(encryptionKey);

      // Store profile for export/share operations
      if (profile) {
        setCurrentProfile(profile);
      }

      // Try API first if profile exists
      if (profile) {
        try {
          // Build request data - only include coordinates if both are valid numbers
          const requestData: any = {
            date_of_birth: profile.dateOfBirth,
            time_of_birth: profile.timeOfBirth,
            place_of_birth: profile.placeOfBirth,
          };

          // Only add coordinates if both are present and are valid numbers
          if (
            typeof profile.latitude === 'number' &&
            typeof profile.longitude === 'number' &&
            !isNaN(profile.latitude) &&
            !isNaN(profile.longitude)
          ) {
            requestData.latitude = profile.latitude;
            requestData.longitude = profile.longitude;
          }

          const response = await astrologyAPI.calculateBirthChart(requestData);

          if (response && response.data) {
            setChartData(response.data);
            setMissingChart(false);
            return;
          }
        } catch (apiError: any) {
          console.warn('API call failed, trying stored data:', apiError);
          // Log detailed error for debugging
          if (apiError.response?.data) {
            console.error('API error details:', apiError.response.data);
          }
        }
      }

      // Try stored report
      const report = await getItemSafe(STORES.REPORTS, 'current_birth_chart', encryptionKey);
      if (report?.data) {
        setChartData(report.data);
        setMissingChart(false);
        return;
      }

      if (report?.id && !report?.data) {
        const fullReport = await getItemSafe(STORES.REPORTS, report.id, encryptionKey);
        if (fullReport?.data) {
          setChartData(fullReport.data);
          setMissingChart(false);
          return;
        }
      }

      if (profile) {
        console.warn('Birth chart missing, falling back to demo data for display.');
        setUsingDemo(true);
        setChartData({
          ascendant: 'Aries',
          zodiac_sign: 'Leo',
          moon_sign: 'Taurus',
          nakshatra: 'Rohini',
          planets: [
            { name: 'Sun', position: 120, sign: 'Leo', house: 5, retrograde: false },
            { name: 'Moon', position: 45, sign: 'Taurus', house: 2, retrograde: false },
            { name: 'Mercury', position: 135, sign: 'Virgo', house: 6, retrograde: true },
            { name: 'Venus', position: 200, sign: 'Libra', house: 7, retrograde: false },
            { name: 'Mars', position: 90, sign: 'Cancer', house: 4, retrograde: false },
            { name: 'Jupiter', position: 270, sign: 'Capricorn', house: 10, retrograde: false },
            { name: 'Saturn', position: 315, sign: 'Aquarius', house: 11, retrograde: false },
            { name: 'Rahu', position: 180, sign: 'Libra', house: 7, retrograde: false },
            { name: 'Ketu', position: 0, sign: 'Aries', house: 1, retrograde: false },
          ],
          houses: Array.from({ length: 12 }, (_, i) => i * 30),
        });
        setMissingChart(false);
      } else {
        setMissingChart(true);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      setMissingChart(true);
    } finally {
      setLoadingChart(false);
    }
  };

  // Show loading while checking encryption status
  if (encryptionLoading || loadingChart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-white text-xl">Loading your cosmic blueprint...</div>
      </div>
    );
  }

  if (missingChart) {
    return (
      <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
        <AnimatedBackground />
        <FloatingElements />
        <div className="genz-container py-8 relative z-10">
          <GenZCard variant="glass" className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Create your birth chart</h2>
            <p className="text-white/80 mb-6">
              We couldn’t find a chart yet. Let’s create one so your insights stay personalized.
            </p>
            <Link href="/birth-chart/create">
              <GenZButton variant="primary">Create Birth Chart</GenZButton>
            </Link>
          </GenZCard>
        </div>
        <BottomNav />
      </div>
    );
  }

  const resolveAscendant = (data: any): string => {
    if (!data?.ascendant) return 'Aries';
    if (typeof data.ascendant === 'string') return data.ascendant;
    return data.ascendant?.sign ?? data.ascendant?.name ?? 'Aries';
  };

  const resolveZodiacSign = (data: any): string => {
    if (!data?.zodiac_sign) return 'Leo';
    if (typeof data.zodiac_sign === 'string') return data.zodiac_sign;
    return data.zodiac_sign?.sign ?? data.zodiac_sign?.name ?? 'Leo';
  };

  const resolveMoonSign = (data: any): string => {
    if (!data?.moon_sign) return 'Taurus';
    if (typeof data.moon_sign === 'string') return data.moon_sign;
    return data.moon_sign?.sign ?? data.moon_sign?.name ?? 'Taurus';
  };

  const getPositionFromPlanet = (planet: any): number | null => {
    if (!planet || typeof planet !== 'object') return null;
    if (typeof planet.position === 'number') return planet.position;
    if (typeof planet.longitude === 'number') return planet.longitude;
    if (typeof planet.degree === 'number') return planet.degree;
    if (typeof planet.degree_in_sign === 'number' && typeof planet.sign === 'string') {
      const signIndex = zodiacSigns.indexOf(planet.sign);
      if (signIndex >= 0) {
        return signIndex * 30 + planet.degree_in_sign;
      }
    }
    return null;
  };

  const getHouseFromSign = (sign?: string, houses?: string[]): number | null => {
    if (!sign || !houses?.length) return null;
    const index = houses.findIndex((houseSign) => houseSign === sign);
    return index >= 0 ? index + 1 : null;
  };

  // Defensive normalization for planets data - prevents UI crashes from various data shapes
  // Handles: array, object with planets, nested structures, and undefined/null
  const planetsRaw = chartData?.planets ?? chartData?.chart?.planets ?? chartData?.planets_data ?? [];
  const housesRaw = Array.isArray(chartData?.houses) ? chartData.houses : [];
  const houses = housesRaw.every((house: any) => typeof house === 'string') ? (housesRaw as string[]) : [];
  const planetsArray = Array.isArray(planetsRaw)
    ? planetsRaw
    : (planetsRaw && typeof planetsRaw === 'object' ? Object.entries(planetsRaw) : []);
  const planetDetails = planetsArray
    .map((entry: any) => {
      if (Array.isArray(entry) && entry.length === 2) {
        const [name, value] = entry;
        return { name, ...value };
      }
      return entry;
    })
    .map((planet: any) => {
      if (!planet || typeof planet !== 'object') return null;
      const name = planet.name ?? planet.planet ?? planet.key;
      if (!name) return null;
      const position = getPositionFromPlanet(planet);
      if (typeof position !== 'number' || Number.isNaN(position)) return null;
      const sign = typeof planet.sign === 'string' ? planet.sign : 'Unknown';
      const house = typeof planet.house === 'number'
        ? planet.house
        : (getHouseFromSign(sign, houses) ?? undefined);
      return {
        ...planet,
        name,
        position,
        sign,
        house,
      };
    })
    .filter((planet: any) => Boolean(planet));

  const resolvedAscendant = resolveAscendant(chartData);
  const resolvedZodiacSign = resolveZodiacSign(chartData);
  const resolvedMoonSign = resolveMoonSign(chartData);

  /**
   * Export birth chart as PDF
   */
  const handleExportPDF = async () => {
    if (!currentProfile || !chartData) {
      showShareError('No birth chart data available to export');
      return;
    }

    try {
      setExportingPDF(true);

      // Prepare birth data
      const birthData: BirthData = {
        name: currentProfile.name || 'Unknown',
        dateOfBirth: currentProfile.dateOfBirth || '',
        timeOfBirth: currentProfile.timeOfBirth || '',
        placeOfBirth: currentProfile.placeOfBirth || '',
        latitude: currentProfile.latitude,
        longitude: currentProfile.longitude,
        timezone: currentProfile.timezone,
      };

      // Prepare chart data for PDF
      const pdfChartData: PDFChartData = {
        sun: chartData.sun || chartData.planets?.find((p: any) => p.name === 'Sun'),
        moon: chartData.moon || chartData.planets?.find((p: any) => p.name === 'Moon'),
        ascendant: {
          sign: resolvedAscendant,
          degree: chartData.ascendant?.degree || 0,
        },
        planets: planetDetails.map((planet: any) => ({
          name: planet.name,
          sign: planet.sign,
          house: planet.house,
          degree: planet.position || 0,
          retrograde: planet.retrograde,
        })),
        houses: chartData.houses,
        dashas: chartData.dashas,
        yogas: chartData.yogas,
      };

      // Prepare interpretations
      const pdfInterpretations: Interpretation[] = [
        {
          category: 'Sun Sign',
          title: resolvedZodiacSign,
          content: interpretations.sun,
          confidence: 0.95,
          sources: ['Vedic Astrology Core Principles'],
        },
        {
          category: 'Moon Sign',
          title: resolvedMoonSign,
          content: interpretations.moon,
          confidence: 0.95,
          sources: ['Vedic Astrology Core Principles'],
        },
        {
          category: 'Ascendant',
          title: resolvedAscendant,
          content: interpretations.ascendant,
          confidence: 0.95,
          sources: ['Vedic Astrology Core Principles'],
        },
        {
          category: 'Overall Analysis',
          title: 'Birth Chart Summary',
          content: interpretations.overall,
          confidence: 0.90,
          sources: ['Bhrigu Samhita', 'Nadi Jyotisha'],
        },
      ];

      // Generate and download PDF
      await downloadBirthChartPDF(birthData, pdfChartData, pdfInterpretations, {
        includeChartImage: true,
        includePlanets: true,
        includeHouses: true,
        includeDashas: true,
        includeYogas: true,
        includeInterpretations: true,
        includeCitations: true,
        onProgress: (progress, message) => {
          console.log(`PDF Export: ${progress}% - ${message}`);
        },
      });

      showShareSuccess('download');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showShareError(error instanceof Error ? error.message : 'Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  /**
   * Share birth chart using native share or clipboard
   */
  const handleShareChart = async () => {
    if (!currentProfile || !chartData) {
      showShareError('No birth chart data available to share');
      return;
    }

    try {
      setSharingChart(true);

      const shareTitle = `${currentProfile.name}'s Birth Chart - BhriguWelt`;
      const shareContent = `
Birth Chart Analysis for ${currentProfile.name}

Born: ${currentProfile.dateOfBirth} at ${currentProfile.timeOfBirth}
Place: ${currentProfile.placeOfBirth}

Key Points:
• Sun Sign: ${resolvedZodiacSign}
• Moon Sign: ${resolvedMoonSign}
• Ascendant: ${resolvedAscendant}

${interpretations.overall}

Generated by BhriguWelt - Your AI-powered Vedic Astrology companion
      `.trim();

      const result = await ShareUtils.sharePrediction(
        {
          title: shareTitle,
          content: shareContent,
          birthData: {
            name: currentProfile.name,
            dateOfBirth: currentProfile.dateOfBirth,
            timeOfBirth: currentProfile.timeOfBirth,
            placeOfBirth: currentProfile.placeOfBirth,
          },
        },
        {
          includeLink: true,
          onSuccess: (method) => {
            showShareSuccess(method);
          },
          onError: (error) => {
            showShareError(error);
          },
        }
      );

      if (!result.success && result.error) {
        showShareError(result.error);
      }
    } catch (error) {
      console.error('Error sharing chart:', error);
      showShareError(error instanceof Error ? error.message : 'Failed to share chart');
    } finally {
      setSharingChart(false);
    }
  };

  /**
   * Print birth chart with optimized layout
   */
  const handlePrintChart = async () => {
    if (!currentProfile || !chartData) {
      showShareError('No birth chart data available to print');
      return;
    }

    try {
      setPrintingChart(true);

      const printData = {
        title: `${currentProfile.name}'s Birth Chart`,
        content: `
${interpretations.overall}

Sun Sign Interpretation:
${interpretations.sun}

Moon Sign Interpretation:
${interpretations.moon}

Ascendant Interpretation:
${interpretations.ascendant}

Strengths & Natural Gifts:
${interpretations.strengths.map((s: string) => `• ${s}`).join('\n')}

Growth Areas:
${interpretations.growth.map((g: string) => `• ${g}`).join('\n')}
        `.trim(),
        birthData: {
          name: currentProfile.name,
          dateOfBirth: currentProfile.dateOfBirth,
          timeOfBirth: currentProfile.timeOfBirth,
          placeOfBirth: currentProfile.placeOfBirth,
        },
      };

      const result = await ShareUtils.printPrediction(printData, {
        onBeforePrint: () => {
          console.log('Opening print dialog...');
        },
        onAfterPrint: () => {
          console.log('Print dialog closed');
          showShareSuccess('print');
        },
        onError: (error) => {
          showShareError(error);
        },
      });

      if (!result.success && result.error) {
        showShareError(result.error);
      }
    } catch (error) {
      console.error('Error printing chart:', error);
      showShareError(error instanceof Error ? error.message : 'Failed to print chart');
    } finally {
      setPrintingChart(false);
    }
  };

  const interpretations = {
    sun: `Your Sun in ${resolvedZodiacSign || 'Leo'} reveals your core essence and life force. This placement highlights where you are meant to lead, create, and express your authentic self. When you align with this energy, you feel energized, confident, and capable of inspiring others. The Sun also speaks to your sense of purpose—what you naturally gravitate toward when you want to feel alive and fulfilled.`,
    moon: `Your Moon in ${resolvedMoonSign || 'Taurus'} describes your emotional needs, intuitive rhythms, and how you restore balance. This placement indicates the kind of environment that helps you feel safe, loved, and grounded. It also highlights how you process stress and what comforts you most during transitions. By honoring your Moon sign, you strengthen your inner resilience and emotional clarity.`,
    ascendant: `${resolvedAscendant || 'Aries'} rising shapes your first impressions, life approach, and the lens through which people experience you. This placement signals how you move through new situations, the way you initiate action, and the persona you wear in public. It also influences your physical presence, style, and your instinctive response to opportunities.`,
    overall: `Your birth chart reveals a multidimensional blueprint that blends destiny (the karmic themes you carry), free will (the choices you make), and timing (the cycles that activate growth). Together, your Sun, Moon, and Ascendant create a signature of purpose, emotional intelligence, and outward expression. Understanding this alignment helps you navigate relationships, career, and spiritual evolution with clarity and confidence.`,
    strengths: [
      `Natural talents in ${resolvedZodiacSign || 'your Sun sign'} themes such as leadership, creativity, and authentic self-expression.`,
      `Emotional steadiness through ${resolvedMoonSign || 'your Moon sign'}—you can anchor others when life feels uncertain.`,
      `A proactive outer style shaped by ${resolvedAscendant || 'your Ascendant'}, helping you initiate change.`,
    ],
    growth: [
      'Balance self-expression with patience so your gifts are received with trust.',
      'Protect your energy by building restorative rituals and quiet reflection time.',
      'Stay open to feedback when major cycles activate new responsibilities.',
    ],
    focusAreas: [
      'Career and calling: align daily work with your long-term soul purpose.',
      'Relationships: communicate needs clearly and create emotional safety.',
      'Spiritual practices: integrate meditation, mantra, or breathwork for balance.',
    ],
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
        <AnimatedBackground />
        <FloatingElements />

        <div className="genz-container py-8 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <GenZButton variant="ghost" size="sm">
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                Back
              </Link>
            </GenZButton>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <GenZBadge variant="neon" size="lg" className="mb-6">
              ✨ Birth Chart
            </GenZBadge>
            <h1 className="genz-title mb-4">
              Your Cosmic Blueprint
            </h1>
            <p className="text-xl text-white/80">
              Explore the planetary positions at your birth
            </p>
            {usingDemo && (
              <p className="text-sm text-genz-electric-blue mt-4">
                Showing a demo chart while we sync your saved data.
              </p>
            )}
          </motion.div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            <GenZButton
              variant={showAIChat ? 'primary' : 'outline'}
              size="lg"
              onClick={() => setShowAIChat(!showAIChat)}
              className="group"
            >
              <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {showAIChat ? 'Hide' : 'Ask'} AI Guide
            </GenZButton>
            <GenZButton
              variant="outline"
              size="lg"
              onClick={handleExportPDF}
              disabled={exportingPDF || !currentProfile}
              className="group"
            >
              <Download className={`w-5 h-5 ${exportingPDF ? 'animate-bounce' : 'group-hover:translate-y-1'} transition-transform`} />
              {exportingPDF ? 'Generating...' : 'Export PDF'}
            </GenZButton>
            <GenZButton
              variant="outline"
              size="lg"
              onClick={handleShareChart}
              disabled={sharingChart || !currentProfile}
              className="group"
            >
              <Share2 className={`w-5 h-5 ${sharingChart ? 'animate-spin' : 'group-hover:scale-110'} transition-transform`} />
              {sharingChart ? 'Sharing...' : 'Share'}
            </GenZButton>
            <GenZButton
              variant="outline"
              size="lg"
              onClick={handlePrintChart}
              disabled={printingChart || !currentProfile}
              className="group"
            >
              <Printer className={`w-5 h-5 ${printingChart ? 'animate-pulse' : 'group-hover:rotate-12'} transition-transform`} />
              {printingChart ? 'Printing...' : 'Print'}
            </GenZButton>
          </div>

          {/* AI Chat Interface */}
          <AnimatePresence>
            {showAIChat && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-12"
              >
                <div className="h-[600px]">
                  <AIChatInterface
                    birthChartData={chartData}
                    context="birth-chart"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 overflow-x-auto">
            {['chart', 'details', 'interpretation'].map((tab) => (
              <GenZButton
                key={tab}
                variant={activeTab === tab ? 'primary' : 'ghost'}
                size="md"
                onClick={() => setActiveTab(tab as any)}
                className="capitalize"
              >
                {tab === 'chart' && <Eye className="w-4 h-4 mr-2" />}
                {tab === 'details' && <Star className="w-4 h-4 mr-2" />}
                {tab === 'interpretation' && <Sparkles className="w-4 h-4 mr-2" />}
                {tab}
              </GenZButton>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'chart' && (
              <motion.div
                key="chart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-12"
              >
                <BirthChartVisualization chartData={chartData} size={chartSize} />
              </motion.div>
            )}

            {activeTab === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h2 className="genz-heading mb-8 text-center">
                  Planetary Positions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {planetDetails.map((planet: any, index: number) => (
                    <GenZCard key={index} variant="glass" className="group">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="w-16 h-16 rounded-2xl bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze flex items-center justify-center shadow-genz-glow"
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                        >
                          {planet.name === 'Sun' && <Sun className="w-8 h-8" />}
                          {planet.name === 'Moon' && <Moon className="w-8 h-8" />}
                          {!['Sun', 'Moon'].includes(planet.name) && <Star className="w-8 h-8" />}
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-display font-bold text-white group-hover:text-genz-electric-blue transition-colors">
                              {planet.name}
                            </h3>
                            {planet.retrograde && (
                              <GenZBadge variant="neon" size="sm">R</GenZBadge>
                            )}
                          </div>
                          <p className="text-white/70">
                            {planet.sign ?? 'Unknown'} • House {planet.house ? planet.house : '—'}
                          </p>
                          <p className="text-genz-electric-blue text-sm mt-1">
                            {Number.isFinite(planet.position) ? `${planet.position.toFixed(2)}°` : '—'}
                          </p>
                        </div>
                      </div>
                    </GenZCard>
                  ))}
                </div>

                {/* Key Points */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <GenZCard variant="gradient" className="text-center">
                    <Sun className="w-12 h-12 mx-auto mb-4 text-genz-cyber-yellow" />
                    <h3 className="text-xl font-bold text-white mb-2">Sun Sign</h3>
                    <p className="text-2xl font-display font-bold bg-gradient-to-r from-genz-electric-blue to-genz-hot-pink bg-clip-text text-transparent">
                      {resolvedZodiacSign}
                    </p>
                  </GenZCard>

                  <GenZCard variant="gradient" className="text-center">
                    <Moon className="w-12 h-12 mx-auto mb-4 text-genz-purple-haze" />
                    <h3 className="text-xl font-bold text-white mb-2">Moon Sign</h3>
                    <p className="text-2xl font-display font-bold bg-gradient-to-r from-genz-electric-blue to-genz-hot-pink bg-clip-text text-transparent">
                      {resolvedMoonSign}
                    </p>
                  </GenZCard>

                  <GenZCard variant="gradient" className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-genz-mint-fresh" />
                    <h3 className="text-xl font-bold text-white mb-2">Ascendant</h3>
                    <p className="text-2xl font-display font-bold bg-gradient-to-r from-genz-electric-blue to-genz-hot-pink bg-clip-text text-transparent">
                      {resolvedAscendant}
                    </p>
                  </GenZCard>
                </div>
              </motion.div>
            )}

            {activeTab === 'interpretation' && (
              <motion.div
                key="interpretation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <GenZCard variant="glass">
                  <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-cyber-yellow to-genz-sunset-orange flex items-center justify-center shadow-genz-glow flex-shrink-0">
                      <Sun className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white mb-3">Sun Sign Interpretation</h3>
                      <p className="text-white/80 leading-relaxed">{interpretations.sun}</p>
                    </div>
                  </div>
                </GenZCard>

                <GenZCard variant="glass">
                  <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-purple-haze to-genz-lavender-dream flex items-center justify-center shadow-genz-glow flex-shrink-0">
                      <Moon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white mb-3">Moon Sign Interpretation</h3>
                      <p className="text-white/80 leading-relaxed">{interpretations.moon}</p>
                    </div>
                  </div>
                </GenZCard>

                <GenZCard variant="glass">
                  <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-electric-blue to-genz-mint-fresh flex items-center justify-center shadow-genz-glow flex-shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white mb-3">Ascendant Interpretation</h3>
                      <p className="text-white/80 leading-relaxed">{interpretations.ascendant}</p>
                    </div>
                  </div>
                </GenZCard>

                <GenZCard variant="glass">
                  <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-neon-green to-genz-mint-fresh flex items-center justify-center shadow-genz-glow flex-shrink-0">
                      <Star className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white mb-3">Strengths & Natural Gifts</h3>
                      <ul className="space-y-2 text-white/80 leading-relaxed list-disc list-inside">
                        {interpretations.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </GenZCard>

                <GenZCard variant="glass">
                  <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-hot-pink to-genz-coral-pop flex items-center justify-center shadow-genz-glow flex-shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white mb-3">Growth Areas</h3>
                      <ul className="space-y-2 text-white/80 leading-relaxed list-disc list-inside">
                        {interpretations.growth.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </GenZCard>

                <GenZCard variant="gradient">
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-display font-bold text-white">Overall Chart Analysis</h3>
                    <p className="text-white/90 leading-relaxed text-lg">{interpretations.overall}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                      {interpretations.focusAreas.map((focus) => (
                        <div key={focus} className="bg-white/10 rounded-2xl p-4 border border-white/10">
                          <p className="text-white/80 text-sm leading-relaxed">{focus}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </GenZCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <BottomNav />
      </div>
    </ErrorBoundary>
  );
}
