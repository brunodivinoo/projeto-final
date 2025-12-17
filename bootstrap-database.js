#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('🚀 BOOTSTRAP DO BANCO DE DADOS SUPABASE\n');
console.log('Este script vai criar todas as funções necessárias automaticamente!\n');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const functions = [
  {
    name: 'exec_sql_custom',
    sql: `
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
GRANT EXECUTE ON FUNCTION exec_sql_custom(text) TO service_role;
    `
  },
  {
    name: 'list_tables_custom',
    sql: `
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
GRANT EXECUTE ON FUNCTION list_tables_custom() TO service_role;
    `
  },
  {
    name: 'describe_table_custom',
    sql: `
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
GRANT EXECUTE ON FUNCTION describe_table_custom(text) TO service_role;
    `
  },
  {
    name: 'count_table_rows',
    sql: `
CREATE OR REPLACE FUNCTION count_table_rows(table_name_param text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  row_count bigint;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name_param) INTO row_count;
  RETURN row_count;
END;
$$;
GRANT EXECUTE ON FUNCTION count_table_rows(text) TO service_role;
    `
  },
  {
    name: 'check_rls_status',
    sql: `
CREATE OR REPLACE FUNCTION check_rls_status(table_name_param text)
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  force_rls boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    tablename::text,
    rowsecurity,
    COALESCE(relforcerowsecurity, false) as force_rls
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE schemaname = 'public'
    AND tablename = table_name_param;
$$;
GRANT EXECUTE ON FUNCTION check_rls_status(text) TO service_role;
    `
  },
  {
    name: 'list_policies_custom',
    sql: `
CREATE OR REPLACE FUNCTION list_policies_custom(table_name_param text)
RETURNS TABLE(
  policy_name text,
  policy_command text,
  policy_roles text[],
  policy_qual text,
  policy_with_check text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    policyname::text,
    cmd::text,
    roles::text[],
    qual::text,
    with_check::text
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = table_name_param;
$$;
GRANT EXECUTE ON FUNCTION list_policies_custom(text) TO service_role;
    `
  }
];

async function createFunction(name, sql) {
  try {
    // Usar REST API do Supabase para executar SQL
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql_custom`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: sql })
      }
    );

    if (response.ok) {
      console.log(`✅ Função ${name} criada com sucesso!`);
      return true;
    } else {
      // Se a função exec_sql_custom não existe, use o Management API
      console.log(`⚠️  Tentando método alternativo para ${name}...`);
      
      const mgmtResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ query: sql })
        }
      );
      
      if (mgmtResponse.ok) {
        console.log(`✅ Função ${name} criada com sucesso!`);
        return true;
      } else {
        console.log(`❌ Não foi possível criar ${name} automaticamente`);
        return false;
      }
    }
  } catch (err) {
    console.log(`❌ Erro ao criar ${name}:`, err.message);
    return false;
  }
}

async function bootstrap() {
  console.log('📡 Conectando ao Supabase...\n');
  
  let allSuccess = true;
  
  for (const func of functions) {
    const success = await createFunction(func.name, func.sql);
    if (!success) allSuccess = false;
  }
  
  console.log('\n' + '━'.repeat(60));
  
  if (allSuccess) {
    console.log('✅ BOOTSTRAP COMPLETO!');
    console.log('\nTodas as funções foram criadas com sucesso!');
    console.log('\n🎯 Agora você pode usar:');
    console.log('  - node db-query.js list-tables');
    console.log('  - node db-admin.js sql "CREATE TABLE ..."');
    console.log('  - node db-manager.js select [tabela]');
    console.log('  - E todas as outras ferramentas!');
  } else {
    console.log('⚠️  BOOTSTRAP PARCIALMENTE CONCLUÍDO');
    console.log('\nAlgumas funções não puderam ser criadas automaticamente.');
    console.log('\n📋 Execute o arquivo setup-supabase.sql manualmente:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/zkcstkbpgwdoiihvfspp/sql/new');
    console.log('2. Cole o conteúdo de setup-supabase.sql');
    console.log('3. Clique em RUN');
  }
  
  console.log('━'.repeat(60) + '\n');
}

bootstrap();
