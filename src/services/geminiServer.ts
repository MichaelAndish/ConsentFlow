/**
 * Server-only Gemini helpers. Never import this module from client/React code.
 * The API key must remain in process.env on the Node server (Cloud Run / local).
 */
import { GoogleGenAI } from '@google/genai';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export function getGeminiModel(): string {
  return (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
}

export function getGeminiApiKey(): string {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '').trim();
  if (!key || key === 'MY_GEMINI_API_KEY') return '';
  return key;
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKey().length > 5;
}

export interface SimplificationResult {
  simplifiedText: string;
  source: 'gemini' | 'rule_fallback';
  modelUsed?: string;
}

export async function simplifyForAudience(
  text: string,
  targetAudience: 'child' | 'adolescent' | 'parent',
  targetLanguage: 'EN' | 'NL' | 'FR'
): Promise<SimplificationResult> {
  if (!isGeminiConfigured()) {
    return {
      simplifiedText: `[Fallback standard ${targetAudience} text]: ${text}`,
      source: 'rule_fallback',
    };
  }

  try {
    const client = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const audienceGuidelines = {
      child:
        'Age 8-11: Short sentences, 3rd grade reading level, supportive tone, no scary jargon, explain why tests happen.',
      adolescent:
        'Age 12-17: Respectful, direct, 7th grade reading level, clear autonomy explanations and privacy information.',
      parent:
        'Clear medical communication, Belgian Law of 7 May 2004 compliance, exact procedure breakdown.',
    }[targetAudience];

    const prompt = `You are an expert paediatric clinical trial communicator for the Belgian Society of Paediatric Haematology and Oncology (BSPHO).
Rewrite the following clinical trial text for a ${targetAudience} audience in ${targetLanguage}.
Audience guidelines: ${audienceGuidelines}

Original text:
${text}

Output only the revised text:`;

    const modelName = getGeminiModel();
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    return {
      simplifiedText: response.text?.trim() || text,
      source: 'gemini',
      modelUsed: modelName,
    };
  } catch (error) {
    console.warn('[Gemini] API call failed, using rule fallback:', error);
    return {
      simplifiedText: text,
      source: 'rule_fallback',
    };
  }
}
