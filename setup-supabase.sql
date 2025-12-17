-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 SETUP INICIAL - FUNÇÕES PARA ACESSO COMPLETO
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- Execute este SQL no Supabase SQL Editor para habilitar
-- acesso TOTAL via ferramentas CLI
--
-- Project ID: zkcstkbpgwdoiihvfspp
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ Função para executar SQL arbitrário
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

-- 2️⃣ Função para listar tabelas
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

-- 3️⃣ Função para descrever estrutura de tabela
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

-- 4️⃣ Função para contar registros
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

-- 5️⃣ Função para verificar RLS
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

-- 6️⃣ Função para listar policies
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

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ SETUP COMPLETO!
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- Agora você pode usar todas as ferramentas CLI:
-- 
-- node db-query.js list-tables
-- node db-query.js describe users
-- node db-admin.js sql "CREATE TABLE ..."
-- node db-manager.js select users
-- node db-stats.js overview
-- 
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
