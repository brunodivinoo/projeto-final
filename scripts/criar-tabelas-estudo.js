#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: { schema: 'public' },
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function executarSQL(sql, descricao) {
  try {
    console.log(`\n🔄 ${descricao}...`);
    const { data, error } = await supabase.rpc('exec_sql_custom', { query: sql });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`   ⚠️  Já existe, pulando...`);
        return true;
      }
      throw error;
    }

    console.log(`   ✅ Sucesso!`);
    return true;
  } catch (err) {
    console.error(`   ❌ Erro: ${err.message}`);
    return false;
  }
}

async function criarTabelas() {
  console.log('🚀 Iniciando criação das tabelas do Sistema de Estudos...\n');
  console.log('='.repeat(60));

  // 1. Tabela de Planos de Estudo
  await executarSQL(`
    CREATE TABLE IF NOT EXISTS planos_estudo (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      nome VARCHAR(200) NOT NULL,
      descricao TEXT,
      objetivo TEXT,
      data_inicio DATE,
      data_fim DATE,
      horas_semanais INTEGER DEFAULT 20,
      ativo BOOLEAN DEFAULT true,
      ai_sugestoes BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'Criando tabela planos_estudo');

  // 2. Tabela de Itens do Plano (disciplinas/assuntos vinculados)
  await executarSQL(`
    CREATE TABLE IF NOT EXISTS plano_itens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plano_id UUID NOT NULL REFERENCES planos_estudo(id) ON DELETE CASCADE,
      disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
      assunto_id UUID REFERENCES assuntos(id) ON DELETE SET NULL,
      subassunto_id UUID REFERENCES subassuntos(id) ON DELETE SET NULL,
      prioridade INTEGER DEFAULT 3 CHECK (prioridade >= 1 AND prioridade <= 5),
      dificuldade INTEGER DEFAULT 3 CHECK (dificuldade >= 1 AND dificuldade <= 5),
      horas_meta INTEGER DEFAULT 10,
      ordem INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'Criando tabela plano_itens');

  // 3. Tabela de Disponibilidade do Plano
  await executarSQL(`
    CREATE TABLE IF NOT EXISTS plano_disponibilidade (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plano_id UUID NOT NULL REFERENCES planos_estudo(id) ON DELETE CASCADE,
      dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
      periodo VARCHAR(20) NOT NULL CHECK (periodo IN ('manha', 'tarde', 'noite')),
      disponivel BOOLEAN DEFAULT true,
      horas NUMERIC(3,1) DEFAULT 3,
      UNIQUE(plano_id, dia_semana, periodo)
    )
  `, 'Criando tabela plano_disponibilidade');

  // 4. Tabela de Ciclos de Estudo
  await executarSQL(`
    CREATE TABLE IF NOT EXISTS ciclos_estudo (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      plano_id UUID REFERENCES planos_estudo(id) ON DELETE SET NULL,
      nome VARCHAR(200) NOT NULL,
      descricao TEXT,
      numero INTEGER DEFAULT 1,
      duracao_dias INTEGER DEFAULT 7,
      data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
      data_fim DATE,
      status VARCHAR(20) DEFAULT 'em_progresso' CHECK (status IN ('planejado', 'em_progresso', 'pausado', 'concluido')),
      horas_planejadas NUMERIC(5,2) DEFAULT 40,
      horas_estudadas NUMERIC(5,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'Criando tabela ciclos_estudo');

  // 5. Tabela de Itens do Ciclo (matérias do ciclo)
  await executarSQL(`
    CREATE TABLE IF NOT EXISTS ciclo_itens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ciclo_id UUID NOT NULL REFERENCES ciclos_estudo(id) ON DELETE CASCADE,
      disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
      assunto_id UUID REFERENCES assuntos(id) ON DELETE SET NULL,
      subassunto_id UUID REFERENCES subassuntos(id) ON DELETE SET NULL,
      nome_display VARCHAR(200),
      cor VARCHAR(20) DEFAULT 'blue',
      icone VARCHAR(50) DEFAULT 'book',
      horas_meta NUMERIC(5,2) DEFAULT 10,
      horas_estudadas NUMERIC(5,2) DEFAULT 0,
      progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
      prioridade INTEGER DEFAULT 3 CHECK (prioridade >= 1 AND prioridade <= 5),
      ordem INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'Criando tabela ciclo_itens');

  // 6. Tabela de Sessões de Estudo
  await executarSQL(`
    CREATE TABLE IF NOT EXISTS sessoes_estudo (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      ciclo_id UUID REFERENCES ciclos_estudo(id) ON DELETE SET NULL,
      ciclo_item_id UUID REFERENCES ciclo_itens(id) ON DELETE SET NULL,
      disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
      assunto_id UUID REFERENCES assuntos(id) ON DELETE SET NULL,
      subassunto_id UUID REFERENCES subassuntos(id) ON DELETE SET NULL,
      metodo VARCHAR(30) NOT NULL CHECK (metodo IN ('questoes', 'leitura', 'video', 'resumo', 'flashcard', 'aula', 'revisao', 'pdf', 'outro')),
      inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      fim TIMESTAMPTZ,
      duracao_segundos INTEGER DEFAULT 0,
      pausas INTEGER DEFAULT 0,
      tempo_pausado_segundos INTEGER DEFAULT 0,
      questoes_feitas INTEGER DEFAULT 0,
      questoes_corretas INTEGER DEFAULT 0,
      porcentagem_acerto NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN questoes_feitas > 0
          THEN ROUND((questoes_corretas::NUMERIC / questoes_feitas) * 100, 2)
          ELSE 0
        END
      ) STORED,
      anotacoes TEXT,
      avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
      criar_revisao BOOLEAN DEFAULT true,
      prioridade_revisao INTEGER DEFAULT 3 CHECK (prioridade_revisao >= 1 AND prioridade_revisao <= 5),
      status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'pausada', 'finalizada', 'cancelada')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'Criando tabela sessoes_estudo');

  // 7. Tabela de Revisões (Spaced Repetition)
  await executarSQL(`
    CREATE TABLE IF NOT EXISTS revisoes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      sessao_origem_id UUID REFERENCES sessoes_estudo(id) ON DELETE SET NULL,
      disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
      assunto_id UUID REFERENCES assuntos(id) ON DELETE SET NULL,
      subassunto_id UUID REFERENCES subassuntos(id) ON DELETE SET NULL,
      titulo VARCHAR(300),
      descricao TEXT,
      metodo_original VARCHAR(30),
      data_estudo DATE NOT NULL DEFAULT CURRENT_DATE,
      proxima_revisao DATE NOT NULL,
      intervalo INTEGER DEFAULT 1,
      fator_facilidade NUMERIC(3,2) DEFAULT 2.50,
      repeticoes INTEGER DEFAULT 0,
      prioridade INTEGER DEFAULT 3 CHECK (prioridade >= 1 AND prioridade <= 5),
      status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'atrasada', 'concluida', 'arquivada')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'Criando tabela revisoes');

  // 8. Tabela de Histórico de Revisões
  await executarSQL(`
    CREATE TABLE IF NOT EXISTS revisao_historico (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      revisao_id UUID NOT NULL REFERENCES revisoes(id) ON DELETE CASCADE,
      data_revisao DATE NOT NULL DEFAULT CURRENT_DATE,
      qualidade INTEGER NOT NULL CHECK (qualidade >= 0 AND qualidade <= 5),
      tempo_segundos INTEGER DEFAULT 0,
      intervalo_anterior INTEGER,
      novo_intervalo INTEGER,
      fator_anterior NUMERIC(3,2),
      novo_fator NUMERIC(3,2),
      anotacoes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'Criando tabela revisao_historico');

  // 9. Tabela de Estudo Diário (agregação para estatísticas)
  await executarSQL(`
    CREATE TABLE IF NOT EXISTS estudo_diario (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      data DATE NOT NULL DEFAULT CURRENT_DATE,
      total_segundos INTEGER DEFAULT 0,
      total_sessoes INTEGER DEFAULT 0,
      total_questoes INTEGER DEFAULT 0,
      total_corretas INTEGER DEFAULT 0,
      total_revisoes INTEGER DEFAULT 0,
      xp_ganho INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, data)
    )
  `, 'Criando tabela estudo_diario');

  console.log('\n' + '='.repeat(60));
  console.log('\n🔐 Configurando RLS (Row Level Security)...\n');

  // Habilitar RLS em todas as tabelas
  const tabelas = [
    'planos_estudo', 'plano_itens', 'plano_disponibilidade',
    'ciclos_estudo', 'ciclo_itens', 'sessoes_estudo',
    'revisoes', 'revisao_historico', 'estudo_diario'
  ];

  for (const tabela of tabelas) {
    await executarSQL(`ALTER TABLE ${tabela} ENABLE ROW LEVEL SECURITY`, `Habilitando RLS em ${tabela}`);
  }

  console.log('\n📜 Criando políticas de segurança...\n');

  // Políticas para planos_estudo
  await executarSQL(`
    CREATE POLICY IF NOT EXISTS "planos_estudo_user_policy" ON planos_estudo
    FOR ALL USING (auth.uid() = user_id)
  `, 'Política para planos_estudo');

  // Políticas para plano_itens
  await executarSQL(`
    CREATE POLICY IF NOT EXISTS "plano_itens_user_policy" ON plano_itens
    FOR ALL USING (
      EXISTS (SELECT 1 FROM planos_estudo WHERE id = plano_itens.plano_id AND user_id = auth.uid())
    )
  `, 'Política para plano_itens');

  // Políticas para plano_disponibilidade
  await executarSQL(`
    CREATE POLICY IF NOT EXISTS "plano_disponibilidade_user_policy" ON plano_disponibilidade
    FOR ALL USING (
      EXISTS (SELECT 1 FROM planos_estudo WHERE id = plano_disponibilidade.plano_id AND user_id = auth.uid())
    )
  `, 'Política para plano_disponibilidade');

  // Políticas para ciclos_estudo
  await executarSQL(`
    CREATE POLICY IF NOT EXISTS "ciclos_estudo_user_policy" ON ciclos_estudo
    FOR ALL USING (auth.uid() = user_id)
  `, 'Política para ciclos_estudo');

  // Políticas para ciclo_itens
  await executarSQL(`
    CREATE POLICY IF NOT EXISTS "ciclo_itens_user_policy" ON ciclo_itens
    FOR ALL USING (
      EXISTS (SELECT 1 FROM ciclos_estudo WHERE id = ciclo_itens.ciclo_id AND user_id = auth.uid())
    )
  `, 'Política para ciclo_itens');

  // Políticas para sessoes_estudo
  await executarSQL(`
    CREATE POLICY IF NOT EXISTS "sessoes_estudo_user_policy" ON sessoes_estudo
    FOR ALL USING (auth.uid() = user_id)
  `, 'Política para sessoes_estudo');

  // Políticas para revisoes
  await executarSQL(`
    CREATE POLICY IF NOT EXISTS "revisoes_user_policy" ON revisoes
    FOR ALL USING (auth.uid() = user_id)
  `, 'Política para revisoes');

  // Políticas para revisao_historico
  await executarSQL(`
    CREATE POLICY IF NOT EXISTS "revisao_historico_user_policy" ON revisao_historico
    FOR ALL USING (
      EXISTS (SELECT 1 FROM revisoes WHERE id = revisao_historico.revisao_id AND user_id = auth.uid())
    )
  `, 'Política para revisao_historico');

  // Políticas para estudo_diario
  await executarSQL(`
    CREATE POLICY IF NOT EXISTS "estudo_diario_user_policy" ON estudo_diario
    FOR ALL USING (auth.uid() = user_id)
  `, 'Política para estudo_diario');

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Criando índices para performance...\n');

  // Índices para otimização
  await executarSQL(`CREATE INDEX IF NOT EXISTS idx_planos_estudo_user ON planos_estudo(user_id)`, 'Índice planos_estudo_user');
  await executarSQL(`CREATE INDEX IF NOT EXISTS idx_planos_estudo_ativo ON planos_estudo(user_id, ativo)`, 'Índice planos_estudo_ativo');
  await executarSQL(`CREATE INDEX IF NOT EXISTS idx_ciclos_estudo_user ON ciclos_estudo(user_id)`, 'Índice ciclos_estudo_user');
  await executarSQL(`CREATE INDEX IF NOT EXISTS idx_ciclos_estudo_status ON ciclos_estudo(user_id, status)`, 'Índice ciclos_estudo_status');
  await executarSQL(`CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_user ON sessoes_estudo(user_id)`, 'Índice sessoes_estudo_user');
  await executarSQL(`CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_data ON sessoes_estudo(user_id, inicio)`, 'Índice sessoes_estudo_data');
  await executarSQL(`CREATE INDEX IF NOT EXISTS idx_revisoes_user ON revisoes(user_id)`, 'Índice revisoes_user');
  await executarSQL(`CREATE INDEX IF NOT EXISTS idx_revisoes_proxima ON revisoes(user_id, proxima_revisao, status)`, 'Índice revisoes_proxima');
  await executarSQL(`CREATE INDEX IF NOT EXISTS idx_estudo_diario_user_data ON estudo_diario(user_id, data)`, 'Índice estudo_diario_user_data');

  console.log('\n' + '='.repeat(60));
  console.log('\n⚡ Criando funções auxiliares...\n');

  // Função para atualizar updated_at
  await executarSQL(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `, 'Função update_updated_at_column');

  // Triggers para updated_at
  const tabelasComUpdatedAt = ['planos_estudo', 'ciclos_estudo', 'revisoes', 'estudo_diario'];
  for (const tabela of tabelasComUpdatedAt) {
    await executarSQL(`
      DROP TRIGGER IF EXISTS trigger_${tabela}_updated_at ON ${tabela};
      CREATE TRIGGER trigger_${tabela}_updated_at
        BEFORE UPDATE ON ${tabela}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `, `Trigger updated_at para ${tabela}`);
  }

  // Função para calcular próxima revisão (SM-2)
  await executarSQL(`
    CREATE OR REPLACE FUNCTION calcular_proxima_revisao(
      p_qualidade INTEGER,
      p_repeticoes INTEGER,
      p_fator_facilidade NUMERIC,
      p_intervalo INTEGER
    ) RETURNS TABLE (
      nova_repeticao INTEGER,
      novo_intervalo INTEGER,
      novo_fator NUMERIC,
      proxima_data DATE
    ) AS $$
    DECLARE
      v_repeticao INTEGER;
      v_intervalo INTEGER;
      v_fator NUMERIC;
    BEGIN
      v_fator := p_fator_facilidade;

      IF p_qualidade < 3 THEN
        -- Resposta incorreta: reiniciar
        v_repeticao := 0;
        v_intervalo := 1;
      ELSE
        -- Resposta correta
        v_repeticao := p_repeticoes + 1;

        IF v_repeticao = 1 THEN
          v_intervalo := 1;
        ELSIF v_repeticao = 2 THEN
          v_intervalo := 6;
        ELSE
          v_intervalo := ROUND(p_intervalo * v_fator);
        END IF;

        -- Atualizar fator de facilidade
        v_fator := v_fator + (0.1 - (5 - p_qualidade) * (0.08 + (5 - p_qualidade) * 0.02));
        IF v_fator < 1.3 THEN v_fator := 1.3; END IF;
      END IF;

      nova_repeticao := v_repeticao;
      novo_intervalo := v_intervalo;
      novo_fator := v_fator;
      proxima_data := CURRENT_DATE + v_intervalo;

      RETURN NEXT;
    END;
    $$ LANGUAGE plpgsql
  `, 'Função SM-2 calcular_proxima_revisao');

  // Função para atualizar estudo_diario
  await executarSQL(`
    CREATE OR REPLACE FUNCTION atualizar_estudo_diario()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'finalizada' AND OLD.status != 'finalizada') THEN
        INSERT INTO estudo_diario (user_id, data, total_segundos, total_sessoes, total_questoes, total_corretas)
        VALUES (
          NEW.user_id,
          CURRENT_DATE,
          COALESCE(NEW.duracao_segundos, 0),
          1,
          COALESCE(NEW.questoes_feitas, 0),
          COALESCE(NEW.questoes_corretas, 0)
        )
        ON CONFLICT (user_id, data) DO UPDATE SET
          total_segundos = estudo_diario.total_segundos + COALESCE(NEW.duracao_segundos, 0),
          total_sessoes = estudo_diario.total_sessoes + 1,
          total_questoes = estudo_diario.total_questoes + COALESCE(NEW.questoes_feitas, 0),
          total_corretas = estudo_diario.total_corretas + COALESCE(NEW.questoes_corretas, 0),
          updated_at = NOW();
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `, 'Função atualizar_estudo_diario');

  // Trigger para atualizar estudo_diario
  await executarSQL(`
    DROP TRIGGER IF EXISTS trigger_sessao_estudo_diario ON sessoes_estudo;
    CREATE TRIGGER trigger_sessao_estudo_diario
      AFTER INSERT OR UPDATE ON sessoes_estudo
      FOR EACH ROW
      EXECUTE FUNCTION atualizar_estudo_diario()
  `, 'Trigger estudo_diario');

  // Função para atualizar horas estudadas no ciclo
  await executarSQL(`
    CREATE OR REPLACE FUNCTION atualizar_ciclo_horas()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.ciclo_id IS NOT NULL AND NEW.status = 'finalizada' THEN
        -- Atualizar horas do item do ciclo
        IF NEW.ciclo_item_id IS NOT NULL THEN
          UPDATE ciclo_itens SET
            horas_estudadas = horas_estudadas + (NEW.duracao_segundos::NUMERIC / 3600),
            progresso = LEAST(100, ROUND(((horas_estudadas + (NEW.duracao_segundos::NUMERIC / 3600)) / NULLIF(horas_meta, 0)) * 100))
          WHERE id = NEW.ciclo_item_id;
        END IF;

        -- Atualizar horas totais do ciclo
        UPDATE ciclos_estudo SET
          horas_estudadas = horas_estudadas + (NEW.duracao_segundos::NUMERIC / 3600)
        WHERE id = NEW.ciclo_id;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `, 'Função atualizar_ciclo_horas');

  await executarSQL(`
    DROP TRIGGER IF EXISTS trigger_sessao_ciclo_horas ON sessoes_estudo;
    CREATE TRIGGER trigger_sessao_ciclo_horas
      AFTER UPDATE ON sessoes_estudo
      FOR EACH ROW
      WHEN (NEW.status = 'finalizada' AND OLD.status != 'finalizada')
      EXECUTE FUNCTION atualizar_ciclo_horas()
  `, 'Trigger ciclo_horas');

  // Função para criar revisão automaticamente
  await executarSQL(`
    CREATE OR REPLACE FUNCTION criar_revisao_automatica()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.status = 'finalizada' AND NEW.criar_revisao = true THEN
        INSERT INTO revisoes (
          user_id,
          sessao_origem_id,
          disciplina_id,
          assunto_id,
          subassunto_id,
          metodo_original,
          data_estudo,
          proxima_revisao,
          prioridade
        ) VALUES (
          NEW.user_id,
          NEW.id,
          NEW.disciplina_id,
          NEW.assunto_id,
          NEW.subassunto_id,
          NEW.metodo,
          CURRENT_DATE,
          CURRENT_DATE + 1,
          COALESCE(NEW.prioridade_revisao, 3)
        );
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `, 'Função criar_revisao_automatica');

  await executarSQL(`
    DROP TRIGGER IF EXISTS trigger_criar_revisao ON sessoes_estudo;
    CREATE TRIGGER trigger_criar_revisao
      AFTER UPDATE ON sessoes_estudo
      FOR EACH ROW
      WHEN (NEW.status = 'finalizada' AND OLD.status != 'finalizada')
      EXECUTE FUNCTION criar_revisao_automatica()
  `, 'Trigger criar_revisao');

  // Função para atualizar status das revisões atrasadas
  await executarSQL(`
    CREATE OR REPLACE FUNCTION atualizar_revisoes_atrasadas()
    RETURNS void AS $$
    BEGIN
      UPDATE revisoes
      SET status = 'atrasada'
      WHERE status = 'pendente'
        AND proxima_revisao < CURRENT_DATE;
    END;
    $$ LANGUAGE plpgsql
  `, 'Função atualizar_revisoes_atrasadas');

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Todas as tabelas, políticas e funções foram criadas com sucesso!');
  console.log('\n📋 Resumo das tabelas criadas:');
  console.log('   - planos_estudo (planos de estudo macro)');
  console.log('   - plano_itens (disciplinas/assuntos do plano)');
  console.log('   - plano_disponibilidade (horários disponíveis)');
  console.log('   - ciclos_estudo (ciclos de execução)');
  console.log('   - ciclo_itens (matérias do ciclo)');
  console.log('   - sessoes_estudo (sessões com timer)');
  console.log('   - revisoes (revisões com SM-2)');
  console.log('   - revisao_historico (histórico de cada revisão)');
  console.log('   - estudo_diario (agregação diária para stats)');
  console.log('\n');
}

criarTabelas().catch(console.error);
