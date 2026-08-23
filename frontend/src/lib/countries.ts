export const COUNTRY_CODES = [
  "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM",
  "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ",
  "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF",
  "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC",
  "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ",
  "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET",
  "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE",
  "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY",
  "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE",
  "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR",
  "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO",
  "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX",
  "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP",
  "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM",
  "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR",
  "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC",
  "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI",
  "SB", "SO", "ZA", "GS", "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH",
  "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR",
  "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU",
  "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW",
];

const timezoneCountryFallback: Record<string, string> = {
  "Asia/Calcutta": "IN",
  "Asia/Kolkata": "IN",
  "Asia/Dubai": "AE",
  "Asia/Singapore": "SG",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Bangkok": "TH",
  "Asia/Jakarta": "ID",
  "Asia/Manila": "PH",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
};

export function getCountryName(code: string) {
  if (!code) return "";
  try {
    const displayNames = new Intl.DisplayNames([navigator.language || "en"], { type: "region" });
    return displayNames.of(code.toUpperCase()) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export const countryOptions = COUNTRY_CODES.map((code) => ({
  code,
  name: getCountryName(code),
  flag: code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0))),
})).sort((a, b) => a.name.localeCompare(b.name));

const phoneDialCodes: Record<string, string> = {
  AF: "+93", AX: "+358", AL: "+355", DZ: "+213", AS: "+1", AD: "+376", AO: "+244", AI: "+1", AQ: "+672", AG: "+1", AR: "+54", AM: "+374",
  AW: "+297", AU: "+61", AT: "+43", AZ: "+994", BS: "+1", BH: "+973", BD: "+880", BB: "+1", BY: "+375", BE: "+32", BZ: "+501", BJ: "+229",
  BM: "+1", BT: "+975", BO: "+591", BQ: "+599", BA: "+387", BW: "+267", BV: "+47", BR: "+55", IO: "+246", BN: "+673", BG: "+359",
  BF: "+226", BI: "+257", CV: "+238", KH: "+855", CM: "+237", CA: "+1", KY: "+1", CF: "+236", TD: "+235", CL: "+56", CN: "+86",
  CX: "+61", CC: "+61", CO: "+57", KM: "+269", CG: "+242", CD: "+243", CK: "+682", CR: "+506", CI: "+225", HR: "+385", CU: "+53",
  CW: "+599", CY: "+357", CZ: "+420", DK: "+45", DJ: "+253", DM: "+1", DO: "+1", EC: "+593", EG: "+20", SV: "+503", GQ: "+240",
  ER: "+291", EE: "+372", SZ: "+268", ET: "+251", FK: "+500", FO: "+298", FJ: "+679", FI: "+358", FR: "+33", GF: "+594",
  PF: "+689", TF: "+262", GA: "+241", GM: "+220", GE: "+995", DE: "+49", GH: "+233", GI: "+350", GR: "+30", GL: "+299",
  GD: "+1", GP: "+590", GU: "+1", GT: "+502", GG: "+44", GN: "+224", GW: "+245", GY: "+592", HT: "+509", HM: "+672",
  VA: "+379", HN: "+504", HK: "+852", HU: "+36", IS: "+354", IN: "+91", ID: "+62", IR: "+98", IQ: "+964", IE: "+353",
  IM: "+44", IL: "+972", IT: "+39", JM: "+1", JP: "+81", JE: "+44", JO: "+962", KZ: "+7", KE: "+254", KI: "+686",
  KP: "+850", KR: "+82", KW: "+965", KG: "+996", LA: "+856", LV: "+371", LB: "+961", LS: "+266", LR: "+231", LY: "+218",
  LI: "+423", LT: "+370", LU: "+352", MO: "+853", MG: "+261", MW: "+265", MY: "+60", MV: "+960", ML: "+223", MT: "+356",
  MH: "+692", MQ: "+596", MR: "+222", MU: "+230", YT: "+262", MX: "+52", FM: "+691", MD: "+373", MC: "+377", MN: "+976",
  ME: "+382", MS: "+1", MA: "+212", MZ: "+258", MM: "+95", NA: "+264", NR: "+674", NP: "+977", NL: "+31", NC: "+687",
  NZ: "+64", NI: "+505", NE: "+227", NG: "+234", NU: "+683", NF: "+672", MK: "+389", MP: "+1", NO: "+47", OM: "+968",
  PK: "+92", PW: "+680", PS: "+970", PA: "+507", PG: "+675", PY: "+595", PE: "+51", PH: "+63", PN: "+64", PL: "+48",
  PT: "+351", PR: "+1", QA: "+974", RE: "+262", RO: "+40", RU: "+7", RW: "+250", BL: "+590", SH: "+290", KN: "+1",
  LC: "+1", MF: "+590", PM: "+508", VC: "+1", WS: "+685", SM: "+378", ST: "+239", SA: "+966", SN: "+221", RS: "+381",
  SC: "+248", SL: "+232", SG: "+65", SX: "+1", SK: "+421", SI: "+386", SB: "+677", SO: "+252", ZA: "+27", GS: "+500",
  SS: "+211", ES: "+34", LK: "+94", SD: "+249", SR: "+597", SJ: "+47", SE: "+46", CH: "+41", SY: "+963", TW: "+886",
  TJ: "+992", TZ: "+255", TH: "+66", TL: "+670", TG: "+228", TK: "+690", TO: "+676", TT: "+1", TN: "+216", TR: "+90",
  TM: "+993", TC: "+1", TV: "+688", UG: "+256", UA: "+380", AE: "+971", GB: "+44", US: "+1", UM: "+1", UY: "+598",
  UZ: "+998", VU: "+678", VE: "+58", VN: "+84", VG: "+1", VI: "+1", WF: "+681", EH: "+212", YE: "+967", ZM: "+260",
  ZW: "+263", XK: "+383",
};

