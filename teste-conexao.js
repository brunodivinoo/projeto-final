#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testando conexão com Supabase...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ Não encontrada');
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Teste simples - tentar fazer uma query básica
    const { data, error } = await supabase
      .from('_realtime')
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.log('⚠️  Erro:', error.message);
      console.log('Código:', error.code);
    } else {
      console.log('✅ Conexão estabelecida com sucesso!');
      console.log('✅ Cliente Supabase funcionando corretamente!');
    }
  } catch (err) {
    console.error('❌ Erro de conexão:', err.message);
  }
}

testConnection();
