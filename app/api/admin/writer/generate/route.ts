import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createProblemResponse, ForbiddenError, InternalServerError, BadRequestError } from '@/lib/errors';
import { can } from '@/lib/rbac';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';

// Initialize AI providers
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

const THINKER_PERSONAS = {
  'Kurzweil': 'Exponentielles Denken, Singularität, Technologie-Optimismus, Unsterblichkeit',
  'Harari': 'Historische Muster, Homo Deus, Datenismus, kritische Gesellschaftsanalyse',
  'Bostrom': 'Existenzrisiken, Superintelligenz, Vorsichtsprinzip, philosophische Tiefe',
  'Hassabis': 'KI-Durchbrüche, Neurowissenschaft, praktische Anwendungen, DeepMind-Perspektive',
  'Kelly': 'Technium, Unvermeidbarkeit, Co-Evolution Mensch-Technik',
  'Tegmark': 'Physik-KI-Verbindung, Life 3.0, mathematische Präzision',
  'Zuboff': 'Überwachungskapitalismus, Datenmacht, soziale Warnung',
  'Lanier': 'VR-Pionier, Tech-Kritik, Humanismus, digitale Würde',
  'Musk': 'Mars-Vision, Neuralink, radikale Lösungen, Risikobereitschaft',
  'Altman': 'AGI-Fokus, Startup-Mentalität, demokratische KI',
  'LeCun': 'Wissenschaftliche Rigorosität, Open Source, europäische Perspektive',
  'Wolfram': 'Computational Universe, Komplexität, neue Wissenschaft',
  'Thiel': 'Konträre Positionen, Monopol-Denken, Stagnations-These',
  'Andreessen': 'Software frisst die Welt, Techno-Optimismus, VC-Perspektive',
  'Chomsky': 'Sprachliche Tiefe, Systemkritik, kognitive Revolution',
  'Pinker': 'Aufklärungs-Optimismus, Daten-getrieben, Fortschrittsglaube',
  'Taleb': 'Black Swan, Antifragilität, Skepsis gegenüber Vorhersagen',
  'Gladwell': 'Tipping Points, Storytelling, unerwartete Zusammenhänge',
  'Mix': 'Synthetisches Denken aus 2-3 Perspektiven',
  'Auto': 'Adaptiv je nach Thema'
};

function buildSystemPrompt(style: string, audience: string, structure: string, sources: string, factLevel: string, thinker: string): string {
  const base = "# FluxAO FUTURE-LENS Writer System\\n\\n";
  const traits = THINKER_PERSONAS[thinker as keyof typeof THINKER_PERSONAS] || THINKER_PERSONAS['Auto'];
  
  return base + 
    `Rolle: Zukunftsdenker im Stil von ${thinker} (${traits})\\n` +
    `Stil-Ebene: ${style} für Zielgruppe: ${audience}\\n` +
    `Struktur: ${structure}\\n` +
    `Quellenarbeit: ${sources}\\n` +
    `Fakten-Level: ${factLevel}\\n\\n` +
    `Regeln:\\n` +
    `1) Hook gemäß Auswahl umsetzen\\n` +
    `2) Konkretes Jahr nennen (basierend auf Zeithorizont)\\n` +
    `3) Denker-Perspektive implizit einweben\\n` +
    `4) Struktur und Stil-Ebene beachten\\n` +
    `5) Quellenarbeit gemäß Einstellung\\n` +
    `6) Ende mit offener Zukunftsfrage\\n` +
    `7) Schreibe immer auf Deutsch\\n` +
    `8) Verwende Markdown-Formatierung\\n`;
}

