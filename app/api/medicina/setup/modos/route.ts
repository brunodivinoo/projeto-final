import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Cliente admin do Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

/**
 * API para verificar e criar tabelas do sistema de modos
 * POST /api/medicina/setup/modos
 */
export async function POST(request: NextRequest) {
  try {
    const results: { step: string; success: boolean; error?: string; message?: string }[] = []

    // 1. Verificar/criar tabela sessoes_modo_med
    try {
      const { error: checkError } = await supabaseAdmin
        .from('sessoes_modo_med')
        .select('id')
        .limit(1)

      if (checkError?.code === '42P01') {
        // Tabela não existe - precisa criar manualmente
        results.push({
          step: 'sessoes_modo_med',
          success: false,
          error: 'Tabela não existe',
          message: 'Execute o SQL no Supabase Dashboard'
        })
      } else if (checkError) {
        results.push({
          step: 'sessoes_modo_med',
          success: false,
          error: checkError.message
        })
      } else {
        results.push({ step: 'sessoes_modo_med', success: true, message: 'Tabela existe' })
      }
    } catch (e) {
      results.push({
        step: 'sessoes_modo_med',
        success: false,
        error: 'Erro ao verificar tabela'
      })
    }

    // 2. Verificar/criar tabela casos_clinicos_med
    try {
      const { error: checkError } = await supabaseAdmin
        .from('casos_clinicos_med')
        .select('id')
        .limit(1)

      if (checkError?.code === '42P01') {
        results.push({
          step: 'casos_clinicos_med',
          success: false,
          error: 'Tabela não existe',
          message: 'Execute o SQL no Supabase Dashboard'
        })
      } else if (checkError) {
        results.push({
          step: 'casos_clinicos_med',
          success: false,
          error: checkError.message
        })
      } else {
        results.push({ step: 'casos_clinicos_med', success: true, message: 'Tabela existe' })
      }
    } catch (e) {
      results.push({
        step: 'casos_clinicos_med',
        success: false,
        error: 'Erro ao verificar tabela'
      })
    }

    // 3. Verificar/criar tabela questoes_sessao_med
    try {
      const { error: checkError } = await supabaseAdmin
        .from('questoes_sessao_med')
        .select('id')
        .limit(1)

      if (checkError?.code === '42P01') {
        results.push({
          step: 'questoes_sessao_med',
          success: false,
          error: 'Tabela não existe',
          message: 'Execute o SQL no Supabase Dashboard'
        })
      } else if (checkError) {
        results.push({
          step: 'questoes_sessao_med',
          success: false,
          error: checkError.message
        })
      } else {
        results.push({ step: 'questoes_sessao_med', success: true, message: 'Tabela existe' })
      }
    } catch (e) {
      results.push({
        step: 'questoes_sessao_med',
        success: false,
        error: 'Erro ao verificar tabela'
      })
    }

    // 4. Verificar coluna sessao_id em mensagens_ia_med
    try {
      const { data, error } = await supabaseAdmin
        .from('mensagens_ia_med')
        .select('sessao_id')
        .limit(1)

      if (error) {
        results.push({
          step: 'mensagens_ia_med.sessao_id',
          success: false,
          error: 'Coluna não existe ou erro ao verificar',
          message: 'Execute: ALTER TABLE mensagens_ia_med ADD COLUMN sessao_id uuid;'
        })
      } else {
        results.push({ step: 'mensagens_ia_med.sessao_id', success: true, message: 'Coluna existe' })
      }
    } catch (e) {
      results.push({
        step: 'mensagens_ia_med.sessao_id',
        success: false,
        error: 'Erro ao verificar coluna'
      })
    }

    // 5. Verificar coluna modo em conversas_ia_med
    try {
      const { data, error } = await supabaseAdmin
        .from('conversas_ia_med')
        .select('modo')
        .limit(1)

      if (error) {
        results.push({
          step: 'conversas_ia_med.modo',
          success: false,
          error: 'Coluna não existe ou erro ao verificar',
          message: 'Execute: ALTER TABLE conversas_ia_med ADD COLUMN modo varchar(50) DEFAULT \'chat\';'
        })
      } else {
        results.push({ step: 'conversas_ia_med.modo', success: true, message: 'Coluna existe' })
      }
    } catch (e) {
      results.push({
        step: 'conversas_ia_med.modo',
        success: false,
        error: 'Erro ao verificar coluna'
      })
    }

    const allSuccess = results.every(r => r.success)
    const needsSetup = results.some(r => !r.success)

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess
        ? 'Todas as tabelas estão configuradas!'
        : 'Algumas tabelas precisam ser criadas. Execute o SQL no Supabase Dashboard.',
      results,
      sql: needsSetup ? getSetupSQL() : undefined
    })

  } catch (error) {
    console.error('Erro no setup:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar setup', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Verificar status atual
  return POST(request)
}

function getSetupSQL() {
  return `
-- =============================================
-- SETUP: Sistema de Modos de Chat - PREPARA MED
-- Execute este SQL no Supabase Dashboard (SQL Editor)
-- =============================================

-- 1. Tabela de sessões de modo
CREATE TABLE IF NOT EXISTS sessoes_modo_med (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES conversas_ia_med(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modo varchar(50) NOT NULL CHECK (modo IN ('chat', 'caso_clinico', 'tutor', 'questoes')),
  iniciado_em timestamptz DEFAULT now(),
  finalizado_em timestamptz,
  total_mensagens int DEFAULT 0,
  total_tokens int DEFAULT 0,
  metricas jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessoes_modo_conversa ON sessoes_modo_med(conversa_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_modo_user ON sessoes_modo_med(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_modo_modo ON sessoes_modo_med(modo);

ALTER TABLE sessoes_modo_med ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessoes_modo_all" ON sessoes_modo_med;
CREATE POLICY "sessoes_modo_all" ON sessoes_modo_med 
  FOR ALL USING (auth.uid() = user_id);


-- 2. Tabela de casos clínicos
CREATE TABLE IF NOT EXISTS casos_clinicos_med (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id uuid REFERENCES sessoes_modo_med(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo varchar(255),
  especialidade varchar(100),
  dificuldade varchar(20),
  caso_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  estado varchar(50) DEFAULT 'em_andamento',
  etapa_atual varchar(50) DEFAULT 'apresentacao',
  hipoteses_usuario jsonb DEFAULT '[]'::jsonb,
  exames_solicitados jsonb DEFAULT '[]'::jsonb,
  diagnostico_usuario varchar(255),
  conduta_usuario text,
  score_final int,
  tempo_resolucao_segundos int,
  feedback_ia text,
  created_at timestamptz DEFAULT now(),
  finalizado_em timestamptz
);

CREATE INDEX IF NOT EXISTS idx_casos_user ON casos_clinicos_med(user_id);
CREATE INDEX IF NOT EXISTS idx_casos_sessao ON casos_clinicos_med(sessao_id);

ALTER TABLE casos_clinicos_med ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "casos_clinicos_all" ON casos_clinicos_med;
CREATE POLICY "casos_clinicos_all" ON casos_clinicos_med 
  FOR ALL USING (auth.uid() = user_id);


-- 3. Tabela de questões por sessão
CREATE TABLE IF NOT EXISTS questoes_sessao_med (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id uuid REFERENCES sessoes_modo_med(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questao_id uuid,
  questao_json jsonb,
  resposta_usuario varchar(10),
  resposta_correta varchar(10),
  acertou boolean,
  tempo_resposta_segundos int,
  tema varchar(255),
  dificuldade varchar(50),
  viu_gabarito boolean DEFAULT false,
  feedback_lido boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questoes_sessao_user ON questoes_sessao_med(user_id);
CREATE INDEX IF NOT EXISTS idx_questoes_sessao_sessao ON questoes_sessao_med(sessao_id);
CREATE INDEX IF NOT EXISTS idx_questoes_sessao_acertou ON questoes_sessao_med(acertou);

ALTER TABLE questoes_sessao_med ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questoes_sessao_all" ON questoes_sessao_med;
CREATE POLICY "questoes_sessao_all" ON questoes_sessao_med 
  FOR ALL USING (auth.uid() = user_id);


-- 4. Adicionar colunas nas tabelas existentes
DO $$ 
BEGIN
  -- Adicionar sessao_id em mensagens
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mensagens_ia_med' AND column_name = 'sessao_id'
  ) THEN
    ALTER TABLE mensagens_ia_med ADD COLUMN sessao_id uuid REFERENCES sessoes_modo_med(id);
    CREATE INDEX idx_mensagens_sessao ON mensagens_ia_med(sessao_id);
  END IF;
  
  -- Adicionar modo em conversas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversas_ia_med' AND column_name = 'modo'
  ) THEN
    ALTER TABLE conversas_ia_med ADD COLUMN modo varchar(50) DEFAULT 'chat';
  END IF;
END $$;


-- 5. Função para atualizar métricas automaticamente
CREATE OR REPLACE FUNCTION atualizar_metricas_sessao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sessao_id IS NOT NULL THEN
    UPDATE sessoes_modo_med
    SET 
      total_mensagens = total_mensagens + 1,
      total_tokens = total_tokens + COALESCE(NEW.tokens, 0),
      updated_at = now()
    WHERE id = NEW.sessao_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_metricas ON mensagens_ia_med;
CREATE TRIGGER trigger_atualizar_metricas
AFTER INSERT ON mensagens_ia_med
FOR EACH ROW
EXECUTE FUNCTION atualizar_metricas_sessao();


-- Pronto! As tabelas foram criadas.
SELECT 'Setup concluído!' as status;
`
}
