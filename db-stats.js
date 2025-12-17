#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTableStats(tableName) {
  try {
    // Count total
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    console.log(`\n📊 Estatísticas da tabela "${tableName}":\n`);
    console.log(`Total de registros: ${count}`);
    
    // Get recent data
    const { data, error } = await supabase
      .from(tableName)
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!error && data && data.length > 0) {
      console.log(`Último registro: ${new Date(data[0].created_at).toLocaleString('pt-BR')}`);
    }
    
    console.log('\n✅ Estatísticas coletadas');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function getDatabaseSize() {
  try {
    const { data, error } = await supabase.rpc('pg_database_size', {
      database: 'postgres'
    });
    
    if (error) {
      console.log('ℹ️  Para obter tamanho do banco, crie a função:');
      console.log('CREATE OR REPLACE FUNCTION pg_database_size(database text)');
      console.log('RETURNS bigint AS $$');
      console.log('  SELECT pg_database_size(current_database());');
      console.log('$$ LANGUAGE sql;');
      return;
    }
    
    const sizeMB = (data / 1024 / 1024).toFixed(2);
    console.log(`\n💾 Tamanho do banco de dados: ${sizeMB} MB\n`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function getActiveConnections() {
  try {
    console.log('\nℹ️  Informações de conexão:');
    console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`Projeto: ${process.env.SUPABASE_PROJECT_ID || 'zkcstkbpgwdoiihvfspp'}`);
    console.log('\n✅ Cliente conectado com sucesso');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function getTableList() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) throw error;
    
    console.log('\n📋 Resumo do banco:\n');
    console.log(`Total de tabelas: ${data.length}`);
    console.log('\nTabelas:');
    data.forEach(table => console.log(`  - ${table.table_name}`));
    console.log('\n✅ Listagem completa');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'table':
    if (!arg) {
      console.log('❌ Uso: node db-stats.js table [nome_tabela]');
      process.exit(1);
    }
    getTableStats(arg);
    break;
    
  case 'size':
    getDatabaseSize();
    break;
    
  case 'connections':
    getActiveConnections();
    break;
    
  case 'overview':
    getTableList();
    break;
    
  default:
    console.log('Uso: node db-stats.js [comando] [argumentos]');
    console.log('\nComandos disponíveis:');
    console.log('  table [nome]      Estatísticas de uma tabela');
    console.log('  size              Tamanho do banco de dados');
    console.log('  connections       Conexões ativas');
    console.log('  overview          Visão geral do banco');
    process.exit(1);
}
