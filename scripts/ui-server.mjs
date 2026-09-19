import { constants } from 'node:fs';
import { open, realpath, readFile, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { listLessons, revisions } from './lesson-catalog.mjs';
import { resolveLessonAction } from './lesson-actions.mjs';
import { listTests, studentTestMarkdown, testRevisions } from './test-catalog.mjs';
import { resolveTestAction } from './test-actions.mjs';
import { createJobQueue } from './local-job-queue.mjs';
import { markdownToHtml } from './print-pack.mjs';
import { decodeRequestPath, resolveWithin } from './safe-paths.mjs';

const MIME = { '.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.md':'text/markdown; charset=utf-8' };
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src 'self' https://www.google.com https://www.youtube-nocookie.com; frame-ancestors 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
};
const truthy = (value) => /^(1|true|yes)$/i.test(String(value || ''));
const send = (res, status, payload) => res.writeHead(status, {...SECURITY_HEADERS,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(JSON.stringify(payload));
function safePublicPath(root, requestPath) {
  const file = resolveWithin(root, `.${requestPath}`);
  const relative = path.relative(root, file).split(path.sep);
  const allowedLesson = relative[0] === 'classes' && !relative.includes('.git') && !relative.includes('feedback.jsonl');
  const allowedTestPdf = relative[0] === 'tests' && relative.length === 3 && relative[2].endsWith('.pdf');
  const allowedTemplate = relative[0] === 'template' && ['reveal','components','presentation','fonts','theme.css'].includes(relative[1]);
  const allowedCatalogGlyph = relative[0] === 'template' && relative[1] === 'assets' && relative[2] === 'presentation-glyphs' && relative.length === 4 && relative[3].endsWith('.svg');
  if (!allowedLesson && !allowedTestPdf && !allowedTemplate && !allowedCatalogGlyph) throw notFound();
  const base = allowedLesson ? path.join(root, 'classes') : allowedTestPdf ? path.join(root, 'tests') : path.join(root, 'template');
  return { base, file };
}
function notFound() { const error = new Error('Not found'); error.statusCode = 404; return error; }
function isWithin(base, candidate) { const relative = path.relative(base, candidate); return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative)); }
async function canonicalPublicFile({ base, file }) {
  try {
    const [realBase, realRequested] = await Promise.all([realpath(base), realpath(file)]);
    if (!isWithin(realBase, realRequested)) throw notFound();
    const details = await stat(realRequested);
    const canonicalFile = details.isDirectory() ? await realpath(path.join(realRequested, 'index.html')) : realRequested;
    if (!isWithin(realBase, canonicalFile)) throw notFound();
    return canonicalFile;
  } catch (error) {
    if (error.statusCode === 404) throw error;
    throw notFound();
  }
}
async function canonicalLessonDirectory(root, lesson) {
  if (typeof lesson !== 'string' || !/^classes\/[4-8]\/[a-z0-9][a-z0-9-]*$/.test(lesson)) {
    const error = new Error('Nieprawidłowa lekcja.'); error.statusCode = 400; throw error;
  }
  const base = path.join(root, 'classes');
  try {
    const [realBase, directory] = await Promise.all([realpath(base), realpath(resolveWithin(root, lesson))]);
    if (!isWithin(realBase, directory) || !(await stat(directory)).isDirectory()) throw notFound();
    return directory;
  } catch (error) {
    if (error.statusCode) throw error;
    throw notFound();
  }
}
async function appendFeedback(directory, entry) {
  const file = path.join(directory, 'feedback.jsonl');
  const flags = constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | constants.O_NOFOLLOW;
  try {
    const handle = await open(file, flags, 0o600);
    try {
      if (!(await handle.stat()).isFile()) throw new Error('Nieprawidłowy plik feedbacku.');
      await handle.write(`${JSON.stringify(entry)}\n`, null, 'utf8');
    } finally {
      await handle.close().catch(() => {});
    }
  } catch (error) {
    console.error('Feedback write failed:', error.code || error.message);
    const safe = new Error('Nie można bezpiecznie zapisać feedbacku.'); safe.statusCode = 500; throw safe;
  }
}
async function readJson(req) { let raw=''; for await (const chunk of req) { raw += chunk; if (raw.length > 16384) throw new Error('Za duże żądanie.'); } return JSON.parse(raw || '{}'); }
function runProcess(spec) { return new Promise((resolve, reject) => { const child=spawn(spec.command,spec.args,{cwd:spec.cwd,shell:false,env:process.env}); let stdout='',stderr=''; child.stdout.on('data',(x)=>stdout+=x); child.stderr.on('data',(x)=>stderr+=x); child.on('error',reject); child.on('close',(code)=> { if(code===0) resolve({stdout,stderr,artifact:spec.artifact}); else reject(new Error((stderr||stdout||`Eksport zakończył się kodem ${code}`).slice(-100000))); }); }); }

