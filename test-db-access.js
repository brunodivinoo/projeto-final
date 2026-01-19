require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('🔍 Testando conexão com Supabase...\n');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Não encontrada');
  console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Não encontrada');
  
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code === '42P01') {
      console.log('\n⚠️ Tabela users não existe, tentando outra...');
      const { data: data2, error: error2 } = await supabase.from('profiles').select('count').limit(1);
      if (error2) {
        console.log('Erro:', error2.message);
      } else {
        console.log('\n✅ CONEXÃO COM SUPABASE FUNCIONANDO!');
      }
    } else if (error) {
      console.log('\nErro:', error.message);
    } else {
      console.log('\n✅ CONEXÃO COM SUPABASE FUNCIONANDO!');
      console.log('Dados:', data);
    }
  } catch (e) {
    console.log('\n❌ Erro de conexão:', e.message);
  }
}

test();
