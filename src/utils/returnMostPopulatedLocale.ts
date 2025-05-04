/**
 * Recursively inspects a generic JSON‐like structure and:
 * 1. Detects which locale (e.g. "en", "pt-BR") carries the most non-empty values.
 * 2. Returns a copy of the structure where any localized field keeps only that dominant locale.
 *
 * This utility helps save on tokens when sending responses by eliminating redundant localized content
 * while preserving the most populated locale's data. It's especially helpful for multilingual records
 * where sending all locales would significantly increase token usage.
 * 
 * Useful for records that mix localized and non-localized fields.
 */

/* ---------- Helpers ---------- */

// Two-letter code optionally followed by region, e.g. "en" or "en-US".
const LOCALE_REGEX = /^[a-z]{2}(?:-[A-Z]{2})?$/;

/** True if the key looks like a locale code. */
const isLocaleKey = (key: string): boolean => LOCALE_REGEX.test(key);

/** Narrowing helper: plain object (not array / null). */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * True when every key in the object is a locale code,
 * meaning the value is a locale bundle (e.g. { en:{}, it:{} }).
 */
const isLocalizedObject = (obj: unknown): obj is Record<string, unknown> =>
  isPlainObject(obj) &&
  Object.keys(obj).length > 0 &&
  Object.keys(obj).every(isLocaleKey);

/** Checks if a value is effectively "empty" (string '', [] with only empties, {} with only empties). */
const deepIsEmpty = (value: unknown): boolean => {
  if (value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number' || typeof value === 'boolean') return false;
  if (Array.isArray(value)) return value.length === 0 || value.every(deepIsEmpty);
  if (isPlainObject(value)) return Object.values(value).every(deepIsEmpty);
  return true; // should never reach
};

/**
 * Walks the tree counting how many non-empty values each locale contributes.
 * Returns a map like { en: 42, it: 30 }.
 */
const collectCounts = (
  node: unknown,
  acc: Record<string, number> = {}
): Record<string, number> => {
  if (Array.isArray(node)) {
    for (const child of node) {
      collectCounts(child, acc);
    }
  } else if (isPlainObject(node)) {
    if (isLocalizedObject(node)) {
      for (const [loc, val] of Object.entries(node)) {
        if (!deepIsEmpty(val)) acc[loc] = (acc[loc] || 0) + 1;
        collectCounts(val, acc); // dive deeper for nested localized children
      }
    } else {
      for (const value of Object.values(node)) {
        collectCounts(value, acc);
      }
    }
  }
  return acc;
};

/** Chooses the locale with the highest count (ties: first encountered). */
const dominantLocale = (root: unknown): string | null => {
  const counts = collectCounts(root);
  let max = -1;
  let chosen: string | null = null;
  for (const [loc, cnt] of Object.entries(counts)) {
    if (cnt > max) {
      max = cnt;
      chosen = loc;
    }
  }
  return chosen;
};

/**
 * Produces a structural copy of `node`, replacing any localized object
 * with only the value for `loc`. Non-localized data remains untouched.
 */
const stripToLocale = (node: unknown, loc: string): unknown => {
  if (Array.isArray(node)) return node.map(n => stripToLocale(n, loc));
  if (isPlainObject(node)) {
    if (isLocalizedObject(node)) {
      return stripToLocale(node[loc] ?? null, loc);
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      result[k] = stripToLocale(v, loc);
    }
    return result;
  }
  return node;
};

/**
 * Main export: Finds the most populated locale and returns a copy
 * of the data structure with only that locale's values.
 * 
 * By default, only keeps the most populated locale to reduce token usage in responses.
 * Set keepAllLocales=true when you need the complete multilingual data.
 * 
 * @param data The source data with potential localized fields
 * @param keepAllLocales If true, returns the original data with all locales intact, which increases token usage but preserves all translations
 * @returns A copy with the best locale chosen and all others removed (or original data if keepAllLocales is true)
 */
export function returnMostPopulatedLocale(data: unknown, keepAllLocales = false): unknown {
  if (keepAllLocales) return data; // Skip locale filtering and return all locales
  
  const bestLocale = dominantLocale(data);
  if (!bestLocale) return data; // No localized content found
  return stripToLocale(data, bestLocale);
}
