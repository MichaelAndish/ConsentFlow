import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_GEMINI_MODEL,
  getGeminiApiKey,
  getGeminiModel,
  isGeminiConfigured,
  simplifyForAudience,
} from './geminiServer';

test('server getGeminiModel defaults to gemini-3.8-flash', () => {
  assert.equal(DEFAULT_GEMINI_MODEL, 'gemini-3.8-flash');
  assert.ok(getGeminiModel().length > 0);
});

test('server isGeminiConfigured is boolean without throwing', () => {
  assert.equal(typeof isGeminiConfigured(), 'boolean');
  assert.equal(typeof getGeminiApiKey(), 'string');
});

test('server simplifyForAudience falls back when no key is set', async () => {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = '';
  try {
    const result = await simplifyForAudience('Clinical protocol investigation', 'child', 'EN');
    assert.equal(result.source, 'rule_fallback');
    assert.ok(result.simplifiedText.includes('child') || result.simplifiedText.length > 0);
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});
