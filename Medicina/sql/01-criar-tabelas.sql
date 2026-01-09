-- =============================================
-- PREPARAMED - Script de Criação de Tabelas
-- Todas as tabelas com sufixo _MED
-- =============================================

-- 1. DISCIPLINAS MÉDICAS
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

-- 2. ASSUNTOS
CREATE TABLE IF NOT EXISTS assuntos_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID REFERENCES disciplinas_MED(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES assuntos_MED(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  nome_normalizado TEXT,
  slug TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBASSUNTOS
CREATE TABLE IF NOT EXISTS subassuntos_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto_id UUID REFERENCES assuntos_MED(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nome_normalizado TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEORIAS (BIBLIOTECA)
CREATE TABLE IF NOT EXISTS teorias_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID REFERENCES disciplinas_MED(id) ON DELETE SET NULL,
  assunto_id UUID REFERENCES assuntos_MED(id) ON DELETE SET NULL,
  subassunto_id UUID REFERENCES subassuntos_MED(id) ON DELETE SET NULL,

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

-- 5. QUESTÕES MÉDICAS
CREATE TABLE IF NOT EXISTS questoes_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID REFERENCES disciplinas_MED(id) ON DELETE SET NULL,
  assunto_id UUID REFERENCES assuntos_MED(id) ON DELETE SET NULL,
  subassunto_id UUID REFERENCES subassuntos_MED(id) ON DELETE SET NULL,

  enunciado TEXT NOT NULL,
  alternativas JSONB NOT NULL,
  gabarito TEXT NOT NULL,

  banca TEXT,
  ano INTEGER,
  instituicao TEXT,
  prova TEXT,
  dificuldade INTEGER DEFAULT 3 CHECK (dificuldade BETWEEN 1 AND 5),

  teoria_id UUID REFERENCES teorias_MED(id) ON DELETE SET NULL,

  total_respostas INTEGER DEFAULT 0,
  total_acertos INTEGER DEFAULT 0,

  comentario_ia TEXT,
  explicacao TEXT,
  tags TEXT[],

  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RESPOSTAS DOS USUÁRIOS
CREATE TABLE IF NOT EXISTS respostas_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  questao_id UUID REFERENCES questoes_MED(id) ON DELETE CASCADE,
  resposta_selecionada TEXT NOT NULL,
  acertou BOOLEAN NOT NULL,
  tempo_segundos INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROGRESSO DE LEITURA
CREATE TABLE IF NOT EXISTS progresso_leitura_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  teoria_id UUID REFERENCES teorias_MED(id) ON DELETE CASCADE,
  nivel_lido TEXT DEFAULT 'basico',
  lido BOOLEAN DEFAULT false,
  favorito BOOLEAN DEFAULT false,
  ultima_leitura TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, teoria_id)
);

-- 8. ANOTAÇÕES PESSOAIS
CREATE TABLE IF NOT EXISTS anotacoes_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  teoria_id UUID REFERENCES teorias_MED(id) ON DELETE SET NULL,
  questao_id UUID REFERENCES questoes_MED(id) ON DELETE SET NULL,
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

-- 9. ARTIGOS CIENTÍFICOS
CREATE TABLE IF NOT EXISTS artigos_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  pubmed_id TEXT UNIQUE,
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

-- 10. RELAÇÃO TEORIA-ARTIGO
CREATE TABLE IF NOT EXISTS teoria_artigos_MED (
  teoria_id UUID REFERENCES teorias_MED(id) ON DELETE CASCADE,
  artigo_id UUID REFERENCES artigos_MED(id) ON DELETE CASCADE,
  relevancia INTEGER DEFAULT 3,
  PRIMARY KEY (teoria_id, artigo_id)
);

-- 11. SIMULADOS
CREATE TABLE IF NOT EXISTS simulados_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

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

-- 12. RESPOSTAS DO SIMULADO
CREATE TABLE IF NOT EXISTS simulado_respostas_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulado_id UUID REFERENCES simulados_MED(id) ON DELETE CASCADE,
  questao_id UUID REFERENCES questoes_MED(id) ON DELETE CASCADE,
  resposta TEXT,
  acertou BOOLEAN,
  tempo_segundos INTEGER,
  ordem INTEGER
);

-- 13. TÓPICOS DO FÓRUM
CREATE TABLE IF NOT EXISTS forum_topicos_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,

  disciplina_id UUID REFERENCES disciplinas_MED(id) ON DELETE SET NULL,
  categoria TEXT DEFAULT 'discussao',

  questao_id UUID REFERENCES questoes_MED(id) ON DELETE SET NULL,
  teoria_id UUID REFERENCES teorias_MED(id) ON DELETE SET NULL,

  visualizacoes INTEGER DEFAULT 0,
  total_respostas INTEGER DEFAULT 0,

  fixado BOOLEAN DEFAULT false,
  destaque BOOLEAN DEFAULT false,
  resolvido BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. RESPOSTAS DO FÓRUM
