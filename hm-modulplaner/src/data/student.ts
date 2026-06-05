import type { StudentProfile } from '../types';

export const student: StudentProfile = {
  name: 'Jonas Weber',
  matriculationNumber: 'WI20260037',
  studyProgram: 'Bachelor Wirtschaftsingenieurwesen',
  specialization: 'Industrielle Technik / TEC',
  semesterContext: 'SoSe 2026',
  blockedDays: ['Montag', 'Freitag'],
  completedEcts: 42,
  passedModules: [
    // ── Semester 1 ──────────────────────────────────────────────────────
    { code: 'G1',  module: 'Mathematik I',               semester: 1, ects: 6, grade: 2.0, attemptCount: 1, passedDate: 'WiSe 2024/25', status: 'bestanden', source: 'dummy_student.json', dataLabel: 'Demo' },
    { code: 'G3',  module: 'Technische Mechanik',         semester: 1, ects: 5, grade: 2.7, attemptCount: 1, passedDate: 'WiSe 2024/25', status: 'bestanden', source: 'dummy_student.json', dataLabel: 'Demo' },
    { code: 'G5',  module: 'Chemie und Werkstoffe',       semester: 1, ects: 4, grade: 1.7, attemptCount: 1, passedDate: 'WiSe 2024/25', status: 'bestanden', source: 'dummy_student.json', dataLabel: 'Demo' },
    { code: 'G8',  module: 'Technisches Zeichnen',        semester: 1, ects: 4, grade: 2.3, attemptCount: 1, passedDate: 'WiSe 2024/25', status: 'bestanden', source: 'dummy_student.json', dataLabel: 'Demo' },
    { code: 'G10', module: 'Betriebswirtschaftslehre',    semester: 1, ects: 4, grade: 2.0, attemptCount: 1, passedDate: 'WiSe 2024/25', status: 'bestanden', source: 'dummy_student.json', dataLabel: 'Demo' },
    { code: 'G12', module: 'Grundlagen der Informatik',   semester: 1, ects: 5, grade: 1.3, attemptCount: 1, passedDate: 'WiSe 2024/25', status: 'bestanden', source: 'dummy_student.json', dataLabel: 'Demo' },
    // ── Semester 2 ──────────────────────────────────────────────────────
    { code: 'G2',  module: 'Mathematik II',               semester: 2, ects: 5, grade: 2.3, attemptCount: 1, passedDate: 'SoSe 2025',    status: 'bestanden', source: 'dummy_student.json', dataLabel: 'Demo' },
    { code: 'G7',  module: 'Elektrotechnik',              semester: 2, ects: 5, grade: 3.0, attemptCount: 2, passedDate: 'SoSe 2025',    status: 'bestanden', source: 'dummy_student.json', dataLabel: 'Demo' },
    { code: 'G11', module: 'Buchführung und Bilanzierung', semester: 2, ects: 4, grade: 2.7, attemptCount: 1, passedDate: 'SoSe 2025',   status: 'bestanden', source: 'dummy_student.json', dataLabel: 'Demo' },
  ],
  openModules: [
    { code: 'G4',  module: 'Physik',              semester: 2, ects: 5, type: 'Pflichtmodul', status: 'offen', currentlyAvailable: true,  source: 'dummy_student.json' },
    { code: 'G6',  module: 'Werkstofftechnik',    semester: 2, ects: 4, type: 'Pflichtmodul', status: 'offen', currentlyAvailable: false, blockedReason: 'Montag gesperrt', source: 'dummy_student.json' },
    { code: 'G9',  module: 'Maschinenelemente',   semester: 2, ects: 5, type: 'Pflichtmodul', status: 'offen', currentlyAvailable: false, blockedReason: 'Montag gesperrt', source: 'dummy_student.json' },
    { code: 'G13', module: 'Volkswirtschaftslehre', semester: 2, ects: 4, type: 'Pflichtmodul', status: 'offen', currentlyAvailable: true, source: 'dummy_student.json' },
  ],
  progressionStatus: {
    semester_1_completed: true,
    semester_2_completed: false,
    semester_3_allowed: true,
    semester_4_allowed: false,
    semester_4_block_reason: 'Mehr als ein Modul aus Semester 1–2 offen.',
  },
  notes: 'Demo-Daten. Noten sind Beispielwerte und ersetzen keine offizielle PRIMUSS-Berechnung.',
};
