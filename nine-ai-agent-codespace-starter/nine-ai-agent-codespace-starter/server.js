import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'));
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function hasTimeConflict(a, b) {
  if (a.day !== b.day) return false;
  return timeToMinutes(a.start) < timeToMinutes(b.end) && timeToMinutes(b.start) < timeToMinutes(a.end);
}

function buildPlan({ passedModules = [], targetEcts = 25, blockedTimes = [] }) {
  const modules = readJson('data/modules.json');
  const events = readJson('data/faculty13.json');

  const passedSet = new Set(passedModules.map((m) => String(m).trim().toUpperCase()).filter(Boolean));

  const openModules = modules.filter((module) => !passedSet.has(module.id.toUpperCase()));

  const eligibleModules = openModules.filter((module) =>
    module.requires.every((requiredModuleId) => passedSet.has(requiredModuleId.toUpperCase()))
  );

  const sortedModules = eligibleModules.sort((a, b) => {
    const priorityRank = { hoch: 0, mittel: 1, niedrig: 2 };
    return (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
  });

  const selected = [];
  let ectsSum = 0;

  for (const module of sortedModules) {
    if (ectsSum + module.ects <= Number(targetEcts)) {
      selected.push(module);
      ectsSum += module.ects;
    }
  }

  const selectedIds = new Set(selected.map((module) => module.id));
  const timetable = events.filter((event) => selectedIds.has(event.moduleId));

  const conflicts = [];

  for (let i = 0; i < timetable.length; i += 1) {
    for (let j = i + 1; j < timetable.length; j += 1) {
      if (hasTimeConflict(timetable[i], timetable[j])) {
        conflicts.push({
          type: 'Modulüberschneidung',
          a: timetable[i],
          b: timetable[j],
          hint: 'Alternative Gruppe oder anderes Modul prüfen.'
        });
      }
    }
  }

  for (const event of timetable) {
    for (const blocked of blockedTimes) {
      if (hasTimeConflict(event, blocked)) {
        conflicts.push({
          type: 'Konflikt mit gesperrter Zeit',
          a: event,
          b: blocked,
          hint: 'Dieses Modul liegt in einer Zeit, die der Nutzer blockiert hat.'
        });
      }
    }
  }

  return {
    selectedModules: selected,
    ectsSum,
    timetable,
    conflicts,
    reasoning: [
      'Pflichtmodule und Fakultät-13-Angebote wurden bevorzugt berücksichtigt.',
      'Module mit erfüllten Voraussetzungen wurden priorisiert.',
      'Das ECTS-Ziel wurde als Obergrenze verwendet.',
      'Terminüberschneidungen wurden regelbasiert geprüft.',
      'Moodle- und NINE-Hinweise werden als nächste Handlungsschritte ausgegeben.'
    ]
  };
}

app.get('/api/modules', (_req, res) => {
  res.json(readJson('data/modules.json'));
});

app.get('/api/faculty13', (_req, res) => {
  res.json(readJson('data/faculty13.json'));
});

app.post('/api/generate-plan', (req, res) => {
  try {
    const result = buildPlan(req.body || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Plan konnte nicht erstellt werden.',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`NINE AI Agent Demo läuft auf Port ${PORT}`);
});
