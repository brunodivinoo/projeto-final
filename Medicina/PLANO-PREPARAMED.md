# PREPARAMED - Plano de Implementação

## Visão Geral

O **PREPARAMED** é uma plataforma de estudos para estudantes de medicina que será integrada ao sistema atual (StudyHub), compartilhando o mesmo banco de dados Supabase e a mesma aplicação Next.js.

---

## 1. ESTRUTURA DE NAVEGAÇÃO

### 1.1 Menu Principal (Landing Page Atual)
```
Recursos | Planos | Contato | [Medicina] | Login | Cadastro
                              ^^^^^^^^^
                              NOVO BOTÃO
```

O botão "Medicina" levará para uma **nova landing page** dedicada ao PREPARAMED.

### 1.2 Rotas Novas
```
/medicina                    -> Landing page do PREPARAMED
/medicina/planos             -> Página de planos/preços
/medicina/login              -> Login específico (mesmo auth, UI diferente)
/medicina/cadastro           -> Cadastro específico
/medicina/dashboard          -> Dashboard do estudante de medicina
/medicina/questoes           -> Banco de questões médicas
/medicina/biblioteca         -> Biblioteca de teoria
/medicina/caderno            -> Anotações pessoais
/medicina/artigos            -> Artigos científicos
/medicina/simulados          -> Simulados de residência
/medicina/estatisticas       -> Estatísticas e progresso
/medicina/ia                 -> Chat com IA médica
/medicina/forum              -> Fórum de discussões
```

---

## 2. PLANOS E PREÇOS

### 2.1 Estrutura de Planos

| Plano | Preço | Cobrança |
|-------|-------|----------|
| **Gratuito** | R$ 0 | - |
| **Premium** | R$ 50/mês | Recorrente |
| **Residência** | R$ 100/mês | Recorrente |

### 2.2 Limites por Plano

| Funcionalidade | Gratuito | Premium (R$50) | Residência (R$100) |
|----------------|----------|----------------|---------------------|
| **Questões/dia** | 20 | Ilimitado | Ilimitado |
| **Questões no banco** | 5.000 | 85.000+ | 85.000+ |
| **Simulados/mês** | 2 | 10 | Ilimitado |
| **Questões por simulado** | 30 | 100 | 200 |
| **Biblioteca de Teoria** | Apenas 1º ano | Completa | Completa |
| **Níveis de Teoria** | Básico | Básico + Avançado | Todos (Expert) |
| **Anotações** | 10 notas | 100 notas | Ilimitado |
| **Exportar PDF/Word** | Não | Sim | Sim |
| **Chat IA** | 0 perguntas | 100/mês | Ilimitado |
| **Resumos IA** | Não | 20/mês | Ilimitado |
| **Artigos Científicos** | Não | Visualizar | Visualizar + Resumo IA |
| **Flashcards IA** | Não | 50/mês | Ilimitado |
| **Fórum** | Apenas ler | Ler + Postar | Ler + Postar + Destaque |
| **Estatísticas** | Básicas | Completas | Completas + Comparativo |
| **Filtros Avançados** | Não | Sim | Sim |
| **Histórico Completo** | 30 dias | 1 ano | Ilimitado |
| **Suporte** | FAQ | Email | Email + Prioritário |

---

## 3. BANCO DE DADOS

### 3.1 Convenção de Nomenclatura
Todas as tabelas do PREPARAMED terão o sufixo `_MED`:
```
questoes_MED
teorias_MED
disciplinas_MED
assuntos_MED
subassuntos_MED
...
```

### 3.2 Tabelas Principais

