module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.(ts|js)'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { diagnostics: false }]
  }
};
