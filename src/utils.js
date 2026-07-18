// Escape text before interpolating it into an HTML string (e.g. Leaflet tooltip/divIcon
// content, which is set via innerHTML) — untrusted values like a checkout name must
// never reach the DOM unescaped.
export const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));

export const SGD = (n, compact = false) => {
  if (compact && Math.abs(n) >= 1000) return `S$${(n / 1000).toFixed(1)}k`;
  return `S$${Math.round(n).toLocaleString("en-SG")}`;
};

export const pct = (n, digits = 1, signed = false) =>
  `${signed && n > 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`;

export const fmtAsOf = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-SG", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Singapore"
  }) + " SGT";
};

// Master 15-zone / 82-prefix lookup table from Melvin's verified manifest (Driver 20260521.xlsx)
const POSTAL_TO_ZONE_MAP = {
  "01": "C1", "02": "C1", "03": "C1", "04": "C1", "05": "C1", "06": "C1", "07": "C1", "08": "C1",
  "09": "C3", "10": "C3", "11": "W1", "12": "W1", "13": "W1", "14": "C3", "15": "C3", "16": "C3",
  "17": "C2", "18": "C2", "19": "C2", "20": "C2", "21": "C2", "22": "C1", "23": "C1", "24": "C3",
  "25": "C3", "26": "C3", "27": "C3", "28": "NE1", "29": "NE1", "30": "NE1", "31": "NE1", "32": "NE1",
  "33": "NE1", "34": "NE2", "35": "NE2", "36": "NE2", "37": "NE2", "38": "E1", "39": "E1", "40": "E1",
  "41": "E1", "42": "E1", "43": "E1", "44": "E2", "45": "E2", "46": "E2", "47": "E2", "48": "E2",
  "49": "E3", "50": "E3", "51": "E3", "52": "E3", "53": "NE3", "54": "NE3", "55": "NE3", "56": "NE2",
  "57": "NE2", "58": "W3", "59": "W3", "60": "W2", "61": "W2", "62": "W2", "63": "W2", "64": "W2",
  "65": "W3", "66": "W3", "67": "W3", "68": "W3", "69": "W2", "70": "W2", "71": "W2", "72": "N1",
  "73": "N1", "74": "NE2", "75": "N2", "76": "N2", "77": "N3", "78": "N3", "79": "NE3", "80": "NE3",
  "81": "NE3", "82": "NE3"
};

const ZONE_NAMES = {
  C1: "City / Marina", C2: "Tanjong Pagar / Chinatown", C3: "Orchard / River Valley",
  E1: "Bedok / Marine Parade", E2: "Tampines / Loyang", E3: "Geylang / Eunos",
  N1: "Woodlands / Sembawang", N2: "Yishun / Khatib", N3: "Ang Mo Kio / Bishan",
  NE1: "Punggol / Sengkang", NE2: "Hougang / Serangoon", NE3: "MacPherson / Toa Payoh",
  W1: "Jurong West / Boon Lay", W2: "Clementi / Jurong East", W3: "Bukit Timah / Holland"
};

export const getZoneForPostal = (postalCode) => {
  if (!postalCode) return "Unknown";
  // Extract first 2 digits of the postal code
  const clean = String(postalCode).trim();
  const prefix = clean.slice(0, 2).padStart(2, "0");
  return POSTAL_TO_ZONE_MAP[prefix] || "Unknown";
};

export const zoneName = (z) => {
  return ZONE_NAMES[z] || "Other";
};
