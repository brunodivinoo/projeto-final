-- =====================================================
-- SISTEMA DE ESTUDOS - TABELAS E POLÍTICAS
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. TABELA DE PLANOS DE ESTUDO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.planos_estudo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  data_inicio DATE,
  data_fim DATE,
  horas_semanais INTEGER DEFAULT 20,
  ai_sugestoes BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_planos_estudo_user_id ON public.planos_estudo(user_id);
CREATE INDEX IF NOT EXISTS idx_planos_estudo_ativo ON public.planos_estudo(ativo);

-- RLS
ALTER TABLE public.planos_estudo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Planos visíveis para próprio usuário" ON public.planos_estudo;
CREATE POLICY "Planos visíveis para próprio usuário" ON public.planos_estudo
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- =====================================================
-- 2. TABELA DE ITENS DO PLANO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.plano_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_id UUID REFERENCES public.planos_estudo(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  assunto_id UUID REFERENCES public.assuntos(id) ON DELETE SET NULL,
  subassunto_id UUID REFERENCES public.subassuntos(id) ON DELETE SET NULL,
  prioridade INTEGER DEFAULT 3 CHECK (prioridade >= 1 AND prioridade <= 5),
  dificuldade INTEGER DEFAULT 3 CHECK (dificuldade >= 1 AND dificuldade <= 5),
  horas_meta DECIMAL(5,2) DEFAULT 10,
  horas_estudadas DECIMAL(5,2) DEFAULT 0,
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plano_itens_plano_id ON public.plano_itens(plano_id);

-- RLS
ALTER TABLE public.plano_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Itens do plano visíveis via plano" ON public.plano_itens;
CREATE POLICY "Itens do plano visíveis via plano" ON public.plano_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.planos_estudo p
      WHERE p.id = plano_id AND (p.user_id = auth.uid() OR auth.role() = 'service_role')
    )
  );

-- =====================================================
-- 3. TABELA DE DISPONIBILIDADE DO PLANO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.plano_disponibilidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_id UUID REFERENCES public.planos_estudo(id) ON DELETE CASCADE NOT NULL,
  dia_semana INTEGER CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0 = Domingo
  periodo TEXT CHECK (periodo IN ('manha', 'tarde', 'noite')),
  disponivel BOOLEAN DEFAULT true,
  horas DECIMAL(3,1) DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plano_disponibilidade_plano_id ON public.plano_disponibilidade(plano_id);

-- RLS
ALTER TABLE public.plano_disponibilidade ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Disponibilidade visível via plano" ON public.plano_disponibilidade;
CREATE POLICY "Disponibilidade visível via plano" ON public.plano_disponibilidade
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.planos_estudo p
      WHERE p.id = plano_id AND (p.user_id = auth.uid() OR auth.role() = 'service_role')
    )
  );

-- =====================================================
-- 4. TABELA DE CICLOS DE ESTUDO (Atualizada)
-- =====================================================
-- Primeiro, dropar a tabela antiga se existir com schema diferente
DO $$
BEGIN
  -- Adicionar novas colunas se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ciclos_estudo' AND column_name = 'plano_id') THEN
    ALTER TABLE public.ciclos_estudo ADD COLUMN plano_id UUID REFERENCES public.planos_estudo(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ciclos_estudo' AND column_name = 'numero') THEN
    ALTER TABLE public.ciclos_estudo ADD COLUMN numero INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ciclos_estudo' AND column_name = 'descricao') THEN
    ALTER TABLE public.ciclos_estudo ADD COLUMN descricao TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ciclos_estudo' AND column_name = 'duracao_dias') THEN
    ALTER TABLE public.ciclos_estudo ADD COLUMN duracao_dias INTEGER DEFAULT 7;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ciclos_estudo' AND column_name = 'horas_planejadas') THEN
    ALTER TABLE public.ciclos_estudo ADD COLUMN horas_planejadas DECIMAL(5,2) DEFAULT 40;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ciclos_estudo' AND column_name = 'horas_estudadas') THEN
    ALTER TABLE public.ciclos_estudo ADD COLUMN horas_estudadas DECIMAL(5,2) DEFAULT 0;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Tabela não existe, criar do zero
    NULL;
END $$;

-- Atualizar constraint de status se necessário
DO $$
BEGIN
  ALTER TABLE public.ciclos_estudo DROP CONSTRAINT IF EXISTS ciclos_estudo_status_check;
  ALTER TABLE public.ciclos_estudo ADD CONSTRAINT ciclos_estudo_status_check
    CHECK (status IN ('pendente', 'em_progresso', 'pausado', 'finalizado', 'ativo', 'pausado', 'concluido'));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN others THEN NULL;
END $$;

-- =====================================================
-- 5. TABELA DE ITENS DO CICLO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ciclo_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ciclo_id UUID REFERENCES public.ciclos_estudo(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  assunto_id UUID REFERENCES public.assuntos(id) ON DELETE SET NULL,
  subassunto_id UUID REFERENCES public.subassuntos(id) ON DELETE SET NULL,
  nome_display TEXT,
  cor TEXT DEFAULT 'blue',
  icone TEXT DEFAULT 'book',
  horas_meta DECIMAL(5,2) DEFAULT 10,
  horas_estudadas DECIMAL(5,2) DEFAULT 0,
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  prioridade INTEGER DEFAULT 3 CHECK (prioridade >= 1 AND prioridade <= 5),
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ciclo_itens_ciclo_id ON public.ciclo_itens(ciclo_id);

-- RLS
ALTER TABLE public.ciclo_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Itens do ciclo visíveis via ciclo" ON public.ciclo_itens;
CREATE POLICY "Itens do ciclo visíveis via ciclo" ON public.ciclo_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ciclos_estudo c
      WHERE c.id = ciclo_id AND (c.user_id = auth.uid() OR auth.role() = 'service_role')
    )
  );

