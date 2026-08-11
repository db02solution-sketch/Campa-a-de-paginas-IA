# Configuración para Render - Monorepo Completo

## 🎯 Configuración en Render

### Root Directory
**Dejar vacío** (root del repositorio)

### Build Command
```bash
npm install && cd frontend && npm install && npm run build && cd ..
```

### Start Command
```bash
cd backend && npm start
```

## 📋 Variables de Entorno (Environment Variables)

```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=*
SUPABASE_URL=https://ghujkfkyzkikcogwthws.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SUPABASE_ANON_KEY=tu_anon_key
ADMIN_TOKEN=tu_admin_token_seguro
```

## 🔧 Cambios Realizados

1. **Backend ahora sirve el frontend** en producción (archivos estáticos)
2. **SvelteKit configurado** con adapter-static para build estático
3. **Scripts de build** optimizados para Render
4. **SPA routing** configurado para todas las rutas no-API
5. **Middleware reordenado** para procesar rutas de API primero
6. **Manejo de errores** mejorado al servir archivos estáticos

## 🚀 Estructura del Despliegue

- **Render Web Service** → Sirve backend + frontend
- **Backend (Express)** → API en /api/*
- **Frontend (SvelteKit)** → Servido como archivos estáticos desde /build
- **SPA fallback** → Todas las rutas no-API sirven index.html

## 📱 URLs después del despliegue

- **Aplicación completa:** https://tu-app.onrender.com
- **API:** https://tu-app.onrender.com/api/*
- **Dashboard:** https://tu-app.onrender.com/admin
- **Landing:** https://tu-app.onrender.com/

## ⚠️ Importante

1. **Ejecuta el schema SQL** en Supabase antes del despliegue
2. **Configura las variables de entorno** en Render
3. **Build verificado** ✅ - Funciona localmente
4. **Frontend build** ✅ - Archivos en /frontend/build
5. **Despliega de nuevo** después de estos cambios
