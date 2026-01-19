-- =============================================
-- TABELA DE INDICAÇÕES - PREPARAMED
-- Sistema de indicação com benefícios
-- =============================================

-- Criar tabela de indicações
CREATE TABLE IF NOT EXISTS indicacoes_med (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  indicador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  indicado_email TEXT NOT NULL,
  codigo_indicacao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'cadastrado', 'convertido')),
  indicado_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bonus_aplicado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_indicacoes_indicador ON indicacoes_med(indicador_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_codigo ON indicacoes_med(codigo_indicacao);
CREATE INDEX IF NOT EXISTS idx_indicacoes_email ON indicacoes_med(indicado_email);
CREATE INDEX IF NOT EXISTS idx_indicacoes_status ON indicacoes_med(status);

-- Constraint única para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_indicacoes_unique
ON indicacoes_med(indicador_id, indicado_email);

-- RLS (Row Level Security)
ALTER TABLE indicacoes_med ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas suas próprias indicações
CREATE POLICY "Usuarios podem ver suas indicacoes"
ON indicacoes_med FOR SELECT
USING (auth.uid() = indicador_id);

-- Policy: Usuários podem criar indicações
CREATE POLICY "Usuarios podem criar indicacoes"
ON indicacoes_med FOR INSERT
WITH CHECK (auth.uid() = indicador_id);

-- Policy: Usuários podem atualizar suas indicações
CREATE POLICY "Usuarios podem atualizar suas indicacoes"
ON indicacoes_med FOR UPDATE
USING (auth.uid() = indicador_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_indicacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_indicacoes_updated_at
BEFORE UPDATE ON indicacoes_med
FOR EACH ROW
EXECUTE FUNCTION update_indicacoes_updated_at();

-- =============================================
-- ADICIONAR CAMPO DE CÓDIGO DE INDICAÇÃO NO PROFILE
-- =============================================

-- Adicionar coluna para código de quem indicou (se não existir)
ALTER TABLE profiles_med
ADD COLUMN IF NOT EXISTS indicado_por TEXT;

-- Adicionar coluna para bônus de questões (se não existir)
ALTER TABLE profiles_med
ADD COLUMN IF NOT EXISTS questoes_bonus_indicacao INTEGER DEFAULT 0;

-- =============================================
-- FUNÇÃO PARA PROCESSAR INDICAÇÃO NO CADASTRO
-- =============================================

CREATE OR REPLACE FUNCTION processar_indicacao_cadastro()
RETURNS TRIGGER AS $$
DECLARE
  indicador_id_var UUID;
  indicacao_id_var UUID;
BEGIN
  -- Se o novo usuário foi indicado por alguém
  IF NEW.indicado_por IS NOT NULL AND NEW.indicado_por != '' THEN
    -- Encontrar o indicador pelo código (primeiros 8 caracteres do ID em uppercase)
    SELECT id INTO indicador_id_var
    FROM auth.users
    WHERE UPPER(LEFT(id::text, 8)) = UPPER(NEW.indicado_por);

    IF indicador_id_var IS NOT NULL THEN
      -- Atualizar a indicação para 'cadastrado'
      UPDATE indicacoes_med
      SET status = 'cadastrado',
          indicado_id = NEW.id
      WHERE indicador_id = indicador_id_var
        AND indicado_email = NEW.email
        AND status = 'pendente';

      -- Se não existia indicação prévia, criar uma
      IF NOT FOUND THEN
        INSERT INTO indicacoes_med (indicador_id, indicado_email, codigo_indicacao, status, indicado_id)
        VALUES (indicador_id_var, NEW.email, NEW.indicado_por, 'cadastrado', NEW.id);
      END IF;

      -- Dar bônus de questões ao indicador (+5 questões/dia)
      UPDATE profiles_med
      SET questoes_bonus_indicacao = COALESCE(questoes_bonus_indicacao, 0) + 5
      WHERE id = indicador_id_var;

      -- Dar bônus ao indicado (+3 questões/dia)
      -- Será aplicado quando o profile for criado completamente
      NEW.questoes_bonus_indicacao = 3;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para processar indicação no cadastro
DROP TRIGGER IF EXISTS trigger_processar_indicacao ON profiles_med;
CREATE TRIGGER trigger_processar_indicacao
BEFORE INSERT ON profiles_med
FOR EACH ROW
EXECUTE FUNCTION processar_indicacao_cadastro();

-- =============================================
-- FUNÇÃO PARA PROCESSAR CONVERSÃO (ASSINATURA)
-- =============================================

CREATE OR REPLACE FUNCTION processar_indicacao_conversao()
RETURNS TRIGGER AS $$
DECLARE
  indicador_id_var UUID;
BEGIN
  -- Quando um usuário se torna premium
  IF NEW.plano IN ('premium', 'residencia') AND (OLD.plano IS NULL OR OLD.plano = 'gratuito') THEN
    -- Buscar indicação relacionada
    SELECT indicador_id INTO indicador_id_var
    FROM indicacoes_med
    WHERE indicado_id = NEW.id
      AND status = 'cadastrado';

    IF indicador_id_var IS NOT NULL THEN
      -- Atualizar indicação para convertido
      UPDATE indicacoes_med
      SET status = 'convertido',
          bonus_aplicado = TRUE
      WHERE indicado_id = NEW.id
        AND status = 'cadastrado';

      -- Dar 7 dias de premium grátis ao indicador
      -- Isso deve ser implementado na lógica de assinaturas
      -- Por agora, apenas registramos a conversão
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para processar conversão
DROP TRIGGER IF EXISTS trigger_processar_conversao ON profiles_med;
CREATE TRIGGER trigger_processar_conversao
AFTER UPDATE ON profiles_med
FOR EACH ROW
EXECUTE FUNCTION processar_indicacao_conversao();

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE indicacoes_med IS 'Tabela de indicações do programa de afiliados';
COMMENT ON COLUMN indicacoes_med.indicador_id IS 'ID do usuário que fez a indicação';
COMMENT ON COLUMN indicacoes_med.indicado_email IS 'Email do usuário indicado';
COMMENT ON COLUMN indicacoes_med.codigo_indicacao IS 'Código único de indicação (primeiros 8 chars do ID)';
COMMENT ON COLUMN indicacoes_med.status IS 'Status: pendente, cadastrado, convertido';
COMMENT ON COLUMN indicacoes_med.indicado_id IS 'ID do usuário indicado após cadastro';
COMMENT ON COLUMN indicacoes_med.bonus_aplicado IS 'Se o bônus de conversão foi aplicado';
