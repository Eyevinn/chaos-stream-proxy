import fastify from 'fastify';
import { registerRoutes } from './routes';
import FastifyCors from 'fastify-cors';

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const INTERFACE: string = process.env.INTERFACE || '0.0.0.0';

// App
const app = fastify();
app.register(FastifyCors, {});

// Routes
registerRoutes(app);

// Start
app.listen(PORT, INTERFACE, (err, address) => {
  if (err) throw err;
  console.log('\nChaos Stream Proxy listening on:', address, '\n');
});
