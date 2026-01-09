/**
 * Script para criar as tabelas do PREPARAMED no Supabase
 * Execute com: node Medicina/scripts/criar-tabelas-med.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zkcstkbpgwdoiihvfspp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprY3N0a2JwZ3dkb2lpaHZmc3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkzNDYwNCwiZXhwIjoyMDgxNTEwNjA0fQ.QkG18I254LiSZRsZ8-uvX8seIfJKfaazdciO__fjVOE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function criarTabelas() {
  console.log('🏥 Iniciando criação das tabelas PREPARAMED...\n');

  // 1. DISCIPLINAS MÉDICAS
  console.log('1. Criando tabela disciplinas_MED...');
  const { error: err1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS disciplinas_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        nome_normalizado TEXT,
        icone TEXT DEFAULT 'medical_services',
        cor TEXT DEFAULT '#3B82F6',
        ordem INTEGER DEFAULT 0,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err1) console.log('   Erro:', err1.message);
  else console.log('   ✓ OK');

  // 2. ASSUNTOS
  console.log('2. Criando tabela assuntos_MED...');
  const { error: err2 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS assuntos_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        disciplina_id UUID REFERENCES disciplinas_MED(id) ON DELETE CASCADE,
        parent_id UUID,
        nome TEXT NOT NULL,
        nome_normalizado TEXT,
        slug TEXT,
        ordem INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err2) console.log('   Erro:', err2.message);
  else console.log('   ✓ OK');

  // 3. SUBASSUNTOS
  console.log('3. Criando tabela subassuntos_MED...');
  const { error: err3 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS subassuntos_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assunto_id UUID REFERENCES assuntos_MED(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        nome_normalizado TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err3) console.log('   Erro:', err3.message);
  else console.log('   ✓ OK');

  // 4. TEORIAS
  console.log('4. Criando tabela teorias_MED...');
  const { error: err4 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS teorias_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        disciplina_id UUID,
        assunto_id UUID,
        subassunto_id UUID,
        titulo TEXT NOT NULL,
        subtitulo TEXT,
        conteudo_basico JSONB,
        conteudo_avancado JSONB,
        conteudo_expert JSONB,
        pontos_chave TEXT[],
        macetes TEXT[],
        pegadinhas TEXT[],
        correlacao_clinica TEXT,
        tabela_resumo JSONB,
        referencias_bibliograficas JSONB,
        artigos_relacionados UUID[],
        tempo_leitura_minutos INTEGER DEFAULT 10,
        nivel_dificuldade INTEGER DEFAULT 3,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err4) console.log('   Erro:', err4.message);
  else console.log('   ✓ OK');

  // 5. QUESTÕES
  console.log('5. Criando tabela questoes_MED...');
  const { error: err5 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS questoes_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        disciplina_id UUID,
        assunto_id UUID,
        subassunto_id UUID,
        enunciado TEXT NOT NULL,
        alternativas JSONB NOT NULL,
        gabarito TEXT NOT NULL,
        banca TEXT,
        ano INTEGER,
        instituicao TEXT,
        prova TEXT,
        dificuldade INTEGER DEFAULT 3,
        teoria_id UUID,
        total_respostas INTEGER DEFAULT 0,
        total_acertos INTEGER DEFAULT 0,
        comentario_ia TEXT,
        explicacao TEXT,
        tags TEXT[],
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err5) console.log('   Erro:', err5.message);
  else console.log('   ✓ OK');

  // 6. RESPOSTAS
  console.log('6. Criando tabela respostas_MED...');
  const { error: err6 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS respostas_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        questao_id UUID,
        resposta_selecionada TEXT NOT NULL,
        acertou BOOLEAN NOT NULL,
        tempo_segundos INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err6) console.log('   Erro:', err6.message);
  else console.log('   ✓ OK');

  // 7. PROGRESSO DE LEITURA
  console.log('7. Criando tabela progresso_leitura_MED...');
  const { error: err7 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS progresso_leitura_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        teoria_id UUID,
        nivel_lido TEXT DEFAULT 'basico',
        lido BOOLEAN DEFAULT false,
        favorito BOOLEAN DEFAULT false,
        ultima_leitura TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err7) console.log('   Erro:', err7.message);
  else console.log('   ✓ OK');

  // 8. ANOTAÇÕES
  console.log('8. Criando tabela anotacoes_MED...');
  const { error: err8 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS anotacoes_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        teoria_id UUID,
        questao_id UUID,
        artigo_id UUID,
        titulo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        tags TEXT[],
        favorito BOOLEAN DEFAULT false,
        pasta TEXT,
        destaques JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err8) console.log('   Erro:', err8.message);
  else console.log('   ✓ OK');

  // 9. ARTIGOS
  console.log('9. Criando tabela artigos_MED...');
  const { error: err9 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS artigos_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pubmed_id TEXT,
        doi TEXT,
        titulo TEXT NOT NULL,
        autores TEXT[],
        journal TEXT,
        ano INTEGER,
        abstract_original TEXT,
        resumo_ia TEXT,
        pontos_principais TEXT[],
        url TEXT,
        pdf_url TEXT,
        acesso_livre BOOLEAN DEFAULT false,
        disciplinas UUID[],
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err9) console.log('   Erro:', err9.message);
  else console.log('   ✓ OK');

  // 10. TEORIA-ARTIGOS
  console.log('10. Criando tabela teoria_artigos_MED...');
  const { error: err10 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS teoria_artigos_MED (
        teoria_id UUID,
        artigo_id UUID,
        relevancia INTEGER DEFAULT 3,
        PRIMARY KEY (teoria_id, artigo_id)
      );
    `
  });
  if (err10) console.log('   Erro:', err10.message);
  else console.log('   ✓ OK');

  // 11. SIMULADOS
  console.log('11. Criando tabela simulados_MED...');
  const { error: err11 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS simulados_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        nome TEXT NOT NULL,
        tipo TEXT DEFAULT 'personalizado',
        prova_referencia TEXT,
        disciplinas UUID[],
        dificuldade_min INTEGER,
        dificuldade_max INTEGER,
        bancas TEXT[],
        anos INTEGER[],
        questoes_ids UUID[],
        total_questoes INTEGER,
        tempo_limite_minutos INTEGER,
        tempo_gasto_segundos INTEGER DEFAULT 0,
        questoes_corretas INTEGER DEFAULT 0,
        status TEXT DEFAULT 'em_andamento',
        data_inicio TIMESTAMPTZ DEFAULT NOW(),
        data_fim TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err11) console.log('   Erro:', err11.message);
  else console.log('   ✓ OK');

  // 12. SIMULADO RESPOSTAS
  console.log('12. Criando tabela simulado_respostas_MED...');
  const { error: err12 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS simulado_respostas_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        simulado_id UUID,
        questao_id UUID,
        resposta TEXT,
        acertou BOOLEAN,
        tempo_segundos INTEGER,
        ordem INTEGER
      );
    `
  });
  if (err12) console.log('   Erro:', err12.message);
  else console.log('   ✓ OK');

  // 13. FÓRUM TÓPICOS
  console.log('13. Criando tabela forum_topicos_MED...');
  const { error: err13 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS forum_topicos_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        titulo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        disciplina_id UUID,
        categoria TEXT DEFAULT 'discussao',
        questao_id UUID,
        teoria_id UUID,
        visualizacoes INTEGER DEFAULT 0,
        total_respostas INTEGER DEFAULT 0,
        fixado BOOLEAN DEFAULT false,
        destaque BOOLEAN DEFAULT false,
        resolvido BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err13) console.log('   Erro:', err13.message);
  else console.log('   ✓ OK');

  // 14. FÓRUM RESPOSTAS
  console.log('14. Criando tabela forum_respostas_MED...');
  const { error: err14 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS forum_respostas_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topico_id UUID,
        user_id UUID,
        parent_id UUID,
        conteudo TEXT NOT NULL,
        votos_positivos INTEGER DEFAULT 0,
        votos_negativos INTEGER DEFAULT 0,
        melhor_resposta BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err14) console.log('   Erro:', err14.message);
  else console.log('   ✓ OK');

  // 15. FÓRUM VOTOS
  console.log('15. Criando tabela forum_votos_MED...');
  const { error: err15 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS forum_votos_MED (
        user_id UUID,
        resposta_id UUID,
        tipo TEXT NOT NULL,
        PRIMARY KEY (user_id, resposta_id)
      );
    `
  });
  if (err15) console.log('   Erro:', err15.message);
  else console.log('   ✓ OK');

  // 16. PROFILES
  console.log('16. Criando tabela profiles_MED...');
  const { error: err16 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS profiles_MED (
        id UUID PRIMARY KEY,
        nome TEXT,
        email TEXT,
        avatar_url TEXT,
        faculdade TEXT,
        ano_curso INTEGER,
        estado TEXT,
        cidade TEXT,
        plano TEXT DEFAULT 'gratuito',
        questoes_respondidas INTEGER DEFAULT 0,
        questoes_corretas INTEGER DEFAULT 0,
        tempo_estudo_segundos INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err16) console.log('   Erro:', err16.message);
  else console.log('   ✓ OK');

  // 17. ASSINATURAS
  console.log('17. Criando tabela assinaturas_MED...');
  const { error: err17 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS assinaturas_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        plano TEXT NOT NULL,
        status TEXT DEFAULT 'ativa',
        gateway TEXT,
        external_id TEXT,
        data_inicio TIMESTAMPTZ DEFAULT NOW(),
        data_fim TIMESTAMPTZ,
        proximo_pagamento TIMESTAMPTZ,
        valor_mensal DECIMAL(10,2),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err17) console.log('   Erro:', err17.message);
  else console.log('   ✓ OK');

  // 18. LIMITES DE USO
  console.log('18. Criando tabela limites_uso_MED...');
  const { error: err18 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS limites_uso_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        mes_referencia TEXT NOT NULL,
        questoes_dia INTEGER DEFAULT 0,
        data_questoes DATE DEFAULT CURRENT_DATE,
        simulados_mes INTEGER DEFAULT 0,
        perguntas_ia_mes INTEGER DEFAULT 0,
        resumos_ia_mes INTEGER DEFAULT 0,
        flashcards_ia_mes INTEGER DEFAULT 0,
        anotacoes_total INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err18) console.log('   Erro:', err18.message);
  else console.log('   ✓ OK');

  // 19. ESTUDO DIÁRIO
  console.log('19. Criando tabela estudo_diario_MED...');
  const { error: err19 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS estudo_diario_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        data DATE NOT NULL,
        questoes_feitas INTEGER DEFAULT 0,
        questoes_corretas INTEGER DEFAULT 0,
        teorias_lidas INTEGER DEFAULT 0,
        tempo_leitura_segundos INTEGER DEFAULT 0,
        simulados_feitos INTEGER DEFAULT 0,
        perguntas_ia INTEGER DEFAULT 0,
        tempo_total_segundos INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err19) console.log('   Erro:', err19.message);
  else console.log('   ✓ OK');

  // 20. FLASHCARDS
  console.log('20. Criando tabela flashcards_MED...');
  const { error: err20 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS flashcards_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        disciplina_id UUID,
        assunto_id UUID,
        teoria_id UUID,
        frente TEXT NOT NULL,
        verso TEXT NOT NULL,
        repeticoes INTEGER DEFAULT 0,
        fator_facilidade DECIMAL(3,2) DEFAULT 2.50,
        intervalo INTEGER DEFAULT 1,
        proxima_revisao DATE DEFAULT CURRENT_DATE,
        gerado_por_ia BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err20) console.log('   Erro:', err20.message);
  else console.log('   ✓ OK');

  // 21. CHAT IA
  console.log('21. Criando tabela chat_ia_MED...');
  const { error: err21 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS chat_ia_MED (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        mensagem_usuario TEXT NOT NULL,
        resposta_ia TEXT NOT NULL,
        contexto JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (err21) console.log('   Erro:', err21.message);
  else console.log('   ✓ OK');

  console.log('\n✅ Tabelas criadas com sucesso!');
}

async function inserirDisciplinas() {
  console.log('\n📚 Inserindo disciplinas médicas...\n');

  const disciplinas = [
    { nome: 'Anatomia', nome_normalizado: 'anatomia', icone: 'skeleton', cor: '#EF4444', ordem: 1 },
    { nome: 'Fisiologia', nome_normalizado: 'fisiologia', icone: 'heart_pulse', cor: '#F97316', ordem: 2 },
    { nome: 'Histologia', nome_normalizado: 'histologia', icone: 'microscope', cor: '#F59E0B', ordem: 3 },
    { nome: 'Embriologia', nome_normalizado: 'embriologia', icone: 'baby', cor: '#EAB308', ordem: 4 },
    { nome: 'Bioquímica', nome_normalizado: 'bioquimica', icone: 'flask', cor: '#84CC16', ordem: 5 },
    { nome: 'Farmacologia', nome_normalizado: 'farmacologia', icone: 'pill', cor: '#22C55E', ordem: 6 },
    { nome: 'Patologia', nome_normalizado: 'patologia', icone: 'virus', cor: '#10B981', ordem: 7 },
    { nome: 'Microbiologia', nome_normalizado: 'microbiologia', icone: 'bacteria', cor: '#14B8A6', ordem: 8 },
    { nome: 'Imunologia', nome_normalizado: 'imunologia', icone: 'shield', cor: '#06B6D4', ordem: 9 },
    { nome: 'Parasitologia', nome_normalizado: 'parasitologia', icone: 'bug', cor: '#0EA5E9', ordem: 10 },
    { nome: 'Semiologia', nome_normalizado: 'semiologia', icone: 'stethoscope', cor: '#3B82F6', ordem: 11 },
    { nome: 'Clínica Médica', nome_normalizado: 'clinica_medica', icone: 'hospital', cor: '#6366F1', ordem: 12 },
    { nome: 'Cirurgia', nome_normalizado: 'cirurgia', icone: 'scalpel', cor: '#8B5CF6', ordem: 13 },
    { nome: 'Pediatria', nome_normalizado: 'pediatria', icone: 'child', cor: '#A855F7', ordem: 14 },
    { nome: 'Ginecologia e Obstetrícia', nome_normalizado: 'ginecologia_obstetricia', icone: 'pregnant', cor: '#D946EF', ordem: 15 },
    { nome: 'Psiquiatria', nome_normalizado: 'psiquiatria', icone: 'brain', cor: '#EC4899', ordem: 16 },
    { nome: 'Medicina Preventiva', nome_normalizado: 'medicina_preventiva', icone: 'shield_check', cor: '#F43F5E', ordem: 17 },
    { nome: 'Ética Médica', nome_normalizado: 'etica_medica', icone: 'gavel', cor: '#64748B', ordem: 18 },
    { nome: 'Ortopedia', nome_normalizado: 'ortopedia', icone: 'bone', cor: '#78716C', ordem: 19 },
    { nome: 'Oftalmologia', nome_normalizado: 'oftalmologia', icone: 'eye', cor: '#0D9488', ordem: 20 },
    { nome: 'Otorrinolaringologia', nome_normalizado: 'otorrinolaringologia', icone: 'ear', cor: '#059669', ordem: 21 },
    { nome: 'Dermatologia', nome_normalizado: 'dermatologia', icone: 'skin', cor: '#D97706', ordem: 22 },
    { nome: 'Neurologia', nome_normalizado: 'neurologia', icone: 'brain', cor: '#7C3AED', ordem: 23 },
    { nome: 'Cardiologia', nome_normalizado: 'cardiologia', icone: 'heart', cor: '#DC2626', ordem: 24 },
    { nome: 'Pneumologia', nome_normalizado: 'pneumologia', icone: 'lungs', cor: '#2563EB', ordem: 25 },
    { nome: 'Gastroenterologia', nome_normalizado: 'gastroenterologia', icone: 'stomach', cor: '#CA8A04', ordem: 26 },
    { nome: 'Nefrologia', nome_normalizado: 'nefrologia', icone: 'kidney', cor: '#9333EA', ordem: 27 },
    { nome: 'Endocrinologia', nome_normalizado: 'endocrinologia', icone: 'thyroid', cor: '#C026D3', ordem: 28 },
    { nome: 'Hematologia', nome_normalizado: 'hematologia', icone: 'blood', cor: '#BE123C', ordem: 29 },
    { nome: 'Infectologia', nome_normalizado: 'infectologia', icone: 'virus', cor: '#15803D', ordem: 30 },
    { nome: 'Reumatologia', nome_normalizado: 'reumatologia', icone: 'joint', cor: '#1D4ED8', ordem: 31 },
    { nome: 'Geriatria', nome_normalizado: 'geriatria', icone: 'elderly', cor: '#6B7280', ordem: 32 },
    { nome: 'Medicina de Emergência', nome_normalizado: 'medicina_emergencia', icone: 'ambulance', cor: '#B91C1C', ordem: 33 },
    { nome: 'Medicina Intensiva', nome_normalizado: 'medicina_intensiva', icone: 'monitor', cor: '#991B1B', ordem: 34 },
    { nome: 'Radiologia', nome_normalizado: 'radiologia', icone: 'xray', cor: '#374151', ordem: 35 },
    { nome: 'Medicina Legal', nome_normalizado: 'medicina_legal', icone: 'scale', cor: '#1F2937', ordem: 36 }
  ];

  for (const disc of disciplinas) {
    const { error } = await supabase.from('disciplinas_MED').upsert(disc, { onConflict: 'nome_normalizado' });
    if (error) {
      console.log(`   ❌ ${disc.nome}: ${error.message}`);
    } else {
      console.log(`   ✓ ${disc.nome}`);
    }
  }

  console.log('\n✅ Disciplinas inseridas!');
}

async function inserirAssuntos() {
  console.log('\n📖 Inserindo assuntos...\n');

  // Buscar IDs das disciplinas
  const { data: disciplinas } = await supabase.from('disciplinas_MED').select('id, nome_normalizado');

  if (!disciplinas) {
    console.log('Erro: Disciplinas não encontradas');
    return;
  }

  const discMap = {};
  disciplinas.forEach(d => discMap[d.nome_normalizado] = d.id);

  // Assuntos de Anatomia
  if (discMap['anatomia']) {
    const assuntosAnatomia = [
      { disciplina_id: discMap['anatomia'], nome: 'Sistema Esquelético', nome_normalizado: 'sistema_esqueletico', ordem: 1 },
      { disciplina_id: discMap['anatomia'], nome: 'Sistema Muscular', nome_normalizado: 'sistema_muscular', ordem: 2 },
      { disciplina_id: discMap['anatomia'], nome: 'Sistema Cardiovascular', nome_normalizado: 'sistema_cardiovascular', ordem: 3 },
      { disciplina_id: discMap['anatomia'], nome: 'Sistema Respiratório', nome_normalizado: 'sistema_respiratorio', ordem: 4 },
      { disciplina_id: discMap['anatomia'], nome: 'Sistema Digestório', nome_normalizado: 'sistema_digestorio', ordem: 5 },
      { disciplina_id: discMap['anatomia'], nome: 'Sistema Nervoso', nome_normalizado: 'sistema_nervoso', ordem: 6 },
      { disciplina_id: discMap['anatomia'], nome: 'Sistema Urinário', nome_normalizado: 'sistema_urinario', ordem: 7 },
      { disciplina_id: discMap['anatomia'], nome: 'Sistema Reprodutor', nome_normalizado: 'sistema_reprodutor', ordem: 8 },
      { disciplina_id: discMap['anatomia'], nome: 'Sistema Endócrino', nome_normalizado: 'sistema_endocrino', ordem: 9 },
      { disciplina_id: discMap['anatomia'], nome: 'Anatomia de Cabeça e Pescoço', nome_normalizado: 'cabeca_pescoco', ordem: 10 }
    ];
    for (const a of assuntosAnatomia) {
      await supabase.from('assuntos_MED').upsert(a, { onConflict: 'disciplina_id,nome_normalizado' });
    }
    console.log('   ✓ Assuntos de Anatomia');
  }

  // Assuntos de Clínica Médica
  if (discMap['clinica_medica']) {
    const assuntosClinica = [
      { disciplina_id: discMap['clinica_medica'], nome: 'Hipertensão Arterial', nome_normalizado: 'hipertensao', ordem: 1 },
      { disciplina_id: discMap['clinica_medica'], nome: 'Diabetes Mellitus', nome_normalizado: 'diabetes', ordem: 2 },
      { disciplina_id: discMap['clinica_medica'], nome: 'Insuficiência Cardíaca', nome_normalizado: 'insuficiencia_cardiaca', ordem: 3 },
      { disciplina_id: discMap['clinica_medica'], nome: 'Doença Arterial Coronariana', nome_normalizado: 'dac', ordem: 4 },
      { disciplina_id: discMap['clinica_medica'], nome: 'Arritmias', nome_normalizado: 'arritmias', ordem: 5 },
      { disciplina_id: discMap['clinica_medica'], nome: 'DPOC', nome_normalizado: 'dpoc', ordem: 6 },
      { disciplina_id: discMap['clinica_medica'], nome: 'Asma', nome_normalizado: 'asma', ordem: 7 },
      { disciplina_id: discMap['clinica_medica'], nome: 'Pneumonias', nome_normalizado: 'pneumonias', ordem: 8 },
      { disciplina_id: discMap['clinica_medica'], nome: 'Infecção do Trato Urinário', nome_normalizado: 'itu', ordem: 9 },
      { disciplina_id: discMap['clinica_medica'], nome: 'Sepse', nome_normalizado: 'sepse', ordem: 10 }
    ];
    for (const a of assuntosClinica) {
      await supabase.from('assuntos_MED').upsert(a, { onConflict: 'disciplina_id,nome_normalizado' });
    }
    console.log('   ✓ Assuntos de Clínica Médica');
  }

  // Assuntos de Cirurgia
  if (discMap['cirurgia']) {
    const assuntosCirurgia = [
      { disciplina_id: discMap['cirurgia'], nome: 'Pré e Pós-Operatório', nome_normalizado: 'pre_pos_operatorio', ordem: 1 },
      { disciplina_id: discMap['cirurgia'], nome: 'Trauma', nome_normalizado: 'trauma', ordem: 2 },
      { disciplina_id: discMap['cirurgia'], nome: 'Abdome Agudo', nome_normalizado: 'abdome_agudo', ordem: 3 },
      { disciplina_id: discMap['cirurgia'], nome: 'Hérnias', nome_normalizado: 'hernias', ordem: 4 },
      { disciplina_id: discMap['cirurgia'], nome: 'Cirurgia do Aparelho Digestivo', nome_normalizado: 'cirurgia_digestivo', ordem: 5 }
    ];
    for (const a of assuntosCirurgia) {
      await supabase.from('assuntos_MED').upsert(a, { onConflict: 'disciplina_id,nome_normalizado' });
    }
    console.log('   ✓ Assuntos de Cirurgia');
  }

  // Assuntos de Pediatria
  if (discMap['pediatria']) {
    const assuntosPediatria = [
      { disciplina_id: discMap['pediatria'], nome: 'Neonatologia', nome_normalizado: 'neonatologia', ordem: 1 },
      { disciplina_id: discMap['pediatria'], nome: 'Crescimento e Desenvolvimento', nome_normalizado: 'crescimento_desenvolvimento', ordem: 2 },
      { disciplina_id: discMap['pediatria'], nome: 'Aleitamento Materno', nome_normalizado: 'aleitamento', ordem: 3 },
      { disciplina_id: discMap['pediatria'], nome: 'Imunizações', nome_normalizado: 'imunizacoes', ordem: 4 },
      { disciplina_id: discMap['pediatria'], nome: 'Doenças Exantemáticas', nome_normalizado: 'exantematicas', ordem: 5 }
    ];
    for (const a of assuntosPediatria) {
      await supabase.from('assuntos_MED').upsert(a, { onConflict: 'disciplina_id,nome_normalizado' });
    }
    console.log('   ✓ Assuntos de Pediatria');
  }

  // Assuntos de Ginecologia e Obstetrícia
  if (discMap['ginecologia_obstetricia']) {
    const assuntosGO = [
      { disciplina_id: discMap['ginecologia_obstetricia'], nome: 'Pré-Natal', nome_normalizado: 'pre_natal', ordem: 1 },
      { disciplina_id: discMap['ginecologia_obstetricia'], nome: 'Parto', nome_normalizado: 'parto', ordem: 2 },
      { disciplina_id: discMap['ginecologia_obstetricia'], nome: 'Síndromes Hipertensivas na Gestação', nome_normalizado: 'sindromes_hipertensivas', ordem: 3 },
      { disciplina_id: discMap['ginecologia_obstetricia'], nome: 'Diabetes Gestacional', nome_normalizado: 'diabetes_gestacional', ordem: 4 },
      { disciplina_id: discMap['ginecologia_obstetricia'], nome: 'Câncer de Colo de Útero', nome_normalizado: 'cancer_colo', ordem: 5 }
    ];
    for (const a of assuntosGO) {
      await supabase.from('assuntos_MED').upsert(a, { onConflict: 'disciplina_id,nome_normalizado' });
    }
    console.log('   ✓ Assuntos de Ginecologia e Obstetrícia');
  }

  console.log('\n✅ Assuntos inseridos!');
}

async function main() {
  try {
    await criarTabelas();
    await inserirDisciplinas();
    await inserirAssuntos();

    console.log('\n========================================');
    console.log('🎉 PREPARAMED - Setup concluído!');
    console.log('========================================\n');
  } catch (error) {
    console.error('Erro:', error);
  }
}

main();
