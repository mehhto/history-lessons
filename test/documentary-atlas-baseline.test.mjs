import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const decks = [
  ['VIII', new URL('../classes/8/01-wojna-obronna-1939/slides.md', import.meta.url)],
  ['VI', new URL('../classes/6/04-ameryka-przed-kolumbem/slides.md', import.meta.url)],
];

test('baseline documentary decks expose the critical teaching purposes before migration', async () => {
  for (const [name, url] of decks) {
    const markdown = await readFile(url, 'utf8');
    for (const purpose of ['opening', 'question', 'evidence', 'explanation', 'practice', 'synthesis', 'exit-ticket']) {
      assert.match(markdown, new RegExp(`data-purpose="${purpose}"`), `${name}: ${purpose}`);
    }
  }
});