#### Estrutura de Conteúdo
```sql
-- Disciplinas médicas
CREATE TABLE disciplinas_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_normalizado TEXT,
  icone TEXT DEFAULT 'medical_services',
  cor TEXT DEFAULT 'blue',
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assuntos/Tópicos
CREATE TABLE assuntos_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID REFERENCES disciplinas_MED(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES assuntos_MED(id), -- Para hierarquia
  nome TEXT NOT NULL,
  nome_normalizado TEXT,
  slug TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subassuntos
CREATE TABLE subassuntos_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto_id UUID REFERENCES assuntos_MED(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nome_normalizado TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Questões
```sql
-- Questões médicas
CREATE TABLE questoes_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID REFERENCES disciplinas_MED(id),
  assunto_id UUID REFERENCES assuntos_MED(id),
  subassunto_id UUID REFERENCES subassuntos_MED(id),

  -- Informações da questão
  enunciado TEXT NOT NULL,
  alternativas JSONB NOT NULL, -- [{letra: "A", texto: "...", correta: false}, ...]
  gabarito TEXT NOT NULL, -- "A", "B", "C", "D", "E"

  -- Metadados
  banca TEXT,
  ano INTEGER,
  instituicao TEXT,
  prova TEXT, -- "ENARE", "USP", "UNICAMP", etc.
  dificuldade INTEGER DEFAULT 3 CHECK (dificuldade BETWEEN 1 AND 5),

  -- Teoria vinculada
  teoria_id UUID REFERENCES teorias_MED(id),

  -- Estatísticas
  total_respostas INTEGER DEFAULT 0,
  total_acertos INTEGER DEFAULT 0,

  -- IA
  comentario_ia TEXT,
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Respostas dos usuários
CREATE TABLE respostas_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  questao_id UUID REFERENCES questoes_MED(id) ON DELETE CASCADE,
  resposta_selecionada TEXT NOT NULL,
  acertou BOOLEAN NOT NULL,
  tempo_segundos INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, questao_id, created_at)
);
```

#### Teorias (Biblioteca)
```sql
-- Teorias/Conteúdo
CREATE TABLE teorias_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID REFERENCES disciplinas_MED(id),
  assunto_id UUID REFERENCES assuntos_MED(id),
  subassunto_id UUID REFERENCES subassuntos_MED(id),

  -- Conteúdo
  titulo TEXT NOT NULL,
  subtitulo TEXT,

  -- Níveis de profundidade
  conteudo_basico JSONB, -- Versão resumida
  conteudo_avancado JSONB, -- Versão expandida
  conteudo_expert JSONB, -- Versão completa

  -- Elementos especiais
  pontos_chave TEXT[], -- Bullets importantes
  macetes TEXT[], -- Mnemônicos
  pegadinhas TEXT[], -- Erros comuns em provas
  correlacao_clinica TEXT, -- Aplicação prática
  tabela_resumo JSONB, -- Tabela estruturada

  -- Referências
  referencias_bibliograficas JSONB, -- [{autor, titulo, ano, editora}]
  artigos_relacionados UUID[], -- IDs de artigos científicos

  -- Metadados
  tempo_leitura_minutos INTEGER DEFAULT 10,
  nivel_dificuldade INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progresso de leitura
CREATE TABLE progresso_leitura_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  teoria_id UUID REFERENCES teorias_MED(id) ON DELETE CASCADE,
  nivel_lido TEXT DEFAULT 'basico', -- basico, avancado, expert
  lido BOOLEAN DEFAULT false,
  favorito BOOLEAN DEFAULT false,
  ultima_leitura TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, teoria_id)
);
```

#### Anotações
```sql
-- Anotações pessoais
CREATE TABLE anotacoes_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vínculos (opcional - pode ser avulsa)
  teoria_id UUID REFERENCES teorias_MED(id),
  questao_id UUID REFERENCES questoes_MED(id),
  artigo_id UUID REFERENCES artigos_MED(id),

  -- Conteúdo
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL, -- HTML ou Markdown

  -- Organização
  tags TEXT[],
  favorito BOOLEAN DEFAULT false,
  pasta TEXT, -- Organização em pastas virtuais

  -- Destaques (highlights)
  destaques JSONB, -- [{texto, cor, comentario}]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Artigos Científicos
```sql
-- Artigos científicos
CREATE TABLE artigos_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificadores externos
  pubmed_id TEXT UNIQUE,
  doi TEXT,

  -- Dados do artigo
  titulo TEXT NOT NULL,
  autores TEXT[],
  journal TEXT,
  ano INTEGER,
  abstract_original TEXT,

  -- Gerado por IA
  resumo_ia TEXT,
  pontos_principais TEXT[],

  -- Links
  url TEXT,
  pdf_url TEXT,
  acesso_livre BOOLEAN DEFAULT false,

  -- Relações
  disciplinas UUID[], -- Disciplinas relacionadas

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relação teoria-artigo
CREATE TABLE teoria_artigos_MED (
  teoria_id UUID REFERENCES teorias_MED(id) ON DELETE CASCADE,
  artigo_id UUID REFERENCES artigos_MED(id) ON DELETE CASCADE,
  relevancia INTEGER DEFAULT 3, -- 1-5
  PRIMARY KEY (teoria_id, artigo_id)
);
```

