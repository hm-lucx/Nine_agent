/**
 * NINE Kursdetail-Parser – Sprint 4 Nachbesserung
 *
 * Verarbeitet HTML einer NINE-Kursdetailseite (live oder gespeicherte Fixture).
 * Quelle: https://nine.hm.edu/Course/Details/{id}
 *
 * Sicherheit:
 *  - Moodle-Zugangsschlüssel werden NIEMALS geloggt
 *  - accessKeyRawTransient nur im Speicher
 *  - Keine automatischen Aktionen
 */

import type {
  ExtractedCourseDetail, MoodleResource, CourseAppointment,
  EnrollmentInfo, AgentAction, EnrollmentStatusCode,
} from '../types/courseDetail.js';

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (!key || key.length < 3) return '••••';
  return '•'.repeat(Math.max(8, key.length));
}

function extractCourseId(url: string): string | null {
  const m = url.match(/Course\/Details\/([a-f0-9\-]{32,})/i);
  return m ? m[1] : null;
}

function trimText(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > 0 ? t : null;
}

// ── Termin-Extraktion ─────────────────────────────────────────────────────────

const DAY_DE: Record<string, string> = {
  'mo': 'Montag', 'di': 'Dienstag', 'mi': 'Mittwoch',
  'do': 'Donnerstag', 'fr': 'Freitag', 'sa': 'Samstag', 'so': 'Sonntag',
  'montag': 'Montag', 'dienstag': 'Dienstag', 'mittwoch': 'Mittwoch',
  'donnerstag': 'Donnerstag', 'freitag': 'Freitag', 'samstag': 'Samstag',
};

