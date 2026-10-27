// Original narrative prompts, not reproductions of official random tables.
export const LIFEPATH_GROUPS = [
  ['identity', 'Persönlichkeit & Stil'],
  ['past', 'Herkunft & Vergangenheit'],
  ['connections', 'Beziehungen & Zukunft']
];
export const LIFEPATH_QUESTIONS = [
  { id: 'personality', group: 'identity', title: 'Wie trittst du anderen gegenüber?', options: ['Ruhig und aufmerksam. Ich höre erst zu, bevor ich jemandem vertraue.', 'Direkt und selbstbewusst. Wenn etwas passieren soll, mache ich den ersten Schritt.'] },
  { id: 'appearance', group: 'identity', title: 'Was macht deinen Look aus?', options: ['Praktische Straßenkleidung mit sichtbaren Reparaturen und einem markanten Farbakzent.', 'Ein auffälliger, sorgfältig zusammengestellter Look mit Schmuck und leuchtenden Details.'] },
  { id: 'values', group: 'identity', title: 'Was ist dir am wichtigsten?', options: ['Loyalität. Wer zu meiner Crew gehört, wird nicht zurückgelassen.', 'Freiheit. Ich will selbst entscheiden, für wen und wofür ich arbeite.'] },
  { id: 'keepsake', group: 'identity', title: 'Welcher Gegenstand bedeutet dir viel?', options: ['Ein altes Erinnerungsstück von einem Menschen, der an mich geglaubt hat.', 'Mein erstes selbst repariertes Werkzeug oder Gerät. Es erinnert mich daran, was ich schaffen kann.'] },
  { id: 'roots', group: 'past', title: 'Wo liegen deine Wurzeln?', options: ['In einer engen Nachbarschaft in Night City, in der sich die Menschen gegenseitig durchbringen.', 'In einer Familie, die oft umziehen musste. Mein Zuhause waren eher Menschen als ein bestimmter Ort.'] },
  { id: 'family', group: 'past', title: 'Wie bist du aufgewachsen?', options: ['Mit wenig Geld, aber Menschen, die zusammenhielten und improvisieren konnten.', 'In einem streng geregelten Umfeld, in dem Leistung und Ansehen viel bedeuteten.'] },
  { id: 'turning-point', group: 'past', title: 'Welches Ereignis hat dein Leben verändert?', options: ['Wir verloren unser Zuhause. Seitdem verlasse ich mich lieber auf meine eigenen Fähigkeiten.', 'Ich half der falschen Person zur richtigen Zeit und geriet dadurch zum ersten Mal an einen gefährlichen Auftrag.'] },
  { id: 'career', group: 'past', title: 'Wie bist du zu deinem heutigen Beruf gekommen?', options: ['Eine erfahrene Person nahm mich unter ihre Fittiche und brachte mir das Handwerk bei.', 'Ich musste es mir selbst beibringen. Kleine Aufträge und einige Fehler waren meine Ausbildung.'] },
  { id: 'friend', group: 'connections', title: 'Auf wen kannst du dich verlassen?', options: ['Auf eine alte Freundschaft aus meiner Jugend. Wir haben schon schwierige Zeiten zusammen überstanden.', 'Auf jemanden aus einem früheren Auftrag. Wir schulden einander unser Leben und stellen nicht viele Fragen.'] },
  { id: 'enemy', group: 'connections', title: 'Wer macht dir das Leben schwer?', options: ['Ein früherer Auftraggeber, der behauptet, ich hätte ihn hintergangen.', 'Eine Person aus meinem alten Umfeld, die mir meinen heutigen Erfolg nicht gönnt.'] },
  { id: 'love', group: 'connections', title: 'Welche Rolle spielt Liebe in deinem Leben?', options: ['Eine frühere Beziehung ist ungeklärt. Wir haben uns getrennt, aber nicht alles ausgesprochen.', 'Im Moment suche ich keine Beziehung. Meine Crew und mein eigenes Leben haben Vorrang.'] },
  { id: 'reputation', group: 'connections', title: 'Wofür kennen dich die Leute?', options: ['Ich halte mein Wort und bringe einen übernommenen Auftrag zu Ende.', 'Ich finde ungewöhnliche Lösungen, auch wenn mein Plan zuerst verrückt klingt.'] },
  { id: 'goal', group: 'connections', title: 'Was willst du als Nächstes erreichen?', options: ['Genug Sicherheit und Geld aufbauen, damit meine Leute nicht mehr jeden Tag ums Überleben kämpfen müssen.', 'Die Wahrheit über einen alten Vorfall herausfinden und endlich mit meiner Vergangenheit abschließen.'] },
  { id: 'boundary', group: 'connections', title: 'Welche Grenze überschreitest du nicht?', options: ['Ich liefere niemanden aus meiner Crew aus, auch nicht für einen großen Zahltag.', 'Ich nehme keinen Auftrag an, bei dem Unbeteiligte absichtlich zu Schaden kommen sollen.'] }
];

