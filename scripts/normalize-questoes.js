const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zkcstkbpgwdoiihvfspp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprY3N0a2JwZ3dkb2lpaHZmc3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkzNDYwNCwiZXhwIjoyMDgxNTEwNjA0fQ.QkG18I254LiSZRsZ8-uvX8seIfJKfaazdciO__fjVOE'
);

function normalizar(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

async function normalizeQuestoes() {
  console.log('=== NORMALIZANDO NOMES NAS QUESTÕES ===\n');

  // 1. Buscar todos os assuntos da tabela com suas disciplinas
  const { data: assuntos } = await supabase
    .from('assuntos')
    .select('id, nome, nome_normalizado, disciplinas(nome)');

  // Criar mapa: disciplina + nome_normalizado -> nome correto
  const assuntoMap = {};
  assuntos?.forEach(a => {
    const discNome = a.disciplinas?.nome || '';
    const nomeNorm = a.nome_normalizado || normalizar(a.nome);
    const key = discNome + '|' + nomeNorm;
    assuntoMap[key] = a.nome;
  });

  // 2. Buscar todos os subassuntos
  const { data: subassuntos } = await supabase
    .from('subassuntos')
    .select('id, nome, nome_normalizado, assuntos(nome, disciplinas(nome))');

  // Criar mapa: disciplina + assunto_norm + subassunto_norm -> nome correto
  const subassuntoMap = {};
  subassuntos?.forEach(s => {
    const discNome = s.assuntos?.disciplinas?.nome || '';
    const assNome = s.assuntos?.nome || '';
    const assNorm = normalizar(assNome);
    const subNorm = s.nome_normalizado || normalizar(s.nome);
    const key = discNome + '|' + assNorm + '|' + subNorm;
    subassuntoMap[key] = s.nome;
  });

  // 3. Buscar todas as questões em lotes
  console.log('Buscando questões...');
  let allQuestoes = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data: batch } = await supabase
      .from('questoes')
      .select('id, disciplina, assunto, subassunto')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (!batch || batch.length === 0) break;
    allQuestoes = allQuestoes.concat(batch);
    page++;
    if (batch.length < pageSize) break;
  }

  console.log('Total de questões: ' + allQuestoes.length + '\n');

  // 4. Verificar e atualizar questões
  let assuntoUpdates = 0;
  let subassuntoUpdates = 0;
  let errors = 0;

  for (const q of allQuestoes) {
    let needsUpdate = false;
    const updates = {};

    // Verificar assunto
    if (q.assunto && q.disciplina) {
      const assNorm = normalizar(q.assunto);
      const key = q.disciplina + '|' + assNorm;
      const nomeCorreto = assuntoMap[key];

      if (nomeCorreto && nomeCorreto !== q.assunto) {
        updates.assunto = nomeCorreto;
        needsUpdate = true;
        assuntoUpdates++;
        console.log('Assunto: "' + q.assunto + '" -> "' + nomeCorreto + '"');
      }
    }

    // Verificar subassunto
    if (q.subassunto && q.assunto && q.disciplina) {
      const assNorm = normalizar(q.assunto);
      const subNorm = normalizar(q.subassunto);
      const key = q.disciplina + '|' + assNorm + '|' + subNorm;
      const nomeCorreto = subassuntoMap[key];

      if (nomeCorreto && nomeCorreto !== q.subassunto) {
        updates.subassunto = nomeCorreto;
        needsUpdate = true;
        subassuntoUpdates++;
        console.log('Subassunto: "' + q.subassunto + '" -> "' + nomeCorreto + '"');
      }
    }

    // Atualizar se necessário
    if (needsUpdate) {
      const { error } = await supabase
        .from('questoes')
        .update(updates)
        .eq('id', q.id);

      if (error) {
        console.log('Erro ao atualizar questão ' + q.id + ': ' + error.message);
        errors++;
      }
    }
  }

  console.log('\n=== RESUMO ===');
  console.log('Assuntos corrigidos: ' + assuntoUpdates);
  console.log('Subassuntos corrigidos: ' + subassuntoUpdates);
  console.log('Erros: ' + errors);
}

normalizeQuestoes().catch(console.error);
