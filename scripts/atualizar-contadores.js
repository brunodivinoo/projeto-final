/**
 * Script para atualizar contadores das tabelas de lookup
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function atualizarContadoresDisciplinas() {
  console.log('📊 Atualizando contadores das disciplinas...');

  const { data: disciplinas } = await supabase
    .from('disciplinas')
    .select('id, nome');

  let atualizados = 0;
  for (const disc of disciplinas || []) {
    const { count } = await supabase
      .from('questoes')
      .select('*', { count: 'exact', head: true })
      .eq('disciplina', disc.nome);

    await supabase
      .from('disciplinas')
      .update({ qtd_questoes: count || 0 })
      .eq('id', disc.id);

    if (count > 0) atualizados++;
  }

  console.log(`   ✅ ${atualizados} disciplinas com questões`);
}

async function atualizarContadoresAssuntos() {
  console.log('📊 Atualizando contadores dos assuntos...');

  const { data: assuntos } = await supabase
    .from('assuntos')
    .select('id, nome, disciplinas(nome)');

  let atualizados = 0;
  for (const ass of assuntos || []) {
    const discNome = ass.disciplinas && ass.disciplinas.nome;
    if (!discNome) continue;

    const { count } = await supabase
      .from('questoes')
      .select('*', { count: 'exact', head: true })
      .eq('disciplina', discNome)
      .eq('assunto', ass.nome);

    await supabase
      .from('assuntos')
      .update({ qtd_questoes: count || 0 })
      .eq('id', ass.id);

    if (count > 0) atualizados++;
  }

  console.log(`   ✅ ${atualizados} assuntos com questões`);
}

async function atualizarContadoresSubassuntos() {
  console.log('📊 Atualizando contadores dos subassuntos...');

  const { data: subassuntos } = await supabase
    .from('subassuntos')
    .select('id, nome, assuntos(nome, disciplinas(nome))');

  let atualizados = 0;
  for (const sub of subassuntos || []) {
    const assNome = sub.assuntos && sub.assuntos.nome;
    const discNome = sub.assuntos && sub.assuntos.disciplinas && sub.assuntos.disciplinas.nome;
    if (!assNome || !discNome) continue;

    const { count } = await supabase
      .from('questoes')
      .select('*', { count: 'exact', head: true })
      .eq('disciplina', discNome)
      .eq('assunto', assNome)
      .eq('subassunto', sub.nome);

    await supabase
      .from('subassuntos')
      .update({ qtd_questoes: count || 0 })
      .eq('id', sub.id);

    if (count > 0) atualizados++;
  }

  console.log(`   ✅ ${atualizados} subassuntos com questões`);
}

async function main() {
  console.log('\n🔄 Iniciando atualização de contadores...\n');

  await atualizarContadoresDisciplinas();
  await atualizarContadoresAssuntos();
  await atualizarContadoresSubassuntos();

  console.log('\n✅ Todos os contadores foram atualizados!\n');
}

main().catch(console.error);
