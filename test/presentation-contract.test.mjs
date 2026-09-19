import test from 'node:test';
import assert from 'node:assert/strict';

import { inspectPresentationContract } from '../scripts/presentation-contract.mjs';

test('skips lessons without an explicit presentation contract opt-in', () => {
  const report = inspectPresentationContract({ metadata: {} });

  assert.equal(report.applicable, false);
  assert.equal(report.version, null);
  assert.equal(report.readyForTeacher, false);
  assert.deepEqual(report.static.issues, []);
});

test('rejects an unsupported presentation contract version', () => {
  const report = inspectPresentationContract({
    metadata: { presentationContract: { version: '2.0' } },
  });

  assert.equal(report.applicable, true);
  assert.equal(report.static.status, 'fail');
  assert.match(report.static.issues.join('\n'), /wersja.*2\.0/i);
});

test('rejects a persisted readyForTeacher value because readiness is derived', () => {
  const report = inspectPresentationContract({
    metadata: { presentationContract: { version: '1.0', readyForTeacher: true } },
  });

  assert.equal(report.static.status, 'fail');
  assert.match(report.static.issues.join('\n'), /readyForTeacher.*wyliczany/i);
});

test('accepts a complete local exception for a waivable rule', () => {
  const exception = {
    rule: 'MEDIA-LIGHTBOX-001',
    contractVersion: '1.0',
    scope: { kind: 'slide', slide: 'schemat' },
    reason: 'Schemat ma własny tryb pełnoekranowy.',
    compensation: 'Tryb zachowuje klawiaturę i zwrot fokusu.',
  };
  const report = inspectPresentationContract({
    metadata: {
      presentationContract: { version: '1.0' },
      contractExceptions: [exception],
    },
    slideIds: ['schemat'],
  });

  assert.equal(report.static.status, 'pass');
  assert.deepEqual(report.exceptions.active, [exception]);
});

test('rejects an exception with an unsupported top-level field', () => {
  const report = inspectPresentationContract({
    metadata: {
      presentationContract: { version: '1.0' },
      contractExceptions: [{
        rule: 'MEDIA-LIGHTBOX-001',
        contractVersion: '1.0',
        scope: { kind: 'lesson' },
        reason: 'Materiał nie jest obrazem źródłowym.',
        compensation: 'Opis tekstowy i zwykłe powiększenie.',
        author: 'nieobsługiwane',
      }],
    },
  });

  assert.equal(report.static.status, 'fail');
  assert.match(report.static.issues.join('\n'), /nieobsługiwane pole.*author/i);
});

test('rejects scope fields that do not apply to its scope kind', () => {
  const report = inspectPresentationContract({
    metadata: {
      presentationContract: { version: '1.0' },
      contractExceptions: [{
        rule: 'MEDIA-LIGHTBOX-001',
        contractVersion: '1.0',
        scope: { kind: 'lesson', slide: 'start' },
        reason: 'Materiał nie jest obrazem źródłowym.',
        compensation: 'Opis tekstowy i zwykłe powiększenie.',
      }],
    },
  });

  assert.equal(report.static.status, 'fail');
  assert.match(report.static.issues.join('\n'), /scope.*nieobsługiwane pole.*slide/i);
});

test('rejects exceptions from accessibility and minimum type rules', () => {
  const report = inspectPresentationContract({
    metadata: {
      presentationContract: { version: '1.0' },
      contractExceptions: [
        {
          rule: 'A11Y-VISUAL-001',
          contractVersion: '1.0',
          scope: { kind: 'lesson' },
          reason: 'Chcemy zachować oryginalne kolory.',
          compensation: 'Brak.',
        },
        {
          rule: 'TYPE-SCALE-001',
          contractVersion: '1.0',
          scope: { kind: 'lesson' },
          reason: 'Chcemy zmieścić więcej tekstu.',
          compensation: 'Brak.',
        },
      ],
    },
  });

  assert.equal(report.static.status, 'fail');
  assert.match(report.static.issues.join('\n'), /niewyłączalna.*A11Y-VISUAL-001/i);
  assert.match(report.static.issues.join('\n'), /niewyłączalna.*TYPE-SCALE-001/i);
});

test('rejects an incomplete or stale exception instead of silently ignoring it', () => {
  const report = inspectPresentationContract({
    metadata: {
      presentationContract: { version: '1.0' },
      contractExceptions: [{
        rule: 'UNKNOWN-001',
        contractVersion: '0.9',
        scope: { kind: 'element' },
        reason: '',
        compensation: '',
      }],
    },
    slideIds: ['start'],
  });
  const issues = report.static.issues.join('\n');

  assert.equal(report.static.status, 'fail');
  assert.match(issues, /nieznana reguła.*UNKNOWN-001/i);
  assert.match(issues, /wersja wyjątku.*0\.9/i);
  assert.match(issues, /scope\.slide/i);
  assert.match(issues, /scope\.id/i);
  assert.match(issues, /uzasadnienie/i);
  assert.match(issues, /środek kompensujący/i);
  assert.deepEqual(report.exceptions.active, []);
});