// Additional original options preserve first/second IDs and existing characters.
const additionalOptions = {
 personality: ['Charmant und gesellig. Ich knüpfe schnell Kontakte und löse Spannungen mit Humor.', 'Misstrauisch und provokant. Ich teste die Grenzen anderer und halte meine Absichten verborgen.'],
 appearance: ['Schlichter Konzernlook ohne sichtbare Implantate. Ich möchte in der Menge verschwinden.', 'Robuste Nomadenkleidung mit Staubmantel und Familienabzeichen. Meine Herkunft darf jeder sehen.'],
 values: ['Wissen. Ich will Geheimnisse verstehen und der Stadt immer einen Schritt voraus sein.', 'Macht. Ich will selbst bestimmen, statt von den Entscheidungen anderer abhängig zu sein.'],
 keepsake: ['Eine verschlüsselte Aufnahme mit einer Wahrheit, die jemand um jeden Preis verbergen will.', 'Ein Glücksbringer aus meinem ersten großen Auftritt oder Wettkampf. Er steht für meinen Ehrgeiz.'],
 roots: ['In einer abgeschotteten Konzernenklave. Erst außerhalb ihrer Mauern lernte ich das wirkliche Night City kennen.', 'In einer ländlichen Siedlung weit weg von Night City. Die Großstadt ist für mich noch immer ein fremdes Labyrinth.'],
 family: ['In wechselnden Heimen und Pflegefamilien. Ich musste früh allein zurechtkommen.', 'In einer behüteten, wohlhabenden Familie. Den Kontakt zu meinem alten Leben halte ich heute bewusst auf Abstand.'],
 'turning-point': ['Eine öffentliche Niederlage machte mich zum Gespött. Ich arbeite daran, meinen Namen wiederherzustellen.', 'Ich entdeckte eine verborgene Begabung und bekam eine Chance, von der vorher niemand zu träumen wagte.'],
 career: ['Ein Konzern bildete mich gezielt aus. Meine Kenntnisse stammen aus Kursen, Prüfungen und kontrollierten Einsätzen.', 'Eine Krise zwang mich einzuspringen. Ich blieb bei diesem Beruf, weil andere sich auf mich verließen.'],
 friend: ['Auf eine medizinische Fachkraft, die mich einst versorgte. Wir tauschen seitdem Hilfe gegen Informationen.', 'Auf einen Fan, der meine Arbeit verehrt. Diese Person kennt mich kaum privat, steht aber entschlossen hinter mir.'],
 enemy: ['Ein Konzern-Ermittler verfolgt mich, weil ich ein für ihn gefährliches Geheimnis kenne.', 'Ein kompromissloser Aktivist hält meine Arbeit für Verrat an der Nachbarschaft und mobilisiert andere gegen mich.'],
 love: ['Ich führe eine feste Beziehung. Mein Gegenüber kennt die Risiken meines Lebens und verlangt Ehrlichkeit.', 'Ich trauere um eine verstorbene Partnerperson. Ein gemeinsames Versprechen bestimmt noch immer meine Entscheidungen.'],
 reputation: ['Man kennt mich für rücksichtslose Effizienz. Mein Erfolg verschafft mir Respekt, aber wenig Vertrauen.', 'Ich helfe Menschen, die niemand bezahlen kann. Dafür öffnet mir die Nachbarschaft Türen.'],
 goal: ['In meinem Fach zur anerkannten Nummer eins werden und einen bleibenden Namen hinterlassen.', 'Night City endgültig verlassen und an einem abgelegenen Ort ein ruhiges, selbstbestimmtes Leben beginnen.'],
 boundary: ['Ich vernichte kein Wissen und keine unwiederbringlichen Kunstwerke, selbst wenn ein Auftrag es verlangt.', 'Ich arbeite niemals für die Organisation, die meine Familie zerstört hat, egal welche Vorteile sie mir bietet.']
};
for (const question of LIFEPATH_QUESTIONS) question.options.push(...additionalOptions[question.id]);

