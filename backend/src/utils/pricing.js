const ASIA_COUNTRIES = new Set([
  "AF", "AM", "AZ", "BH", "BD", "BT", "BN", "KH", "CN", "CY", "GE", "HK",
  "IN", "ID", "IR", "IQ", "IL", "JP", "JO", "KZ", "KW", "KG", "LA", "LB",
  "MO", "MY", "MV", "MN", "MM", "NP", "KP", "OM", "PK", "PS", "PH", "QA",
  "SA", "SG", "KR", "LK", "SY", "TW", "TJ", "TH", "TL", "TR", "TM", "AE",
  "UZ", "VN", "YE",
]);

const USD_RATE_COUNTRIES = new Set([
  "US", "CA", "AU", "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CZ",
  "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IT", "LV", "LI",
  "LT", "LU", "MT", "MD", "MC", "ME", "NL", "MK", "NO", "PL", "PT", "RO",
  "RU", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "UA", "GB", "VA",
]);

const INR_PLANS = {
  MONTHLY: { amount: 199, amountMinor: 19900, currency: "INR", days: 30, label: "Monthly" },
  YEARLY: { amount: 1000, amountMinor: 100000, currency: "INR", days: 365, label: "Yearly" },
};

const USD_PLANS = {
  MONTHLY: { amount: 10, amountMinor: 1000, currency: "USD", days: 30, label: "Monthly" },
  YEARLY: { amount: 100, amountMinor: 10000, currency: "USD", days: 365, label: "Yearly" },
};

function normalizeCountry(country) {
  return country ? String(country).trim().toUpperCase() : "";
}

function getPricingRegion(country) {
  const code = normalizeCountry(country);
  if (USD_RATE_COUNTRIES.has(code)) return "USD";
  if (ASIA_COUNTRIES.has(code)) return "INR";
  return "USD";
}

function getPlansForCountry(country) {
  return getPricingRegion(country) === "INR" ? INR_PLANS : USD_PLANS;
}

function hasActiveAccess(user) {
  if (!user) return false;
  return !!user.isPremium;
}

module.exports = {
  getPlansForCountry,
  getPricingRegion,
  hasActiveAccess,
  normalizeCountry,
};
