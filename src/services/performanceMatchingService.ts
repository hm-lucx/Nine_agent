/**
 * Performance Matching Service – Sprint 3 Nachbesserung
 *
 * Ordnet importierte Studienleistungen den NINE-API-Modulen zu.
 * Matching-Strategie (Priorität):
 *  1. Exakter Modulcode
 *  2. NINE moduleTag / subjectTag
 *  3. Alias-Mapping (moduleAliasService)
 *  4. Exakter normalisierter Name
 *  5. Teilstring-Match
 *  6. Fuzzy-Ähnlichkeit (Levenshtein)
 *  7. Manuell prüfen
 */

import type { NormalizedModuleOffering } from '../types/nineApi';
import type { ImportedGradeEntry } from './primussImportService';
import { fuzzyModuleSimilarity, normalizeModuleName } from '../utils/stringSimilarity';
import { findTagByAlias, MODULE_ALIASES } from './moduleAliasService';
import type { PlanningParams } from '../types';

export interface MatchedPerformance {
  importedEntry: ImportedGradeEntry;
  matchedModule: NormalizedModuleOffering | null;
  matchConfidence: 'hoch' | 'mittel' | 'niedrig' | 'nicht gefunden';
  matchReason: string;
  needsManualReview: boolean;
  possibleMatches: Array<{ module: NormalizedModuleOffering; score: number; reason: string }>;
}

// ── Matching ──────────────────────────────────────────────────────────────────

export function matchPerformance(
  entry: ImportedGradeEntry,
  nineModules: NormalizedModuleOffering[],
): MatchedPerformance {
  const possibleMatches: MatchedPerformance['possibleMatches'] = [];

  // 1. Exakter Modulcode
  if (entry.moduleCode) {
    const exact = nineModules.find(m =>
      m.moduleTag?.toUpperCase() === entry.moduleCode!.toUpperCase() ||
      m.subjectTag?.toUpperCase() === entry.moduleCode!.toUpperCase()
    );
    if (exact) return {
      importedEntry: entry, matchedModule: exact,
      matchConfidence: 'hoch', matchReason: 'Exakter Modulcode',
      needsManualReview: false, possibleMatches: [],
    };
  }

  // 2. Alias-Mapping: Notenblatt-Name → bekannte NINE-Tags
  const aliasResult = findTagByAlias(entry.moduleTitle);
  if (aliasResult) {
    const aliasModule = nineModules.find(m =>
      m.moduleTag?.toUpperCase() === aliasResult.nineTag.toUpperCase()
    );
    if (aliasModule) return {
      importedEntry: entry, matchedModule: aliasModule,
      matchConfidence: 'hoch', matchReason: `Alias-Mapping (${aliasResult.nineTag})`,
      needsManualReview: false, possibleMatches: [],
    };
    // Alias bekannt, aber kein NINE-Modul mit diesem Tag → mittel
    possibleMatches.push({
      module: { moduleTag: aliasResult.nineTag, moduleName: aliasResult.nineName } as NormalizedModuleOffering,
      score: 0.8,
      reason: `Alias: ${aliasResult.nineTag} (nicht in NINE-Daten)`,
    });
  }

  // 3. Fuzzy-Matching gegen alle NINE-Module
  const scored = nineModules.map(m => {
    const nameScore = fuzzyModuleSimilarity(entry.moduleTitle, m.moduleName);
    const tagScore = m.subjectName ? fuzzyModuleSimilarity(entry.moduleTitle, m.subjectName) : 0;
    const score = Math.max(nameScore, tagScore);
    const reason = score === nameScore
      ? `Namensähnlichkeit (${Math.round(score * 100)}%)`
      : `Fachähnlichkeit (${Math.round(score * 100)}%)`;
    return { module: m, score, reason };
  }).filter(x => x.score >= 0.5).sort((a, b) => b.score - a.score);

  for (const s of scored.slice(0, 3)) possibleMatches.push(s);

  const best = scored[0];
  if (!best) return {
    importedEntry: entry, matchedModule: null,
    matchConfidence: 'nicht gefunden', matchReason: 'Kein Match gefunden',
    needsManualReview: true, possibleMatches,
  };

  if (best.score >= 0.92) return {
    importedEntry: entry, matchedModule: best.module,
    matchConfidence: 'hoch', matchReason: best.reason,
    needsManualReview: false, possibleMatches: possibleMatches.slice(1),
  };
  if (best.score >= 0.75) return {
    importedEntry: entry, matchedModule: best.module,
    matchConfidence: 'mittel', matchReason: best.reason + ' – bitte prüfen',
    needsManualReview: true, possibleMatches: possibleMatches.slice(1),
  };
  return {
    importedEntry: entry, matchedModule: best.module,
    matchConfidence: 'niedrig', matchReason: best.reason + ' – unsicher',
    needsManualReview: true, possibleMatches,
  };
}

export function matchAllPerformances(
  entries: ImportedGradeEntry[],
  nineModules: NormalizedModuleOffering[],
): MatchedPerformance[] {
  return entries.map(e => matchPerformance(e, nineModules));
}

// ── Offene Module berechnen ───────────────────────────────────────────────────

export interface OpenModuleEntry {
  nineModule: NormalizedModuleOffering;
  status: 'offen' | 'bestanden' | 'nicht_bestanden' | 'blocked' | 'no_schedule';
  reasons: string[];
  matchedPerformance?: ImportedGradeEntry;
}

export function computeOpenModules(
  nineModules: NormalizedModuleOffering[],
  passedCodes: Set<string>,
  passedTitles: Set<string>,
  params: PlanningParams,
): OpenModuleEntry[] {
  const blockedDays = new Set(params.blockedDays.map(d => d.toLowerCase()));

  return nineModules.map(m => {
    const reasons: string[] = [];
    const normTitle = normalizeModuleName(m.moduleName);

    // Bestanden per Code
    if (m.moduleTag && passedCodes.has(m.moduleTag.toUpperCase())) {
      return { nineModule: m, status: 'bestanden' as const, reasons: [] };
    }
    // Bestanden per Name (Alias)
    const aliasEntry = MODULE_ALIASES.find(a => a.nineTag.toUpperCase() === m.moduleTag?.toUpperCase());
    if (aliasEntry) {
      const allNames = [aliasEntry.nineName.toLowerCase(), ...aliasEntry.aliases.map(a => a.toLowerCase())];
      if (allNames.some(n => passedTitles.has(n))) {
        return { nineModule: m, status: 'bestanden' as const, reasons: [] };
      }
    }
    // Bestanden per normalisiertem Name
    if (passedTitles.has(normTitle)) {
      return { nineModule: m, status: 'bestanden' as const, reasons: [] };
    }

    // Kein Kurs = kein Termin
    const hasCourses = m.courses.some(c => c.appointments.length > 0);
    if (!hasCourses) reasons.push('Kein Termin in NINE hinterlegt');

    // Gesperrter Tag
    if (hasCourses) {
      for (const course of m.courses) {
        for (const appt of course.appointments) {
          if (appt.dayDe && blockedDays.has(appt.dayDe.toLowerCase())) {
            reasons.push(`Termin am ${appt.dayDe} – gesperrter Arbeitstag`);
          }
        }
      }
    }

    if (reasons.some(r => r.includes('gesperrt'))) {
      return { nineModule: m, status: 'blocked' as const, reasons };
    }
    if (!hasCourses) {
      return { nineModule: m, status: 'no_schedule' as const, reasons };
    }
    return { nineModule: m, status: 'offen' as const, reasons };
  });
}
