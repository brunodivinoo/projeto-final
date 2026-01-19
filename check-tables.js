require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('=== VERIFICANDO TABELAS NO BANCO ===\n');

  // Verificar badges_med
  const { data: badges, error: e1 } = await supabase.from('badges_med').select('id').limit(1);
  if (e1) {
    console.log('badges_med: ❌ NÃO EXISTE ou erro:', e1.message);
  } else {
    const { count } = await supabase.from('badges_med').select('*', {count: 'exact', head: true});
    console.log('badges_med: ✅ EXISTE (' + count + ' registros)');
  }

  // Verificar badges_usuario_med
  const { error: e2 } = await supabase.from('badges_usuario_med').select('id').limit(1);
  if (e2) {
    console.log('badges_usuario_med: ❌ NÃO EXISTE ou erro:', e2.message);
  } else {
    console.log('badges_usuario_med: ✅ EXISTE');
  }

  // Verificar ranking_med
  const { error: e3 } = await supabase.from('ranking_med').select('id').limit(1);
  if (e3) {
    console.log('ranking_med: ❌ NÃO EXISTE ou erro:', e3.message);
  } else {
    console.log('ranking_med: ✅ EXISTE');
  }

  // Verificar limites_uso_med tem casos_clinicos_mes
  const { error: e4 } = await supabase.from('limites_uso_med').select('casos_clinicos_mes').limit(1);
  if (e4) {
    console.log('limites_uso_med.casos_clinicos_mes: ❌ NÃO EXISTE ou erro:', e4.message);
  } else {
    console.log('limites_uso_med.casos_clinicos_mes: ✅ EXISTE');
  }
}

check();
