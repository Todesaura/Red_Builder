export function netrunnerGuide(data){
  const rank=data.rank,actions=rank<=3?2:rank<=6?3:rank<=9?4:5;
  return [
    ['1 / WAS IST EINE NETZ-AKTION?',[
      'Du bewegst deinen Körper weiterhin in der realen Welt. Gleichzeitig bedienst du mit deinem Cyberdeck eine örtliche digitale Anlage: die Netz-Architektur. Stelle sie dir als Gebäude mit Stockwerken, verschlossenen Türen, Dateien und Schutzprogrammen vor.',
      `Eine Netz-Aktion ist eine einzelne digitale Handlung, etwa einloggen, eine Sperre überwinden oder mit einem Programm angreifen. Mit deiner Rollenfähigkeit Schnittstelle auf Rang ${rank} hast du ${actions} Netz-Aktionen pro eigenem Zug.`,
      `Du wählst je Zug entweder ${actions} Netz-Aktionen ODER eine normale körperliche Aktion, zum Beispiel mit einer Pistole schießen. Du kannst diese beiden Möglichkeiten nicht mischen. Deine Bewegungsaktion bleibt in beiden Fällen erhalten. Nicht verbrauchte Netz-Aktionen werden nicht angespart.`
    ]],
    ['2 / VERBINDEN UND VORRÜCKEN',[
      'Vorher: Neuralimplantat und Schnittstellenbuchsen verbinden dich mit dem Cyberdeck. Lade passende Programme und Erweiterungen in dessen Optionsplätze. Kaufen allein bedeutet nicht, dass ein Programm installiert oder aktiv ist.',
      'Bleibe höchstens 6 m vom Zugangspunkt entfernt; ein Reichweitenverstärker erlaubt 8 m. Wände blockieren die Verbindung. Eine Netzsicht-Brille zeigt dir die digitale Anlage über deiner Umgebung. Ohne Netzsicht bist du für die Außenwelt während des Einsatzes effektiv bewusstlos.',
      'Einloggen kostet 1 Netz-Aktion. Danach darfst du beliebig viele freie Stockwerke durchqueren, aber keine verschlossene Sperre überspringen. Diese digitale Bewegung kostet keine Netz-Aktion; sie ist nicht die Bewegung deines Körpers.',
      'Eine normale Netz-Probe ist Schnittstellenrang + 1W10 + passender aktiver Programmbonus. Du musst den Schwierigkeitsgrad übertreffen. Intelligenz, Reflexe und gewöhnliche Technikfertigkeiten werden nicht dazugezählt.'
    ]],
    ['3 / WAS KANN ICH DORT TUN?',[
      'Je 1 Netz-Aktion: mit Hintertür eine Passwortsperre öffnen; mit Wegfinder weitere Stockwerke erkunden; mit Identifizieren eine Datei untersuchen; einen Kontrollknoten übernehmen; ein Programm aktivieren oder deaktivieren; sicher ausloggen. Schwierigkeitsgrade bestimmt die Anlage.',
      'Entkommen: Schnittstelle + 1W10 gegen Wahrnehmung + 1W10 eines autonomen Schutzprogramms. Bei Erfolg entkommst du diesem auf ein benachbartes zugängliches Stockwerk. Nur einmal pro Zug versuchen.',
      'Ein Virus verändert die Anlage dauerhaft. Das geht erst im untersten Stockwerk; Wirkung, Schwierigkeit und nötige Zahl an Netz-Aktionen vereinbarst du mit der Spielleitung.',
      'Beispiel für 3 Netz-Aktionen: einloggen, mit Hintertür eine Sperre öffnen, ein Angriffsprogramm einsetzen. Jede Handlung verbraucht eine Aktion; weitere Stockwerke bleiben frei, solange nichts den Weg blockiert.'
    ]],
    ['4 / PROGRAMME IM NETZKAMPF',[
      `Ein Angriffsprogramm einzusetzen kostet 1 Netz-Aktion: Schnittstelle ${rank} + Angriffswert des Programms + 1W10. Gegen ein Programm verteidigt dessen Verteidigungswert + 1W10; ein gegnerischer Netrunner verteidigt mit seiner Schnittstelle + 1W10. Gleichstand gewinnt die Verteidigung.`,
      'Programme gegen Programme senken die Integrität des Zielprogramms; sie verletzen nicht den Körper. Programme gegen Personen können Hirnschaden direkt auf deren Trefferpunkte verursachen. Normale Panzerung schützt davor nicht. Reflexe und Ausweichen werden für Netz-Angriffe nicht verwendet.',
      'Stromstoß benötigt kein gekauftes Angriffsprogramm, kostet aber 1 Netz-Aktion: Schnittstelle + 1W10 gegen dieselbe passende Verteidigung. Treffer: 1W6 Integritätsschaden gegen Programme oder 1W6 Hirnschaden gegen Personen.',
      'Jede installierte Programmkopie darf nur einmal je Runde aktiviert werden. Angriffsprogramme schalten sich danach selbst aus. Verstärker und Verteidiger bleiben aktiv, bis sie abgeschaltet oder ausgeschaltet werden; beachte ihre Sonderregeln.',
      'Bei 0 Integrität ist ein Programm ausgeschaltet. Eine Netz-Aktion zum Deaktivieren und eine zum erneuten Aktivieren stellen es wieder her. Zerstört bedeutet dagegen: Die Kopie ist verloren und muss ersetzt werden.'
    ]],
    ['5 / AUTONOME SCHUTZPROGRAMME',[
      'Schwarzes ICE ist die Regelbezeichnung für selbstständig kämpfende Schutzprogramme. Jedes belegt 2 Deckplätze. Du aktivierst eigenes ICE mit 1 Netz-Aktion gegen ein zulässiges Ziel. Danach greift es in seinem eigenen Zug mit eigenem Angriffswert + 1W10 an; deinen Schnittstellenrang addierst du nicht.',
      'Triffst du auf wartendes feindliches ICE: Schnittstelle + aktiver Geschwindigkeitsbonus + 1W10 gegen dessen Geschwindigkeit + 1W10. Gewinnt das ICE, wirkt sein Angriff sofort. Danach handelt es an der Spitze der Initiative und verfolgt sein Ziel.',
      'Beende den Einsatz mit sicherem Ausloggen für 1 Netz-Aktion. Einfach Kabel trennen oder aus der Reichweite laufen ist unsicher: Noch aktive, bereits angetroffene feindliche Schutzprogramme wirken dabei gegen dich.'
    ]]
  ];
}
