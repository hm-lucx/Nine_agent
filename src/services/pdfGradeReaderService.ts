/**
 * PDF Grade Reader Service – Sprint 3 Nachbesserung
 *
 * Primärformat: „Notenblatt in Deutsch" (HM PRIMUSS-Export)
 * Erkennt: Stammdaten + Modulnoten + Teilnoten + Endnoten + Gewichtung
 *
 * Datenschutz: Kein Server-Upload, alles im Browser.
 */

import type { ImportedGradeEntry } from './primussImportService';

// ── Stammdaten-Interface ──────────────────────────────────────────────────────

export interface ExtractedStudentMeta {
  name: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  studyProgram: string | null;
  specialization: string | null;
  currentSemester: number | null;
  studyGroup: string | null;
  matriculationNumber: string | null;
  completedEcts: number | null;
  averageGrade: number | null;
  internshipDone: boolean | null;
  internshipLocation: string | null;
  rawText: string;
  confidence: 'hoch' | 'mittel' | 'niedrig';
  warnings: string[];
}

// ── pdfjs lazy import ─────────────────────────────────────────────────────────

async function getPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  return pdfjsLib;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((it: unknown) => (it as { str?: string }).str ?? '').join(' ');
    textParts.push(pageText);
  }
  return textParts.join('\n');
}

// ── Stammdaten-Extraktion ─────────────────────────────────────────────────────

function parseGradeValue(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(',', '.');
  const n = parseFloat(cleaned);
  return (isNaN(n) || n < 0.5 || n > 5.0) ? null : n;
}

export function extractStudentMeta(rawText: string): ExtractedStudentMeta {
  const lines = rawText.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
  const joined = rawText.replace(/\s+/g, ' ');
  const warnings: string[] = [];

  // Name: Zeile nach „Name:" oder „Nachname:" oder „Student:"
  let name: string | null = null;
  const nameLine = lines.find(l => /^(Name|Nachname|Student|Studentin)\s*:/i.test(l));
  if (nameLine) {
    name = nameLine.replace(/^[^:]+:\s*/, '').trim() || null;
  }
  // Fallback: suche nach „Vorname Nachname" am Anfang
  if (!name) {
    for (const line of lines.slice(0, 15)) {
      if (/^\d/.test(line)) continue;
      if (/notenblatt|hochschule|münchen|münchen|bachelor|master|studien|semester|ects|note/i.test(line)) continue;
      if (/^[A-ZÄÖÜa-zäöüß][a-zäöüß]+ [A-ZÄÖÜa-zäöüß][a-zäöüß]+$/.test(line)) {
        name = line;
        break;
      }
    }
  }

  // Geburtsdatum: TT.MM.JJJJ oder JJJJ-MM-TT
  const birthDateMatch = joined.match(/(?:Geburtsdatum|Geb\.?\s*Datum|geb\b)[:\s]*(\d{2}[.\-]\d{2}[.\-]\d{4})/i)
    ?? joined.match(/\b(\d{2}[.\-]\d{2}[.\-]\d{4})\b/);
  const birthDate = birthDateMatch ? birthDateMatch[1] : null;

  // Geburtsort
  const birthPlaceMatch = joined.match(/(?:Geburtsort|Geb\.?\s*Ort)[:\s]*([A-ZÄÖÜa-zäöüß][^\d,;]{2,30})/i);
  const birthPlace = birthPlaceMatch ? birthPlaceMatch[1].trim() : null;

  // Matrikelnummer
  const matNrMatch = joined.match(/(?:Matrikelnummer|Matrikel-Nr\.?|Mtk\.?)[:\s]*(\d{7,8})/i)
    ?? joined.match(/\b(\d{7,8})\b/);
  const matriculationNumber = matNrMatch ? matNrMatch[1] : null;

  // Studiengang
  let studyProgram: string | null = null;
  if (/wirtschaftsingenieur/i.test(joined)) studyProgram = 'Wirtschaftsingenieurwesen';
  else if (/informatik/i.test(joined)) studyProgram = 'Informatik';
  else if (/maschinenbau/i.test(joined)) studyProgram = 'Maschinenbau';
  else if (/elektrotechnik/i.test(joined)) studyProgram = 'Elektrotechnik';

  // Studienrichtung
  let specialization: string | null = null;
  if (/industrielle\s+technik|TEC\b/i.test(joined)) specialization = 'Industrielle Technik / TEC';
  else if (/biotechnologie|BIO\b/i.test(joined)) specialization = 'Biotechnologie / BIO';
  else if (/informationstechnik|INF\b/i.test(joined)) specialization = 'Informationstechnik / INF';
  else if (/nachhaltigkeits|NHM\b/i.test(joined)) specialization = 'Nachhaltigkeitsmanagement / NHM';

  // Fachsemester
  const semMatch = joined.match(/(?:Fachsemester|FS|Semester)[:\s]*(\d{1,2})/i);
  const currentSemester = semMatch ? parseInt(semMatch[1]) : null;

  // Studiengruppe
  const groupMatch = joined.match(/(?:Studiengruppe|Gruppe|Matrikelgruppe)[:\s]*([A-Z0-9\-\/]{2,12})/i);
  const studyGroup = groupMatch ? groupMatch[1] : null;

  // ECTS gesamt
  const ectsMatch = joined.match(/(?:gesamt|abgeschlossen|erreicht)[:\s]*(\d{1,3})\s*ECTS?/i)
    ?? joined.match(/(\d{1,3})\s*(?:von\s*\d+\s*)?ECTS?\s*(?:erreicht|abgeschlossen|gesamt)/i);
  const completedEcts = ectsMatch ? parseInt(ectsMatch[1]) : null;

  // Gesamtnotendurchschnitt
  const avgMatch = joined.match(/(?:Gesamtnote|Notendurchschnitt|Durchschnitt|Schnitt)[:\s]*([\d,\.]+)/i);
  const averageGrade = avgMatch ? parseGradeValue(avgMatch[1]) : null;

  // Praxissemester
  const internshipDone = /praxissemester\s*(?:abgeleistet|bestanden|ja|abgelegt)/i.test(joined) ? true
    : /praxissemester\s*(?:nein|nicht|ausstehend)/i.test(joined) ? false : null;
  const internshipLocMatch = joined.match(/Praxissemester[^.]+(?:bei|an|im)\s+([A-ZÄÖÜa-zäöüß][^\n.]{3,40})/i);
  const internshipLocation = internshipLocMatch ? internshipLocMatch[1].trim() : null;

  if (!name) warnings.push('Name nicht im Dokument erkannt – bitte manuell ergänzen.');
  if (!studyProgram) warnings.push('Studiengang nicht erkannt.');
  if (!averageGrade && completedEcts) warnings.push('Gesamtnotendurchschnitt nicht erkannt.');

  const confScore = [name, studyProgram, currentSemester, averageGrade, completedEcts].filter(Boolean).length;
  const confidence = confScore >= 4 ? 'hoch' : confScore >= 2 ? 'mittel' : 'niedrig';

  return {
    name, birthDate, birthPlace, studyProgram, specialization,
    currentSemester, studyGroup, matriculationNumber,
    completedEcts, averageGrade, internshipDone, internshipLocation,
    rawText, confidence, warnings,
  };
}

