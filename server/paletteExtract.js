function hexToRgb(hex) {
  const cleanHex = hex.replace(/^#/, "");
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return [r, g, b];
  }
  const num = parseInt(cleanHex.substring(0, 6), 16);
  return [num >> 16 & 255, num >> 8 & 255, num & 255];
}
function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function normalizeHex(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  let m = v.match(/^#?([0-9a-f]{3})$/i);
  if (m) {
    const h = m[1];
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toUpperCase();
  }
  m = v.match(/^#?([0-9a-f]{6})(?:[0-9a-f]{2})?$/i);
  if (m) return `#${m[1]}`.toUpperCase();
  m = v.match(/^rgba?\(\s*(\d{1,3}(?:\.\d+)?)\s*[, ]\s*(\d{1,3}(?:\.\d+)?)\s*[, ]\s*(\d{1,3}(?:\.\d+)?)\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i);
  if (m) return rgbToHex(Number(m[1]), Number(m[2]), Number(m[3])).toUpperCase();
  return null;
}
const NAMED_COLORS = {
  red: "#FF0000",
  pink: "#FFC0CB",
  magenta: "#FF00FF",
  purple: "#800080",
  violet: "#EE82EE",
  indigo: "#4B0082",
  blue: "#0000FF",
  navy: "#000080",
  cyan: "#00FFFF",
  teal: "#008080",
  aqua: "#00FFFF",
  turquoise: "#40E0D0",
  green: "#008000",
  lime: "#00FF00",
  olive: "#808000",
  yellow: "#FFFF00",
  gold: "#FFD700",
  orange: "#FFA500",
  coral: "#FF7F50",
  tomato: "#FF6347",
  brown: "#A52A2A",
  maroon: "#800000",
  grey: "#808080",
  gray: "#808080",
  silver: "#C0C0C0",
  white: "#FFFFFF",
  black: "#000000"
};
function parseColor(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v || v === "transparent" || v === "none") return null;
  if (/^url\(|gradient|^[a-z].*px$|^\d+$/.test(v)) return null;
  const normalized = normalizeHex(v);
  if (normalized) return normalized;
  let m = v.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (m) {
    return `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`.toUpperCase();
  }
  m = v.match(/^#?([0-9a-f]{6})([0-9a-f]{2})$/i);
  if (m) return `#${m[1]}`.toUpperCase();
  m = v.match(/^rgba?\(\s*(\d{1,3}(?:\.\d+)?)\s+(\d{1,3}(?:\.\d+)?)\s+(\d{1,3}(?:\.\d+)?)\s*(?:\/\s*[\d.]+%?\s*)?\)$/i);
  if (m) return rgbToHex(Number(m[1]), Number(m[2]), Number(m[3])).toUpperCase();
  m = v.match(/^hsla?\(\s*(\d{1,3}(?:\.\d+)?)\s*deg\s+(\d{1,3}(?:\.\d+)?)%\s+(\d{1,3}(?:\.\d+)?)%\s*(?:\/\s*[\d.]+%?\s*)?\)$/i);
  if (!m) {
    m = v.match(/^hsla?\(\s*(\d{1,3}(?:\.\d+)?)\s+(\d{1,3}(?:\.\d+)?)%\s+(\d{1,3}(?:\.\d+)?)%\s*(?:\/\s*[\d.]+%?\s*)?\)$/i);
  }
  if (m) {
    const h = Number(m[1]);
    const s = Number(m[2]);
    const l = Number(m[3]);
    const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
    const x = c * (1 - Math.abs(h / 60 % 2 - 1));
    const [r0, g0, b0] = h >= 0 && h < 60 ? [c, x, 0] : h >= 60 && h < 120 ? [x, c, 0] : h >= 120 && h < 180 ? [0, c, x] : h >= 180 && h < 240 ? [0, x, c] : h >= 240 && h < 300 ? [x, 0, c] : [c, 0, x];
    const m_ = l / 100 - c / 2;
    return rgbToHex((r0 + m_) * 255, (g0 + m_) * 255, (b0 + m_) * 255).toUpperCase();
  }
  m = v.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
  if (m) return rgbToHex(Number(m[1]), Number(m[2]), Number(m[3])).toUpperCase();
  const named = NAMED_COLORS[v.toLowerCase()];
  if (named) return named.toUpperCase();
  return null;
}
function normalizeKey(key) {
  return key.replace(/^--/, "").replace(/([a-z])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();
}
function hslToHue(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return h;
}
function hslToSaturation(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return 0;
  return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
}
function hslToLightness(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (max + min) / 2;
}
const HUE_TOLERANCE = 22;
function extractPalette(data, fallback, mode) {
  const result = { ...fallback };
  const findInData = (normalizedKey, obj) => {
    if (obj[normalizedKey]) return obj[normalizedKey];
    if (obj[`--${normalizedKey}`]) return obj[`--${normalizedKey}`];
    for (const [k, v] of Object.entries(obj)) {
      if (normalizeKey(k) === normalizedKey) return v;
    }
    return void 0;
  };
  const resolve = (normalizedKey, depth, visited) => {
    if (depth > 8 || visited.has(normalizedKey)) return null;
    visited = new Set(visited);
    visited.add(normalizedKey);
    const modes2 = data.modes || {};
    const darkMode = modes2.dark || {};
    const lightMode = modes2.light || {};
    const preferred = mode === "light" ? lightMode : darkMode;
    const val = findInData(normalizedKey, preferred) ?? findInData(normalizedKey, data) ?? (mode === "light" ? findInData(normalizedKey, darkMode) : findInData(normalizedKey, lightMode));
    if (typeof val === "string") {
      const varMatch = val.match(/var\(\s*--?([\w-]+)\s*(?:,\s*([^)]+))?\)/);
      if (varMatch) {
        const refKey = varMatch[1];
        const fallbackVal = varMatch[2]?.trim();
        const resolved = resolve(normalizeKey(refKey), depth + 1, visited);
        const final = resolved || fallbackVal;
        return final ? parseColor(final) : null;
      }
      return parseColor(val);
    }
    return null;
  };
  const tryMatch = (keys, roleKey) => {
    if (result[roleKey] !== fallback[roleKey]) return;
    for (const k of keys) {
      const resolved = resolve(normalizeKey(k), 0, /* @__PURE__ */ new Set());
      if (resolved) {
        result[roleKey] = resolved;
        return;
      }
    }
  };
  const roleKeys = {
    primary: ["primary-color", "rgb-primary-color", "primary"],
    accent: ["accent-color", "rgb-accent-color", "accent"],
    red: ["red-color", "rgb-red-color", "danger-color", "state-alarm-color", "red"],
    pink: ["pink-color", "rgb-pink-color", "pink"],
    purple: ["purple-color", "rgb-purple-color", "deep-purple-color", "purple"],
    indigo: ["indigo-color", "rgb-indigo-color", "indigo"],
    blue: ["blue-color", "rgb-blue-color", "blue"],
    lightBlue: ["light-blue-color", "rgb-light-blue-color", "light-blue"],
    cyan: ["cyan-color", "rgb-cyan-color", "info-color", "cyan"],
    teal: ["teal-color", "rgb-teal-color", "teal"],
    green: ["green-color", "rgb-green-color", "success-color", "state-ok-color", "green"],
    yellow: ["yellow-color", "rgb-yellow-color", "warning-color", "yellow"],
    orange: ["orange-color", "rgb-orange-color", "state-warning-color", "deep-orange-color", "warning-color", "orange"],
    brown: ["brown-color", "rgb-brown-color", "brown"],
    grey: ["grey-color", "rgb-grey-color", "disabled-text-color", "grey"]
  };
  for (const [role, keys] of Object.entries(roleKeys)) {
    tryMatch(keys, role);
  }
  if (result.primary === fallback.primary && result.accent !== fallback.accent) {
    result.primary = result.accent;
  } else if (result.accent === fallback.accent && result.primary !== fallback.primary) {
    result.accent = result.primary;
  }
  const excludePatterns = /background|text|bg|font|shadow|border|divider|card-mod|mdc-|token-/;
  const colors = [];
  const collectColors = (obj) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
    for (const [k] of Object.entries(obj)) {
      const normalizedK = normalizeKey(k);
      if (!excludePatterns.test(normalizedK)) {
        const resolved = resolve(normalizedK, 0, /* @__PURE__ */ new Set());
        if (resolved) colors.push([normalizedK, resolved]);
      }
    }
  };
  collectColors(data);
  const modes = data.modes || {};
  if (typeof modes === "object") {
    collectColors(modes.dark);
    collectColors(modes.light);
  }
  const hueToRole = {
    0: "red",
    20: "orange",
    40: "yellow",
    120: "green",
    180: "cyan",
    200: "lightBlue",
    240: "blue",
    270: "indigo",
    300: "purple",
    330: "pink"
  };
  const filledRoles = new Set(Object.keys(roleKeys).filter((r) => result[r] !== fallback[r]));
  for (const [, color] of colors) {
    const s = hslToSaturation(color);
    const l = hslToLightness(color);
    if (s < 0.25 && l >= 0.3 && l <= 0.7) {
      if (!filledRoles.has("grey")) {
        result.grey = color;
        filledRoles.add("grey");
      }
      continue;
    }
    if (s < 0.4 || l < 0.15 || l > 0.9) continue;
    const h = hslToHue(color);
    const hDeg = h * 360;
    let bestRole = null;
    let bestDist = 360;
    let bestSat = -1;
    for (const [hueCenter, role] of Object.entries(hueToRole)) {
      if (filledRoles.has(role)) continue;
      const center = Number(hueCenter);
      let dist = Math.abs(hDeg - center);
      if (dist > 180) dist = 360 - dist;
      if (dist < bestDist || dist === bestDist && s > bestSat) {
        bestDist = dist;
        bestRole = role;
        bestSat = s;
      }
    }
    if (bestRole && bestDist <= HUE_TOLERANCE) {
      result[bestRole] = color;
      filledRoles.add(bestRole);
    }
  }
  return result;
}
export {
  extractPalette,
  hexToRgb,
  normalizeHex,
  parseColor,
  rgbToHex
};
