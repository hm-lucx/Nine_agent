/**
 * Planner Service – erzeugt 4 Empfehlungsszenarien aus:
 *  1. NINE API-Daten (Modulangebote + Termine)
 *  2. PRIMUSS-Importdaten (bestandene Module)
 *  3. Lokale Knowledge-Daten (Regeln, Studienplan, Fallback)
 *  4. Planungsparameter (gesperrte Tage, Arbeitszeiten, ECTS-Ziel)
 */

import type { StudentProfile, PlanningParams, Recommendation, ModuleType } from '../types';
import type { NineApiData, NineCourse } from './nineApiService';
import { scheduleEntries as localSchedule } from '../data/schedule';
import { checkProgressionRules } from './ruleEngine';
import { filterUnavailableCourses } from './availabilityService';
import { findConflicts } from './scheduleConflictService';
import { rules } from '../data/rules';

export interface ScenarioRecommendation {
  id: string;
  scenarioId: 'A' | 'B' | 'C' | 'D';
  scenarioName: string;
  scenarioDescription: string;
  scenarioRationale: string;
  modules: Recommendation[];
  totalEcts: number;
  usedDays: string[];
  warnings: string[];
  conflicts: string[];
  dataSource: 'api' | 'local' | 'mixed';
  lastUpdated: string;
}

// ── Kandidaten aus NINE API oder lokalem Fallback bauen ──────────────────────

function buildCandidates(
  student: StudentProfile,
  params: PlanningParams,
  nineData: NineApiData | null
): Recommendation[] {
  const passedCodes = new Set(student.passedModules.map(m => m.code));
  const { sem3Allowed, sem4Allowed } = checkProgressionRules(student, rules);

  // Scheduleeinträge: NINE API zuerst, dann lokaler Fallback
  const apiCourses: NineCourse[] = nineData?.courses ?? [];
  const useApi = apiCourses.length > 0;

  const candidates: Recommendation[] = [];

  // ── Lokale Einträge als Basis (gut strukturiert) ──
  for (const entry of localSchedule) {
    if (passedCodes.has(entry.moduleCode)) continue;
    const sem = entry.semester;
    if (sem === 4 && !sem4Allowed) continue;
    if (sem === 3 && !sem3Allowed) continue;
    if (sem !== null && sem >= 5) continue; // Sem 5–7 keine Termine bekannt

    const type: ModuleType = entry.type;
    if (type === 'WPM' && !params.includeWPM) continue;
    if ((type === 'AW' || type === 'Fakultät-13') && !params.includeAW) continue;

    // NINE API-Termin hat Vorrang, wenn vorhanden
    const apiMatch = useApi
      ? apiCourses.find(c => c.code && entry.moduleCode.toLowerCase().includes(c.code.toLowerCase()))
      : null;

    const day = apiMatch?.day ?? entry.day;
    const startTime = apiMatch?.startTime ?? entry.startTime;
    const endTime   = apiMatch?.endTime   ?? entry.endTime;
    const timeRaw   = startTime && endTime ? `${startTime}–${endTime}` : (entry.timeRaw ?? '');
    const source    = apiMatch ? 'NINE API (live/mock)' : entry.source;

    candidates.push({
      id: `cand-${entry.id}`,
      moduleCode: entry.moduleCode,
      moduleTitle: entry.moduleTitle,
      type,
      semester: sem,
      group: entry.group,
      day,
      startTime,
      endTime,
      timeRaw,
      ects: getEcts(entry.moduleCode),
      reason: buildReason(entry.moduleCode, sem, sem3Allowed, sem4Allowed, type),
      source,
      warnings: entry.availableForDummy === 'conditional' ? ['Bedingt verfügbar – Kollision möglich'] : [],
    });
  }

  return candidates;
}

function getEcts(code: string): number {
  const ectsMap: Record<string, number> = {
    G4: 5, G6: 4, G9: 5, G13: 4,
    'TEC-DA': 4, 'TEC-ET': 4, 'TEC-GFT': 4, 'TEC-IS': 4,
    'TEC-KR': 4, 'TEC-ME2': 5, 'TEC-VUT': 4,
    'WPM-SP': 4, 'WPM-LM': 4, 'WPM-VH': 4, 'WPM-PM': 4, 'WPM-SBS': 4,
    'AW-HFE': 2, 'AW-AICA': 2,
  };
  return ectsMap[code] ?? 4;
}

