module.exports = {
  "extends": ["ash-nazg"],
  "parserOptions": {
      "sourceType": "module"
  },
  "settings": {
    "polyfills": [
        "document.createTreeWalker",
        "DOMParser",
        "fetch"
    ],
    "coverage": true
  },
  "env": {
      "node": false,
      "browser": true
  },
  "rules": {
    "indent": ["error", 4, {"outerIIFEBody": 0}]
  }
};