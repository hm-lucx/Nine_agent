/**
 * Chatbot Service – Sprint 3 Nachbesserung
 *
 * Regelbasierter Chatbot mit Schreibfehlertoleranz.
 * Kein externer LLM-Aufruf. Für LLM-Erweiterung vorbereitet.
 *
 * Datenschutz: Keine Nutzer-Nachrichten an externe Server.
 */

import type { PlanningParams, AvailabilityBlock } from '../types';
import { fuzzyTextMatch } from '../utils/stringSimilarity';

// ── Intent-Typen ──────────────────────────────────────────────────────────────

export type ChatIntent =
  | { type: 'SET_BLOCKED_DAYS'; days: string[] }
  | { type: 'SET_AVAILABILITY'; day: string; startTime: string; endTime: string; reason: AvailabilityBlock['reason'] }
  | { type: 'SET_ECTS_GOAL'; ects: number }
  | { type: 'ADD_PASSED_MODULE'; module: string; grade?: number; ects?: number }
  | { type: 'CHECK_MODULE_ELIGIBILITY'; module: string }
  | { type: 'CHECK_SEMESTER_ELIGIBILITY'; semester: number }
  | { type: 'ASK_OPEN_MODULES' }
  | { type: 'ASK_NOT_RECOMMENDED'; module: string }
  | { type: 'ASK_SCENARIO'; scenario?: string }
  | { type: 'ASK_ECTS_FEASIBILITY'; ects: number }
  | { type: 'UNKNOWN' };

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  intent?: ChatIntent;
  timestamp: string;
}

export interface ChatBotResponse {
  text: string;
  intent: ChatIntent;
  paramUpdates: Partial<PlanningParams>;
  newPassedModule?: { module: string; grade?: number; ects?: number };
  newAvailabilityBlock?: AvailabilityBlock;
}

// ── Schreibfehler-Korrekturen ─────────────────────────────────────────────────

const TYPO_MAP: Record<string, string> = {
  'semster': 'semester', 'semnster': 'semester',
  'mathe': 'mathematik', 'math': 'mathematik',
  '3ten': '3.', '2ten': '2.', '4ten': '4.', '1ten': '1.',
  'gesperrt': 'gesperrt', 'sperren': 'sperren',
  'koennen': 'können', 'koennte': 'könnte',
  'bestanden': 'bestanden', 'bestandem': 'bestanden',
  'tm': 'technische mechanik', 'tm1': 'technische mechanik 1', 'tm2': 'technische mechanik 2',
  'bwl': 'betriebswirtschaftslehre', 'vwl': 'volkswirtschaftslehre',
  'ppqm': 'projekt- und qualitätsmanagement', 'pqm': 'projekt- und qualitätsmanagement',
};

function fixTypos(text: string): string {
  let result = text.toLowerCase();
  for (const [typo, correct] of Object.entries(TYPO_MAP)) {
    result = result.replace(new RegExp(`\\b${typo}\\b`, 'gi'), correct);
  }
  return result;
}

// ── Extraktion ────────────────────────────────────────────────────────────────

const DAY_PATTERNS: Record<string, string> = {
  'montag': 'Montag', 'mo': 'Montag',
  'dienstag': 'Dienstag', 'di': 'Dienstag',
  'mittwoch': 'Mittwoch', 'mi': 'Mittwoch',
  'donnerstag': 'Donnerstag', 'do': 'Donnerstag',
  'freitag': 'Freitag', 'fr': 'Freitag',
};

function extractDays(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [key, val] of Object.entries(DAY_PATTERNS)) {
    if (new RegExp(`\\b${key}\\b`).test(lower) && !found.includes(val)) {
      found.push(val);
    }
  }
  return found;
}

function extractTimeRange(text: string): { start: string; end: string } | null {
  const m = text.match(/(\d{1,2})(?:[:\.\s](\d{2}))?\s*(?:bis|–|-|to)\s*(\d{1,2})(?:[:\.\s](\d{2}))?/i);
  if (!m) return null;
  const start = `${m[1].padStart(2, '0')}:${m[2] ?? '00'}`;
  const end = `${m[3].padStart(2, '0')}:${m[4] ?? '00'}`;
  return { start, end };
}

