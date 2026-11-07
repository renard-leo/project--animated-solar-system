import { GENERATORS } from './textures.js';

const WORKER_URL = new URL('./texture-worker.js', import.meta.url);

// Répartit la génération des textures sur plusieurs workers ; repli sur le thread principal si les workers échouent
export function createTexturePool(size = Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 2) - 1))) {
    const queue = [];
    const pending = new Map();
    const idle = [];
    let nextId = 0;
    let workers = [];

    const runLocally = (job) => setTimeout(() => job.resolve(GENERATORS[job.type](job.spec)));

    function fallback() {
        workers.forEach((worker) => worker.terminate());
        workers = [];
        idle.length = 0;
        pending.forEach(runLocally);
        pending.clear();
        queue.splice(0).forEach(runLocally);
    }

    function dispatch() {
        while (idle.length && queue.length) {
            const job = queue.shift();
            pending.set(job.id, job);
            idle.pop().postMessage({ id: job.id, type: job.type, spec: job.spec });
        }
        if (!queue.length && !pending.size) {
            workers.forEach((worker) => worker.terminate());
            workers = [];
            idle.length = 0;
        }
    }

    function spawn() {
        try {
            workers = Array.from({ length: size }, () => {
                const worker = new Worker(WORKER_URL, { type: 'module' });
                worker.addEventListener('message', ({ data }) => {
                    const job = pending.get(data.id);
                    pending.delete(data.id);
                    idle.push(worker);
                    job.resolve(data);
                    dispatch();
                });
                worker.addEventListener('error', fallback);
                return worker;
            });
            idle.push(...workers);
        } catch {
            workers = [];
        }
    }

    return {
        generate(type, spec) {
            return new Promise((resolve) => {
                const job = { id: nextId++, type, spec, resolve };
                if (!workers.length && !pending.size) spawn();
                if (!workers.length) return runLocally(job);
                queue.push(job);
                dispatch();
            });
        }
    };
}
