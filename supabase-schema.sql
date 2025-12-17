-- =====================================================
-- STUDYHUB - SCHEMA COMPLETO DO BANCO DE DADOS
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. TABELA DE PERFIS (profiles)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT,
  email TEXT,
  avatar_url TEXT,
  plano TEXT DEFAULT 'free' CHECK (plano IN ('free', 'pro', 'grupo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem inserir seu próprio perfil" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. TABELA DE ESTATÍSTICAS DO USUÁRIO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.estatisticas_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  questoes_hoje INTEGER DEFAULT 0,
  questoes_total INTEGER DEFAULT 0,
  taxa_acerto DECIMAL(5,2) DEFAULT 0,
  horas_estudadas DECIMAL(5,2) DEFAULT 0,
  sequencia_dias INTEGER DEFAULT 0,
  ultima_atividade TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para estatisticas_usuario
ALTER TABLE public.estatisticas_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas estatísticas" ON public.estatisticas_usuario;
CREATE POLICY "Usuários podem ver suas estatísticas" ON public.estatisticas_usuario
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas estatísticas" ON public.estatisticas_usuario;
CREATE POLICY "Usuários podem atualizar suas estatísticas" ON public.estatisticas_usuario
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas estatísticas" ON public.estatisticas_usuario;
CREATE POLICY "Usuários podem inserir suas estatísticas" ON public.estatisticas_usuario
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. TABELA DE DECKS DE FLASHCARDS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  materia TEXT,
  total_cards INTEGER DEFAULT 0,
  progresso INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para flashcard_decks
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seus decks" ON public.flashcard_decks;
CREATE POLICY "Usuários podem ver seus decks" ON public.flashcard_decks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus decks" ON public.flashcard_decks;
CREATE POLICY "Usuários podem criar seus decks" ON public.flashcard_decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus decks" ON public.flashcard_decks;
CREATE POLICY "Usuários podem atualizar seus decks" ON public.flashcard_decks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus decks" ON public.flashcard_decks;
CREATE POLICY "Usuários podem deletar seus decks" ON public.flashcard_decks
  FOR DELETE USING (auth.uid() = user_id);

-- 4. TABELA DE FLASHCARDS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  frente TEXT NOT NULL,
  verso TEXT NOT NULL,
  nivel INTEGER DEFAULT 0,
  proxima_revisao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para flashcards
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seus flashcards" ON public.flashcards;
CREATE POLICY "Usuários podem ver seus flashcards" ON public.flashcards
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus flashcards" ON public.flashcards;
CREATE POLICY "Usuários podem criar seus flashcards" ON public.flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus flashcards" ON public.flashcards;
CREATE POLICY "Usuários podem atualizar seus flashcards" ON public.flashcards
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus flashcards" ON public.flashcards;
CREATE POLICY "Usuários podem deletar seus flashcards" ON public.flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- 5. TABELA DE REVISÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.revisoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topico TEXT NOT NULL,
  materia TEXT NOT NULL,
  status TEXT DEFAULT 'agendado' CHECK (status IN ('atrasado', 'hoje', 'agendado', 'concluido')),
  proxima_revisao TIMESTAMP WITH TIME ZONE,
  ciclo_progresso INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para revisoes
ALTER TABLE public.revisoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas revisões" ON public.revisoes;
CREATE POLICY "Usuários podem ver suas revisões" ON public.revisoes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar suas revisões" ON public.revisoes;
CREATE POLICY "Usuários podem criar suas revisões" ON public.revisoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas revisões" ON public.revisoes;
CREATE POLICY "Usuários podem atualizar suas revisões" ON public.revisoes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas revisões" ON public.revisoes;
CREATE POLICY "Usuários podem deletar suas revisões" ON public.revisoes
  FOR DELETE USING (auth.uid() = user_id);

-- 6. TABELA DE QUESTÕES RESPONDIDAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.questoes_respondidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  questao_id TEXT,
  disciplina TEXT,
  topico TEXT,
  acertou BOOLEAN,
  resposta_selecionada TEXT,
  tempo_resposta INTEGER, -- em segundos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para questoes_respondidas
ALTER TABLE public.questoes_respondidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas questões" ON public.questoes_respondidas;
CREATE POLICY "Usuários podem ver suas questões" ON public.questoes_respondidas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar suas questões" ON public.questoes_respondidas;
CREATE POLICY "Usuários podem criar suas questões" ON public.questoes_respondidas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. TABELA DE CICLOS DE ESTUDO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ciclos_estudo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'concluido')),
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fim TIMESTAMP WITH TIME ZONE,
  progresso INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para ciclos_estudo
ALTER TABLE public.ciclos_estudo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seus ciclos" ON public.ciclos_estudo;
CREATE POLICY "Usuários podem ver seus ciclos" ON public.ciclos_estudo
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus ciclos" ON public.ciclos_estudo;
CREATE POLICY "Usuários podem criar seus ciclos" ON public.ciclos_estudo
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus ciclos" ON public.ciclos_estudo;
CREATE POLICY "Usuários podem atualizar seus ciclos" ON public.ciclos_estudo
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus ciclos" ON public.ciclos_estudo;
CREATE POLICY "Usuários podem deletar seus ciclos" ON public.ciclos_estudo
  FOR DELETE USING (auth.uid() = user_id);

-- 8. TABELA DE SIMULADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.simulados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  disciplinas TEXT[],
  total_questoes INTEGER DEFAULT 0,
  questoes_corretas INTEGER DEFAULT 0,
  tempo_gasto INTEGER, -- em minutos
  status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'abandonado')),
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fim TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para simulados
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seus simulados" ON public.simulados;
CREATE POLICY "Usuários podem ver seus simulados" ON public.simulados
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus simulados" ON public.simulados;
CREATE POLICY "Usuários podem criar seus simulados" ON public.simulados
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus simulados" ON public.simulados;
CREATE POLICY "Usuários podem atualizar seus simulados" ON public.simulados
  FOR UPDATE USING (auth.uid() = user_id);

-- 9. FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, nome, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Criar estatísticas iniciais
  INSERT INTO public.estatisticas_usuario (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil quando usuário se cadastra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. FUNÇÃO PARA ATUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_estatisticas ON public.estatisticas_usuario;
CREATE TRIGGER set_updated_at_estatisticas
  BEFORE UPDATE ON public.estatisticas_usuario
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================

-- PARA CRIAR PERFIL PARA USUÁRIOS JÁ EXISTENTES, EXECUTE:
-- INSERT INTO public.profiles (id, nome, email)
-- SELECT id, raw_user_meta_data->>'nome', email FROM auth.users
-- WHERE id NOT IN (SELECT id FROM public.profiles);

-- INSERT INTO public.estatisticas_usuario (user_id)
-- SELECT id FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM public.estatisticas_usuario);
