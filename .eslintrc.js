'use strict';

module.exports = {
  extends: ['ash-nazg/+script', 'ash-nazg/sauron-overrides'],
  settings: {
    polyfills: [
      'document.createTreeWalker',
      'document.querySelector',
      'DOMParser',
      'fetch',
      'navigator',
      'NodeFilter',
      'XPathResult'
    ],
    coverage: true
  },
  env: {
    browser: true
  },
  rules: {
  }
};
