import type { Module } from '../types';

export const modules: Module[] = [
  // ── Semester 1 ────────────────────────────────────────────────────────────
  { id: 'G1',  moduleCode: 'G1',  title: 'Mathematik I',              type: 'Pflichtmodul', semester: 1, ects: 6, sws: 6, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },
  { id: 'G3',  moduleCode: 'G3',  title: 'Technische Mechanik',       type: 'Pflichtmodul', semester: 1, ects: 5, sws: 4, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },
  { id: 'G5',  moduleCode: 'G5',  title: 'Chemie und Werkstoffe',     type: 'Pflichtmodul', semester: 1, ects: 4, sws: 3, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },
  { id: 'G8',  moduleCode: 'G8',  title: 'Technisches Zeichnen',      type: 'Pflichtmodul', semester: 1, ects: 4, sws: 3, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },
  { id: 'G10', moduleCode: 'G10', title: 'Betriebswirtschaftslehre',  type: 'Pflichtmodul', semester: 1, ects: 4, sws: 4, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },
  { id: 'G12', moduleCode: 'G12', title: 'Grundlagen der Informatik', type: 'Pflichtmodul', semester: 1, ects: 5, sws: 4, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },

  // ── Semester 2 ────────────────────────────────────────────────────────────
  { id: 'G2',  moduleCode: 'G2',  title: 'Mathematik II',               type: 'Pflichtmodul', semester: 2, ects: 5, sws: 4, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },
  { id: 'G4',  moduleCode: 'G4',  title: 'Physik',                      type: 'Pflichtmodul', semester: 2, ects: 5, sws: 4, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },
  { id: 'G6',  moduleCode: 'G6',  title: 'Werkstofftechnik',            type: 'Pflichtmodul', semester: 2, ects: 4, sws: 4, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },
  { id: 'G7',  moduleCode: 'G7',  title: 'Elektrotechnik',              type: 'Pflichtmodul', semester: 2, ects: 5, sws: 4, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },
  { id: 'G9',  moduleCode: 'G9',  title: 'Maschinenelemente',           type: 'Pflichtmodul', semester: 2, ects: 5, sws: 4, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },
  { id: 'G11', moduleCode: 'G11', title: 'Buchführung und Bilanzierung', type: 'Pflichtmodul', semester: 2, ects: 4, sws: 4, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },
  { id: 'G13', moduleCode: 'G13', title: 'Volkswirtschaftslehre',       type: 'Pflichtmodul', semester: 2, ects: 4, sws: 4, source: 'knowledge_base.json / Studienplan_WI_B(1).pdf', sourceConfidence: 'hoch' },

  // ── Semester 3 – TEC ──────────────────────────────────────────────────────
  { id: 'TEC-DA',  moduleCode: 'TEC-DA',  title: 'Datenanalyse',                      type: 'Pflichtmodul Studienrichtung TEC', semester: 3, ects: 4, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
  { id: 'TEC-ET',  moduleCode: 'TEC-ET',  title: 'Energietechnik',                    type: 'Pflichtmodul Studienrichtung TEC', semester: 3, ects: 4, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
  { id: 'TEC-GFT', moduleCode: 'TEC-GFT', title: 'Grundlagen der Fertigungstechnik',  type: 'Pflichtmodul Studienrichtung TEC', semester: 3, ects: 4, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
  { id: 'TEC-IS',  moduleCode: 'TEC-IS',  title: 'Informationssysteme TEC',           type: 'Pflichtmodul Studienrichtung TEC', semester: 3, ects: 4, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
  { id: 'TEC-KR',  moduleCode: 'TEC-KR',  title: 'Kostenrechnung',                    type: 'Pflichtmodul Studienrichtung TEC', semester: 3, ects: 4, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
  { id: 'TEC-ME2', moduleCode: 'TEC-ME2', title: 'Maschinenelemente 2',               type: 'Pflichtmodul Studienrichtung TEC', semester: 3, ects: 5, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
  { id: 'TEC-VUT', moduleCode: 'TEC-VUT', title: 'Verfahrens- und Umwelttechnik',     type: 'Pflichtmodul Studienrichtung TEC', semester: 3, ects: 4, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },

  // ── Semester 4 ────────────────────────────────────────────────────────────
  { id: 'S4-AS',  moduleCode: 'S4-AS',  title: 'Automatisierung und Sensorik',         type: 'Pflichtmodul', semester: 4, ects: 4, source: 'knowledge_base.json', sourceConfidence: 'mittel', notes: 'Semester 4 – Vorrückung erforderlich' },
  { id: 'S4-CAD', moduleCode: 'S4-CAD', title: 'Entwicklung und Konstruktion mit CAD', type: 'Pflichtmodul', semester: 4, ects: 4, source: 'knowledge_base.json', sourceConfidence: 'mittel', notes: 'Semester 4 – Vorrückung erforderlich' },
  { id: 'S4-ERG', moduleCode: 'S4-ERG', title: 'Ergonomie mit Praktikum',              type: 'Pflichtmodul', semester: 4, ects: 4, source: 'knowledge_base.json', sourceConfidence: 'mittel' },
  { id: 'S4-FS',  moduleCode: 'S4-FS',  title: 'Fachsprache Englisch 1',              type: 'Pflichtmodul', semester: 4, ects: 4, source: 'knowledge_base.json', sourceConfidence: 'mittel' },
  { id: 'S4-FI',  moduleCode: 'S4-FI',  title: 'Finanzierung und Investition',         type: 'Pflichtmodul', semester: 4, ects: 4, source: 'knowledge_base.json', sourceConfidence: 'mittel' },
  { id: 'S4-MK',  moduleCode: 'S4-MK',  title: 'Marketing',                            type: 'Pflichtmodul', semester: 4, ects: 4, source: 'knowledge_base.json', sourceConfidence: 'mittel' },
  { id: 'S4-VFT', moduleCode: 'S4-VFT', title: 'Vertiefung der Fertigungstechnik',    type: 'Pflichtmodul', semester: 4, ects: 4, source: 'knowledge_base.json', sourceConfidence: 'mittel' },

  // ── Semester 5 – Platzhalter ──────────────────────────────────────────────
  // Quelle: Studienplan_WI_B(1).pdf – manuell zu prüfen, keine gesicherten Daten in knowledge_base.json
  { id: 'S5-P1', moduleCode: 'S5-P1', title: 'Semester 5 – Modul 1 (Daten fehlen)',  type: 'Pflichtmodul', semester: 5, ects: 0, source: 'Studienplan_WI_B(1).pdf – manuell zu prüfen', sourceConfidence: 'manuell zu prüfen', dataLabel: 'Quelle prüfen', notes: 'Keine gesicherten Daten in knowledge_base.json. Bitte Studienplan_WI_B(1).pdf prüfen.' },
  { id: 'S5-P2', moduleCode: 'S5-P2', title: 'Semester 5 – Modul 2 (Daten fehlen)',  type: 'Pflichtmodul', semester: 5, ects: 0, source: 'Studienplan_WI_B(1).pdf – manuell zu prüfen', sourceConfidence: 'manuell zu prüfen', dataLabel: 'Quelle prüfen', notes: 'Keine gesicherten Daten in knowledge_base.json.' },
  { id: 'S5-P3', moduleCode: 'S5-P3', title: 'Semester 5 – Praxissemester (Platzhalter)', type: 'Pflichtmodul', semester: 5, ects: 0, source: 'Studienplan_WI_B(1).pdf – manuell zu prüfen', sourceConfidence: 'manuell zu prüfen', dataLabel: 'Quelle prüfen', notes: 'Typischerweise Praxissemester oder projektbasierte Module. Bitte Quellpdf prüfen.' },

  // ── Semester 6 – Platzhalter ──────────────────────────────────────────────
  { id: 'S6-P1', moduleCode: 'S6-P1', title: 'Semester 6 – Modul 1 (Daten fehlen)',  type: 'Pflichtmodul', semester: 6, ects: 0, source: 'Studienplan_WI_B(1).pdf – manuell zu prüfen', sourceConfidence: 'manuell zu prüfen', dataLabel: 'Quelle prüfen', notes: 'Keine gesicherten Daten in knowledge_base.json.' },
  { id: 'S6-P2', moduleCode: 'S6-P2', title: 'Semester 6 – Modul 2 (Daten fehlen)',  type: 'Pflichtmodul', semester: 6, ects: 0, source: 'Studienplan_WI_B(1).pdf – manuell zu prüfen', sourceConfidence: 'manuell zu prüfen', dataLabel: 'Quelle prüfen', notes: 'Keine gesicherten Daten in knowledge_base.json.' },

  // ── Semester 7 – Platzhalter ──────────────────────────────────────────────
  { id: 'S7-BA', moduleCode: 'S7-BA', title: 'Bachelorarbeit (Platzhalter)',          type: 'Pflichtmodul', semester: 7, ects: 12, source: 'Studienplan_WI_B(1).pdf – manuell zu prüfen', sourceConfidence: 'manuell zu prüfen', dataLabel: 'Quelle prüfen', notes: 'Bachelorarbeit typischerweise im letzten Semester. Bitte Quellpdf prüfen.' },
  { id: 'S7-KO', moduleCode: 'S7-KO', title: 'Kolloquium (Platzhalter)',              type: 'Pflichtmodul', semester: 7, ects: 3,  source: 'Studienplan_WI_B(1).pdf – manuell zu prüfen', sourceConfidence: 'manuell zu prüfen', dataLabel: 'Quelle prüfen' },

  // ── WPM ───────────────────────────────────────────────────────────────────
  { id: 'WPM-SP',  moduleCode: 'WPM-SP',  title: 'WPM Fachsprache B Spanisch',         type: 'WPM', semester: null, ects: 4, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
  { id: 'WPM-LM',  moduleCode: 'WPM-LM',  title: 'Lieferantenmanagement',              type: 'WPM', semester: null, ects: 4, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
  { id: 'WPM-VH',  moduleCode: 'WPM-VH',  title: 'Verhandlungsführung',                type: 'WPM', semester: null, ects: 4, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
  { id: 'WPM-PM',  moduleCode: 'WPM-PM',  title: 'Produktmanagement und B2B Vertrieb', type: 'WPM', semester: null, ects: 4, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
  { id: 'WPM-SBS', moduleCode: 'WPM-SBS', title: 'Strategic Business Simulation',      type: 'WPM', semester: null, ects: 4, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },

  // ── AW ────────────────────────────────────────────────────────────────────
  { id: 'AW-HFE',  moduleCode: 'AW-HFE',  title: 'Human Factors Engineering',                     type: 'AW', semester: null, ects: 2, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
  { id: 'AW-AICA', moduleCode: 'AW-AICA', title: 'Vorträge – AICA Lectures / Design im Zeughaus', type: 'AW', semester: null, ects: 2, source: 'knowledge_base.json / Datenbank_Semestergruppen_TEC.pdf', sourceConfidence: 'hoch' },
];
