# Straßendrogen-Kaufmenü – Prüfung (27.10.2026)

330 Tests bestanden, 0 fehlgeschlagen. Vollständige Suite seriell: test-results/drugshop-suite-final.txt (ca. 68 Sekunden). Nach Ergänzung der Airhypo-Kaufhilfe zusätzlich 26 gezielte Ausrüstungs-/Drogentests bestanden.

Fünf neue Tests prüfen alle 18 Namen/Preise, eindeutige IDs, Regeldetails, Kauf/Mengen/Speicherung/PDF-Inventardaten, Verbrauch ohne Rückerstattung oder Attribut-/Fertigkeitsänderung, Kaufkorrektur nur unbenutzter Dosen und alphabetische Darstellung mit Preis-/Quellen-/Wirkungsfiltern. Keine automatische Wirkungs-, Zeit- oder Suchtverwaltung.

Browser im getrennten localhost-Testprofil: 18/18 Einträge sichtbar, Black Lace gekauft (2450 → 2400 eb), eine Dosis verwendet (Inventar leer, weiterhin 2400 eb). Aufklappbare Hinweise erklären Eigengebrauch und Airhypo-Nahkampfangriff gegen Gegner. Airhypo für 50 eb separat kaufbar. Vorhandene Charaktere unter 127.0.0.1 nicht verändert. Screenshot: test-results/drugshop.jpg.

---

# Getrennter Lebensweg und erweitertes Monatsbudget – Prüfung (27.10.2026)

325 Tests bestanden, 0 fehlgeschlagen, vollständige Suite ca. 39 Sekunden. Protokoll: test-results/lifepath-budget-suite-final.txt. Sechs zusätzliche Tests prüfen Trennung der Flair-Fragen, sechs finanzielle Fragen, Summen 2.700/1.500/7.050 eb, getrennte Einnahmen und Ausgaben, unverändertes Charakterkonto, negative eigene Einnahmen/Grenzen, unvollständige Monatsangaben, alte Speicherstände und PDF-Übernahme ohne Verdrängen bestehender Gegenstände.

Browser: bestehenden Charakter F nur geöffnet; 14/14 Flair- und 3/6 Alltagsfragen übernommen, neue Angehörigenfrage mit vier verschiedenen Ausgaben plus eigener Idee sichtbar. Getrennte Bereichsschalter, eine Frage, bekannte Ausgaben 3.350 eb und offene neue Beträge korrekt dargestellt. Keine Antworten ausgewählt und kein Charaktergeld verändert. Screenshot: test-results/lifepath-budget.jpg; neue Fassung lifeledger1 geöffnet.

PDF-Beispiel mit 14 Kleidungsstücken, Techhair, Mietcontainer, guter Fertigkost und drei zusätzlichen Verpflichtungen: vier Seiten. Monatliche Belastung 3.200 eb; Verpflichtungen als Monatszeilen in den bestehenden Notizen, Kleidung/Mode und Unterkunft korrekt zugeordnet. Seite 2 gerendert und visuell geprüft (tmp/pdfs/lifepath-budget-page-2.png); kompakte Mode-Vorschau verhindert Abschneiden von Budget/Mode-Cyberware. Vollständige Formularwerte einschließlich monatlicher Ausgaben, Einnahmen und Nettobelastung unabhängig mit pypdf gelesen.

---

# Gesamtsuite nach Fehlerbehebung (27.10.2026)

