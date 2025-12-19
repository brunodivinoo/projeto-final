/**
 * Script para importar questões para o banco de dados
 * Com controle de duplicidade e normalização de nomes
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://zkcstkbpgwdoiihvfspp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprY3N0a2JwZ3dkb2lpaHZmc3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkzNDYwNCwiZXhwIjoyMDgxNTEwNjA0fQ.QkG18I254LiSZRsZ8-uvX8seIfJKfaazdciO__fjVOE'
);

// Função para normalizar texto (remover acentos, lowercase)
function normalizar(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// Cache de disciplinas/assuntos/subassuntos para evitar consultas repetidas
const cache = {
  disciplinas: {},
  assuntos: {},
  subassuntos: {}
};

// Buscar ou criar disciplina
async function getOrCreateDisciplina(nome) {
  const nomeNormalizado = normalizar(nome);

  if (cache.disciplinas[nomeNormalizado]) {
    return cache.disciplinas[nomeNormalizado];
  }

  // Tentar buscar
  let { data } = await supabase
    .from('disciplinas')
    .select('id')
    .eq('nome_normalizado', nomeNormalizado)
    .single();

  if (!data) {
    // Criar nova
    const { data: nova, error } = await supabase
      .from('disciplinas')
      .insert({ nome, nome_normalizado: nomeNormalizado })
      .select('id')
      .single();

    if (error) {
      // Pode ter sido criada por outra requisição
      const { data: existente } = await supabase
        .from('disciplinas')
        .select('id')
        .eq('nome_normalizado', nomeNormalizado)
        .single();
      data = existente;
    } else {
      data = nova;
    }
  }

  cache.disciplinas[nomeNormalizado] = data.id;
  return data.id;
}

// Buscar ou criar assunto
async function getOrCreateAssunto(disciplinaId, nome) {
  if (!nome) return null;

  const nomeNormalizado = normalizar(nome);
  const cacheKey = `${disciplinaId}_${nomeNormalizado}`;

  if (cache.assuntos[cacheKey]) {
    return cache.assuntos[cacheKey];
  }

  // Tentar buscar
  let { data } = await supabase
    .from('assuntos')
    .select('id')
    .eq('disciplina_id', disciplinaId)
    .eq('nome_normalizado', nomeNormalizado)
    .single();

  if (!data) {
    // Criar novo
    const { data: novo, error } = await supabase
      .from('assuntos')
      .insert({ disciplina_id: disciplinaId, nome, nome_normalizado: nomeNormalizado })
      .select('id')
      .single();

    if (error) {
      const { data: existente } = await supabase
        .from('assuntos')
        .select('id')
        .eq('disciplina_id', disciplinaId)
        .eq('nome_normalizado', nomeNormalizado)
        .single();
      data = existente;
    } else {
      data = novo;
    }
  }

  cache.assuntos[cacheKey] = data.id;
  return data.id;
}

// Buscar ou criar subassunto
async function getOrCreateSubassunto(assuntoId, nome) {
  if (!nome || !assuntoId) return null;

  const nomeNormalizado = normalizar(nome);
  const cacheKey = `${assuntoId}_${nomeNormalizado}`;

  if (cache.subassuntos[cacheKey]) {
    return cache.subassuntos[cacheKey];
  }

  // Tentar buscar
  let { data } = await supabase
    .from('subassuntos')
    .select('id')
    .eq('assunto_id', assuntoId)
    .eq('nome_normalizado', nomeNormalizado)
    .single();

  if (!data) {
    // Criar novo
    const { data: novo, error } = await supabase
      .from('subassuntos')
      .insert({ assunto_id: assuntoId, nome, nome_normalizado: nomeNormalizado })
      .select('id')
      .single();

    if (error) {
      const { data: existente } = await supabase
        .from('subassuntos')
        .select('id')
        .eq('assunto_id', assuntoId)
        .eq('nome_normalizado', nomeNormalizado)
        .single();
      data = existente;
    } else {
      data = novo;
    }
  }

  cache.subassuntos[cacheKey] = data.id;
  return data.id;
}

// Importar uma questão
async function importarQuestao(questao) {
  // Criar/buscar disciplina, assunto e subassunto
  const disciplinaId = await getOrCreateDisciplina(questao.disciplina);
  const assuntoId = await getOrCreateAssunto(disciplinaId, questao.assunto);
  if (questao.subassunto) {
    await getOrCreateSubassunto(assuntoId, questao.subassunto);
  }

  // Preparar dados da questão
  const dadosQuestao = {
    id_original: questao.id,
    tipo_prova: questao.tipo_prova || 'concurso',
    modalidade: questao.modalidade,
    disciplina: questao.disciplina,
    assunto: questao.assunto,
    subassunto: questao.subassunto,
    banca: questao.banca,
    ano: questao.ano,
    dificuldade: questao.dificuldade || 'media',
    enunciado: questao.enunciado,
    gabarito: questao.gabarito,
    comentario: questao.comentario,
    alternativa_a: questao.alternativa_a,
    alternativa_b: questao.alternativa_b,
    alternativa_c: questao.alternativa_c,
    alternativa_d: questao.alternativa_d,
    alternativa_e: questao.alternativa_e
  };

  // Inserir questão (vai falhar se id_original já existir)
  const { error } = await supabase
    .from('questoes')
    .insert(dadosQuestao);

  if (error) {
    if (error.code === '23505') {
      // Duplicata - ignorar
      return { status: 'duplicada', id: questao.id };
    }
    return { status: 'erro', id: questao.id, error: error.message };
  }

  return { status: 'inserida', id: questao.id };
}

// Atualizar contadores das tabelas de lookup
async function atualizarContadores() {
  console.log('\n📊 Atualizando contadores...');

  // Atualizar disciplinas
  await supabase.rpc('exec_sql', {
    sql: `
      UPDATE disciplinas d SET qtd_questoes = (
        SELECT COUNT(*) FROM questoes q WHERE q.disciplina = d.nome
      )
    `
  });

  // Atualizar assuntos
  await supabase.rpc('exec_sql', {
    sql: `
      UPDATE assuntos a SET qtd_questoes = (
        SELECT COUNT(*) FROM questoes q
        JOIN disciplinas d ON d.nome = q.disciplina
        WHERE d.id = a.disciplina_id AND q.assunto = a.nome
      )
    `
  });

  // Atualizar subassuntos
  await supabase.rpc('exec_sql', {
    sql: `
      UPDATE subassuntos s SET qtd_questoes = (
        SELECT COUNT(*) FROM questoes q
        JOIN disciplinas d ON d.nome = q.disciplina
        JOIN assuntos a ON a.disciplina_id = d.id AND a.nome = q.assunto
        WHERE a.id = s.assunto_id AND q.subassunto = s.nome
      )
    `
  });

  console.log('✅ Contadores atualizados!');
}

// Função principal
async function importarArquivo(caminhoArquivo, limite = null) {
  console.log(`\n📂 Lendo arquivo: ${caminhoArquivo}`);

  const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
  const dados = JSON.parse(conteudo);
  let questoes = dados.questoes;

  if (limite) {
    questoes = questoes.slice(0, limite);
  }

  console.log(`📝 Total de questões no arquivo: ${dados.questoes.length}`);
  console.log(`📝 Questões a processar: ${questoes.length}`);

  let inseridas = 0;
  let duplicadas = 0;
  let erros = 0;

  // Processar em lotes de 50 para melhor performance
  const BATCH_SIZE = 50;
  for (let i = 0; i < questoes.length; i += BATCH_SIZE) {
    const lote = questoes.slice(i, i + BATCH_SIZE);

    const resultados = await Promise.all(
      lote.map(q => importarQuestao(q))
    );

    resultados.forEach(r => {
      if (r.status === 'inserida') inseridas++;
      else if (r.status === 'duplicada') duplicadas++;
      else erros++;
    });

    // Mostrar progresso
    const progresso = Math.min(i + BATCH_SIZE, questoes.length);
    process.stdout.write(`\r⏳ Progresso: ${progresso}/${questoes.length} (${Math.round(progresso/questoes.length*100)}%)`);
  }

  console.log(`\n\n✅ Importação concluída!`);
  console.log(`   📥 Inseridas: ${inseridas}`);
  console.log(`   🔄 Duplicadas (ignoradas): ${duplicadas}`);
  console.log(`   ❌ Erros: ${erros}`);

  return { inseridas, duplicadas, erros };
}

// Exportar funções
module.exports = {
  importarArquivo,
  atualizarContadores,
  normalizar
};

// Se executado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Uso: node importar-questoes.js <arquivo.json> [limite]');
    console.log('Exemplo: node importar-questoes.js questoes_ce.json 20');
    process.exit(1);
  }

  const arquivo = args[0];
  const limite = args[1] ? parseInt(args[1]) : null;

  importarArquivo(arquivo, limite)
    .then(() => atualizarContadores())
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Erro:', err);
      process.exit(1);
    });
}
