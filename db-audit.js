#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function enableAudit(tableName) {
  try {
    // Criar tabela de auditoria se não existir
    const createAuditTable = `
      CREATE TABLE IF NOT EXISTS audit_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        table_name text NOT NULL,
        operation text NOT NULL,
        old_data jsonb,
        new_data jsonb,
        user_id uuid,
        created_at timestamptz DEFAULT now()
      );
    `;
    
    console.log('📝 Criando tabela de auditoria...');
    
    // Criar trigger function
    const createFunction = `
      CREATE OR REPLACE FUNCTION audit_trigger_func()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          INSERT INTO audit_log (table_name, operation, old_data, user_id)
          VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), auth.uid());
          RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO audit_log (table_name, operation, old_data, new_data, user_id)
          VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid());
          RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
          INSERT INTO audit_log (table_name, operation, new_data, user_id)
          VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), auth.uid());
          RETURN NEW;
        END IF;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Criar trigger na tabela
    const createTrigger = `
      DROP TRIGGER IF EXISTS audit_trigger ON ${tableName};
      CREATE TRIGGER audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON ${tableName}
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
    `;
    
    console.log(`✅ Auditoria habilitada para "${tableName}"`);
    console.log('\n⚠️  Execute os seguintes SQL no Supabase Dashboard:');
    console.log('\n1. Criar tabela de auditoria:');
    console.log(createAuditTable);
    console.log('\n2. Criar função de trigger:');
    console.log(createFunction);
    console.log('\n3. Criar trigger na tabela:');
    console.log(createTrigger);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function viewAuditLog(tableName = null, limit = 50) {
  try {
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (tableName) {
      query = query.eq('table_name', tableName);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log(`\n📋 Log de Auditoria${tableName ? ` - ${tableName}` : ''}\n`);
    
    data.forEach(log => {
      const date = new Date(log.created_at).toLocaleString('pt-BR');
      console.log(`[${date}] ${log.operation} em ${log.table_name}`);
      if (log.new_data) console.log('  Novo:', JSON.stringify(log.new_data).substring(0, 100));
      if (log.old_data) console.log('  Antigo:', JSON.stringify(log.old_data).substring(0, 100));
      console.log('---');
    });
    
    console.log(`\n✅ ${data.length} registros exibidos`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.log('\n💡 Certifique-se de criar a tabela audit_log primeiro!');
  }
}

async function exportAuditLog(tableName = null) {
  try {
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (tableName) {
      query = query.eq('table_name', tableName);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `audit_log${tableName ? `_${tableName}` : ''}_${timestamp}.json`;
    
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
    
    console.log('✅ Log exportado com sucesso!');
    console.log(`📁 Arquivo: ${fileName}`);
    console.log(`📊 Registros: ${data.length}`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const command = process.argv[2];

switch (command) {
  case 'enable':
    const tableName = process.argv[3];
    if (!tableName) {
      console.log('❌ Uso: node db-audit.js enable [tabela]');
      process.exit(1);
    }
    enableAudit(tableName);
    break;
    
  case 'view':
    const viewTable = process.argv[3];
    const limit = parseInt(process.argv[4]) || 50;
    viewAuditLog(viewTable, limit);
    break;
    
  case 'export':
    const exportTable = process.argv[3];
    exportAuditLog(exportTable);
    break;
    
  default:
    console.log('Uso: node db-audit.js [comando] [argumentos]');
    console.log('\nComandos disponíveis:');
    console.log('  enable [tabela]         Habilitar auditoria em uma tabela');
    console.log('  view [tabela] [limite]  Ver log de auditoria');
    console.log('  export [tabela]         Exportar log de auditoria');
    process.exit(1);
}
