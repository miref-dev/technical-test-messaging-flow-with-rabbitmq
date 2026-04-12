import { Elysia } from 'elysia';
import { startWorker } from './lib/worker';

await startWorker();

const app = new Elysia()
  .get('/health', () => ({ status: 'ok' }))
  .listen(3002);

console.log(`
╔═══════════════════════════════════════════╗
║   🔷 MessageFlow Worker Service (Bun)     ║
║   Port      → 3002                        ║
║   RabbitMQ  → Connected                   ║
╚═══════════════════════════════════════════╝
`);