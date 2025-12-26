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

async function syncAll() {
  console.log('=== SINCRONIZAÇÃO COMPLETA DE CONTADORES ===\n');

  // 1. Buscar todas as questões (em lotes para evitar limite de 1000)
  let allQuestoes = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data: batch, error: errBatch } = await supabase
      .from('questoes')
      .select('disciplina, assunto, subassunto')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (errBatch) {
      console.log('Erro ao buscar questões:', errBatch.message);
      return;
    }

    if (!batch || batch.length === 0) break;

    allQuestoes = allQuestoes.concat(batch);
    page++;

    if (batch.length < pageSize) break;
  }

  const questoes = allQuestoes;
  const errQ = null;

  if (errQ) {
    console.log('Erro ao buscar questões:', errQ.message);
    return;
  }

  console.log('Total de questões: ' + questoes.length + '\n');

  // 2. Contar por disciplina
  const contagemDisc = {};
  const contagemAssunto = {};
  const contagemSubassunto = {};

  questoes.forEach(q => {
    if (q.disciplina) {
      contagemDisc[q.disciplina] = (contagemDisc[q.disciplina] || 0) + 1;

      if (q.assunto) {
        const keyAss = q.disciplina + '|' + q.assunto;
        contagemAssunto[keyAss] = (contagemAssunto[keyAss] || 0) + 1;

        if (q.subassunto) {
          const keySub = keyAss + '|' + q.subassunto;
          contagemSubassunto[keySub] = (contagemSubassunto[keySub] || 0) + 1;
        }
      }
    }
  });

  // 3. Buscar disciplinas e criar mapa
  const { data: disciplinas } = await supabase
    .from('disciplinas')
    .select('id, nome, qtd_questoes');

  const discMap = {};
  disciplinas?.forEach(d => { discMap[d.nome] = d; });

  // 4. Buscar assuntos e criar mapa por disciplina + nome_normalizado
  const { data: assuntos } = await supabase
    .from('assuntos')
    .select('id, nome, nome_normalizado, qtd_questoes, disciplina_id, disciplinas(nome)');

  const assuntoMap = {};
  assuntos?.forEach(a => {
    const discNome = a.disciplinas?.nome || '';
    const nomeNorm = a.nome_normalizado || normalizar(a.nome);
    const key = discNome + '|' + nomeNorm;
    assuntoMap[key] = a;
  });

  // 5. Buscar subassuntos
  const { data: subassuntos } = await supabase
    .from('subassuntos')
    .select('id, nome, nome_normalizado, qtd_questoes, assunto_id, assuntos(nome, nome_normalizado, disciplinas(nome))');

  const subassuntoMap = {};
  subassuntos?.forEach(s => {
    const discNome = s.assuntos?.disciplinas?.nome || '';
    const assNorm = s.assuntos?.nome_normalizado || normalizar(s.assuntos?.nome || '');
    const subNorm = s.nome_normalizado || normalizar(s.nome);
    const key = discNome + '|' + assNorm + '|' + subNorm;
    subassuntoMap[key] = s;
  });

  // 6. Atualizar disciplinas
  console.log('=== ATUALIZANDO DISCIPLINAS ===');
  let discUpdated = 0;
  for (const [nome, qtd] of Object.entries(contagemDisc)) {
    const disc = discMap[nome];
    if (disc && disc.qtd_questoes !== qtd) {
      await supabase.from('disciplinas').update({ qtd_questoes: qtd }).eq('id', disc.id);
      console.log('  ' + nome + ': ' + disc.qtd_questoes + ' -> ' + qtd);
      discUpdated++;
    }
  }
  console.log('Disciplinas atualizadas: ' + discUpdated + '\n');

  // 7. Atualizar assuntos (por nome normalizado)
  console.log('=== ATUALIZANDO ASSUNTOS ===');
  let assUpdated = 0;
  let assCreated = 0;
  for (const [key, qtd] of Object.entries(contagemAssunto)) {
    const [discNome, assNome] = key.split('|');
    const assNorm = normalizar(assNome);
    const lookupKey = discNome + '|' + assNorm;

    const assunto = assuntoMap[lookupKey];
    if (assunto) {
      if (assunto.qtd_questoes !== qtd) {
        await supabase.from('assuntos').update({ qtd_questoes: qtd }).eq('id', assunto.id);
        console.log('  [' + discNome + '] ' + assunto.nome + ': ' + assunto.qtd_questoes + ' -> ' + qtd);
        assUpdated++;
      }
    } else {
      // Criar assunto se não existe
      const disc = discMap[discNome];
      if (disc) {
        const { data: newAss, error } = await supabase
          .from('assuntos')
          .insert({
            nome: assNome,
            nome_normalizado: assNorm,
            disciplina_id: disc.id,
            qtd_questoes: qtd
          })
          .select()
          .single();

        if (error) {
          console.log('  Erro criando [' + discNome + '] ' + assNome + ': ' + error.message);
        } else {
          console.log('  CRIADO: [' + discNome + '] ' + assNome + ': ' + qtd);
          assCreated++;
          // Adicionar ao mapa
          assuntoMap[lookupKey] = newAss;
        }
      }
    }
  }
  console.log('Assuntos atualizados: ' + assUpdated);
  console.log('Assuntos criados: ' + assCreated + '\n');

  // 8. Atualizar subassuntos
  console.log('=== ATUALIZANDO SUBASSUNTOS ===');
  let subUpdated = 0;
  let subCreated = 0;
  for (const [key, qtd] of Object.entries(contagemSubassunto)) {
    const parts = key.split('|');
    const discNome = parts[0];
    const assNome = parts[1];
    const subNome = parts[2];

    const assNorm = normalizar(assNome);
    const subNorm = normalizar(subNome);
    const lookupKey = discNome + '|' + assNorm + '|' + subNorm;

    const subassunto = subassuntoMap[lookupKey];
    if (subassunto) {
      if (subassunto.qtd_questoes !== qtd) {
        await supabase.from('subassuntos').update({ qtd_questoes: qtd }).eq('id', subassunto.id);
        console.log('  [' + assNome + '] ' + subassunto.nome + ': ' + subassunto.qtd_questoes + ' -> ' + qtd);
        subUpdated++;
      }
    } else {
      // Criar subassunto se não existe
      const assLookup = discNome + '|' + assNorm;
      const assunto = assuntoMap[assLookup];
      if (assunto) {
        const { error } = await supabase
          .from('subassuntos')
          .insert({
            nome: subNome,
            nome_normalizado: subNorm,
            assunto_id: assunto.id,
            qtd_questoes: qtd
          });

        if (error) {
          // Pode ser duplicata
          if (!error.message.includes('duplicate')) {
            console.log('  Erro criando [' + assNome + '] ' + subNome + ': ' + error.message);
          }
        } else {
          console.log('  CRIADO: [' + assNome + '] ' + subNome + ': ' + qtd);
          subCreated++;
        }
      }
    }
  }
  console.log('Subassuntos atualizados: ' + subUpdated);
  console.log('Subassuntos criados: ' + subCreated + '\n');

  console.log('=== SINCRONIZAÇÃO CONCLUÍDA ===');
}

syncAll().catch(console.error);