export const phoneCountryOptions = countryOptions
  .map((country) => ({
    ...country,
    dialCode: phoneDialCodes[country.code] || "",
  }))
  .filter((country) => country.dialCode)
  .sort((a, b) => a.name.localeCompare(b.name));

export const phoneDigitRules: Record<string, { min: number; max: number }> = {
  AD: { min: 6, max: 6 }, AE: { min: 9, max: 9 }, AF: { min: 9, max: 9 },
  AL: { min: 9, max: 9 }, AM: { min: 8, max: 8 }, AO: { min: 9, max: 9 },
  AR: { min: 10, max: 10 }, AT: { min: 10, max: 13 }, AU: { min: 9, max: 9 },
  AZ: { min: 9, max: 9 }, BA: { min: 8, max: 8 }, BD: { min: 10, max: 10 },
  BE: { min: 9, max: 9 }, BG: { min: 8, max: 9 }, BH: { min: 8, max: 8 },
  BR: { min: 10, max: 11 }, CA: { min: 10, max: 10 }, CH: { min: 9, max: 9 },
  CL: { min: 9, max: 9 }, CN: { min: 11, max: 11 }, CO: { min: 10, max: 10 },
  CU: { min: 8, max: 8 }, CY: { min: 8, max: 8 }, CZ: { min: 9, max: 9 },
  DE: { min: 10, max: 11 }, DK: { min: 8, max: 8 }, EG: { min: 10, max: 10 },
  ES: { min: 9, max: 9 }, FI: { min: 7, max: 12 }, FR: { min: 9, max: 9 },
  GB: { min: 10, max: 10 }, GR: { min: 10, max: 10 }, HR: { min: 8, max: 9 },
  HU: { min: 8, max: 9 }, ID: { min: 9, max: 12 }, IE: { min: 7, max: 9 },
  IL: { min: 9, max: 9 }, IN: { min: 10, max: 10 }, IS: { min: 7, max: 7 },
  IT: { min: 9, max: 10 }, JP: { min: 10, max: 10 }, KR: { min: 9, max: 10 },
  MX: { min: 10, max: 10 }, NL: { min: 9, max: 9 }, NO: { min: 8, max: 8 },
  NP: { min: 10, max: 10 }, NZ: { min: 8, max: 10 }, PK: { min: 10, max: 10 },
  PH: { min: 10, max: 10 }, PL: { min: 9, max: 9 }, PT: { min: 9, max: 9 },
  RU: { min: 10, max: 10 }, SA: { min: 9, max: 9 }, SE: { min: 7, max: 10 },
  SG: { min: 8, max: 8 }, TH: { min: 8, max: 9 }, TR: { min: 10, max: 10 },
  UA: { min: 9, max: 9 }, US: { min: 10, max: 10 }, VN: { min: 9, max: 10 },
  ZA: { min: 9, max: 9 },
};

