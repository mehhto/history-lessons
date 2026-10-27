import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = name => readFile(path.join(dir, name), 'utf8');
const [lesson, stations, worksheet, key, metadata, packet, worksheetHtml] = await Promise.all([
  read('lesson.md'), read('stations.md'), read('worksheet.md'), read('assessment.md'), read('metadata.json'), read('packet.html'), read('worksheet.html')
]);
const meta = JSON.parse(metadata);
assert.equal(meta.grade, 8);
assert.equal(meta.presentation_mode, 'none');
assert.equal(meta.pdf_exported, false);
assert.equal((stations.match(/^# Stacja /gm) ?? []).length, 5);
assert.equal((stations.match(/<!-- page -->/g) ?? []).length, 4);
assert.equal((packet.match(/<section[^>]*data-page=/g) ?? []).length, 5);
assert.equal((worksheetHtml.match(/<section[^>]*data-page=/g) ?? []).length, 2);
assert.match(packet, /data:image\/webp;base64,/);
assert.match(worksheetHtml, /data:image\/webp;base64,/);
assert.doesNotMatch(packet, /<(?:script|link|img)[^>]*(?:src|href)=["']https?:/i);
assert.doesNotMatch(worksheetHtml, /<(?:script|link|img)[^>]*(?:src|href)=["']https?:/i);
for (const section of ['## 1.', '## 2.', '## 3.', '## 4.', '## 5.', '## Bilet wyjścia']) assert.ok(worksheet.includes(section));
assert.match(key, /AK WYSTĘPUJE JAKO POLSKA WŁADZA/);
assert.match(lesson, /45 minut/);
console.log('OK: 5 station cards, a two-page team card, local images, and matching cipher key.');