// In this npm-workspace monorepo, jest binaries hoisted to the root run with
// the root as cwd, so frontend/jest.config.js is never auto-discovered and
// jest silently fell back to bare defaults (babel-jest with no TypeScript
// support — every suite failed to parse). Delegate to the frontend config,
// which anchors rootDir/dir to the frontend directory via __dirname.
module.exports = require('./frontend/jest.config.js');
