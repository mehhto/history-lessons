import { createHash } from 'node:crypto';

function digest(inputs) {
  return createHash('sha256')
    .update(Object.entries(inputs).sort(([a], [b]) => a.localeCompare(b)).map(([path, content]) => `${path}\0${content}`).join('\n'))
    .digest('hex');
}

export function createArtifactManifest(inputs) {
  return { version: 1, input_hash: digest(inputs), inputs: Object.keys(inputs).sort() };
}

export function isArtifactFresh(manifest, inputs) {
  return Boolean(manifest && manifest.version === 1 && manifest.input_hash === digest(inputs));
}
