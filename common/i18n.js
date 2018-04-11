const availableLanguages = ['en'];
const lang = navigator.languages.find((language) => {
    availableLanguages.includes(language);
}) || 'en';

let msgsJSON;

export const initLocales = async function () {
    const msgs = await fetch(`../_locales/${lang}/messages.json`);
    msgsJSON = await msgs.json();
};

// Todo: Properly format with args
export const _ = function (key, ...args) {
    return msgsJSON[key].message;
};
