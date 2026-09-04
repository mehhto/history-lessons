import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeRequestPath, resolveWithin } from '../scripts/safe-paths.mjs';

test('keeps a normal relative path within its base directory', () => {
  assert.equal(
    resolveWithin('/repo', 'classes/6/lekcja/index.html'),
    '/repo/classes/6/lekcja/index.html',
  );
});

test('rejects filesystem traversal outside its base directory', () => {
  assert.throws(() => resolveWithin('/repo', '../secret.txt'), /poza dozwolonym katalogiem/);
});

test('rejects an encoded traversal request after URL decoding', () => {
  assert.throws(
    () => resolveWithin('/repo', `.${decodeRequestPath('/%2e%2e%2fsecret.txt')}`),
    /poza dozwolonym katalogiem/,
  );
});

test('rejects malformed URL escapes instead of serving a fallback path', () => {
  assert.throws(() => decodeRequestPath('/%E0%A4'), /Nieprawidłowe kodowanie URL/);
});