#### Simulados
```sql
-- Simulados
CREATE TABLE simulados_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Configuração
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'personalizado', -- personalizado, prova_anterior, residencia
  prova_referencia TEXT, -- "ENARE 2024", "USP 2023", etc.

  -- Filtros usados
  disciplinas UUID[],
  dificuldade_min INTEGER,
  dificuldade_max INTEGER,
  bancas TEXT[],
  anos INTEGER[],

  -- Questões
  questoes_ids UUID[], -- IDs das questões do simulado
  total_questoes INTEGER,

  -- Tempo
  tempo_limite_minutos INTEGER,
  tempo_gasto_segundos INTEGER,

  -- Resultado
  questoes_corretas INTEGER DEFAULT 0,
  status TEXT DEFAULT 'em_andamento', -- em_andamento, finalizado, abandonado

  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Respostas do simulado
CREATE TABLE simulado_respostas_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulado_id UUID REFERENCES simulados_MED(id) ON DELETE CASCADE,
  questao_id UUID REFERENCES questoes_MED(id),
  resposta TEXT,
  acertou BOOLEAN,
  tempo_segundos INTEGER,
  ordem INTEGER
);
```

#### Fórum
```sql
-- Tópicos do fórum
CREATE TABLE forum_topicos_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,

  -- Categorização
  disciplina_id UUID REFERENCES disciplinas_MED(id),
  categoria TEXT DEFAULT 'discussao', -- discussao, duvida, caso_clinico, material

  -- Vínculos (opcional)
  questao_id UUID REFERENCES questoes_MED(id),
  teoria_id UUID REFERENCES teorias_MED(id),

  -- Engajamento
  visualizacoes INTEGER DEFAULT 0,
  total_respostas INTEGER DEFAULT 0,

  -- Moderação
  fixado BOOLEAN DEFAULT false,
  destaque BOOLEAN DEFAULT false, -- Para usuários Residência
  resolvido BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Respostas do fórum
CREATE TABLE forum_respostas_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topico_id UUID REFERENCES forum_topicos_MED(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_respostas_MED(id), -- Para threading

  conteudo TEXT NOT NULL,

  -- Votos
  votos_positivos INTEGER DEFAULT 0,
  votos_negativos INTEGER DEFAULT 0,

  -- Moderação
  melhor_resposta BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votos
CREATE TABLE forum_votos_MED (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resposta_id UUID REFERENCES forum_respostas_MED(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('positivo', 'negativo')),
  PRIMARY KEY (user_id, resposta_id)
);
```

#### Usuários e Planos
```sql
-- Perfil específico do PREPARAMED
CREATE TABLE profiles_MED (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT,
  email TEXT,
  avatar_url TEXT,

  -- Dados específicos de medicina
  faculdade TEXT,
  ano_curso INTEGER, -- 1 a 6
  estado TEXT,
  cidade TEXT,

  -- Plano
  plano TEXT DEFAULT 'gratuito' CHECK (plano IN ('gratuito', 'premium', 'residencia')),

  -- Estatísticas
  questoes_respondidas INTEGER DEFAULT 0,
  questoes_corretas INTEGER DEFAULT 0,
  tempo_estudo_segundos INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assinaturas PREPARAMED
CREATE TABLE assinaturas_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  plano TEXT NOT NULL, -- premium, residencia
  status TEXT DEFAULT 'ativa', -- ativa, cancelada, expirada, trial

  -- Pagamento
  gateway TEXT, -- cakto, stripe
  external_id TEXT, -- ID no gateway

  -- Datas
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  proximo_pagamento TIMESTAMPTZ,

  -- Valores
  valor_mensal DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Limites de uso
CREATE TABLE limites_uso_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_referencia TEXT NOT NULL, -- "2026-01"

  -- Contadores
  questoes_dia INTEGER DEFAULT 0,
  data_questoes DATE DEFAULT CURRENT_DATE,

  simulados_mes INTEGER DEFAULT 0,
  perguntas_ia_mes INTEGER DEFAULT 0,
  resumos_ia_mes INTEGER DEFAULT 0,
  flashcards_ia_mes INTEGER DEFAULT 0,
  anotacoes_total INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, mes_referencia)
);
```

