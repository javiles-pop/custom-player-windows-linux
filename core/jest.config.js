module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^.+\\.svg$': 'jest-svg-transformer',
    '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'identity-obj-proxy',
    '^@core/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: [
    'js',
    'ts',
    'tsx',
  ],
  modulePathIgnorePatterns: [
    'cypress',
  ],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
}
