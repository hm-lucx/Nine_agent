/**
 * Action Planner – Sprint 4 Nachbesserung
 *
 * Erzeugt Handlungsempfehlungen aus Kursdetail + Studentenprofil + Planungsparameter.
 * Alle High-Risk-Aktionen erfordern explizite Bestätigung.
 */

import type { ExtractedCourseDetail, AgentAction } from './types/courseDetail.js';

export interface PlanningContext {
  currentSemester: number;
  blockedDays: string[];
  blockedTimeSlots?: Array<{ day: string; startTime: string; endTime: string; active: boolean }>;
  passedModuleCodes: string[];
  targetEcts: number;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function isAppointmentBlocked(
  day: string | null,
  startTime: string | null,
  endTime: string | null,
  ctx: PlanningContext,
): { blocked: boolean; reason: string | null } {
  if (!day) return { blocked: false, reason: null };

  if (ctx.blockedDays.some(d => d.toLowerCase() === day.toLowerCase())) {
    return { blocked: true, reason: `Termin am ${day} – gesperrter Arbeitstag.` };
  }

  if (startTime && endTime && ctx.blockedTimeSlots) {
    for (const slot of ctx.blockedTimeSlots.filter(s => s.active)) {
      if (slot.day.toLowerCase() !== day.toLowerCase()) continue;
      const mStart = timeToMinutes(startTime);
      const mEnd   = timeToMinutes(endTime);
      const sStart = timeToMinutes(slot.startTime);
      const sEnd   = timeToMinutes(slot.endTime);
      if (mStart < sEnd && mEnd > sStart) {
        return { blocked: true, reason: `Termin ${startTime}–${endTime} kollidiert mit Sperrzeit ${slot.startTime}–${slot.endTime}.` };
      }
    }
  }

  return { blocked: false, reason: null };
}

export function createCourseDetailRecommendations(
  courseDetail: ExtractedCourseDetail,
  ctx: PlanningContext,
): AgentAction[] {
  const actions: AgentAction[] = [...courseDetail.availableActions];
  const additionalNotes: string[] = [];

  // ── Bereits bestanden? ─────────────────────────────────────────────────────
  if (courseDetail.moduleTag && ctx.passedModuleCodes.includes(courseDetail.moduleTag.toUpperCase())) {
    additionalNotes.push(`Modul ${courseDetail.moduleTag} ist bereits als bestanden markiert.`);
    // Einschreibungs-Aktionen entfernen
    return actions.filter(a => !['PREPARE_ENROLLMENT', 'EXECUTE_ENROLLMENT'].includes(a.type)).map(a => ({
      ...a,
      description: a.id === 'open-moodle' ? `${a.description} (Modul bereits bestanden)` : a.description,
    }));
  }

  // ── Zeitliche Verfügbarkeit ────────────────────────────────────────────────
  const appt = courseDetail.nextAppointment;
  if (appt) {
    const { blocked, reason } = isAppointmentBlocked(appt.day, appt.startTime, appt.endTime, ctx);
    if (blocked && reason) {
      additionalNotes.push(reason);
      // Einschreibung mit Warnung versehen
      return actions.map(a => {
        if (a.type === 'PREPARE_ENROLLMENT') {
          return {
            ...a,
            title: '⚠ Eintragung (Zeitkonflikt)',
            description: a.description + ` – Achtung: ${reason}`,
            riskLevel: 'high' as const,
            warningText: reason,
          };
        }
        return a;
      });
    } else if (appt.day && appt.startTime) {
      additionalNotes.push(`Termin passt zeitlich zu deiner Verfügbarkeit (${appt.day} ${appt.startTime}–${appt.endTime ?? '?'}).`);
    }
  }

  // ── Bereits eingetragen ────────────────────────────────────────────────────
  if (courseDetail.enrollment.status === 'enrolled') {
    // Doppelte Einschreibungs-Buttons entfernen – nur Austragen anzeigen
    return actions.filter(a => a.type !== 'PREPARE_ENROLLMENT' && a.type !== 'EXECUTE_ENROLLMENT');
  }

  return actions;
}
