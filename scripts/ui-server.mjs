import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { listLessons, revisions } from './lesson-catalog.mjs';
import { resolveLessonAction } from './lesson-actions.mjs';
import { createJobQueue } from './local-job-queue.mjs';
import { decodeRequestPath, resolveWithin } from './safe-paths.mjs';

const MIME = { '.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.md':'text/markdown; charset=utf-8' };
const send = (res, status, payload) => res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(JSON.stringify(payload));
function safePublicPath(root, requestPath) {
  const file = resolveWithin(root, `.${requestPath}`);
  const relative = path.relative(root, file).split(path.sep);
  const allowed = (relative[0] === 'classes' && !relative.includes('.git')) || (relative[0] === 'template' && ['reveal','components','presentation','fonts','theme.css'].includes(relative[1]));
  if (!allowed) throw new Error('Blocked');
  return file;
}
async function readJson(req) { let raw=''; for await (const chunk of req) { raw += chunk; if (raw.length > 16384) throw new Error('Za duże żądanie.'); } return JSON.parse(raw || '{}'); }
function runProcess(spec) { return new Promise((resolve, reject) => { const child=spawn(spec.command,spec.args,{cwd:spec.cwd,shell:false,env:process.env}); let stdout='',stderr=''; child.stdout.on('data',(x)=>stdout+=x); child.stderr.on('data',(x)=>stderr+=x); child.on('error',reject); child.on('close',(code)=> { if(code===0) resolve({stdout,stderr,artifact:spec.artifact}); else reject(new Error((stderr||stdout||`Eksport zakończył się kodem ${code}`).slice(-100000))); }); }); }

export async function createUiServer({ repoRoot = process.cwd(), port = 8182 }) {
  const root = await realpath(repoRoot);
  const queue = createJobQueue({ run: async (job) => runProcess(await resolveLessonAction({ repoRoot: root, lesson: job.lesson, action: job.action })) });
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeRequestPath(req.url);
      if (req.method === 'GET' && pathname === '/api/lessons') return send(res,200,await listLessons({repoRoot:root}));
      if (req.method === 'GET' && pathname === '/api/revisions') return send(res,200,await revisions({repoRoot:root}));
      if (req.method === 'POST' && pathname === '/api/jobs') { const body=await readJson(req); await resolveLessonAction({repoRoot:root,lesson:body.lesson,action:body.action}); return send(res,202,queue.enqueue({lesson:body.lesson,action:body.action})); }
      if (req.method === 'GET' && pathname.startsWith('/api/jobs/')) { const job=queue.get(pathname.slice('/api/jobs/'.length)); return job ? send(res,200,job) : send(res,404,{error:'Nie znaleziono zadania.'}); }
      const mapped = pathname === '/admin/' || pathname === '/admin' ? '/ui/index.html' : pathname.startsWith('/admin/') ? `/ui/${pathname.slice(7)}` : pathname;
      const requested = mapped.startsWith('/ui/') ? resolveWithin(root, `.${mapped}`) : safePublicPath(root,mapped);
      const details = await stat(requested); const file = details.isDirectory()?path.join(requested,'index.html'):requested;
      if (!(await stat(file)).isFile()) throw new Error('Not found');
      res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'}); createReadStream(file).pipe(res);
    } catch (error) { send(res, error.message === 'Nie znaleziono lekcji.' ? 404 : 400, {error:error.message || 'Błąd serwera.'}); }
  });
  await new Promise((resolve)=>server.listen(port,'127.0.0.1',resolve));
  return { server, port:server.address().port, root };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const { port } = await createUiServer({ port: Number(process.env.PORT || 8182) });
    console.log(`Panel lekcji: http://127.0.0.1:${port}/admin/`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') throw new Error(`Port ${process.env.PORT || 8182} jest zajęty. Uruchom panel na innym porcie, np. PORT=8183 npm run ui.`);
    throw error;
  }
}
