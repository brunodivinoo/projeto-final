#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createScheduledJob(jobName, schedule, sqlQuery) {
  try {
    console.log('⏰ Configuração do Job Agendado:');
    console.log(`Nome: ${jobName}`);
    console.log(`Schedule: ${schedule}`);
    console.log(`Query: ${sqlQuery}\n`);
    
    console.log('⚠️  Para criar job agendado no Supabase:');
    console.log('\n1. Instale a extensão pg_cron:');
    console.log('   CREATE EXTENSION IF NOT EXISTS pg_cron;');
    
    console.log('\n2. Crie o job:');
    const sql = `
SELECT cron.schedule(
  '${jobName}',
  '${schedule}',
  $$ ${sqlQuery} $$
);`;
    console.log(sql);
    
    console.log('\n📅 Formato do schedule (cron):');
    console.log('  * * * * * - Cada minuto');
    console.log('  0 * * * * - Cada hora');
    console.log('  0 0 * * * - Meia-noite todos os dias');
    console.log('  0 9 * * 1 - 9h toda segunda-feira');
    console.log('  */15 * * * * - A cada 15 minutos');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function listJobs() {
  try {
    console.log('📋 Para listar jobs agendados, execute no Supabase:');
    console.log(`
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
ORDER BY jobid;
`);
    
    console.log('\n💡 Ou via SQL simples:');
    console.log('SELECT * FROM cron.job;');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function deleteJob(jobId) {
  try {
    console.log(`🗑️  Para deletar job #${jobId}, execute:`);
    console.log(`SELECT cron.unschedule(${jobId});`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function createCleanupJob(tableName, days = 30) {
  try {
    const jobName = `cleanup_${tableName}`;
    const schedule = '0 2 * * *'; // 2h da manhã diariamente
    const query = `DELETE FROM ${tableName} WHERE created_at < NOW() - INTERVAL '${days} days'`;
    
    console.log('🧹 Job de Limpeza Automática:');
    console.log(`Tabela: ${tableName}`);
    console.log(`Deletar registros com mais de ${days} dias`);
    console.log(`Schedule: Diariamente às 2h\n`);
    
    createScheduledJob(jobName, schedule, query);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function createBackupJob(tableName) {
  try {
    const jobName = `backup_${tableName}`;
    const schedule = '0 3 * * *'; // 3h da manhã diariamente
    const query = `
      INSERT INTO ${tableName}_backup 
      SELECT * FROM ${tableName};
    `;
    
    console.log('💾 Job de Backup Automático:');
    console.log(`Tabela: ${tableName}`);
    console.log(`Schedule: Diariamente às 3h\n`);
    
    console.log('⚠️  Primeiro crie a tabela de backup:');
    console.log(`CREATE TABLE ${tableName}_backup (LIKE ${tableName} INCLUDING ALL);`);
    console.log('');
    
    createScheduledJob(jobName, schedule, query);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const command = process.argv[2];

switch (command) {
  case 'create':
    const name = process.argv[3];
    const schedule = process.argv[4];
    const query = process.argv[5];
    
    if (!name || !schedule || !query) {
      console.log('❌ Uso: node db-automation.js create [nome] [schedule] [query]');
      console.log('\nExemplo: node db-automation.js create cleanup "0 2 * * *" "DELETE FROM logs WHERE created_at < NOW() - INTERVAL \'30 days\'"');
      process.exit(1);
    }
    createScheduledJob(name, schedule, query);
    break;
    
  case 'cleanup':
    const cleanupTable = process.argv[3];
    const days = parseInt(process.argv[4]) || 30;
    
    if (!cleanupTable) {
      console.log('❌ Uso: node db-automation.js cleanup [tabela] [dias]');
      process.exit(1);
    }
    createCleanupJob(cleanupTable, days);
    break;
    
  case 'backup':
    const backupTable = process.argv[3];
    
    if (!backupTable) {
      console.log('❌ Uso: node db-automation.js backup [tabela]');
      process.exit(1);
    }
    createBackupJob(backupTable);
    break;
    
  case 'list':
    listJobs();
    break;
    
  case 'delete':
    const jobId = process.argv[3];
    
    if (!jobId) {
      console.log('❌ Uso: node db-automation.js delete [job_id]');
      process.exit(1);
    }
    deleteJob(jobId);
    break;
    
  default:
    console.log('Uso: node db-automation.js [comando] [argumentos]');
    console.log('\nComandos disponíveis:');
    console.log('  create [nome] [schedule] [query]  Criar job agendado');
    console.log('  cleanup [tabela] [dias]           Job de limpeza automática');
    console.log('  backup [tabela]                   Job de backup automático');
    console.log('  list                              Listar jobs agendados');
    console.log('  delete [job_id]                   Deletar job');
    process.exit(1);
}