function parseAppointment(text: string): CourseAppointment | null {
  if (!text || text.length < 5) return null;

  // Muster: 11.06.2026 08:15 - 11:30 | Raum | Dozent
  const fullMatch = text.match(
    /(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})(?:\s*\|\s*(.+?))?(?:\s*\|\s*(.+))?$/
  );
  if (fullMatch) {
    return {
      date: fullMatch[1],
      day: null,
      startTime: fullMatch[2],
      endTime: fullMatch[3],
      room: trimText(fullMatch[4]),
      lecturer: trimText(fullMatch[5]),
      sourceText: text.trim(),
      confidence: 'hoch',
    };
  }

  // Muster: Mittwoch 08:15–11:30
  const dayTimeMatch = text.match(
    /(\b(?:mo|di|mi|do|fr|sa|so|montag|dienstag|mittwoch|donnerstag|freitag|samstag)\b)\w*\s+(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/i
  );
  if (dayTimeMatch) {
    const dayKey = dayTimeMatch[1].toLowerCase().slice(0, 2);
    return {
      date: null,
      day: DAY_DE[dayKey] ?? dayTimeMatch[1],
      startTime: dayTimeMatch[2],
      endTime: dayTimeMatch[3],
      room: null,
      lecturer: null,
      sourceText: text.trim(),
      confidence: 'mittel',
    };
  }

  // Nur Uhrzeit
  const timeOnly = text.match(/(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/);
  if (timeOnly) {
    return {
      date: null, day: null,
      startTime: timeOnly[1], endTime: timeOnly[2],
      room: null, lecturer: null,
      sourceText: text.trim(), confidence: 'niedrig',
    };
  }

  return null;
}

// ── Moodle-Erkennung ──────────────────────────────────────────────────────────

function extractMoodleResources(html: string, rawText: string): MoodleResource[] {
  const results: MoodleResource[] = [];

  // Moodle-Links aus HTML extrahieren
  const linkRegex = /<a[^>]+href="([^"]*moodle[^"]*)"[^>]*>(.*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(html)) !== null) {
    const url = m[1];
    const label = m[2].replace(/<[^>]+>/g, '').trim() || 'Moodle';

    // Zugangsschlüssel in der Nähe suchen (±500 Zeichen um den Link)
    const start = Math.max(0, m.index - 200);
    const end = Math.min(html.length, m.index + m[0].length + 400);
    const context = html.slice(start, end);

    // Schlüssel-Muster
    let accessKey: string | null = null;
    const keyPatterns = [
      /(?:Zugangss?chl[üu]ssel|Kurskennwort|Passwort|Kennwort)[:\s]*([A-Za-z0-9!@#$%^&*_\-]{4,30})/i,
      /\(([A-Za-z0-9!@#$%^&*_\-]{4,20})\)/,
    ];
    for (const pat of keyPatterns) {
      const km = context.match(pat);
      if (km) { accessKey = km[1].trim(); break; }
    }

    results.push({
      label,
      url,
      accessKeyMasked: accessKey ? maskKey(accessKey) : null,
      // SICHERHEIT: accessKeyRawTransient – wird NICHT serialisiert
      ...(accessKey ? { accessKeyRawTransient: accessKey } : {}),
      hasAccessKey: !!accessKey,
      confidence: 'hoch',
    });
  }

  // Fallback: reiner Text
  if (results.length === 0) {
    const moodleUrlMatch = rawText.match(/https?:\/\/moodle\.hm\.edu[^\s\n,)>"']*/);
    if (moodleUrlMatch) {
      results.push({
        label: 'Moodle',
        url: moodleUrlMatch[0],
        accessKeyMasked: null,
        hasAccessKey: false,
        confidence: 'mittel',
      });
    }
  }

  return results;
}

// ── Einschreibestatus ─────────────────────────────────────────────────────────

function detectEnrollment(text: string): EnrollmentInfo {
  const lower = text.toLowerCase();

  const hasAustragen = /austragen|unenroll|abmelden/i.test(lower);
  const hasEintragen = /eintragen(?!\s*:)|einschreiben|enroll/i.test(lower) && !hasAustragen;
  const hasWaitlist  = /warteliste|waitlist/i.test(lower);
  const hasTeilnehmer = /teilnehmerliste/i.test(lower);
  const hasGeschlossen = /geschlossen|closed|keine\s+pl[äa]tze|ausgebucht/i.test(lower);

  // Kapazität
  const capMatch = text.match(/(\d+)\s*(?:von|\/)\s*(\d+)\s*(?:Pl[äa]tzen?|Teilnehmern?)/i);
  const capacityText = capMatch ? `${capMatch[1]} von ${capMatch[2]} Plätzen belegt` : null;

  let status: EnrollmentStatusCode = 'unknown';
  let statusText: string | null = null;
  let actionButtonText: string | null = null;
  let canEnroll = false;
  let canUnenroll = false;

  if (hasAustragen || hasTeilnehmer) {
    status = 'enrolled';
    statusText = hasTeilnehmer ? 'In Teilnehmerliste eingetragen' : 'Eingetragen';
    actionButtonText = 'Austragen';
    canEnroll = false;
    canUnenroll = true;
  } else if (hasWaitlist) {
    status = 'waitlist';
    statusText = 'Auf Warteliste';
    actionButtonText = null;
    canEnroll = false;
  } else if (hasGeschlossen) {
    status = 'closed';
    statusText = 'Keine Plätze verfügbar';
    canEnroll = false;
  } else if (hasEintragen) {
    status = 'not_enrolled';
    statusText = 'Nicht eingetragen';
    actionButtonText = 'Eintragen';
    canEnroll = true;
  }

  return {
    status,
    statusText,
    actionButtonText,
    canEnroll,
    canUnenroll,
    requiresConfirmation: true,   // immer
    capacityText,
    allocationText: hasGeschlossen ? 'Vergabe geschlossen' : null,
  };
}

// ── Hauptparser ───────────────────────────────────────────────────────────────

export function parseNineCourseDetailFromHtml(
  html: string,
  sourceUrl = '',
): ExtractedCourseDetail {
  const warnings: string[] = [];

  // Rohtext für Parsing (HTML-Tags entfernen)
  const rawText = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ')
    .replace(/\s{3,}/g, '  ')
    .trim();

  const lines = rawText.split(/\n/).map(l => l.trim()).filter(Boolean);

  // Kurs-ID
  const courseId = extractCourseId(sourceUrl) ?? extractCourseId(html);

  // ── Titel / Modulname ─────────────────────────────────────────────────────
  let courseTitle: string | null = null;
  let moduleName: string | null = null;
  let moduleTag: string | null = null;

  // Aus <h1>, <h2>, <title> oder .course-title / page-header
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) courseTitle = trimText(h1Match[1].replace(/<[^>]+>/g, ''));

  const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/i);
  if (h2Match && !moduleName) moduleName = trimText(h2Match[1].replace(/<[^>]+>/g, ''));

  // Modulcode-Muster: "WI101", "G1", "TEC-TM2" usw.
  const tagMatch = (courseTitle ?? rawText).match(/\b([A-Z]{1,4}[\-]?[A-Z0-9]{1,6})\b/);
  if (tagMatch) moduleTag = tagMatch[1];

  if (!courseTitle) {
    const titleTag = html.match(/<title[^>]*>(.*?)<\/title>/i);
    courseTitle = trimText(titleTag?.[1].split('|')[0]);
  }
  if (!courseTitle) warnings.push('Kurstitel nicht erkannt.');

  // ── Curriculum-Pfad ───────────────────────────────────────────────────────
  let curriculumPath: string | null = null;
  const breadcrumb = html.match(/(?:breadcrumb|curriculum-path)[^>]*>(.*?)<\/[a-z]+>/i);
  if (breadcrumb) curriculumPath = trimText(breadcrumb[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));

  // ── Moodle-Ressourcen ─────────────────────────────────────────────────────
  const resources = extractMoodleResources(html, rawText);
  const moodle = resources.length > 0 ? resources[0] : null;
  if (resources.length === 0) {
    // Hinweis wenn Ressourcen-Sektion erkannt, aber kein Moodle-Link
    if (/ressourcen|resources/i.test(rawText)) {
      warnings.push('Ressourcen-Bereich erkannt, aber kein Moodle-Link gefunden.');
    }
  }

  // ── Termine ───────────────────────────────────────────────────────────────
  const appointments: CourseAppointment[] = [];

  // "Nächster Termin"-Bereich
  const nextTerminIdx = rawText.search(/n[äa]chster\s+termin/i);
  if (nextTerminIdx >= 0) {
    const context = rawText.slice(nextTerminIdx, nextTerminIdx + 400);
    for (const line of context.split('\n').slice(1, 8)) {
      const appt = parseAppointment(line);
      if (appt) { appointments.push(appt); break; }
    }
  }

  // Alle Zeilen nach Termin-Mustern durchsuchen
  for (const line of lines) {
    if (/\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}/.test(line) ||
        /\d{2}:\d{2}\s*[-–]\s*\d{2}:\d{2}/.test(line)) {
      const appt = parseAppointment(line);
      if (appt && !appointments.some(a => a.sourceText === appt.sourceText)) {
        appointments.push(appt);
      }
    }
  }

  if (appointments.length === 0) warnings.push('Kein Termin erkannt – möglicherweise noch nicht veröffentlicht.');

  // ── Alle-Termine-Link ─────────────────────────────────────────────────────
  const allDatesMatch = html.match(/href="([^"]*(?:appointment|termin)[^"]*)"[^>]*>[\s\S]*?alle\s+termin/i);
  const allAppointmentsLink = allDatesMatch ? allDatesMatch[1] : null;

  // ── Dozent & Raum ──────────────────────────────────────────────────────────
  let lecturer: string | null = null;
  let room: string | null = null;

  const dozentMatch = rawText.match(/(?:dozent|lecturer|prof\.|dr\.)[:\s]+([A-ZÄÖÜa-zäöüß][^\n,;]{3,40})/i);
  if (dozentMatch) lecturer = trimText(dozentMatch[1]);

  const raumMatch = rawText.match(/(?:raum|room)[:\s]+([A-Z0-9][^\n,;]{1,20})/i);
  if (raumMatch) room = trimText(raumMatch[1]);

  // Fallback: aus Termin
  if (!lecturer && appointments[0]?.lecturer) lecturer = appointments[0].lecturer;
  if (!room && appointments[0]?.room) room = appointments[0].room;

  // ── Einschreibestatus ─────────────────────────────────────────────────────
  const enrollment = detectEnrollment(rawText);

  // ── Kursgruppe ────────────────────────────────────────────────────────────
  const groupMatch = rawText.match(/(?:gruppe|group|kursgruppe)[:\s]+([A-Za-z0-9\-\/]{1,20})/i);
  const courseGroup = groupMatch ? trimText(groupMatch[1]) : null;

  // ── Verfügbare Aktionen ───────────────────────────────────────────────────
  const availableActions: AgentAction[] = [];

  availableActions.push({
    id: 'open-course-page', type: 'OPEN_COURSE_PAGE',
    title: 'Kursseite öffnen',
    description: `Kursdetailseite in NINE öffnen: ${sourceUrl}`,
    targetUrl: sourceUrl,
    riskLevel: 'low', requiresConfirmation: false, status: 'proposed',
  });

  if (moodle) {
    availableActions.push({
      id: 'open-moodle', type: 'OPEN_MOODLE_LINK',
      title: 'Moodle-Kurs öffnen',
      description: `Moodle-Link: ${moodle.url}`,
      targetUrl: moodle.url,
      riskLevel: 'low', requiresConfirmation: true, status: 'proposed',
    });
    if (moodle.hasAccessKey) {
      availableActions.push({
        id: 'copy-key', type: 'COPY_MOODLE_ACCESS_KEY',
        title: 'Zugangsschlüssel kopieren',
        description: 'Kopiert den maskierten Zugangsschlüssel in die Zwischenablage.',
        riskLevel: 'low', requiresConfirmation: true, status: 'proposed',
        warningText: 'Der Zugangsschlüssel wird nur lokal verwendet und nicht gespeichert.',
      });
    }
  }

  if (enrollment.canEnroll) {
    availableActions.push({
      id: 'prepare-enroll', type: 'PREPARE_ENROLLMENT',
      title: 'Eintragung vorbereiten',
      description: 'Zeigt den Eintragen-Button – Ausführung erfordert deine Bestätigung.',
      riskLevel: 'medium', requiresConfirmation: true, status: 'proposed',
    });
    availableActions.push({
      id: 'execute-enroll', type: 'EXECUTE_ENROLLMENT',
      title: '⚠ Wirklich eintragen',
      description: 'Klickt auf den Eintragen-Button in NINE. Nicht rückgängig ohne Austragen.',
      riskLevel: 'high', requiresConfirmation: true, requiresDoubleConfirmation: true, status: 'proposed',
      warningText: 'Diese Aktion trägt dich in den Kurs ein. Nur mit expliziter Bestätigung ausführen.',
    });
  }

  if (enrollment.canUnenroll) {
    availableActions.push({
      id: 'prepare-unenroll', type: 'PREPARE_UNENROLLMENT',
      title: 'Austragen vorbereiten',
      description: 'Du bist bereits eingetragen. Austragen erfordert deine Bestätigung.',
      riskLevel: 'high', requiresConfirmation: true, requiresDoubleConfirmation: true, status: 'proposed',
      warningText: 'Das Austragen kann je nach Frist Konsequenzen haben.',
    });
  }

  // ── Konfidenz berechnen ────────────────────────────────────────────────────
  const found = [courseTitle, moodle, appointments[0], lecturer, room].filter(Boolean).length;
  const confidence = found >= 4 ? 'hoch' : found >= 2 ? 'mittel' : 'niedrig';

  return {
    source: 'NINE_COURSE_DETAIL',
    sourceUrl,
    courseId,
    extractedAt: new Date().toISOString(),
    courseTitle,
    moduleName: moduleName ?? courseTitle,
    moduleTag,
    curriculumPath,
    courseGroup,
    resources,
    moodle,
    appointments,
    nextAppointment: appointments[0] ?? null,
    allAppointmentsLink,
    lecturer,
    room,
    enrollment,
    availableActions,
    rawText: rawText.slice(0, 5000),   // Gekürzt – keine Secrets
    warnings,
    confidence,
  };
}