export async function createUiServer({ repoRoot = process.cwd(), port = 8182, host = '127.0.0.1', readOnly = false, feedbackEnabled = false }) {
  const root = await realpath(repoRoot);
  const queue = createJobQueue({ run: async (job) => runProcess(job.spec) });
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeRequestPath(req.url);
      if (req.method === 'GET' && pathname === '/healthz') return send(res,200,{status:'ok',readOnly});
      if (req.method === 'GET' && pathname === '/api/config') return send(res,200,{readOnly,feedbackEnabled});
      if (req.method === 'GET' && pathname === '/api/lessons') return send(res,200,await listLessons({repoRoot:root}));
      if (req.method === 'GET' && pathname === '/api/tests') return send(res,200,await listTests({repoRoot:root}));
      if (req.method === 'GET' && pathname === '/api/revisions') {
        const [lessonChanges, testChanges] = await Promise.all([revisions({repoRoot:root}), testRevisions({repoRoot:root})]);
        return send(res,200,{...lessonChanges, testCatalogRevision:testChanges.catalogRevision, testDocumentRevisions:testChanges.documentRevisions});
      }
      if (req.method === 'GET' && pathname === '/api/document') {
        const query = new URL(req.url, 'http://127.0.0.1').searchParams;
        const sources = { worksheet: 'worksheet.md', teacher: 'teacher-guide.md', summary: 'student-summary.md' };
        const kind = query.get('kind'); const lesson = query.get('lesson'); const source = sources[kind];
        if (!source || typeof lesson !== 'string' || !lesson.startsWith('classes/')) throw new Error('Nieprawidłowy materiał.');
        const lessonDirectory = resolveWithin(root, lesson);
        const documentFile = await canonicalPublicFile({
          base: path.join(root, 'classes'),
          file: resolveWithin(lessonDirectory, source),
        });
        const markdown = await readFile(documentFile, 'utf8');
        return send(res, 200, { html: markdownToHtml(markdown), baseUrl: `/${lesson}/` });
      }
      if (req.method === 'GET' && pathname === '/api/test-document') {
        const test = new URL(req.url, 'http://127.0.0.1').searchParams.get('test');
        await resolveTestAction({ repoRoot: root, test, action: 'testPdf' });
        const testFile = await canonicalPublicFile({
          base: path.join(root, 'tests'),
          file: resolveWithin(root, test),
        });
        const markdown = studentTestMarkdown(await readFile(testFile, 'utf8'));
        return send(res, 200, { html: markdownToHtml(markdown) });
      }
      if (req.method === 'POST' && pathname === '/api/feedback') {
        if (!feedbackEnabled) return send(res, 403, { error: 'Zbieranie feedbacku jest wyłączone.' });
        const body = await readJson(req);
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        if (!text || text.length > 4000) return send(res, 400, { error: 'Feedback musi mieć od 1 do 4000 znaków.' });
        const catalog = await listLessons({ repoRoot: root });
        if (!catalog.lessons.some((item) => item.directory === body.lesson)) return send(res, 404, { error: 'Nie znaleziono lekcji.' });
        const lessonDirectory = await canonicalLessonDirectory(root, body.lesson);
        const entry = { lesson: body.lesson, text, createdAt: new Date().toISOString() };
        await appendFeedback(lessonDirectory, entry);
        return send(res, 201, { createdAt: entry.createdAt });
      }
      if (req.method === 'POST' && pathname === '/api/jobs') {
        if (readOnly) return send(res,403,{error:'Panel działa w trybie tylko do podglądu.'});
        const body=await readJson(req);
        const spec = body.test
          ? await resolveTestAction({repoRoot:root,test:body.test,action:body.action})
          : await resolveLessonAction({repoRoot:root,lesson:body.lesson,action:body.action});
        return send(res,202,queue.enqueue({spec,artifact:spec.artifact}));
      }
      if (req.method === 'GET' && pathname.startsWith('/api/jobs/')) { const job=queue.get(pathname.slice('/api/jobs/'.length)); return job ? send(res,200,job) : send(res,404,{error:'Nie znaleziono zadania.'}); }
      const mapped = pathname === '/admin/' || pathname === '/admin' ? '/ui/index.html' : pathname.startsWith('/admin/') ? `/ui/${pathname.slice(7)}` : pathname;
      const requested = mapped.startsWith('/ui/')
        ? { base: path.join(root, 'ui'), file: resolveWithin(root, `.${mapped}`) }
        : safePublicPath(root,mapped);
      const file = await canonicalPublicFile(requested);
      const handle = await open(file, 'r');
      try {
        if (!(await handle.stat()).isFile()) throw notFound();
        res.writeHead(200,{...SECURITY_HEADERS,'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});
        await pipeline(handle.createReadStream({ autoClose: false }), res);
      } finally { await handle.close().catch(() => {}); }
    } catch (error) {
      if (res.headersSent) return res.destroy(error);
      const status = error.statusCode || (error.message === 'Nie znaleziono lekcji.' || error.message === 'Nie znaleziono kartkówki.' ? 404 : 400);
      send(res, status, {error:error.message || 'Błąd serwera.'});
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => { server.off('error', reject); resolve(); });
  });
  return { server, port:server.address().port, host, root, readOnly, feedbackEnabled };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const host = process.env.HOST || '127.0.0.1';
  const readOnly = truthy(process.env.UI_READ_ONLY);
  const feedbackEnabled = truthy(process.env.UI_FEEDBACK_ENABLED);
  try { const { port } = await createUiServer({ port: Number(process.env.PORT || 8182), host, readOnly, feedbackEnabled }); console.log(`Panel lekcji: http://${host}:${port}/admin/${readOnly?' (tylko podgląd)':''}`); }
  catch (error) { if (error.code === 'EADDRINUSE') console.error(`Port ${process.env.PORT || 8182} jest zajęty. Panel może już działać pod http://127.0.0.1:${process.env.PORT || 8182}/admin/; albo uruchom: PORT=8183 npm run ui.`); else console.error(error.message); process.exitCode = 1; }
}
