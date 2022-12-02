import { defineConfig } from 'cypress';
import getCompareSnapshotsPlugin from 'cypress-image-diff-js/dist/plugin';

export default defineConfig({
  viewportWidth: 1200,
  viewportHeight: 700,
  e2e: {
    setupNodeEvents(on, config) {
      getCompareSnapshotsPlugin(on, config);
    },
  },
});
