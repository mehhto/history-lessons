import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';

const lesson = 'classes/6/wielkie-odkrycia-geograficzne-wyprawy-i-spotkanie-swiatow';

function startPreview() {
  const child = spawn(process.execPath, ['scripts/preview.mjs', '--lesson', lesson, '--host', '127.0.0.1', '--port', '0'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`Preview did not start:\n${output}`));
    }, 5_000);

    const collect = (chunk) => {
      output += chunk;
      const match = output.match(/Preview ready: (http:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve({ child, url: new URL(match[1]).origin });
      }
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.once('error', reject);
    child.once('exit', (code) => {
      if (!output.includes('Preview ready:')) {
        clearTimeout(timeout);
        reject(new Error(`Preview exited with ${code}:\n${output}`));
      }
    });
  });
}

test('restricted preview serves the selected lesson and blocks repository internals', async (t) => {
  const { child, url } = await startPreview();
  t.after(() => child.kill());

  assert.equal((await fetch(`${url}/${lesson}/`)).status, 200);
  assert.equal((await fetch(`${url}/template/components/lesson-components.js`)).status, 200);
  assert.equal((await fetch(`${url}/.git/HEAD`)).status, 403);
  assert.equal((await fetch(`${url}/classes/6/00-pilot-szablonu/index.html`)).status, 403);
});
