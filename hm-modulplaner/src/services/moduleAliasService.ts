/**
 * Module Alias Service – Sprint 3 Nachbesserung
 *
 * Bekannte Alias-Zuordnungen zwischen NINE-moduleTag/moduleName
 * und typischen Notenblatt-Schreibweisen.
 *
 * Erweiterbar: einfach neue Einträge hinzufügen.
 */

export interface ModuleAlias {
  nineTag: string;             // NINE moduleTag (z. B. "G1")
  nineName: string;            // NINE moduleName (z. B. "Mathematik")
  aliases: string[];           // Notenblatt-Schreibweisen / Abkürzungen
  ects?: number;
}

export const MODULE_ALIASES: ModuleAlias[] = [
  // ── Semester 1 ────────────────────────────────────────────────────────────
  { nineTag: 'G1',  nineName: 'Mathematik',            aliases: ['Mathematik I', 'Mathe 1', 'Mathe I', 'Mathematik 1', 'Math I'],      ects: 6 },
  { nineTag: 'G2',  nineName: 'Betriebswirtschaftslehre I', aliases: ['BWL I', 'BWL 1', 'Betriebswirtschaft I', 'Betriebswirtschaft 1', 'BWL Grundlagen'], ects: 5 },
  { nineTag: 'G3',  nineName: 'Informatik',            aliases: ['Informatik Grundlagen', 'Grundlagen der Informatik', 'Inf', 'Info'],  ects: 5 },
  { nineTag: 'G4',  nineName: 'Physik',                aliases: ['Physik I', 'Physik 1', 'Experimentalphysik'],                        ects: 5 },

  // ── Semester 2 ────────────────────────────────────────────────────────────
  { nineTag: 'G5',  nineName: 'Mathematik II',         aliases: ['Mathe 2', 'Mathe II', 'Mathematik 2', 'Math II'],                    ects: 6 },
  { nineTag: 'G6',  nineName: 'Werkstofftechnik',      aliases: ['Werkstoff', 'Werkstoffkunde', 'Materialwissenschaft'],               ects: 4 },
  { nineTag: 'G7',  nineName: 'Betriebswirtschaftslehre II', aliases: ['BWL II', 'BWL 2', 'Betriebswirtschaft II'],                     ects: 5 },
  { nineTag: 'G8',  nineName: 'Elektrotechnik',        aliases: ['Elektrotechnik I', 'Elektrotechnik 1', 'ET', 'ET I'],               ects: 5 },
  { nineTag: 'G9',  nineName: 'Maschinenelemente',     aliases: ['ME', 'ME I', 'Maschinenelemente I', 'Maschinenelemente 1'],          ects: 5 },
  { nineTag: 'G10', nineName: 'Wirtschaftsinformatik', aliases: ['WI', 'Winfo', 'Wirtschaftsinf.'],                                    ects: 5 },

  // ── Semester 3 ────────────────────────────────────────────────────────────
  { nineTag: 'G11', nineName: 'Statistik',             aliases: ['Statistik I', 'Statistik 1', 'Stat'],                               ects: 5 },
  { nineTag: 'G12', nineName: 'Technische Mechanik I', aliases: ['TM 1', 'TM I', 'TM1', 'TMI', 'Technische Mechanik 1'],             ects: 5 },
  { nineTag: 'G13', nineName: 'Volkswirtschaftslehre', aliases: ['VWL', 'Volkswirtschaft', 'VWL Grundlagen'],                         ects: 4 },

  // ── Semester 4 ────────────────────────────────────────────────────────────
  { nineTag: 'TEC-TM2', nineName: 'Technische Mechanik II', aliases: ['TM 2', 'TM II', 'TM2', 'TMII', 'Technische Mechanik 2'],    ects: 5 },
  { nineTag: 'TEC-ME2', nineName: 'Maschinenelemente 2',    aliases: ['ME II', 'ME 2', 'Maschinenelemente II'],                     ects: 5 },
  { nineTag: 'TEC-GFT', nineName: 'Grundlagen der Fertigungstechnik', aliases: ['GFT', 'Fertigungstechnik', 'Fertigungstechnik I'], ects: 4 },
  { nineTag: 'TEC-ET',  nineName: 'Energietechnik',         aliases: ['ET II', 'Energietechnik I'],                                 ects: 4 },

  // ── Semester 5 ────────────────────────────────────────────────────────────
  { nineTag: 'PPQM', nineName: 'Projekt- und Qualitätsmanagement', aliases: ['PQM', 'PPQM', 'Projektmanagement', 'PM', 'Projekt und Qualitätsmanagement'], ects: 5 },
  { nineTag: 'PROD', nineName: 'Produktionswirtschaft', aliases: ['Produktionswirtschaft I', 'Produktion'],                          ects: 5 },
  { nineTag: 'LOG',  nineName: 'Logistik',              aliases: ['Logistik I', 'Supply Chain Management', 'SCM'],                   ects: 5 },
  { nineTag: 'FIBU', nineName: 'Externes Rechnungswesen', aliases: ['Externes Rechnungswesen', 'Rechnungswesen', 'Buchhaltung', 'Kostenrechnung', 'REWE'], ects: 5 },
];

// Lookup: NINE-Tag → Alias
export function findAliasByTag(tag: string): ModuleAlias | undefined {
  const t = tag.toUpperCase();
  return MODULE_ALIASES.find(a => a.nineTag.toUpperCase() === t);
}

// Lookup: Notenblatt-Name → NINE-Tag
export function findTagByAlias(name: string): ModuleAlias | undefined {
  const norm = name.toLowerCase().trim();
  return MODULE_ALIASES.find(a =>
    a.nineName.toLowerCase() === norm ||
    a.aliases.some(alias => alias.toLowerCase() === norm)
  );
}