function buildUserPrompt(params: any): string {
  const { category, title, tone, thinker, hook, time_horizon, length, style, audience, structure, user_context } = params;
  
  let prompt = `Kategorie: ${category}\\n`;
  prompt += `Thema/Titel: "${title}"\\n`;
  prompt += `Perspektive: ${tone}\\n`;
  prompt += `Denker-Fokus: ${thinker}\\n`;
  prompt += `Hook: ${hook}\\n`;
  prompt += `Zeitfenster: ${time_horizon} Jahre\\n`;
  prompt += `Länge: ca. ${length} Wörter\\n`;
  prompt += `Stil: ${style}\\n`;
  prompt += `Zielgruppe: ${audience}\\n`;
  prompt += `Struktur: ${structure}\\n\\n`;

  if (user_context) {
    prompt += `=== ZUSÄTZLICHER KONTEXT ===\\n`;
    prompt += `${user_context}\\n`;
    prompt += `=== ENDE KONTEXT ===\\n\\n`;
  }

  prompt += `Schreibe einen vollständigen Magazin-Artikel:\\n`;
  prompt += `- Titel (max. 8 Wörter, packend)\\n`;
  prompt += `- Teaser (2-3 Sätze, neugierig machend)\\n`;
  prompt += `- Hook gemäß Auswahl (${hook})\\n`;
  prompt += `- Hauptteil mit Struktur: ${structure}\\n`;
  prompt += `- Fazit mit offener Zukunftsfrage\\n`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await auth();
    if (!session?.user?.id || !can(session.user, 'create', 'posts')) {
      return createProblemResponse(new ForbiddenError('Insufficient permissions for Writer generation'));
    }

    const body = await request.json();
    const {
      provider,
      model,
      topic_id,
      title,
      category = 'KI & Tech',
      length = 1200,
      tone = 'analytisch-kühl',
      thinker = 'Auto',
      hook = 'Auto',
      time_horizon = 20,
      style = 'Magazin/Populär',
      audience = 'Gebildete Laien',
      structure = 'Klassisch',
      sources = 'Mit Quellenhinweisen',
      factlevel = 'Plausible Szenarien',
      user_context = ''
    } = body;

    // Validation
    if (!title) {
      return createProblemResponse(new BadRequestError('Title is required'));
    }

    if (!provider || !['openai', 'anthropic'].includes(provider)) {
      return createProblemResponse(new BadRequestError('Valid provider (openai/anthropic) is required'));
    }

    const systemPrompt = buildSystemPrompt(style, audience, structure, sources, factlevel, thinker);
    const userPrompt = buildUserPrompt(body);

    let content = '';
    let tokensUsed = 0;
    let responseTime = Date.now();

    try {
      if (provider === 'openai' && openai) {
        const maxTokens = Math.min(4000, Math.max(800, Math.floor(length * 2.5)));
        
        const completion = await openai.chat.completions.create({
          model: model || 'gpt-4o',
          temperature: 0.8,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        });

        content = completion.choices[0]?.message?.content || '';
        tokensUsed = completion.usage?.total_tokens || 0;
      } else if (provider === 'anthropic' && anthropic) {
        const maxTokens = Math.min(4000, Math.max(800, Math.floor(length * 2.5)));
        
        const message = await anthropic.messages.create({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: maxTokens,
          temperature: 0.8,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        });

        content = message.content[0]?.type === 'text' ? message.content[0].text : '';
        tokensUsed = message.usage?.input_tokens + message.usage?.output_tokens || 0;
      } else {
        return createProblemResponse(new BadRequestError(`${provider} is not configured or available`));
      }

      responseTime = Date.now() - responseTime;

      // Log the AI task
      await prisma.aITaskLog.create({
        data: {
          userId: session.user.id,
          provider,
          model: model || (provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022'),
          task: 'writer-generation',
          prompt: userPrompt.substring(0, 1000), // Truncate for storage
          response: content.substring(0, 1000), // Truncate for storage
          success: !!content,
          tokensUsed,
          responseTime,
          metadata: {
            category,
            thinker,
            tone,
            hook,
            time_horizon,
            length,
            topic_id
          }
        }
      });

      if (!content) {
        return createProblemResponse(new InternalServerError(`${provider} returned empty content`));
      }

      return NextResponse.json({
        success: true,
        content,
        metadata: {
          provider,
          model: model || (provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022'),
          tokensUsed,
          responseTime,
          length: content.length,
          wordCount: content.split(/\\s+/).length
        }
      });

    } catch (aiError: any) {
      console.error('AI Provider Error:', aiError);
      
      // Log failed AI task
      await prisma.aITaskLog.create({
        data: {
          userId: session.user.id,
          provider,
          model: model || (provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022'),
          task: 'writer-generation',
          prompt: userPrompt.substring(0, 1000),
          success: false,
          tokensUsed: 0,
          responseTime: Date.now() - responseTime,
          error: aiError.message,
          metadata: { category, thinker, tone, hook, time_horizon, length, topic_id }
        }
      });

      return createProblemResponse(new InternalServerError(`AI generation failed: ${aiError.message}`));
    }

  } catch (error) {
    console.error('Writer Generate API Error:', error);
    return createProblemResponse(new InternalServerError('Failed to generate content'));
  }
}