import { realpath } from 'node:fs/promises';
import process from 'node:process';

import { inspectLessonContract } from './presentation-contract-check.mjs';
import { resolveWithin } from './safe-paths.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function realpathWithin(root, candidate) {
  return resolveWithin(root, await realpath(resolveWithin(root, candidate)));
}

function printHuman(report, lesson) {
  if (!report.applicable) return console.log(`POMINIĘTO  ${lesson}: brak jawnego opt-in presentationContract.version.`);
  console.log(`${report.static.status === 'pass' ? 'STATIC OK' : 'STATIC BŁĄD'}  ${lesson} (kontrakt ${report.version ?? 'brak'})`);
  for (const issue of report.static.issues) console.log(`  · ${issue}`);
  for (const warning of report.static.warnings ?? []) console.log(`  ⚠ ${warning}`);
  for (const gate of ['browser', 'human']) if (report[gate].status !== 'pass') console.log(`  · ${gate}: ${report[gate].status}. ${report[gate].issues.join(' ')}`);
  console.log(`  readyForTeacher: ${report.readyForTeacher ? 'TAK' : 'NIE'}`);
  console.log(`  presentationAccepted: ${report.presentationAccepted ? 'TAK' : 'NIE'}`);
}

const lesson = argument('--lesson');
const json = process.argv.includes('--json');
if (!lesson) {
  console.error('Użycie: npm run check:contract -- --lesson classes/6/01-temat [--json]');
  process.exitCode = 1;
} else {
  try {
    const root = await realpath(process.cwd());
    const lessonDirectory = await realpathWithin(root, lesson);
    const report = await inspectLessonContract({ repoRoot: root, lessonDirectory });
    if (json) console.log(JSON.stringify(report, null, 2));
    else printHuman(report, lesson);
    if (report.static.status === 'fail' || ['browser', 'human'].some((gate) => report[gate].status === 'fail')) process.exitCode = 1;
  } catch (error) {
    if (json) console.log(JSON.stringify({ error: error.message }, null, 2));
    else console.error(`BŁĄD  ${lesson}: ${error.message}`);
    process.exitCode = 1;
  }
}
