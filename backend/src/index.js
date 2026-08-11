import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { useMemory, getSupabaseStatus } from './lib/supabase.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'rifas-plataforma-api',
    storage: useMemory ? 'memory' : 'supabase',
    supabase: getSupabaseStatus(),
    time: new Date().toISOString()
  });
});

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

app.listen(port, () => {
  console.log(`API lista en http://localhost:${port}`);
  console.log(`Almacenamiento: ${useMemory ? 'memoria (demo local)' : 'Supabase'}`);
});