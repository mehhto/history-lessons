import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { validateLessonPackage } from '../scripts/lesson-tools.mjs';

const directory = new URL('../classes/4/02-mieszkamy-w-polsce/', import.meta.url);
test('Mieszkamy w Polsce is a complete 45-minute offline lesson without slides', async () => {
  const entries = new Set((await readdir(directory, { withFileTypes: true })).map((e) => e.name + (e.isDirectory() ? '/' : '')));
  const metadata = JSON.parse(await readFile(new URL('metadata.json', directory), 'utf8'));
  assert.equal(metadata.presentation_mode, 'none');
  assert.equal(metadata.curriculum_version, 'nowa-2026');
  assert.equal(metadata.duration_minutes, 45);
  assert.deepEqual(validateLessonPackage(entries, { presentationMode: 'none' }), { ok: true, missing: [] });
  assert.equal(entries.has('slides.md'), false);
  const lesson = await readFile(new URL('lesson.md', directory), 'utf8');
  const stages = [...lesson.matchAll(/^\| (\d+)–(\d+):/gm)].map(([, a, b]) => [+a, +b]);
  assert.equal(stages.length, 8);
  assert.equal(stages[0][0], 0);
  assert.equal(stages.at(-1)[1], 45);
  stages.forEach(([a, b], i) => { assert.ok(b > a); if (i) assert.equal(a, stages[i - 1][1]); });
  const packet = await readFile(new URL('workshop-group-packet.md', directory), 'utf8');
  for (const name of ['Hania', 'Leo', 'Adam']) assert.ok(packet.includes(name));
  assert.match(packet, /cztery błędy/);
  assert.doesNotMatch(packet, /Klucz|fikcyjna sytuacja dydaktyczna|Produkt:/);
  assert.ok((await readFile(new URL('assets/symbole.png', directory))).subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
});
