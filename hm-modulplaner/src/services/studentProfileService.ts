/**
 * Student Profile Service – Sprint 3
 *
 * Zentralisiert das Studentenprofil aus verschiedenen Quellen:
 *  - Demo-Profil (Jonas Weber, Fallback)
 *  - PRIMUSS-/Notenblatt-Import
 *  - Manuelle Eingabe
 *  - Gemischte Quellen
 *
 * Datenschutz: Alle Daten bleiben im Browser (localStorage). Kein Server-Upload.
 */

import type { PassedModule } from '../types';
import type { ImportedGradeEntry } from './primussImportService';

export type ProfileSourceType = 'demo' | 'primuss_import' | 'manual' | 'mixed';

export interface StudentPerformance {
  moduleCode: string | null;
  moduleTitle: string;
  semester: number | null;
  ects: number | null;
  grade: number | null;
  status: 'bestanden' | 'nicht_bestanden' | 'offen' | 'angemeldet' | 'unbekannt';
  attemptCount: number | null;
  source: ProfileSourceType;
  confidence: 'hoch' | 'mittel' | 'niedrig';
  rawText?: string;
  matchedNineModuleId?: string;
  needsManualReview: boolean;
  warnings: string[];
}

export interface ImportedStudentProfile {
  detectedName: string | null;
  detectedMatriculationNumber: string | null;
  detectedStudyProgram: string | null;
  detectedSpecialization: string | null;
  performances: StudentPerformance[];
  rawExtractedText: string;
  sourceFileName: string;
  sourceFileType: string;
  importedAt: string;
  confidence: 'hoch' | 'mittel' | 'niedrig';
  warnings: string[];
}

export interface CurrentStudentProfile {
  sourceType: ProfileSourceType;
  name: string;
  matriculationNumber: string | null;
  studyProgram: string;
  specialization: string;
  semesterContext: string;
  currentSemester: number;
  blockedDays: string[];
  passedModules: PassedModule[];
  failedModuleCodes: string[];
  completedEcts: number;
  gradedEcts: number;
  ungradedEcts: number;
  averageGrade: number | null;
  passedCount: number;
  failedCount: number;
  openCount: number;
  importedAt: string | null;
  lastUpdatedAt: string;
  confidence: 'hoch' | 'mittel' | 'niedrig';
  warnings: string[];
  isDemo: boolean;
}

// ── Berechnung ────────────────────────────────────────────────────────────────

export function calcWeightedAverage(modules: PassedModule[]): number | null {
  const graded = modules.filter(m => m.grade != null && m.ects > 0);
  if (!graded.length) return null;
  const sum = graded.reduce((s, m) => s + m.grade! * m.ects, 0);
  const totalEcts = graded.reduce((s, m) => s + m.ects, 0);
  return totalEcts > 0 ? Math.round((sum / totalEcts) * 100) / 100 : null;
}

export function buildProfileFromPassedModules(
  passedModules: PassedModule[],
  sourceType: ProfileSourceType,
  meta: Partial<Pick<CurrentStudentProfile, 'name' | 'matriculationNumber' | 'studyProgram' | 'specialization' | 'semesterContext' | 'currentSemester' | 'blockedDays'>>,
  failedModuleCodes: string[] = [],
  warnings: string[] = [],
): CurrentStudentProfile {
  const totalEcts = passedModules.reduce((s, m) => s + (m.ects ?? 0), 0);
  const gradedMods = passedModules.filter(m => m.grade != null);
  const gradedEcts = gradedMods.reduce((s, m) => s + (m.ects ?? 0), 0);
  const ungradedEcts = totalEcts - gradedEcts;
  const avg = calcWeightedAverage(passedModules);

  return {
    sourceType,
    name: meta.name ?? 'Unbekannt',
    matriculationNumber: meta.matriculationNumber ?? null,
    studyProgram: meta.studyProgram ?? 'Wirtschaftsingenieurwesen',
    specialization: meta.specialization ?? 'Industrielle Technik / TEC',
    semesterContext: meta.semesterContext ?? 'SoSe 2026',
    currentSemester: meta.currentSemester ?? 3,
    blockedDays: meta.blockedDays ?? [],
    passedModules,
    failedModuleCodes,
    completedEcts: totalEcts,
    gradedEcts,
    ungradedEcts,
    averageGrade: avg,
    passedCount: passedModules.length,
    failedCount: failedModuleCodes.length,
    openCount: 0, // wird dynamisch berechnet
    importedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    confidence: sourceType === 'demo' ? 'mittel' : 'hoch',
    warnings,
    isDemo: sourceType === 'demo',
  };
}

// ── Importierte Leistungen → PassedModule ────────────────────────────────────
export function importedEntriesToPassedModules(
  entries: ImportedGradeEntry[],
  sourceFileName: string,
): { passed: PassedModule[]; failedCodes: string[] } {
  const passed: PassedModule[] = [];
  const failedCodes: string[] = [];

  for (const e of entries) {
    if (e.status === 'bestanden') {
      passed.push({
        code: e.moduleCode ?? `IMP-${Math.random().toString(36).slice(2, 6)}`,
        module: e.moduleTitle,
        semester: e.semester ?? 0,
        ects: e.ects ?? 0,
        grade: e.grade ?? undefined,
        status: 'bestanden',
        source: `Import: ${sourceFileName}`,
        dataLabel: 'importiert',
      });
    } else if (e.status === 'nicht bestanden') {
      if (e.moduleCode) failedCodes.push(e.moduleCode);
    }
  }

  return { passed, failedCodes };
}

// ── Profil-Erkennung aus importiertem Text ────────────────────────────────────
export function detectProfileMeta(rawText: string): Partial<{
  name: string;
  matriculationNumber: string;
  studyProgram: string;
  specialization: string;
}> {
  const result: Partial<{ name: string; matriculationNumber: string; studyProgram: string; specialization: string }> = {};

  // Name: erste Nicht-Schlüsselwort Zeile ohne Zahlen, >= 4 Zeichen
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (/^\d/.test(line)) continue;
    if (/bachelor|master|wirtschaft|technik|informatik|semester|note|ects|modul/i.test(line)) continue;
    if (line.length >= 5 && /^[A-ZÄÖÜa-zäöüß\s\-]+$/.test(line)) {
      result.name = line;
      break;
    }
  }

  // Matrikelnummer: 7-8 Ziffern
  const matNr = rawText.match(/\b(\d{7,8})\b/);
  if (matNr) result.matriculationNumber = matNr[1];

  // Studiengang
  if (/wirtschaftsingenieur/i.test(rawText)) result.studyProgram = 'Wirtschaftsingenieurwesen';
  else if (/informatik/i.test(rawText)) result.studyProgram = 'Informatik';

  // Studienrichtung
  if (/industrielle\s+technik|TEC/i.test(rawText)) result.specialization = 'Industrielle Technik / TEC';
  else if (/biotechnologie|BIO/i.test(rawText)) result.specialization = 'Biotechnologie / BIO';
  else if (/informationstechnik|INF/i.test(rawText)) result.specialization = 'Informationstechnik / INF';

  return result;
}
