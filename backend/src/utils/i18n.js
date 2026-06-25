const fs = require("fs");
const path = require("path");

const SUPPORTED_LANGUAGES = ["en", "hi"]; // add more JSON files in /locales to extend (ta, te, bn, mr...)

const cache = {};

function loadLocale(lang) {
  if (cache[lang]) return cache[lang];
  const safeLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : "en";
  const filePath = path.join(__dirname, "..", "locales", `${safeLang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  cache[safeLang] = data;
  return data;
}

/** Translate a key for a given language code, falling back to English. */
function t(key, lang = "en") {
  const strings = loadLocale(lang);
  return strings[key] || loadLocale("en")[key] || key;
}

module.exports = { t, SUPPORTED_LANGUAGES };
