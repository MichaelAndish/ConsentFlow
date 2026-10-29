/**
 * Browser-safe Gemini client.
 * Never reads or embeds GEMINI_API_KEY in the frontend bundle.
 * All privileged calls go through `/api/gemini/*` on the Node server.
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export interface SimplificationResult {
  simplifiedText: string;
  source: 'gemini' | 'rule_fallback';
  modelUsed?: string;
}

/** Model name for display only — not a secret. */
export function getGeminiModel(): string {
  if (typeof process !== 'undefined' && process.env?.GEMINI_MODEL) {
    return process.env.GEMINI_MODEL.trim();
  }
  return DEFAULT_GEMINI_MODEL;
}

/**
 * @deprecated API keys are server-only. Always returns empty in the browser.
 */
export function getGeminiApiKey(): string {
  return '';
}

/**
 * Sync check for unit tests / SSR. In the browser this is always false —
 * use {@link fetchGeminiStatus} for the live Settings badge.
 */
export function isGeminiConfigured(): boolean {
  return false;
}

/** Live status from the server (never returns the key). */
export async function fetchGeminiStatus(): Promise<{ configured: boolean; model: string }> {
  try {
    const res = await fetch('/api/gemini/status');
    if (!res.ok) return { configured: false, model: DEFAULT_GEMINI_MODEL };
    const data = await res.json();
    return {
      configured: Boolean(data.configured),
      model: typeof data.model === 'string' ? data.model : DEFAULT_GEMINI_MODEL,
    };
  } catch {
    return { configured: false, model: DEFAULT_GEMINI_MODEL };
  }
}

/** @deprecated Client never holds a GenAI SDK instance. */
export function getGeminiClient(): null {
  return null;
}

/**
 * Simplifies clinical trial language for paediatric audiences via the server proxy.
 */
export async function simplifyForAudience(
  text: string,
  targetAudience: 'child' | 'adolescent' | 'parent',
  targetLanguage: 'EN' | 'NL' | 'FR'
): Promise<SimplificationResult> {
  try {
    const res = await fetch('/api/gemini/simplify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetAudience, targetLanguage }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.simplifiedText) {
        return {
          simplifiedText: data.simplifiedText,
          source: data.source === 'gemini' ? 'gemini' : 'rule_fallback',
          modelUsed: data.modelUsed,
        };
      }
    }
  } catch {
    // fall through
  }

  return {
    simplifiedText: `[Fallback standard ${targetAudience} text]: ${text}`,
    source: 'rule_fallback',
  };
}
