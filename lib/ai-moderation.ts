// AI-Powered Comment Moderation System

interface ModerationResult {
  status: 'approved' | 'rejected' | 'review' | 'spam';
  score: number; // 0-1 confidence score
  reason?: string;
  flags: string[];
}

// German profanity and toxic words list
const GERMAN_PROFANITY = [
  'scheiß', 'shit', 'fuck', 'arsch', 'idiot', 'dumm', 'blöd', 
  'hurensohn', 'fotze', 'wichser', 'bastard', 'drecksau',
  'verdammt', 'mist', 'kacke', 'piss', 'nazi', 'hitler',
  // Add more as needed
];

const SPAM_INDICATORS = [
  'klick hier', 'jetzt kaufen', 'garantiert', 'kostenlos',
  'viagra', 'casino', 'gewinn', 'bitcoin', 'crypto',
  'http://', 'https://', 'www.', '.com', '.de', '.org',
  'whatsapp', 'telegram', 'kontakt', 'angebot',
];

const TOXIC_PATTERNS = [
  'du bist', 'ihr seid alle', 'alle deutschen', 'ausländer raus',
  'geh sterben', 'bring dich um', 'hass', 'hasse', 'töten',
  'gewalt', 'schlagen', 'verprügeln', 'umbringen',
];

// Simple AI moderation (can be replaced with OpenAI/other AI service)
export async function moderateComment(content: string, authorName: string, authorEmail?: string): Promise<ModerationResult> {
  const flags: string[] = [];
  let score = 0;
  const text = content.toLowerCase().trim();
  
  // Check for empty/too short content
  if (text.length < 3) {
    return {
      status: 'rejected',
      score: 1.0,
      reason: 'Kommentar zu kurz oder leer',
      flags: ['too_short'],
    };
  }

  // Check for excessive length (spam indicator)
  if (text.length > 2000) {
    flags.push('too_long');
    score += 0.3;
  }

  // Check for profanity
  let profanityCount = 0;
  for (const word of GERMAN_PROFANITY) {
    if (text.includes(word.toLowerCase())) {
      profanityCount++;
      flags.push(`profanity:${word}`);
    }
  }
  
  if (profanityCount > 0) {
    score += profanityCount * 0.4;
    if (profanityCount >= 3) {
      return {
        status: 'rejected',
        score: 1.0,
        reason: 'Mehrfache Verwendung von Schimpfwörtern',
        flags,
      };
    }
  }

  // Check for spam indicators
  let spamCount = 0;
  for (const indicator of SPAM_INDICATORS) {
    if (text.includes(indicator.toLowerCase())) {
      spamCount++;
      flags.push(`spam:${indicator}`);
    }
  }
  
  if (spamCount >= 3) {
    return {
      status: 'spam',
      score: 0.9,
      reason: 'Verdacht auf Spam-Inhalt',
      flags,
    };
  } else if (spamCount > 0) {
    score += spamCount * 0.2;
  }

  // Check for toxic patterns
  let toxicCount = 0;
  for (const pattern of TOXIC_PATTERNS) {
    if (text.includes(pattern.toLowerCase())) {
      toxicCount++;
      flags.push(`toxic:${pattern}`);
    }
  }
  
  if (toxicCount > 0) {
    score += toxicCount * 0.5;
    if (toxicCount >= 2) {
      return {
        status: 'rejected',
        score: 1.0,
        reason: 'Toxischer oder beleidigender Inhalt',
        flags,
      };
    }
  }

  // Check for excessive caps (shouting)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.6 && text.length > 20) {
    flags.push('excessive_caps');
    score += 0.2;
  }

  // Check for repeated characters (spam indicator)
  const repeatedChars = text.match(/(.)\1{4,}/g);
  if (repeatedChars && repeatedChars.length > 0) {
    flags.push('repeated_chars');
    score += 0.3;
  }

  // Check author name for suspicious patterns
  if (authorName) {
    const nameLower = authorName.toLowerCase();
    if (SPAM_INDICATORS.some(indicator => nameLower.includes(indicator))) {
      flags.push('suspicious_name');
      score += 0.4;
    }
  }

  // Determine final status based on score
  if (score >= 0.8) {
    return {
      status: 'rejected',
      score,
      reason: 'Hohe Wahrscheinlichkeit für problematischen Inhalt',
      flags,
    };
  } else if (score >= 0.5) {
    return {
      status: 'review',
      score,
      reason: 'Kommentar benötigt menschliche Prüfung',
      flags,
    };
  } else if (spamCount > 0 || profanityCount > 0) {
    return {
      status: 'review',
      score,
      reason: 'Potentiell problematischer Inhalt erkannt',
      flags,
    };
  } else {
    return {
      status: 'approved',
      score,
      reason: 'Kommentar erscheint unbedenklich',
      flags,
    };
  }
}

// Enhanced moderation with external AI (OpenAI, etc.) - Optional
export async function moderateCommentWithAI(content: string): Promise<ModerationResult> {
  try {
    // This would call OpenAI Moderation API or similar
    // For now, we use the simple moderation above
    return await moderateComment(content, '', '');
    
    /* Example OpenAI implementation:
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: content,
      }),
    });
    
    const data = await response.json();
    const result = data.results[0];
    
    if (result.flagged) {
      return {
        status: 'rejected',
        score: Math.max(...Object.values(result.category_scores)),
        reason: Object.keys(result.categories).filter(key => result.categories[key]).join(', '),
        flags: Object.keys(result.categories).filter(key => result.categories[key]),
      };
    }
    */
  } catch (error) {
    console.error('AI Moderation failed:', error);
    // Fallback to simple moderation
    return await moderateComment(content, '', '');
  }
}

// Rate limiting check
export function checkRateLimit(authorEmail: string, authorIP: string): boolean {
  // Implement rate limiting logic here
  // For now, always allow (you can add Redis-based rate limiting)
  return true;
}

export default {
  moderateComment,
  moderateCommentWithAI,
  checkRateLimit,
};