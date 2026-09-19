export const PRESENTATION_CONTRACT_VERSION = '1.0';

export const PRESENTATION_CONTRACT_RULES = Object.freeze([
  'GOV-SCOPE-001',
  'GOV-EXCEPTIONS-001',
  'STYLE-AGE-001',
  'STYLE-PALETTE-001',
  'VISUAL-OPENING-001',
  'VISUAL-PURPOSE-001',
  'A11Y-VISUAL-001',
  'A11Y-SEMANTICS-001',
  'A11Y-INTERACTION-001',
  'A11Y-MEDIA-001',
  'TYPE-SCALE-001',
  'TYPE-NOWRAP-001',
  'MAP-DISPLAY-001',
  'MEDIA-LIGHTBOX-001',
  'MEDIA-CAPTION-001',
  'SOURCE-DISPLAY-001',
  'SOURCE-TASK-001',
  'LAYOUT-SPACE-001',
  'FLOW-TIME-001',
  'FLOW-ALIGNMENT-001',
  'TASK-INSTRUCTION-001',
  'TASK-ANSWER-001',
  'REVIEW-PACKAGE-001',
  'STATUS-READY-001',
  'STATUS-EXPORT-001',
]);

const RULES = new Set(PRESENTATION_CONTRACT_RULES);
const SCOPE_KINDS = new Set(['lesson', 'slide', 'element']);
const EXCEPTION_KEYS = new Set(['rule', 'contractVersion', 'scope', 'reason', 'compensation']);
const SCOPE_KEYS = Object.freeze({
  lesson: new Set(['kind']),
  slide: new Set(['kind', 'slide']),
  element: new Set(['kind', 'slide', 'id']),
});

function nonEmptyText(value) {
  return typeof value === 'string' && Boolean(value.trim());
}

function isNonWaivable(rule) {
  return typeof rule === 'string' && (rule.startsWith('A11Y-') || rule === 'TYPE-SCALE-001');
}

function validateException(candidate, index, { version, slideIds, elementIds, elementTargets }) {
  const label = `Wyjątek ${index + 1}`;
  const issues = [];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { issues: [`${label} musi być obiektem.`], valid: false };
  }

  for (const key of Object.keys(candidate)) {
    if (!EXCEPTION_KEYS.has(key)) issues.push(`${label}: nieobsługiwane pole „${key}”.`);
  }

  if (!RULES.has(candidate.rule)) issues.push(`${label}: nieznana reguła „${candidate.rule ?? 'brak'}”.`);
  if (isNonWaivable(candidate.rule)) issues.push(`${label}: reguła niewyłączalna nie może mieć wyjątku: ${candidate.rule}.`);
  if (candidate.contractVersion !== version) {
    issues.push(`${label}: wersja wyjątku „${candidate.contractVersion ?? 'brak'}” nie odpowiada wersji kontraktu „${version ?? 'brak'}”.`);
  }

  const scope = candidate.scope;
  if (!scope || typeof scope !== 'object' || Array.isArray(scope) || !SCOPE_KINDS.has(scope.kind)) {
    issues.push(`${label}: scope.kind musi mieć wartość lesson, slide albo element.`);
  } else {
    for (const key of Object.keys(scope)) {
      if (!SCOPE_KEYS[scope.kind].has(key)) issues.push(`${label}: scope ma nieobsługiwane pole „${key}”.`);
    }
    if (scope.kind !== 'lesson' && !nonEmptyText(scope.slide)) issues.push(`${label}: scope.slide jest wymagane dla zakresu ${scope.kind}.`);
    if (scope.kind === 'element' && !nonEmptyText(scope.id)) issues.push(`${label}: scope.id jest wymagane dla zakresu element.`);
    const targetExists = Array.isArray(elementTargets)
      ? elementTargets.some((target) => target.slide === scope.slide && target.id === scope.id)
      : Array.isArray(elementIds) && elementIds.includes(scope.id);
    if (scope.kind === 'element' && nonEmptyText(scope.id) && (Array.isArray(elementTargets) || Array.isArray(elementIds)) && !targetExists) {
      issues.push(`${label}: element „${scope.id}” nie istnieje na slajdzie „${scope.slide}”.`);
    }
    if (scope.kind !== 'lesson' && nonEmptyText(scope.slide) && Array.isArray(slideIds) && !slideIds.includes(scope.slide)) {
      issues.push(`${label}: slajd „${scope.slide}” nie istnieje.`);
    }
  }

  if (!nonEmptyText(candidate.reason)) issues.push(`${label}: wymagane jest uzasadnienie.`);
  if (!nonEmptyText(candidate.compensation)) issues.push(`${label}: wymagany jest środek kompensujący.`);
  return { issues, valid: issues.length === 0 };
}

