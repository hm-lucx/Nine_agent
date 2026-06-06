/**
 * Availability Service – Sprint 3 Nachbesserung
 * Prüft, ob ein Modul/Kurs mit Planungsparametern vereinbar ist.
 * Unterstützt: ganztägige Sperren + stundenweise AvailabilityBlocks
 */

import type { Recommendation, PlanningParams, AvailabilityBlock } from '../types';

export interface AvailabilityConflict {
  type: 'blocked_day' | 'work_time' | 'time_collision' | 'no_schedule' | 'progression_rule';
  message: string;
  day?: string;
  time?: string;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: AvailabilityConflict[];
}

function toMinutes(t: string): number {
  const parts = t.split(':').map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

// Ist ein Tag gesperrt?
export function isDayBlocked(day: string | undefined, params: PlanningParams): boolean {
  if (!day) return false;
  return params.blockedDays.some(b => day.toLowerCase().includes(b.toLowerCase()));
}

// Überschneidet sich ein Termin mit der Arbeitszeit?
export function overlapsWithWorkTime(
  day: string | undefined,
  startTime: string | undefined,
  endTime: string | undefined,
  params: PlanningParams,
): boolean {
  if (!day || !startTime || !endTime) return false;
  const wh = params.workingHours[day];
  if (!wh) return false;
  const mStart = toMinutes(startTime);
  const mEnd = toMinutes(endTime);
  const mWorkStart = toMinutes(wh.start);
  const mWorkEnd = toMinutes(wh.end);
  return mStart < mWorkEnd && mEnd > mWorkStart;
}

// Zeitkollision zwischen zwei Empfehlungen?
export function hasTimeConflict(a: Recommendation, b: Recommendation): boolean {
  if (!a.day || !b.day || a.day !== b.day) return false;
  if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) return false;
  return toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime);
}

// Vollständige Verfügbarkeitsprüfung für eine Empfehlung
export function checkAvailability(rec: Recommendation, params: PlanningParams, existing: Recommendation[] = []): AvailabilityResult {
  const conflicts: AvailabilityConflict[] = [];

  if (!rec.day) {
    conflicts.push({ type: 'no_schedule', message: 'Kein Wochentag bekannt – Termin nicht planbar.' });
  } else if (isDayBlocked(rec.day, params)) {
    conflicts.push({ type: 'blocked_day', message: `${rec.day} ist als Arbeitstag gesperrt.`, day: rec.day });
  } else if (overlapsWithWorkTime(rec.day, rec.startTime, rec.endTime, params)) {
    conflicts.push({
      type: 'work_time',
      message: `Termin (${rec.startTime}–${rec.endTime}) überschneidet sich mit Arbeitszeit.`,
      day: rec.day, time: `${rec.startTime}–${rec.endTime}`,
    });
  }

  for (const ex of existing) {
    if (hasTimeConflict(rec, ex)) {
      conflicts.push({
        type: 'time_collision',
        message: `Zeitkollision mit ${ex.moduleTitle} (${ex.startTime}–${ex.endTime}).`,
        day: rec.day, time: `${rec.startTime}–${rec.endTime}`,
      });
    }
  }

  return { available: conflicts.length === 0, conflicts };
}

// Filtert nicht verfügbare Kurse und gibt Gründe zurück
export function filterUnavailableCourses(
  recs: Recommendation[],
  params: PlanningParams,
): {
  available: Recommendation[];
  unavailable: { rec: Recommendation; reason: string }[];
} {
  const available: Recommendation[] = [];
  const unavailable: { rec: Recommendation; reason: string }[] = [];

  for (const rec of recs) {
    const result = checkAvailability(rec, params, available);
    if (result.available) {
      available.push(rec);
    } else {
      const reason = result.conflicts.map(c => c.message).join(' / ');
      unavailable.push({ rec, reason });
    }
  }

  return { available, unavailable };
}

// Erklärt, warum ein Kurs nicht verfügbar ist
export function explainAvailabilityConflict(rec: Recommendation, params: PlanningParams): string {
  const result = checkAvailability(rec, params);
  if (result.available) return 'Verfügbar.';
  return result.conflicts.map(c => c.message).join('\n');
}

// ── Stundenweise Sperrzeiten ──────────────────────────────────────────────────

export function overlapsWithBlockedTime(
  day: string | undefined,
  startTime: string | undefined,
  endTime: string | undefined,
  block: AvailabilityBlock,
): boolean {
  if (!block.active) return false;
  if (!day || block.day.toLowerCase() !== day.toLowerCase()) return false;
  if (!startTime || !endTime) return false;
  return toMinutes(startTime) < toMinutes(block.endTime) && toMinutes(endTime) > toMinutes(block.startTime);
}

export function isTimeSlotBlocked(
  day: string | undefined,
  startTime: string | undefined,
  endTime: string | undefined,
  blocks: AvailabilityBlock[],
): AvailabilityBlock | null {
  for (const block of blocks.filter(b => b.active)) {
    if (overlapsWithBlockedTime(day, startTime, endTime, block)) return block;
  }
  return null;
}

export function filterCoursesByHourlyAvailability(
  recs: Recommendation[],
  blocks: AvailabilityBlock[],
): { available: Recommendation[]; blocked: Array<{ rec: Recommendation; block: AvailabilityBlock }> } {
  const available: Recommendation[] = [];
  const blocked: Array<{ rec: Recommendation; block: AvailabilityBlock }> = [];
  for (const rec of recs) {
    const hit = isTimeSlotBlocked(rec.day, rec.startTime, rec.endTime, blocks);
    if (hit) blocked.push({ rec, block: hit });
    else available.push(rec);
  }
  return { available, blocked };
}

export function explainBlockedTimeConflict(rec: Recommendation, block: AvailabilityBlock): string {
  return `${rec.moduleTitle} am ${rec.day} (${rec.startTime}–${rec.endTime}) kollidiert mit Sperrzeit ${block.startTime}–${block.endTime} (${block.reason}).`;
}
