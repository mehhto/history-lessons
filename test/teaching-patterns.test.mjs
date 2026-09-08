import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const requirements = {
  'source-analysis': ['Obserwuj', 'nieznany', 'Osadź', 'cel', 'Wnioskuj', 'ograniczenie', 'zgodność'],
  comparison: ['Pytanie przewodnie', 'Kryterium', 'podobieństwo', 'różnica', 'wniosek'],
  'cause-effect': ['kilka przyczyn', 'mechanizm', 'Skutek bezpośredni', 'Skutek długofalowy', 'nie dowodzi przyczynowości'],
  'map-question': ['data', 'legenda', 'autor', 'historyczna', 'dowód', 'ograniczenie'],
  retrieval: ['bez patrzenia', 'pojęcia', 'cel', 'Sprawdź', 'korekt'],
};
test('ships reusable history-thinking patterns with required scaffolding', async () => {
  for (const [name, phrases] of Object.entries(requirements)) {
    const content = await readFile(path.join(root, 'template/patterns', `${name}.md`), 'utf8');
    for (const phrase of phrases) assert.match(content, new RegExp(phrase, 'i'), `${name}: ${phrase}`);
  }
});
