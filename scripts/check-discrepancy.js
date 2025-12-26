const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zkcstkbpgwdoiihvfspp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprY3N0a2JwZ3dkb2lpaHZmc3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkzNDYwNCwiZXhwIjoyMDgxNTEwNjA0fQ.QkG18I254LiSZRsZ8-uvX8seIfJKfaazdciO__fjVOE'
);

async function check() {
  // Buscar todas as questões de Direito Penal
  const { data: questoes } = await supabase
    .from('questoes')
    .select('id, assunto, subassunto')
    .eq('disciplina', 'Direito Penal');

  console.log('Total de questões de Direito Penal: ' + questoes?.length);

  // Listar assuntos únicos nas questões
  const assuntosMap = {};
  questoes?.forEach(q => {
    if (q.assunto) {
      assuntosMap[q.assunto] = (assuntosMap[q.assunto] || 0) + 1;
    }
  });

  console.log('\n=== ASSUNTOS NAS QUESTÕES ===');
  Object.entries(assuntosMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([nome, qtd]) => console.log('  - ' + nome + ': ' + qtd));

  // Buscar disciplina ID
  const { data: disc } = await supabase
    .from('disciplinas')
    .select('id')
    .eq('nome', 'Direito Penal')
    .single();

  // Buscar assuntos na tabela para essa disciplina
  const { data: assuntosTabela } = await supabase
    .from('assuntos')
    .select('id, nome, qtd_questoes')
    .eq('disciplina_id', disc?.id)
    .gt('qtd_questoes', 0)
    .order('qtd_questoes', { ascending: false });

  console.log('\n=== ASSUNTOS NA TABELA (Direito Penal, qtd > 0) ===');
  assuntosTabela?.forEach(a => console.log('  - ' + a.nome + ': ' + a.qtd_questoes));

  // Verificar quais assuntos das questões NÃO estão na tabela
  const nomesTabela = new Set(assuntosTabela?.map(a => a.nome) || []);
  const assuntosQuestoes = Object.keys(assuntosMap);

  console.log('\n=== ASSUNTOS QUE ESTÃO NAS QUESTÕES MAS NÃO NA TABELA ===');
  let faltandoCount = 0;
  assuntosQuestoes.forEach(a => {
    if (!nomesTabela.has(a)) {
      console.log('  - "' + a + '" (' + assuntosMap[a] + ' questões)');
      faltandoCount++;
    }
  });
  if (faltandoCount === 0) {
    console.log('  (nenhum)');
  }

  // Comparar soma
  const somaTabela = assuntosTabela?.reduce((sum, a) => sum + a.qtd_questoes, 0) || 0;
  const somaQuestoes = questoes?.length || 0;

  console.log('\n=== COMPARAÇÃO ===');
  console.log('Soma qtd_questoes na tabela: ' + somaTabela);
  console.log('Total real de questões: ' + somaQuestoes);
  console.log('Diferença: ' + (somaQuestoes - somaTabela));
}

check().catch(console.error);
