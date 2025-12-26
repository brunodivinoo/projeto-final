const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zkcstkbpgwdoiihvfspp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprY3N0a2JwZ3dkb2lpaHZmc3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkzNDYwNCwiZXhwIjoyMDgxNTEwNjA0fQ.QkG18I254LiSZRsZ8-uvX8seIfJKfaazdciO__fjVOE'
);

// Função para normalizar texto
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

async function fixAssuntos() {
  console.log('=== CORRIGINDO ASSUNTOS DE TODAS AS DISCIPLINAS ===\n');

  // Buscar todas as disciplinas
  const { data: disciplinas } = await supabase
    .from('disciplinas')
    .select('id, nome');

  const discMap = {};
  disciplinas?.forEach(d => { discMap[d.nome] = d.id; });

  // Buscar todos os assuntos únicos das questões com contagem
  const { data: questoes } = await supabase
    .from('questoes')
    .select('disciplina, assunto');

  // Agrupar por disciplina + assunto
  const contagemPorAssunto = {};
  questoes?.forEach(q => {
    if (!q.assunto || !q.disciplina) return;
    const key = q.disciplina + '|' + q.assunto;
    contagemPorAssunto[key] = (contagemPorAssunto[key] || 0) + 1;
  });

  // Buscar todos os assuntos existentes
  const { data: assuntosExistentes } = await supabase
    .from('assuntos')
    .select('id, nome, nome_normalizado, disciplina_id, qtd_questoes, disciplinas(nome)');

  // Criar mapa de assuntos existentes por disciplina + nome_normalizado
  const assuntosPorNormalizado = {};
  assuntosExistentes?.forEach(a => {
    const discNome = a.disciplinas?.nome || '';
    const key = discNome + '|' + (a.nome_normalizado || normalizar(a.nome));
    assuntosPorNormalizado[key] = a;
  });

  // Processar cada assunto das questões
  let criados = 0;
  let atualizados = 0;
  let erros = 0;

  for (const [key, count] of Object.entries(contagemPorAssunto)) {
    const [disciplina, assunto] = key.split('|');
    const discId = discMap[disciplina];

    if (!discId) {
      console.log('Disciplina não encontrada: ' + disciplina);
      erros++;
      continue;
    }

    const nomeNorm = normalizar(assunto);
    const keyNorm = disciplina + '|' + nomeNorm;

    // Verificar se já existe um assunto com esse nome normalizado
    const existente = assuntosPorNormalizado[keyNorm];

    if (existente) {
      // Atualizar qtd_questoes se diferente
      if (existente.qtd_questoes !== count) {
        const { error } = await supabase
          .from('assuntos')
          .update({ qtd_questoes: count })
          .eq('id', existente.id);

        if (error) {
          console.log('Erro ao atualizar ' + assunto + ': ' + error.message);
          erros++;
        } else {
          console.log('Atualizado: [' + disciplina + '] ' + existente.nome + ': ' + existente.qtd_questoes + ' -> ' + count);
          atualizados++;
        }
      }
    } else {
      // Criar novo assunto
      const { error } = await supabase
        .from('assuntos')
        .insert({
          nome: assunto,
          nome_normalizado: nomeNorm,
          disciplina_id: discId,
          qtd_questoes: count
        });

      if (error) {
        console.log('Erro ao criar ' + assunto + ': ' + error.message);
        erros++;
      } else {
        console.log('Criado: [' + disciplina + '] ' + assunto + ': ' + count + ' questões');
        criados++;
        // Adicionar ao mapa para evitar duplicatas
        assuntosPorNormalizado[keyNorm] = { nome: assunto, qtd_questoes: count };
      }
    }
  }

  console.log('\n=== RESUMO ===');
  console.log('Criados: ' + criados);
  console.log('Atualizados: ' + atualizados);
  console.log('Erros: ' + erros);

  // Agora fazer o mesmo para subassuntos
  console.log('\n\n=== CORRIGINDO SUBASSUNTOS ===\n');

  // Buscar subassuntos das questões
  const { data: questoesSub } = await supabase
    .from('questoes')
    .select('disciplina, assunto, subassunto')
    .not('subassunto', 'is', null);

  // Agrupar
  const contagemPorSubassunto = {};
  questoesSub?.forEach(q => {
    if (!q.subassunto || !q.assunto || !q.disciplina) return;
    const key = q.disciplina + '|' + q.assunto + '|' + q.subassunto;
    contagemPorSubassunto[key] = (contagemPorSubassunto[key] || 0) + 1;
  });

  // Buscar assuntos atualizados
  const { data: assuntosAtualizados } = await supabase
    .from('assuntos')
    .select('id, nome, nome_normalizado, disciplinas(nome)');

  // Mapa de assuntos
  const assuntoMap = {};
  assuntosAtualizados?.forEach(a => {
    const discNome = a.disciplinas?.nome || '';
    const nomeNorm = a.nome_normalizado || normalizar(a.nome);
    assuntoMap[discNome + '|' + nomeNorm] = a.id;
  });

  // Buscar subassuntos existentes
  const { data: subassuntosExistentes } = await supabase
    .from('subassuntos')
    .select('id, nome, nome_normalizado, assunto_id, qtd_questoes, assuntos(nome, disciplinas(nome))');

  // Mapa de subassuntos por normalizado
  const subassuntosPorNorm = {};
  subassuntosExistentes?.forEach(s => {
    const discNome = s.assuntos?.disciplinas?.nome || '';
    const assNome = s.assuntos?.nome || '';
    const assNorm = normalizar(assNome);
    const subNorm = s.nome_normalizado || normalizar(s.nome);
    subassuntosPorNorm[discNome + '|' + assNorm + '|' + subNorm] = s;
  });

  let subCriados = 0;
  let subAtualizados = 0;
  let subErros = 0;

  for (const [key, count] of Object.entries(contagemPorSubassunto)) {
    const [disciplina, assunto, subassunto] = key.split('|');

    const assNorm = normalizar(assunto);
    const assuntoId = assuntoMap[disciplina + '|' + assNorm];

    if (!assuntoId) {
      // Assunto não existe ainda
      subErros++;
      continue;
    }

    const subNorm = normalizar(subassunto);
    const keyNorm = disciplina + '|' + assNorm + '|' + subNorm;

    const existente = subassuntosPorNorm[keyNorm];

    if (existente) {
      if (existente.qtd_questoes !== count) {
        const { error } = await supabase
          .from('subassuntos')
          .update({ qtd_questoes: count })
          .eq('id', existente.id);

        if (error) {
          subErros++;
        } else {
          console.log('Atualizado sub: [' + assunto + '] ' + existente.nome + ': ' + count);
          subAtualizados++;
        }
      }
    } else {
      const { error } = await supabase
        .from('subassuntos')
        .insert({
          nome: subassunto,
          nome_normalizado: subNorm,
          assunto_id: assuntoId,
          qtd_questoes: count
        });

      if (error) {
        console.log('Erro ao criar sub ' + subassunto + ': ' + error.message);
        subErros++;
      } else {
        console.log('Criado sub: [' + assunto + '] ' + subassunto + ': ' + count);
        subCriados++;
        subassuntosPorNorm[keyNorm] = { nome: subassunto, qtd_questoes: count };
      }
    }
  }

  console.log('\n=== RESUMO SUBASSUNTOS ===');
  console.log('Criados: ' + subCriados);
  console.log('Atualizados: ' + subAtualizados);
  console.log('Erros/Ignorados: ' + subErros);
}

fixAssuntos().catch(console.error);
