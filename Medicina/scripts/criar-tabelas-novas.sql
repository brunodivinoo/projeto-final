-- =============================================
-- PREPARAMED - TABELAS NOVAS E ALTERAÇÕES
-- Execute este script no Supabase SQL Editor
-- =============================================

-- 1. ADICIONAR CAMPOS DE TRIAL NA TABELA profiles_med (se não existirem)
DO $$
BEGIN
    -- trial_started_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_med' AND column_name = 'trial_started_at'
    ) THEN
        ALTER TABLE profiles_med ADD COLUMN trial_started_at TIMESTAMPTZ DEFAULT NULL;
    END IF;

    -- trial_used
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_med' AND column_name = 'trial_used'
    ) THEN
        ALTER TABLE profiles_med ADD COLUMN trial_used BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. CRIAR TABELA DE FLASHCARDS
CREATE TABLE IF NOT EXISTS flashcards_med (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Conteúdo do Flashcard
    frente TEXT NOT NULL,          -- Pergunta/Termo
    verso TEXT NOT NULL,           -- Resposta/Definição

    -- Categorização
    disciplina VARCHAR(100),
    assunto VARCHAR(200),
    tags TEXT[],                   -- Array de tags

    -- Spaced Repetition (SM-2)
    intervalo INTEGER DEFAULT 1,           -- Dias até próxima revisão
    facilidade DECIMAL(3,2) DEFAULT 2.5,   -- Fator de facilidade (1.3 a 2.5)
    repeticoes INTEGER DEFAULT 0,          -- Número de revisões consecutivas corretas
    proxima_revisao DATE DEFAULT CURRENT_DATE,
    ultima_revisao TIMESTAMPTZ,

    -- Estatísticas
    vezes_acertou INTEGER DEFAULT 0,
    vezes_errou INTEGER DEFAULT 0,
    tempo_medio_ms INTEGER DEFAULT 0,      -- Tempo médio de resposta

    -- Origem
    gerado_por_ia BOOLEAN DEFAULT FALSE,
    questao_origem_id UUID,                -- Se veio de uma questão
    conversa_origem_id UUID,               -- Se veio de conversa IA

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para flashcards
CREATE INDEX IF NOT EXISTS idx_flashcards_user ON flashcards_med(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_proxima_revisao ON flashcards_med(user_id, proxima_revisao);
CREATE INDEX IF NOT EXISTS idx_flashcards_disciplina ON flashcards_med(user_id, disciplina);

-- RLS para flashcards
ALTER TABLE flashcards_med ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own flashcards" ON flashcards_med;
CREATE POLICY "Users can view own flashcards" ON flashcards_med
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own flashcards" ON flashcards_med;
CREATE POLICY "Users can insert own flashcards" ON flashcards_med
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own flashcards" ON flashcards_med;
CREATE POLICY "Users can update own flashcards" ON flashcards_med
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own flashcards" ON flashcards_med;
CREATE POLICY "Users can delete own flashcards" ON flashcards_med
    FOR DELETE USING (auth.uid() = user_id);

-- 3. CRIAR TABELA DE USO DE RECURSOS (para tracking detalhado)
CREATE TABLE IF NOT EXISTS uso_recursos_med (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Tipo de recurso
    tipo VARCHAR(50) NOT NULL,  -- 'ia_chat', 'ia_questao', 'flashcard', 'simulado', 'voz', 'exame'

    -- Detalhes
    modelo_ia VARCHAR(50),      -- 'sonnet', 'opus', 'gemini'
    tokens_input INTEGER,
    tokens_output INTEGER,
    duracao_ms INTEGER,

    -- Custo estimado (para controle interno)
    custo_estimado DECIMAL(10,6),

    -- Metadata
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para uso_recursos
CREATE INDEX IF NOT EXISTS idx_uso_recursos_user ON uso_recursos_med(user_id);
CREATE INDEX IF NOT EXISTS idx_uso_recursos_tipo ON uso_recursos_med(user_id, tipo);
CREATE INDEX IF NOT EXISTS idx_uso_recursos_created ON uso_recursos_med(user_id, created_at);

-- RLS para uso_recursos
ALTER TABLE uso_recursos_med ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage" ON uso_recursos_med;
CREATE POLICY "Users can view own usage" ON uso_recursos_med
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage" ON uso_recursos_med;
CREATE POLICY "Users can insert own usage" ON uso_recursos_med
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. ADICIONAR CAMPO flashcards_semana NA TABELA limites_uso_med (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'limites_uso_med' AND column_name = 'flashcards_semana'
    ) THEN
        ALTER TABLE limites_uso_med ADD COLUMN flashcards_semana INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'limites_uso_med' AND column_name = 'casos_clinicos_mes'
    ) THEN
        ALTER TABLE limites_uso_med ADD COLUMN casos_clinicos_mes INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'limites_uso_med' AND column_name = 'data_flashcards'
    ) THEN
        ALTER TABLE limites_uso_med ADD COLUMN data_flashcards DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 5. CRIAR TABELA DE CASOS CLÍNICOS SALVOS
CREATE TABLE IF NOT EXISTS casos_clinicos_med (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Conteúdo
    titulo VARCHAR(300) NOT NULL,
    especialidade VARCHAR(100),
    complexidade VARCHAR(20) DEFAULT 'medio', -- facil, medio, dificil

    -- Caso em si
    historia_clinica TEXT NOT NULL,
    exame_fisico TEXT,
    exames_complementares TEXT,

    -- Interação
    conversa_id UUID,           -- Conversa onde foi gerado
    modo VARCHAR(50),           -- 'texto', 'voz', 'interativo'

    -- Resultado do usuário
    diagnostico_usuario TEXT,
    conduta_usuario TEXT,
    feedback_ia TEXT,
    pontuacao INTEGER,          -- 0-100

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_casos_clinicos_user ON casos_clinicos_med(user_id);
CREATE INDEX IF NOT EXISTS idx_casos_clinicos_especialidade ON casos_clinicos_med(user_id, especialidade);

-- RLS
ALTER TABLE casos_clinicos_med ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own casos" ON casos_clinicos_med;
CREATE POLICY "Users can manage own casos" ON casos_clinicos_med
    FOR ALL USING (auth.uid() = user_id);

-- 6. CRIAR TABELA DE BADGES/CONQUISTAS
CREATE TABLE IF NOT EXISTS badges_med (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    icone VARCHAR(50),          -- Emoji ou nome do ícone
    categoria VARCHAR(50),      -- 'estudo', 'questoes', 'streak', 'social', 'especial'
    pontos INTEGER DEFAULT 10,
    criterio JSONB,             -- {"tipo": "questoes_corretas", "valor": 100}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges conquistados pelo usuário
CREATE TABLE IF NOT EXISTS badges_usuario_med (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges_med(id) ON DELETE CASCADE,
    conquistado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- RLS para badges
ALTER TABLE badges_med ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges_usuario_med ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view badges" ON badges_med;
CREATE POLICY "Anyone can view badges" ON badges_med FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own badges" ON badges_usuario_med;
CREATE POLICY "Users can view own badges" ON badges_usuario_med
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own badges" ON badges_usuario_med;
CREATE POLICY "Users can insert own badges" ON badges_usuario_med
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. INSERIR BADGES INICIAIS
INSERT INTO badges_med (codigo, nome, descricao, icone, categoria, pontos, criterio)
VALUES
    ('primeiro_login', 'Primeiro Passo', 'Fez login pela primeira vez', '🎉', 'especial', 5, '{"tipo": "login", "valor": 1}'),
    ('10_questoes', 'Iniciante', 'Respondeu 10 questões', '📝', 'questoes', 10, '{"tipo": "questoes_respondidas", "valor": 10}'),
    ('50_questoes', 'Estudante', 'Respondeu 50 questões', '📚', 'questoes', 25, '{"tipo": "questoes_respondidas", "valor": 50}'),
    ('100_questoes', 'Dedicado', 'Respondeu 100 questões', '🎯', 'questoes', 50, '{"tipo": "questoes_respondidas", "valor": 100}'),
    ('500_questoes', 'Expert', 'Respondeu 500 questões', '🏆', 'questoes', 100, '{"tipo": "questoes_respondidas", "valor": 500}'),
    ('1000_questoes', 'Mestre', 'Respondeu 1000 questões', '👑', 'questoes', 200, '{"tipo": "questoes_respondidas", "valor": 1000}'),
    ('70_acertos', 'Precisão', 'Manteve 70% de acertos', '🎯', 'questoes', 30, '{"tipo": "percentual_acertos", "valor": 70}'),
    ('90_acertos', 'Sniper', 'Manteve 90% de acertos', '💎', 'questoes', 100, '{"tipo": "percentual_acertos", "valor": 90}'),
    ('streak_3', 'Constante', '3 dias seguidos estudando', '🔥', 'streak', 15, '{"tipo": "streak_dias", "valor": 3}'),
    ('streak_7', 'Dedicado', '7 dias seguidos estudando', '🔥🔥', 'streak', 35, '{"tipo": "streak_dias", "valor": 7}'),
    ('streak_30', 'Imparável', '30 dias seguidos estudando', '🔥🔥🔥', 'streak', 150, '{"tipo": "streak_dias", "valor": 30}'),
    ('primeiro_simulado', 'Testado', 'Completou primeiro simulado', '📋', 'estudo', 20, '{"tipo": "simulados_completos", "valor": 1}'),
    ('primeiro_flashcard', 'Memorizador', 'Criou primeiro flashcard', '🃏', 'estudo', 10, '{"tipo": "flashcards_criados", "valor": 1}'),
    ('madrugador', 'Madrugador', 'Estudou antes das 6h', '🌅', 'especial', 15, '{"tipo": "horario_estudo", "valor": "06:00"}'),
    ('coruja', 'Coruja', 'Estudou após meia-noite', '🦉', 'especial', 15, '{"tipo": "horario_estudo", "valor": "00:00"}')
ON CONFLICT (codigo) DO NOTHING;

-- 8. FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_flashcards_updated_at ON flashcards_med;
CREATE TRIGGER update_flashcards_updated_at
    BEFORE UPDATE ON flashcards_med
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_casos_clinicos_updated_at ON casos_clinicos_med;
CREATE TRIGGER update_casos_clinicos_updated_at
    BEFORE UPDATE ON casos_clinicos_med
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================
SELECT 'Tabelas criadas com sucesso!' as status;

-- Listar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%_med'
ORDER BY table_name;
