#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backupTable(tableName, format = 'json') {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) throw error;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup_${tableName}_${timestamp}.${format}`;
    
    let content;
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        if (data.length === 0) {
          content = '';
        } else {
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map(row => 
            Object.values(row).map(v => 
              typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
            ).join(',')
          ).join('\n');
          content = `${headers}\n${rows}`;
        }
        break;
      case 'sql':
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        const inserts = data.map(row => {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            return val;
          }).join(', ');
          return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
        }).join('\n');
        content = inserts;
        break;
      default:
        throw new Error('Formato inválido. Use: json, csv ou sql');
    }
    
    fs.writeFileSync(fileName, content);
    
    console.log('✅ Backup criado com sucesso!');
    console.log(`📁 Arquivo: ${fileName}`);
    console.log(`📊 Registros: ${data.length}`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function backupAllTables(format = 'json') {
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) throw error;
    
    console.log(`\n🔄 Iniciando backup de ${tables.length} tabelas...\n`);
    
    for (const table of tables) {
      console.log(`Backup de ${table.table_name}...`);
      await backupTable(table.table_name, format);
    }
    
    console.log('\n✅ Backup completo finalizado!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function restoreFromJSON(tableName, filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('O arquivo deve conter um array de objetos');
    }
    
    console.log(`\n🔄 Restaurando ${data.length} registros em "${tableName}"...\n`);
    
    const { error } = await supabase
      .from(tableName)
      .insert(data);
    
    if (error) throw error;
    
    console.log('✅ Dados restaurados com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const command = process.argv[2];

switch (command) {
  case 'table':
    const tableName = process.argv[3];
    const format = process.argv[4] || 'json';
    if (!tableName) {
      console.log('❌ Uso: node db-backup.js table [nome_tabela] [json|csv|sql]');
      process.exit(1);
    }
    backupTable(tableName, format);
    break;
    
  case 'all':
    const allFormat = process.argv[3] || 'json';
    backupAllTables(allFormat);
    break;
    
  case 'restore':
    const restoreTable = process.argv[3];
    const filePath = process.argv[4];
    if (!restoreTable || !filePath) {
      console.log('❌ Uso: node db-backup.js restore [tabela] [arquivo.json]');
      process.exit(1);
    }
    restoreFromJSON(restoreTable, filePath);
    break;
    
  default:
    console.log('Uso: node db-backup.js [comando] [argumentos]');
    console.log('\nComandos disponíveis:');
    console.log('  table [nome] [formato]     Backup de uma tabela (json|csv|sql)');
    console.log('  all [formato]              Backup de todas as tabelas');
    console.log('  restore [tabela] [arquivo] Restaurar de arquivo JSON');
    process.exit(1);
}
