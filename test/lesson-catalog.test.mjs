import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { listLessons } from '../scripts/lesson-catalog.mjs';

test('catalogues a complete lesson without presentation files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'lesson-catalog-'));
  const directory = path.join(root, 'classes/4/01-stacje-bez-prezentacji');
  try {
    await mkdir(path.join(directory, 'assets'), { recursive: true });
    await writeFile(path.join(directory, 'metadata.json'), JSON.stringify({
      id: '01-stacje-bez-prezentacji',
      title: 'Stacje bez prezentacji',
      grade: 4,
      presentation_mode: 'none',
    }));
    for (const name of ['lesson.md', 'worksheet.md', 'sources.md', 'assessment.md', 'teacher-guide.md', 'reflection.md']) {
      await writeFile(path.join(directory, name), '# materiał\n');
    }
    await writeFile(path.join(directory, 'workshop-45.md'), '# Warsztat\n');
    await writeFile(path.join(directory, 'workshop-group-packet.md'), '# Pakiet\n');

    const catalog = await listLessons({ repoRoot: root });

    assert.equal(catalog.lessons.length, 1);
    assert.equal(catalog.lessons[0].valid, true);
    assert.equal(catalog.lessons[0].capabilities.presentation, false);
    assert.equal(catalog.lessons[0].capabilities.workshop, true);
    assert.equal(catalog.lessons[0].capabilities.workshopPacket, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
