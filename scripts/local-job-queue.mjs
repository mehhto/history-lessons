import { randomUUID } from 'node:crypto';

export function createJobQueue({ run }) {
  const jobs = new Map(); let running = false;
  async function next() {
    if (running) return;
    const job = [...jobs.values()].find((item) => item.status === 'queued');
    if (!job) return;
    running = true; job.status = 'running'; job.startedAt = Date.now();
    try { Object.assign(job, await run(job), { status: 'succeeded', finishedAt: Date.now() }); }
    catch (error) { job.status = 'failed'; job.error = error.message; job.finishedAt = Date.now(); }
    finally { running = false; queueMicrotask(next); }
  }
  return {
    enqueue(input) { const job = { id: randomUUID(), ...input, status: 'queued', createdAt: Date.now(), stdout: '', stderr: '' }; jobs.set(job.id, job); queueMicrotask(next); return structuredClone(job); },
    get(id) { const job = jobs.get(id); return job && structuredClone(job); },
  };
}
