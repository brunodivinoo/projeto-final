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

async function listTables() {
  try {
    // Usar SQL direto via RPC
    const { data, error } = await supabase.rpc('list_tables_custom');
    
    if (error && error.message.includes('function')) {
      console.log('📋 Criando função list_tables_custom no banco...\n');
      console.log('Execute este SQL no Supabase SQL Editor:\n');
      console.log(`
CREATE OR REPLACE FUNCTION list_tables_custom()
RETURNS TABLE(table_name text) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tablename::text 
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY tablename;
$$;
      `);
      return;
    }
    
    if (error) throw error;
    
    console.log('📋 Tabelas no banco de dados:\n');
    if (data && data.length > 0) {
      data.forEach(table => console.log(`  - ${table.table_name}`));
      console.log(`\n✅ Total: ${data.length} tabelas`);
    } else {
      console.log('  (nenhuma tabela criada ainda)');
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function describeTable(tableName) {
  try {
    const { data, error } = await supabase.rpc('describe_table_custom', {
      table_name_param: tableName
    });
    
    if (error && error.message.includes('function')) {
      console.log('📋 Criando função describe_table_custom no banco...\n');
      console.log('Execute este SQL no Supabase SQL Editor:\n');
      console.log(`
CREATE OR REPLACE FUNCTION describe_table_custom(table_name_param text)
RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    column_name::text,
    data_type::text,
    is_nullable::text,
    column_default::text
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = table_name_param
  ORDER BY ordinal_position;
$$;
      `);
      return;
    }
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log(`❌ Tabela "${tableName}" não encontrada`);
      return;
    }
    
    console.log(`\n📊 Estrutura da tabela "${tableName}":\n`);
    console.log('┌─────────────────────┬──────────────┬──────────┬─────────────┐');
    console.log('│ Coluna              │ Tipo         │ Nullable │ Default     │');
    console.log('├─────────────────────┼──────────────┼──────────┼─────────────┤');
    
    data.forEach(col => {
      const colName = col.column_name.padEnd(19);
      const dataType = col.data_type.padEnd(12);
      const nullable = col.is_nullable.padEnd(8);
      const def = (col.column_default || '').substring(0, 11).padEnd(11);
      console.log(`│ ${colName} │ ${dataType} │ ${nullable} │ ${def} │`);
    });
    
    console.log('└─────────────────────┴──────────────┴──────────┴─────────────┘');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'list-tables':
    listTables();
    break;
  case 'describe':
    if (!arg) {
      console.log('❌ Uso: node db-query.js describe [nome_tabela]');
      process.exit(1);
    }
    describeTable(arg);
    break;
  default:
    console.log('Uso: node db-query.js [comando] [argumentos]');
    console.log('\nComandos disponíveis:');
    console.log('  list-tables              Lista todas as tabelas');
    console.log('  describe [tabela]        Mostra estrutura da tabela');
    process.exit(1);
}
