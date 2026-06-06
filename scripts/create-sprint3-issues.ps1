$repo = "hm-lucx/Nine_agent"

$issues = @(
  @{
    Title = "Sprint 3: Issue 1 - Offene Sprint-2-Issues analysieren und priorisieren"
    Body = @"
## Ziel
Alle offenen Sprint-2-Punkte prüfen und in Sprint 3 übernehmen.

## Ergebnis / Status
Erreicht. Es wurde klar erkannt, welche Punkte offen sind: PRIMUSS-Import, NINE-API, Semester 5-7, Szenarien, Stundenplanlogik, Dashboard und Agent.

## Einordnung
Dieses Issue dient als Sprint-3-Startpunkt und bündelt die Übergabe der offenen technischen Punkte aus Sprint 2.
"@
  },
  @{
    Title = "Sprint 3: Issue 2 - Dummy-Daten reduzieren und Datenquellen klar trennen"
    Body = @"
## Ziel
Demo-, Upload- und API-Daten sauber unterscheiden.

## Ergebnis / Status
Teilweise erreicht. Quellenhinweise wurden sichtbar gemacht.

## Offen
Die App arbeitet weiterhin zu stark mit Dummy- und Mock-Daten. Besonders Dashboard und Stundenplan ziehen nicht konsequent echte API- oder Uploaddaten.

## Grund
Die technischen Datenflüsse zwischen Upload, API, State und UI sind noch nicht vollständig verbunden.
"@
  },
  @{
    Title = "Sprint 3: Issue 3 - PRIMUSS-/Notenblatt-Import funktionsfähig machen"
    Body = @"
## Ziel
Notenblatt hochladen und automatisch Name, Studiengang, Fachsemester, ECTS, Module, Noten, Gewichtungen und Durchschnitt auslesen.

## Ergebnis / Status
Nicht vollständig erreicht.

## Offen
Dokumentenerkennung funktioniert noch nicht stabil. PDF-Reader und automatische Überschreibung von Dashboard bzw. Meine Leistungen bleiben offen.

## Grund
Das strukturierte Auslesen des PRIMUSS-/Notenblatt-PDFs ist technisch instabil und benötigt robustere Parsing-Logik.
"@
  },
  @{
    Title = "Sprint 3: Issue 4 - Dashboard mit echten Leistungsdaten aktualisieren"
    Body = @"
## Ziel
Dashboard soll durch PRIMUSS-Upload und NINE-Daten dynamisch überschrieben werden.

## Ergebnis / Status
Teilweise erreicht. Dashboard wurde technisch dynamischer.

## Offen
Das Dashboard zieht weiterhin nicht zuverlässig echte PRIMUSS- und NINE-Daten. Semesterstatus 5-7 und falsche Hinweise müssen noch angepasst werden.

## Grund
Die Datenbasis aus Upload/API ersetzt die Demo-Daten noch nicht konsequent.
"@
  },
  @{
    Title = "Sprint 3: Issue 5 - Module aus Semester 5 bis 7 korrekt hinterlegen"
    Body = @"
## Ziel
Semester 5, 6 und 7 mit echten Modulen statt Platzhaltern einbauen.

## Ergebnis / Status
Teilweise bzw. nicht belastbar erreicht.

## Offen
Die Semester werden angezeigt, aber nicht korrekt und vollständig aus echten Quellen validiert. Die App meldet teilweise, Quellen nicht zu finden.

## Grund
Die Modulquellen für Semester 5-7 müssen fachlich geprüft und technisch sauber eingebunden werden.
"@
  },
  @{
    Title = "Sprint 3: Issue 6 - NINE-API-Anbindung weiterentwickeln"
    Body = @"
## Ziel
Echte Modulangebote und Termine aus NINE ziehen.

## Ergebnis / Status
Nicht vollständig erreicht.

## Offen
API-Status und Mock-Service existieren, aber echte API-Daten werden nicht zuverlässig gezogen.

## Gründe
API-Endpunkte wurden nicht sicher erkannt. CORS, Live-Modus und mögliche Authentifizierung sind weiterhin unklar. Die stabile Live-Anbindung konnte trotz mehrerer Versuche nicht umgesetzt werden.
"@
  },
  @{
    Title = "Sprint 3: Issue 7 - Stundenplan und Empfehlungsszenarien verbinden"
    Body = @"
## Ziel
Auswahl eines Szenarios soll den Stundenplan direkt verändern.

## Ergebnis / Status
Nicht vollständig erreicht.

## Offen
Stundenplan und Szenarien sind noch nicht verbunden. Szenarien sind außerdem nicht direkt in der Stundenplanansicht auswählbar.

## Grund
Die Empfehlungslogik und die Stundenplanansicht arbeiten noch nicht auf derselben dynamischen Datenbasis.
"@
  },
  @{
    Title = "Sprint 3: Issue 8 - Sperrzeiten stundenweise statt nur tageweise ermöglichen"
    Body = @"
## Ziel
Nutzer sollen nicht nur ganze Tage, sondern konkrete Zeitfenster sperren können.

## Ergebnis / Status
Nicht vollständig erreicht.

## Offen
Sperrtage werden teilweise berücksichtigt, aber es gibt keine stundenweise Sperrlogik.

## Grund
Die Regel-Engine ist zu grob und noch nicht mit echten Terminen verbunden.
"@
  },
  @{
    Title = "Sprint 3: Issue 9 - Empfehlungsszenarien erweitern und plausibel machen"
    Body = @"
## Ziel
Mehrere Szenarien anbieten und Zweige bzw. Vertiefungen korrekt berücksichtigen.

## Ergebnis / Status
Teilweise bzw. offen.

## Offen
Szenarien sind vorgesehen, aber nicht ausreichend dynamisch. Bestimmte Zweige, zum Beispiel Bio, werden noch nicht korrekt übernommen.

## Grund
Die Empfehlung arbeitet noch nicht vollständig auf geprüften Studienverlaufs- und Terminquellen.
"@
  },
  @{
    Title = "Sprint 3: Issue 10 - Planungsparameter bereinigen"
    Body = @"
## Ziel
Überflüssige Optionen entfernen, zum Beispiel Zertifikate einplanen und unnötige Planungsziele.

## Ergebnis / Status
Teilweise bzw. offen.

## Offen
Falsche oder unnötige Optionen wurden erkannt, aber noch nicht vollständig sauber entfernt.

## Grund
KI-generierte Funktionen haben Optionen ergänzt, die fachlich nicht gefordert waren und nachträglich bereinigt werden müssen.
"@
  },
  @{
    Title = "Sprint 3: Issue 11 - Regelbasierten Chatbot vorbereiten"
    Body = @"
## Ziel
Chatbot soll einfache Studienplanungsfragen beantworten können.

## Ergebnis / Status
Nicht vollständig erreicht.

## Offen
Der Chatbot ist noch nicht ausreichend robust. Er soll einfache, unpräzise Fragen und Schreibfehler verstehen, zum Beispiel: Kann ich das Modul aus dem 3. Semester besuchen?

## Grund
Die Antwortlogik ist noch nicht belastbar genug mit Regeln, Modulstatus und echten Daten verbunden.
"@
  },
  @{
    Title = "Sprint 3: Issue 12 - iCal-/Kalender-Export vorbereiten"
    Body = @"
## Ziel
Stundenplan oder empfohlene Module als Kalenderlink exportieren.

## Ergebnis / Status
Nicht vollständig erreicht.

## Offen
iCal-Link war als Ziel definiert, aber kein stabiler Kalenderexport wurde als abgeschlossen dokumentiert.

## Grund
Die Basisdaten für Termine und Szenarien sind selbst noch nicht zuverlässig genug.
"@
  },
  @{
    Title = "Sprint 3: Issue 13 - Agentenfunktion als Machbarkeitsprüfung dokumentieren"
    Body = @"
## Ziel
Prüfen, ob ein Agent sich in NINE/Moodle einloggen und Daten ziehen kann.

## Ergebnis / Status
Nicht produktiv erreicht, aber als Learning wertvoll.

## Offen
Agentenfunktion wurde versucht, scheiterte aber an instabiler Verbindung, Authentifizierung, vermutlich 2FA und Toolgrenzen.

## Wichtiger Hinweis
Zugangsdaten dürfen nicht fest in Code oder GitHub gespeichert werden.
"@
  }
)

# Pre-flight checks before attempting any API calls
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "GitHub CLI (gh) is not installed or not on PATH. Aborting."
  exit 1
}

gh auth status --hostname github.com 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Not authenticated with GitHub CLI. Run 'gh auth login' first. Aborting."
  exit 1
}

$created = 0
$failed  = 0
$failedTitles = @()

foreach ($issue in $issues) {
  Write-Host "Creating: $($issue.Title)"
  gh issue create --repo $repo --title $issue.Title --body $issue.Body
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "  FAILED to create issue: $($issue.Title)"
    $failed++
    $failedTitles += $issue.Title
  } else {
    $created++
  }
}

Write-Host ""
Write-Host "Done. $created issue(s) created, $failed failed."
if ($failed -gt 0) {
  Write-Warning "The following issues were NOT created:"
  foreach ($t in $failedTitles) {
    Write-Warning "  - $t"
  }
  exit 1
}