-- =====================================================
-- 6. TABELA DE SESSÕES DE ESTUDO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sessoes_estudo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ciclo_id UUID REFERENCES public.ciclos_estudo(id) ON DELETE SET NULL,
  ciclo_item_id UUID REFERENCES public.ciclo_itens(id) ON DELETE SET NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  assunto_id UUID REFERENCES public.assuntos(id) ON DELETE SET NULL,
  subassunto_id UUID REFERENCES public.subassuntos(id) ON DELETE SET NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('questoes', 'leitura', 'video', 'resumo', 'flashcard', 'aula', 'pdf', 'revisao', 'outro')),
  inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fim TIMESTAMP WITH TIME ZONE,
  duracao_segundos INTEGER DEFAULT 0,
  pausas INTEGER DEFAULT 0,
  tempo_pausado_segundos INTEGER DEFAULT 0,
  status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'pausada', 'finalizada', 'cancelada')),
  questoes_feitas INTEGER DEFAULT 0,
  questoes_corretas INTEGER DEFAULT 0,
  anotacoes TEXT,
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  criar_revisao BOOLEAN DEFAULT true,
  prioridade_revisao INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_user_id ON public.sessoes_estudo(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_status ON public.sessoes_estudo(status);
CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_inicio ON public.sessoes_estudo(inicio);
CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_ciclo_id ON public.sessoes_estudo(ciclo_id);

-- RLS
ALTER TABLE public.sessoes_estudo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sessões visíveis para próprio usuário" ON public.sessoes_estudo;
CREATE POLICY "Sessões visíveis para próprio usuário" ON public.sessoes_estudo
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- =====================================================
-- 7. TABELA DE REVISÕES (SM-2) - Atualizada
-- =====================================================
-- Adicionar colunas do SM-2 se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'disciplina_id') THEN
    ALTER TABLE public.revisoes ADD COLUMN disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'assunto_id') THEN
    ALTER TABLE public.revisoes ADD COLUMN assunto_id UUID REFERENCES public.assuntos(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'subassunto_id') THEN
    ALTER TABLE public.revisoes ADD COLUMN subassunto_id UUID REFERENCES public.subassuntos(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'titulo') THEN
    ALTER TABLE public.revisoes ADD COLUMN titulo TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'descricao') THEN
    ALTER TABLE public.revisoes ADD COLUMN descricao TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'sessao_origem_id') THEN
    ALTER TABLE public.revisoes ADD COLUMN sessao_origem_id UUID REFERENCES public.sessoes_estudo(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'prioridade') THEN
    ALTER TABLE public.revisoes ADD COLUMN prioridade INTEGER DEFAULT 3;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'easiness_factor') THEN
    ALTER TABLE public.revisoes ADD COLUMN easiness_factor DECIMAL(3,2) DEFAULT 2.5;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'intervalo_dias') THEN
    ALTER TABLE public.revisoes ADD COLUMN intervalo_dias INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'repeticoes') THEN
    ALTER TABLE public.revisoes ADD COLUMN repeticoes INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'total_revisoes') THEN
    ALTER TABLE public.revisoes ADD COLUMN total_revisoes INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'ultima_qualidade') THEN
    ALTER TABLE public.revisoes ADD COLUMN ultima_qualidade INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revisoes' AND column_name = 'ultima_revisao') THEN
    ALTER TABLE public.revisoes ADD COLUMN ultima_revisao TIMESTAMP WITH TIME ZONE;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Atualizar constraint de status
