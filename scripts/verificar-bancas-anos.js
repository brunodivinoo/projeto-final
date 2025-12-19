/**
 * Script para verificar bancas e anos com paginação
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function buscarBancasComPaginacao() {
  const bancasCount = {};
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('questoes')
      .select('banca')
      .not('banca', 'is', null)
      .range(offset, offset + limit - 1);

    if (error || !data || data.length === 0) {
      hasMore = false;
      break;
    }

    data.forEach(q => {
      if (q.banca) bancasCount[q.banca] = (bancasCount[q.banca] || 0) + 1;
    });

    offset += limit;
    hasMore = data.length === limit;
  }

  return Object.entries(bancasCount)
    .map(([nome, qtd]) => ({ nome, qtd_questoes: qtd }))
    .sort((a, b) => b.qtd_questoes - a.qtd_questoes);
}

async function buscarAnosComPaginacao() {
  const anosCount = {};
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('questoes')
      .select('ano')
      .not('ano', 'is', null)
      .range(offset, offset + limit - 1);

    if (error || !data || data.length === 0) {
      hasMore = false;
      break;
    }

    data.forEach(q => {
      if (q.ano) anosCount[q.ano] = (anosCount[q.ano] || 0) + 1;
    });

    offset += limit;
    hasMore = data.length === limit;
  }

  return Object.entries(anosCount)
    .map(([ano, qtd]) => ({ ano: parseInt(ano), qtd_questoes: qtd }))
    .sort((a, b) => b.ano - a.ano);
}

async function main() {
  console.log('Buscando bancas com paginação...');
  const bancas = await buscarBancasComPaginacao();
  console.log('\n=== BANCAS (' + bancas.length + ') ===');
  bancas.forEach(b => console.log('-', b.nome.toUpperCase() + ':', b.qtd_questoes));

  // Somar total
  const totalBancas = bancas.reduce((acc, b) => acc + b.qtd_questoes, 0);
  console.log('Total de questões com banca:', totalBancas);

  console.log('\nBuscando anos com paginação...');
  const anos = await buscarAnosComPaginacao();
  console.log('\n=== ANOS (' + anos.length + ') ===');
  anos.forEach(a => console.log('-', a.ano + ':', a.qtd_questoes));

  // Somar total
  const totalAnos = anos.reduce((acc, a) => acc + a.qtd_questoes, 0);
  console.log('Total de questões com ano:', totalAnos);
}

main().catch(console.error);
