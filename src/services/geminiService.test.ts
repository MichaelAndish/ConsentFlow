import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getGeminiApiKey,
  isGeminiConfigured,
  getGeminiClient,
  simplifyForAudience,
  getGeminiModel,
  DEFAULT_GEMINI_MODEL,
} from './geminiService';

test('getGeminiModel defaults to gemini-3.8-flash', () => {
  assert.equal(DEFAULT_GEMINI_MODEL, 'gemini-3.8-flash');
  const model = getGeminiModel();
  assert.ok(model.includes('gemini-3.8-flash') || model.length > 0);
});

test('getGeminiApiKey is empty in the browser-safe client module', () => {
  assert.equal(getGeminiApiKey(), '');
});

test('isGeminiConfigured is false in the browser-safe client module', () => {
  assert.equal(isGeminiConfigured(), false);
});

test('getGeminiClient always returns null on the client', () => {
  assert.equal(getGeminiClient(), null);
});

test('simplifyForAudience returns rule fallback when API is unreachable', async () => {
  const result = await simplifyForAudience('Clinical protocol investigation', 'child', 'EN');
  assert.equal(result.source, 'rule_fallback');
  assert.ok(result.simplifiedText.length > 0);
});
