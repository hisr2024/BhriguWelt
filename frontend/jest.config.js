const nextJest = require('next/jest');

// Anchor everything to this directory. In the npm-workspace monorepo, jest
// otherwise resolves rootDir to the repo root, which breaks the '@/' alias,
// bypasses the Next.js SWC transform, and collects archive/legacy tests.
const createJestConfig = nextJest({
  dir: __dirname,
});

const customJestConfig = {
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/?(*.)+(spec|test).[tj]s?(x)',
    '**/tests/test_*.tsx',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/e2e/', '/__tests__/fixtures/', '/archive/'],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};

module.exports = createJestConfig(customJestConfig);