export function getPhoneDigitRule(countryCode: string) {
  return phoneDigitRules[countryCode] || { min: 4, max: 15 };
}

export const cityOptionsByCountry: Record<string, string[]> = {
  AE: ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Al Ain", "Ras Al Khaimah", "Fujairah"],
  AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Hobart"],
  CA: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Quebec City"],
  DE: ["Berlin", "Munich", "Hamburg", "Cologne", "Frankfurt", "Stuttgart", "Dusseldorf"],
  FR: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Bordeaux"],
  GB: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool", "Edinburgh"],
  IN: [
    "Mumbai",
    "Delhi",
    "Bengaluru",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Lucknow",
    "Ahmedabad",
    "Jaipur",
    "Surat",
    "Indore",
    "Bhopal",
    "Patna",
    "Chandigarh",
  ],
  JP: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo", "Fukuoka"],
  NF: ["Kingston", "Burnt Pine", "Cascade", "Middlegate", "Longridge"],
  NP: ["Kathmandu", "Pokhara", "Lalitpur", "Biratnagar", "Bharatpur", "Birgunj"],
  SG: ["Singapore"],
  US: [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
    "Austin",
    "Jacksonville",
    "San Francisco",
    "Seattle",
  ],
};

export const locationCountryOptions = countryOptions.filter((country) => cityOptionsByCountry[country.code]);

export function getCityOptionsForCountry(countryCode: string) {
  return cityOptionsByCountry[countryCode.toUpperCase()] || [];
}

const cityCache = new Map<string, string[]>();

/**
 * Loads the complete city list for the selected country. The bundled list is
 * retained as an immediate/offline fallback, while the API fills in cities for
 * every supported country and is cached for the remainder of the session.
 */
export async function fetchCitiesForCountry(countryCode: string): Promise<string[]> {
  const normalizedCode = countryCode.toUpperCase();
  if (!normalizedCode) return [];
  const cached = cityCache.get(normalizedCode);
  if (cached) return cached;

  const fallback = getCityOptionsForCountry(normalizedCode);
  try {
    const response = await fetch(
      `https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(getCountryName(normalizedCode))}`
    );
    if (!response.ok) throw new Error("Could not load cities");
    const result = await response.json();
    const cities = Array.isArray(result?.data)
      ? [...new Set(result.data.map((city: unknown) => String(city).trim()).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b))
      : [];
    const resolved = cities.length ? cities : fallback;
    cityCache.set(normalizedCode, resolved);
    return resolved;
  } catch {
    cityCache.set(normalizedCode, fallback);
    return fallback;
  }
}

export function isValidCityForCountry(countryCode: string, city: string) {
  const normalizedCity = city.trim().toLowerCase();
  return getCityOptionsForCountry(countryCode).some((option) => option.toLowerCase() === normalizedCity);
}

export function detectCountryFromLocale() {
  const localeCountry = navigator.language?.split("-")?.[1]?.toUpperCase();
  if (localeCountry && COUNTRY_CODES.includes(localeCountry)) return localeCountry;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezoneCountryFallback[timezone] || "";
}

export type DeviceLocationResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: "unsupported" | "denied" | "unavailable" | "timeout" | "unknown" };

export function getDeviceCoordinates(): Promise<DeviceLocationResult> {
  if (!navigator.geolocation) return Promise.resolve({ ok: false, reason: "unsupported" });

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          ok: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ ok: false, reason: "denied" });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          resolve({ ok: false, reason: "unavailable" });
        } else if (error.code === error.TIMEOUT) {
          resolve({ ok: false, reason: "timeout" });
        } else {
          resolve({ ok: false, reason: "unknown" });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2 * 60 * 1000 }
    );
  });
}

/** Turn device coordinates into a displayable city without storing a street address. */
export async function getLocationNameFromCoordinates(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=10`,
      { headers: { "Accept-Language": navigator.language || "en" } }
    );
    if (!response.ok) return null;
    const result = await response.json();
    const address = result?.address || {};
    const city = address.city || address.town || address.village || address.municipality || address.county;
    const country = String(address.country_code || "").toUpperCase();
    return city ? { city: String(city), country } : null;
  } catch {
    return null;
  }
}