LIFEPATH_GROUPS.push(['daily','Dein aktuelles Leben']);
// Monthly budgets supplied by the project owner; no automatic account deductions.
LIFEPATH_QUESTIONS.push(...[
  {
    "id": "security",
    "group": "daily",
    "budgetLabel": "Sicherheit",
    "title": "Wie sorgst du im Alltag für deine Sicherheit?",
    "monthlyCosts": [
      0,
      25,
      50,
      100,
      150,
      250
    ],
    "options": [
      "Ich verlasse mich auf meine Instinkte und passe selbst auf mich auf. 0 eb/Monat.",
      "Ich pflege gute Beziehungen zu meinen Nachbarn, damit wir aufeinander achten. 25 eb/Monat.",
      "Ich bezahle lokale Kontakte für Warnungen und Informationen. 50 eb/Monat.",
      "Ich nutze einfache Überwachungs- und Sicherheitssysteme. 100 eb/Monat.",
      "Ich zahle einer lokalen Gang für Schutz und Ruhe. 150 eb/Monat.",
      "Ich bezahle einen privaten Sicherheitsdienst für regelmäßige Kontrollen. 250 eb/Monat."
    ]
  },
  {
    "id": "housing",
    "group": "daily",
    "budgetLabel": "Wohnen",
    "title": "Wie wohnst du aktuell?",
    "monthlyCosts": [
      0,
      0,
      100,
      250,
      500,
      1000,
      1500,
      2500,
      0
    ],
    "options": [
      "Ich lebe auf der Straße. 0 eb/Monat.",
      "Ich schlafe in meinem eigenen Fahrzeug. 0 eb/Monat.",
      "Ich schlafe bei Freunden oder Bekannten auf der Couch. 100 eb/Monat.",
      "Ich teile mir eine einfache Unterkunft. 250 eb/Monat.",
      "Ich wohne in einem Kapselhotel. 500 eb/Monat.",
      "Ich wohne in einem Mietcontainer. 1.000 eb/Monat.",
      "Ich habe ein Studio-Apartment. 1.500 eb/Monat.",
      "Ich wohne in einer Zweizimmerwohnung. 2.500 eb/Monat.",
      "Meine Unterkunft wird von einer Organisation oder einem Arbeitgeber bezahlt. 0 eb/Monat."
    ]
  },
  {
    "id": "neighborhood",
    "group": "daily",
    "budgetLabel": "Alltag im Viertel",
    "title": "Wie kommst du in deinem Viertel zurecht?",
    "monthlyCosts": [
      0,
      50,
      100,
      150
    ],
    "options": [
      "Ich kenne die Straßen und brauche keine bezahlte Hilfe. 0 eb/Monat.",
      "Ich beteilige mich an einer Nachbarschaftsgemeinschaft. 50 eb/Monat.",
      "Ich nutze regelmäßig sichere Transportmöglichkeiten. 100 eb/Monat.",
      "Ich bezahle für zusätzlichen Schutz und Sicherheit. 150 eb/Monat."
    ]
  },
  {
    "id": "lifestyle",
    "group": "daily",
    "budgetLabel": "Lebensstil & Essen",
    "title": "Was isst du und wie lebst du im Alltag?",
    "monthlyCosts": [
      100,
      300,
      600,
      1500
    ],
    "options": [
      "Kibble – billige, industriell hergestellte Nahrung. 100 eb/Monat.",
      "Einfache Fertigkost – zweckmäßig und einigermaßen genießbar. 300 eb/Monat.",
      "Gute Fertigkost – abwechslungsreicher und angenehmer. 600 eb/Monat.",
      "Frische Lebensmittel – hochwertiges Essen und gehobener Alltag. 1.500 eb/Monat."
    ],
    "note": "Die Beträge repräsentieren den gesamten Lebensstil und nicht ausschließlich Lebensmittel."
  },
  {
    "id": "dependents",
    "group": "daily",
    "budgetLabel": "Angehörige & Unterhalt",
    "title": "Für wen trägst du finanziell Verantwortung?",
    "monthlyCosts": [
      0,
      50,
      100,
      150,
      250,
      400
    ],
    "options": [
      "Ich bin nur für mich selbst verantwortlich. 0 eb/Monat.",
      "Ich unterstütze gelegentlich Freunde oder Bekannte. 50 eb/Monat.",
      "Ich unterstütze meine Wahlfamilie. 100 eb/Monat.",
      "Ich unterstütze eine frühere Partnerperson. 150 eb/Monat.",
      "Ich komme für ein Kind auf. 250 eb/Monat.",
      "Ich unterstütze ein pflegebedürftiges Familienmitglied. 400 eb/Monat."
    ],
    "allowIncome": true
  },
  {
    "id": "commitments",
    "group": "daily",
    "budgetLabel": "Verpflichtungen & Einnahmen",
    "title": "Welche Verpflichtung oder Einnahme verbindet dich mit deinem alten Leben?",
    "monthlyCosts": [
      0,
      150,
      250,
      200,
      -200,
      -100
    ],
    "options": [
      "Ich habe keine alten finanziellen Verpflichtungen. 0 eb/Monat.",
      "Ich zahle eine alte Schuld ab. 150 eb/Monat.",
      "Ich begleiche eine frühere medizinische Rechnung. 250 eb/Monat.",
      "Ich bezahle jemanden, damit ein Geheimnis verborgen bleibt. 200 eb/Monat.",
      "Ich erhalte regelmäßige Zahlungen aus einer früheren Tätigkeit. −200 eb/Monat (Einnahme).",
      "Ein alter Kontakt lässt mir regelmäßig etwas Geld zukommen. −100 eb/Monat (Einnahme)."
    ],
    "allowIncome": true,
    "note": "Negative Werte sind Einnahmen und reduzieren die monatlichen Gesamtkosten."
  },
  {
    "id": "pastime",
    "group": "daily",
    "budgetLabel": "Persönliche Ausgaben",
    "title": "Wofür gibst du außerhalb deiner Arbeit regelmäßig Geld aus?",
    "monthlyCosts": [
      0,
      25,
      50,
      100,
      150,
      200
    ],
    "options": [
      "Ich lebe sparsam und verzichte auf unnötige Ausgaben. 0 eb/Monat.",
      "Ich kaufe gelegentlich kleine persönliche Dinge. 25 eb/Monat.",
      "Ich investiere in meine sozialen Kontakte. 50 eb/Monat.",
      "Ich pflege ein Hobby, das regelmäßig Geld kostet. 100 eb/Monat.",
      "Ich lege besonderen Wert auf Kleidung, Pflege und Auftreten. 150 eb/Monat.",
      "Ich gönne mir regelmäßig besondere Annehmlichkeiten. 200 eb/Monat."
    ],
    "allowIncome": true
  }
]);
export const DAILY_LIFEPATH_QUESTIONS=LIFEPATH_QUESTIONS.filter(q=>q.group==='daily');
