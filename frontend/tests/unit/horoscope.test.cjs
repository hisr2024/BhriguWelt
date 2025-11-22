const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '../..');

require.extensions['.ts'] = function (module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const rewritten = source.replace(/from ['"]@\/([^'\"]+)['"]/g, (_, p1) => {
    const targetPath = path.join(projectRoot, `${p1}.ts`);
    return `from "${targetPath}"`;
  });

  const { outputText } = ts.transpileModule(rewritten, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
    fileName: filename,
  });

  return module._compile(outputText, filename);
};

const { generateNatalChart } = require(path.join(projectRoot, 'lib/natal.ts'));
const { interpretChart, getElementBalance } = require(path.join(projectRoot, 'lib/interpretChart.ts'));

const mockChart = {
  metadata: {
    name: 'Mock User',
    date_of_birth: '2000-01-01',
    time_of_birth: '12:00',
    place_of_birth: 'Test City',
    timezone: 'UTC+00:00',
    calendar: {
      gregorian: '2000-01-01T12:00:00.000Z',
      bharat_traditional: 'Mock',
    },
  },
  chart: {
    ascendant: {
      sign: 'Aries',
      degree: 12.5,
    },
    houses: Array.from({ length: 12 }, (_, idx) => ({
      number: idx + 1,
      sign: ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][idx],
      start_degree: idx * 30,
    })),
    planets: [
      { name: 'Sun', sign: 'Aries', house: 1, degree: 5, retrograde: false },
      { name: 'Moon', sign: 'Taurus', house: 2, degree: 10, retrograde: false },
      { name: 'Mercury', sign: 'Gemini', house: 3, degree: 15, retrograde: false },
      { name: 'Venus', sign: 'Cancer', house: 4, degree: 20, retrograde: false },
      { name: 'Mars', sign: 'Leo', house: 5, degree: 25, retrograde: false },
      { name: 'Jupiter', sign: 'Virgo', house: 6, degree: 3, retrograde: true },
      { name: 'Saturn', sign: 'Libra', house: 7, degree: 8, retrograde: false },
      { name: 'Rahu', sign: 'Scorpio', house: 8, degree: 13, retrograde: true },
      { name: 'Ketu', sign: 'Sagittarius', house: 9, degree: 18, retrograde: false },
    ],
  },
};

const requiredPlanetNames = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Rahu','Ketu'];

const sampleBirthDetails = {
  name: 'Test User',
  dateOfBirth: '1990-04-15',
  timeOfBirth: '08:30',
  placeOfBirth: 'Sample City',
};

test('generateNatalChart returns structured chart with all planets and houses', async () => {
  const chart = await generateNatalChart(sampleBirthDetails);

  assert.ok(chart.metadata.name, 'metadata name is present');
  assert.ok(chart.metadata.timezone, 'timezone is present');
  assert.equal(chart.chart.houses.length, 12, 'includes 12 houses');
  assert.equal(chart.chart.planets.length, 9, 'includes 9 planets');

  const houseNumbers = new Set(chart.chart.houses.map((house) => house.number));
  assert.equal(houseNumbers.size, 12, 'houses cover all 12 numbers');

  const planetNames = new Set(chart.chart.planets.map((planet) => planet.name));
  requiredPlanetNames.forEach((name) => assert.ok(planetNames.has(name), `planet ${name} is present`));
});

test('interpretChart always includes disclaimer line', () => {
  const interpretation = interpretChart({ chart: mockChart });
  assert.ok(
    interpretation.includes('Note: These interpretations are symbolic and reflective, not fixed predictions.'),
    'disclaimer is included'
  );
});

test('interpretChart omits past and future life sections for minors', () => {
  const minorInterpretation = interpretChart({ chart: mockChart, isMinor: true });
  const adultInterpretation = interpretChart({ chart: mockChart, isMinor: false });

  assert.ok(!minorInterpretation.includes('Symbolic Past-Life Insight'), 'minor interpretation omits past-life section');
  assert.ok(!minorInterpretation.includes('Symbolic Future Direction'), 'minor interpretation omits future-life section');

  assert.ok(adultInterpretation.includes('Symbolic Past-Life Insight'), 'adult interpretation includes past-life section');
  assert.ok(adultInterpretation.includes('Symbolic Future Direction'), 'adult interpretation includes future-life section');
});

test('getElementBalance tallies planets by element', () => {
  const balance = getElementBalance(mockChart);
  assert.deepEqual(balance, { fire: 3, earth: 2, air: 2, water: 2 });
});
