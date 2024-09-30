import ashNazg from 'eslint-config-ash-nazg';

export default [
  {
    ignores: [
      // Still migrating
      'chrome',
      'content',
      'locale',
      'modules',
      'skin',
      '_install.js',
      'common/loadsaveutils.js',

      // ignore till adding as dep.
      'regex/xregexp.js',

      // only ignore for now
      'regex/index.js'
    ]
  },
  ...ashNazg(['sauron', 'browser']),
  {
    settings: {
      coverage: true
    },
    rules: {
    }
  }
];
