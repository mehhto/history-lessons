import { access, readdir } from 'node:fs/promises';
import path from 'node:path';

const executableByPlatform = {
  linux: ['chrome-linux64', 'chrome'],
  darwin: ['chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'],
  win32: ['chrome-win', 'chrome.exe'],
};

export async function localChromiumExecutable(repositoryRoot) {
  const browserRoot = path.join(repositoryRoot, '.playwright-browsers');
  const segments = executableByPlatform[process.platform];
  if (!segments) throw new Error(`Brak konfiguracji lokalnego Chromium dla ${process.platform}.`);
  const entries = await readdir(browserRoot, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isDirectory() && /^chromium-\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));
  for (const candidate of candidates) {
    const executable = path.join(browserRoot, candidate, ...segments);
    try {
      await access(executable);
      return executable;
    } catch { /* Try the next locally provisioned Chromium. */ }
  }
  throw new Error(`Nie znaleziono lokalnego Chromium w ${browserRoot}. Uruchom npm run install:browser.`);
}
