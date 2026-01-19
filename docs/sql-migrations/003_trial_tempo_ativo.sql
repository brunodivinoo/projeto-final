-- =============================================
-- MIGRAÇÃO: Sistema de Trial com Tempo ATIVO
-- =============================================
-- Data: 2026-01-19
-- Descrição: Adiciona campos para o trial contar
-- apenas o tempo que o usuário está ativo/logado,
-- não tempo corrido.
-- =============================================

-- 1. Adicionar campo de tempo usado em segundos
ALTER TABLE profiles_med
ADD COLUMN IF NOT EXISTS trial_tempo_usado_segundos INTEGER DEFAULT 0;

-- 2. Comentário explicativo
COMMENT ON COLUMN profiles_med.trial_tempo_usado_segundos IS
'Tempo total em segundos que o usuário usou do trial. Incrementa apenas quando está ativo na plataforma.';

-- =============================================
-- TABELA: Sessões Ativas (Anti-compartilhamento)
-- =============================================
-- Permite apenas 1 sessão por usuário por vez

CREATE TABLE IF NOT EXISTS sessoes_ativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles_med(id) ON DELETE CASCADE UNIQUE,
  session_token TEXT NOT NULL,
  dispositivo TEXT,
  ip_address TEXT,
  ultima_atividade TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sessoes_ativas_user ON sessoes_ativas(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativas_token ON sessoes_ativas(session_token);

-- Comentário
COMMENT ON TABLE sessoes_ativas IS
'Controla sessões ativas para evitar compartilhamento de contas. Apenas 1 sessão por usuário.';

-- =============================================
-- TABELA: Fingerprints (Anti-abuso de Trial)
-- =============================================
-- Rastreia dispositivos para evitar múltiplas
-- contas de trial no mesmo dispositivo

CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT UNIQUE NOT NULL,
  user_ids TEXT[] DEFAULT '{}', -- Array de user_ids que usaram este dispositivo
  trials_usados INTEGER DEFAULT 0,
  primeiro_uso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_uso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bloqueado BOOLEAN DEFAULT FALSE,
  motivo_bloqueio TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fingerprints_fp ON device_fingerprints(fingerprint);
CREATE INDEX IF NOT EXISTS idx_fingerprints_bloqueado ON device_fingerprints(bloqueado);

-- Comentário
COMMENT ON TABLE device_fingerprints IS
'Rastreia fingerprints de dispositivos para evitar abuso de trial com múltiplas contas.';

-- =============================================
-- RLS (Row Level Security)
-- =============================================

-- Habilitar RLS
ALTER TABLE sessoes_ativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;

-- Políticas para sessoes_ativas
CREATE POLICY "Users can view own sessions"
  ON sessoes_ativas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions"
  ON sessoes_ativas FOR ALL
  USING (auth.uid() = user_id);

-- Service role pode gerenciar fingerprints
CREATE POLICY "Service role manages fingerprints"
  ON device_fingerprints FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- FUNÇÃO: Limpar sessões inativas
-- =============================================
-- Executar periodicamente para limpar sessões antigas

CREATE OR REPLACE FUNCTION limpar_sessoes_inativas()
RETURNS void AS $$
BEGIN
  DELETE FROM sessoes_ativas
  WHERE ultima_atividade < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANT de permissões
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON sessoes_ativas TO authenticated;
GRANT SELECT, INSERT, UPDATE ON device_fingerprints TO service_role;