function extractSemester(text: string): number | null {
  const m = text.match(/(?:semester|sem)\s*\.?\s*(\d)/i)
    ?? text.match(/(\d)\.?\s*(?:semester|sem)/i);
  return m ? parseInt(m[1]) : null;
}

function extractGrade(text: string): number | undefined {
  const m = text.match(/(?:note|mit|grade)\s*([\d,\.]+)/i)
    ?? text.match(/\b([1-5][,\.]\d)\b/);
  if (!m) return undefined;
  return parseFloat(m[1].replace(',', '.'));
}

function extractEcts(text: string): number | undefined {
  const m = text.match(/(\d{1,2})\s*(?:ects|cp)/i);
  return m ? parseInt(m[1]) : undefined;
}

function extractEctsTarget(text: string): number | null {
  const m = text.match(/(?:maximal|höchstens|max\.?|nur|bis zu|ziel)\s+(\d{2})\s*(?:ects|cp)/i)
    ?? text.match(/(\d{2})\s*(?:ects|cp)\s+(?:reichen|genug|möchte|will)/i)
    ?? text.match(/(?:kann ich|darf ich)\s+(\d{2})\s*(?:ects)/i);
  return m ? parseInt(m[1]) : null;
}

// ── Intent-Erkennung ──────────────────────────────────────────────────────────

export function parseStudentMessage(message: string): ChatIntent {
  const fixed = fixTypos(message);
  const lower = fixed.toLowerCase();

  // Sperrzeit stundenweise
  if (/arbeit|gesperrt|nicht\s+da|von\s+\d|bis\s+\d|kann ich nicht/i.test(lower)) {
    const days = extractDays(fixed);
    const timeRange = extractTimeRange(fixed);
    if (days.length > 0 && timeRange) {
      return { type: 'SET_AVAILABILITY', day: days[0], startTime: timeRange.start, endTime: timeRange.end, reason: 'Arbeit' };
    }
    if (days.length > 0) {
      return { type: 'SET_BLOCKED_DAYS', days };
    }
  }

  // Ganzer Tag gesperrt
  if (/kann nicht|frei|gesperrt|nicht da|nicht verfügbar/i.test(lower) && extractDays(fixed).length > 0) {
    return { type: 'SET_BLOCKED_DAYS', days: extractDays(fixed) };
  }

  // ECTS-Ziel
  const ectsTarget = extractEctsTarget(fixed);
  if (ectsTarget) return { type: 'SET_ECTS_GOAL', ects: ectsTarget };

  // Bestanden
  if (/bestanden|habe\s+.+\s+(?:bestanden|gemacht)|hab\s+.+\s+bestanden/i.test(lower)) {
    const grade = extractGrade(fixed);
    const ects = extractEcts(fixed);
    const modMatch = fixed.match(/(?:habe?\s+|hab\s+)(.+?)(?:\s+bestanden|\s+mit\s+|\s*$)/i);
    const module = modMatch ? modMatch[1].trim().replace(/\s*(note|mit)\s*[\d,\.]+/i, '').trim() : message;
    return { type: 'ADD_PASSED_MODULE', module, grade, ects };
  }

  // Semesterregel prüfen
  if (/(?:kann ich|darf ich|bin ich|zulässig).+semester|semester.+(?:erlaubt|zulässig|möglich|besuchen)/i.test(lower)) {
    const sem = extractSemester(fixed);
    if (sem) return { type: 'CHECK_SEMESTER_ELIGIBILITY', semester: sem };
  }

  // Modul-Zulassung
  if (/(?:kann ich|darf ich|ist es möglich|möchte ich).+modul|(?:kann|darf) ich .+ machen|modul.+(?:erlaubt|zulässig|bestehen)/i.test(lower)) {
    const modMatch = fixed.match(/(?:kann ich|darf ich|möchte ich)\s+(.+?)\s+(?:machen|besuchen|belegen|nehmen|absolvieren)/i);
    if (modMatch) return { type: 'CHECK_MODULE_ELIGIBILITY', module: modMatch[1].trim() };
  }

  // Offene Module
  if (/(?:welche|was)\s+(?:module|fächer|kurse|leistungen)\s+(?:fehlen|offen|noch|brauche)/i.test(lower)
    || /was\s+fehlt\s+(?:mir|noch)/i.test(lower)) {
    return { type: 'ASK_OPEN_MODULES' };
  }

  // Warum nicht empfohlen
  if (/warum\s+(?:ist|wird|werden|kommt)\s+(.+?)\s+(?:nicht|kein)/i.test(lower)) {
    const m = fixed.match(/warum\s+(?:ist|wird|werden|kommt)\s+(.+?)\s+(?:nicht|kein)/i);
    return { type: 'ASK_NOT_RECOMMENDED', module: m ? m[1].trim() : '' };
  }

  // ECTS machbar?
  const ectsQ = fixed.match(/(?:kann ich|darf ich|sind)\s+(\d{2})\s*(?:ects|cp)\s+(?:machen|machbar|möglich|schaffen)/i);
  if (ectsQ) return { type: 'ASK_ECTS_FEASIBILITY', ects: parseInt(ectsQ[1]) };

  // Szenario
  if (/szenario|plan|empfehlung/i.test(lower)) {
    const s = fixed.match(/szenario\s*([abcd])/i);
    return { type: 'ASK_SCENARIO', scenario: s ? s[1].toUpperCase() : undefined };
  }

  return { type: 'UNKNOWN' };
}

