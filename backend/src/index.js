import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { useMemory, getSupabaseStatus } from '../lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3001);
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function(origin, callback) {
      // Permitir requests sin origin (como mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Permitir orígenes configurados
      if (origins.includes(origin)) {
        callback(null, true);
      } else {
        // En desarrollo, permitir cualquier origen
        if (process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'build');
  console.log('Frontend build path:', frontendDistPath);
  
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
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'build');
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