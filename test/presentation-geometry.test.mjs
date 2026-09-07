import test from 'node:test';
import assert from 'node:assert/strict';
import { SLIDE_GEOMETRY, revealConfiguration, isCanvasRectInsideViewport, textSizeIsLegible } from '../template/presentation/geometry.mjs';

test('uses one fixed 16:9 canvas independently of the viewport', () => {
  assert.deepEqual(SLIDE_GEOMETRY, { width: 1280, height: 720, margin: 0.04, minScale: 0.01, maxScale: 4, center: false, disableLayout: false });
  assert.deepEqual(revealConfiguration(), SLIDE_GEOMETRY);
});

test('requires the entire scaled canvas to remain inside the viewport', () => {
  assert.equal(isCanvasRectInsideViewport({ left: 40, top: 90, right: 1560, bottom: 810 }, { width: 1600, height: 900 }), true);
  assert.equal(isCanvasRectInsideViewport({ left: -1, top: 90, right: 1519, bottom: 810 }, { width: 1600, height: 900 }), false);
});

test('does not accept unreadable content text', () => {
  assert.equal(textSizeIsLegible(14, 'content'), true);
  assert.equal(textSizeIsLegible(13.99, 'content'), false);
  assert.equal(textSizeIsLegible(12, 'caption'), true);
  assert.equal(textSizeIsLegible(11.99, 'caption'), false);
});
