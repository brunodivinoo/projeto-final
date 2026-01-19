const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zkcstkbpgwdoiihvfspp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprY3N0a2JwZ3dkb2lpaHZmc3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkzNDYwNCwiZXhwIjoyMDgxNTEwNjA0fQ.QkG18I254LiSZRsZ8-uvX8seIfJKfaazdciO__fjVOE'
)

async function criarTabela() {
  console.log('🔧 Criando tabela respostas_questoes_ia_med...\n')
  
  const sql = `
    -- Tabela para armazenar respostas de questões da IA
    CREATE TABLE IF NOT EXISTS respostas_questoes_ia_med (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      conversa_id uuid NOT NULL,
      questao_hash text NOT NULL,
      questao_numero integer NOT NULL,
      disciplina text,
      assunto text,
      resposta_usuario text NOT NULL,
      resposta_correta text NOT NULL,
      acertou boolean NOT NULL,
      tempo_resposta_segundos integer,
      tentativas integer DEFAULT 1,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(user_id, conversa_id, questao_hash)
    );
  `
  
  const { error: createError } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({}))
  
  // Tentar método alternativo - criar via insert que falha mas cria estrutura
  // Vamos verificar se a tabela existe primeiro
  const { data, error } = await supabase
    .from('respostas_questoes_ia_med')
    .select('id')
    .limit(1)
  
  if (error && error.code === '42P01') {
    console.log('❌ Tabela não existe. Execute o SQL manualmente no Supabase Dashboard.')
    console.log('\n📋 Acesse: https://supabase.com/dashboard/project/zkcstkbpgwdoiihvfspp/sql/new')
    console.log('\n📝 Cole e execute este SQL:\n')
    console.log(`
-- Tabela para armazenar respostas de questões da IA
CREATE TABLE IF NOT EXISTS respostas_questoes_ia_med (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversa_id uuid NOT NULL,
  questao_hash text NOT NULL,
  questao_numero integer NOT NULL,
  disciplina text,
  assunto text,
  resposta_usuario text NOT NULL,
  resposta_correta text NOT NULL,
  acertou boolean NOT NULL,
  tempo_resposta_segundos integer,
  tentativas integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, conversa_id, questao_hash)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_respostas_questoes_ia_med_user ON respostas_questoes_ia_med(user_id);
CREATE INDEX IF NOT EXISTS idx_respostas_questoes_ia_med_conversa ON respostas_questoes_ia_med(conversa_id);
CREATE INDEX IF NOT EXISTS idx_respostas_questoes_ia_med_disciplina ON respostas_questoes_ia_med(disciplina);

-- Habilitar RLS
ALTER TABLE respostas_questoes_ia_med ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver suas próprias respostas" ON respostas_questoes_ia_med
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas respostas" ON respostas_questoes_ia_med
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas respostas" ON respostas_questoes_ia_med
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas respostas" ON respostas_questoes_ia_med
  FOR DELETE USING (auth.uid() = user_id);
    `)
  } else if (error) {
    console.log('⚠️ Erro ao verificar tabela:', error.message)
  } else {
    console.log('✅ Tabela respostas_questoes_ia_med já existe!')
  }
}

criarTabela()
