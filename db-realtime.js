#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function subscribeToTable(tableName, event = '*') {
  try {
    console.log(`\n🔴 Monitorando "${tableName}" (${event})...`);
    console.log('Pressione Ctrl+C para parar\n');
    
    const channel = supabase
      .channel(`${tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table: tableName
        },
        (payload) => {
          const timestamp = new Date().toLocaleTimeString('pt-BR');
          console.log(`[${timestamp}] 📩 ${payload.eventType.toUpperCase()}`);
          console.log(JSON.stringify(payload.new || payload.old, null, 2));
          console.log('---');
        }
      )
      .subscribe();
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const tableName = process.argv[2];
const event = process.argv[3] || '*';

if (!tableName) {
  console.log('Uso: node db-realtime.js [tabela] [evento]');
  console.log('\nEventos disponíveis:');
  console.log('  * (default)    Todos os eventos');
  console.log('  INSERT         Apenas inserções');
  console.log('  UPDATE         Apenas atualizações');
  console.log('  DELETE         Apenas deleções');
  process.exit(1);
}

subscribeToTable(tableName, event);
