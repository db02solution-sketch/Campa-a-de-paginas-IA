import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, 'backend', '.env') });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('\n❌ Faltan credenciales en .env');
  console.error('   1. Abre Supabase → Project Settings → API');
  console.error('   2. Copia "service_role" (secret) → SUPABASE_SERVICE_ROLE_KEY');
  console.error('   3. Copia "anon/public" o "publishable" → SUPABASE_ANON_KEY y VITE_SUPABASE_ANON_KEY\n');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

console.log(`\n🔌 Probando conexión con ${url} ...`);

const { data, error } = await supabase.from('campaigns').select('id, slug').limit(1);

if (error) {
  if (error.message.includes('does not exist') || error.code === '42P01') {
    console.log('\n⚠️  Las tablas aún no existen.');
    console.log('   Ejecuta el schema en Supabase → SQL Editor:');
    console.log(`   Archivo: ${path.join(root, 'supabase', 'schema.sql')}\n`);
    console.log('   O con CLI (después de supabase login):');
    console.log('   npx supabase link --project-ref ghujkfkyzkikcogwthws');
    console.log('   npx supabase db push\n');
    process.exit(2);
  }
  console.error('\n❌ Error de conexión:', error.message);
  process.exit(1);
}

console.log('✅ Supabase conectado correctamente');
console.log(`   Campañas en DB: ${data?.length ?? 0} fila(s) de prueba`);

const schemaPath = path.join(root, 'supabase', 'schema.sql');
if (fs.existsSync(schemaPath)) {
  console.log(`\n📄 Schema listo en: supabase/schema.sql`);
}

console.log('\nReinicia el backend para usar Supabase: npm run dev:backend\n');
