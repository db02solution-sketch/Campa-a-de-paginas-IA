# Plataforma moldeable de Rifas + Propuestas

Aplicación web para una agencia de contenido que opera landings de rifas configurables por cliente. Incluye captación de leads, propuestas automáticas según interés y gestión de números de rifa (aleatorios o elegibles, estilo [Lotería Nacional / Sorteo Mayor](https://www.nacionalloteria.com/mexico/sorteo-mayor.php) 00001–60000).

Caso piloto inspirado en: [Rifas de Viajes](https://rifasviajesdeotromundo.lovable.app/).

## Stack

- **Frontend:** SvelteKit (Svelte 5)
- **Backend:** Node.js + Express
- **Base de datos:** Supabase (Postgres). Si no configuras Supabase, el API corre en **modo memoria** para desarrollo local.

## Arranque rápido

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- Demo rifa: http://localhost:5173/c/rifas-viajes
- Admin: http://localhost:5173/admin (token por defecto: `dev-admin-token`)
- API health: http://localhost:3001/api/health

## Supabase (DB02.Solution Project)

Proyecto: `ghujkfkyzkikcogwthws`  
URL: https://ghujkfkyzkikcogwthws.supabase.co

### 1. Obtén las API keys

En [Supabase Dashboard](https://supabase.com/dashboard/project/ghujkfkyzkikcogwthws/settings/api) → **Project Settings → API**:

| Variable | Key del dashboard |
|----------|-------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (secret) — solo backend |
| `SUPABASE_ANON_KEY` | **anon / publishable** — frontend |
| `VITE_SUPABASE_ANON_KEY` | mismo valor que `SUPABASE_ANON_KEY` |

Pégalas en el archivo `.env` en la raíz del proyecto.

### 2. Crea las tablas

Opción A — SQL Editor (recomendado):
1. Abre **SQL Editor** en Supabase
2. Pega y ejecuta el contenido de `supabase/schema.sql`

Opción B — CLI:
```bash
npx supabase login
npx supabase link --project-ref ghujkfkyzkikcogwthws
npx supabase db push
```

### 2.1. Configura autenticación de admins

El schema incluye la tabla `admin_users` para autenticación real. Opciones:

**Modo desarrollo (token simple):**
- Usa el header `x-admin-token: dev-admin-token` (o tu `ADMIN_TOKEN` del .env)

**Modo producción (Supabase Auth):**
1. En Supabase Dashboard → Authentication → Enable email provider
2. Crea usuarios en la tabla `admin_users` vinculados a `auth.users`
3. Usa `Authorization: Bearer <supabase_jwt_token>` en los headers
4. Para crear el admin inicial: `POST /api/admin/setup-initial-admin`

### 3. Verifica la conexión

```bash
npm run supabase:test
```

Deberías ver: `✅ Supabase conectado correctamente`

### 4. Reinicia el backend

```bash
npm run dev:backend
```

En `/api/health` debe aparecer `"storage": "supabase"`.

## Funciones principales

1. **Campañas moldeables**  
   Cada cliente puede tener su landing (`/c/:slug`) con marca, copy, destinos, paquetes, tema y reglas de numeración.

2. **Captación de contacto**  
   Formulario público: nombre, WhatsApp, correo, ciudad, destino, canal e interés.

3. **Propuesta automática**  
   El backend recomienda un paquete según el score de interés y genera un mensaje comercial listo para WhatsApp.

4. **Números de rifa**  
   - Aleatorios del pool disponible  
   - O selección manual de números estilo Lotería Nacional  
   Configurable por campaña: `random` | `pick` | `both`

5. **Solicitudes de agencia**  
   En la home (`/`) se recaban datos de nuevos clientes para armar propuestas de servicio (rifas, contenido o ambos).

## Estructura

```
backend/          API Express
frontend/         SvelteKit
supabase/         schema.sql
```

## API útil

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/campaigns/:slug` | Landing pública |
| GET | `/api/campaigns/:slug/numbers` | Números disponibles |
| POST | `/api/campaigns/:slug/leads` | Lead + propuesta |
| POST | `/api/agency/inquiries` | Solicitud a la agencia |
| GET | `/api/admin/dashboard` | Resumen (requiere auth) |
| GET | `/api/admin/admins` | Lista de admins (requiere auth) |
| POST | `/api/admin/admins` | Crear admin (requiere auth) |
| PATCH | `/api/admin/admins/:id` | Actualizar admin (requiere auth) |
| DELETE | `/api/admin/admins/:id` | Eliminar admin (requiere auth) |
| POST | `/api/admin/setup-initial-admin` | Crear admin inicial (requiere auth) |

## Siguiente evolución sugerida

- ✅ Auth real de admin con Supabase Auth (IMPLEMENTADO)
- Pagos (Stripe/Mercado Pago) al aceptar propuesta
- Plantillas de landing por vertical (viajes, autos, gadgets)
- Webhook a WhatsApp Business API
- Publicación multi-tenant por dominio personalizado