// ── Notenzeilen-Parsing ───────────────────────────────────────────────────────

type ParsedStatus = 'bestanden' | 'nicht bestanden' | 'offen' | 'angemeldet' | 'unbekannt';

function parseStatus(text: string, grade: number | null): ParsedStatus {
  const lower = text.toLowerCase();
  if (/nicht\s+bestanden|n\.?\s*b\.?|failed|5[,\.][0-9]/.test(lower)) return 'nicht bestanden';
  if (/bestanden|passed|\bBE\b/.test(text)) return 'bestanden';
  if (/offen/.test(lower)) return 'offen';
  if (/angem|angemeldet/.test(lower)) return 'angemeldet';
  if (grade !== null && grade >= 5.0) return 'nicht bestanden';
  if (grade !== null && grade < 5.0) return 'bestanden';
  return 'unbekannt';
}

function entryConfidence(title: string, grade: number | null, ects: number | null): 'hoch' | 'mittel' | 'niedrig' {
  let s = 0;
  if (title.length > 5) s++;
  if (grade !== null) s++;
  if (ects !== null) s++;
  return s >= 3 ? 'hoch' : s >= 2 ? 'mittel' : 'niedrig';
}

// Bekannte PRIMUSS-Notenblatt-Muster (Priorität: erstes Match gewinnt)
const PATTERNS: Array<{
  name: string;
  re: RegExp;
  extract: (m: RegExpMatchArray) => Partial<ImportedGradeEntry & { partialGrade?: number; finalGrade?: number; weighting?: number }>;
}> = [
  // WI101 Mathematik I 5 2,3 bestanden
  {
    name: 'code-name-ects-grade-status',
    re: /^([A-Z]{1,4}\d{2,4})\s+(.+?)\s+(\d{1,2})\s+([\d,\.]+)\s+(BE|NB|bestanden|nicht bestanden|passed|failed)/i,
    extract: m => ({
      moduleCode: m[1], moduleTitle: m[2].trim(),
      ects: parseInt(m[3]), grade: parseGradeValue(m[4]),
      status: parseStatus(m[5], parseGradeValue(m[4])),
    }),
  },
  // Mathematik I; 2,3; 1,5; 5; bestanden  (Name; Teilnote; Endnote; ECTS; Status)
  {
    name: 'name-teilnote-endnote-ects-status',
    re: /^(.+?)\s*;\s*([\d,\.]+)\s*;\s*([\d,\.]+)\s*;\s*(\d{1,2})\s*;\s*(bestanden|nicht bestanden|BE|NB)/i,
    extract: m => ({
      moduleTitle: m[1].trim(),
      grade: parseGradeValue(m[3]),  // Endnote
      ects: parseInt(m[4]),
      status: parseStatus(m[5], parseGradeValue(m[3])),
    }),
  },
  // Mathematik I, Note 2,3, 5 ECTS, bestanden
  {
    name: 'name-note-ects-status',
    re: /^(.+?),?\s*[Nn]ote\s+([\d,\.]+),?\s*(\d{1,2})\s*ECTS?,?\s*(bestanden|nicht bestanden|offen|angemeldet)/i,
    extract: m => ({
      moduleTitle: m[1].trim(), grade: parseGradeValue(m[2]),
      ects: parseInt(m[3]), status: parseStatus(m[4], parseGradeValue(m[2])),
    }),
  },
  // Mathematik I 5 ECTS 2,3 bestanden
  {
    name: 'name-ects-grade-status',
    re: /^(.+?)\s+(\d{1,2})\s*ECTS?\s+([\d,\.]+)\s+(bestanden|nicht bestanden|passed|failed|BE|NB)/i,
    extract: m => ({
      moduleTitle: m[1].trim(), ects: parseInt(m[2]),
      grade: parseGradeValue(m[3]), status: parseStatus(m[4], parseGradeValue(m[3])),
    }),
  },
  // Mathematik I 5 ECTS bestanden
  {
    name: 'name-ects-status-nograde',
    re: /^(.+?)\s+(\d{1,2})\s*ECTS?\s+(bestanden|offen|angemeldet|nicht bestanden)/i,
    extract: m => ({
      moduleTitle: m[1].trim(), ects: parseInt(m[2]),
      grade: null, status: parseStatus(m[3], null),
    }),
  },
  // Mathematik I; 5 ECTS; 2,3; bestanden  (Semikolon-getrennt)
  {
    name: 'name-ects-grade-status-semicolon',
    re: /^(.+?)\s*;\s*(\d{1,2})\s*ECTS?\s*;\s*([\d,\.]+)\s*;\s*(bestanden|nicht bestanden|BE|NB)/i,
    extract: m => ({
      moduleTitle: m[1].trim(), ects: parseInt(m[2]),
      grade: parseGradeValue(m[3]), status: parseStatus(m[4], parseGradeValue(m[3])),
    }),
  },
  // Produktionswirtschaft offen
  {
    name: 'name-status-only',
    re: /^([A-ZÄÖÜa-zäöüß][A-ZÄÖÜa-zäöüß\s\-\/&]+)\s+(offen|angemeldet|angem\.)$/i,
    extract: m => ({
      moduleTitle: m[1].trim(), grade: null, ects: null,
      status: parseStatus(m[2], null),
    }),
  },
];