// ── Antwort generieren ────────────────────────────────────────────────────────

export function generateBotResponse(
  message: string,
  params: PlanningParams,
  passedModuleNames: string[],
  openModuleNames: string[],
): ChatBotResponse {
  const intent = parseStudentMessage(message);
  let text = '';
  const paramUpdates: Partial<PlanningParams> = {};
  let newPassedModule: ChatBotResponse['newPassedModule'];
  let newAvailabilityBlock: AvailabilityBlock | undefined;

  switch (intent.type) {
    case 'SET_BLOCKED_DAYS': {
      const days = intent.days;
      paramUpdates.blockedDays = [...new Set([...params.blockedDays, ...days])];
      text = `Ich habe ${days.join(' und ')} als gesperrte Tage übernommen. Der Plan wird neu berechnet.`;
      break;
    }
    case 'SET_AVAILABILITY': {
      newAvailabilityBlock = {
        id: `chat-${Date.now()}`, day: intent.day,
        startTime: intent.startTime, endTime: intent.endTime,
        reason: intent.reason, active: true,
      };
      const currentSlots = params.blockedTimeSlots ?? [];
      paramUpdates.blockedTimeSlots = [...currentSlots, newAvailabilityBlock];
      text = `Ich habe ${intent.day} ${intent.startTime}–${intent.endTime} als Sperrzeit eingetragen. Module in diesem Zeitraum werden aus dem Plan entfernt.`;
      break;
    }
    case 'SET_ECTS_GOAL': {
      paramUpdates.targetEcts = intent.ects;
      text = `Ziel-ECTS auf ${intent.ects} gesetzt. Szenario B (ECTS-nah) wird entsprechend angepasst.`;
      break;
    }
    case 'ADD_PASSED_MODULE': {
      newPassedModule = { module: intent.module, grade: intent.grade, ects: intent.ects };
      text = `„${intent.module}" als bestanden markiert${intent.grade ? ` (Note ${intent.grade.toFixed(1)})` : ''}${intent.ects ? `, ${intent.ects} ECTS` : ''}. Offene Module und Empfehlungen werden aktualisiert.`;
      break;
    }
    case 'CHECK_SEMESTER_ELIGIBILITY': {
      const sem = intent.semester;
      const ruleMessages: Record<number, string> = {
        3: 'Für das 3. Semester brauchst du Mathematik I und mind. 8 weitere bestandene Module aus Sem. 1–2.',
        4: 'Für das 4. Semester brauchst du mind. 35 ECTS aus den ersten 3 Semestern.',
        5: 'Für das 5. Semester muss das Praxissemester absolviert sein und mind. 90 ECTS vorliegen.',
        6: 'Für das 6. Semester gelten die Vorrückungsregeln des 5. Semesters.',
        7: 'Das 7. Semester setzt i. d. R. alle Vorleistungen der ersten 6 Semester voraus.',
      };
      text = ruleMessages[sem] ?? `Für Semester ${sem} liegen mir keine spezifischen Regelinformationen vor.`;
      break;
    }
    case 'CHECK_MODULE_ELIGIBILITY': {
      const moduleName = intent.module;
      // Fuzzy-Match gegen bekannte bestandene Module
      const alreadyPassed = passedModuleNames.some(m => fuzzyTextMatch(moduleName, m, 0.7));
      if (alreadyPassed) {
        text = `„${moduleName}" hast du bereits bestanden. Du kannst es nicht erneut belegen.`;
      } else {
        const isOpen = openModuleNames.some(m => fuzzyTextMatch(moduleName, m, 0.7));
        text = isOpen
          ? `„${moduleName}" ist offen und prinzipiell belegbar. Ob du die Vorrückungsvoraussetzungen erfüllst, hängt von deinen bestandenen Modulen ab.`
          : `„${moduleName}" konnte ich nicht in deinen offenen Modulen finden. Möglicherweise ist es nicht für deinen Studiengang verfügbar oder bereits bestanden.`;
      }
      break;
    }
    case 'ASK_OPEN_MODULES': {
      if (openModuleNames.length === 0) {
        text = 'Ich habe keine offenen Module für dich gefunden. Bitte lade ein Notenblatt hoch oder gib deine Leistungen manuell ein.';
      } else {
        text = `Du hast noch ${openModuleNames.length} offene Module. Hier eine Auswahl: ${openModuleNames.slice(0, 5).join(', ')}${openModuleNames.length > 5 ? ` … und ${openModuleNames.length - 5} weitere` : ''}.`;
      }
      break;
    }
    case 'ASK_NOT_RECOMMENDED': {
      text = `„${intent.module || 'Das Modul'}" wird möglicherweise nicht empfohlen, weil: (1) Der Termin liegt auf einem gesperrten Arbeitstag, (2) eine Vorrückungsregel nicht erfüllt ist, oder (3) es in keinem Szenario ECTS-konform eingebaut werden kann. Prüfe die Empfehlungsszenarien und die Verfügbarkeits-Einstellungen.`;
      break;
    }
    case 'ASK_ECTS_FEASIBILITY': {
      const e = intent.ects;
      text = e <= params.maxEcts
        ? `${e} ECTS sind in einem Semester machbar (max. ${params.maxEcts} ECTS konfiguriert). Szenario B ist darauf ausgerichtet.`
        : `${e} ECTS übersteigen dein konfiguriertes Maximum (${params.maxEcts} ECTS). Du kannst das Maximum unter „Planungsparameter" erhöhen.`;
      break;
    }
    case 'ASK_SCENARIO': {
      const descriptions: Record<string, string> = {
        A: 'Szenario A ist der regelkonforme Standardplan: Pflichtmodule nach Semesterprioriät, keine gesperrten Tage.',
        B: 'Szenario B ist ECTS-optimiert: möglichst nah am ECTS-Maximum, trotzdem regelkonform.',
        C: 'Szenario C ist entspannt: weniger Module, max. 2 pro Tag, geringere Belastung.',
        D: 'Szenario D holt Rückstände auf: nur Pflichtmodule, keine WPM/AW.',
      };
      const s = intent.scenario;
      text = s ? (descriptions[s] ?? `Szenario ${s} ist nicht bekannt.`)
        : 'Es gibt 4 Szenarien: A (Standard), B (ECTS-nah), C (Entspannt), D (Rückstände). Welches interessiert dich?';
      break;
    }
    default: {
      const lower = message.toLowerCase();
      if (/hallo|hi|hey|guten\s+morgen|tag|servus/i.test(lower)) {
        text = 'Hallo! Ich bin dein Studienplanungs-Assistent. Du kannst mir z. B. sagen:\n• „Ich arbeite Montag von 8 bis 12"\n• „Ich habe Mathematik 1 bestanden mit 2,3"\n• „Kann ich Semester-3-Module machen?"\n• „Was fehlt mir noch?"';
      } else if (/danke|super|toll|gut|prima/i.test(lower)) {
        text = 'Gerne! Wenn du weitere Informationen eingeben möchtest – ich bin da.';
      } else {
        text = 'Das habe ich nicht ganz verstanden. Versuche es mit: „Ich arbeite Montag von 8 bis 12", „Ich habe Mathe 1 bestanden", „Kann ich 30 ECTS machen?" oder „Was fehlt mir noch?"';
      }
    }
  }

  return { text, intent, paramUpdates, newPassedModule, newAvailabilityBlock };
}