function buildReason(code: string, sem: number | null, sem3: boolean, sem4: boolean, type: ModuleType): string {
  if (type === 'WPM') return 'WPM allgemein freigegeben; kein gesperrter Tag; keine Kollision.';
  if (type === 'AW') return 'AW allgemein freigegeben; kein gesperrter Tag; keine Kollision.';
  if (sem === 2) return `Offenes Modul aus Semester 2 (niedrigstes unabgeschlossenes Semester).`;
  if (sem === 3 && sem3) return `3. Semester erlaubt (Vorrückungsregel erfüllt); kein gesperrter Tag.`;
  if (sem === 4 && sem4) return `4. Semester erlaubt; kein gesperrter Tag.`;
  return `Modul ${code} ist verfügbar und regelkonform.`;
}

// ── Szenarien generieren ──────────────────────────────────────────────────────

export function generateScenarios(
  student: StudentProfile,
  params: PlanningParams,
  nineData: NineApiData | null
): ScenarioRecommendation[] {
  const allCandidates = buildCandidates(student, params, nineData);
  const now = new Date().toISOString();
  const dataSource: ScenarioRecommendation['dataSource'] = nineData?.mode === 'live' ? 'api' : nineData ? 'mixed' : 'local';

  // Vorab: Verfügbarkeitsfilter (gesperrte Tage + Arbeitszeiten + Zeitkollisionen)
  const { available: passedTimeFilter, unavailable: removedModules } = filterUnavailableCourses(allCandidates, params);
  // Für Warnungen in Szenarien
  const blockedWarnings = removedModules.map(({ rec, reason }) => `${rec.moduleTitle}: ${reason}`);

  // Priorisierung: offene Sem-2 zuerst, dann Sem-3, dann WPM, dann AW
  const sorted = [...passedTimeFilter].sort((a, b) => {
    const semA = a.semester ?? 99;
    const semB = b.semester ?? 99;
    const typeOrder = (t: ModuleType) =>
      t === 'Pflichtmodul' || t === 'Pflichtmodul Studienrichtung TEC' ? 0
      : t === 'WPM' ? 1 : t === 'AW' ? 2 : 3;
    if (semA !== semB) return semA - semB;
    return typeOrder(a.type) - typeOrder(b.type);
  });

  // ── Szenario A: Regelkonformer Standardplan ───────────────────────────────
  const scenA = buildScenario(
    sorted, params.targetEcts, params.maxEcts,
    { allowWPM: params.includeWPM, allowAW: params.includeAW, maxModulesPerDay: 3, maxDays: 5, lowestSemFirst: true }
  );

  // ── Szenario B: ECTS-optimierter Plan ─────────────────────────────────────
  const scenB = buildScenario(
    sorted, params.maxEcts, params.maxEcts + 5,
    { allowWPM: params.includeWPM, allowAW: params.includeAW, maxModulesPerDay: 3, maxDays: 7, lowestSemFirst: false }
  );

  // ── Szenario C: Zeitlich entspannter Plan ─────────────────────────────────
  const scenC = buildScenario(
    sorted, Math.max(params.targetEcts - 8, 12), params.targetEcts - 2,
    { allowWPM: params.includeWPM, allowAW: params.includeAW, maxModulesPerDay: 2, maxDays: 4, lowestSemFirst: true }
  );

  // ── Szenario D: Rückstände aufholen (nur Pflicht) ─────────────────────────
  const onlyPflicht = sorted.filter(r => r.type === 'Pflichtmodul' || r.type === 'Pflichtmodul Studienrichtung TEC');
  const scenD = buildScenario(
    onlyPflicht, params.targetEcts, params.maxEcts,
    { allowWPM: false, allowAW: false, maxModulesPerDay: 3, maxDays: 5, lowestSemFirst: true }
  );

  // Warnungen wegen gesperrter Tage in alle Szenarien übertragen
  const addBlockedWarnings = (existing: string[]) => [
    ...existing,
    ...(blockedWarnings.length > 0 ? [`${blockedWarnings.length} Module wegen gesperrter Arbeitstage entfernt.`] : []),
  ];

  return [
    {
      id: 'scenario-a', scenarioId: 'A',
      scenarioName: 'Regelkonformer Standardplan',
      scenarioDescription: 'Offene Pflichtmodule nach Semesterprioriät, dann WPM und AW. Gesperrte Tage und Zeitkollisionen werden beachtet.',
      scenarioRationale: 'Empfohlen für einen ausgewogenen Studienverlauf mit klarer Semesterprioriät.',
      ...scenA, warnings: addBlockedWarnings(scenA.warnings), dataSource, lastUpdated: now,
    },
    {
      id: 'scenario-b', scenarioId: 'B',
      scenarioName: 'ECTS-optimierter Plan',
      scenarioDescription: `Möglichst nah am ECTS-Maximum (${params.maxEcts} ECTS). Mehr Module als Standardplan, trotzdem regelkonform.`,
      scenarioRationale: 'Sinnvoll wenn du möglichst viele ECTS in einem Semester sammeln möchtest.',
      ...scenB, warnings: addBlockedWarnings(scenB.warnings), dataSource, lastUpdated: now,
    },
    {
      id: 'scenario-c', scenarioId: 'C',
      scenarioName: 'Zeitlich entspannter Plan',
      scenarioDescription: `Weniger Module, max. 2 pro Tag, max. 4 Studientage. Zielt auf ca. ${Math.max(params.targetEcts - 8, 12)}–${params.targetEcts - 2} ECTS.`,
      scenarioRationale: 'Geeignet für Semester mit erhöhter Arbeitsbelastung oder zur Vorbereitung auf Prüfungen.',
      ...scenC, warnings: addBlockedWarnings(scenC.warnings), dataSource, lastUpdated: now,
    },
    {
      id: 'scenario-d', scenarioId: 'D',
      scenarioName: 'Rückstände aufholen',
      scenarioDescription: 'Nur offene Pflichtmodule, keine WPM/AW. Fokus auf kritische Grundlagenmodule und niedrigste Semester.',
      scenarioRationale: 'Ideal wenn du offene Pflichtmodule priorisieren und zuerst das Studium vorantreiben möchtest.',
      ...scenD, warnings: addBlockedWarnings(scenD.warnings), dataSource, lastUpdated: now,
    },
  ];
}

