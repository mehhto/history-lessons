import path from 'node:path';

export function resolveWithin(baseDirectory, candidate) {
  const resolved = path.resolve(baseDirectory, candidate);
  const relative = path.relative(baseDirectory, resolved);
  const outside = relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);

  if (outside) {
    throw new Error('Ścieżka wskazuje poza dozwolonym katalogiem.');
  }

  return resolved;
}

export function decodeRequestPath(requestUrl) {
  const pathname = new URL(requestUrl, 'http://127.0.0.1').pathname;
  try {
    return decodeURIComponent(pathname);
  } catch {
    throw new Error('Nieprawidłowe kodowanie URL.');
  }
}
