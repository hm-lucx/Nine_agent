import { useState } from 'react';
import { getRecommendedModules, getStudent, getTotalRecommendedEcts } from '../services/knowledgeService';

export default function JsonExport() {
  const [copied, setCopied] = useState(false);
  const recs = getRecommendedModules();
  const student = getStudent();
  const totalEcts = getTotalRecommendedEcts();

  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      student: student.name,
      matriculationNumber: student.matriculationNumber,
      semesterContext: student.semesterContext,
      totalEcts,
      note: 'Sprint 1 – Empfehlung basiert auf recommended_schedule_example.json',
    },
    recommendation: recs.map((r) => ({
      moduleCode: r.moduleCode,
      moduleTitle: r.moduleTitle,
      type: r.type,
      semester: r.semester,
      day: r.day,
      time: r.timeRaw,
      ects: r.ects,
      reason: r.reason,
      source: r.source,
    })),
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = jsonString;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="page">
      <h1>JSON Export</h1>
      <p className="source-note">
        Die aktuelle Empfehlung als maschinenlesbares JSON.
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <button className="btn-copy" onClick={handleCopy}>
          {copied ? '✓ Kopiert!' : 'JSON kopieren'}
        </button>
      </div>

      <pre className="json-block">{jsonString}</pre>
    </div>
  );
}
