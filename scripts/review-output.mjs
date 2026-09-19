import path from 'node:path';
import { readdir, rm } from 'node:fs/promises';

export async function clearReviewOutput(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const generated = entries.filter((entry) => entry.isFile() && (entry.name.endsWith('.png') || entry.name === 'index.html'));
  await Promise.all(generated.map((entry) => rm(path.join(directory, entry.name), { force: true })));
}
