-- =============================================
-- PREPARAMED - Row Level Security Policies
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE disciplinas_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE assuntos_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE subassuntos_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE teorias_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_leitura_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE anotacoes_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE artigos_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE teoria_artigos_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulados_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulado_respostas_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topicos_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_respostas_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_votos_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE limites_uso_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudo_diario_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards_MED ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_ia_MED ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELAS PÚBLICAS (leitura para todos)
-- =============================================

-- Disciplinas: todos podem ler
CREATE POLICY "disciplinas_med_select" ON disciplinas_MED FOR SELECT USING (true);

-- Assuntos: todos podem ler
CREATE POLICY "assuntos_med_select" ON assuntos_MED FOR SELECT USING (true);

-- Subassuntos: todos podem ler
CREATE POLICY "subassuntos_med_select" ON subassuntos_MED FOR SELECT USING (true);

-- Teorias: todos podem ler (controle de nível feito no frontend)
CREATE POLICY "teorias_med_select" ON teorias_MED FOR SELECT USING (true);

-- Questões: todos podem ler (controle de quantidade feito no frontend)
CREATE POLICY "questoes_med_select" ON questoes_MED FOR SELECT USING (ativo = true);

-- Artigos: todos podem ler
CREATE POLICY "artigos_med_select" ON artigos_MED FOR SELECT USING (true);

-- Teoria-Artigos: todos podem ler
CREATE POLICY "teoria_artigos_med_select" ON teoria_artigos_MED FOR SELECT USING (true);

-- =============================================
-- TABELAS DE USUÁRIO (próprios dados)
-- =============================================

-- Respostas: usuário vê e cria apenas suas respostas
CREATE POLICY "respostas_med_select" ON respostas_MED FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "respostas_med_insert" ON respostas_MED FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Progresso de leitura
CREATE POLICY "progresso_leitura_med_select" ON progresso_leitura_MED FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "progresso_leitura_med_insert" ON progresso_leitura_MED FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progresso_leitura_med_update" ON progresso_leitura_MED FOR UPDATE
  USING (auth.uid() = user_id);

-- Anotações
CREATE POLICY "anotacoes_med_select" ON anotacoes_MED FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "anotacoes_med_insert" ON anotacoes_MED FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "anotacoes_med_update" ON anotacoes_MED FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "anotacoes_med_delete" ON anotacoes_MED FOR DELETE
  USING (auth.uid() = user_id);

-- Simulados
CREATE POLICY "simulados_med_select" ON simulados_MED FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "simulados_med_insert" ON simulados_MED FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "simulados_med_update" ON simulados_MED FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "simulados_med_delete" ON simulados_MED FOR DELETE
  USING (auth.uid() = user_id);

-- Respostas do simulado (via simulado do usuário)
CREATE POLICY "simulado_respostas_med_select" ON simulado_respostas_MED FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM simulados_MED s
    WHERE s.id = simulado_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "simulado_respostas_med_insert" ON simulado_respostas_MED FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM simulados_MED s
    WHERE s.id = simulado_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "simulado_respostas_med_update" ON simulado_respostas_MED FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM simulados_MED s
    WHERE s.id = simulado_id AND s.user_id = auth.uid()
  ));

-- Profiles
CREATE POLICY "profiles_med_select_own" ON profiles_MED FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_med_insert" ON profiles_MED FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_med_update" ON profiles_MED FOR UPDATE
  USING (auth.uid() = id);

-- Assinaturas (apenas leitura)
CREATE POLICY "assinaturas_med_select" ON assinaturas_MED FOR SELECT
  USING (auth.uid() = user_id);

-- Limites de uso
CREATE POLICY "limites_uso_med_select" ON limites_uso_MED FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "limites_uso_med_insert" ON limites_uso_MED FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "limites_uso_med_update" ON limites_uso_MED FOR UPDATE
  USING (auth.uid() = user_id);

-- Estudo diário
CREATE POLICY "estudo_diario_med_select" ON estudo_diario_MED FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "estudo_diario_med_insert" ON estudo_diario_MED FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "estudo_diario_med_update" ON estudo_diario_MED FOR UPDATE
  USING (auth.uid() = user_id);

-- Flashcards
CREATE POLICY "flashcards_med_select" ON flashcards_MED FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "flashcards_med_insert" ON flashcards_MED FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "flashcards_med_update" ON flashcards_MED FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "flashcards_med_delete" ON flashcards_MED FOR DELETE
  USING (auth.uid() = user_id);

-- Chat IA
CREATE POLICY "chat_ia_med_select" ON chat_ia_MED FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "chat_ia_med_insert" ON chat_ia_MED FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FÓRUM (público com escrita autenticada)
-- =============================================

-- Tópicos: todos podem ler, autenticados podem criar
CREATE POLICY "forum_topicos_med_select" ON forum_topicos_MED FOR SELECT
  USING (true);

CREATE POLICY "forum_topicos_med_insert" ON forum_topicos_MED FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "forum_topicos_med_update" ON forum_topicos_MED FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "forum_topicos_med_delete" ON forum_topicos_MED FOR DELETE
  USING (auth.uid() = user_id);

-- Respostas do fórum
CREATE POLICY "forum_respostas_med_select" ON forum_respostas_MED FOR SELECT
  USING (true);

CREATE POLICY "forum_respostas_med_insert" ON forum_respostas_MED FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "forum_respostas_med_update" ON forum_respostas_MED FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "forum_respostas_med_delete" ON forum_respostas_MED FOR DELETE
  USING (auth.uid() = user_id);

-- Votos do fórum
CREATE POLICY "forum_votos_med_select" ON forum_votos_MED FOR SELECT
  USING (true);

CREATE POLICY "forum_votos_med_insert" ON forum_votos_MED FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "forum_votos_med_delete" ON forum_votos_MED FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- SERVICE ROLE (para APIs backend)
-- =============================================

-- As APIs usam service_role key que bypassa RLS
-- Isso permite que o backend faça operações administrativas
