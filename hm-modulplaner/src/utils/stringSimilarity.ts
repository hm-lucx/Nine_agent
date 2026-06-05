/**
 * String-Similarity Utils – Sprint 3 Nachbesserung
 *
 * Levenshtein-Distanz, Normalisierung und Ähnlichkeitsberechnung
 * für NINE-Modul-Matching und Chatbot-Fuzzy-Matching.
 */

// Levenshtein-Distanz (edit distance)
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

// Ähnlichkeit 0–1 (1 = identisch)
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

// Normalisierung: Umlaute, Sonderzeichen, römische Zahlen
const UMLAUT_MAP: Record<string, string> = {
  ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'ae', Ö: 'oe', Ü: 'ue', ß: 'ss',
};

const ROMAN_MAP: Record<string, string> = {
  ' vii ': ' 7 ', ' vi ': ' 6 ', ' v ': ' 5 ',
  ' iv ': ' 4 ', ' iii ': ' 3 ', ' ii ': ' 2 ', ' i ': ' 1 ',
};

const SHORT_FORMS: Record<string, string> = {
  'mathematik': 'mathe',
  'betriebswirtschaftslehre': 'bwl',
  'technische mechanik': 'tm',
  'projekt- und qualitätsmanagement': 'ppqm',
  'projekt und qualitatsmanagement': 'ppqm',
  'wirtschaftsinformatik': 'wi',
  'volkswirtschaftslehre': 'vwl',
  'technische mechanik i': 'tm 1',
  'technische mechanik ii': 'tm 2',
  'mathematik i': 'mathe 1',
  'mathematik ii': 'mathe 2',
};

export function normalizeModuleName(name: string): string {
  let s = name.toLowerCase().trim();
  // Umlaute
  for (const [from, to] of Object.entries(UMLAUT_MAP)) {
    s = s.split(from).join(to);
  }
  // Sonderzeichen entfernen (außer Leerzeichen und Ziffern)
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  // Mehrfache Leerzeichen
  s = s.replace(/\s+/g, ' ').trim();
  // Sicherstellen, dass römische Zahlen Leerzeichen haben
  s = ' ' + s + ' ';
  for (const [roman, digit] of Object.entries(ROMAN_MAP)) {
    s = s.split(roman).join(digit);
  }
  s = s.trim();
  // Kurzformen
  for (const [long, short] of Object.entries(SHORT_FORMS)) {
    if (s === long) { s = short; break; }
  }
  return s.replace(/\s+/g, ' ').trim();
}

// Prüft ob b ein Teilstring von a oder umgekehrt
export function isSubstring(a: string, b: string): boolean {
  const na = normalizeModuleName(a);
  const nb = normalizeModuleName(b);
  return na.includes(nb) || nb.includes(na);
}

// Fuzzy-Match: gibt Ähnlichkeit für normalisierte Namen zurück
export function fuzzyModuleSimilarity(a: string, b: string): number {
  const na = normalizeModuleName(a);
  const nb = normalizeModuleName(b);
  if (na === nb) return 1.0;
  if (isSubstring(na, nb) && Math.abs(na.length - nb.length) < 6) return 0.9;
  return similarity(na, nb);
}

// Schreibfehler-Toleranz für Chatbot
export function fuzzyTextMatch(input: string, target: string, threshold = 0.8): boolean {
  return fuzzyModuleSimilarity(input, target) >= threshold;
}