function reviewGate(review, issueField, gateName) {
  if (review?.completed !== true) return { status: 'pending', issues: [] };
  if (!Array.isArray(review[issueField])) {
    return { status: 'fail', issues: [`${gateName}.${issueField} musi być tablicą.`] };
  }
  const issues = review[issueField];
  return { status: issues.length === 0 ? 'pass' : 'fail', issues };
}

export function inspectPresentationContract({ metadata, slideIds, elementIds, elementTargets, staticIssues = [], browser, human } = {}) {
  const configured = metadata?.presentationContract;
  if (configured === undefined) {
    return {
      applicable: false,
      version: null,
      readyForTeacher: false,
      static: { status: 'skipped', issues: [] },
      browser: { status: 'skipped', issues: [] },
      human: { status: 'skipped', issues: [], warnings: [] },
      exceptions: { active: [] },
    };
  }

  const issues = Array.isArray(staticIssues) ? [...staticIssues] : ['staticIssues musi być tablicą.'];
  if (!configured || typeof configured !== 'object' || Array.isArray(configured)) {
    issues.push('presentationContract musi być obiektem.');
  } else {
    if (configured.version !== PRESENTATION_CONTRACT_VERSION) {
      issues.push(`Nieobsługiwana wersja kontraktu „${configured.version ?? 'brak'}”; oczekiwano ${PRESENTATION_CONTRACT_VERSION}.`);
    }
    if (Object.hasOwn(configured, 'readyForTeacher')) {
      issues.push('presentationContract.readyForTeacher jest wynikiem wyliczanym i nie może być zapisany w metadata.json.');
    }
  }

  const configuredExceptions = metadata?.contractExceptions;
  const candidates = configuredExceptions === undefined ? [] : configuredExceptions;
  if (!Array.isArray(candidates)) issues.push('contractExceptions musi być tablicą.');
  const active = [];
  if (Array.isArray(candidates)) {
    for (const [index, candidate] of candidates.entries()) {
      const result = validateException(candidate, index, {
        version: configured?.version,
        slideIds,
        elementIds,
        elementTargets,
      });
      issues.push(...result.issues);
      if (result.valid) active.push(candidate);
    }
  }

  const staticGate = { status: issues.length === 0 ? 'pass' : 'fail', issues };
  const browserGate = reviewGate(browser, 'issues', 'browser');
  const humanReviewGate = reviewGate(human, 'blockers', 'human');
  const humanIssues = [...humanReviewGate.issues];
  if (human?.completed === true && human.warnings !== undefined && !Array.isArray(human.warnings)) {
    humanIssues.push('human.warnings musi być tablicą.');
  }
  const humanGate = {
    status: humanIssues.length === 0 ? humanReviewGate.status : 'fail',
    issues: humanIssues,
    warnings: Array.isArray(human?.warnings) ? human.warnings : [],
  };
  const readyForTeacher = [staticGate, browserGate, humanGate].every((gate) => gate.status === 'pass');

  return {
    applicable: true,
    version: configured?.version ?? null,
    readyForTeacher,
    static: staticGate,
    browser: browserGate,
    human: humanGate,
    exceptions: { active },
  };
}
