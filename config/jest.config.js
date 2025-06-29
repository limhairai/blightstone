/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  rootDir: '../frontend',
  setupFilesAfterEnv: ['<rootDir>/../config/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
    '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js)'
  ]
}; 