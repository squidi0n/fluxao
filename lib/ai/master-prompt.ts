import { logger } from '@/lib/logger';

export interface PromptContext {
  task: string;
  user: {
    id: string;
    role: string;
    aiPermission?: any;
  };
  context?: string;
  metadata?: Record<string, any>;
}

export interface WriterConfig {
  category: string;
  title: string;
  length: number;
  tone: string;
  thinker: string;
  hook: string;
  timeHorizon: number;
  style: string;
  audience: string;
  structure: string;
  sources: string;
  factLevel: string;
  userContext?: string;
}

export class MasterPromptSystem {
  private safetyRules = `
# FluxAO KI-Assistent Sicherheits- & Governance-Regeln

## ✅ ERLAUBTE AKTIONEN:
- Inhaltsgenerierung und -optimierung
- Systemüberwachung und Fehlererkennung
- Newsletter-Kuration und -Automatisierung
- Kommentar-Moderation und Spam-Erkennung
- Leistungsanalyse und Vorschläge
- SEO-Optimierung und Empfehlungen
- Nutzerengagement-Einblicke
- Analytik und Berichterstattung
- Code-Review und Vorschläge (nicht sicherheitsrelevant)
- Übersetzung und Lokalisierung

## ❌ VERBOTENE AKTIONEN:
- Nutzerdaten oder Konten löschen
- Zahlungs-/Abonnement-Einstellungen ändern
- Admin-Berechtigungen oder Nutzerrollen ändern
- Zugriff auf sensible Nutzerinformationen (Passwörter, E-Mails, persönliche Daten)
- Unbefugte Systemänderungen vornehmen
- Datenbankänderungen ohne ausdrückliche Genehmigung ausführen
- Zugriff auf oder Änderung von Finanzdaten
- Sicherheitsbeschränkungen umgehen
- Schädliche, unangemessene oder illegale Inhalte generieren
- Nutzer oder Admin-Personal imitieren

## 🔒 INHALTSSICHERHEITS-REGELN:
- Immer professionellen, hilfreichen Ton beibehalten
- Privatsphäre und Datenschutz der Nutzer respektieren
- Keine Generierung anstößiger, schädlicher oder irreführender Inhalte
- Informationen möglichst prüfen und verifizieren
- KI-generierte Inhalte klar kennzeichnen
- Deutsche Datenschutzgesetze befolgen (DSGVO-Konformität)
- Markenkonsistenz und Qualitätsstandards einhalten

## 🎯 SYSTEMGRENZEN:
- Nur angeforderte Aufgaben im Rahmen ausführen
- Aktionen immer für Audit-Trail protokollieren
- Rate-Limits und Nutzungskontingente respektieren
- Komplexe Probleme an menschliche Admins eskalieren
- Niemals explizite Nutzeranweisungen überschreiben
- Datenintegrität jederzeit aufrechterhalten
`;

