import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { useMemory, getSupabaseStatus } from './lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveFrontendDistPath() {
  const candidates = [
    path.join(__dirname, '..', '..', 'frontend', 'build'),
    path.join(process.cwd(), 'build'),
    path.join(process.cwd(), 'frontend', 'build'),
    path.join(process.cwd(), '..', 'frontend', 'build')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }

  return candidates[0];
}

const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (origins.includes('*') || origins.includes(origin)) return callback(null, true);
    try {
      const { hostname } = new URL(origin);
      if (hostname.endsWith('.onrender.com')) return callback(null, true);
    } catch {
      // ignore invalid origin
    }
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

const app = express();
const port = Number(process.env.PORT || 3001);
app.use(express.json({ limit: '1mb' }));

// CORS solo en API; los assets estáticos se sirven same-origin sin validación CORS
app.use('/api', cors(corsOptions));

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = resolveFrontendDistPath();
  const indexExists = fs.existsSync(path.join(frontendDistPath, 'index.html'));
  console.log('Frontend build path:', frontendDistPath);
  console.log('Frontend index.html found:', indexExists);
  if (!indexExists) {
    console.error(
      'No se encontró frontend/build/index.html. Ejecuta "npm run build" en la raíz del proyecto antes de iniciar.'
    );
  }
  
  // Servir archivos estáticos
  app.use(express.static(frontendDistPath, {
    index: 'index.html',
    maxAge: '1h'
  }));
}

// Rutas de API primero
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

// SPA fallback - servir index.html para rutas que no son API (después de las rutas de API)
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = resolveFrontendDistPath();
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          res.status(404).send('Not found');
        }
      });
    }
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

app.listen(port, () => {
  console.log(`API lista en http://localhost:${port}`);
  console.log(`Almacenamiento: ${useMemory ? 'memoria (demo local)' : 'Supabase'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`Frontend servido desde el mismo puerto`);
  }
});