#### Histórico e Estatísticas
```sql
-- Estudo diário
CREATE TABLE estudo_diario_MED (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data DATE NOT NULL,

  -- Questões
  questoes_feitas INTEGER DEFAULT 0,
  questoes_corretas INTEGER DEFAULT 0,

  -- Teoria
  teorias_lidas INTEGER DEFAULT 0,
  tempo_leitura_segundos INTEGER DEFAULT 0,

  -- Simulados
  simulados_feitos INTEGER DEFAULT 0,

  -- IA
  perguntas_ia INTEGER DEFAULT 0,

  -- Tempo total
  tempo_total_segundos INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, data)
);
```

---

## 4. APIs / ROTAS

### 4.1 Estrutura de Pastas
```
app/
├── (marketing)/
│   └── page.tsx                    # Landing atual
│
├── medicina/
│   ├── page.tsx                    # Landing PREPARAMED
│   ├── planos/
│   │   └── page.tsx                # Página de preços
│   ├── login/
│   │   └── page.tsx                # Login
│   ├── cadastro/
│   │   └── page.tsx                # Cadastro
│   │
│   └── (dashboard)/
│       ├── layout.tsx              # Layout do dashboard
│       ├── dashboard/
│       │   └── page.tsx            # Dashboard principal
│       ├── questoes/
│       │   ├── page.tsx            # Banco de questões
│       │   └── [id]/
│       │       └── page.tsx        # Questão individual
│       ├── biblioteca/
│       │   ├── page.tsx            # Biblioteca de teoria
│       │   └── [id]/
│       │       └── page.tsx        # Teoria individual
│       ├── caderno/
│       │   ├── page.tsx            # Minhas anotações
│       │   └── [id]/
│       │       └── page.tsx        # Editar anotação
│       ├── simulados/
│       │   ├── page.tsx            # Lista de simulados
│       │   ├── novo/
│       │   │   └── page.tsx        # Criar simulado
│       │   └── [id]/
│       │       └── page.tsx        # Fazer/ver simulado
│       ├── artigos/
│       │   └── page.tsx            # Artigos científicos
│       ├── forum/
│       │   ├── page.tsx            # Lista de tópicos
│       │   ├── novo/
│       │   │   └── page.tsx        # Novo tópico
│       │   └── [id]/
│       │       └── page.tsx        # Ver tópico
│       ├── estatisticas/
│       │   └── page.tsx            # Estatísticas
│       ├── ia/
│       │   └── page.tsx            # Chat IA
│       └── perfil/
│           └── page.tsx            # Perfil do usuário
│
└── api/
    └── medicina/
        ├── auth/
        │   ├── login/route.ts
        │   ├── cadastro/route.ts
        │   └── perfil/route.ts
        ├── questoes/
        │   ├── route.ts            # GET (listar), POST (criar)
        │   ├── [id]/route.ts       # GET, PUT, DELETE
        │   └── responder/route.ts  # POST resposta
        ├── biblioteca/
        │   ├── route.ts            # GET (listar teorias)
        │   ├── [id]/route.ts       # GET teoria
        │   └── progresso/route.ts  # POST marcar lido
        ├── anotacoes/
        │   ├── route.ts            # CRUD
        │   └── exportar/route.ts   # GET PDF/Word
        ├── simulados/
        │   ├── route.ts            # CRUD
        │   └── [id]/
        │       ├── route.ts        # GET, PUT
        │       └── responder/route.ts
        ├── artigos/
        │   ├── route.ts            # GET listar
        │   ├── [id]/route.ts       # GET detalhes
        │   └── resumir/route.ts    # POST resumo IA
        ├── forum/
        │   ├── topicos/route.ts    # CRUD
        │   └── respostas/route.ts  # CRUD
        ├── ia/
        │   ├── chat/route.ts       # POST pergunta
        │   ├── resumo/route.ts     # POST gerar resumo
        │   └── flashcards/route.ts # POST gerar flashcards
        ├── estatisticas/
        │   └── route.ts            # GET
        └── webhook/
            └── pagamento/route.ts  # POST Cakto webhook
```

---

## 5. FUNCIONALIDADES DETALHADAS

### 5.1 Banco de Questões