test('rejects an exception scoped to a slide that does not exist', () => {
  const report = inspectPresentationContract({
    metadata: {
      presentationContract: { version: '1.0' },
      contractExceptions: [{
        rule: 'MEDIA-LIGHTBOX-001',
        contractVersion: '1.0',
        scope: { kind: 'slide', slide: 'nie-ma' },
        reason: 'Element nie jest dostępny na małym ekranie.',
        compensation: 'Pozostawiam opis tekstowy.',
      }],
    },
    slideIds: ['jest'],
  });

  assert.equal(report.static.status, 'fail');
  assert.match(report.static.issues.join('\n'), /slajd.*nie istnieje/i);
});

test('rejects an exception scoped to an element that does not exist', () => {
  const report = inspectPresentationContract({
    metadata: {
      presentationContract: { version: '1.0' },
      contractExceptions: [{
        rule: 'MEDIA-LIGHTBOX-001',
        contractVersion: '1.0',
        scope: { kind: 'element', slide: 'start', id: 'nie-ma' },
        reason: 'Element ma własne sterowanie.',
        compensation: 'Pozostawiam opis tekstowy.',
      }],
    },
    slideIds: ['start'],
    elementIds: ['jest'],
  });

  assert.equal(report.static.status, 'fail');
  assert.match(report.static.issues.join('\n'), /element.*nie istnieje/i);
});


test('keeps readiness pending until browser and human reviews are complete', () => {
  const report = inspectPresentationContract({
    metadata: { presentationContract: { version: '1.0' } },
  });

  assert.equal(report.static.status, 'pass');
  assert.equal(report.browser.status, 'pending');
  assert.equal(report.human.status, 'pending');
  assert.equal(report.readyForTeacher, false);
});

test('derives readyForTeacher only after all three gates pass', () => {
  const report = inspectPresentationContract({
    metadata: { presentationContract: { version: '1.0' } },
    browser: { completed: true, issues: [] },
    human: { completed: true, blockers: [], warnings: [] },
  });

  assert.equal(report.static.status, 'pass');
  assert.equal(report.browser.status, 'pass');
  assert.equal(report.human.status, 'pass');
  assert.equal(report.readyForTeacher, true);
});

test('keeps external gate failures and human warnings in one report', () => {
  const report = inspectPresentationContract({
    metadata: { presentationContract: { version: '1.0' } },
    staticIssues: ['Nie mieści się zawartość.'],
    browser: { completed: true, issues: ['Overflow na slajdzie 2.'] },
    human: {
      completed: true,
      blockers: ['Otwarcie nie ma znaczącego obrazu.'],
      warnings: ['Paleta wymaga omówienia.'],
    },
  });

  assert.equal(report.readyForTeacher, false);
  assert.equal(report.static.status, 'fail');
  assert.equal(report.browser.status, 'fail');
  assert.equal(report.human.status, 'fail');
  assert.deepEqual(report.human.warnings, ['Paleta wymaga omówienia.']);
});

test('fails a completed browser gate when its issues are not an array', () => {
  const report = inspectPresentationContract({
    metadata: { presentationContract: { version: '1.0' } },
    browser: { completed: true, issues: 'brak problemów' },
    human: { completed: true, blockers: [] },
  });

  assert.equal(report.browser.status, 'fail');
  assert.equal(report.readyForTeacher, false);
  assert.match(report.browser.issues.join('\n'), /browser\.issues musi być tablicą/i);
});

test('fails a completed human gate when its blockers are not an array', () => {
  const report = inspectPresentationContract({
    metadata: { presentationContract: { version: '1.0' } },
    browser: { completed: true, issues: [] },
    human: { completed: true, blockers: 'brak blokad' },
  });

  assert.equal(report.human.status, 'fail');
  assert.equal(report.readyForTeacher, false);
  assert.match(report.human.issues.join('\n'), /human\.blockers musi być tablicą/i);
});

test('fails a completed human gate when its warnings are not an array', () => {
  const report = inspectPresentationContract({
    metadata: { presentationContract: { version: '1.0' } },
    browser: { completed: true, issues: [] },
    human: { completed: true, blockers: [], warnings: 'pominięte ostrzeżenie' },
  });

  assert.equal(report.human.status, 'fail');
  assert.equal(report.readyForTeacher, false);
  assert.match(report.human.issues.join('\n'), /human\.warnings musi być tablicą/i);
});
