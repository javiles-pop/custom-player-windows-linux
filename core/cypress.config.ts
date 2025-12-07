/* eslint-disable @typescript-eslint/no-var-requires */
import { defineConfig } from 'cypress';

export default defineConfig({
  chromeWebSecurity: false,
  video: false,
  viewportHeight: 1080,
  viewportWidth: 1920,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config);
    },
    testIsolation: false,
  },
});
