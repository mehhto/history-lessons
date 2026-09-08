import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const decks = [
  ['VIII', new URL('../classes/8/wojna-obronna-polski-we-wrzesniu-1939-roku/slides.md', import.meta.url)],
  ['VI', new URL('../classes/6/skutki-wypraw-geograficznych-i-ameryka-przed-kolumbem/slides.md', import.meta.url)],
];

test('baseline documentary decks expose the critical teaching purposes before migration', async () => {
  for (const [name, url] of decks) {
    const markdown = await readFile(url, 'utf8');
    for (const purpose of ['opening', 'question', 'evidence', 'explanation', 'practice', 'synthesis', 'exit-ticket']) {
      assert.match(markdown, new RegExp(`data-purpose="${purpose}"`), `${name}: ${purpose}`);
    }
  }
});
