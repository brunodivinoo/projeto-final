#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createWebhook(tableName, webhookUrl, events = ['INSERT', 'UPDATE', 'DELETE']) {
  try {
    console.log('📝 Configuração do Webhook:');
    console.log(`Tabela: ${tableName}`);
    console.log(`URL: ${webhookUrl}`);
    console.log(`Eventos: ${events.join(', ')}\n`);
    
    console.log('⚠️  Para criar webhook, execute no Supabase Dashboard:');
    console.log('\n1. Vá em Database > Webhooks');
    console.log('2. Clique em "Create a new hook"');
    console.log('3. Configure:');
    console.log(`   - Name: webhook_${tableName}`);
    console.log(`   - Table: ${tableName}`);
    console.log(`   - Events: ${events.join(', ')}`);
    console.log(`   - Type: HTTP Request`);
    console.log(`   - HTTP Request URL: ${webhookUrl}`);
    console.log(`   - HTTP Method: POST`);
    console.log(`   - HTTP Headers: {"Content-Type": "application/json"}`);
    
    console.log('\n💡 Ou use SQL:');
    const sql = `
CREATE OR REPLACE FUNCTION notify_webhook_${tableName}()
RETURNS TRIGGER AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'data', row_to_json(NEW),
    'old_data', row_to_json(OLD),
    'timestamp', now()
  );
  
  PERFORM net.http_post(
    url := '${webhookUrl}',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_trigger_${tableName}
AFTER ${events.join(' OR ')} ON ${tableName}
FOR EACH ROW EXECUTE FUNCTION notify_webhook_${tableName}();
`;
    console.log(sql);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function testWebhook(webhookUrl, testData = {}) {
  try {
    console.log(`🔔 Testando webhook: ${webhookUrl}\n`);
    
    const payload = {
      event: 'test',
      data: testData,
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ Webhook respondeu com sucesso!');
      const text = await response.text();
      if (text) console.log('Resposta:', text);
    } else {
      console.log('❌ Webhook retornou erro');
    }
  } catch (err) {
    console.error('❌ Erro ao testar webhook:', err.message);
  }
}

async function listWebhooks() {
  try {
    console.log('📋 Para listar webhooks:');
    console.log('1. Acesse Supabase Dashboard > Database > Webhooks');
    console.log('2. Ou execute SQL:');
    console.log(`
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'webhook_%';
`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const command = process.argv[2];

switch (command) {
  case 'create':
    const table = process.argv[3];
    const url = process.argv[4];
    const events = process.argv[5] ? process.argv[5].split(',') : ['INSERT', 'UPDATE', 'DELETE'];
    
    if (!table || !url) {
      console.log('❌ Uso: node db-webhooks.js create [tabela] [url] [eventos]');
      console.log('\nExemplo: node db-webhooks.js create users https://example.com/webhook INSERT,UPDATE');
      process.exit(1);
    }
    createWebhook(table, url, events);
    break;
    
  case 'test':
    const testUrl = process.argv[3];
    const testData = process.argv[4] ? JSON.parse(process.argv[4]) : { test: true };
    
    if (!testUrl) {
      console.log('❌ Uso: node db-webhooks.js test [url] [data_json]');
      process.exit(1);
    }
    testWebhook(testUrl, testData);
    break;
    
  case 'list':
    listWebhooks();
    break;
    
  default:
    console.log('Uso: node db-webhooks.js [comando] [argumentos]');
    console.log('\nComandos disponíveis:');
    console.log('  create [tabela] [url] [eventos]  Criar webhook');
    console.log('  test [url] [data]                Testar webhook');
    console.log('  list                             Listar webhooks');
    process.exit(1);
}
