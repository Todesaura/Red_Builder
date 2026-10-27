# RED//BUILDER

Kostenloser, inoffizieller, deutschsprachiger Charaktergenerator für Cyberpunk RED. **v0.9 / Phase 4**. HTML, CSS und Vanilla JavaScript mit ES-Modulen, ohne Framework, npm oder Build-Schritt. Alle Charakterdaten bleiben im Browser.

## Lokal starten

Node.js 22.7 oder neuer im Projektordner:

```powershell
node serve.mjs
```

Dann http://127.0.0.1:8080/ öffnen. Ein statischer HTTP-Server genügt. `file://` unterstützt die verwendeten Module und JSON-Dateien nicht zuverlässig.

## Charakter erstellen

1. **Identität:** Name, eine von zehn Rollen und optional ein eigenes Porträt. JPG/PNG/WebP bis 5 MB werden lokal aufbereitet. Eine Porträtgalerie je Rolle ist vorgesehen.
2. **Attribute:** Rollenspezifische „Empfehlung“ oder eigene 62-Punkte-Verteilung, Grenzen 2–8. Empfehlungen sind eigene Homebrew-Verteilungen, keine offiziellen Tabellen oder Rollenboni. Eigene Werte bleiben beim Methodenwechsel erhalten.
3. **Fertigkeiten:** Rollenspezifisch vorausgefüllt und weiter anpassbar. 86 Kaufpunkte, 13 Pflichtfertigkeiten mindestens Rang 2, höchstens Rang 6. Die Herkunftssprache startet separat kostenlos auf Rang 4. ×2-Fertigkeiten kosten doppelt. Herkunftssprache und Heimat werden per Menü gewählt; zusätzliche Spezialisierungen sind möglich. Eigene angepasste Verteilungen werden beim Rollenwechsel bewahrt.
4. **Rollenfähigkeiten:** Eigener Abschnitt zur gewählten Rolle auf Start-Rang 4 mit speicherbarer Punktevergabe für Solo, Tech und Medtech. Teilfähigkeiten, aktuelle passende Fertigkeiten und dynamische Rechenbeispiele; andere Rollen sind zum Vergleich aufklappbar. Die übrigen Rollen verwenden ihren Rang direkt. Die Verteilung ist unabhängig vom Fertigkeitsbudget.
5. **Lebensweg:** 14 Fragen mit jeweils vier eigenen generischen Erzählvorschlägen oder einer eigenen Idee bis 600 Zeichen. Fragen dürfen offenbleiben. Eigene Entwürfe bleiben beim Auswahlwechsel erhalten; die Übersicht zeigt alle beantworteten Fragen.
6. **Ausstattung:** Kompakter Cyberware-Manager mit acht festen Regelbuch-Kategorien, Suche, Sortierung und Verfügbarkeitsfilter. Mehrere Komponenten per Hinzufügen oder Drag-and-drop im Körperentwurf sammeln, kostenlos herausnehmen und mit einer gemeinsamen Bestätigung installieren. Die kleinere Körperansicht dient ausschließlich der Installation und Inspektion; installierte Komponenten stehen unabhängig von der Katalogkategorie in einer gemeinsamen Übersicht. Die Reiter Waffen, Rüstung und Sonstiges teilen sich das Cyberware-Budget. Kopf- und Körperrüstung werden separat gekauft und angelegt.
7. **Überprüfung:** Basisdaten, Punkte, Spezialisierungen, Installationen und gemeinsames Geldbudget werden zentral geprüft. Der Zwischenstand ist noch kein vollständiger spielbereiter Charakter: Rollenspezifische Auswahlen und weitere Startausstattung fehlen noch.

Direkte Schritt-Links funktionieren bei vorhandener Identität; sonst öffnet sich zuerst die Identität. Schrittwechsel verlieren keine gespeicherten Eingaben.

## Startkapital und Ausrüstung

Dieser Generator verwendet **Complete Package**, auch bei Verwendung der eigenen Attribut-Empfehlungen:

- **2.550 eb** für Cyberware und Ausrüstung gemeinsam. Unverbrauchtes Guthaben bleibt als Bargeld.
- Zusätzlich **800 eb für Kleidung und Fashionware**. Dieser Zuschuss wird zuerst für die gewählte Fashionware verwendet. Mehrkosten gehen vom Hauptbudget ab; ungenutzter Zuschuss wird nicht zu Bargeld.
- Streetrat und Edgerunner haben andere Startausstattungen und sind hier noch nicht als Erstellungsmodi verfügbar.

Käufe und Einbauten werden bei unzureichendem Guthaben verhindert. Ausrüstung während der Erstellung zu entfernen gibt den jeweiligen Kaufpreis wieder frei. Bestätigt installierte Cyberware bleibt beim Ausbau bezahlt; zusätzliche Ausbaukosten werden mitgebucht. Kein Geldbetrag wird redundant gespeichert: Beide Budgets werden aus Katalogpreisen, aktuellen und ausgebauten Implantaten, vereinbarten Ausbaugebühren und Inventarmengen berechnet. Das frühere frei einstellbare Cyberware-Planungslimit wurde aus der Oberfläche entfernt und bei der Migration zurückgesetzt.

Die Reiter enthalten 19 Waffenvarianten, sieben Basismunitions-Packungen und zwei einzeln gekaufte Explosivmunitionstypen, acht Rüstungsarten mit separaten Kopf-/Körpervarianten sowie 21 Alltags-/Werkzeuggegenstände und 37 NET-Katalogeinträge. Waffen zeigen Schaden, ROF, Magazinkapazität und aktuelle Angriffsbasis. Panzerbrechende Granaten und Raketen sind einzeln für je 100 eb erhältlich; weitere Spezialmunition folgt. Rüstung wird je Bereich aus dem gekauften Bestand angelegt; beim ersten Kauf für einen leeren Bereich direkt über „Kaufen & anlegen“. Ersatzrüstung bleibt ohne Wirkung im Inventar. Der stärkste getragene Abzug auf REF, DEX und MOVE gilt einmal, mit Untergrenze 0; Initiative und Fertigkeitsbasen folgen den effektiven Werten. Basisattribute bleiben unverändert. Schutzwerte gelten getrennt, ohne Stapelung; Kampfschäden und Rüstungsablation werden nicht verwaltet. Zahlenreferenzen: englisches Grundregelwerk S. 92–97, 344–345, 350; Preise zusätzlich RTG Night Market Index.

