/**
 * Grade Calculation Service – Sprint 3 Nachbesserung
 *
 * Berechnet gewichteten Notendurchschnitt aus importierten Leistungen.
 * Berücksichtigt:
 *  - Gewichtung (falls im Notenblatt vorhanden)
 *  - ECTS als Gewichtungsersatz (falls keine Gewichtung)
 *  - Unbenotete Module zählen bei ECTS, nicht beim Schnitt
 *  - Fehlende Noten nicht als 0
 */

import type { ImportedGradeEntry } from './primussImportService';
import type { PassedModule } from '../types';

export interface GradeStats {
  calculatedAverage: number | null;
  importedAverage: number | null;         // aus Notenblatt-Header
  averageMismatch: boolean;
  mismatchWarning: string | null;
  totalEcts: number;
  gradedEcts: number;
  ungradedEcts: number;
  passedCount: number;
  failedCount: number;
  openCount: number;
}

export function calcGradeStats(
  entries: ImportedGradeEntry[],
  importedAverage: number | null,
): GradeStats {
  const passed = entries.filter(e => e.status === 'bestanden');
  const failed = entries.filter(e => e.status === 'nicht bestanden');
  const open   = entries.filter(e => e.status === 'offen' || e.status === 'angemeldet');

  const totalEcts   = passed.reduce((s, m) => s + (m.ects ?? 0), 0);
  const graded      = passed.filter(m => m.grade != null && (m.ects ?? 0) > 0);
  const gradedEcts  = graded.reduce((s, m) => s + (m.ects ?? 0), 0);
  const ungradedEcts = totalEcts - gradedEcts;

  let calculatedAverage: number | null = null;
  if (graded.length > 0) {
    const weightSum = graded.reduce((s, m) => s + (m.ects ?? 1), 0);
    const gradeSum  = graded.reduce((s, m) => s + m.grade! * (m.ects ?? 1), 0);
    calculatedAverage = weightSum > 0 ? Math.round(gradeSum / weightSum * 100) / 100 : null;
  }

  let averageMismatch = false;
  let mismatchWarning: string | null = null;
  if (calculatedAverage !== null && importedAverage !== null) {
    if (Math.abs(calculatedAverage - importedAverage) > 0.05) {
      averageMismatch = true;
      mismatchWarning = `Importierter Notendurchschnitt (${importedAverage.toFixed(2)}) weicht vom berechneten Durchschnitt (${calculatedAverage.toFixed(2)}) ab. Möglicherweise enthält das Notenblatt eine andere Gewichtungsformel.`;
    }
  }

  return {
    calculatedAverage, importedAverage,
    averageMismatch, mismatchWarning,
    totalEcts, gradedEcts, ungradedEcts,
    passedCount: passed.length,
    failedCount: failed.length,
    openCount: open.length,
  };
}

export function entriesToPassedModules(entries: ImportedGradeEntry[], sourceFile: string): PassedModule[] {
  return entries
    .filter(e => e.status === 'bestanden')
    .map(e => ({
      code: e.moduleCode ?? `IMP-${e.moduleTitle.slice(0, 6).replace(/\s/g, '_')}`,
      module: e.moduleTitle,
      semester: e.semester ?? 0,
      ects: e.ects ?? 0,
      grade: e.grade ?? undefined,
      status: 'bestanden',
      source: `Import: ${sourceFile}`,
      dataLabel: 'importiert' as const,
    }));
}
