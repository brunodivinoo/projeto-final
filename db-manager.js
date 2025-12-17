#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function selectData(tableName, filters = {}, columns = '*') {
  try {
    let query = supabase.from(tableName).select(columns);
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log(`\n📊 Dados da tabela "${tableName}":\n`);
    console.log(JSON.stringify(data, null, 2));
    console.log(`\n✅ ${data.length} registros encontrados`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function insertData(tableName, data) {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) throw error;
    
    console.log('✅ Registro inserido com sucesso!');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function updateData(tableName, filters, updates) {
  try {
    let query = supabase.from(tableName).update(updates);
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query.select();
    
    if (error) throw error;
    
    console.log('✅ Registro(s) atualizado(s) com sucesso!');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function deleteData(tableName, filters) {
  try {
    let query = supabase.from(tableName).delete();
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query.select();
    
    if (error) throw error;
    
    console.log('✅ Registro(s) deletado(s) com sucesso!');
    console.log(`📊 ${data.length} registros removidos`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const command = process.argv[2];
const tableName = process.argv[3];
const jsonArg = process.argv[4];

switch (command) {
  case 'select':
    if (!tableName) {
      console.log('❌ Uso: node db-manager.js select [tabela] [filtros_json]');
      process.exit(1);
    }
    const filters = jsonArg ? JSON.parse(jsonArg) : {};
    selectData(tableName, filters);
    break;
    
  case 'insert':
    if (!tableName || !jsonArg) {
      console.log('❌ Uso: node db-manager.js insert [tabela] \'{"coluna": "valor"}\'');
      process.exit(1);
    }
    insertData(tableName, JSON.parse(jsonArg));
    break;
    
  case 'update':
    if (!tableName || !jsonArg || !process.argv[5]) {
      console.log('❌ Uso: node db-manager.js update [tabela] \'{"id": "1"}\' \'{"coluna": "novo_valor"}\'');
      process.exit(1);
    }
    updateData(tableName, JSON.parse(jsonArg), JSON.parse(process.argv[5]));
    break;
    
  case 'delete':
    if (!tableName || !jsonArg) {
      console.log('❌ Uso: node db-manager.js delete [tabela] \'{"id": "1"}\'');
      process.exit(1);
    }
    deleteData(tableName, JSON.parse(jsonArg));
    break;
    
  default:
    console.log('Uso: node db-manager.js [comando] [argumentos]');
    console.log('\nComandos disponíveis:');
    console.log('  select [tabela] [filtros_json]              Buscar registros');
    console.log('  insert [tabela] \'{"dados": "valor"}\'        Inserir registro');
    console.log('  update [tabela] \'{"filtro"}\' \'{"update"}\'  Atualizar registro');
    console.log('  delete [tabela] \'{"filtro"}\'                Deletar registro');
    process.exit(1);
}
