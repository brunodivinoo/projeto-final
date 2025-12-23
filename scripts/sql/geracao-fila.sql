-- Tabela para fila de geração de questões (persistente)
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS geracao_fila (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'cancelado', 'erro')),

  -- Configuração da geração
  disciplina TEXT NOT NULL,
  assunto TEXT,
  subassunto TEXT,
  banca TEXT NOT NULL,
  modalidade TEXT NOT NULL,
  dificuldade TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,

  -- Progresso
  geradas INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadados
  erro_msg TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_geracao_fila_user ON geracao_fila(user_id);
CREATE INDEX IF NOT EXISTS idx_geracao_fila_status ON geracao_fila(status);
CREATE INDEX IF NOT EXISTS idx_geracao_fila_created ON geracao_fila(created_at DESC);

-- RLS Policies
ALTER TABLE geracao_fila ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias filas
CREATE POLICY "Users can view own queue" ON geracao_fila
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir na sua própria fila
CREATE POLICY "Users can insert own queue" ON geracao_fila
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar sua própria fila (cancelar)
CREATE POLICY "Users can update own queue" ON geracao_fila
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role pode fazer tudo (para APIs)
CREATE POLICY "Service role full access" ON geracao_fila
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Comentário na tabela
COMMENT ON TABLE geracao_fila IS 'Fila persistente de geração de questões - permite continuar após navegação';