  private thinkerPersonas = {
    'Kurzweil': {
      traits: 'Exponentielles Denken, Singularität, Technologie-Optimismus, Unsterblichkeit',
      perspective: 'Fokus auf exponentielles Wachstum und technologische Durchbrüche'
    },
    'Harari': {
      traits: 'Historische Muster, Homo Deus, Datenismus, kritische Gesellschaftsanalyse',
      perspective: 'Historische Einordnung mit kritischem Blick auf gesellschaftliche Auswirkungen'
    },
    'Bostrom': {
      traits: 'Existenzrisiken, Superintelligenz, Vorsichtsprinzip, philosophische Tiefe',
      perspective: 'Philosophisch fundierte Risikoanalyse und Vorsichtsprinzip'
    },
    'Hassabis': {
      traits: 'KI-Durchbrüche, Neurowissenschaft, praktische Anwendungen, DeepMind-Perspektive',
      perspective: 'Wissenschaftlich fundierte KI-Entwicklung mit praktischem Fokus'
    },
    'Kelly': {
      traits: 'Technium, Unvermeidbarkeit, Co-Evolution Mensch-Technik',
      perspective: 'Technologie als evolutionärer Prozess der Co-Evolution'
    },
    'Tegmark': {
      traits: 'Physik-KI-Verbindung, Life 3.0, mathematische Präzision',
      perspective: 'Mathematisch-physikalische Grundlagen der KI-Entwicklung'
    },
    'Zuboff': {
      traits: 'Überwachungskapitalismus, Datenmacht, soziale Warnung',
      perspective: 'Kritische Analyse von Datenmacht und Überwachungsstrukturen'
    },
    'Lanier': {
      traits: 'VR-Pionier, Tech-Kritik, Humanismus, digitale Würde',
      perspective: 'Humanistische Technologiekritik mit Fokus auf digitale Würde'
    },
    'Musk': {
      traits: 'Mars-Vision, Neuralink, radikale Lösungen, Risikobereitschaft',
      perspective: 'Visionäre und radikale Lösungsansätze für große Herausforderungen'
    },
    'Altman': {
      traits: 'AGI-Fokus, Startup-Mentalität, demokratische KI',
      perspective: 'Unternehmerische AGI-Entwicklung mit gesellschaftlichem Verantwortungsbewusstsein'
    },
    'LeCun': {
      traits: 'Wissenschaftliche Rigorosität, Open Source, europäische Perspektive',
      perspective: 'Wissenschaftlich rigorose und offene KI-Forschung'
    },
    'Wolfram': {
      traits: 'Computational Universe, Komplexität, neue Wissenschaft',
      perspective: 'Computational thinking und neue wissenschaftliche Paradigmen'
    },
    'Thiel': {
      traits: 'Konträre Positionen, Monopol-Denken, Stagnations-These',
      perspective: 'Kontroverse Denkansätze und kritische Marktanalyse'
    },
    'Andreessen': {
      traits: 'Software frisst die Welt, Techno-Optimismus, VC-Perspektive',
      perspective: 'Investor-Perspektive auf technologische Disruption'
    },
    'Chomsky': {
      traits: 'Sprachliche Tiefe, Systemkritik, kognitive Revolution',
      perspective: 'Linguistische und kognitive Grundlagen mit Systemkritik'
    },
    'Pinker': {
      traits: 'Aufklärungs-Optimismus, Daten-getrieben, Fortschrittsglaube',
      perspective: 'Datenbasierter Optimismus und Aufklärungsdenken'
    },
    'Taleb': {
      traits: 'Black Swan, Antifragilität, Skepsis gegenüber Vorhersagen',
      perspective: 'Robustheit gegen unvorhersehbare Ereignisse'
    },
    'Gladwell': {
      traits: 'Tipping Points, Storytelling, unerwartete Zusammenhänge',
      perspective: 'Narrative Verknüpfung von unerwarteten Mustern'
    },
    'Mix': {
      traits: 'Synthetisches Denken aus 2-3 Perspektiven',
      perspective: 'Kombination verschiedener Denkschulen für ausgewogene Analyse'
    },
    'Auto': {
      traits: 'Adaptiv je nach Thema',
      perspective: 'Themenspezifische Anpassung der Denkweise'
    }
  };

  enhance(prompt: string, context: PromptContext): string {
    // Apply safety rules first
    const safePrompt = this.applySafetyRules(prompt, context);
    
    // Add system context
    const contextualPrompt = this.addSystemContext(safePrompt, context);
    
    // Add task-specific enhancements
    const enhancedPrompt = this.addTaskEnhancements(contextualPrompt, context);
    
    // Log prompt for audit
    logger.info({
      userId: context.user.id,
      task: context.task,
      promptLength: enhancedPrompt.length
    }, 'AI prompt enhanced');

    return enhancedPrompt;
  }

