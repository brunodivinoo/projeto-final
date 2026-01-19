-- =============================================
-- PREPARAMED - Tabelas de Monitoramento Admin
-- Criação: 2026-01-19
-- =============================================

-- 1. LOGS DE GERAÇÃO DE QUESTÕES POR IA
-- Registra cada tentativa de geração de questão
CREATE TABLE IF NOT EXISTS admin_geracao_logs_med (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questao_id UUID REFERENCES questoes_med(id) ON DELETE SET NULL,
  disciplina_id UUID REFERENCES disciplinas_med(id) ON DELETE SET NULL,
  assunto_id UUID REFERENCES assuntos_med(id) ON DELETE SET NULL,
  periodo INTEGER,
  tipo_questao TEXT,
  status TEXT NOT NULL DEFAULT 'iniciado' CHECK (status IN ('iniciado', 'sucesso', 'erro', 'parcial', 'concluido')),
  erro_mensagem TEXT,
  tokens_usados INTEGER,
  tempo_geracao_ms INTEGER,
  modelo_ia TEXT DEFAULT 'claude-sonnet-4-20250514',
  quantidade INTEGER DEFAULT 1,
  questoes_sucesso INTEGER DEFAULT 0,
  questoes_erro INTEGER DEFAULT 0,
  tempo_total_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_geracao_logs_created ON admin_geracao_logs_med(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_geracao_logs_status ON admin_geracao_logs_med(status);
CREATE INDEX IF NOT EXISTS idx_admin_geracao_logs_disciplina ON admin_geracao_logs_med(disciplina_id);

-- 2. FEEDBACKS DOS USUÁRIOS
-- Registra feedbacks, sugestões, bugs reportados pelos usuários
CREATE TABLE IF NOT EXISTS feedback_med (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'geral' CHECK (tipo IN ('bug', 'sugestao', 'duvida', 'elogio', 'geral')),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'resolvido', 'rejeitado')),
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  pagina TEXT, -- Página onde o feedback foi enviado
  metadata JSONB, -- Dados adicionais (browser, device, etc)
  resposta_admin TEXT,
  resolvido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolvido_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_feedback_med_user ON feedback_med(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_med_status ON feedback_med(status);
CREATE INDEX IF NOT EXISTS idx_feedback_med_tipo ON feedback_med(tipo);
CREATE INDEX IF NOT EXISTS idx_feedback_med_created ON feedback_med(created_at DESC);

-- 3. LOGS DE ERROS DA APLICAÇÃO
-- Registra erros que ocorrem na aplicação
CREATE TABLE IF NOT EXISTS error_logs_med (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL, -- Tipo do erro (api_error, frontend_error, database_error, etc)
  error_message TEXT NOT NULL,
  error_stack TEXT, -- Stack trace se disponível
  pagina TEXT, -- URL/rota onde o erro ocorreu
  componente TEXT, -- Componente React que gerou o erro
  metadata JSONB, -- Dados adicionais (browser, device, request body, etc)
  resolvido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_error_logs_med_created ON error_logs_med(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_med_type ON error_logs_med(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_med_resolvido ON error_logs_med(resolvido);

-- =============================================
-- RLS POLICIES (Row Level Security)
-- =============================================

-- Habilitar RLS nas tabelas
ALTER TABLE admin_geracao_logs_med ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_med ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs_med ENABLE ROW LEVEL SECURITY;

-- Políticas para admin_geracao_logs_med (apenas admins podem ler, service role pode inserir)
CREATE POLICY "Admins podem ver logs de geração"
  ON admin_geracao_logs_med FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles_med
      WHERE profiles_med.id = auth.uid()
      AND profiles_med.email IN (
        'admin@preparamed.com',
        'rodrigo@preparamed.com',
        'rodrigomachadex@gmail.com',
        'rfrfrfrdfrf@gmail.com'
      )
    )
  );

CREATE POLICY "Service role pode inserir logs"
  ON admin_geracao_logs_med FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Políticas para feedback_med
CREATE POLICY "Usuários podem criar feedback"
  ON feedback_med FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios feedbacks"
  ON feedback_med FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os feedbacks"
  ON feedback_med FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles_med
      WHERE profiles_med.id = auth.uid()
      AND profiles_med.email IN (
        'admin@preparamed.com',
        'rodrigo@preparamed.com',
        'rodrigomachadex@gmail.com',
        'rfrfrfrdfrf@gmail.com'
      )
    )
  );

CREATE POLICY "Admins podem atualizar feedbacks"
  ON feedback_med FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles_med
      WHERE profiles_med.id = auth.uid()
      AND profiles_med.email IN (
        'admin@preparamed.com',
        'rodrigo@preparamed.com',
        'rodrigomachadex@gmail.com',
        'rfrfrfrdfrf@gmail.com'
      )
    )
  );

-- Políticas para error_logs_med
CREATE POLICY "Admins podem ver logs de erro"
  ON error_logs_med FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles_med
      WHERE profiles_med.id = auth.uid()
      AND profiles_med.email IN (
        'admin@preparamed.com',
        'rodrigo@preparamed.com',
        'rodrigomachadex@gmail.com',
        'rfrfrfrdfrf@gmail.com'
      )
    )
  );

CREATE POLICY "Qualquer um pode inserir logs de erro"
  ON error_logs_med FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir acesso público para inserir erros (para capturar erros de usuários não logados)
CREATE POLICY "Público pode inserir logs de erro"
  ON error_logs_med FOR INSERT
  TO anon
  WITH CHECK (true);
