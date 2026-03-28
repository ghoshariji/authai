module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  setupFilesAfterFramework: [],
  testTimeout: 30000,
  verbose: true,
};
