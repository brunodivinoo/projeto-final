-- Script para corrigir/recriar a tabela admin_geracao_logs_med
-- Execute este script no Supabase SQL Editor

-- Remover a tabela antiga (se existir com estrutura errada)
DROP TABLE IF EXISTS admin_geracao_logs_med CASCADE;

-- Recriar a tabela com a estrutura correta
CREATE TABLE admin_geracao_logs_med (
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

-- Criar índices
CREATE INDEX idx_admin_geracao_logs_created ON admin_geracao_logs_med(created_at DESC);
CREATE INDEX idx_admin_geracao_logs_status ON admin_geracao_logs_med(status);
CREATE INDEX idx_admin_geracao_logs_disciplina ON admin_geracao_logs_med(disciplina_id);

-- Habilitar RLS
ALTER TABLE admin_geracao_logs_med ENABLE ROW LEVEL SECURITY;

-- Política para admins lerem
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

-- Política para service_role inserir (necessário para a API)
CREATE POLICY "Service role pode inserir logs"
  ON admin_geracao_logs_med FOR INSERT
  WITH CHECK (true);

-- Também permitir insert para authenticated (para o service role)
CREATE POLICY "Authenticated pode inserir logs"
  ON admin_geracao_logs_med FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verificar criação
SELECT 'Tabela admin_geracao_logs_med criada com sucesso!' as resultado;
