// Previous budget prompts are retained only to preserve saved answers during migration.
export const LEGACY_DAILY_QUESTIONS = [
  {
    "id": "residence",
    "group": "daily",
    "title": "Wo lebst du und was kostet dich der Alltag im Viertel zusätzlich?",
    "options": [
      "Watson Development – Pendelwege und ein Beitrag zur Haussicherheit. 250 eb/Monat zusätzlich zur Miete.",
      "Little China – tägliche Fahrten und Beiträge zur Nachbarschaftskasse. 350 eb/Monat zusätzlich zur Miete.",
      "The Glen – Wege durch die Stadt und ein gemieteter Gemeinschaftsraum. 450 eb/Monat zusätzlich zur Miete.",
      "South Night City – sichere Transportwege und ein Stellplatz nahe dem Zuhause. 500 eb/Monat zusätzlich zur Miete."
    ],
    "budgetLabel": "Viertel & Wege",
    "monthlyCosts": [
      250,
      350,
      450,
      500
    ]
  },
  {
    "id": "housing",
    "group": "daily",
    "title": "Wie wohnst du aktuell?",
    "monthlyCosts": [
      1000,
      500,
      1500,
      2500
    ],
    "options": [
      "Mietcontainer – ein abschließbares, enges Zuhause. 1.000 eb/Monat.",
      "Kapselhotel – eine Schlafkabine, Gemeinschaftsbad, wenig Privatsphäre. 500 eb/Monat.",
      "Studio-Apartment – mein eigener Raum mit Küche und Bad. 1.500 eb/Monat.",
      "Zweizimmerwohnung – Platz zum Wohnen und Arbeiten. 2.500 eb/Monat."
    ],
    "budgetLabel": "Miete"
  },
  {
    "id": "lifestyle",
    "group": "daily",
    "title": "Was isst du und wie lebst du im Alltag?",
    "monthlyCosts": [
      100,
      300,
      600,
      1500
    ],
    "options": [
      "Kibble – billige Nährstoffpellets, kaum Abwechslung. 100 eb/Monat.",
      "Einfache Fertigkost – abgepackte Mahlzeiten und günstiger Alltag. 300 eb/Monat.",
      "Gute Fertigkost – abwechslungsreiche Fertiggerichte und mehr Komfort. 600 eb/Monat.",
      "Frische Lebensmittel – richtige Zutaten und ein komfortabler Alltag. 1.500 eb/Monat."
    ],
    "budgetLabel": "Lebensstil & Essen"
  },
  {
    "id": "dependents",
    "group": "daily",
    "budgetLabel": "Angehörige & Unterhalt",
    "allowIncome": true,
    "title": "Für wen trägst du finanziell Verantwortung?",
    "monthlyCosts": [
      500,
      750,
      1000,
      400
    ],
    "options": [
      "Unterhalt für eine frühere Partnerperson – eine feste Vereinbarung hält euch weiterhin verbunden. 500 eb/Monat.",
      "Ein Kind – du beteiligst dich an Betreuung, Kleidung und Schule, auch wenn du oft unterwegs bist. 750 eb/Monat.",
      "Pflege eines Elternteils – Unterstützung und regelmäßige Betreuung brauchen viel Geld. 1.000 eb/Monat.",
      "Deine Wahlfamilie – du hilfst einem engen Freundeskreis bei Notfällen und offenen Rechnungen. 400 eb/Monat."
    ]
  },
  {
    "id": "commitments",
    "group": "daily",
    "budgetLabel": "Verträge & Verpflichtungen",
    "allowIncome": true,
    "title": "Welche Verpflichtung oder regelmäßige Einnahme verbindet dich mit deinem alten Leben?",
    "monthlyCosts": [
      500,
      750,
      -200,
      600
    ],
    "options": [
      "Alte Schulden – eine monatliche Rate hält den Gläubiger vorerst ruhig. 500 eb/Monat Ausgabe.",
      "Raten für eine frühere Klinikrechnung – die Behandlung ist längst vorbei, die Rechnung bleibt. 750 eb/Monat Ausgabe; kein neuer Therapieeffekt.",
      "Tantiemen aus einer alten Produktion – ein Song, Clip oder Entwurf bringt noch kleine Lizenzzahlungen. 200 eb/Monat Einnahme.",
      "Private Abmachungen – du bezahlst vertraute Leute für Botengänge und Unterstützung im Alltag. 600 eb/Monat Ausgabe; keine zusätzlichen Spielboni."
    ]
  },
  {
    "id": "pastime",
    "group": "daily",
    "budgetLabel": "Hobbys & Nebenverdienst",
    "allowIncome": true,
    "title": "Womit füllst du dein Leben außerhalb der Aufträge?",
    "monthlyCosts": [
      350,
      500,
      800,
      -150
    ],
    "options": [
      "Eigene Werkbank – Material, Werkstattanteil und kleine Projekte verschlingen dein Restgeld. 350 eb/Monat zusätzlich zum Lebensstil.",
      "Clubs und Konzerte – Eintritt, besondere Nächte und deine Szene lassen dich den Job vergessen. 500 eb/Monat zusätzlich zum Lebensstil.",
      "Ein altes Restaurierungsprojekt – Teile, Garagenanteil und Rückschläge sind teuer. 800 eb/Monat zusätzlich zum Lebensstil; kein kostenloses Fahrzeug.",
      "Kleine bezahlte Auftritte – an wenigen freien Abenden spielst, unterrichtest oder gestaltest du für Stammkunden. 150 eb/Monat Einnahme nach Kosten, mit der Spielleitung vereinbaren."
    ]
  }
];