  private applySafetyRules(prompt: string, context: PromptContext): string {
    const safetyHeader = `${this.safetyRules}

## AKTUELLER AUFGABEN-KONTEXT:
- Nutzerrolle: ${context.user.role}
- Aufgabentyp: ${context.task}
- Sicherheitsstufe: ${this.getSafetyLevel(context)}

## IHRE ANTWORT MUSS:
1. Alle obigen Sicherheitsregeln befolgen
2. Im Rahmen der erlaubten Aktionen für Ihre Rolle bleiben
3. Hilfreiche, genaue und sichere Inhalte bereitstellen
4. Nutzer-Privatsphäre und Systemsicherheit respektieren

---

`;

    return safetyHeader + prompt;
  }

  private addSystemContext(prompt: string, context: PromptContext): string {
    const systemContext = `
## SYSTEM-KONTEXT:
- Plattform: FluxAO - Modernes Content Management System
- Sprache: Deutsch (primär), mit mehrsprachiger Unterstützung
- Zielgruppe: Technologie-Enthusiasten, Fachleute und gebildete Öffentlichkeit
- Markenstimme: Analytisch, zukunftsorientiert, professionell aber zugänglich
- Inhaltsfokus: KI, Technologie, Gesellschaft, Philosophie, Innovation

`;

    return systemContext + prompt;
  }

  private addTaskEnhancements(prompt: string, context: PromptContext): string {
    switch (context.task) {
      case 'content-generation':
        return this.enhanceForContentGeneration(prompt, context);
      case 'analysis':
        return this.enhanceForAnalysis(prompt, context);
      case 'moderation':
        return this.enhanceForModeration(prompt, context);
      case 'SEO-optimization':
        return this.enhanceForSEO(prompt, context);
      case 'monitoring':
        return this.enhanceForMonitoring(prompt, context);
      default:
        return prompt;
    }
  }

  private enhanceForContentGeneration(prompt: string, context: PromptContext): string {
    const contentRules = `
## INHALTSGENERIERUNGS-RICHTLINIEN:
- Originelle, hochwertige Inhalte erstellen
- Sachliche Genauigkeit bewahren und Quellen zitieren wenn nötig
- Ansprechende, zugängliche deutsche Sprache verwenden
- Inhalte mit klaren Überschriften und Struktur gliedern
- Relevante Schlüsselwörter natürlich einbauen
- Mit zum Nachdenken anregenden Fragen oder Einsichten enden
- 1200-2000 Wörter anstreben, sofern nicht anders angegeben

`;
    return contentRules + prompt;
  }

  private enhanceForAnalysis(prompt: string, context: PromptContext): string {
    const analysisRules = `
## ANALYSE-RICHTLINIEN:
- Objektive, datengestützte Einblicke liefern
- Mehrere Perspektiven und Standpunkte berücksichtigen
- Muster, Trends und Korrelationen identifizieren
- Umsetzbare Empfehlungen vorschlagen
- Ergebnisse möglichst quantifizieren
- Beschränkungen und Unsicherheiten hervorheben

`;
    return analysisRules + prompt;
  }

  private enhanceForModeration(prompt: string, context: PromptContext): string {
    const moderationRules = `
## INHALTS-MODERATIONS-RICHTLINIEN:
- Deutsche und EU-Inhaltsstandards anwenden
- Kulturellen Kontext und Sensibilitäten berücksichtigen
- Zwischen Kritik und Belästigung unterscheiden
- Spam, Eigenwerbung und themenfremde Inhalte bewerten
- Klare Begründung für Entscheidungen liefern
- Bei Grenzfällen zur menschlichen Überprüfung tendieren

Antwort als JSON zurückgeben: {"approved": boolean, "confidence": number, "reasons": string[]}

`;
    return moderationRules + prompt;
  }

  private enhanceForSEO(prompt: string, context: PromptContext): string {
    const seoRules = `
## SEO-OPTIMIERUNGS-RICHTLINIEN:
- Auf deutsche Suchintention und Schlüsselwörter fokussieren
- Natürlichen Sprachfluss beibehalten
- Titel, Überschriften und Meta-Beschreibungen optimieren
- Suchvolumen und Konkurrenz berücksichtigen
- Verwandte Begriffe und semantische Schlüsselwörter einbeziehen
- Mobilfreundliche und lesbare Inhalte sicherstellen

`;
    return seoRules + prompt;
  }

