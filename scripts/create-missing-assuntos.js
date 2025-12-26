const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zkcstkbpgwdoiihvfspp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprY3N0a2JwZ3dkb2lpaHZmc3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkzNDYwNCwiZXhwIjoyMDgxNTEwNjA0fQ.QkG18I254LiSZRsZ8-uvX8seIfJKfaazdciO__fjVOE'
);

async function findAndCreateMissing() {
  console.log('=== BUSCANDO ASSUNTOS FALTANDO ===\n');

  // Buscar todos os assuntos únicos das questões
  const { data: questoesAssuntos } = await supabase
    .from('questoes')
    .select('disciplina, assunto')
    .not('assunto', 'is', null);

  // Buscar todos os assuntos da tabela assuntos
  const { data: assuntosTabela } = await supabase
    .from('assuntos')
    .select('nome, disciplina_id, disciplinas(nome)');

  // Buscar disciplinas
  const { data: disciplinas } = await supabase
    .from('disciplinas')
    .select('id, nome');

  const discMap = {};
  disciplinas?.forEach(d => { discMap[d.nome] = d.id; });

  // Criar set de assuntos existentes (nome + disciplina)
  const assuntosExistentes = new Set();
  assuntosTabela?.forEach(a => {
    const discNome = a.disciplinas?.nome || '';
    assuntosExistentes.add(discNome + '|' + a.nome);
  });

  // Encontrar assuntos que estão nas questões mas não na tabela
  const assuntosFaltando = {};
  questoesAssuntos?.forEach(q => {
    if (!q.assunto || !q.disciplina) return;
    const key = q.disciplina + '|' + q.assunto;
    if (!assuntosExistentes.has(key)) {
      if (!assuntosFaltando[key]) {
        assuntosFaltando[key] = { disciplina: q.disciplina, assunto: q.assunto, count: 0 };
      }
      assuntosFaltando[key].count++;
    }
  });

  const faltando = Object.values(assuntosFaltando).sort((a, b) => b.count - a.count);
  console.log('ASSUNTOS FALTANDO NA TABELA: ' + faltando.length + '\n');

  faltando.slice(0, 20).forEach(a => {
    console.log('  [' + a.disciplina + '] ' + a.assunto + ': ' + a.count + ' questões');
  });

  if (faltando.length > 20) {
    console.log('  ... e mais ' + (faltando.length - 20) + ' assuntos');
  }

  // Criar os assuntos faltando
  if (faltando.length > 0) {
    console.log('\n=== CRIANDO ASSUNTOS FALTANDO ===');
    let created = 0;
    let errors = 0;

    for (const item of faltando) {
      const discId = discMap[item.disciplina];
      if (!discId) {
        console.log('  Disciplina não encontrada: ' + item.disciplina);
        errors++;
        continue;
      }

      const { error } = await supabase
        .from('assuntos')
        .insert({
          nome: item.assunto,
          disciplina_id: discId,
          qtd_questoes: item.count
        });

      if (error) {
        console.log('  Erro ao criar "' + item.assunto + '": ' + error.message);
        errors++;
      } else {
        created++;
      }
    }
    console.log('\nCriados: ' + created + ' assuntos');
    console.log('Erros: ' + errors);
  }

  // Agora fazer o mesmo para subassuntos
  console.log('\n\n=== BUSCANDO SUBASSUNTOS FALTANDO ===\n');

  // Buscar todos os subassuntos únicos das questões
  const { data: questoesSubassuntos } = await supabase
    .from('questoes')
    .select('disciplina, assunto, subassunto')
    .not('subassunto', 'is', null);

  // Buscar todos os subassuntos da tabela
  const { data: subassuntosTabela } = await supabase
    .from('subassuntos')
    .select('nome, assunto_id, assuntos(nome, disciplinas(nome))');

  // Buscar assuntos atualizados (depois de criar os novos)
  const { data: assuntosAtualizados } = await supabase
    .from('assuntos')
    .select('id, nome, disciplina_id, disciplinas(nome)');

  // Criar mapa de assuntos
  const assuntoMap = {};
  assuntosAtualizados?.forEach(a => {
    const discNome = a.disciplinas?.nome || '';
    assuntoMap[discNome + '|' + a.nome] = a.id;
  });

  // Criar set de subassuntos existentes
  const subassuntosExistentes = new Set();
  subassuntosTabela?.forEach(s => {
    const assNome = s.assuntos?.nome || '';
    const discNome = s.assuntos?.disciplinas?.nome || '';
    subassuntosExistentes.add(discNome + '|' + assNome + '|' + s.nome);
  });

  // Encontrar subassuntos faltando
  const subassuntosFaltando = {};
  questoesSubassuntos?.forEach(q => {
    if (!q.subassunto || !q.assunto || !q.disciplina) return;
    const key = q.disciplina + '|' + q.assunto + '|' + q.subassunto;
    if (!subassuntosExistentes.has(key)) {
      if (!subassuntosFaltando[key]) {
        subassuntosFaltando[key] = {
          disciplina: q.disciplina,
          assunto: q.assunto,
          subassunto: q.subassunto,
          count: 0
        };
      }
      subassuntosFaltando[key].count++;
    }
  });

  const subFaltando = Object.values(subassuntosFaltando).sort((a, b) => b.count - a.count);
  console.log('SUBASSUNTOS FALTANDO NA TABELA: ' + subFaltando.length + '\n');

  subFaltando.slice(0, 20).forEach(s => {
    console.log('  [' + s.disciplina + ' > ' + s.assunto + '] ' + s.subassunto + ': ' + s.count + ' questões');
  });

  if (subFaltando.length > 20) {
    console.log('  ... e mais ' + (subFaltando.length - 20) + ' subassuntos');
  }

  // Criar os subassuntos faltando
  if (subFaltando.length > 0) {
    console.log('\n=== CRIANDO SUBASSUNTOS FALTANDO ===');
    let created = 0;
    let errors = 0;

    for (const item of subFaltando) {
      const assuntoKey = item.disciplina + '|' + item.assunto;
      const assuntoId = assuntoMap[assuntoKey];

      if (!assuntoId) {
        // Assunto não existe, pular
        errors++;
        continue;
      }

      // Criar nome_normalizado (lowercase, sem acentos)
      const nomeNormalizado = item.subassunto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();

      const { error } = await supabase
        .from('subassuntos')
        .insert({
          nome: item.subassunto,
          nome_normalizado: nomeNormalizado,
          assunto_id: assuntoId,
          qtd_questoes: item.count
        });

      if (error) {
        console.log('  Erro ao criar "' + item.subassunto + '": ' + error.message);
        errors++;
      } else {
        created++;
      }
    }
    console.log('\nCriados: ' + created + ' subassuntos');
    console.log('Erros/Ignorados: ' + errors);
  }

  console.log('\n=== CONCLUÍDO ===');
}

findAndCreateMissing().catch(console.error);