319 Tests bestanden, 0 fehlgeschlagen, 0 übersprungen. Vollständiger Lauf mit node --test --test-concurrency=2 --test-reporter=spec --test-reporter-destination=test-results/full-suite-fixed.txt tests/*.test.mjs; Dauer ca. 37 Sekunden. Protokoll: test-results/full-suite-fixed.txt.

Tatsächlicher Laufzeitfehler behoben: Die neue Biomonitor-Dopplungswarnung akzeptiert wie die übrige Auswertung einen fehlenden Cyberware-Katalog. Attribut-/Fertigkeitstests mit bewusst reduzierter Regelkonfiguration funktionieren dadurch wieder, ohne die neuen Grenzen aufzuheben.

Bestehende Prüfungen zu medizinischem Ausbau setzen jetzt ausdrücklich die Session-Freischaltung voraus; alle bisherigen Kosten-, Menschlichkeits- und Abhängigkeitsassertionen bleiben bestehen. Der CEMK-Test verlangt bei explizitem vollem linken Arm einen Fehler ohne Mutation und prüft den automatischen rechten Arm nur ohne vorgegebene Seite. Die normale Kaufansicht wird anhand der aktuellen direkten Kaufsteuerung geprüft.

Fünf zusätzliche Regressionstests in tests/creation-updates.test.mjs sichern kostenlose Korrektur inklusive Basis/Optionen und Rückrechnung, Biomonitor-Grenze an beiden Mutationseingängen sowie korrigierbare alte Dopplungen, Seitenwahl/Belegung/Gesamtpreise ohne Mutation, 98 unterschiedliche Kleidungsstücke in sieben Stilen und atomare Doppelkaufsperre samt Besitzanzeige und Wiederfreigabe.

---

# Erweiterte Garderobe – Sichtprüfung (27.10.2026)

Keine automatisierten Tests ausgeführt. Kataloginventur: 98 Kleidungsstücke, jeweils 14 in allen sieben Stilen, davon 49 zusätzliche eigene Rollenspiel-Varianten mit individuellen Beschreibungen und Preisen. Vorhandene IDs und Preise erhalten. Syntax und Änderungen kontrolliert.

Im Browser neue Beschreibungen für Trenchcoat, Netzoberteil und Faltenrock visuell geprüft. Vorhandene Anzughose zeigt Bereits im Kleiderschrank und gesperrten Kaufknopf. Keine Käufe, Entfernungen oder Charakteränderungen vorgenommen. Dieselbe Dublettensperre liegt in buyEquipment und gilt dadurch auch für Käufe/Beute im Session-Report. Vorhandene alte Mehrfachkäufe werden nicht automatisch gelöscht. Screenshot: test-results/clothing-roleplay.jpg. Neue Fassung wardrobe1 im separaten Tab geöffnet.

---

# Cyberware-Seitenwahl und kostenlose Erstellungskorrektur – Sichtprüfung (27.10.2026)

Keine automatisierten Tests ausgeführt. Syntax und Änderungen kontrolliert. Separates localhost-Profil: Biomonitor einmal gekauft, erneuter Kauf gesperrt. Direkte kostenlose Entfernung stellte die 800 eb Fashion-Zuschuss wieder her.

Cyberauge explizit links eingebaut. Anschließend Chyron-Seitenwahl mit vorhandener linker Basis (100 eb, danach 2/3 Optionen frei) und natürlichem rechten Auge (200 eb inklusive neuer Basis, danach 2/3 frei). Explizite Wahl rechts installierte Cyberauge und Chyron tatsächlich rechts. Vor kostenlosem Entfernen der rechten Basis wurden beide betroffenen Komponenten aufgelistet. Bestätigung entfernte beide, ließ das linke Auge erhalten und stellte 2.450 eb, 33/38 HUM, EMP 3 und eine installierte Komponente her. Keine Ausbauhistorie für diese Erstellungskorrektur. Screenshot: test-results/cyber-side-selection.jpg.

Vorhandene gespeicherte Mehrfacheinbauten werden nicht automatisch gelöscht. Neue Grenzprüfung sowohl beim Einzelkauf als auch beim Übernehmen eines Entwurfs; explizite Seitenwahl verwendet keinen Ausweichort. Cachekennung cybersides1.

---

# Alltag und vereinfachte Erstellung – Sichtprüfung (27.10.2026)

Keine automatisierten Tests ausgeführt (Nutzervorgabe). Bestehende Erwartungen für Fragenzahl und alternative Tragegrenze angepasst. Syntax und Modulimporte kontrolliert.

Browser mit separatem localhost-Profil: Empfehlung INT 6 auf 5 vermindert, automatischer Wechsel zu Punkteverteilung und ein freier Punkt sichtbar. Sprache/Heimat vor dem Budget, acht Sprachen, Kartenauswahl Watson mit hervorgehobener Position. Solo sieht keinen Netrunner-Tab. Techhair direkt gekauft und eingebaut: 100 eb aus Zuschuss, Hauptbudget 2.550 eb. Stadtjacke für 50 eb danach: Zuschuss 650 eb, Hauptbudget unverändert. Lebensweg vollständig durchlaufen; Mietcontainer 1.000 plus gute Fertigkost 600 ergibt 1.600 eb monatlich. Schritt 8 zunächst verborgen, erst Freischaltknopf öffnet ihn; noch kein Report gebucht.

PDF-Beispiel unter tmp/pdfs/everyday-example.pdf mit sieben Kleidungsstücken und Techhair: vier Seiten. Modefeld, Unterkunft, Miete und Lebensstil sowie Cheatsheet gerendert und visuell geprüft. Modetext kompakt, ohne abgeschnittene letzte Zeile; vollständige Inhalte als editierbare Formularwerte erhalten. Vier neue Formularfelder unabhängig mit pypdf einschließlich geerbter Widgetwerte und Appearance-Streams kontrolliert. Rendering: tmp/pdfs/everyday-page-2.png.

Bestehender Charakter S nur geöffnet und neue, unbeantwortete Alltagsfrage angezeigt; keine Antwort, kein Kauf, kein Session-Abschluss vorgenommen. Alter Tab unverändert. Neue Fassung everyday3 im separaten Tab geöffnet. Screenshot: test-results/everyday-lifepath.jpg.

---

# Geführter After Session Report – Prüfung (27.10.2026)

314 Tests bestanden (`test-results/session-guide-tests.txt`), darunter zehn neue Tests für sieben Einzelfragen, bedingte Formulare, Belohnungsänderungen ohne Doppelbuchungen, Notizerhalt, stabile Besitzreferenzen, Bearbeiten und Abschluss. Nach der letzten Eingabefokus-Korrektur erneut alle 57 gezielten Session-Tests bestanden.

Die Oberfläche zeigt eine Frage pro Station. Weitere Möglichkeiten bleiben aufklappbar; vor dem Abschluss zeigt eine gemeinsame Übersicht alle Änderungen. Regeln und atomarer Abschluss verwenden die bestehende Engine.

Browserprüfung mit separater Testfigur auf localhost: Belohnung von 100 auf 200 eb geändert, 60 IP vergeben, Trefferpunkte auf 30 gesetzt, zwei kostenlose Agents und ein Ziel ergänzt. Navigation und Bearbeiten erzeugen keine doppelten Vorgänge. Abschluss ergab 3.050 eb, 100 IP und 30/45 TP; Historie korrekt. Weiteren unveränderten Report abgeschlossen und Erfolgshinweis mit PDF-Schaltfläche geprüft.

Der ursprüngliche Tab des echten Charakters S bleibt unverändert. Seine sichtbaren begonnenen Angaben (Oneshot 1, Notiz Etwas, 1.000 eb vom Fixer) wurden über die Oberfläche in einen neuen, unvollendeten Entwurf im separaten Tab übernommen. Kein Abschluss für S; gespeicherte Werte bleiben 50 eb, 0 IP, 45/45 TP und 38/60 HUM.

Neue Ansicht visuell auf Lesbarkeit, einzelne Frage, zugeklappte Zusatzoptionen und klare Navigation geprüft. Screenshot: `test-results/session-guide-rewards.jpg`. Browser-Cachekennung guide5. Keine neuen Frameworks.

---

# After Session Report – aktuelle Prüfung (27.10.2026)

304 Tests bestanden mit `node --test --test-concurrency=2 tests/*.test.mjs` (`test-results/session-report-tests.txt`). 47 neue Tests prüfen Format-10-Migration/Backup, deterministische Vorschau, atomaren Abschluss, Geld/Beute/Verkauf/Verbrauch, angebrochene Munition, eigene Gegenstände, IP-Einzelkosten/×2/Mehrfachränge/Zeitbestätigung/Ranggrenzen, alle zehn Rollen, Medtech-Grenzen, Waffenaufsätze, getrennten Cyberware-Besitz/Einbau/Ausbau/Wiedereinbau, Slots und Kapazitäten, gewürfelten HL, Therapie/Maximum/kein Banking, EMP-Fertigkeiten, HP/Stabilisierung/Ruhe/Schnellheilung je Spieldatum, Verletzungsbehandlung, Kopf-/Körper-SP, defekte Implantate/Paarfunktionen, Lebensweg, wiederholtes Laden, veraltete Entwürfe, Korrekturbuchungen, Speicherfehler und vierseitigen PDF-Export.

Regelabgleich: Grundregelwerk S. 229–232/411, offizielle RTG-FAQ v1.3 S. 6 (regulärer Wiedereinbau verursacht erneut HL), RTG From the Mayor’s Desk 05.02.2021 (HUM/Maximum/Therapie), offizielle Roll20 Free Basic Rules (Heilung/Medtech-Grenzen). In der Session werden die Erstellungsdurchschnitte nicht still als Würfelverluste übernommen; gültiges manuelles Würfelergebnis erforderlich.

Browser-Ende-zu-Ende mit separater Testfigur auf localhost, unabhängig von 127.0.0.1: +800 eb, +60 IP, Cybertech 0→1 für 20 IP, Cyberauge als Beute/Einbau ohne Kaufpreis, −12 TP, Standardtherapie 12 gewürfelt/5 tatsächlich wiederhergestellt und 500 eb. Nach Abschluss und Neuladen unverändert 2.850 eb, 40 IP, 33/45 TP, 78/78 HUM, EMP 7 und genau ein Report. Erneutes Öffnen der Historie bucht nichts. Separater zweiter Entwurf in finaler Fassung: zweites Cyberauge ohne HUM-Eingabe blockiert, mit 2W6-Ergebnis 4 korrekt 2.850→2.750 eb, 78→74 HUM, Maximum 78→76; Entwurf verworfen. Screenshot der Historie: `test-results/session-history-browser.jpg`.

Der echte Charakter S wurde mit unveränderten Spielwerten übernommen und nur in Schritt 8 geöffnet: 50 eb, 45/45 TP, 38/60 HUM, EMP 3, Rang 4. Kein Report und kein Testkauf für S. Originaldaten wurden von der bestehenden Migration gesichert. Screenshot: `test-results/after-session-report.jpg`.

PDF `output/pdf/RED-After-Session-Beispiel.pdf`: vier Seiten mit Rang 5, Cybertech 1/Basis 5, 180 IP, Ruf 0, 33/45 TP, 77/78 HUM, EMP 7, Körper-SP 8, drei übrigen Patronen, 2.850 eb und Rippenverletzung. Seiten 1/2/4 gerendert und visuell geprüft; verletzungsspezifische Hinweise im Bogen und Cheatsheet. Kanonische Formularwerte, geerbte Widgetwerte und Appearance-Streams unabhängig geprüft; ursprüngliche Vorlage unverändert. Prüfwerte: `test-results/session-pdf-verification.txt`; Beispielcharakter/Report als JSON unter `test-results/session-example-*.json`. Renderings unter `tmp/pdfs/session-*`.

Technik: bestehende Berechnungen erweitert, keine zweite Charakter-Engine und keine neuen Frameworks. Vor Abschluss ausschließlich Klone; stabile IDs, keine verschachtelten Charakter-/Porträtkopien in der Historie. Korrekturen bewahren Originalberichte. Komplexe individuelle Tech-Upgrades/Verletzungsfolgen bleiben bestätigte Hinweise, statt neue pauschale Regeln zu erfinden. Importgraph und Datenabruf auf session6 aktualisiert.

---

# CEMK-Cyberwaffen – aktuelle Prüfung (27.10.2026)

257 Tests bestanden mit `node --test --test-concurrency=2 tests/*.test.mjs`; Ergebnis: `test-results/cemk-tests.txt`. Neun neue Tests prüfen Preis/Slots/HUM, automatisch bezahlte Basis, unveränderte Entwürfe bei fehlendem Budget, Wiederverwendung bestehender Arme, Paarfunktionen nur über beide Arme, doppelte gleiche Armoptionen, unveränderte echte KRA/TP/Todesrettung, exzellente Qualität, Monodraht-Reichweite/kritische Auswahl, deutsche/englische Suche, Ausbauabhängigkeiten und Tragegrenzen. Zusätzlich 30 PDF-Exporte (drei Waffen × zehn Rollen): vier Seiten, ein A4-Cheatsheet, Waffenfelder vorhanden und Charakterdaten unverändert.

Regelquellen: Cyberpunk: Edgerunners Mission Kit S. 35, offizieller RTG Night Market Index v1.24 (Kosten), Abgleich der drei CEMK-Einträge in der Cyberpunk Wiki. Das spätere kostenlose Cyberware Enhancements enthält Aufrüstungen; implementiert sind die drei angefragten Grundimplantate.

Browser: Cybergliedmaßen mit allen drei Karten, automatischem Cyberarm/Gesamtpreis und 21 HUM inklusive Basis visuell geprüft. Screenshot `test-results/cemk-cyberware.jpg`. Der gespeicherte Charakter S bleibt bei 50 eb, acht Implantaten und unverändertem Inventar; keine Testkäufe oder Profilwechsel. Importgraph/Datenabruf auf cemk1 aktualisiert.

PDF `output/pdf/RED-CEMK-Cyberware-Beispiel.pdf`: regulärer Rockerboy mit Mantisklinge und Monodraht im linken Cyberarm, 550 eb Restgeld. Seiten 1, 3 und 4 gerendert und visuell geprüft: keine abgeschnittenen Texte, lokale Qualitätsboni, 6-m-Reichweite und kritische Auswahl erkennbar. Gorilla-Arm separat in temporärer PDF geprüft. Alle 258 erwarteten Formularwerte, 258 Widgetwerte und Appearance-Streams unabhängig mit pypdf kontrolliert; Originalvorlage unverändert. Renderings unter `tmp/pdfs/cemk-*`.

---

# Preis normaler Granaten – aktuelle Prüfung

Normale Splitter- und Brandgranaten kosten jetzt jeweils 200 eb. Die militärischen Varianten bleiben bei 500 eb. 13 gezielte Varianten-/Tragegrenzen-/Exporttests bestanden (`test-results/grenade-price-200-tests.txt`); beide 200-eb-Kaufoptionen im Browser sichtbar geprüft. Datenabrufversion aktualisiert. Keine Testkäufe oder Profilwechsel. Screenshot: `test-results/grenade-price-200.jpg`. Frühere Beispiel-PDFs dokumentieren den damaligen Preisstand; neue Exporte verwenden den aktuellen Katalogpreis.

---

# Normale und militärische Granaten – aktuelle Prüfung

248 Tests bestanden (`test-results/grenade-variants-tests.txt`). Fünf neue Tests prüfen die bestehenden militärischen IDs/Namen/500-eb-Preise/6W6, neue normale Varianten für 100 eb mit 4W6 bzw. 3W6 und je 1 SP Rüstungsabtrag, beide Brandvarianten mit genau 2 direkten Schaden pro Runde nach Durchdringung einschließlich Löschaktion/Nichtstapelbarkeit, das gemeinsame Dreierlimit sowie vierseitigen PDF-Export mit unverändertem Charakter. Militärische Splittergranaten behalten 2 SP Rüstungsabtrag; die bisherige militärische Brandgranate hat jetzt ebenfalls nur 2 statt 4 Brandschaden. Wirkungsdaten und PDF-Kurzbeschreibung werden zentral aus dem Katalog abgeleitet.

Browser: elf Handgranatenoptionen, unterteilt in normale/militärische/Spezialgranaten. Beide neuen Karten mit 4W6/3W6, 100 eb, Rüstungsabtrag und 2 Brandschaden sichtbar geprüft; militärische Karten mit 500 eb und 6W6 ebenfalls geprüft. Bestehender Charakter S bleibt bei 30 eb und unverändertem Inventar; keine Testkäufe/Profilwechsel. Screenshot: `test-results/grenade-variants.jpg`.

PDF: `output/pdf/RED-Granatenvarianten-Beispiel.pdf` mit Messer, Pistole, normaler Splitter-/Brandgranate und militärischer Brandgranate, 1.750 eb Restgeld. Vier Seiten; erste und letzte Seite visuell geprüft. Neue Namen und 4W6/3W6/6W6 in Waffenfeldern, beide Brandbeschreibungen mit 2 direkten Trefferpunkten pro Runde, keine alte 4-Schaden-Angabe. Kanonische Formularwerte, geerbte Widget-Werte und Appearance-Streams unabhängig geprüft; Originalvorlage unverändert. Nachweise: `test-results/grenade-variants-sheet-1.png`, `test-results/grenade-variants-cheatsheet-4.png`.

---

# Tragegrenzen, Granatenpreise und Ausweichen – aktuelle Prüfung

243 Tests bestanden (`test-results/loadout-limits-tests.txt`), einschließlich acht neuer Tests. Geprüft: 500 eb für Splitter-/Brandhandgranaten und vergleichbare Werfergranaten; höchstens drei Granaten über gemischte Typen und Werfermunition; tatsächliche Stückzahlen und erlaubte Waffenbeispiele; atomare Ablehnung von Direkt- und Kombikäufen; auf die freie Menge gekürzte Granatenpakete; Zweihand-Einstufung durch Anschlagschaft auch beim Entfernen; integrierte Zusatzläufe/Netzprogramme/Patronen ohne zusätzliche Trageplätze; bestehende Überbestände bleiben unverändert ladbar und blockieren nur die Freigabe bis zur Korrektur. Frühere Tests mit nun unzulässigem Bestand verwenden entsprechende zulässige Zusammenstellungen; die synthetische Arsenal-Layoutprüfung bleibt erhalten.

Browser auf Port 8080: Charakter S unverändert bei 30 eb; Belegung 0/3 Granaten, 1/2 Einhandwaffen, 1/1 Zweihandwaffen. Neue Zähler und beide Kaufpreise von 500 eb sichtbar geprüft; keine Testkäufe oder Profilwechsel. Nachweis: `test-results/loadout-limits.jpg`.

Beispiel-PDF `output/pdf/RED-Tragegrenzen-Beispiel.pdf`: Pistole, Kampfmesser, Sturmgewehr und drei Granaten (Splitter/Brand/Rauch), 900 eb Restgeld. Vier Seiten, Cheatsheet eine A4-Seite. Ausweichen ist sowohl in der Nahkampf-Tabellenzeile als auch mit vollständigem Attribut-/Fertigkeits-/Modifikator-Wortlaut erklärt; die Originalwerte der Fertigkeiten bleiben unverändert. Letzte Seite visuell geprüft (`test-results/loadout-cheatsheet-4.png`); kanonische Felder, geerbte Widget-Werte und Appearance-Streams unabhängig geprüft. Originalvorlage unverändert.

---

# Community-Waffenaufsätze – aktuelle Prüfung

235 Tests bestanden (`test-results/community-attachments-tests.txt`). Zwölf neue Tests prüfen 31 zusätzliche Varianten (37 Aufsätze insgesamt), passende Waffentypen, Preise/Erstattung, JSON-Rundlauf, atomare Konfliktprüfung, drei Montageplätze, Magazin-/Schnellladerkonflikte, begrenzte feste Präzisionsboni, getrennte Laser-/Kompensator-Schussmodi und Munitionsverbrauch, Pistolen-Umbau mit ursprünglichen Einzelschuss- und eigenen MP-Dauerfeuerwerten, Unterlaufwaffen/Munition ohne geerbte Aufsatzboni, halbe Tarnmagazine, zwei getrennte Magazine, konkrete bedingte Würfel, Bildübertragungs-Voraussetzungen sowie Schrotflächen ohne zusätzliche Schadenswürfel.

310 Layoutfälle prüfen jeden einzelnen Community-Aufsatz bei jeder der zehn Rollen. Weitere zehn Fälle kombinieren zwei gekaufte Waffen, Zusatzlauf und sieben Aufsätze für jede Rolle: ein A4-Cheatsheet, mindestens 8,6 pt Fließtext, keine Fußzeilenüberschneidungen, keine Mutation des Charakters. Unverändert bleibt die vorhandene Standardmunition, Waffenqualität, Attribut-/Fertigkeitenbasis und Rollenverteilung. Kleine Pistolen unter zehn Patronen erhalten durch den Umbau keine unmöglich nutzbaren automatischen Angriffe.

Browser: vorhandener Charakter S auf Port 8080 unverändert bei 30 eb; kein Profilwechsel und keine Testkäufe. Beim vorhandenen Sturmgewehr sind neben sechs Standardoptionen 25 passende neue Varianten in sechs weiteren Gruppen sichtbar. Verifiziert: Laufumbauten/Kompensator/Unterlaufwaffen, Laser/Reflex/variables Visier/Bildübertragung, Nutzenangaben, Preise, Montageplätze und Sperre bei fehlendem Geld. Screenshot-Nachweise: `test-results/community-attachment-groups.jpg`, `test-results/community-optics.jpg`. Modul-/Katalogversion aktualisiert; fertige Ansicht geöffnet.

PDF: `output/pdf/RED-Community-Waffenaufsatz-Beispiel.pdf` mit zwei Hauptwaffen, Unterlaufpistole und sieben Aufsätzen. Waffenwerte auf Seite 1, einzeln zugeordnete Aufsätze auf Seite 2 und konkrete normale/gezielte/Kompensator-Würfel sowie bedingte Reflex-/Stil-/Halteboni auf dem Cheatsheet. Seiten 1, 2 und 4 visuell geprüft; zusätzliche dichte Netrunner-Kurzansicht auf einer A4-Seite visuell geprüft. Unveränderte Originalvorlage, vollständige kanonische Feldwerte, Widget-Parentwerte und nichtleere Appearance-Streams unabhängig geprüft. Nachweise: `test-results/community-sheet-1.png`, `test-results/community-sheet-2.png`, `test-results/community-cheatsheet-4.png`, `test-results/community-dense-4.png`.

Nutzenprüfung und konkrete Anpassungen des verlinkten Beitrags: `docs/WAFFENAUFSAETZE.md`. Die Varianten sind angepasste Community-Spielregeln, nicht als offizielle Erweiterungen dargestellt. Allgemeine Qualitätswechsel aus dem Schlussabsatz werden nicht übernommen, da der bestehende Waffenbestand Standardqualität verwendet.

---

# Waffenmenü, Granaten, Munition und Aufsätze – aktuelle Prüfung

223 Tests bestanden (`test-results/arsenal-tests.txt`), darunter neun neue Tests zu Migration/Persistenz, ungültigen Aufsatzzuordnungen, Budget und atomaren Fehlern, Montageplätzen/Positionen, Mehrfachexemplaren/Erstattung, erweiterten Magazinpaketen, waffenspezifischen Smartgun-Voraussetzungen, kalibergerechter Munition und unabhängig kaufbaren Handgranaten. Exportprüfung für alle zehn Rollen und ein dichter Netrunner mit allen neun Granaten: jeweils eine A4-Cheatsheet-Seite, mindestens 8,6 pt Fließtext, keine Fußzeilenüberschneidungen. Nach der Anpassung der Seite-1-Druckvorschau zusätzlich 26 PDF-/Ausrüstungstests bestanden (`test-results/arsenal-final-pdf-tests.txt`).

Browser auf Port 8080: vorhandener Charakter S unverändert bei 30 eb, keine Testkäufe und kein Profilwechsel. Vier ausklappbare Kaufgruppen, neun Handgranaten ohne Werferpflicht, vier passende Gewehrmunitionsarten und Aufsatzmenü des vorhandenen Sturmgewehrs geprüft. Fehlendes Geld sperrt Aufsatzkäufe, Preise bleiben sichtbar. Screenshot: `test-results/arsenal-grenades.jpg`. Katalog-/Modulversionen aktualisiert, damit bestehende Tabs die neue Fassung laden.

Beispiel-PDF: `output/pdf/RED-Waffen-Erweiterungen-Beispiel.pdf`. Sturmgewehr mit aktiver Smartgun-Anbindung und Zielfernrohr, Splitter-/Rauchgranate sowie panzerbrechende Munition. Seiten 1 und 4 visuell geprüft; zusätzlich dichter Netrunner mit neun Granaten auf einer A4-Seite. Vollständige Modellnamen/Notizen bleiben kanonische Formularwerte, kompakte Druckvorschauen zeigen die relevanten Angaben. Unveränderte Originalvorlage, Feld-/Widget-Werte und Appearance-Streams unabhängig geprüft. Nachweise: `test-results/arsenal-sheet-1.png`, `test-results/arsenal-cheatsheet-4.png`, `test-results/arsenal-dense-4.png`.

Quellen: RTG Night Market Index v1.23 für Preise; Toggle’s Temple v1.1 für Standardmodelle/Schalldämpfer; Grundregelwerk S. 173, 177, 343–347 für Aufsätze, Wurfgranaten und Munition. Die verlinkte Reddit-Liste diente als Ideensammlung; keine pauschalen Laser-/Reflexvisier-Boni übernommen.

---

# Porträts, Cyberware und Waffenmodi – aktuelle Prüfung

214 Tests bestanden (`test-results/portrait-cyber-modes-all-tests.txt`). Sechs neue Tests prüfen 100 Porträts (je Rolle M/W 1–5), Auswahlkennung und PDF-Bildeinbettung, passende Cyberware-Kurztexte mit unveränderten vollständigen Formularwerten, die geordneten Sturmgewehr-Modi einschließlich Basis/Schussverbrauch/Entfernungswerten sowie mehrere Glückspunkte und die einseitige A4-Ausgabe.

Browser: zehn Solo-Porträts sichtbar; Cyberware-Beschreibungen ohne Zeilenbegrenzung oder abgeschnittenen Inhalt. Bestehender Charakter und gespeicherte Profile wurden nicht verändert. PDF des aktuellen Charakters S über den regulären Export erstellt: vier Seiten, Normalangriff → gezielter Schuss → Dauerfeuer → Unterdrücken; Glück weist auf mehrere gleichzeitig einsetzbare Punkte hin. Seiten 1, 3 und 4 sowie eine zusätzliche Porträt-/Cyberware-Probe visuell geprüft. Kompakte Cyberware-Vorschauen passen in die vorhandenen Felder; vollständige Werte bleiben bearbeitbar. Dichte Waffenlisten verwenden bei Bedarf eine kompakte Darstellung auf weiterhin einer A4-Seite. Unveränderte Vorlage, Widget-Werte und Appearance-Streams unabhängig geprüft.

Nachweise: `test-results/current-S-page-4.png`, `test-results/weapon-cyber-page-1.png`, `test-results/weapon-cyber-page-3.png`, `test-results/cyberware-full-text.jpg`. Ausgabe: `output/pdf/RED-S-Charactersheet.pdf`.

---

# Profilwechsel ohne Vervielfältigung – aktuelle Prüfung

208 Tests bestanden (`test-results/profile-switching-all-tests.txt`). Sechs neue Tests prüfen 20 wiederholte Wechsel ohne zusätzliche Einträge, leere neue Entwürfe, Änderungen und Umbenennen nach Neuladen mit demselben Archivschlüssel, Öffnen des aktiven Profils ohne Verlust seiner jüngeren Änderungen, Legacy-Speicher ohne Bindung nur bei vollständiger Übereinstimmung sowie Rollback bei Speicherfehlern und fehlendem Ziel. Unterschiedliche gleichnamige Charaktere bleiben getrennt.

Browserprüfung auf getrenntem Testspeicher `localhost:8097`: zwei Profile angelegt, fünf Wechsel mit Profilzahlen [2,2,2,2,2], ein Profil umbenannt, zurückgewechselt, neu geladen und erneut gewechselt. Ergebnis weiterhin zwei Profile mit erhaltenem geändertem Namen. Screenshot: `test-results/profile-switching-stable.jpg`. Bestehende Benutzerprofile auf Port 8080 wurden für die Prüfung nicht verändert. Vorhandene frühere Archivkopien werden nicht automatisch gelöscht.

---

# Archivlöschung und einklappbare Überprüfung – aktuelle Prüfung

202 Tests bestanden (`test-results/archive-review-all-tests.txt`). Fünf neue Tests prüfen das gezielte Entfernen eines Archivstands unter Erhaltung von aktivem Speicher/anderen Archiven/Sicherungen, Ablehnung fremder oder fehlender Schlüssel, Speicherfehler, escaped Archivnamen und getrennte Öffnen-/Löschbuttons, geschlossene Details mit vollständigem Inhalt, den gekürzten Warntext und den gesonderten Löschdialog mit sicherem Abbruchfokus.

Browser: vier Bereiche starten geschlossen; jeder Bereich wurde geöffnet und geschlossen, Inhalt jeweils sichtbar. Bestehender Rockerboy E bleibt exportbereit. Archivmenü zeigt rote × rechts. Neuer HTML-Dialog zeigt Warnung und beide Aktionen; „Abbrechen“ erhält Fokus. Abbruch per Button und Escape geprüft, bei der Prüfung des neuen Dialogs bleiben zwei Archivstände bestehen. Die tatsächlich bestätigte Löschfunktion wurde ausschließlich mit getrenntem Speicher im Test geprüft. Vorschauen: `test-results/archive-delete-menu.jpg`, `archive-delete-warning.jpg`, `review-collapsed.jpg`. Lokale Vorschau wieder auf Port 8080 gestartet.

---

# Charakterspezifisches A4-Cheatsheet – aktuelle Prüfung

197 Tests bestanden (`node --test --test-concurrency=1 tests/*.test.mjs`). Sechs neue Tests prüfen konkrete Netzwerte einschließlich aktivem Wurm/Späher und unverstärktem Rückfallwert, dynamischen Schnittstellenrang, Formeln und Besonderheiten aller zehn Rollen ohne Tutorialtext, Rüstungsabzug/Präzision ohne Doppelzählung, passive gegenüber bedingten Implantatboni, eigene Angriffsprogramme und selbstständiges ICE sowie A4-Kartenpositionen mit Mindestschrift und ohne Spalten-/Fußzeilenüberschneidung. Ein Netrunner mit installierter Verbindung, zwei Waffen und vier Programmen ist eingeschlossen. Bestehende Tests prüfen weiterhin vollständiges Arsenal und alle 15 Programme; erwartete Größe jetzt DIN A4 statt A3. Testprotokoll: `test-results/quick-reference-all-tests.txt`.

Visuell mit Poppler geprüft: Netrunner einschließlich Neuralimplantat/Buchsen, Solo mit MP/Schrotflinte/Sandevistan, Tech, Medtech, alle 15 Netzprogramme und gesamtes Arsenal. Normale Beispiele A4 quer, dichte Bestände A4 hoch. Konkrete Würfelwerte fett; ganze Regelblöcke, keine Spaltenfortsetzungen; lesbare Tabellen einschließlich gezielter Basen. Vorschauen: `test-results/reference-netrunner.png`, `reference-solo.png`, `reference-tech.png`, `reference-medtech.png`, `reference-netrunner-dense.png`, `reference-arsenal.png`.

Unabhängige Prüfung mit pypdf: Originalvorlage unverändert (SHA-256 bestätigt), fünf Beispiele jeweils vier Seiten, letzte Seite exakt A4 und ohne Formularüberlagerungen. Alle kanonischen Formularwerte der ersten drei Seiten stimmen mit geerbten Widget-Werten überein; alle Widgets besitzen nicht leere Appearances (256 bis 283 je Beispiel). Das ausgelieferte Beispiel hat 268 korrekte Widgets. Ausgabe: `output/pdf/RED-Cheatsheet-Beispiel.pdf`; das Cheatsheet ist Seite 4. Der aktuelle Browser-Charakter Tech hat noch unverteilte Rollenpunkte; die bestehende Exportfreigabe bleibt korrekt gesperrt. Keine Charakterwahl oder Rollenpunkte im Browser geändert.

Während der Prüfung wurden weitere Porträtdateien hinzugefügt. Der vorhandene Katalog-/Vorschauschritt wurde mit den vorhandenen Originalen erneut ausgeführt, damit auch der bestehende Galerie-Vollständigkeitstest besteht.

---

# Gemeinsamer Porträtbereich – aktuelle Prüfung

Vier gezielte Galerietests bestanden. Browserprüfung: kein leerer Porträtrahmen neben dem Namen; Upload und Galerie zusammen; gewähltes Bild erscheint direkt im selben Bereich; Entfernen funktioniert. Testauswahl anschließend entfernt. Screenshot: `test-results/portrait-unified.jpg`.

---

# Porträtgalerie – aktuelle Prüfung

191 Tests bestanden. Vier neue Tests prüfen vollständige Abdeckung aller passenden Originaldateien samt Vorschauen und eindeutigen IDs; getrennte männliche/weibliche Auswahl bei allen zehn Rollen; sichtbare Auswahlmarkierung; kompatibles Speichern bestehender Uploads und neuer Galerieauswahl sowie Abweisung unbekannter Bildquellen vor einem Netzwerkzugriff. Testlauf: `test-results/portrait-gallery-tests.txt`.

Browser: sechs Netrunner-Porträts, Auswahl und Hauptvorschau, Speicherung nach Neuladen, sechs passende Solo-Porträts beim Rollenwechsel und Entfernen geprüft. Browsercache beim Laden aktualisierter Speichermodule berücksichtigt. Testauswahl danach entfernt; Netrunner ohne Porträt wie zuvor. Galerie geöffnet: `test-results/portrait-gallery.jpg`. Katalog umfasst aktuell 60 Originale und 60 kleine Vorschauen.

---

# Deutsches Cheatsheet und Netrunner-Anleitung – aktuelle Prüfung

187 Tests bestanden. Sieben neue Tests prüfen deutsche Anzeigenamen bei stabilen IDs/Preisen/Originalnamen, fünf Integritätswaffen mit unterschiedlichen Zielschäden, eigenständige ICE-Angriffe ohne Schnittstellenbonus, deutsche Cheatsheets für alle zehn Rollen, die Anfängeranleitung, echte PDF-Waffenfelder samt editierbaren Werten und Appearances sowie alle 15 Programme auf genau vier PDF-Seiten. Testlauf: `test-results/german-cheatsheet-tests.txt`.

Vorhandenen Charakter N im Browser ohne Käufe oder Änderungen exportiert. Unabhängige PDF-Prüfung: vier Seiten, 261 Widgets mit passenden kanonischen Werten und nicht leeren Appearances; Seite 1 enthält „(Net) 1x Schwert“, 2/3W6 und Basis 5. Originalvorlage unverändert. Mit Poppler gerenderte Seite 1 und Cheatsheet visuell geprüft. Ausgabe: `output/pdf/RED-N-Charactersheet.pdf`; Vorschauen: `test-results/german-net-weapons-page1.png` und `test-results/german-cheatsheet.png`.

---

# Nicht blockierende Ausstattungswarnungen – aktuelle Prüfung

180 Tests bestanden. Neun neue Tests prüfen fehlende Waffen/Rüstung bei allen zehn Rollen ohne Änderungen an Charakterdaten, Regelabschluss oder PDF-Freigabe; getrennte Netrunner-Voraussetzungen einschließlich nur vorgemerkter Cyberware, Angriffsprogramme mit ATK 0 und Black ICE statt Booster/Defender; getrennte Kopf-/Körperrüstung, nicht angelegte Käufe und implantierten Schutz; passende Munition; Tech-/Nomadenwerkzeug mit Tool Hand; Medtech-Tasche, eigene Airhypo und keine erfundene Kryopump-Kaufpflicht; Musiker-/Kommunikations-/Dokumentationshilfen sowie verschwundenen Warnblock bei vollständiger Solo-Ausstattung.

Browser am vorhandenen Charakter N: nach Laden der neuen Oberfläche erscheinen nur fehlende normale Waffe und Rüstung. Vorhandene Neural Link/Interface Plugs, Cyberdeck, Virtuality-Brille und Sword lösen keine falschen NET-Warnungen aus. Charactersheet-Button bleibt aktiv. „Waffen prüfen“ öffnet direkt Waffen, Rückkehr zur Überprüfung zeigt weiterhin aktiven PDF-Button und genau zwei Warnungen. Keine Käufe, Installationen oder Änderungen an gespeicherten Charakterdaten. Screenshot: `test-results/equipment-warnings.jpg`; vollständiger Testlauf: `test-results/equipment-warning-tests.txt`.

---

# Anfängerführung, schnelle Cyberware und Netrunner-Katalog – aktuelle Prüfung

171 Tests bestanden. Elf neue Tests in beginner-flow.test.mjs prüfen stabile gespeicherte Lebensweg-Auswahlen und vier Alternativen, nur eine Frage und Bearbeitung/Abschluss, Cyberauge links/rechts, atomaren Chyron/Basis-Kauf, Wiederverwendung geplanter und installierter Basen, volles Auge, kaskadierendes Entfernen, zu wenig Geld ohne zurückbleibende Basis, andere Basisarten, 37 NET-Katalogeinträge samt Preisen/Werten, Käufe/Speicherung/Erstattung und deutsche Anzeige ohne Änderung interner IDs. Zusätzlicher PDF-Test prüft gekaufte NET-Gegenstände und ATK/DEF/REZ/Platzbedarf im weiterhin vierseitigen Export. Bestehende Lebensweg-Assertions wurden auf vier Optionen angepasst.

Browser isoliert auf Port 18475 mit QA-Netrunner: Frage 1 auf vierte Antwort geklickt, automatisch nur Frage 2 sichtbar; Freitext bleibt bis Übernehmen, danach Abschluss und vollständige Zusammenfassung. Cyberauge per Hinzufügen erst links, dann rechts; Entwurf geleert. Chyron vormerken legt Cyberauge und Option gemeinsam an: 200 eb, 9 HUM; gemeinsamer Einbau kostet genau 200 eb. NET-Deck (100), Sword (50), Worm (50) gekauft: 2.150 eb übrig. Attribute zeigen INT/REF/GES/TCH/COO/WIL/GLK/BEW/KRA/EMP, Geschicklichkeitsdetail verwendet GES.

Echter PDF-Button liefert vier Seiten. Unabhängig mit pypdf: 248 kanonische Formularwerte mit konsistenten Widget-Eltern und nicht leeren Appearances; NET-Werte und deutsche Cheatsheet-Kürzel vorhanden. Netrunner-Cheatsheet und großes Arsenal gerendert und visuell geprüft. Bilder: lifepath-sequential.jpg, cyberware-auto-base.jpg, netrunner-catalog.jpg, netrunner-cheatsheet.png, netrunner-updated.jpg unter test-results/.

Hauptfenster: aktiver Charakter N hatte einen offenen, nicht gespeicherten Entwurf mit Neural Link und Interface Plugs (1.000 eb). Beim Laden der neuen Oberfläche wurde exakt dieser Entwurf wiederhergestellt, ohne Installation, Einkauf oder Änderung gespeicherter Charakterdaten. Guthaben bleibt 2.550 eb, nach geplantem Einbau 1.550 eb; installiert weiterhin 0. Netrunner-Kategorie ist offen. QA-Tab geschlossen; separater Testserver wird beendet.

---

# Einseitiges Cheatsheet – aktuelle Prüfung

159 Tests bestanden. Sechs neue Tests prüfen Entfernungsgrenzen und getrennte Einzelschuss-/Autofeuer-DVs, eigene Waffen/Moduszeilen, effektive Werte mit Rüstung und Solo-Präzision, leeren Bestand, zentrale Spielhinweise, sämtliche zehn Rollen mit exakt vier PDF-Seiten sowie alle 19 Katalogwaffen mit 23 Moduszeilen auf genau einem Cheatsheet. Frühere Anhang-Tests prüfen jetzt vollständige editierbare Feldwerte statt doppelter Ergänzungsseiten, einschließlich langer Lebenswege, weiterer Sprachen und über 18 eigener Gegenstände.

Browser: vorhandener Charakter E ohne Änderung exportiert. Echter Button bestätigt Download. Unabhängige Prüfung mit pypdf: vier Seiten, 266 Widgets mit passenden kanonischen Elternwerten und nicht leeren Appearances; Seite 4 enthält nur die gekaufte mittlere Pistole mit Entfernungs-DVs sowie Rollen- und Kampfhinweisen. Cheatsheet für E, größere Waffenauswahl und das gesamte Katalogarsenal mit Poppler gerendert und ohne Überlappung/Abschneiden geprüft. Lange Feldwerte bleiben vollständig im AcroForm erhalten; die gedruckte Vorschau ist bewusst begrenzt. Ausgabe: `output/pdf/RED-E-Charactersheet.pdf`; Vorschau `test-results/cheatsheet-E.png`; Browsernachweis `test-results/cheatsheet-export.jpg`; Tests `test-results/cheatsheet-tests.txt`. Lokaler Server auf 8080 wieder erreichbar.

---

# Waffenoptionen – aktuelle Prüfung

153 Tests bestanden, davon neun neue Tests zu expliziten Waffenprofilen, verfügbaren Modi, Munition und Autofeuer-Multiplikatoren, gezielten Angriffen, Schrotfläche/DV, aktuellen Fertigkeitsbasen einschließlich Rüstungsabzug und Solo-Bonus, Unterdrückungsfeuer, unverändertem Bestand und ausschließlich gekauften Waffen in Übersicht/PDF. PDF wird nach Erzeugung erneut geöffnet und der Anhang geprüft.

Browser: bestehender Charakter E unverändert, mittlere Pistole mit Angriffsbasis 12 und gezieltem Schuss 4 unter Überprüfung und Waffen sichtbar. MP-/Sturmgewehr-Badges und aufgeklappte Schrotflinten-Erklärung geprüft. Screenshot: `test-results/weapon-options.jpg`. Test-PDF mit MP, Schrotflinte und Sturmgewehr: neue Ergänzungsseiten 7–8 gerendert und visuell ohne Überlappung oder abgeschnittenen Text geprüft. Testausgabe: `test-results/weapon-options-tests.txt`.

---
# Bedienung und Charakter-Neustart – aktuelle Prüfung

144 Tests bestanden. Acht neue Tests prüfen Reset auf genau 86 freie Kaufpunkte bei weiterhin kostenloser Herkunftssprache Rang 4, Erhalt der Namen und übrigen Charakterfelder, Speichern und Rollenwechsel ohne erneute automatische Verteilung, Nullränge als bearbeitbare Entwürfe bei weiterhin gesperrtem Abschluss/PDF ohne Mindestfertigkeiten, den konkreten EMP-Fall (40 minus 44 = -4 Menschlichkeit, EMP 0), separates Sichern/Öffnen mehrerer Charaktere einschließlich Käufen und Ausbauhistorie, abgebrochene Wechsel bei Speicherfehlern, kaputte Archive sowie Leeren aller UI-Entwürfe. Drei bisherige Assertions wurden an die ausdrücklich geänderte Kurzbeschreibung und zulässige Nullrang-Entwürfe angepasst.

Browser: bestehender Tech D bleibt unverändert. Acht Implantate verbrauchen 44 HUM bei Basis-EMP 4 (40 Start), daher -4 HUM und EMP 0. Die kurze Attribut-Erklärung, hervorgehobene Fertigkeiten und angeheftetes Geld in Cyberware und Waffen geprüft (nach Scrollen top=10 px). Separater Test auf Port 18474: QA-Alt mit Deutsch/Little Europe zurückgesetzt, 86 Punkte frei und nur kostenlose Sprache Rang 4; einen Athletikpunkt verteilt, nach Neuladen noch 85 frei. Biomonitor installiert; dann neuer Charakter mit 0 Implantaten und voller Geld-/Fashion-Zuteilung. QA-Alt aus separatem Archiv wieder geöffnet, ein Implantat, 700 Fashion-eb und eigene Skillverteilung wiederhergestellt. Archive bleiben nach Neuladen verfügbar. Screenshot: `test-results/editor-improvements.jpg`, `test-results/sticky-budget.jpg`.

---

# PDF-Charactersheet – aktuelle Prüfung

136 Tests bestanden, davon zehn neue PDF-Tests. Exportfreigabe verlangt zentrale Regelgültigkeit und alle Lebensweg-Antworten; optionale Käufe und Porträts werden nicht erzwungen. Zusätzlich werden offene Cyberware-/Ausbau-/eigene Ausrüstungsentwürfe, alle zehn Rollen, berechnete Skillwerte, Rüstungsabzüge/Schutzwerte, HUM/EMP, Geld, Dateiname, zusätzliche Spezialisierungen und Inventarüberlauf geprüft. Erzeugte Dateien werden erneut mit pdf-lib geöffnet; Feldwerte, Editierbarkeit, Widget-Parents und Appearance-Streams geprüft. Lange Originaltexte bleiben vollständig im Anhang erhalten. PNG-Porträt wird zusätzlich zur ursprünglichen Vorlagengrafik eingebettet.

Browser: frische Testadresse 127.0.0.1:18473. Bei fehlender Sprache/Heimat und Lebensweg blieb der Exportknopf deaktiviert; nach Auswahl aller Angaben wurde er aktiv. Der echte Button erzeugte einen Download. Dieser wurde unabhängig mit pypdf geöffnet: sieben Seiten, 241 Widgets mit konsistenten Elternwerten und nicht leeren Appearances (Test vor dem zusätzlichen LUCK-/EMP-Basisfeld). Anschließend wurde auch der vorhandene Charakter Maxim ohne Änderungen an den Eingaben exportiert, erneut geprüft und alle sieben Seiten visuell kontrolliert. Bei Glück und EMP stehen aktuelle und Basiswerte in getrennten Teilfeldern. Ausgabe: `output/pdf/RED-Maxim-Charactersheet.pdf`, Screenshot `test-results/pdf-export.jpg`. Der bestehende Spielstand wurde nicht durch Testdaten ersetzt. Die ursprüngliche Datei in data bleibt unverändert.

---

# Gemeinsamer Cyberware-Entwurf und Ausbau – aktuelle Prüfung

126 Tests bestanden. Acht neue Tests prüfen mutationsfreies Sammeln mehrerer Implantate inklusive Basis/Option, kaskadierendes Herausnehmen einer geplanten Basis, Erhalt installierter Basen, ungültige Bereiche und fehlende Voraussetzungen, Überziehung nach einem separaten Kauf, doppelte IDs, atomaren gemeinsamen Einbau, zusätzliche Ausbaukosten ohne Kaufpreis- oder HUM-Erstattung, Fashion-Zuschuss nach Ausbau und Wiederkauf sowie Format-9-Migration mit Originalbackup und sichere Ausbauhistorie.

Browserprüfung am vorhandenen Charakter: Neural Link direkt in den Körperbereich gezogen, Interface Plugs ohne Einzelbestätigung hinzugefügt, gemeinsame Geld-/HUM-/EMP-Vorschau geprüft. Interface Plugs aus der Entwurfsliste in die Entfernen-Zone gezogen: nur dieser geplante Eintrag verschwindet, tatsächlich installierte drei Implantate, 1.600 eb und HUM 29 bleiben erhalten. Kein Testimplantat installiert oder vorhandenes Implantat ausgebaut. Die Testauswahl wird vor Abschluss wieder geleert. Screenshot: `test-results/batch-cyberware.jpg`.

---

# Erweiterte Cyberware und eigene Ausstattung – aktuelle Prüfung

118 Tests bestanden. Zwölf neue Tests prüfen Cyberarm-/DLC-Abhängigkeiten und vier belegte Optionsplätze, Neural-Link-Voraussetzung/Speedware-Ausschluss und Initiative ohne REF-Änderung, natürliche versus künstliche Werkzeughand, Cyberaudio-Plätze/situative Hörboni und nicht gestapelte identische Effekte, getrennte Cyberaugen und MicroVideo-Platzverbrauch, Fashion-Synergie und Zuschuss, implantierte Panzerung ohne SP-Addition, BODY-Verstärkung mit Obergrenze 10, eigene Gegenstände mit Bearbeitung und Erstattung, Budgetgrenzen auch für Katalog-/Paket-/Implantatkäufe, Validierung und HTML-sichere Ausgabe sowie Format-8-Migration mit Originalbackup und Erhalt bisheriger Daten.

Browserprüfung: zwei kostenlose Testkoffer angelegt, nach Neuladen erhalten, Notiz bearbeitet, beide Stücke wieder entfernt und nach erneutem Neuladen leeres eigenes Inventar bestätigt. Kein Geld verbraucht und keine Implantate eingebaut. Neural-Link-Vorschau zeigt Kosten/HUM/EMP und fünf Optionsplätze; anschließend abgebrochen. Neue Systembereiche sichtbar; Standardsortierung stellt Neural Link vor seine abhängigen Erweiterungen. 1086 px ohne horizontale Überbreite. Screenshots: `test-results/custom-equipment.jpg` und `test-results/expanded-cyberware.jpg`.

---

# Lebensweg – aktuelle Prüfung

106 Tests bestanden. Sechs neue Prüfungen betreffen zwei unterschiedliche Vorschläge je Frage ohne Auswirkungen auf Werte oder Geld, Entwurfserhalt bei Auswahlwechsel und Zurücknehmen, optionale Fragen und leere eigene Ideen, Ablehnung unbekannter Felder/Optionen und überlanger Texte, sichere Darstellung sowie Format-7-Migration mit Originalbackup und Erhalt von Rollenpunkten/Ausstattung einschließlich Speicherrundlauf.

Browserprüfung: 14 Fragen mit 42 Auswahlmöglichkeiten. Mehrzeiliger Testtext bleibt beim Wechsel zwischen Vorschlag und eigener Idee erhalten, wird nach Neuladen korrekt geladen und erscheint in der Charakterübersicht. Testtext anschließend geleert und Auswahl zurückgenommen; Ausgangsstand wiederhergestellt. Neuer Schritt geöffnet. Bei 1086 px keine horizontale Überbreite. Screenshot: `test-results/lifepath.jpg`.

---

# Rollenpunkte – aktuelle Prüfung

100 Tests bestanden. Neun neue Prüfungen decken Solo-Effektkosten, atomare Ablehnung, acht Maker-Fachränge mit Obergrenze vier, gewöhnliche Feldexpertise versus Maker-Probe ohne Doppelbonus, Solo-Initiative/Wahrnehmung/Präzision, Chirurgie/Medizintechnik und Pharmazeutika, Trimmen nach Punktsenkung, Rollenwechsel ohne Mehrfachwirkungen, sichere Datenrekonstruktion und Format-6-Migration mit Originalbackup sowie Abschlussprüfung ab. Bestehende Tests wurden an Datenformat 7 und die nun tatsächlich wirksamen Rollenboni angepasst.

Browserprüfung am vorhandenen Maxim/Solo: Präzision 1 (3 Punkte) und Initiative 1 (1 Punkt), Restbudget 0; weitere Erhöhung gesperrt. Angezeigte Angriffsbasis 14 + Präzision 1 = 15 und Initiative 9. Neuladen erhält die Verteilung. Anschließend beide Testpunkte zurückgenommen und Ausgangsverteilung wiederhergestellt. Kein Rollenwechsel am Benutzercharakter. Bei 1086 px keine horizontale Überbreite. Screenshot: `test-results/role-points.jpg`.

---

# Rollenfähigkeiten – aktuelle Prüfung

91 Tests bestanden. Vier neue Tests prüfen alle zehn Rollen ohne Zustandsänderung, dynamische Maker-Beispiele nach Änderung von TECH und Fertigkeitsrang, Moto-Beispiele mit wirksamer Rüstung und unveränderter gewöhnlicher Fertigkeitsbasis sowie Instrument-Spezialisierungen und sichere Darstellung benutzerdefinierter Namen.

Browserprüfung am bestehenden Charakter Maxim/Tech: neuer vierter Navigationsschritt, Maker-Teilfähigkeiten und aktuelle Probe TECH 8 + Grundlegende Technik 6 = Basis 14; Beispiel mit Fachrang 2 ergibt 16 + 1W10. Keine Inventar- oder Rollenänderung am Benutzercharakter. Bei 1086 px keine horizontale Überbreite. Screenshot: `test-results/role-abilities.jpg`.

---

# Waffenpaare und Munitionspakete – aktuelle Prüfung

87 Tests bestanden (`node --test tests/*.test.mjs`). Neue Prüfungen: vier Waffenpaare und Handführung, gültige Munitionszuordnung aller elf Fernkampfwaffen, Zwei-Magazin-Rundung, Sonderfälle Bogen/Granaten/Raketen, korrekte Gesamtkosten und Speicherrundlauf, atomare Ablehnung bei Budget-/Mengengrenzen sowie Kaufkartenfilter und Entfernen von Waffen bei verbleibender Munition.

Browserprüfung im bestehenden Vorschau-Tab: nach Neuladen vier gleichstufige Nahkampfpaare in zwei Spalten, Fernkampferklärung mit Charakterwerten, nebeneinanderstehende Kaufbuttons mit korrekter Menge und Gesamtpreis. Ohne gekaufte Fernkampfwaffe keine Munitions-Kaufkarten. Keine Änderungen am Inventar des Benutzercharakters. Bei 1086 px entspricht Inhaltsbreite exakt der Viewportbreite. Sichtprüfung und Screenshot: `test-results/weapons-ammo-update.jpg`.

---

# v0.9 – Waffen, Rüstung und Sonstiges (24.10.2026)

82 Tests bestanden mit `node --test tests/*.test.mjs`. Sieben neue Tests prüfen separat bezahlte Kopf-/Körperrüstung, wirkungslosen Inventarbesitz, stärksten einmaligen Rüstungsabzug, Untergrenze 0, Initiative und Fertigkeitsbasen, unveränderte Basisattribute, Besitz-/Bereichsprüfung, Entfernen des letzten Exemplars, Erstattung und Migration von Format 5 nach 6 sowie Speicherrundlauf und Rendering der drei Katalogbereiche.

Lokaler Server auf Port 8080 gestartet. Visuelle Browserprüfung blockiert: Browser-Sicherheitsrichtlinie verweigert Zugriff auf den bestehenden Vorschau-Tab. Kein Browser-Test oder Screenshot für v0.9 erfolgt. Frühere Browserprüfungen unten gelten ausschließlich für frühere Versionen.

---

# Aktuelle Prüfung v0.8 / Cyberware-Menü

Stand: 23. Oktober 2026. Node.js 24.22.1.

## Automatisiert

75 Tests bestanden mit `node --test tests/core.test.mjs tests/phase2.test.mjs tests/recommendations.test.mjs tests/cyberware.test.mjs tests/equipment.test.mjs tests/cyberware-menu.test.mjs`.

Elf neue Tests prüfen: exakte Reihenfolge und Darstellung der acht Kategorien; Regelzugehörigkeit unabhängig vom Installationsbereich und Finanzierungsbudget; Kategorien-/Such-/Sortier-/Verfügbarkeitsfilter; automatische Systembereichsauswahl ohne unnötige Seitenwahl; mutationsfreie Vorschau und Übereinstimmung mit bestätigtem Einbau; fehlende/falsche Bereiche und Basisimplantate; beibehaltene Geld-/Menschlichkeits- und Entfernungsregeln; Laden bestehender Format-5-Daten und Migration früherer Versionen; Installationssperre ungeklärter Kategorien; hierarchische Basis-/Optionsdarstellung samt Ausbauabhängigkeiten; genau eine geöffnete Cyberware-Detailansicht.

Katalogschema 2 benennt Voraussetzungen explizit unter requirements und Bereiche unter installationSlots. Charakterformat 5 und gespeicherte IDs bleiben unverändert. Der vorhandene Katalog wurde umgeordnet, nicht um weitere Implantate erweitert.

## Browserprüfung

Prüfserver unter `http://127.0.0.1:8089/red-builder/`, getrennt vom Nutzerspeicher. Ausschließlich echte UI-Bedienung:

- Kompakter Status enthält Name, Eurobucks, aktuelle/maximale Menschlichkeit, EMP und Installationszahl. Alle acht Kategorien als Navigation sichtbar.
- Cybergliedmaßen zeigen vorhandene Arm-/Beinoptionen; Verfügbarkeitsfilter entfernt gesperrte Basisoptionen. Suche und Preissortierung funktionieren. Leere Neuralsysteme werden verständlich erklärt.
- NeuTongue wird ohne Links-/Rechts-Auswahl dem inneren Körper zugeordnet. Vorschau: 2.550 → 2.450 eb, Menschlichkeit 40 → 33, Maximum 40 → 38, EMP 4 → 3. Vor Bestätigung bleibt der Charakter unverändert; danach stimmen die Werte mit der Vorschau überein.
- Holo Projector Palm: linker Arm per Klick gewählt, rechter Arm per echtem Maus-Drag. Beide Wege zeigen zuerst nur die Vorschau. Das zweite Implantat ändert Menschlichkeit 31 → 29 und EMP 3 → 2 erst nach Bestätigung.
- Fehlender Cyberarm und inkompatible doppelte NeuTongue erzeugen konkrete Konflikte; Bestätigung bleibt gesperrt.
- Bug Eye bleibt regelkonform unter Borgware und hebt beide Augen als Ziele hervor. Es wird immer nur eine Implantat-Detailansicht geöffnet.
- Installierte Komponenten bleiben bei Kategorienwechsel (auch zu leerer Kategorie) sichtbar. Entfernen berechnet Geld und Menschlichkeit neu. Neuladen erhält die übrigen Einbauten.
- Mobil: Kill Display per Tastatur bestätigt, keine Seitenwahl; Fashion-Zuschuss 800 → 700 eb bei unverändertem Hauptbudget. Vorschau und Bestätigung sind ohne Drag erreichbar.
- Breiten 320, 390 und 768 px: kein horizontaler Überlauf. Kleine Installation bei Bedarf als eigener Bereich; Katalog und Körper haben keine verschachtelten Scrolllisten. Desktop in 1440 × 1100 visuell geprüft.
- Vorhandener Ausrüstungsreiter bleibt nutzbar; Agent-Kauf aus gemeinsamem Budget geprüft.
- Keine Browserfehler oder Warnungen. Bestehenden Nutzercharakter auf Port 8080 mit v0.8 geladen und unveränderte Ausgangswerte geprüft; nur Kategorien/Details betrachtet, keine Testimplantate hinzugefügt.

Vorschauen: `test-results/cyberware-menu-v08.jpg` und `test-results/cyberware-preview-v08.jpg`. Zusätzlicher Prüfserver wird beendet; Nutzerserver auf Port 8080 bleibt erreichbar.

## Grenzen

Der vorhandene Umfang bleibt unverändert: neun Cyberware-Einträge, davon zwei mangels Basisimplantat gesperrt, sowie elf Ausrüstungsgegenstände. Leere Kategorien enthalten keine erfundenen Regeln. Touch-Drag ist implementiert, aber nicht auf physischem Touchgerät geprüft; die mobile Klick-/Tastaturbedienung wurde geprüft. Das beigefügte Material enthielt die Aufgabenbeschreibung, keine zusätzliche Bilddatei. Keine Veröffentlichung auf GitHub Pages vorgenommen.

---

## Historische Prüfungen bis v0.7

# Aktuelle Prüfung v0.7 / Phase 4

Stand: 23. Oktober 2026, Node.js 24.22.1.

## Automatisiert

64 Tests bestanden: `node --test tests/core.test.mjs tests/phase2.test.mjs tests/recommendations.test.mjs tests/cyberware.test.mjs tests/equipment.test.mjs`.

Die neun neuen Ausstattungstests prüfen 2.550 eb Complete-Package-Startkapital und den getrennten 800-eb-Fashion-Zuschuss, gemeinsamen Verbrauch durch Cyberware und Inventar, Erstattung beim Entfernen, Fashion-Mehrkosten, Kauf-/Einbausperre vor einer Überziehung, identische Regeln für Körperziele, sichere Inventarrekonstruktion, Migration von Format 4 nach 5 mit Originalbackup und Reparatur älterer überzogener Bestände. Die bisherigen 55 Tests bestehen weiterhin.

## Browserprüfung

Getrennte Testdaten unter `http://127.0.0.1:8088/red-builder/`; Repository-Unterpfad ohne Build-Prozess.

- Körper und Cyberware-Menü visuell geprüft; Auswahl markiert passende Ziele grün.
- Holo Projector Palm per Klick in den linken Arm eingesetzt, anschließend per echtem Maus-Drag vom Griff in den rechten Arm: beide Arme belegt, Kosten je 100 eb, Menschlichkeitsverlust korrekt.
- PerfectFit Cyberfoot per Drag auf ein Auge abgewiesen: verständliche Fehlermeldung, kein Geld-/Werteverlust und keine verbliebene Ziehvorschau. Einbau im passenden Bein danach erfolgreich.
- Körperbereiche zeigen Namen, Belegungszahlen und eingebaute Komponenten; Entfernen direkt am Bereich möglich.
- Kauf eines Agent und einer Taschenlampe aus demselben Budget wie Cyberware. Entfernen der Taschenlampe erstattet 20 eb.
- Kill Display per Tastatur (Enter auf Körperziel) eingesetzt: Fashion-Zuschuss 800 → 700 eb, Hauptguthaben unverändert.
- NeuTongue hat nur inneren Körper als erlaubtes Ziel; Einbau senkt Menschlichkeit/EMP. Erneuter gleichartiger Einbau gesperrt.
- Neuladen bewahrt Cyberware und Inventar; Suche, Körperfilter und Reiter funktionieren. Die Scrollposition des Cyberware-Menüs bleibt bei Auswahl erhalten (1065 px im geprüften Fall).
- Bildschirmbreiten 320, 390 und 768 px: kein horizontaler Überlauf. Smartphone-Klickbedienung und Tastaturbedienung geprüft. Touch-Drag ist implementiert, aber nicht auf einem physischen Touchgerät getestet.
- Überprüfung meldet vollständige bisherige Schritte nach Auswahl von Herkunftssprache und Heimat. Keine Browserwarnungen oder Fehler.
- Vorschau: `test-results/phase4-body.jpg`. Der Nutzerserver auf Port 8080 bleibt verfügbar; v0.7 wurde mit dem bestehenden Nutzercharakter im sichtbaren Browser geöffnet; Migration und Startguthaben wurden geprüft. Die Vorschau zeigt nur eine Auswahl, keinen zusätzlichen Einbau in die Nutzerfigur. Der zusätzliche Prüfserver auf Port 8088 wird beendet.

## Grenzen

Sieben DLC-Implantate und elf allgemeine Ausrüstungsgegenstände verfügbar. Fehlende Standard-Basisimplantate und abhängige Optionen bleiben gekennzeichnet. Waffen, Rüstung, Kleidung, vollständige Grundregelwerk-Cyberware, Rollen-Sonderausstattung, Therapie und Operationsverlauf fehlen noch. Der Editor erstellt einen Charakter; Entfernen während der Erstellung bildet keinen späteren operativen Ausbau ab. Veröffentlichung auf GitHub Pages noch nicht erfolgt.

---

## Historische Prüfungen bis v0.6

# Aktuelle Prüfung v0.6 / Phase 3

Stand: 23. Oktober 2026. Node.js 24.22.1.

## Automatisiert

`node --test tests/core.test.mjs tests/phase2.test.mjs tests/recommendations.test.mjs tests/cyberware.test.mjs`: **55 Tests bestanden**.

Die 17 Cyberware-Tests ergänzen die bisherigen 38 Tests: Trennung von Basiswert und Effekt, feste Menschlichkeitsverluste, Borgware-Maximum, verlustfreie Fashionware, gekoppelte EMP-Fertigkeitsbasen, Kostenlimits, Bereichs- und Kapazitätsprüfung, natürliche Gliedmaßen, Basis-/Optionsabhängigkeiten, Inkompatibilitäten in beiden Richtungen, Mindest-Basisattribute, blockierter Basisausbau, reparierbare ungültige Entwürfe, getrennte situative Effekte, einmaliger Light-Tattoo-Bonus, begrenzte permanente Attributboni und deren abgeleitete Werte, EMP-0-Warnung, sichere Datenrekonstruktion und Migration von Format 3 nach 4 mit Originalbackup. Generische Implantatfälle verwenden ausdrücklich synthetische Testdaten; sie sind kein angebotener Regelinhalt.

## Browserprüfung

Getrennte Testdaten auf `http://127.0.0.1:8087/red-builder/`, ausschließlich über echte Bedienelemente:

- Identität, Rollenverteilung und neuer Cyberware-Schritt geöffnet.
- NeuTongue und Holo Projector Palm: 200 eb; Menschlichkeit 40 → 31, Maximum 40 → 36, EMP 4 → 3.
- Zweite Option im belegten Arm gesperrt; anderer Arm separat auswählbar.
- Eigenes Limit 200 eb explizit übernommen; weitere Käufe gesperrt und Betrag genannt. Leeres Feld plus Übernahme hebt das Limit auf.
- Drei Kill Displays: einmaliger Fertigkeitsbonus +2, kein Attributbonus.
- Suche nach NeuTongue und Kategorie Borgware liefern die passenden Karten.
- Entfernen berechnet Kosten/Verluste neu; Neuladen erhält die Planung.
- Herkunftssprache und Heimat ausgewählt; Überprüfung meldet „Phase 3 vollständig“.
- Ansichten 320, 390 und 768 Pixel breit: kein horizontaler Überlauf; Smartphone- und Desktop-Layout visuell geprüft.
- Keine Browserfehler oder Warnungen. Relativer Repository-Unterpfad funktioniert.
- Bestehenden Nutzer-Tab auf Port 8080 auf v0.6 aktualisiert: Charakter übernommen, Migrationshinweis sichtbar, leere neue Cyberware-Planung. Keine Testimplantate in Nutzerfigur eingetragen.

Screenshot: `test-results/phase3-cyberware.jpg`. Der zusätzliche Prüfserver wird anschließend beendet; der bestehende Nutzerserver auf Port 8080 bleibt erreichbar.

## Grenzen

Sieben DLC-Komponenten sind einplanbar, zwei weitere benötigen noch fehlende Basisimplantate und bleiben gesperrt. Vollständiger Grundregelwerk-Katalog, medizinische Prothesen, gebrauchte/verbesserte Ware, Operationsverlauf, Würfelverluste, Therapie und Trauma sind nicht implementiert. Dies ist eine Erstellungsplanung; das Entfernen eines Entwurfsgegenstands ist kein regeltechnischer Ausbau im laufenden Spiel. Körperansicht/Drag-and-drop folgen in Phase 4. GitHub Pages wurde lokal über einen Repository-Unterpfad geprüft, noch nicht veröffentlicht.

---

## Historische Prüfungen bis v0.5

# Prüfprotokoll v0.3 / Phase 2

Stand: 23. Oktober 2026.

## Automatisiert

`node --test tests/core.test.mjs tests/phase2.test.mjs`: **28 Tests bestanden** unter Node.js 24.22.1.

Abgedeckt:

- Bestehende Attributfunktionen, Rollenempfehlungen, Punkteverteilung, Porträtdaten und Speicherschutz.
- Katalog mit 66 Fertigkeiten plus zwei expliziten Pflicht-Spezialisierungen, 13 Pflichtfertigkeiten und sieben ×2-Fertigkeiten.
- 26 Pflichtpunkte, 60 freie Kaufpunkte, vier kostenlose Ränge für die Herkunftssprache und bezahlte weitere Sprachränge.
- Unter-/Obergrenzen, optionale Ränge 0, ×2-Kosten, Erstattung und Budgetüberschreitung vor Mutation.
- Exakte Verteilung von 86 Punkten als Voraussetzung des vollständigen Abschlusses.
- Unabhängige Spezialisierungen, doppelte Sprachen/Orte, ungültige Kampfkunstdisziplinen und unbenannte Einträge.
- Live-Fertigkeitsbasen nach Attributänderungen, einschließlich untrainierter Fertigkeiten.
- Trefferpunkte, Rundungsreihenfolge, Verwundungsschwelle, Todesrettungsbasis, anfängliche Menschlichkeit, Initiative- und Glücksbasis.
- Vergleich aller 49 BODY/WILL-Kombinationen 2–8 mit den TP-Tabellenschritten.
- Migration von Datenformat 1/2 nach 3, Sicherung der Originaldaten und Wiederherstellung der Fertigkeiten.
- Ungültige Ränge, fremde IDs, übergroße Felder, Budgets und unerwartete Zusatzfelder.

## Browserprüfung

Über echte Bedienelemente im integrierten Chromium-Browser geprüft. Die Funktionstests liefen im getrennten Speicher unter `http://127.0.0.1:8084/red-builder/`.

1. Neue Identität erstellen, Solo wählen, zu Attributen wechseln: TP 45, Verwundungsschwelle 23, Todesrettungsbasis 7, Start-Menschlichkeit 40, Initiativebasis 8 und Glückspool 5 angezeigt.
2. Neuer Fertigkeitsschritt: 26 von 86 Punkten verteilt, 60 verbleibend.
3. Herkunftssprache und Heimat eintragen; nach „Dauerfeuer“ suchen. Ein Rang kostet zwei Punkte und zeigt REF 8 + Rang 1 = Basis 9.
4. Zusätzliche Sprache „Deutsch“ neben Herkunftssprache „Deutsch“ erzeugt eine verständliche Doppelungswarnung in der Überprüfung. Korrektur zu „Französisch“ wird akzeptiert.
5. Kampfkunst hinzufügen und über die Auswahl „Judo“ festlegen; ×2-Kosten werden verrechnet.
6. Pflichtfertigkeiten erhöhen, Herkunftssprache steigern und exakt 86 Punkte verteilen. Bei Restbudget 0 sind weitere Käufe gesperrt. Die Überprüfung zeigt „Phase 2 vollständig“.
7. Neu laden: Identität erscheint zuerst; nach Wechsel zur Überprüfung ist der vollständige Fertigkeitsstand wieder vorhanden.
8. Kategorienfilter „Fernkampf“ zeigt nur passende Fertigkeiten; Suche und Filter ändern keine Charakterdaten.
9. Breiten 320, 390 und 768 px: kein horizontaler Überlauf, Rangsteuerungen und Basiswerte bleiben sichtbar.
10. Keine Warnungen oder Fehler in der Browserkonsole während des getesteten Ablaufs.

Die Hauptvorschau auf Port 8080 wurde nach Abschluss aktualisiert. Die Übernahme bestehender Charaktere ergänzt Fertigkeiten und sichert die vorherige Version; Funktionstests verändern keine Werte des Benutzercharakters.

## Grenzen

Keine echte Veröffentlichung auf GitHub Pages; geprüft wurde ein entsprechender Repository-Unterpfad. Keine Safari-/Firefox- oder Screenreader-Prüfung. Kein vollständiger Abgleich sämtlicher aktueller Errata. Die Dokumentation nennt öffentliche Referenzen und die maßgeblichen Buchseiten. Attribut-Empfehlungen bleiben Homebrew.

Rollenfähigkeiten, Kampfkunst-Manöver, Lebensweg, Ausrüstung und Cyberware sind noch nicht als Regelsystem implementiert. Phase 2 erklärt und prüft die Attribute, Fertigkeitskäufe und abgeleiteten Startwerte; sie behauptet keinen vollständig spielbereiten Charakter.

## Ergänzung v0.4: Empfehlungen und Auswahlmenüs

Automatisiert: `node --test tests/core.test.mjs tests/phase2.test.mjs tests/recommendations.test.mjs` — **38 Tests bestanden**.

Zusätzlich geprüft: alle zehn Homebrew-Profile sind unterschiedlich, vollständig regelvalidiert und kosten exakt 86 Punkte. Eine neue Rolle erhält automatisch eine Empfehlung; unveränderte Vorschläge folgen dem Rollenwechsel. Eigene Rangänderungen und Spezialisierungen bleiben geschützt. Auch bewusst auf Pflichtwerte zurückgesetzte oder mit veralteten Empfehlungshinweisen versehene Verteilungen werden nicht automatisch überschrieben. Das Datenformat 3 bleibt abwärtskompatibel mit bisherigen Daten ohne Empfehlungshinweis.

Browserprüfung in einem getrennten Speicher unter `http://127.0.0.1:8085/red-builder/`:

- Neue Solo-Figur: alle 86 Fertigkeitspunkte vorausgefüllt; Auswahl von Japanisch und Old Japantown über echte Menüs führt zu einem vollständigen Phase-2-Stand.
- Rollenwechsel Solo → Tech aktualisiert eine unveränderte Empfehlung. Nach einer eigenen Rangänderung bleibt die Verteilung beim Wechsel zu Fixer erhalten.
- Die Schaltfläche zum ausdrücklichen Übernehmen einer neuen Rollenempfehlung funktioniert; Sprache und Heimat bleiben erhalten.
- Eigener Ortsname über „Anderer Name …“ wird nach Neuladen als eigener vorhandener Wert angezeigt.
- Zusätzliche Sprache über Menü auswählbar; bereits gewählte Herkunftssprache ist gesperrt. Weitere Ortskenntnis bietet dieselben Stadtviertel, mit gesperrter Heimat.
- 320, 390 und 768 px: kein horizontaler Überlauf. Keine Warnungen oder Fehler in der Browserkonsole.

Die Menüs verwenden eine eigene Sprachauswahl und die Ortsnamen aus RTGs offiziellem Inhaltsüberblick zu Night City 2045. Keine Karten oder Ortsbeschreibungen wurden übernommen. Fertigkeitsempfehlungen sind eigene Homebrew-Startvorschläge und werden ausdrücklich nicht als offizielle Rollen-Tabellen ausgegeben.

## Ergänzung v0.5: Anfängerablauf und Spielhilfen

Die separate Fertigkeitsempfehlungskarte, Vorschau und Übernehmen-Schaltfläche sind entfernt. Neue Figuren erhalten ihre 86-Punkte-Startverteilung automatisch; bisher unverteilte, bereits einer Rolle zugeordnete Entwürfe werden auch beim Laden vorbereitet. Alle Ränge bleiben mit Minus/Plus veränderbar, eigene Anpassungen bleiben geschützt. Die bisherigen 38 automatisierten Tests bestehen weiterhin.

Browserprüfung in einem getrennten Speicher unter `http://127.0.0.1:8086/red-builder/`:

- Neue Solo-Figur: 86 Punkte vorausgefüllt, keine Empfehlungskarte und keine Übernehmen-Schaltfläche im DOM.
- Dauerfeuer senken: zwei Punkte werden frei; erneutes Erhöhen verteilt sie wieder. Sprach- und Heimatmenüs funktionieren unverändert.
- Die Überprüfung zeigt nach Name/Rolle und Auswahl der Herkunft einen vollständigen Phase-2-Stand.
- Alle sechs abgeleiteten Werte besitzen den Linktext „Berechnungen und Erklärungen anzeigen“ sowie getrennte Texte zu Bedeutung, Anwendung im Spiel und persönlicher Berechnung.
- Todesrettung erklärt W10 unter BODY, Gleichstand als Fehlschlag, gewürfelte 10, steigende Erschwernis und Ausschluss von Glück. Beim Solo-Beispiel BODY 7 steht der unmodifizierte Erfolgsbereich 1–6.
- Schwer verwundet erklärt den −2-Abzug auf Aktionsproben sowie die Ausnahme für Initiative/Todesrettung. Menschlichkeit, Kampfreihenfolge und Glückseinsatz werden ebenfalls erklärt.
- Browserkonsole ohne Warnungen oder Fehler im geprüften Ablauf.

Spielhilfen sind eigene kurze Zusammenfassungen nach den freien RED-Regeln von Roll20 und RTGs Rules FAQ v1.3. Sie verwalten keine laufenden Kampfzustände und ersetzen nicht das Grundregelwerk.

