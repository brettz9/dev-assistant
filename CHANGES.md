# CHANGES for dev-assistant

## ?

- Linting (LGTM): Apply LGTM fixes and exclude currently unused files
- Extract xregexp file to own file

## 1.1.0

- Ensure [XPath Tester](https://brettz9.github.io/dev-assistant/xpath/) and
    [Regex](https://brettz9.github.io/dev-assistant/regex/) demos are working
    on Github Pages
- Misc. maintenance improvements
- Initial release on npm

## 0.3.0.20110827

- Fix for JSEnv when setting window to another scope (reported Ryan Rettberg)
- Possible fix, hopefully at least for 7-zip users, of Extension Builder (more possible later)
- Updated for Firefox 9.0a1
- Requiring Firefox 3/Thunderbird 3 (modularizing code)
- Unpack by default for easier debugging on Extdev itself

## 0.3.0.20100706

- Fixed bug in extension builder file (thanks grbradt, rottenrice); however, the extension builder feature has apparently
been broken for some time, so the fix is unlikely to get it working again completely

## 0.3.0.20100621

- Support for Firefox 3.7a6pre
- Added support for Songbird, Sunbird (per request by kael); dropped expressed support for Firefox 1.5
- Restore XPath Evaluator
- Partial fixes of extension builder
- Clean-up code

## 0.3.0.20100607

- Restored and fixed options dialog for use of custom default text (brettz9)
- Persist width, height, screen X/Y; add splitters (brettz9 via asqueela)
- JS 1.6+ support in JS Shell (asqueela)
- Reopen this window and restart application menus (asqueela)
- Optional string paramater to filter windows/tabs for enumerateWindows in JS Shell (chrome) (a.sacred.line & asqueela)
- Update JRX to latest version (brettz9 via asqueela)
- Altered default text in JS Env and HTML Editor to allow for faster testing (brettz9)
- Bug: Fix overlay.jar creation (asqueela via mossop)
- Bug: Fix JS Shell links in Thunderbird not working (asqueela)