#### Filtros
- Disciplina (Anatomia, Fisiologia, Patologia, etc.)
- Assunto (dentro da disciplina)
- Subassunto
- Banca (ENARE, USP, UNICAMP, etc.)
- Ano (2015-2026)
- Dificuldade (1-5)
- Apenas não respondidas
- Apenas erradas

#### Fluxo da Questão
```
1. Exibir enunciado e alternativas
2. Usuário seleciona resposta
3. Clicar "Verificar"
4. Mostrar se acertou (verde) ou errou (vermelho)
5. AUTOMATICAMENTE expandir seção de teoria
6. Teoria inclui:
   - Explicação completa
   - Análise de cada alternativa
   - Conceitos-chave (box)
   - Correlação clínica (box)
   - Pegadinhas comuns (box)
   - Macete/mnemônico (box)
   - Artigos relacionados
   - Referências bibliográficas
7. Botão "Fazer anotação"
8. Botão "Perguntar à IA"
9. Próxima questão
```

### 5.2 Biblioteca de Teoria

#### Navegação
```
├── Anatomia
│   ├── Sistema Cardiovascular
│   │   ├── Coração
│   │   │   ├── Anatomia Externa
│   │   │   ├── Câmaras Cardíacas
│   │   │   └── Vascularização
│   │   └── Grandes Vasos
│   ├── Sistema Digestório
│   └── ...
├── Fisiologia
├── Histologia
├── Embriologia
├── Bioquímica
├── Farmacologia
├── Patologia
├── Semiologia
├── Clínica Médica
├── Cirurgia
├── Pediatria
├── Ginecologia e Obstetrícia
├── Psiquiatria
├── Medicina Preventiva
└── Ética Médica
```

#### Níveis de Profundidade
- **Básico**: Conceitos essenciais (disponível para todos)
- **Avançado**: Detalhes e mecanismos (Premium+)
- **Expert**: Completo + artigos + detalhes de prova (Residência)

### 5.3 Sistema de Anotações

#### Funcionalidades
- Editor de texto rico (TipTap)
- Formatação: negrito, itálico, títulos, listas, tabelas
- Inserir imagens
- Tags personalizadas
- Favoritar notas
- Vincular a: teoria, questão ou artigo
- Busca em todas as notas
- Exportar para PDF e Word

### 5.4 IA (Gemini)

#### Funcionalidades
- Tirar dúvidas sobre questões
- Explicar teoria de forma personalizada
- Gerar resumos de tópicos
- Resumir artigos científicos
- Gerar flashcards a partir de teoria
- Ajudar a criar anotações

#### System Prompt
```
Você é o PREPARAMED IA, um tutor especializado em medicina.

REGRAS:
1. Responda APENAS sobre medicina e temas relacionados
2. Use linguagem clara e didática
3. Não dê a resposta direta em questões, ajude a raciocinar
4. Cite fontes quando apropriado (livros, artigos)
5. Forneça macetes de memorização quando útil
6. Seja encorajador e positivo
7. Indique artigos científicos relevantes quando perguntado
8. Ajude o aluno a fazer anotações organizadas
9. Use terminologia médica correta
10. Relacione sempre com aplicação clínica

CONTEXTO DO USUÁRIO:
- Ano do curso: {ano_curso}
- Disciplinas de foco: {disciplinas}
- Histórico recente: {ultimas_questoes}
```

### 5.5 Fórum

#### Categorias
- Discussões Gerais
- Dúvidas
- Casos Clínicos
- Compartilhar Material
- Residência

#### Funcionalidades
- Criar tópicos
- Responder
- Votar (positivo/negativo)
- Marcar como resolvido
- Vincular a questões/teorias
- Busca

---

## 6. LANDING PAGE DO PREPARAMED

### 6.1 Estrutura
```
1. HERO
   - Título: "Sua aprovação na residência começa aqui"
   - Subtítulo: "85.000+ questões comentadas, IA 24/7, teoria completa"
   - CTA: "Começar Agora (Grátis)"
   - Badge: "Usado por estudantes de 50+ faculdades"

2. PROBLEMA/SOLUÇÃO
   - "Estudar para residência não precisa ser difícil"
   - 3 cards: Questões, IA, Teoria

3. FUNCIONALIDADES
   - Banco de Questões (com print)
   - Teoria Detalhada (com print)
   - IA Tutora (com print)
   - Anotações (com print)
   - Simulados (com print)
   - Estatísticas (com print)

4. COMO FUNCIONA
   - 3 passos: Cadastre, Estude, Aprove

5. DEPOIMENTOS
   - 3 cards de alunos

6. PLANOS E PREÇOS
   - Gratuito / Premium / Residência
   - Comparativo de funcionalidades

7. FAQ
   - Perguntas frequentes

8. CTA FINAL
   - "Comece sua jornada agora"
```

