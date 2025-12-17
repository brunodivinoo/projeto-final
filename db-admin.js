#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function executeSQL(sql) {
  try {
    console.log('🔄 Executando SQL...\n');
    
    // Usar SQL direto via RPC
    const { data, error } = await supabase.rpc('exec_sql_custom', {
      query: sql
    });
    
    if (error && error.message.includes('function')) {
      console.log('📋 Criando função exec_sql_custom no banco...\n');
      console.log('⚠️  IMPORTANTE: Execute este SQL PRIMEIRO no Supabase SQL Editor:\n');
      console.log(`
-- Função para executar SQL arbitrário (ADMIN ONLY)
CREATE OR REPLACE FUNCTION exec_sql_custom(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query;
  RETURN jsonb_build_object('success', true, 'message', 'SQL executado com sucesso');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Garantir que apenas service_role pode executar
GRANT EXECUTE ON FUNCTION exec_sql_custom(text) TO service_role;
      `);
      console.log('\n✅ Após executar o SQL acima, rode o comando novamente!');
      return;
    }
    
    if (error) throw error;
    
    console.log('✅ SQL executado com sucesso!');
    if (data) {
      console.log('📊 Resultado:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Erro ao executar SQL:', err.message);
  }
}

const command = process.argv[2];
const sql = process.argv[3];

if (command === 'sql' && sql) {
  executeSQL(sql);
} else {
  console.log('Uso: node db-admin.js sql "SEU SQL AQUI"');
  console.log('\nExemplos:');
  console.log('  node db-admin.js sql "CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL)"');
  console.log('  node db-admin.js sql "ALTER TABLE users ADD COLUMN email text"');
  console.log('  node db-admin.js sql "ALTER TABLE users ENABLE ROW LEVEL SECURITY"');
  console.log('  node db-admin.js sql "CREATE POLICY users_policy ON users FOR ALL USING (auth.uid() = user_id)"');
  process.exit(1);
}