DO $$
BEGIN
  ALTER TABLE public.revisoes DROP CONSTRAINT IF EXISTS revisoes_status_check;
  ALTER TABLE public.revisoes ADD CONSTRAINT revisoes_status_check
    CHECK (status IN ('atrasado', 'hoje', 'agendado', 'concluido', 'ativa', 'arquivada', 'pendente'));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN others THEN NULL;
END $$;

-- =====================================================
-- 8. TABELA DE HISTÓRICO DE REVISÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.revisao_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  revisao_id UUID REFERENCES public.revisoes(id) ON DELETE CASCADE NOT NULL,
  qualidade INTEGER NOT NULL CHECK (qualidade >= 0 AND qualidade <= 5),
  easiness_factor_antes DECIMAL(3,2),
  easiness_factor_depois DECIMAL(3,2),
  intervalo_antes INTEGER,
  intervalo_depois INTEGER,
  data_revisao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tempo_resposta_segundos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_revisao_historico_revisao_id ON public.revisao_historico(revisao_id);

-- RLS
ALTER TABLE public.revisao_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Histórico visível via revisão" ON public.revisao_historico;
CREATE POLICY "Histórico visível via revisão" ON public.revisao_historico
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.revisoes r
      WHERE r.id = revisao_id AND (r.user_id = auth.uid() OR auth.role() = 'service_role')
    )
  );

-- =====================================================
-- 9. TABELA DE ESTUDO DIÁRIO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.estudo_diario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  minutos_estudados INTEGER DEFAULT 0,
  sessoes_count INTEGER DEFAULT 0,
  questoes_feitas INTEGER DEFAULT 0,
  questoes_corretas INTEGER DEFAULT 0,
  total_revisoes INTEGER DEFAULT 0,
  xp_ganho INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, data)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_estudo_diario_user_data ON public.estudo_diario(user_id, data);

-- RLS
ALTER TABLE public.estudo_diario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Estudo diário visível para próprio usuário" ON public.estudo_diario;
CREATE POLICY "Estudo diário visível para próprio usuário" ON public.estudo_diario
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- =====================================================
-- 10. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar revisões atrasadas
CREATE OR REPLACE FUNCTION public.atualizar_revisoes_atrasadas()
RETURNS void AS $$
BEGIN
  UPDATE public.revisoes
  SET status = 'atrasado'
  WHERE proxima_revisao < CURRENT_DATE
    AND status IN ('ativa', 'agendado', 'hoje', 'pendente');

  UPDATE public.revisoes
  SET status = 'hoje'
  WHERE proxima_revisao = CURRENT_DATE
    AND status IN ('ativa', 'agendado', 'pendente');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar XP
CREATE OR REPLACE FUNCTION public.incrementar_xp(p_user_id UUID, p_xp INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.estatisticas_usuario
  SET
    xp_total = COALESCE(xp_total, 0) + p_xp,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Se não existe, criar
  IF NOT FOUND THEN
    INSERT INTO public.estatisticas_usuario (user_id, xp_total)
    VALUES (p_user_id, p_xp);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar coluna xp_total em estatisticas_usuario se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estatisticas_usuario' AND column_name = 'xp_total') THEN
    ALTER TABLE public.estatisticas_usuario ADD COLUMN xp_total INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estatisticas_usuario' AND column_name = 'nivel') THEN
    ALTER TABLE public.estatisticas_usuario ADD COLUMN nivel INTEGER DEFAULT 1;
  END IF;
END $$;

-- =====================================================
-- 11. TRIGGER PARA ATUALIZAR PROGRESSO DO CICLO
-- =====================================================
CREATE OR REPLACE FUNCTION public.atualizar_progresso_ciclo()
RETURNS TRIGGER AS $$
DECLARE
  v_total_meta DECIMAL;
  v_total_estudado DECIMAL;
  v_progresso INTEGER;
BEGIN
  -- Calcular totais
  SELECT
    COALESCE(SUM(horas_meta), 0),
    COALESCE(SUM(horas_estudadas), 0)
  INTO v_total_meta, v_total_estudado
  FROM public.ciclo_itens
  WHERE ciclo_id = NEW.ciclo_id;

  -- Calcular progresso
  IF v_total_meta > 0 THEN
    v_progresso := LEAST(100, ROUND((v_total_estudado / v_total_meta) * 100));
  ELSE
    v_progresso := 0;
  END IF;

  -- Atualizar ciclo
  UPDATE public.ciclos_estudo
  SET
    progresso = v_progresso,
    horas_estudadas = v_total_estudado
  WHERE id = NEW.ciclo_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_atualizar_progresso_ciclo ON public.ciclo_itens;
CREATE TRIGGER trigger_atualizar_progresso_ciclo
  AFTER INSERT OR UPDATE OF horas_estudadas ON public.ciclo_itens
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_progresso_ciclo();

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