interface BuildOptions {
  allowWPM: boolean;
  allowAW: boolean;
  maxModulesPerDay: number;
  maxDays: number;
  lowestSemFirst: boolean;
}

function buildScenario(
  candidates: Recommendation[],
  minEcts: number,
  maxEcts: number,
  opts: BuildOptions
): Pick<ScenarioRecommendation, 'modules' | 'totalEcts' | 'usedDays' | 'warnings' | 'conflicts'> {
  const result: Recommendation[] = [];
  let totalEcts = 0;
  const dayCount: Record<string, number> = {};
  const usedDays = new Set<string>();

  for (const cand of candidates) {
    if (totalEcts >= maxEcts) break;
    if (!opts.allowWPM && cand.type === 'WPM') continue;
    if (!opts.allowAW && (cand.type === 'AW' || cand.type === 'Fakultät-13')) continue;

    const day = cand.day;
    if ((dayCount[day] ?? 0) >= opts.maxModulesPerDay) continue;
    if (usedDays.size >= opts.maxDays && !usedDays.has(day)) continue;

    // Zeitkollision prüfen
    if (result.some(r => hasConflictSimple(r, cand))) continue;

    result.push(cand);
    totalEcts += cand.ects;
    dayCount[day] = (dayCount[day] ?? 0) + 1;
    usedDays.add(day);
  }

  const warnings: string[] = [];
  if (totalEcts < minEcts) warnings.push(`Nur ${totalEcts} ECTS erreichbar (Ziel: ${minEcts} ECTS). Manche Module sind gesperrt oder kollidieren.`);

  return {
    modules: result,
    totalEcts,
    usedDays: [...usedDays],
    warnings,
    conflicts: findConflicts(result),
  };
}

function hasConflictSimple(a: Recommendation, b: Recommendation): boolean {
  if (a.day !== b.day) return false;
  if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) return false;
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
  return toMin(a.startTime) < toMin(b.endTime) && toMin(b.startTime) < toMin(a.endTime);
}