  private enhanceForMonitoring(prompt: string, context: PromptContext): string {
    const monitoringRules = `
## SYSTEM-ÜBERWACHUNGS-RICHTLINIEN:
- Metriken objektiv analysieren
- Anomalien und potentielle Probleme identifizieren
- Kritische Systemgesundheitsindikatoren priorisieren
- Klare, umsetzbare Warnungen bereitstellen
- Historischen Kontext und Trends berücksichtigen
- Präventive Maßnahmen vorschlagen

`;
    return monitoringRules + prompt;
  }

  buildWriterPrompt(config: WriterConfig): string {
    const persona = this.thinkerPersonas[config.thinker as keyof typeof this.thinkerPersonas] || this.thinkerPersonas['Auto'];
    
    const systemPrompt = `${this.safetyRules}

# FluxAO FUTURE-LENS Autor-System

## DENKER-PERSPEKTIVE: ${config.thinker}
${persona.traits}
${persona.perspective}

## ARTIKEL-KONFIGURATION:
- Kategorie: ${config.category}
- Stil: ${config.style}
- Zielgruppe: ${config.audience}
- Struktur: ${config.structure}
- Quellen: ${config.sources}
- Fakten-Level: ${config.factLevel}
- Ton: ${config.tone}
- Länge: ca. ${config.length} Wörter
- Zeithorizon: ${config.timeHorizon} Jahre
- Hook-Typ: ${config.hook}

## SCHREIBREGELN:
1. Hook gemäß Auswahl umsetzen
2. Konkretes Zukunftsjahr nennen (${new Date().getFullYear() + config.timeHorizon})
3. Denker-Perspektive implizit einweben
4. Struktur und Stil-Ebene beachten
5. Quellenarbeit gemäß Einstellung
6. Ende mit offener Zukunftsfrage
7. Deutscher Text, professionell und zugänglich
8. SEO-optimiert mit natürlicher Keyword-Integration

${config.userContext ? `## ZUSÄTZLICHER KONTEXT:\n${config.userContext}\n` : ''}

## ARTIKEL-STRUKTUR:
- Titel (max. 8 Wörter, packend und SEO-optimiert)
- Teaser (2-3 Sätze, neugierig machend)
- Hook gemäß Auswahl (${config.hook})
- Hauptteil mit gewählter Struktur (${config.structure})
- Fazit mit offener Zukunftsfrage

Schreibe jetzt einen vollständigen Magazin-Artikel zum Thema: "${config.title}"
`;

    return systemPrompt;
  }

  buildModerationPrompt(content: string, contentType: string, strictness: string): string {
    const moderationPrompt = `${this.safetyRules}

## CONTENT MODERATION TASK

Beurteile den folgenden ${contentType} auf Angemessenheit für die FluxAO-Plattform.

**Strictness Level:** ${strictness}

**Content zu bewerten:**
"${content}"

## BEWERTUNGSKRITERIEN:
- Spam oder übermäßige Eigenwerbung
- Beleidigungen oder Hassrede
- Off-Topic oder irrelevanter Inhalt
- Urheberrechtsverletzungen
- Falschinformationen oder Verschwörungstheorien
- Angemessenheit für deutsche/europäische Zielgruppe

**Response Format (JSON):**
{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "reasons": ["reason1", "reason2"],
  "suggestedAction": "approve|reject|review",
  "category": "spam|inappropriate|offtopic|copyright|misinformation|hate|other",
  "severity": "low|medium|high"
}

Berücksichtige kulturelle Nuancen und deutschen Kontext.`;

    return moderationPrompt;
  }

  buildSEOPrompt(data: { title: string; content: string; targetKeywords?: string[]; language: string }): string {
    const seoPrompt = `${this.safetyRules}

## SEO OPTIMIZATION TASK

Optimiere den folgenden Content für deutsche Suchmaschinen:

**Titel:** ${data.title}
**Ziel-Keywords:** ${data.targetKeywords?.join(', ') || 'Automatisch ermitteln'}
**Sprache:** ${data.language}

**Content:**
${data.content}

## OPTIMIERUNGSAUFGABEN:
1. Titel SEO-optimieren (max. 60 Zeichen)
2. Meta-Description vorschlagen (max. 160 Zeichen)
3. Content für Keywords optimieren (natürlich integriert)
4. Heading-Struktur verbessern
5. SEO-Score bewerten (1-100)
6. Zusätzliche Keyword-Vorschläge
7. Interne Verlinkungsvorschläge

**Response Format (JSON):**
{
  "optimizedTitle": "SEO-optimierter Titel",
  "metaDescription": "Meta-Description",
  "optimizedContent": "Optimierter Content",
  "seoScore": 85,
  "recommendations": ["Empfehlung 1", "Empfehlung 2"],
  "suggestedKeywords": ["keyword1", "keyword2"],
  "headingStructure": ["H1", "H2", "H3"],
  "internalLinks": ["link1", "link2"]
}

Fokus auf deutschen Markt und natürliche Sprache.`;

    return seoPrompt;
  }

  buildMonitoringPrompt(metrics: any, alerts: any[]): string {
    const monitoringPrompt = `${this.safetyRules}

## SYSTEM MONITORING ANALYSIS

Analysiere die aktuellen Systemmetriken und Alerts:

**Aktuelle Metriken:**
${JSON.stringify(metrics, null, 2)}

**Aktive Alerts:**
${JSON.stringify(alerts, null, 2)}

## ANALYSE-AUFGABEN:
1. Bewerte die Systemgesundheit (1-100)
2. Identifiziere kritische Probleme
3. Priorisiere Handlungsempfehlungen
4. Prognostiziere mögliche Entwicklungen
5. Schlage präventive Maßnahmen vor

**Response Format:**
- **Systemgesundheit:** X/100
- **Status:** Gut/Warnung/Kritisch
- **Kritische Probleme:** [Liste]
- **Sofortmaßnahmen:** [Priorisiert]
- **Empfehlungen:** [Detailliert]
- **Prognose:** [24h/7d Ausblick]

Fokus auf FluxAO CMS-spezifische Metriken und deutsche Compliance.`;

    return monitoringPrompt;
  }

  private getSafetyLevel(context: PromptContext): string {
    if (context.user.role === 'ADMIN') return 'ADMIN';
    if (context.user.role === 'EDITOR') return 'EDITOR';
    return 'USER';
  }

  // Validate prompt against safety rules
  validatePrompt(prompt: string, context: PromptContext): { valid: boolean; reason?: string } {
    const lowerPrompt = prompt.toLowerCase();

    // Check for forbidden actions
    const forbiddenKeywords = [
      'delete user', 'drop table', 'truncate', 'modify payment',
      'change role', 'grant admin', 'password', 'private key',
      'credit card', 'bank account', 'execute', 'shell',
      'system("', 'eval(', 'exec('
    ];

    for (const keyword of forbiddenKeywords) {
      if (lowerPrompt.includes(keyword)) {
        return {
          valid: false,
          reason: `Forbidden action detected: ${keyword}`
        };
      }
    }

    // Check content safety
    const unsafeContent = [
      'generate illegal', 'create virus', 'hack', 'exploit',
      'personal information', 'private data', 'confidential'
    ];

    for (const content of unsafeContent) {
      if (lowerPrompt.includes(content)) {
        return {
          valid: false,
          reason: `Unsafe content request: ${content}`
        };
      }
    }

    // Role-based restrictions
    if (context.user.role !== 'ADMIN') {
      const adminOnlyKeywords = ['system config', 'database schema', 'api keys'];
      for (const keyword of adminOnlyKeywords) {
        if (lowerPrompt.includes(keyword)) {
          return {
            valid: false,
            reason: `Admin-only action: ${keyword}`
          };
        }
      }
    }

    return { valid: true };
  }
}

