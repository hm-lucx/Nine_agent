import type { StudentProfile, ScheduleEntry, Rule, Recommendation, NotRecommendedModule } from '../types';

export function checkProgressionRules(
  student: StudentProfile,
  _rules: Rule[]
): { sem3Allowed: boolean; sem4Allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const passedCodes = student.passedModules.map((m) => m.code);
  const passedSem12 = student.passedModules.filter((m) => m.semester <= 2);

  const mathIPassed = passedCodes.includes('G1');
  const passedSem12Count = passedSem12.length;

  const sem3Allowed = mathIPassed && passedSem12Count >= 9;
  if (!sem3Allowed) {
    if (!mathIPassed) reasons.push('Mathematik I nicht bestanden');
    if (passedSem12Count < 9)
      reasons.push(`Nur ${passedSem12Count} Module aus Sem 1–2 bestanden (mind. 9 nötig)`);
  }

  const totalSem12Modules = 13;
  const sem4Allowed =
    passedSem12Count >= totalSem12Modules ||
    (totalSem12Modules - passedSem12Count === 1);

  if (!sem4Allowed) {
    reasons.push(
      `${totalSem12Modules - passedSem12Count} Module aus Sem 1–2 noch offen – 4. Semester gesperrt`
    );
  }

  return { sem3Allowed, sem4Allowed, reasons };
}

export function checkBlockedDays(
  entry: ScheduleEntry,
  student: StudentProfile
): boolean {
  return student.blockedDays.some((day) =>
    entry.day.toLowerCase().includes(day.toLowerCase())
  );
}

export function checkTimeConflicts(entries: Recommendation[]): string[] {
  const conflicts: string[] = [];
  const dayMap: Record<string, Recommendation[]> = {};

  for (const e of entries) {
    if (!dayMap[e.day]) dayMap[e.day] = [];
    dayMap[e.day].push(e);
  }

  for (const day of Object.keys(dayMap)) {
    const dayEntries = dayMap[day].filter(
      (e) => e.startTime && e.endTime
    );
    for (let i = 0; i < dayEntries.length; i++) {
      for (let j = i + 1; j < dayEntries.length; j++) {
        const a = dayEntries[i];
        const b = dayEntries[j];
        if (a.startTime && a.endTime && b.startTime && b.endTime) {
          const aStart = timeToMin(a.startTime);
          const aEnd = timeToMin(a.endTime);
          const bStart = timeToMin(b.startTime);
          const bEnd = timeToMin(b.endTime);
          if (aStart < bEnd && bStart < aEnd) {
            conflicts.push(
              `Zeitkollision: ${a.moduleTitle} (${a.timeRaw}) und ${b.moduleTitle} (${b.timeRaw}) am ${day}`
            );
          }
        }
      }
    }
  }
  return conflicts;
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function findOpenLowestSemesterModules(
  student: StudentProfile
): typeof student.openModules {
  const sorted = [...student.openModules].sort((a, b) => a.semester - b.semester);
  if (sorted.length === 0) return [];
  const lowest = sorted[0].semester;
  return sorted.filter((m) => m.semester === lowest);
}

export function getNotRecommendedModules(
  student: StudentProfile,
  scheduleEntries: ScheduleEntry[]
): NotRecommendedModule[] {
  const blocked: NotRecommendedModule[] = [];
  const passedCodes = student.passedModules.map((m) => m.code);

  for (const entry of scheduleEntries) {
    if (entry.availableForDummy === false) {
      blocked.push({
        id: `nr-auto-${entry.id}`,
        moduleCode: entry.moduleCode,
        moduleTitle: entry.moduleTitle,
        reason: entry.blockedReason ?? 'Nicht verfügbar',
        affectedRule: entry.day.toLowerCase().includes('montag')
          ? 'R6 – Gesperrte Arbeitstage'
          : entry.day.toLowerCase().includes('freitag')
          ? 'R6 – Gesperrte Arbeitstage'
          : 'Sonstiger Grund',
        source: entry.source,
        severity: 'gesperrt',
      });
    }
  }

  if (!passedCodes.includes('G9')) {
    blocked.push({
      id: 'nr-auto-me2',
      moduleCode: 'TEC-ME2',
      moduleTitle: 'Maschinenelemente 2',
      reason: 'Maschinenelemente 1 (G9) noch nicht bestanden.',
      affectedRule: 'R1 – Fachliche Voraussetzung',
      source: 'dummy_student.json',
      severity: 'gesperrt',
    });
  }

  return blocked;
}

export function generateRecommendation(
  student: StudentProfile,
  recommendations: Recommendation[]
): { recommendations: Recommendation[]; totalEcts: number; conflicts: string[] } {
  const filtered = recommendations.filter((r) => {
    const dayBlocked = student.blockedDays.some((d) =>
      r.day.toLowerCase().includes(d.toLowerCase())
    );
    return !dayBlocked;
  });

  const conflicts = checkTimeConflicts(filtered);
  const totalEcts = filtered.reduce((sum, r) => sum + r.ects, 0);

  return { recommendations: filtered, totalEcts, conflicts };
}