### 6.2 Psicologia de Conversão
- Escassez: "Vagas limitadas para mentoria"
- Prova social: "10.000+ alunos"
- Garantia: "7 dias grátis para testar Premium"
- Urgência: "Preço promocional de lançamento"
- Autoridade: "Questões de todas as bancas"

---

## 7. INTEGRAÇÕES

### 7.1 Pagamentos (Cakto)
- Mesmo sistema do StudyHub
- Novos planos: premium_med, residencia_med
- Webhook para atualizar assinatura

### 7.2 IA (Gemini)
- Mesmo token já usado
- Limites por plano

### 7.3 PubMed API (Artigos)
- Busca de artigos científicos
- Gratuito, sem necessidade de API key
- Endpoint: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/

---

## 8. CHECKLIST DE DESENVOLVIMENTO

### Fase 1: Infraestrutura
- [ ] Criar tabelas no Supabase (sufixo _MED)
- [ ] Configurar RLS policies
- [ ] Criar seeds com dados iniciais (disciplinas, alguns exemplos)

### Fase 2: Autenticação
- [ ] Página de login /medicina/login
- [ ] Página de cadastro /medicina/cadastro
- [ ] Profile específico (profiles_MED)
- [ ] Middleware para verificar plano

### Fase 3: Landing Page
- [ ] Criar /medicina (landing)
- [ ] Criar /medicina/planos (preços)
- [ ] Adicionar botão "Medicina" no menu principal
- [ ] Design responsivo

### Fase 4: Dashboard
- [ ] Layout do dashboard
- [ ] Dashboard principal com estatísticas
- [ ] Navegação lateral

### Fase 5: Questões
- [ ] API de questões
- [ ] Página de listagem com filtros
- [ ] Página de questão individual
- [ ] Sistema de teoria após resposta
- [ ] Importar questões iniciais

### Fase 6: Biblioteca
- [ ] API de teorias
- [ ] Navegação em árvore
- [ ] Página de teoria
- [ ] Níveis de profundidade
- [ ] Progresso de leitura

### Fase 7: Anotações
- [ ] API de anotações
- [ ] Editor de texto rico
- [ ] Listagem e busca
- [ ] Exportação PDF/Word

### Fase 8: Simulados
- [ ] API de simulados
- [ ] Criação de simulado
- [ ] Execução do simulado
- [ ] Resultado e análise

### Fase 9: IA
- [ ] Chat com IA
- [ ] Geração de resumos
- [ ] Geração de flashcards
- [ ] Controle de limites

### Fase 10: Fórum
- [ ] API de fórum
- [ ] Listagem de tópicos
- [ ] Criação e respostas
- [ ] Sistema de votos

### Fase 11: Pagamentos
- [ ] Integração Cakto
- [ ] Webhook
- [ ] Upgrade/downgrade de plano

### Fase 12: Polimento
- [ ] Estatísticas completas
- [ ] Responsividade
- [ ] Performance
- [ ] Testes

---

## 9. ESTIMATIVAS

### Componentes a Criar
- ~20 páginas novas
- ~15 APIs novas
- ~20 componentes novos
- ~15 tabelas no banco

### Dados Necessários
- Importar/criar questões médicas
- Criar estrutura de disciplinas
- Criar teorias para cada assunto
- Popular artigos científicos

---

## 10. OBSERVAÇÕES FINAIS

1. **Mesmo Auth**: Usuário logado no StudyHub pode acessar PREPARAMED (se tiver plano)
2. **Tabelas Separadas**: Todas com sufixo _MED para não conflitar
3. **Mesmo Gemini**: Reutilizar token existente
4. **Mesmo Cakto**: Criar novos produtos/planos
5. **UI Diferente**: Tema azul/verde médico, mais sóbrio
6. **Sem Social/Ranking**: Foco em estudo individual
7. **Com Fórum**: Comunidade para troca de conhecimento
