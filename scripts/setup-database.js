import './loadEnv.js';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en .env');
  process.exit(1);
}

console.log('🔗 Conectando a Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('📄 Leyendo schema.sql...');
    const schemaPath = join(__dirname, '..', 'supabase', 'schema.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf-8');
    
    console.log('⚡ Ejecutando schema en Supabase...');
    
    // Dividir el SQL en statements individuales
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`❌ Error en statement: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        // Try direct SQL execution via REST API
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: statement })
          });
          
          if (!response.ok) {
            console.error(`❌ Error ejecutando SQL: ${await response.text()}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (fetchErr) {
          console.error(`❌ Error en statement: ${fetchErr.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`✅ Setup completado: ${successCount} statements exitosos, ${errorCount} errores`);
    
    // Verificar conexión
    console.log('🔍 Verificando tablas...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('❌ Error verificando tablas:', tablesError.message);
    } else {
      console.log('📊 Tablas creadas:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  }
}

setupDatabase().then(() => {
  console.log('🎉 Setup de base de datos completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