CREATE TABLE IF NOT EXISTS forum_respostas_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topico_id UUID REFERENCES forum_topicos_MED(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_respostas_MED(id) ON DELETE SET NULL,

  conteudo TEXT NOT NULL,

  votos_positivos INTEGER DEFAULT 0,
  votos_negativos INTEGER DEFAULT 0,

  melhor_resposta BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. VOTOS DO FÓRUM
CREATE TABLE IF NOT EXISTS forum_votos_MED (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resposta_id UUID REFERENCES forum_respostas_MED(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('positivo', 'negativo')),
  PRIMARY KEY (user_id, resposta_id)
);

-- 16. PERFIL PREPARAMED
CREATE TABLE IF NOT EXISTS profiles_MED (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT,
  email TEXT,
  avatar_url TEXT,

  faculdade TEXT,
  ano_curso INTEGER,
  estado TEXT,
  cidade TEXT,

  plano TEXT DEFAULT 'gratuito' CHECK (plano IN ('gratuito', 'premium', 'residencia')),

  questoes_respondidas INTEGER DEFAULT 0,
  questoes_corretas INTEGER DEFAULT 0,
  tempo_estudo_segundos INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. ASSINATURAS PREPARAMED
CREATE TABLE IF NOT EXISTS assinaturas_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

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

-- 18. LIMITES DE USO
CREATE TABLE IF NOT EXISTS limites_uso_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_referencia TEXT NOT NULL,

  questoes_dia INTEGER DEFAULT 0,
  data_questoes DATE DEFAULT CURRENT_DATE,

  simulados_mes INTEGER DEFAULT 0,
  perguntas_ia_mes INTEGER DEFAULT 0,
  resumos_ia_mes INTEGER DEFAULT 0,
  flashcards_ia_mes INTEGER DEFAULT 0,
  anotacoes_total INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, mes_referencia)
);

-- 19. ESTUDO DIÁRIO
CREATE TABLE IF NOT EXISTS estudo_diario_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data DATE NOT NULL,

  questoes_feitas INTEGER DEFAULT 0,
  questoes_corretas INTEGER DEFAULT 0,

  teorias_lidas INTEGER DEFAULT 0,
  tempo_leitura_segundos INTEGER DEFAULT 0,

  simulados_feitos INTEGER DEFAULT 0,

  perguntas_ia INTEGER DEFAULT 0,

  tempo_total_segundos INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, data)
);

-- 20. FLASHCARDS
CREATE TABLE IF NOT EXISTS flashcards_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  disciplina_id UUID REFERENCES disciplinas_MED(id) ON DELETE SET NULL,
  assunto_id UUID REFERENCES assuntos_MED(id) ON DELETE SET NULL,
  teoria_id UUID REFERENCES teorias_MED(id) ON DELETE SET NULL,

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

-- 21. HISTÓRICO DE CHAT IA
CREATE TABLE IF NOT EXISTS chat_ia_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  mensagem_usuario TEXT NOT NULL,
  resposta_ia TEXT NOT NULL,

  contexto JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_questoes_med_disciplina ON questoes_MED(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_questoes_med_assunto ON questoes_MED(assunto_id);
CREATE INDEX IF NOT EXISTS idx_questoes_med_banca ON questoes_MED(banca);
CREATE INDEX IF NOT EXISTS idx_questoes_med_ano ON questoes_MED(ano);
CREATE INDEX IF NOT EXISTS idx_questoes_med_dificuldade ON questoes_MED(dificuldade);

CREATE INDEX IF NOT EXISTS idx_respostas_med_user ON respostas_MED(user_id);
CREATE INDEX IF NOT EXISTS idx_respostas_med_questao ON respostas_MED(questao_id);

CREATE INDEX IF NOT EXISTS idx_teorias_med_disciplina ON teorias_MED(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_teorias_med_assunto ON teorias_MED(assunto_id);

CREATE INDEX IF NOT EXISTS idx_anotacoes_med_user ON anotacoes_MED(user_id);

CREATE INDEX IF NOT EXISTS idx_simulados_med_user ON simulados_MED(user_id);
CREATE INDEX IF NOT EXISTS idx_simulados_med_status ON simulados_MED(status);

CREATE INDEX IF NOT EXISTS idx_forum_topicos_med_disciplina ON forum_topicos_MED(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_forum_topicos_med_categoria ON forum_topicos_MED(categoria);

CREATE INDEX IF NOT EXISTS idx_profiles_med_plano ON profiles_MED(plano);

CREATE INDEX IF NOT EXISTS idx_estudo_diario_med_user_data ON estudo_diario_MED(user_id, data);

CREATE INDEX IF NOT EXISTS idx_flashcards_med_user ON flashcards_MED(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_med_proxima_revisao ON flashcards_MED(proxima_revisao);
