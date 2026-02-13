// src/utils/displayName.js

const STOP_WORDS = new Set([
  "c", "course", "asset", "a", "mod", "module", "id", "v1", "v2", "v3",
  "basics", "intro"
]);

function titleCase(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function cleanTokens(str) {
  return String(str)
    .trim()
    .replace(/[_/]+/g, "-")
    .replace(/[^a-zA-Z0-9- ]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-");
}

/**
 * displayName(...)
 * - If title exists, uses it.
 * - Else converts IDs like "c-python-controlflow" -> "Python Controlflow"
 * - Shortens long strings with ellipsis.
 */
export function displayName(input, opts = {}) {
  const {
    fallback = "Untitled",
    maxLen = 26,
    keepAcronyms = true
  } = opts;

  if (!input) return fallback;

  // If you pass an object like { title, courseId }, it will pick title first.
  const raw =
    typeof input === "object"
      ? (input.title || input.name || input.label || input.courseId || input.assetId || "")
      : String(input);

  if (!raw) return fallback;

  // If it already looks like a nice title (has spaces and not many hyphens), keep it.
  const looksHuman = raw.includes(" ") && raw.split("-").length <= 2;
  if (looksHuman) return truncate(raw, maxLen);

  const cleaned = cleanTokens(raw);

  // Split by hyphen OR space
  const tokens = cleaned
    .split(/[- ]+/)
    .filter(Boolean)
    .filter(t => !STOP_WORDS.has(t.toLowerCase()));

  if (tokens.length === 0) return truncate(raw, maxLen);

  const pretty = tokens
    .map(t => {
      // keep acronyms like "API", "SQL"
      if (keepAcronyms && /^[A-Z0-9]{2,}$/.test(t)) return t;
      // preserve camel-ish words
      if (/[A-Z]/.test(t) && /[a-z]/.test(t)) return t;
      return titleCase(t);
    })
    .join(" ");

  return truncate(pretty, maxLen);
}

export function truncate(str, maxLen = 26) {
  const s = String(str);
  if (s.length <= maxLen) return s;
  return s.slice(0, Math.max(0, maxLen - 1)) + "…";
}
