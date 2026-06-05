import type { Recommendation } from '../types';

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function hasTimeConflict(a: Recommendation, b: Recommendation): boolean {
  if (a.day !== b.day) return false;
  if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) return false;
  const aS = timeToMin(a.startTime), aE = timeToMin(a.endTime);
  const bS = timeToMin(b.startTime), bE = timeToMin(b.endTime);
  return aS < bE && bS < aE;
}

export function findConflicts(recs: Recommendation[]): string[] {
  const conflicts: string[] = [];
  for (let i = 0; i < recs.length; i++) {
    for (let j = i + 1; j < recs.length; j++) {
      if (hasTimeConflict(recs[i], recs[j])) {
        conflicts.push(`Zeitkollision: ${recs[i].moduleTitle} & ${recs[j].moduleTitle} am ${recs[i].day}`);
      }
    }
  }
  return conflicts;
}

export function isBlockedByWorkingHours(
  rec: Recommendation,
  workingHours: Record<string, { start: string; end: string }>
): boolean {
  const wh = workingHours[rec.day];
  if (!wh || !rec.startTime || !rec.endTime) return false;
  const wsS = timeToMin(wh.start), wsE = timeToMin(wh.end);
  const rS  = timeToMin(rec.startTime), rE = timeToMin(rec.endTime);
  // blocked if lecture time overlaps with working hours
  return rS < wsE && wsS < rE;
}

export function filterByBlockedDays(recs: Recommendation[], blockedDays: string[]): Recommendation[] {
  return recs.filter(r => !blockedDays.some(d => r.day.toLowerCase().includes(d.toLowerCase())));
}

export function filterByWorkingHours(
  recs: Recommendation[],
  workingHours: Record<string, { start: string; end: string }>
): Recommendation[] {
  return recs.filter(r => !isBlockedByWorkingHours(r, workingHours));
}

export function filterConflictFree(recs: Recommendation[]): Recommendation[] {
  const result: Recommendation[] = [];
  for (const r of recs) {
    if (!result.some(existing => hasTimeConflict(existing, r))) {
      result.push(r);
    }
  }
  return result;
}