Quellen: [Fantasy Grounds – lizenzierter RED-Regelsatz, Complete Package](https://fantasygroundsunity.atlassian.net/wiki/spaces/FGCP/pages/2140340233/Cyberpunk%2BRED%2BCharacter%2BCreation) und [offizieller RTG Night Market Index v1.23, Preise](https://rtalsoriangames.com/wp-content/uploads/2025/12/RTG-CPR-DLC-NightMarketIndexv1.23.pdf). Die automatische Verwendung des Fashion-Zuschusses ist die Zuordnung im Generator; weitere Bezugs-/Rollensonderfälle sind noch nicht enthalten.

## Cyberware-Menü v0.8

Die acht Hauptkategorien lauten exakt: Accessoires, Neuralsysteme, Cyberoptik, Cyberaudio, Interne Körpercyberware, Externe Körpercyberware, Cybergliedmaßen und Borgware. Leere Kategorien bleiben navigierbar und werden als noch nicht mit verifizierten Einträgen befüllt erklärt. Der Katalog enthält inzwischen 46 Einträge; Basisimplantate werden standardmäßig zuerst angezeigt.

Katalogschema 2 trennt ausdrücklich `category` (Regelbuch-Kategorie), `installationSlots` (zulässige Installationsbereiche) und `requirements` (Basisimplantate, Ausschlüsse, Mindestwerte und sonstige Bedingungen). `funding` legt die Budgetzuordnung unabhängig vom sichtbaren Kategorienamen fest. Accessoires entsprechen den bisherigen Fashionware-Einträgen; Arm-/Beinoptionen gehören zu Cybergliedmaßen, Bug Eye weiterhin zu Borgware. Quellen der bestehenden Zuordnungen bleiben an jedem Eintrag erhalten. Unklare künftige Zuordnungen erhalten `categoryReview`, erscheinen als Prüfhinweis und sind nicht installierbar.

Cyberware speichert weiterhin nur Implantat-IDs, Bereiche und Basisreferenzen. Das aktuelle Charakterformat 9 ergänzt eigene Ausrüstung. Regelwerte für Kataloggegenstände werden weiterhin ausschließlich aus der Konfiguration bezogen.

## Cyberware und erklärbare Werte

Die Körperansicht verwendet eine eigene SVG-Zeichnung. Drag-and-drop arbeitet mit Pointer Events, Pointer Capture und einer visuellen Ziehvorschau. Es gibt keine externe Drag-Bibliothek. Maus kann Karten ziehen, Touch den Ziehgriff. Auswahlknöpfe und Körperbereiche funktionieren zusätzlich per Klick und Tastatur. Alle Wege ergänzen einen gemeinsamen, mutationsfreien Installationsentwurf mit denselben echten Einbauprüfungen. Erst der gemeinsame Installationsbutton übernimmt alle gewählten Komponenten atomar. Kosten, Menschlichkeit, Maximum, EMP, betroffene Werte, Kapazität und Konflikte werden vorab erklärt. Nur der ausgewählte Eintrag öffnet seine Details. Es gibt keine verschachtelten Scrolllisten. Auf Mobilgeräten wird die Installation bei Bedarf geöffnet.

Der Katalog umfasst 46 Cyberware-Einträge, darunter Neural Link, Cyberaugen, Cyberaudio Suite, Cyberarme und Cyberbeine, Fashionware sowie neurale, optische, akustische und körperliche Optionen. Die Basisimplantate schalten passende Optionen einschließlich der bisherigen Cyberpillow-/ChainRipp-Einträge frei. Optionsplätze, notwendige Basen, Speedware-Ausschlüsse und gemeinsame Kosten werden geprüft. Noch nicht enthalten sind insbesondere paarweise zu kaufende Augen-/Beinoptionen und der vollständige Borgware-/Chipware-Katalog.

Die eigenständige Engine prüft Bereiche, erforderliche Basisimplantate, Optionsplätze, Mindest-Basisattribute, Inkompatibilitäten und Kosten. Permanente Attributänderungen, Fertigkeitsboni und situative Wirkungen bleiben getrennt. Attribut-Basiswerte und gekaufte Fertigkeitsränge werden nicht durch Cyberware überschrieben. Jeder Eintrag enthält seine Regelquelle; generische Sonderfälle werden mit ausdrücklich synthetischen Testdaten geprüft, die nicht im Produktkatalog erscheinen.

Menschlichkeit startet bei Basis-EMP × 10. Feste Erstellungsverluste und Reduktion des Maximums werden getrennt berechnet. Verlustverursachende Cyberware senkt das Maximum um 2, Borgware um 4; verlustfreie Katalogeinträge senken es nicht. EMP entspricht der Zehnerstelle der verbleibenden Menschlichkeit, mindestens 0. EMP-Fertigkeiten werden sofort angepasst. Bei EMP 0 erscheint eine Warnung. Drei Light-Tattoo-Installationen geben genau einmal +2 auf Garderobe/Stil. Situativer Blendschutz erhöht keine Attribute.

Der Generator bildet die **Charaktererstellung** ab. Herausnehmen vor der Installation macht eine Auswahl kostenlos rückgängig. Ein bestätigter Ausbau ist dagegen ein eigener Vorgang mit eingegebenen Kosten und stellt verlorene Menschlichkeit nicht automatisch wieder her. Therapie, Trauma, spätere Würfelverluste, medizinische Ersatzprothesen, gebrauchte oder verbesserte Implantate und weitere Sonderfälle werden nicht verwaltet. Externe Ausrüstungsvoraussetzungen wie ein Agent werden erklärt; ein vollständiges Verknüpfungssystem für Ausrüstung ist noch nicht enthalten.

Quellen: [Must Have Cyberware Deals](https://rtalsoriangames.com/wp-content/uploads/2022/06/RTG-CPR-DLC-MustHaveCyberwareDeals.pdf), [The 12 Days of Cybermas v1.02](https://rtalsoriangames.com/wp-content/uploads/2022/12/RTG-CPR-DLC-12DaysofCybermas.pdf), [Menschlichkeit: From the Mayor’s Desk](https://rtalsoriangames.com/2021/02/05/cyberpunk-from-the-mayors-desk-2-5-21/) und [Kapazitäten: FAQ v1.3](https://rtalsoriangames.com/wp-content/uploads/2021/07/RTG-CPR-CoreBookFAQv1.3.pdf).

Abgeleitete Werte und Hilfetexte erklären Trefferpunkte, Verwundungsschwelle, Todesrettungen, Menschlichkeit, Initiative und Glück. TP: `10 + 5 × ceil((BODY + WILL) / 2)`. Verwundungsschwelle: `ceil(TP / 2)`. Todesrettungsbasis: BODY. Initiativebasis: REF. Glückspool: LUCK. Quelle: Grundregelwerk S. 79, 129, 168 und 186–187, englische Ausgabe. Fertigkeitsliste und ×2-Zuordnung: [offizieller RTG-Charakterbogen](https://rtalsoriangames.com/wp-content/uploads/2020/11/RTG-CPR-CharacterSheet-Fillable.pdf). Eigene deutsche Übersetzungen ersetzen keine vollständige Regelreferenz.

## Architektur

| Datei | Aufgabe |
| --- | --- |
| `data/rules.json`, `data/skills.json` | Attribute, Rollen und Fertigkeitsdaten |
| `data/cyberware.json`, `data/equipment.json` | Kataloge, Preise, Budgets und Quellen |
| `js/model.js` | Datenformat 9, Rekonstruktion und Migration |
| `js/rules.js`, `js/derived.js` | Zentrale Auswertung und abgeleitete Werte |
| `js/skills.js`, `js/skill-recommendations.js` | Ränge, Punkte, Spezialisierungen und Startverteilungen |
| `js/cyberware.js`, `js/economy.js` | Einbauprüfungen, Menschlichkeit, Inventar und gemeinsames Budget |
| `js/ui-body.js` | Kompakte Körperdarstellung, Einbauziele und Pointer-Interaktion |
| `js/cyberware-ui-model.js` | Reine Katalogfilter, Kandidaten und mutationsfreie Installationsvorschau |
| `js/ui-cyberware-details.js` | Einzelne Detailansicht und hierarchische Installationsübersicht |
| `js/ui-cyberware.js` | Ausstattung, Cyberware-Menü, Inventar und Geldanzeige |
| `js/ui.js`, `js/ui-skills.js`, `js/ui-skill-choices.js` | Restliche Oberfläche und Eingabemenüs |
| `js/app.js` | Navigation, Eingaben und zentraler Zustand |
| `js/storage.js`, `js/portraits.js`, `js/html.js`, `js/explanations.js` | Speicherung, Porträts und sichere Darstellung/Erklärungen |

## Speicherung

Autosave verwendet weiterhin `red-builder.character.v1`, jetzt mit **Datenformat 10** im Inhalt. Format 9 erhält eine leere Ausbauhistorie mit Originalbackup, sämtliche bestehenden Auswahlen bleiben erhalten. Format 8 erhält eine leere Liste eigener Ausrüstung; bisherige Katalogkäufe, Implantate, Rollenpunkte und Lebensweg bleiben erhalten. Format 7 erhält einen leeren Lebensweg unter Erhalt aller bisherigen Rollenpunkte und Ausstattung. Format 6 erhält leere, getrennte Rollenverteilungen; bestehende Attribute, Fertigkeiten, Cyberware und Inventar bleiben erhalten. Format 5 behält Implantate und Inventar und erhält eine leere Auswahl für getragene Rüstung. Format 4 behält alle bisherigen Implantate und erhält ein leeres Inventar; das alte Wunschlimit entfällt. Format 3 erhält zusätzlich leere Cyberware-Daten. Frühere Versionen werden unter Erhalt von Name, Rolle, Bild und Basisverteilung übernommen; alte aktive Arrays werden in bearbeitbare Punkte umgewandelt.

Originale werden vor neuem Speichern unter `red-builder.character.vN.backup` gesichert. Vorhandene Sicherungen werden nicht überschrieben. Sicherungs-/Speicherfehler und Änderungen aus anderen Tabs pausieren das automatische Speichern. Ungültige Daten werden nicht still überschrieben. Gespeichert werden nur bekannte Auswahlfelder, IDs und Mengen, keine importierbaren Katalogpreise oder Regelwirkungen; eigene Ausrüstung besitzt ausdrücklich benutzerdefinierte Preise. Überzogene ältere Ausstattungen bleiben zur Korrektur erhalten, sind aber nicht abschließbar.

Pro Origin/Port besteht eigener Browserspeicher. Er ist kein portables Backup. Mehrere Charaktere sowie JSON-Import/-Export und Druckbogen folgen in Phase 5 bzw. späteren Erweiterungen.

## Prüfen und GitHub Pages

```powershell
node --test tests/*.test.mjs
```

Die Tests prüfen Regeln, Grenzen, Abhängigkeiten, Migrationen, Speicherschutz, Waffenoptionen und gemeinsames Budget. Browserprüfungen stehen in `tests/VERIFICATION.md`.

Relative Modul-/Datenpfade und `.nojekyll` unterstützen GitHub Pages ohne Build-Prozess. Dateien in ein Repository laden, unter Settings → Pages den Branch und `/(root)` wählen. Noch nicht veröffentlicht. Repository-Unterpfad lokal prüfen:

```powershell
node serve.mjs 8088 /red-builder/
```

## Lizenz und Faninhalt

MIT gilt nur für eigenen Quellcode. Keine offiziellen Bilder, Logos oder Layouts werden verwendet. Spielinhalte und Marken bleiben bei ihren Rechteinhabern. [RTG Homebrew Content Policy](https://rtalsoriangames.com/homebrew-content-policy/).

RED//BUILDER is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.

### Waffen und passende Munition

Nahkampf wird in vier Zweiergruppen angeordnet: Kampfmesser/Tomahawk, Baseballschläger/Brecheisen, Schwert/Bleirohr und Naginata/Vorschlaghammer. Die erste Waffe jeder Gruppe ist einhändig, die zweite ab Mittel zweihändig. Die einhändigen Varianten ab Mittel behalten den gewünschten Hausregel-Aufpreis von 50 %. Bestehende Katalog-IDs bleiben erhalten. Gemeinsame Erklärungen vor Nah- und Fernkampf nutzen die aktuellen Attribute und Fertigkeitsränge.

Jede Fernkampfwaffe bietet Einzelkauf und „Kaufen + Munition“. Das Paket kauft atomar zwei Magazinfüllungen, auf ganze Munitionspackungen aufgerundet; Bögen/Armbrüste erhalten 20 Pfeile/Bolzen. Diese Menge ist eine Einkaufshilfe, keine Regelvorgabe oder Garantie für einen Einsatz. Munition, Menge und Gesamtpreis werden vor dem Kauf gezeigt. Preis, Budget und Mengenlimit werden gemeinsam geprüft; ein Fehler lässt das Inventar vollständig unverändert. Passende Munitions-Kaufkarten erscheinen nur für gekaufte Waffen. Restmunition bleibt nach Waffenentfernung im Inventar und kann entfernt werden.

### Rollenfähigkeiten

Der neue Schritt `#role-abilities` liegt zwischen Fertigkeiten und Ausstattung. Er erklärt Charismatic Impact, Combat Awareness, Interface, Maker, Medicine, Credibility, Teamwork, Backup, Operator und Moto. Eigene deutsche Zusammenfassungen mit Quellen und Grundregelwerk-Seiten stehen getrennt von der Berechnungslogik in `js/role-abilities.js`; `js/ui-role-abilities.js` übernimmt die Darstellung. Die Überprüfung enthält eine kurze Rollenzusammenfassung.

Beispiele folgen den aktuellen effektiven Attributen, gekauften Fertigkeitsrängen und festen Boni. Rüstungsabzüge fließen daher etwa ins Moto-Fahrbeispiel ein; Interface erhält dagegen keinen INT-Bonus. Solo, Tech und Medtech können ihre Punkte jetzt verteilen und speichern. Feldexpertise, Gefahren erkennen und Moto fließen in passende Fertigkeitsbasen ein. Solo-Initiative wird in den abgeleiteten Werten berücksichtigt; Präzision gilt separat auf Angriffe. Rollenspezifische Ressourcen wie Teammitglieder, Zusatzsprachen, Fahrzeuge oder Firmenleistungen werden erklärt, aber noch nicht verwaltet.

### Rollenpunkte vergeben

`js/role-points.js` verwaltet eigene Budgets und sichere Rekonstruktion. Solo: vier Kampfpunkte, Effektstufen kosten je nach Fähigkeit 1, 2, 3 oder 4 Punkte. Tech: acht Fachränge, höchstens vier je Gebiet; die Summen lassen sich auf vier Rangschritte mit zwei verschiedenen Gebieten abbilden. Medtech: vier Punkte; Chirurgie liefert zwei Chirurgieränge pro Punkt, Pharmazeutik und Kryotechnik bilden zusammen Medizintechnik. Pro Pharmazeutikpunkt wird ein unterschiedliches Präparat ausgewählt. Beim Senken wird überzählige Auswahl entfernt. Es werden keine fertigen Dosen kostenlos gekauft.

Rollenrang bleibt im Charaktergenerator bei 4; keine Steigerung und kein Multiclassing. Beim Rollenwechsel bleiben gespeicherte Verteilungen als Entwürfe erhalten, nur die aktuell gewählte Rolle wirkt. Frühere Spielstände werden ohne erfundene Punkteverteilung übernommen. Unverteilte Punkte und fehlende Pharma-Auswahl erscheinen in der Abschlussprüfung. Feldexpertise verbessert gewöhnliche passende Technikproben, wird aber bei Maker-Proben nicht zusätzlich zum jeweiligen Fachrang aufaddiert. Gekaufte Fertigkeitsränge und das 86-Punkte-Budget bleiben unverändert.

### Lebensweg

Der Schritt `#lifepath` liegt zwischen Rollenfähigkeiten und Ausstattung. 14 Fragen in drei Gruppen (Persönlichkeit/Stil, Herkunft/Vergangenheit, Beziehungen/Zukunft) bieten je zwei eigene Erzählvorschläge und „Eigene Idee“. Es handelt sich nicht um reproduzierte offizielle Zufallstabellen oder rollenspezifische Lebensweg-Tabellen. Die Geschichte hat keine mechanischen Auswirkungen.

`js/lifepath-data.js` enthält die Fragen, `js/lifepath.js` Auswertung/Validierung und `js/ui-lifepath.js` Editor und Übersicht. Gespeichert werden nur eine bekannte Auswahl und ein Textentwurf je Frage. Wechseln und Zurücknehmen erhalten den Text, maximal 600 Zeichen. Offene Fragen sind erlaubt; gewählte eigene Ideen ohne Text werden in der Prüfung gemeldet. Freitexte werden sicher dargestellt; Textarea-Fokus und Cursor bleiben beim Eingeben erhalten. Format-7-Spielstände erhalten einen leeren Lebensweg mit Originalbackup.

### Erweiterte Ausstattung und eigene Gegenstände

46 Cyberware-Einträge, 21 allgemeine Ausrüstungsgegenstände und 37 Netrunner-Einträge sind vorhanden. Der Standard-Cyberdeck-Kauf und Virtuality-Brille ergänzen die Netrunner-Grundausrüstung; Programme und Hardware sind im Netrunner-Katalog kaufbar; der Kaufbestand ist von der späteren Deckbelegung getrennt. Kerenzikov erhöht Initiative dauerhaft ohne REF-Änderung; Sandevistan bleibt ein aktivierungsabhängiger Hinweis. Chemskin/Techhair geben ihren gemeinsamen Bonus einmal. Hörbezogene Boni erhöhen keine allgemeine Wahrnehmungsbasis. Implantierte Panzerung liefert Kopf-/Körper-SP, wobei der höhere Wert aus Implantat und getragener Rüstung zählt. Schutzwertänderungen erscheinen in der Einbauvorschau. Die neue Tool Hand und Talon Foot können alternativ allein in der natürlichen Gliedmaße oder als passende Basisoption installiert werden.

Unter Sonstiges können bis zu 40 eigene Gegenstände angelegt, bearbeitet und stückweise entfernt werden: Name (60 Zeichen), ganzzahliger Stückpreis (ab 0), Menge (1–99), Notizen (600 Zeichen). Eigene Einträge sind gekennzeichnet, werden gespeichert und erscheinen in der Überprüfung. Ihre Gesamtkosten belasten das gemeinsame Bargeld; sie verbrauchen keinen Fashion-Zuschuss und haben keine automatisch wirksamen Attribute, Waffen- oder Rüstungswerte. Katalogpreise bleiben geschützt. Käufe, Änderungen und Munitionspakete prüfen den vollständigen Bestand einschließlich eigener Kosten vor einer Mutation.

### Gemeinsame Cyberware-Installation und Ausbau

Cyberware wird durch Drag-and-drop oder Hinzufügen zuerst in einem gemeinsamen Entwurf gesammelt. Körperbereiche, Verfügbarkeit und Voraussetzungen verwenden diesen Entwurf: Eine geplante Basis schaltet ihre Optionen bereits frei. Kategorienwechsel erhält die Auswahl. Herausziehen in die markierte Ablage oder zurück zum Katalog sowie × nehmen geplante Komponenten kostenlos heraus; eine geplante Basis entfernt ihre abhängigen geplanten Optionen mit. Erst ein gemeinsamer Installationsbutton übernimmt alle Komponenten atomar. Budget, Kapazitäten, Abhängigkeiten, Effekte und HUM werden erneut geprüft. Ein veränderter Geldbestand kann den Einbau blockieren. Offene Entwürfe werden nicht dauerhaft gespeichert; die Oberfläche weist darauf hin.

Bereits installierte Komponenten können nicht herausgezogen werden. Ausbau öffnet einen eigenen Vorgang mit ausdrücklich eingegebenem, mit der Spielleitung vereinbartem Preis (0 bis 1.000.000 eb). Es gibt keinen erfundenen pauschalen Regelbuchpreis. Die Bestätigung belastet Bargeld; bei unzureichenden Mitteln bleibt alles unverändert. Abhängige Optionen müssen zuerst ausgebaut, offene Entwürfe installiert oder geleert werden. Kaufpreis und verbrauchter Fashion-Zuschuss bleiben ausgegeben. Verlorene Menschlichkeit wird nicht automatisch geheilt, das Maximal-HUM folgt nur den noch eingebauten Komponenten. Kein Ersatzteilinventar, Verkauf, Wiederverwendung oder Therapie wird simuliert. Der historische Verlust folgt den hinterlegten Werten für Charaktererstellung. Format 10 speichert eine begrenzte Ausbauhistorie mit bekannten Katalog-IDs und Kosten; Format 9 wird mit Originalbackup ohne Änderungen am Charakter übernommen.

### PDF-Charactersheet

Unter Überprüfung lädt „Charactersheet generieren“ ein ausgefülltes PDF aus der unveränderten lokalen Vorlage `data/Charakterblatt.pdf` herunter. Name, Rolle/Rang, effektive Attribute, aktuelle Fertigkeitsbasen, Herkunftssprache/Heimat, TP/Todesrettung, HUM/EMP, getrennte Kopf-/Körperrüstung, Waffen/Munition, Inventar, eigene Gegenstände, Lebensweg und Cyberware werden zugeordnet. Ein hinterlegtes JPG-/PNG-/WebP-Porträt wird übernommen. Offene Spielfelder ohne Generatorangaben bleiben leer. Bei Glück/EMP werden aktuelle und Basiswerte getrennt in die vorhandenen „aus“-Felder geschrieben. Vorgedruckte falsche ATT-Texte werden nicht als Berechnungsgrundlage verwendet; die Zahlenfelder verwenden die tatsächlichen Attribute.

Voraussetzung: sichere Modellvalidierung, sämtliche zentralen Regelprüfungen, alle 14 Lebensweg-Antworten und kein offener Implantat-, Ausbau- oder eigener Ausrüstungsentwurf. Keine Pflichtkäufe und keine Porträtpflicht. Die Prüfung läuft im UI und erneut im Export. Ein laufender Export sperrt Doppelklicks und verwendet einen unabhängigen Snapshot; Ladefehler werden angezeigt.

Die Vorlage hat keine eigenen AcroForm-Felder. Der Export legt echte editierbare Felder mit eingebetteter Ubuntu-Schrift und fertigen Appearance-Streams darüber. Lange Feldinhalte erhalten eine abgekürzte Druckvorschau, bleiben aber als vollständiger editierbarer Formularwert mit Scrollmöglichkeit erhalten. Zusätzliche Sprachen, Waffen, Gegenstände und Implantate werden im jeweils letzten passenden Feld mitgeführt. Der Export hat genau vier Seiten: drei Vorlagenseiten und ein formatiertes Cheatsheet. Wiederholte Gesamtlisten und Ergänzungsseiten entfallen. Nicht unterstützte Schriftzeichen werden ausdrücklich als Unicode-Code `[U+...]` dargestellt. SHA-256 und Seitengrößen schützen vor versehentlich ausgetauschten Vorlagen mit falschen Feldpositionen.

`js/pdf-character-data.js` trennt Freigabe und Datenaufbereitung; `js/pdf-character-layout.js` enthält die Zuordnung zur konkreten Vorlage; `js/pdf-character.js` erzeugt und lädt die Datei herunter. Bibliotheken werden erst bei Bedarf lokal geladen: pdf-lib 1.17.1, @pdf-lib/fontkit 1.1.1 (selbstständiges Bundle mit kleinem ESM-Wrapper), Ubuntu Regular. Versionen/Lizenzen stehen unter `vendor/`. Keine CDNs oder Datenübertragung beim Export. Die hinzugefügte Charakterblatt-Vorlage und Schriften fallen nicht unter die Projekt-MIT-Lizenz. `tmp/`, `output/` und Screenshots sind von Git ausgeschlossen.

Zehn Exporttests prüfen Pflichtangaben, alle zehn Rollen, offene Entwürfe, effektive Werte und Rüstungsabzüge, getrennten Schutz, Geld, alle numerischen Skill-Felder nach PDF-Rundlauf, editierbare Felder samt Widget-Parents und Appearances, Umlaute/lange Texte, zusätzliche Sprachen/mehr als 18 eigene Gegenstände, PNG-Porträt, fehlende/geänderte Vorlage, sichere Dateinamen und lange Wörter.

### Übersicht, freie Skillverteilung und neue Charaktere

Attributkarten erklären kurz den Zweck des Wertes. Die lange Herkunfts-/Homebrew-Erklärung und die Quellenzeile entfallen dort; Basiswert, tatsächliche Modifikatoren, Rüstungsabzüge und effektiver Wert bleiben. Eine gesonderte EMP-Rechnung zeigt Startmenschlichkeit, bisherigen Implantatverlust, verbleibende Menschlichkeit und effektive Empathie. Name oder Rolle zu ändern übernimmt weiterhin den bisherigen Bestand; dafür gibt es jetzt ausdrücklich „Neuen Charakter erstellen“.

Unter Fertigkeiten sind alle Ränge über 0 grün markiert, einschließlich Herkunftssprache und Spezialisierungen. „Punkte zurücksetzen“ setzt sämtliche gekauften Ränge und Spezialränge auf 0; die kostenlose Herkunftssprache bleibt Rang 4 und Sprach-/Orts-/Spezialisierungsnamen bleiben erhalten. Alle 86 Kaufpunkte stehen wieder zur Verfügung. Diese bewusste eigene Verteilung wird weder nach Neuladen noch bei Rollenwechsel automatisch ersetzt. Auch Pflichtränge dürfen im Entwurf unter 2 liegen und gespeichert werden. Die Abschlussprüfung und PDF-Freigabe verlangen weiterhin die 13 Mindestfertigkeiten auf Rang 2 und das exakt verteilte Budget. Es wird deshalb kein ungültiger fertiger Charakter exportiert.

Eine kompakte, angeheftete Geldleiste bleibt in allen vier Ausstattungskatalogen beim Scrollen sichtbar. Sie zeigt Hauptguthaben und Fashion-Zuschuss getrennt sowie bei offenem Implantatentwurf den voraussichtlichen Restbetrag nach dem Einbau.

„Neuen Charakter erstellen“ sichert zuerst den bisherigen Charakter als separate lokale Archivkopie unter `red-builder.character.archive.<Zeitstempel>`, speichert erst danach den frischen aktiven Charakter und leert sämtliche UI-Entwürfe und Filter. Alle bisherigen Modellfelder einschließlich Portrait, Lebensweg, Rollenpunkte, Käufe und Ausbauhistorie sind getrennt. Beim Scheitern der Sicherung wird nicht gewechselt. Gesicherte Stände lassen sich unter Identität → Gespeicherte Charaktere wieder öffnen; vor einem Wechsel wird auch der aktuelle Charakter gesichert. Das vorhandene Datenformat 10 bleibt erhalten. Diese Archive sind Browserdaten, kein dateibasiertes Backup.

### Waffenspezifische Angriffsoptionen

Kaufkarten zeigen passende Modi mit aufklappbaren Erklärungen. Gekaufte Waffen erhalten unter Waffen, Überprüfung und im PDF-Cheatsheet Hinweise mit aktuellen Fertigkeitsbasen: gezielte Angriffe, Autofeuer (MP ×3, Sturmgewehr ×4), Unterdrückungsfeuer, Schrotpatronen gegenüber Slugs sowie Pfeile und explosive Flächenangriffe. Munitionsverbrauch und geladene Magazine werden während des Spiels geführt; der Generator verändert dafür keinen Bestand.


### Einseitiges Cheatsheet

Die vierte PDF-Seite zeigt ausschließlich eigene Waffen und passende Moduszeilen mit Schaden, ROF, Magazin/Verbrauch, effektiver Angriffsbasis und acht Entfernungs-DVs. Autofeuer verwendet eigene DVs und Dauerfeuer-Basis; Schrotpatronen verwenden ihre Flächenregel statt der Slug-Tabelle. Darunter stehen drei formatierte Spalten zu Zugablauf/Proben/Glück, Verwundung/Todesrettung/Stabilisierung, Angriff/Schaden/kritischen Verletzungen, verfügbaren Angriffsarten, aktueller Rollenfähigkeit und Schutz/Praxis. Keine erneuten Lebensweg-, Fertigkeits- und Inventar-Gesamtlisten. Immer genau eine DIN-A4-Seite: gewöhnliche Charaktere im Querformat, große Waffen-/Programmbestände im Hochformat. Zusammengehörige Regelblöcke werden nicht über Spalten getrennt. Auch das komplette Katalogarsenal bleibt auf einer Seite. Regeln: Grundregelwerk S. 129, 168–188, 222–223 sowie offizielle RTG FAQ v1.3.


### Deutsche Attribute, geführter Lebensweg und schnelle Cyberware-Auswahl

Anzeige-Kürzel: INT, REF, GES, TCH, COO, WIL, GLK, BEW, KRA, EMP. IDs und gespeicherte Berechnungsgrundlagen bleiben unverändert. Fertigkeitsanzeigen, Rüstungshinweise und Rollenbeispiele verwenden diese deutschen Kürzel. Das Cheatsheet schreibt die Begriffe vollständig aus. Der Fernkampfhinweis erklärt ausdrücklich gegnerisches Ausweichen ab REF 8, Ansage/Wurf vor dem Angriff und Ersatz der Entfernungs-DV. Diese REF-Voraussetzung gilt nicht für Nahkampf und nicht für NET-Verteidigung.

Der Lebensweg zeigt nur eine Frage: vier deutlich unterschiedliche Vorgaben und eigene Idee. Vorgegebene Antworten führen zur nächsten offenen Frage; Freitext wird erst nach „Antwort übernehmen“ verlassen. Zusammenfassung bleibt unten mit Änderungsbutton je Antwort. Alte first/second-Auswahlen und Textentwürfe bleiben erhalten; third/fourth sind zusätzliche gültige Auswahl-IDs. UI-Schrittposition wird getrennt vom Charakter geführt.

Hinzufügen belegt den ersten gültigen Bereich unter Berücksichtigung bereits geplanter Komponenten. Fehlende Basisimplantate können atomar in denselben Entwurf aufgenommen werden, beispielsweise Chyron + Cyberauge für 200 eb und 9 HUM. Vorhandene oder geplante kompatible Basen werden wiederverwendet; volle Bereiche, Budget, maximale Komponenten und Konflikte bleiben geprüft. Fehlende Basis erscheint rot mit Basisname und gemeinsamem Preis; zu teure Pakete bleiben gesperrt. Die gemeinsame Installationsbestätigung bleibt erforderlich.

### Netrunner-Waffen

Separater Ausstattungstab mit vollständigem Grundregelwerk-Katalog für Cyberdecks und deren Software/Hardware: drei Deckqualitäten (100/500/1.000 eb, 5/7/9 gemeinsame Plätze), Virtuality-Brille, 15 gewöhnliche Programme, 12 Nicht-Demon-Black-ICE und sechs Hardware-Optionen. Der bisherige Standarddeck- und Brillen-Katalogeintrag wird mit gleicher ID und gleichem Preis dorthin verschoben; vorhandene Käufe bleiben gültig. Karten zeigen Platzbedarf, Zielklasse, ATK/DEF/REZ und für Black ICE PER/SPEED sowie eigene deutsche Wirkungszusammenfassungen. Grundregeln zu Interface-Proben, NET-Aktionen, Angriff/Verteidigung, Hirn-/REZ-Schaden, Aktivierung, Deaktivierung und Verbindung stehen davor. Käufe verwenden dasselbe Bargeld, Mengenlimit, Speichermodell, Inventar und PDF wie die übrige Ausstattung. Kaufbestand bedeutet nicht installierte oder aktive Programme; keine Programmeffekte werden ungefragt auf körperliche Fertigkeiten addiert. Optionale Bodyweight-Rüstung und Basisimplantate bleiben in ihren bestehenden Kategorien. Keine DLC- oder Architektur-/Demon-Käufe werden als Cyberdeck-Programme angeboten.


### Nicht blockierende Ausstattungswarnungen

Am Ende der Überprüfung steht bei Bedarf ein eigener gelber Hinweisblock mit direkten Buttons zu den Ausstattungskategorien. Geprüft werden physische Waffe einschließlich erfasster installierter Cyberwaffen, passende Munition, tatsächlich wirksamer Kopf-/Körperschutz und rollenabhängige Hilfsmittel. Netrunner erhalten getrennte Hinweise für fehlende installierte Neural-Link-/Interface-Plugs-Verbindung, Cyberdeck, Angriffsprogramm/Black ICE und Virtuality-Sicht; gekaufte NET-Angriffe ersetzen keine normale Waffe, Zap bleibt ohne gekauftes Angriffsprogramm möglich. Techs und Nomaden erhalten Werkzeughinweise, Medtechs Hinweise für Behandlungsausrüstung und bei Pharmazeutik ein Airhypo, Musiker einen Instrumenthinweis, Medias einen Dokumentationshinweis und Kontaktrollen einen Kommunikationshinweis. Rollenleistungen wie die Kryopumpe werden nicht als Pflichtkauf erfunden. Selbst beschriebene Gegenstände werden nicht pauschal zu wirksamer Rüstung/Waffen erklärt.

`equipmentWarnings` und `renderEquipmentWarnings` sind bewusst von zentralen Fehlern und `characterSheetReadiness` getrennt. Kein Speicherdatenformat ändert sich, keine Käufe werden ausgeführt und ein ansonsten gültiger Charakter bleibt einschließlich PDF exportbereit. Pflichtfehler und offene Installationsentwürfe bleiben unabhängig davon geprüft.


### Deutsches Cheatsheet und Netrunner-Anleitung

Das Cheatsheet verwendet ausgeschriebene deutsche Werte und Regelbegriffe, etwa Reflexe, Geschicklichkeit, Schutzwert, Schwierigkeitsgrad und Schnittstelle. Deutsche Anzeigenamen der Programme gelten auch im Kaufmenü; ursprüngliche Namen bleiben als Quelldaten erhalten. Bestehende IDs, Preise, Käufe und Speicherstände ändern sich nicht.

Die ausführliche Netrunner-Anleitung bleibt im Netrunner-Katalog aufklappbar. Das PDF verwendet stattdessen die kompakte charakterspezifische Kurzreferenz mit konkreten Werten, Aktivierungsbedingungen und Sonderregeln. Gekaufte Integritätswaffen stehen mit „(Net)“ zuerst auf Seite 1; Schaden und Basis berücksichtigen Zielart und selbstständig angreifendes Schwarzes ICE. Die vierte Seite bleibt ein einziges formatiertes Cheatsheet, auch bei allen 15 gewöhnlichen Programmen.


### Porträtgalerie je Rolle

Unter Identität stehen für jede Rolle alle vorhandenen männlichen und weiblichen Porträts aus `data/portraits` bereit: derzeit 100 Bilder, jeweils fünf pro Gruppe und Rolle. Eine Auswahl ersetzt das Charakterbild; eigene Uploads und Entfernen bleiben verfügbar. Das gewählte Bild wird verkleinert als JPEG im Charakter gespeichert und erscheint auch im bestehenden PDF-Export. Ein Rollenwechsel zeigt die passende Galerie und behält ein bereits gewähltes Bild bei.

Originaldateien heißen `Klassenname-M-Zahl.png` beziehungsweise `Klassenname-W-Zahl.png`, etwa `Netrunner-W-2.png`. Nach weiteren Bildern `python scripts/update_portraits.py` ausführen (benötigt Pillow). Dadurch werden Katalog und kleine Vorschaubilder erneuert; Originale bleiben unverändert. Die Galerie lädt kleine JPEG-Vorschauen statt der großen Originaldateien. Die optionale Auswahlkennung ist mit bestehenden Format-10-Speicherständen kompatibel.

Die Identität bündelt Vorschau, Galerie und Upload in einem einzigen Porträtbereich unter der Rollenwahl. Ohne Bild gibt es keinen leeren Porträtrahmen am Namen. Nach Auswahl erscheint die Vorschau direkt bei den Bildoptionen.


### Charakterspezifische A4-Kurzreferenz

Die letzte PDF-Seite ist ein Spickzettel für regelkundige Rollenspieler beim ersten RED-One-Shot. Oben stehen Statuswerte und ausschließlich eigene Waffen mit normalen und gezielten Angriffswerten sowie Entfernungswerten. Ein eigener Rollenblock zeigt konkrete Würfelbasen für alle zehn Rollen aus den zentral ausgewerteten Werten und Rollenpunkten. Netzproben nennen ausdrücklich den Wert mit aktivem gekauftem Programm und den Wert ohne diesen Bonus. Selbstständiges Schwarzes ICE verwendet seinen eigenen Angriff ohne Schnittstellenaddition.

Feste Rollen-/Implantatboni und Rüstungsabzüge sind bereits enthalten. Situative Implantate wie Sandevistan zeigen separat den bedingten Gesamtwert und ihre Dauer/Abklingzeit. Kaufbestand wird nicht als aktive Deckbelegung ausgegeben. Sonderregeln zu Aktivierungen, Integrität, Hirnschaden, Verteidigern, Netzverbindung, Verwundung, Todesrettung, Rüstungsabtrag und vorhandenen Angriffsarten bleiben kompakt erhalten. Allgemeine Würfelerklärungen und lange Lernbeispiele entfallen im PDF. Die [offizielle Solo-Kurzreferenz](https://rtalsoriangames.com/wp-content/uploads/2021/02/RTG-CPRed-SingleShotPackv1.1.pdf) bestätigt die beschriebenen Umverteilungszeitpunkte und Bonusbedingungen.

Fette Würfelwerte und kurze Regelblöcke ersetzen den fortlaufenden Tutorialtext. Die Blöcke bleiben vollständig in einer Spalte; kein Fortsetzungsverweis. Fließtext verwendet 9,2 bis mindestens 8,6 pt, Waffentabellen 8 pt. Selbst das gesamte Katalogarsenal und alle 15 gewöhnlichen Netzprogramme wurden jeweils auf einer A4-Seite geprüft. Regelengine, Charakterdaten und die ersten drei Formularseiten werden durch diese Darstellung nicht verändert.


### Archivstände löschen und Überprüfung aufklappen

Unter Identität öffnet „Gespeicherte Charaktere“ die bestehende Archivliste. Jeder Eintrag hat einen Öffnen-Button und ein rotes × rechts. Das × öffnet einen modalen Bestätigungsdialog mit dem Charakternamen, der Warnung vor permanenter Löschung, „Abbrechen“ und „Permanent löschen“. Abbrechen erhält standardmäßig den Fokus; Escape bricht ebenfalls ab. Gelöscht wird ausschließlich der gewählte Archivschlüssel nach Bestätigung. Aktiver Charakter, andere Archive und Migrationssicherungen bleiben erhalten. Archive anderer Tabs aktualisieren die Liste ohne Änderung des aktiven Entwurfs.

Die Überprüfung zeigt Lebensweg, gelernte Fertigkeiten, installierte Cyberware sowie Waffen und Ausrüstung anfangs geschlossen. Aufklappen zeigt den vollständigen bisherigen Inhalt. Die vorhandene Erhaltung geöffneter Details bei einer Neudarstellung bleibt wirksam. Exportfreigabe und Berechnungen ändern sich nicht. Der Hinweis endet nun mit „Prüfe, ob du diese Lücken bewusst lässt.“


### Profilwechsel ohne zusätzliche Archivkopien

Geöffnete gespeicherte Profile behalten ihren Archivschlüssel. Beim Verlassen wird derselbe Eintrag aktualisiert; wiederholtes Öffnen des aktiven Profils stellt keine älteren Daten über laufende Änderungen. Die Zuordnung bleibt über Neuladen hinweg separat unter `red-builder.character.activeArchive` gespeichert. Leere neue Entwürfe werden nicht archiviert. Neu angelegte Charaktere erhalten beim ersten Sichern einen neuen Eintrag.

Alte Speicherstände ohne Zuordnung können einen vollständig identischen gespeicherten Stand wiederverwenden; Namen allein sind kein Identitätsmerkmal. Unterschiedliche gleichnamige Charaktere und bestehende historische Kopien bleiben erhalten. Bei fehlendem oder inzwischen geändertem Ziel und Speicherfehlern wird nicht gewechselt; die bisherige aktive Zuordnung bleibt erhalten. Regel- und Charakterdatenformat bleiben unverändert.


### Waffenmenü, Handgranaten und Aufsätze

Der Kaufkatalog unter Waffen ist nach Nahkampf, Fernkampf, Handgranaten und passender Munition aufklappbar. Standardwaffen tragen passende Modellnamen (z. B. schwere Pistole – Mustang Arms Mark III); vorhandene IDs, Qualität und Grundpreise bleiben erhalten. Modellnamen folgen RTGs „Toggle’s Temple“. Handgranaten sind eigenständige Käufe ohne Werfer; der Handwurf verwendet Athletik bis maximal 25 m. Neun Varianten ergänzen die bisherige Werfermunition.

Panzerbrechende, Brand- und Gummimunition werden kalibergerecht nur für gekaufte Waffen angeboten. Mengen bleiben Packungen zu zehn Schuss; Granaten einzeln. Beschreibungen erklären Sonderwirkungen und Einschränkungen. Der Kombikauf verwendet Basismunition, zwei Magazinfüllungen und berücksichtigt größere Magazine und bereits konfigurierte Aufsätze.

Im Waffeninventar lassen sich Smartgun-Anbindung, Zielfernrohr, Infrarot-/Nachtsichtvisier, erweitertes Magazin, Trommel und Schalldämpfer zuordnen. Drei Montageplätze, gegenseitig ausschließende Positionen, Kompatibilität und gemeinsames Budget werden geprüft. Die Konfiguration gilt je Katalog-Waffentyp für alle vorhandenen Exemplare und kostet je Exemplar. Entfernen korrigiert einen Startkauf und erstattet Kosten; beim letzten entfernten Waffenexemplar wird seine Konfiguration gelöscht. Format 10 akzeptiert alte Speicherstände ohne `equipment.attachments` und ergänzt eine leere Liste.

Smartgun zählt +1 nur mit Neuralimplantat und Schnittstellenbuchsen (oder gegebenenfalls subdermalem Griff). Der Zuschlag bleibt waffenspezifisch; Zielfernrohrboni ab 51 m werden separat mit konkreten Würfeln erklärt, nicht auf alle Entfernungen addiert. Kapazitäten werden in UI/Export/Kombikauf berücksichtigt; Trommeln benötigen zwei Nachladeaktionen. Die PDF-Tabelle nennt „Würfel“ und vollständige Angaben wie `15+1W10`. Aufsätze, Spezialmunition und Granatenwirkungen erscheinen charakterspezifisch auf dem weiterhin einseitigen A4-Cheatsheet. Modellnamen und vollständige Notizen bleiben in den editierbaren Formularwerten erhalten; die enge Druckvorschau auf Seite 1 verwendet den Modellnamen.


### Erweiterte Aufsätze aus dem Community-Beitrag

Zusätzlich zu den sechs Standardaufsätzen sind 31 geprüfte Varianten aus Kasenai3s Reddit-Beitrag eingebaut: Läufe/Kompensator/Chokes, Unterlaufwaffen, Laser-/Reflex-/variable Visiere und Bildübertragung, Schäfte/Griffe/Tragesysteme, Sicherung/Injektor/Tarngehäuse, Doppelmagazin/Schnelllader sowie Finishs. Das Inventar gruppiert passende Optionen in aufklappbaren Abschnitten. Der Nutzen und die konkrete Wirkung stehen je Option; die Community-Herkunft wird einmal gemeinsam erklärt. Die vollständige Prüfung mit Preis, Montageplätzen, Nutzen und Anpassungen steht in `docs/WAFFENAUFSAETZE.md`.

Dauerhafte Modifikationen werden waffenspezifisch ausgewertet; keine Veränderung der Grundfertigkeiten. Bedingte Situationen erhalten eigene konkrete Würfel. Laser und Kompensator sind optionale zusätzliche Schusszeilen. Der Dauerfeuer-Umbau nutzt für automatische Modi MP-Werte, erhält die ursprünglichen Pistolen-Einzelschusswerte und verlangt mindestens zehn Patronen Magazinkapazität. Unterlaufwaffen sind eigenständige abgeleitete Waffen mit eigenen Werten, Munitionssorten und Nachladen; sie erben keine Aufsätze der Hauptwaffe und kosten keine zusätzlichen kostenlosen Aktionen. Passende Munition wird freigeschaltet. Preise/Erstattungen je Exemplar und bestehendes Speicherformat 10 bleiben erhalten.

Das PDF listet jeden Aufsatz einzeln mit seiner Zuordnung im Inventar. Feste Boni stehen in den Tabellen, bedingte Würfel hervorgehoben bei der jeweiligen Erweiterung. Dichte Referenzen verwenden knappere Kartenabstände und bei Bedarf die bestehende Kurzansicht mit eigener Spalte für gezielte Angriffe; sie bleiben auf einer A4-Seite mit mindestens 8,6 pt Fließtext. Verteilungs- und Regelberechnungen des übrigen Charakters bleiben erhalten.


### Tragegrenzen und angepasste Granatenpreise

Der Generator erlaubt insgesamt höchstens drei Granaten, zwei Einhandwaffen und eine Zweihandwaffe. Tatsächliche Stückzahlen zählen, einschließlich doppelter Waffen. Werfergranaten gehören zum gemeinsamen Granatenlimit; montierte Zusatzläufe, Netzprogramme, normale Patronen und implantierte Waffen belegen keine zusätzlichen Trageplätze. Die Handführung aus Aufsätzen wird berücksichtigt. Käufe, Kombipakete und das Hinzufügen/Entfernen eines Anschlagschafts können die Grenzen nicht überschreiten. Der Waffenbereich zeigt aktuelle Belegung und sperrt entsprechende Kaufoptionen.

Splitter- und Brandhandgranaten kosten jeweils 500 eb. Die vergleichbare panzerbrechende Werfergranate kostet ebenfalls 500 eb. Kombipakete kaufen bis zu zwei Magazinfüllungen, bei Granaten höchstens die noch freie Menge. Bestehende Charaktere werden vollständig geladen und nicht automatisch verändert; Überschreitungen und das durch neue Preise gegebenenfalls überschrittene Budget erscheinen in der zentralen Prüfung und verhindern den PDF-Export bis zur Korrektur.

Im Cheatsheet erklärt der Nahkampf-Gegenwurf nun Geschicklichkeit + Fertigkeitsrang Ausweichen + situative Modifikatoren + 1W10. Die kompakte Tabellenzeile verwendet die entsprechenden Kürzel. Bereits berechnete Charakterwerte bleiben unverändert.


### Normale und militärische Granaten

Die bisherigen 6W6-Varianten heißen jetzt Militärische Splittergranate und Militärische Brandgranate; IDs und Preis von 500 eb bleiben erhalten. Die vergleichbare Werfermunition trägt ebenfalls die militärische Bezeichnung. Normale Splittergranaten (200 eb) verursachen 4W6 und senken bei Durchdringung den Schutzwert um 1; normale Brandgranaten (200 eb) verursachen 3W6 und ebenfalls 1 SP Rüstungsabtrag. Militärische Splittergranaten behalten 6W6 und 2 SP Abtrag.

Beide Brandvarianten verursachen bei Durchdringung 2 direkte Trefferpunkte pro Runde am Ende des eigenen Zugs, bis eine Aktion zum Löschen verwendet wird; der Brand ist nicht stapelbar. Das Cheatsheet liest Schaden, Rüstungsabtrag und Brandschaden aus den Katalog-Wirkungsdaten. Das Kaufmenü zeigt normale Granaten zuerst, danach militärische und Spezialgranaten. Alle teilen weiterhin das gemeinsame Limit von drei Granaten.


### Cyberwaffen aus dem Edgerunners Mission Kit

Unter Cybergliedmaßen stehen Mantisklinge (500 eb), Gorilla-Arm (1.000 eb) und Monodraht (1.000 eb), jeweils pro Arm. Alle benötigen zwei Optionsplätze und verursachen 14 Menschlichkeitsverlust; ein nötiger Cyberarm wird mit 500 eb und 7 Menschlichkeitsverlust automatisch in den Entwurf aufgenommen. Quelle: CEMK S. 35; Preise im offiziellen Night Market Index v1.24. Das spätere DLC Cyberware Enhancements enthält zusätzliche Aufrüstungen und ist nicht Teil dieser drei Basiseinträge.

Die installierten Waffen erscheinen in Angriffsoptionen, auf PDF-Seite 1 und im Cheatsheet: Nahkampfwaffenfertigkeit, 3W6, zwei Angriffe; exzellente Qualität bei Mantisklinge/Gorilla-Arm lokal +1. Monodraht hat 6 m Reichweite und Auswahl aus zwei kritischen Verletzungswürfen. Paarfunktionen gelten nur bei Einbau in beiden Armen. Gorilla-Körperkraft 11 gilt nur zum Führen von Waffen, ohne globale Attribut- oder Trefferpunktänderung. Installierte Cyberwaffen belegen keine zusätzlichen tragbaren Waffenplätze. Bestehende Budget-, Entwurfs-, Menschlichkeits- und Ausbauprüfungen bleiben aktiv.


### Schritt 8: After Session Report

Der Report ist ein Entwurf über dem aktuellen Charakter. Er zeigt Geld, verfügbare IP, aktuelle/maximale TP, aktuelle/maximale Menschlichkeit, EMP und Rollenrang vorher/nachher. Änderungen lassen sich bearbeiten oder entfernen; erst der gemeinsame Abschluss schreibt den vollständigen Charakter einschließlich Historie in einem Speichervorgang. Ein inzwischen geänderter Charakter, ungültige Vorgänge oder fehlgeschlagenes Speichern verhindern die Übernahme. Nicht abgeschlossene Entwürfe sind absichtlich nur im aktuellen Tab; Neuladen fragt vor dem Verwerfen nach.

Geldvorgänge haben Kategorie, Betrag und optionale Beschreibung. Käufe, vereinbarte Preise, kostenlose Beute, Verkäufe, Verbrauch und Verlust verwenden das bestehende Inventar. Ein Verkauf benötigt einen vereinbarten Erlös; bloßes Entfernen oder Verbrauch erstattet nichts. Angebrochene Munitionspackungen speichern nur den Verbrauchsrest, nicht einen zweiten vollständigen Munitionsbestand. Waffenaufsätze nutzen die vorhandenen Kompatibilitäts- und Montageplatzprüfungen. Geldkorrekturen gleichen die bisherigen Erstellungsbuchwerte aus, damit tatsächliche Transaktionen einmal wirken; bereits vorher gekaufte/implantierte Dinge sind im Ausgangskontostand enthalten.

IP-Steigerungen ändern die vorhandenen Fertigkeitsränge. Kosten: pro Zielrang 20 IP, bei ×2-Fertigkeiten 40 IP und beim Rollenrang 60 IP; jeder Zwischenrang wird bezahlt, maximal Rang 10. Mehrere Steigerungen derselben Fertigkeit oder Rolle erfordern bestätigte Zeit auf den Zwischenrängen. Normale Attribute sind nicht mit IP steigerbar. Rollenrang und Unterfähigkeitsbudgets sind für alle Rollen dynamisch. Tech: je Rang zwei verschiedene Fachgebiete; Medtech maximal fünf Punkte je Fachgebiet und Chirurgie maximal Rang 10. Solo-Punkte können ohne IP neu verteilt werden. Nach dem ersten Abschluss zeigen die Erstellungsseiten die fortgeschriebenen Werte, Änderungen erfolgen über Schritt 8.

Der vorhandene Cyberware-Konfigurator ist in den Report eingebettet. Besitz, Einbau, Ausbau und Abgang sind getrennt; eigene Teile werden beim Einbau nicht erneut gekauft. Neue Session-Einbauten benötigen den eingetragenen Würfelverlust, der gegen die möglichen Würfelgrenzen des Katalogs geprüft wird. Regulärer Wiedereinbau verursacht erneut HL laut offizieller FAQ S. 6; Ausnahmen wie Quick Change Mount/Chipware werden für nicht im Katalog enthaltene Systeme nicht pauschal angenommen. Ausbau heilt keinen früheren Verlust. Reparaturen setzen keine neuen Einbauverluste an; als beschädigt markierte Implantate und ihre abhängigen Optionen liefern keine aktiven Boni. Individuelle Tech-Upgrades bleiben bestätigte Beschreibungen ohne erfundene automatische Regelboni.

Therapie führt tatsächliche Wiederherstellung bis zum aktuellen Maximum, Zeit, Kosten und Erfolg getrennt. Standard: sieben Tage, 500 eb, 2W6; intensiv: sieben Tage, 1.000 eb, 4W6; Suchttherapie: sieben Tage, 1.000 eb, kein HUM-Gewinn. Gruppen-Medtech-Kosten werden explizit vereinbart. Überschüssige Wiederherstellung wird nicht für später gespeichert. Ereignisverluste benötigen eine Begründung und erscheinen als manuelle Einträge. Kritische Menschlichkeit warnt, bleibt aber erfassbar und verhindert bei Kampagnen nicht den aktualisierten PDF-Export.

TP, Stabilisierung, Ruhe und kritische Verletzungen werden getrennt geführt. Keine automatische Erholung bei Sessionwechsel. Ruhe benötigt Stabilisierung und volle Tage mit leichter Aktivität; Schnellheilung benötigt Medtech, nicht sterbenden Zustand und ist höchstens einmal je eingetragenem Spieldatum möglich. Manuelle Heilung sowie Behandlung/Entfernung von Verletzungen benötigen eine nachvollziehbare Bestätigung. Verletzungsspezifische Sonderabzüge und dauerhafte anatomische Folgen werden als Hinweise geführt und am Tisch angewendet; sie werden nicht ungeprüft in allgemeine Attributboni umgewandelt. Kopf- und Körperrüstung behalten ihren Schaden beim erneuten Anlegen; bestätigte Reparaturen korrigieren ihren SP.

Kontakte, Feinde, Ereignisse und Ziele liegen einmal in den Kampagnennotizen und werden im bestehenden Lebensweg abgeleitet ergänzt. Abgeschlossene Reports enthalten Datum/Nummer, Ausgangs- und Endwerte, kontrollierte Feldänderungen und Protokoll. Öffnen bucht nichts. Der letzte unveränderte Report kann mit Begründung durch einen neuen Korrekturbericht zurückgebucht werden; der Originalbericht bleibt erhalten. Pro Report und für den gesamten Charakter gibt es JSON-Export. Der bestehende vierseitige PDF-Export enthält die aktuellen Werte, IP/Ruf, Verletzungshinweise, Munition und den dynamischen Rollenrang.

Format 11 ergänzt Kampagnendaten; Format 10 und ältere Versionen werden mit bestehenden Backups übernommen. Alles bleibt lokal im Browser, ohne Serverkonto oder Speicherung in GitHub. Historien sind zum Schutz des Browsers begrenzt (200 Reports und 1,5 MB); bei Überschreitung oder Speicherknappheit gibt es einen Fehler statt stillen Datenverlusts. Wichtige Charaktere und Reports als JSON sichern.


### Alltag, Kleidung und vereinfachte Erstellung

Empfehlungen haben direkte Minus-/Plus-Schalter. Die erste Änderung übernimmt die empfohlenen Werte als eigene Punkteverteilung. Sprache und Heimat stehen als Pflichtblock vor dem Fertigkeitsbudget. Acht gängige Sprachen plus eigene Namen, eine schematische Night-City-Karte mit Hervorhebung bei Mauszeiger und Tastaturfokus sowie kurze Verwendungsbeschreibungen erleichtern die Auswahl.

Unter Normale Kleidung stehen 49 Teile in sieben Stilgruppen. Kleidung und Mode-Cyberware teilen den Fashion-Zuschuss; Überschüsse belasten das Hauptbudget. Kleidung schützt nicht als Rüstung. Die normalen Cyberware-Käufe werden mit einem Klick gekauft und eingebaut, einschließlich angezeigter benötigter Basisimplantate. Die Körperansicht bleibt optional. Medizinischer Ausbau und Kampagnen-Einbau mit gewürfeltem Menschlichkeitsverlust bleiben getrennte Vorgänge. Netrunner-Ausstattung wird für andere Rollen ausgeblendet. Ohne Zweihandwaffe sind drei Einhandwaffen erlaubt, sonst zwei plus eine Zweihandwaffe; maximal drei Granaten bleiben bestehen.

Die Fragen zum aktuellen Leben erfassen Sicherheit, Wohnen, Alltag im Viertel, Lebensstil und persönliche Verpflichtungen. Je Frage stehen mehrere Vorschläge sowie eine eigene Idee mit Monatsbetrag zur Wahl. Miete und Lebensstil werden zur monatlichen Gesamtsumme addiert, nicht automatisch vom Startkapital abgebucht. Alte Charaktere erhalten offene Zusatzfragen; bestehende Antworten bleiben erhalten. Auch Kampagnencharaktere können den erzählerischen Lebensweg ergänzen. Das PDF übernimmt Kleidung und Mode-Cyberware in Mode, außerdem Unterkunft, Miete und Lebensstil in die vorgesehenen Felder.

Schritt 8 bleibt verborgen, bis unter Überprüfung auf Session 1 überstanden geklickt wird. Diese Freischaltung wird pro Charakter gespeichert und bucht noch keinen Report. Preisreferenz: RTG Night Market Index v1.24, Kleidung S. 31–34 und Lebensstil/Unterkunft S. 44 (Grundregelwerk S. 356, 377–379). Kartenorientierung: RTG Night City Atlas; eigene schematische Darstellung ohne maßstabsgetreue Grenzen.


### Cyberware: Seitenwahl und kostenlose Korrektur vor der ersten Session

Der Biomonitor ist auf ein Exemplar begrenzt. Zusätzliche Käufe und Installationsentwürfe werden abgewiesen. Vorhandene Mehrfacheinbauten bleiben beim Laden erhalten und werden zur manuellen Korrektur markiert, ohne die Effekte anderer Implantate zu deaktivieren. Andere bewusst mehrfach installierbare Fashionware bleibt unverändert.

Vor „Session 1 überstanden“ können Cyberware-Käufe kostenlos rückgängig gemacht werden: Hauptbudget/Fashion-Zuschuss, Menschlichkeit und Kapazitäten werden zurückgerechnet; es entsteht kein Ausbauhistorieneintrag. Einzelne Optionen werden direkt entfernt, Basisimplantate mit abhängigen Optionen erst nach einer gemeinsamen Auflistung und Bestätigung. Nach Freischaltung oder vorhandenem Kampagnenfortschritt gelten weiterhin die medizinischen Ausbauvorgänge ohne Kaufpreiserstattung.

Augen, Arme und Beine öffnen beim Kauf eine Seitenwahl. Links und rechts zeigen bestehende Implantate, freie Plätze, erforderliche Basisimplantate und den jeweiligen Gesamtpreis. Die ausdrücklich gewählte Seite wird strikt eingehalten. Abbrechen kauft nichts. Das Menü wird auch beim Session-Einbau verwendet, dort bleibt der Einbau zunächst ein Entwurf mit gewürfeltem Menschlichkeitsverlust.


### Erweiterte Garderobe

Alle sieben Kleidungsstile haben jetzt jeweils 14 Teile (98 insgesamt). 49 zusätzliche eigene Rollenspiel-Varianten beschreiben Materialien, Schnitte, Farben, persönliche Erinnerungen und Details ohne neue Spielboni. Ihre Preise orientieren sich am Stil; die Oberfläche unterscheidet diese Preisorientierung von offiziellen Grundpreisen einmal gemeinsam. Vorhandene Grundteile haben ergänzende Beschreibungen. IDs und Preise bisheriger Käufe bleiben erhalten.

Jedes Katalog-Kleidungsstück lässt sich nur einmal besitzen/kaufen. Die Schaltfläche zeigt bei vorhandenen Teilen Bereits im Kleiderschrank und ist gesperrt; dieselbe Sperre gilt in buyEquipment und damit auch bei Session-Käufen/Beute. Entfernen gibt den Kauf wieder frei. Alte Mehrfachkäufe werden nicht automatisch gelöscht; Einzelexemplare lassen sich wie bisher entfernen. Der gemeinsame Fashion-Zuschuss und die PDF-Übernahme bleiben bestehen.


### Lebensweg: Flair und aktuelles Monatsbudget

Der Lebensweg trennt 14 reine Hintergrund-/Persönlichkeitsfragen und sieben Fragen zum aktuellen Leben: Sicherheit, Wohnen, Alltag im Viertel, Lebensstil, finanzielle Verantwortung, alte Verpflichtungen/Einnahmen und persönliche Ausgaben. Die vom Projektinhaber vorgegebenen Antworten und Monatsbeträge sind übernommen; je Frage gibt es vier bis neun Vorschläge plus eigene Idee. Die sequentielle Frageführung und Zusammenfassung bleiben bestehen. Sprache und Heimat werden weiterhin ausschließlich bei den Fertigkeiten erfasst.

Nullkosten sind ausdrücklich möglich. Regelmäßige Einnahmen reduzieren die monatlichen Gesamtkosten; Ausgaben und Einnahmen werden getrennt ausgewiesen. Lebensstil umfasst den gesamten Alltag, nicht nur Essen. Alle ersten Vorschläge ergeben zusammen 100 eb Monatskosten. Das ist eine Budgetübersicht, keine automatische Abbuchung vom Startkapital oder Charakterkonto. Die eigenen Monatsbeträge bleiben anpassbar; bestehende Möglichkeiten für eigene negative Beträge bleiben erhalten.

Gespeicherte ältere Budgetantworten werden anhand ihrer bisherigen Fragen/Optionen gelesen und mit dem ursprünglichen Text und Betrag als eigene Antworten erhalten. Die frühere Viertel-Frage wird unter „Alltag im Viertel“ übernommen; die Sicherheitsfrage ist neu und zunächst offen. Eine kleine Versionskennung pro Budgetantwort verhindert erneutes Umdeuten beim nächsten Laden. Neue Auswahlpositionen bis zur neunten Antwort werden pro Frage validiert; Flair-Fragen behalten vier Vorschläge.

Das PDF nennt Netto-Monatsbelastung und einzelne zusätzliche Verpflichtungen/Einnahmen. Bei vielen Kleidungsstücken bleibt Mode mit einer kompakten Stilübersicht lesbar, die vollständigen Einträge stehen weiter im Inventar und in den bearbeitbaren Formularwerten.

### Straßendrogen: Kauf und Vorrat

Ausstattung → Straßendrogen enthält die 18 gewünschten offiziellen RED-Drogen, alphabetisch mit Preis-/Quellen-/Wirkungsfilter. Aufklappbare Karten erklären Primärwirkung, Sekundärwirkung, Dauer, Widerstands-SG, Abhängigkeit und Regelquelle. Die Preise sind mit dem offiziellen RTG Night Market Index v1.24 abgeglichen; Gewichte werden nicht erfunden. Airhypo (50 eb, Grundregelwerk S. 352) ist als normale Ausrüstung zusätzlich kaufbar, auch direkt vom Drogenmenü aus.

Die Spielleitung verwaltet Wirkungen, Dauer, Widerstandsproben und Sucht. Es gibt keine automatische Drogen-Engine oder Änderungen an Attributen/Fertigkeiten. „1 Dosis verwendet“ streicht lediglich eine Inventareinheit, für Eigengebrauch oder Verabreichen an Gegner; der Kaufpreis bleibt ausgegeben. „Kauf rückgängig“ korrigiert wie bisher nur noch vorhandene Startkäufe. Käufe und Restmengen nutzen die bestehende Speicherung und PDF-Inventarliste. Nachkäufe beim Kampagnencharakter erfolgen wie andere Ausrüstung im Session-Bericht.

Regelquellen: Cyberpunk RED Grundregelwerk S. 227–229/357–358; Hornet’s Pharmacy v1.11 S. 2–3; Black Chrome+ v1.21; Jumpstart Kit Conversion Guide v1.1 S. 4; Interface RED Vol. 5 v1.1 S. 127–129, Red Lace und Mortalis zusätzlich im offiziellen DLC Seeing Double S. 7–8. Links stehen direkt an den Karten. Gegen unwillige Ziele beschreibt das Menü den Airhypo-Nahkampfangriff laut Grundregelwerk S. 227; keine automatische Gegner- oder Kampfverwaltung.
