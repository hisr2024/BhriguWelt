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
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  });

  return module._compile(outputText, filename);
};

const { translations, LANGUAGE_OPTIONS, accessibilityKeys } = require(path.join(projectRoot, 'lib/i18n-data.ts'));

const expectedLanguages = new Set(['en', 'hi', 'es', 'ta']);
const requiredNavKeys = [
  'nav.home',
  'nav.horoscope',
  'nav.past',
  'nav.future',
  'nav.matchmaking',
  'nav.calendar',
  'nav.cta',
  'nav.skip',
  'nav.tagline',
  'nav.desc',
  'nav.quick.label',
  'nav.quick.birth',
  'nav.quick.chart',
  'nav.quick.horoscope',
  'nav.quick.matchmaking',
];

function assertHasKeys(language, keys) {
  const dictionary = translations[language];
  assert.ok(dictionary, `missing dictionary for ${language}`);
  keys.forEach((key) => assert.ok(dictionary[key], `${language} missing ${key}`));
}

test('supports Hindi, English, Spanish, and Tamil translations', () => {
  const codes = new Set(Object.keys(translations));
  expectedLanguages.forEach((code) => assert.ok(codes.has(code), `language ${code} missing`));
  assert.deepEqual(codes, expectedLanguages);
});

test('navigation, quick jumps, and accessibility helpers are translated', () => {
  expectedLanguages.forEach((lang) => {
    assertHasKeys(lang, requiredNavKeys);
    assertHasKeys(lang, accessibilityKeys);
  });
});

test('language picker entries align with translation dictionaries', () => {
  const optionCodes = LANGUAGE_OPTIONS.map((option) => option.code);
  assert.deepEqual(new Set(optionCodes), expectedLanguages);
  LANGUAGE_OPTIONS.forEach((option) => {
    assert.ok(option.label, `${option.code} missing label`);
    assert.ok(option.nativeLabel, `${option.code} missing native label`);
    assert.ok(translations[option.code], `${option.code} missing translations`);
  });
});
