# Web Developer Assistant

Web Developer Assistant offers tools of convenience to developers.

I am currently salvaging components from Developer Assistant to
retool as web applications, potentially integrating into a future
webextensions add-on.

The repository may still contain old relics as components are migrated.

Here is where you can find online demos (listing any that have already
been migrated, at least to be minimally functional):

- [XPath tester](https://brettz9.github.io/dev-assistant/xpath/)
- [Regex tester](https://brettz9.github.io/dev-assistant/regex/) (JRX: real-time JavaScript RegExp evaluator by Cüneyt Yilmaz)

(For the old add-on as copied from source control, see the
`dev-assistant-addon` tag, and see [PR #1](https://github.com/brettz9/dev-assistant/pull/1)
for some code apparently added after that in the original repository.)

## To-dos

### XPath to-dos

1. Add back load/save buttons (reimplement portions possible of
    `loadsaveutils.js`)
1. Reimplement keyset
1. Reapply splitter between input/output
1. Reapply ability to persist width/height, screenX/screenY,
    and height of splitter
1. CodeMirror Syntax highlighting for XML source

### Regex to-dos

1. Modernize and i18nize code

## History

[Developer Assistant](https://addons.mozilla.org/en-US/firefox/addon/extension-developer/)
was an add-on for Firefox. It was originally called Extension Developer
Extension and was created by Ted Mielczarek, with code contributed by
Jesse Ruderman, Cüneyt Yilmaz, Tony Chang, Gavin Sharp, Cesar Oliveira,
Nickolay Ponomarev, and Brett Zamir.

With Ted no longer actively maintaining the project, Brett Zamir accepted
to take over the project, though changes to date have been minimal.
