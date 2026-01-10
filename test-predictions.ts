#!/usr/bin/env tsx
/**
 * Comprehensive Prediction Engine Test
 * Tests all prediction engines with different dive levels
 */

import { generatePresentLifePrediction } from './frontend/lib/engines/presentLifeEngine';
import { generateFutureLivesPrediction } from './frontend/lib/engines/futureLivesEngine';
import { generatePastLivesPrediction } from './frontend/lib/engines/pastLivesEngine';
import type { ChartData } from './frontend/lib/api/predictions';

// Sample birth chart data for testing
const sampleChartData: ChartData = {
  date_of_birth: '1990-05-15',
  time_of_birth: '14:30',
  place_of_birth: 'New Delhi, India',
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: 'Asia/Kolkata',
  zodiac_sign: 'Taurus',
  moon_sign: 'Scorpio',
  ascendant: 'Virgo',
  nakshatra: 'Anuradha',
  planets: {
    Sun: { sign: 'Taurus', longitude: 52.5 },
    Moon: { sign: 'Scorpio', longitude: 220.3 },
    Mars: { sign: 'Pisces', longitude: 350.2 },
    Mercury: { sign: 'Gemini', longitude: 75.8 },
    Jupiter: { sign: 'Cancer', longitude: 105.4 },
    Venus: { sign: 'Aries', longitude: 25.7 },
    Saturn: { sign: 'Capricorn', longitude: 290.1 },
    Rahu: { sign: 'Aquarius', longitude: 315.6 },
    Ketu: { sign: 'Leo', longitude: 135.6 },
  },
  houses: ['Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo'],
  dasha_period: {
    maha_dasha: 'Venus',
    years_remaining: 12.5,
    antar_dasha: 'Mars',
  },
};

async function testPredictionEngine(
  engineName: string,
  testFn: () => Promise<any>,
  diveLevel: 'basic' | 'intermediate' | 'comprehensive'
): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing ${engineName} - ${diveLevel.toUpperCase()} dive level`);
  console.log('='.repeat(80));

  try {
    const startTime = Date.now();
    const result = await testFn();
    const duration = Date.now() - startTime;

    console.log(`✅ Success: ${result.title}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`🔧 Mode: ${result.mode || 'N/A'}`);
    console.log(`🤖 AI Enhanced: ${result.metadata?.ai_enhanced ? 'Yes' : 'No'}`);
    console.log(`📚 Subcategories: ${Object.keys(result.subcategories).length}`);

    // Display subcategory titles
    console.log('\n📋 Subcategories:');
    Object.entries(result.subcategories).forEach(([key, sub]: [string, any]) => {
      console.log(`   - ${sub.title}`);
    });

    if (result.error) {
      console.log(`\n⚠️  Error: ${result.error}`);
    }

    // Check if appropriate dive level sections are present
    const hasDeeper = 'deeper_analysis' in result.subcategories;
    const hasDeepest = 'deepest_insights' in result.subcategories;

    console.log(`\n🔍 Dive Level Verification:`);
    console.log(`   Expected: ${diveLevel}`);
    console.log(`   Has Deeper Analysis: ${hasDeeper ? 'Yes' : 'No'} ${(diveLevel === 'intermediate' || diveLevel === 'comprehensive') && hasDeeper ? '✅' : diveLevel === 'basic' && !hasDeeper ? '✅' : '❌'}`);
    console.log(`   Has Deepest Insights: ${hasDeepest ? 'Yes' : 'No'} ${diveLevel === 'comprehensive' && hasDeepest ? '✅' : diveLevel !== 'comprehensive' && !hasDeepest ? '✅' : '❌'}`);

    return;
  } catch (error) {
    console.error(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(`\nStack trace:\n${error.stack}`);
    }
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Prediction Engine Tests');
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log(`\n🧪 Sample Chart Data:`);
  console.log(`   Birth Date: ${sampleChartData.date_of_birth}`);
  console.log(`   Moon Sign: ${sampleChartData.moon_sign}`);
  console.log(`   Ascendant: ${sampleChartData.ascendant}`);
  console.log(`   Nakshatra: ${sampleChartData.nakshatra}`);

  const testResults: { engine: string; diveLevel: string; success: boolean; duration: number }[] = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // Test configurations
  const engines = [
    {
      name: 'Present Life Engine',
      testFn: (level: 'basic' | 'intermediate' | 'comprehensive') =>
        generatePresentLifePrediction(sampleChartData, {
          mode: 'offline',
          useAI: false,
          diveLevel: level,
        }),
    },
    {
      name: 'Future Lives Engine',
      testFn: (level: 'basic' | 'intermediate' | 'comprehensive') =>
        generateFutureLivesPrediction(sampleChartData, {
          mode: 'offline',
          useAI: false,
          diveLevel: level,
        }),
    },
    {
      name: 'Past Lives Engine',
      testFn: (level: 'basic' | 'intermediate' | 'comprehensive') =>
        generatePastLivesPrediction(sampleChartData, {
          mode: 'offline',
          aiEnabled: false,
          diveLevel: level,
        }),
    },
  ];

  const diveLevels: Array<'basic' | 'intermediate' | 'comprehensive'> = ['basic', 'intermediate', 'comprehensive'];

  // Run tests for each engine at each dive level
  for (const engine of engines) {
    for (const diveLevel of diveLevels) {
      totalTests++;
      const startTime = Date.now();

      try {
        await testPredictionEngine(engine.name, () => engine.testFn(diveLevel), diveLevel);
        passedTests++;
        testResults.push({
          engine: engine.name,
          diveLevel,
          success: true,
          duration: Date.now() - startTime,
        });
      } catch (error) {
        failedTests++;
        testResults.push({
          engine: engine.name,
          diveLevel,
          success: false,
          duration: Date.now() - startTime,
        });
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Print summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

  console.log(`\n📋 Detailed Results:`);
  console.log('┌─────────────────────────────┬───────────────┬─────────┬────────────┐');
  console.log('│ Engine                      │ Dive Level    │ Status  │ Duration   │');
  console.log('├─────────────────────────────┼───────────────┼─────────┼────────────┤');

  testResults.forEach(result => {
    const engine = result.engine.padEnd(27);
    const level = result.diveLevel.padEnd(13);
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = `${result.duration}ms`.padStart(10);
    console.log(`│ ${engine} │ ${level} │ ${status}  │ ${duration} │`);
  });

  console.log('└─────────────────────────────┴───────────────┴─────────┴────────────┘');

  if (failedTests > 0) {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Please review the errors above.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All tests passed successfully!`);
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal Error:', error);
  process.exit(1);
});
