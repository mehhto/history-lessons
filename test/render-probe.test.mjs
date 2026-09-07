import test from 'node:test';
import assert from 'node:assert/strict';
import { findCanvasIssues } from '../scripts/render-probe.mjs';

test('reports content that extends beyond a fixed canvas even when its container clips overflow', () => {
  const issues = findCanvasIssues({
    slide: '#long',
    canvas: { left: 0, top: 0, right: 1280, bottom: 720 },
    viewport: { width: 1280, height: 720 },
    content: [
      { selector: 'p', text: 'Niewidoczny koniec', rect: { left: 64, top: 650, right: 800, bottom: 742 }, computedFontSize: 28, kind: 'content' },
    ],
  });
  assert.deepEqual(issues, ['Treść poza płótnem #long: p']);
});

test('reports a canvas escaping the viewport and unreadable text', () => {
  const issues = findCanvasIssues({
    slide: '#offscreen',
    canvas: { left: -3, top: 0, right: 1277, bottom: 720 },
    viewport: { width: 1280, height: 720 },
    content: [{ selector: 'figcaption', text: 'Źródło', rect: { left: 70, top: 680, right: 300, bottom: 700 }, computedFontSize: 11, kind: 'caption' }],
  });
  assert.deepEqual(issues, ['Płótno poza ekranem #offscreen', 'Zbyt mały tekst #offscreen: figcaption']);
});