export function parseSingleLine(line: string): (ImportedGradeEntry & { partialGrade?: number; finalGrade?: number; weighting?: number }) | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 4) return null;
  if (/^(modul|name|code|note|ects|semester|studieng|matrikel|facult|hochschule|notenblatt)/i.test(trimmed)) return null;

  for (const p of PATTERNS) {
    const m = trimmed.match(p.re);
    if (!m) continue;
    const extracted = p.extract(m);
    if (!extracted.moduleTitle) continue;
    const grade = extracted.grade ?? null;
    const status = (extracted.status ?? parseStatus('', grade)) as ImportedGradeEntry['status'];
    return {
      moduleCode: (extracted.moduleCode as string | null) ?? null,
      moduleTitle: extracted.moduleTitle!,
      semester: null,
      ects: extracted.ects ?? null,
      grade,
      status,
      source: 'pdf',
      confidence: entryConfidence(extracted.moduleTitle!, grade, extracted.ects ?? null),
      rawText: trimmed,
      needsManualReview: entryConfidence(extracted.moduleTitle!, grade, extracted.ects ?? null) === 'niedrig',
      warnings: [],
    };
  }
  return null;
}

export function parseGradesFromText(rawText: string): ImportedGradeEntry[] {
  const lines = rawText.split(/\n|\r|;(?=\s*[A-ZÄÖÜ])/);
  const results: ImportedGradeEntry[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const parsed = parseSingleLine(line);
    if (!parsed) continue;
    const key = parsed.moduleTitle.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(parsed);
  }
  return results;
}
