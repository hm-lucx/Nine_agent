/**
 * iCal / ICS Export Service – Sprint 3
 *
 * Erzeugt eine .ics-Datei (RFC 5545) clientseitig im Browser.
 * Kein Backend benötigt für Datei-Download.
 * Hinweis: Dauerhaft abonnierbarer iCal-Link benötigt einen Server.
 */

import type { Recommendation } from '../types';

interface ICalEvent {
  uid: string;
  title: string;
  startDate: string;   // YYYYMMDD
  startTime: string;   // HHmmss
  endDate: string;
  endTime: string;
  location?: string;
  description?: string;
  rrule?: string;      // z. B. FREQ=WEEKLY;COUNT=14
}

// Semesterbeginn für ICS-Basis-Datum
const SEMESTER_STARTS: Record<string, string> = {
  'SoSe 2026': '20260316',
  'WiSe 2025': '20251006',
  'WiSe 2026': '20261005',
  'SoSe 2027': '20270315',
};

const DAY_OFFSET: Record<string, number> = {
  Montag: 0, Dienstag: 1, Mittwoch: 2, Donnerstag: 3, Freitag: 4,
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4,
};

const RRULE_DAY: Record<string, string> = {
  Montag: 'MO', Dienstag: 'DI', Mittwoch: 'WE', Donnerstag: 'TH', Freitag: 'FR',
  Monday: 'MO', Tuesday: 'TU', Wednesday: 'WE', Thursday: 'TH', Friday: 'FR',
};

function addDays(baseDate: string, days: number): string {
  const d = new Date(`${baseDate.slice(0, 4)}-${baseDate.slice(4, 6)}-${baseDate.slice(6, 8)}`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function timeToIcs(t: string): string {
  return t.replace(':', '') + '00';
}

function uid(): string {
  return Math.random().toString(36).slice(2) + '@hm-modulplaner';
}

function escapeIcs(s: string): string {
  return s.replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
}

function formatEvent(ev: ICalEvent): string {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `SUMMARY:${escapeIcs(ev.title)}`,
    `DTSTART:${ev.startDate}T${ev.startTime}`,
    `DTEND:${ev.endDate}T${ev.endTime}`,
  ];
  if (ev.location) lines.push(`LOCATION:${escapeIcs(ev.location)}`);
  if (ev.description) lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`);
  if (ev.rrule) lines.push(`RRULE:${ev.rrule}`);
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

export interface ICalExportResult {
  icsContent: string;
  eventCount: number;
  hasRealDates: boolean;
  warnings: string[];
}

export function generateICS(
  modules: Recommendation[],
  scenarioName: string,
  semesterContext: string,
): ICalExportResult {
  const warnings: string[] = [];
  const baseDate = SEMESTER_STARTS[semesterContext];
  const hasRealDates = !!baseDate;

  if (!baseDate) {
    warnings.push(`Kein Semesterbeginn für „${semesterContext}" bekannt – Demo-Datum wird verwendet.`);
  }

  const fallbackBase = baseDate ?? '20260316';
  const events: string[] = [];

  for (const mod of modules) {
    if (!mod.day || !mod.startTime || !mod.endTime) {
      warnings.push(`${mod.moduleTitle}: Kein Termin bekannt – nicht im Kalender.`);
      continue;
    }

    const dayOffset = DAY_OFFSET[mod.day] ?? 0;
    const startDate = addDays(fallbackBase, dayOffset);
    const endDate = startDate;
    const rruleDay = RRULE_DAY[mod.day] ?? 'MO';

    const event: ICalEvent = {
      uid: uid(),
      title: `${mod.moduleTitle}${mod.moduleCode ? ` (${mod.moduleCode})` : ''}`,
      startDate,
      startTime: timeToIcs(mod.startTime),
      endDate,
      endTime: timeToIcs(mod.endTime),
      location: undefined, // Raum-Info aus Recommendation nicht direkt verfügbar
      description: `Szenario: ${scenarioName}\nQuelle: ${mod.source}\nGrund: ${mod.reason}`,
      rrule: `FREQ=WEEKLY;BYDAY=${rruleDay};COUNT=14`,
    };
    events.push(formatEvent(event));
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HM Modulplaner//DE',
    `X-WR-CALNAME:${escapeIcs(scenarioName)} – HM Modulplaner`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return { icsContent, eventCount: events.length, hasRealDates, warnings };
}

export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
