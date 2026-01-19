# PLANO COMPLETO - ADMIN GERADOR DE QUESTÕES PREPARAMED

## VISÃO GERAL

Sistema administrativo exclusivo para gerar questões médicas usando IA (Anthropic Claude Opus 4.5), com:
- Pesquisa e cadastro de Disciplinas, Assuntos e Subassuntos
- Geração de questões em lote com gabaritos comentados
- Histórico em tempo real das questões criadas
- Filtro avançado por palavra-chave e combinações na página de questões

**Acesso restrito a:** `brunodivinoa@gmail.com`

---

## ESTRUTURA DA PÁGINA ADMIN

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        ADMIN PREPARAMED                                     │
│                   (Acesso: brunodivinoa@gmail.com)                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   ABA 1        │  │   ABA 2        │  │   ABA 3        │            │
│  │  DISCIPLINAS   │  │   GERADOR      │  │  HISTÓRICO     │            │
│  │  & ASSUNTOS    │  │  DE QUESTÕES   │  │  & GESTÃO      │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                            │
│  • Pesquisar novas    • Configurar lote    • Ver todas questões           │
│  • Adicionar ao DB    • Selecionar períodos • Deletar questões           │
│  • Organizar          • Logs em tempo real • Editar gabaritos            │
│    hierarquia         • Geração 1 por 1    • Exportar                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## ESTRUTURA DE ARQUIVOS A CRIAR

```
app/
├── medicina/
│   └── admin/
│       ├── layout.tsx              # Layout com verificação de acesso
│       ├── page.tsx                # Dashboard admin
│       ├── disciplinas/
│       │   └── page.tsx            # Gestão de disciplinas/assuntos
│       ├── questoes/
│       │   ├── page.tsx            # Gestão de questões
│       │   └── gerar/
│       │       └── page.tsx        # Gerador de questões em lote
│       └── historico/
│           └── page.tsx            # Histórico de geração

api/
├── medicina/
│   └── admin/
│       ├── auth/
│       │   └── route.ts            # Verificar se é admin
│       ├── disciplinas/
│       │   ├── route.ts            # CRUD disciplinas
│       │   ├── pesquisar/
│       │   │   └── route.ts        # Pesquisar novas com IA
│       │   └── assuntos/
│       │       └── route.ts        # CRUD assuntos/sub-assuntos
│       └── questoes/
│           ├── gerar/
│           │   └── route.ts        # Gerar questões com Claude
│           ├── route.ts            # CRUD questões
│           └── busca/
│               └── route.ts        # Busca semântica

components/
└── admin/
    ├── AdminGuard.tsx              # Proteção de rota
    ├── AdminSidebar.tsx            # Sidebar do admin
    ├── DisciplinasManager.tsx      # Gestão de disciplinas
    ├── DisciplinaTree.tsx          # Árvore de assuntos
    ├── QuestaoGenerator.tsx        # Interface do gerador
    ├── GenerationLogs.tsx          # Logs em tempo real
    ├── QuestoesTable.tsx           # Tabela de questões
    ├── QuestaoPreview.tsx          # Preview de questão
    └── GeracaoMonitor.tsx          # Monitor de geração

lib/
├── admin/
│   ├── questaoPrompts.ts           # Prompts para geração
│   ├── livrosFonte.ts              # Lista de livros/fontes
│   ├── periodos.ts                 # Níveis de dificuldade
│   ├── auth.ts                     # Verificação admin
│   └── rateLimit.ts                # Controle de rate limit
└── stores/
    └── adminStore.ts               # Estado global admin
```

---

## ESTRUTURA DO BANCO DE DADOS

### 1. DISCIPLINAS (modificar existente)

```sql
ALTER TABLE disciplinas_med ADD COLUMN IF NOT EXISTS
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW();
```

### 2. ASSUNTOS (modificar existente)

```sql
ALTER TABLE assuntos_med ADD COLUMN IF NOT EXISTS
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true;
```

### 3. SUB-ASSUNTOS (criar se não existir)

```sql
CREATE TABLE IF NOT EXISTS sub_assuntos_med (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto_id UUID REFERENCES assuntos_med(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sub_assuntos_assunto ON sub_assuntos_med(assunto_id);
```

### 4. QUESTÕES (modificar estrutura)

```sql
ALTER TABLE questoes_med ADD COLUMN IF NOT EXISTS
  sub_assunto_id UUID REFERENCES sub_assuntos_med(id),
  periodo_dificuldade INTEGER CHECK (periodo_dificuldade BETWEEN 1 AND 12),
  -- 1-2: Básico, 3-4: Intermediário, 5-6: Avançado, etc.
  fonte_principal TEXT,     -- Nome do livro/artigo
  fonte_pagina TEXT,        -- Página/capítulo
  fonte_ano INTEGER,        -- Ano da edição
  referencia_abnt TEXT,     -- Referência formatada ABNT
  referencias_abnt TEXT[],  -- Array de referências
  palavras_chave TEXT[],    -- Para busca semântica
  gerado_por_ia BOOLEAN DEFAULT false,
  modelo_ia TEXT,           -- Qual modelo gerou
  revisado BOOLEAN DEFAULT false,
  qualidade_validada BOOLEAN DEFAULT false,
  lote_geracao_id UUID,
  created_by UUID REFERENCES auth.users(id);
```

### 5. GABARITOS (modificar estrutura)

```sql
ALTER TABLE gabaritos_med ADD COLUMN IF NOT EXISTS
  referencia_abnt TEXT,
  fontes_consultadas JSONB,   -- Lista de fontes usadas
  dica_estudo TEXT,           -- Dica para memorização
  revisado BOOLEAN DEFAULT false;
```

### 6. LOG DE GERAÇÃO (nova tabela)

```sql
CREATE TABLE admin_geracao_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questao_id UUID REFERENCES questoes_med(id) ON DELETE SET NULL,
  disciplina_id UUID,
  assunto_id UUID,
  periodo INTEGER,
  status TEXT CHECK (status IN ('gerando', 'sucesso', 'erro', 'cancelado')),
  tokens_usados INTEGER,
  tempo_geracao_ms INTEGER,
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geracao_logs_status ON admin_geracao_logs(status);
CREATE INDEX idx_geracao_logs_data ON admin_geracao_logs(created_at);
```

### 7. LOTES DE GERAÇÃO (nova tabela)

```sql
CREATE TABLE lotes_geracao_med (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  disciplina_id UUID REFERENCES disciplinas_med(id),
  assuntos_ids UUID[],
  subassuntos_ids UUID[],
  periodos INTEGER[],
  quantidade_por_periodo INTEGER DEFAULT 5,
  total_questoes INTEGER DEFAULT 0,
  questoes_criadas INTEGER DEFAULT 0,
  questoes_com_erro INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'pausado', 'concluido', 'erro')),
  configuracoes JSONB,
  logs JSONB[],
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lotes_geracao_status ON lotes_geracao_med(status);
CREATE INDEX idx_lotes_geracao_user ON lotes_geracao_med(created_by);
```

### 8. LIVROS DE REFERÊNCIA (nova tabela)

```sql
CREATE TABLE livros_referencia_med (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  autores TEXT NOT NULL,
  edicao TEXT,
  editora TEXT,
  ano INTEGER,
  isbn TEXT,
  abreviacao TEXT,              -- Ex: "Guyton", "Abbas", "Sobotta"
  prioridade INTEGER DEFAULT 1, -- 1 = máxima prioridade
  disciplinas_aplicaveis UUID[],-- Quais disciplinas este livro cobre
  areas TEXT[],                 -- Áreas: ['Fisiologia', 'Todas']
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir livros principais
INSERT INTO livros_referencia_med (titulo, autores, edicao, editora, ano, abreviacao, prioridade, areas) VALUES
('Tratado de Fisiologia Médica', 'GUYTON, A. C.; HALL, J. E.', '14. ed.', 'Elsevier', 2021, 'Guyton', 1, ARRAY['Fisiologia', 'Todas']),
('Imunologia Celular e Molecular', 'ABBAS, A. K.; LICHTMAN, A. H.; PILLAI, S.', '10. ed.', 'Elsevier', 2022, 'Abbas', 1, ARRAY['Imunologia']),
('Sobotta Atlas de Anatomia Humana', 'PAULSEN, F.; WASCHKE, J.', '24. ed.', 'Guanabara Koogan', 2018, 'Sobotta', 1, ARRAY['Anatomia']),
('Histologia Básica: Texto e Atlas', 'JUNQUEIRA, L. C.; CARNEIRO, J.', '13. ed.', 'Guanabara Koogan', 2017, 'Junqueira', 1, ARRAY['Histologia']),
('Robbins & Cotran Patologia', 'KUMAR, V.; ABBAS, A. K.; ASTER, J. C.', '10. ed.', 'Elsevier', 2021, 'Robbins', 1, ARRAY['Patologia']),
('Rang & Dale Farmacologia', 'RANG, H. P.', '9. ed.', 'Elsevier', 2020, 'Rang', 1, ARRAY['Farmacologia']),
('Harrison Medicina Interna', 'KASPER, D. L. et al.', '21. ed.', 'McGraw-Hill', 2022, 'Harrison', 1, ARRAY['Clínica Médica', 'Todas']),
('Microbiologia Médica de Jawetz', 'CARROLL, K. C.', '27. ed.', 'McGraw-Hill', 2017, 'Jawetz', 1, ARRAY['Microbiologia']),
('Netter Atlas de Anatomia Humana', 'NETTER, F. H.', '7. ed.', 'Elsevier', 2019, 'Netter', 1, ARRAY['Anatomia']),
('Moore Anatomia Orientada para Clínica', 'MOORE, K. L.; DALLEY, A. F.', '8. ed.', 'Guanabara Koogan', 2019, 'Moore', 1, ARRAY['Anatomia']),
('Embriologia Clínica', 'MOORE, K. L.; PERSAUD, T. V. N.', '10. ed.', 'Elsevier', 2016, 'Moore-Embrio', 1, ARRAY['Embriologia']),
('Lehninger Princípios de Bioquímica', 'NELSON, D. L.; COX, M. M.', '7. ed.', 'Artmed', 2019, 'Lehninger', 1, ARRAY['Bioquímica']),
('Goodman & Gilman Bases Farmacológicas', 'BRUNTON, L. L.', '13. ed.', 'McGraw-Hill', 2018, 'Goodman', 1, ARRAY['Farmacologia']),
('Semiologia Médica', 'PORTO, C. C.', '8. ed.', 'Guanabara Koogan', 2019, 'Porto', 1, ARRAY['Semiologia']),
('Nelson Tratado de Pediatria', 'KLIEGMAN, R. M. et al.', '21. ed.', 'Elsevier', 2020, 'Nelson', 1, ARRAY['Pediatria']),
('Williams Obstetrícia', 'CUNNINGHAM, F. G. et al.', '26. ed.', 'McGraw-Hill', 2022, 'Williams', 1, ARRAY['Obstetrícia', 'Ginecologia']);
```

### 9. ÍNDICES PARA BUSCA

```sql
-- Índice para palavras-chave
CREATE INDEX idx_questoes_palavras_chave ON questoes_med USING GIN(palavras_chave);
CREATE INDEX idx_questoes_periodo ON questoes_med(periodo_dificuldade);
CREATE INDEX idx_questoes_disciplina ON questoes_med(disciplina_id);
CREATE INDEX idx_questoes_assunto ON questoes_med(assunto_id);

-- Busca full-text no enunciado
ALTER TABLE questoes_med ADD COLUMN IF NOT EXISTS
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(enunciado, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(array_to_string(palavras_chave, ' '), '')), 'B')
  ) STORED;

CREATE INDEX idx_questoes_search ON questoes_med USING GIN(search_vector);

-- Função RPC para busca full-text
CREATE OR REPLACE FUNCTION buscar_questoes_fts(termo_busca TEXT)
RETURNS SETOF questoes_med AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM questoes_med
  WHERE search_vector @@ plainto_tsquery('portuguese', termo_busca)
    AND ativo = true
  ORDER BY ts_rank(search_vector, plainto_tsquery('portuguese', termo_busca)) DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## SISTEMA DE AUTENTICAÇÃO ADMIN

### Verificação de Acesso

```typescript
// lib/admin/auth.ts
const ADMIN_EMAILS = ['brunodivinoa@gmail.com']

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export async function verificarAdmin(userId: string, supabase: any): Promise<boolean> {
  const { data } = await supabase
    .from('profiles_med')
    .select('email')
    .eq('id', userId)
    .single()

  return isAdmin(data?.email)
}
```

### Componente de Proteção

```typescript
// components/admin/AdminGuard.tsx
'use client'

import { useEffect, useState } from 'react'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldX } from 'lucide-react'

const ADMIN_EMAIL = 'brunodivinoa@gmail.com'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useMedAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/medicina/login')
      return
    }

    if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setIsAdmin(true)
    } else {
      setIsAdmin(false)
    }
    setChecking(false)
  }, [user, loading, router])

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center gap-4">
        <ShieldX className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold text-white">Acesso Negado</h1>
        <p className="text-white/60">Você não tem permissão para acessar esta área.</p>
      </div>
    )
  }

  return <>{children}</>
}
```

---

## LISTA DE LIVROS-FONTE (Hierarquia de Prioridade)

```typescript
// lib/admin/livrosFonte.ts
export const LIVROS_FONTE = {
  // PRIORIDADE 1 - Livros Clássicos Mais Usados
  prioridade1: [
    {
      titulo: 'Guyton e Hall - Tratado de Fisiologia Médica',
      autor: 'John E. Hall',
      edicao: '14ª edição',
      ano: 2021,
      editora: 'Elsevier',
      areas: ['Fisiologia', 'Todas as áreas']
    },
    {
      titulo: 'Sobotta - Atlas de Anatomia Humana',
      autor: 'Friedrich Paulsen, Jens Waschke',
      edicao: '24ª edição',
      ano: 2018,
      editora: 'Guanabara Koogan',
      areas: ['Anatomia']
    },
    {
      titulo: 'Imunologia Celular e Molecular',
      autor: 'Abul K. Abbas, Andrew H. Lichtman',
      edicao: '10ª edição',
      ano: 2022,
      editora: 'Elsevier',
      areas: ['Imunologia']
    },
    {
      titulo: 'Robbins - Patologia Básica',
      autor: 'Vinay Kumar, Abul K. Abbas, Jon C. Aster',
      edicao: '10ª edição',
      ano: 2018,
      editora: 'Elsevier',
      areas: ['Patologia']
    },
    {
      titulo: 'Netter - Atlas de Anatomia Humana',
      autor: 'Frank H. Netter',
      edicao: '7ª edição',
      ano: 2019,
      editora: 'Elsevier',
      areas: ['Anatomia']
    },
    {
      titulo: 'Moore - Anatomia Orientada para a Clínica',
      autor: 'Keith L. Moore, Arthur F. Dalley',
      edicao: '8ª edição',
      ano: 2019,
      editora: 'Guanabara Koogan',
      areas: ['Anatomia']
    },
    {
      titulo: 'Rang & Dale - Farmacologia',
      autor: 'Humphrey P. Rang',
      edicao: '9ª edição',
      ano: 2020,
      editora: 'Elsevier',
      areas: ['Farmacologia']
    },
    {
      titulo: 'Microbiologia Médica de Jawetz',
      autor: 'Karen C. Carroll',
      edicao: '27ª edição',
      ano: 2017,
      editora: 'McGraw-Hill',
      areas: ['Microbiologia']
    },
    {
      titulo: 'Histologia Básica - Junqueira e Carneiro',
      autor: 'Luiz Carlos Junqueira, José Carneiro',
      edicao: '13ª edição',
      ano: 2017,
      editora: 'Guanabara Koogan',
      areas: ['Histologia']
    },
    {
      titulo: 'Embriologia Clínica - Moore',
      autor: 'Keith L. Moore, T.V.N. Persaud',
      edicao: '10ª edição',
      ano: 2016,
      editora: 'Elsevier',
      areas: ['Embriologia']
    },
    {
      titulo: 'Bioquímica Básica - Marzzoco',
      autor: 'Anita Marzzoco, Bayardo B. Torres',
      edicao: '4ª edição',
      ano: 2015,
      editora: 'Guanabara Koogan',
      areas: ['Bioquímica']
    },
    {
      titulo: 'Lehninger - Princípios de Bioquímica',
      autor: 'David L. Nelson, Michael M. Cox',
      edicao: '7ª edição',
      ano: 2019,
      editora: 'Artmed',
      areas: ['Bioquímica']
    },
    {
      titulo: 'Goodman & Gilman - As Bases Farmacológicas da Terapêutica',
      autor: 'Laurence L. Brunton',
      edicao: '13ª edição',
      ano: 2018,
      editora: 'McGraw-Hill',
      areas: ['Farmacologia']
    },
    {
      titulo: 'Harrison - Medicina Interna',
      autor: 'J. Larry Jameson et al.',
      edicao: '20ª edição',
      ano: 2020,
      editora: 'McGraw-Hill',
      areas: ['Clínica Médica', 'Todas']
    },
    {
      titulo: 'Semiologia Médica - Porto',
      autor: 'Celmo Celeno Porto',
      edicao: '8ª edição',
      ano: 2019,
      editora: 'Guanabara Koogan',
      areas: ['Semiologia']
    }
  ],

  // PRIORIDADE 2 - Livros Complementares
  prioridade2: [
    {
      titulo: 'Gray - Anatomia para Estudantes',
      autor: 'Richard L. Drake',
      edicao: '4ª edição',
      ano: 2021,
      editora: 'Elsevier',
      areas: ['Anatomia']
    },
    {
      titulo: 'Bogliolo - Patologia',
      autor: 'Geraldo Brasileiro Filho',
      edicao: '10ª edição',
      ano: 2021,
      editora: 'Guanabara Koogan',
      areas: ['Patologia']
    },
    {
      titulo: 'Fisiologia - Berne & Levy',
      autor: 'Bruce M. Koeppen, Bruce A. Stanton',
      edicao: '7ª edição',
      ano: 2018,
      editora: 'Elsevier',
      areas: ['Fisiologia']
    },
    {
      titulo: 'Microbiologia - Tortora',
      autor: 'Gerard J. Tortora',
      edicao: '12ª edição',
      ano: 2017,
      editora: 'Artmed',
      areas: ['Microbiologia']
    },
    {
      titulo: 'Parasitologia Humana - Neves',
      autor: 'David Pereira Neves',
      edicao: '13ª edição',
      ano: 2016,
      editora: 'Atheneu',
      areas: ['Parasitologia']
    },
    {
      titulo: 'Nelson Tratado de Pediatria',
      autor: 'Robert M. Kliegman et al.',
      edicao: '21ª edição',
      ano: 2020,
      editora: 'Elsevier',
      areas: ['Pediatria']
    },
    {
      titulo: 'Williams Obstetrícia',
      autor: 'F. Gary Cunningham et al.',
      edicao: '26ª edição',
      ano: 2022,
      editora: 'McGraw-Hill',
      areas: ['Obstetrícia', 'Ginecologia']
    },
    {
      titulo: 'Sabiston Tratado de Cirurgia',
      autor: 'Courtney M. Townsend Jr.',
      edicao: '21ª edição',
      ano: 2022,
      editora: 'Elsevier',
      areas: ['Cirurgia']
    },
    {
      titulo: 'Kaplan & Sadock Compêndio de Psiquiatria',
      autor: 'Benjamin J. Sadock',
      edicao: '11ª edição',
      ano: 2017,
      editora: 'Artmed',
      areas: ['Psiquiatria']
    },
    {
      titulo: 'Machado - Neuroanatomia Funcional',
      autor: 'Angelo B. M. Machado',
      edicao: '3ª edição',
      ano: 2014,
      editora: 'Atheneu',
      areas: ['Neuroanatomia', 'Neurologia']
    }
  ],

  // PRIORIDADE 3 - Artigos Científicos (usar apenas se necessário)
  fontesOnline: [
    'PubMed',
    'SciELO',
    'UpToDate',
    'Diretrizes SBC (Sociedade Brasileira de Cardiologia)',
    'Diretrizes SBD (Sociedade Brasileira de Diabetes)',
    'Diretrizes SBEM (Sociedade Brasileira de Endocrinologia)'
  ]
}

// Mapeamento disciplina -> livros recomendados
export const LIVROS_POR_DISCIPLINA: Record<string, string[]> = {
  'Anatomia': ['Sobotta', 'Netter', 'Moore - Anatomia', 'Gray'],
  'Fisiologia': ['Guyton e Hall', 'Berne & Levy'],
  'Histologia': ['Junqueira e Carneiro'],
  'Embriologia': ['Moore - Embriologia'],
  'Bioquímica': ['Lehninger', 'Marzzoco'],
  'Imunologia': ['Abbas'],
  'Microbiologia': ['Jawetz', 'Tortora'],
  'Parasitologia': ['Neves'],
  'Patologia': ['Robbins', 'Bogliolo'],
  'Farmacologia': ['Rang & Dale', 'Goodman & Gilman'],
  'Semiologia': ['Porto'],
  'Clínica Médica': ['Harrison'],
  'Cirurgia': ['Sabiston'],
  'Pediatria': ['Nelson'],
  'Obstetrícia': ['Williams'],
  'Ginecologia': ['Williams'],
  'Psiquiatria': ['Kaplan & Sadock'],
  'Neurologia': ['Machado']
}
```

---

## NÍVEIS DE DIFICULDADE POR PERÍODO

```typescript
// lib/admin/periodos.ts
export const PERIODOS_DIFICULDADE = {
  1: {
    nome: '1º Período',
    nivel: 'Muito Básico',
    descricao: 'Conceitos fundamentais, definições básicas',
    disciplinas_tipicas: ['Anatomia Básica', 'Bioquímica', 'Histologia'],
    complexidade: 1
  },
  2: {
    nome: '2º Período',
    nivel: 'Básico',
    descricao: 'Integração inicial de conceitos',
    disciplinas_tipicas: ['Anatomia Sistêmica', 'Fisiologia Básica', 'Embriologia'],
    complexidade: 2
  },
  3: {
    nome: '3º Período',
    nivel: 'Básico-Intermediário',
    descricao: 'Correlações clínicas iniciais',
    disciplinas_tipicas: ['Fisiologia Avançada', 'Imunologia', 'Microbiologia'],
    complexidade: 3
  },
  4: {
    nome: '4º Período',
    nivel: 'Intermediário',
    descricao: 'Patologias básicas e farmacologia inicial',
    disciplinas_tipicas: ['Patologia Geral', 'Farmacologia Básica', 'Parasitologia'],
    complexidade: 4
  },
  5: {
    nome: '5º Período',
    nivel: 'Intermediário',
    descricao: 'Semiologia e início da clínica',
    disciplinas_tipicas: ['Semiologia', 'Patologia Especial', 'Farmacologia Clínica'],
    complexidade: 5
  },
  6: {
    nome: '6º Período',
    nivel: 'Intermediário-Avançado',
    descricao: 'Clínicas básicas',
    disciplinas_tipicas: ['Clínica Médica I', 'Cirurgia I', 'Pediatria I'],
    complexidade: 6
  },
  7: {
    nome: '7º Período',
    nivel: 'Avançado',
    descricao: 'Clínicas especializadas',
    disciplinas_tipicas: ['Clínica Médica II', 'Ginecologia', 'Psiquiatria'],
    complexidade: 7
  },
  8: {
    nome: '8º Período',
    nivel: 'Avançado',
    descricao: 'Emergências e procedimentos',
    disciplinas_tipicas: ['Emergências', 'Cirurgia II', 'Ortopedia'],
    complexidade: 8
  },
  9: {
    nome: '9º Período (Internato)',
    nivel: 'Muito Avançado',
    descricao: 'Casos clínicos complexos',
    disciplinas_tipicas: ['Internato Clínica Médica', 'Internato Cirurgia'],
    complexidade: 9
  },
  10: {
    nome: '10º Período (Internato)',
    nivel: 'Muito Avançado',
    descricao: 'Raciocínio clínico integrado',
    disciplinas_tipicas: ['Internato Pediatria', 'Internato GO'],
    complexidade: 9
  },
  11: {
    nome: '11º Período (Internato)',
    nivel: 'Residência',
    descricao: 'Nível prova de residência',
    disciplinas_tipicas: ['Todas as áreas'],
    complexidade: 10
  },
  12: {
    nome: '12º Período (Internato)',
    nivel: 'Residência',
    descricao: 'Questões complexas integradas',
    disciplinas_tipicas: ['Todas as áreas'],
    complexidade: 10
  }
}

// Mapeamento para exibição no filtro
export const PERIODOS_OPCOES = Object.entries(PERIODOS_DIFICULDADE).map(([key, value]) => ({
  value: parseInt(key),
  label: `${value.nome} - ${value.nivel}`,
  descricao: value.descricao
}))
```

---

## PROMPTS DE GERAÇÃO DE QUESTÕES

```typescript
// lib/admin/questaoPrompts.ts
import { LIVROS_FONTE, LIVROS_POR_DISCIPLINA } from './livrosFonte'
import { PERIODOS_DIFICULDADE } from './periodos'

interface GerarQuestaoParams {
  disciplina: string
  assunto: string
  subAssunto?: string
  periodo: number
  tipoQuestao: 'multipla_escolha' | 'verdadeiro_falso' | 'caso_clinico'
}

export function buildPromptQuestao(params: GerarQuestaoParams): string {
  const { disciplina, assunto, subAssunto, periodo, tipoQuestao } = params
  const periodoInfo = PERIODOS_DIFICULDADE[periodo as keyof typeof PERIODOS_DIFICULDADE]
  const livrosRecomendados = LIVROS_POR_DISCIPLINA[disciplina] || ['Harrison', 'Guyton e Hall']

  const promptBase = `
Você é um professor de medicina especialista em ${disciplina}, com vasta experiência em elaboração de questões para provas de faculdade e concursos de residência médica no Brasil.

## TAREFA
Crie UMA questão de ${tipoQuestao === 'multipla_escolha' ? 'múltipla escolha' : tipoQuestao === 'verdadeiro_falso' ? 'verdadeiro ou falso' : 'caso clínico'} sobre:

- **Disciplina:** ${disciplina}
- **Assunto:** ${assunto}
${subAssunto ? `- **Sub-assunto:** ${subAssunto}` : ''}
- **Nível:** ${periodoInfo.nome} (${periodoInfo.nivel})
- **Complexidade esperada:** ${periodoInfo.descricao}

## REGRAS OBRIGATÓRIAS

### 1. ESPECIFICIDADE HUMANA
⚠️ IMPORTANTE: Todas as informações devem ser EXCLUSIVAMENTE sobre:
- Anatomia HUMANA (não animal)
- Fisiologia HUMANA
- Patologia HUMANA
- Desenvolvimento embrionário HUMANO
- Nunca usar dados de estudos em animais como resposta correta para questões sobre humanos

### 2. ESTRUTURA DA QUESTÃO
${tipoQuestao === 'multipla_escolha' ? `
- Enunciado claro e objetivo
- 5 alternativas (A, B, C, D, E)
- Apenas UMA alternativa correta
- Distratores plausíveis mas claramente incorretos
- Evitar "todas as alternativas" ou "nenhuma das alternativas"
` : tipoQuestao === 'verdadeiro_falso' ? `
- Afirmação clara e objetiva
- Resposta: Verdadeiro ou Falso
- Sem ambiguidade
` : `
- Caso clínico realista e detalhado
- Dados relevantes do paciente (idade, sexo, queixa, história, exame físico, exames)
- 5 alternativas sobre diagnóstico, conduta ou tratamento
- Apenas UMA alternativa correta
`}

### 3. FONTES E REFERÊNCIAS
Prioridade de fontes (USAR NESTA ORDEM):
${livrosRecomendados.map((l, i) => `${i + 1}. ${l}`).join('\n')}

⚠️ Artigos científicos APENAS se não houver informação nos livros-texto.

### 4. FORMATO DE RESPOSTA (JSON)
\`\`\`json
{
  "enunciado": "Texto completo do enunciado",
  "tipo": "${tipoQuestao}",
  "alternativas": ${tipoQuestao !== 'verdadeiro_falso' ? `[
    {"letra": "A", "texto": "...", "correta": false},
    {"letra": "B", "texto": "...", "correta": true},
    {"letra": "C", "texto": "...", "correta": false},
    {"letra": "D", "texto": "...", "correta": false},
    {"letra": "E", "texto": "...", "correta": false}
  ]` : `[
    {"letra": "V", "texto": "Verdadeiro", "correta": true/false},
    {"letra": "F", "texto": "Falso", "correta": true/false}
  ]`},
  "resposta_correta": "B",
  "gabarito_comentado": "Explicação DETALHADA e DIDÁTICA de por que a alternativa B está correta e por que as outras estão incorretas. Deve incluir: conceitos fundamentais, fisiopatologia quando aplicável, correlações clínicas, dicas para memorização. Mínimo 300 palavras.",
  "referencia_abnt": "Referência completa no formato ABNT. Exemplo: HALL, John E. Guyton e Hall: Tratado de Fisiologia Médica. 14. ed. Rio de Janeiro: Elsevier, 2021. Cap. X, p. XX-XX.",
  "fontes_consultadas": [
    {
      "tipo": "livro",
      "titulo": "Guyton e Hall - Tratado de Fisiologia Médica",
      "autor": "John E. Hall",
      "edicao": "14ª edição",
      "ano": 2021,
      "capitulo": "X",
      "paginas": "XX-XX"
    }
  ],
  "palavras_chave": ["palavra1", "palavra2", "palavra3"],
  "dica_estudo": "Uma dica curta para o aluno memorizar o conceito"
}
\`\`\`

## GABARITO COMENTADO - REQUISITOS

O gabarito DEVE conter:
1. **Por que a correta está certa** - Explicação completa com base científica
2. **Por que cada errada está errada** - Análise de cada distrator
3. **Conceito-chave** - O que o aluno precisa saber
4. **Correlação clínica** - Quando aplicável, como isso aparece na prática
5. **Dica de memorização** - Mnemônico ou associação útil
6. **Referência ABNT** - Citação completa da fonte

## EXEMPLO DE GABARITO BEM ELABORADO

"A alternativa B está correta porque [explicação detalhada do conceito com base no livro-fonte].

A alternativa A está incorreta porque [explicação].
A alternativa C está incorreta porque [explicação].
A alternativa D está incorreta porque [explicação].
A alternativa E está incorreta porque [explicação].

**Conceito-chave:** [resumo do que precisa saber]

**Correlação clínica:** [aplicação prática]

**Dica de memorização:** [mnemônico ou associação]

**Referência:** HALL, John E. Guyton e Hall: Tratado de Fisiologia Médica. 14. ed. Rio de Janeiro: Elsevier, 2021. Cap. X, p. XX-XX."

---

Agora, gere a questão seguindo TODAS as regras acima. Responda APENAS com o JSON, sem texto adicional.
`

  return promptBase.trim()
}

// Prompt para pesquisar novos assuntos
export function buildPromptPesquisarAssuntos(disciplina: string, assuntosExistentes: string[]): string {
  return `
Você é um especialista em currículo de medicina no Brasil.

DISCIPLINA: ${disciplina}
ASSUNTOS JÁ CADASTRADOS: ${assuntosExistentes.join(', ') || 'Nenhum'}

Sua tarefa:
1. Liste TODOS os assuntos que deveriam existir nesta disciplina
2. Para cada assunto, liste os subassuntos principais
3. Identifique o que está FALTANDO comparado ao que já temos

Baseie-se nos livros-texto mais usados e nas Diretrizes Curriculares Nacionais do MEC para o curso de Medicina.

Responda em JSON:
\`\`\`json
{
  "disciplina": "${disciplina}",
  "assuntos": [
    {
      "nome": "Nome do Assunto",
      "descricao": "Breve descrição",
      "sub_assuntos": [
        {
          "nome": "Nome do Sub-assunto",
          "descricao": "Breve descrição"
        }
      ],
      "periodos_relacionados": [1, 2, 3]
    }
  ],
  "assuntos_faltantes": ["Lista de assuntos que faltam no banco"]
}
\`\`\`

Liste de forma COMPLETA e DETALHADA. Não omita nenhum assunto importante.
`
}
```

---

## API DE GERAÇÃO DE QUESTÕES

```typescript
// app/api/medicina/admin/questoes/gerar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { verificarAdmin } from '@/lib/admin/auth'
import { buildPromptQuestao } from '@/lib/admin/questaoPrompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limit control
const DELAY_ENTRE_QUESTOES = 3000 // 3 segundos entre questões
let ultimaGeracao = 0

async function aguardarRateLimit() {
  const agora = Date.now()
  const tempoDesdeUltima = agora - ultimaGeracao
  if (tempoDesdeUltima < DELAY_ENTRE_QUESTOES) {
    await new Promise(resolve =>
      setTimeout(resolve, DELAY_ENTRE_QUESTOES - tempoDesdeUltima)
    )
  }
  ultimaGeracao = Date.now()
}

export async function POST(req: NextRequest) {
  try {
    const {
      user_id,
      disciplina_id,
      disciplina_nome,
      assuntos, // Array de { id, nome, sub_assuntos: [{ id, nome }] }
      periodos, // Array de números [1, 2, 3]
      quantidade_por_assunto,
      tipo_questao
    } = await req.json()

    // Verificar se é admin
    const isAdmin = await verificarAdmin(user_id, supabase)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Criar stream para logs em tempo real
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendLog = (type: string, data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
          )
        }

        let totalGeradas = 0
        let totalErros = 0

        sendLog('inicio', {
          message: 'Iniciando geração de questões',
          total_estimado: assuntos.length * periodos.length * quantidade_por_assunto
        })

        // Iterar por cada combinação
        for (const assunto of assuntos) {
          for (const periodo of periodos) {
            for (let i = 0; i < quantidade_por_assunto; i++) {
              // Aguardar rate limit
              await aguardarRateLimit()

              const subAssunto = assunto.sub_assuntos?.[i % assunto.sub_assuntos.length]

              sendLog('gerando', {
                disciplina: disciplina_nome,
                assunto: assunto.nome,
                sub_assunto: subAssunto?.nome || null,
                periodo,
                numero: totalGeradas + 1
              })

              try {
                const inicioGeracao = Date.now()

                // Gerar questão com Claude
                const prompt = buildPromptQuestao({
                  disciplina: disciplina_nome,
                  assunto: assunto.nome,
                  subAssunto: subAssunto?.nome,
                  periodo,
                  tipoQuestao: tipo_questao
                })

                const response = await anthropic.messages.create({
                  model: 'claude-sonnet-4-20250514', // Usando Sonnet para geração em lote
                  max_tokens: 4000,
                  messages: [{ role: 'user', content: prompt }]
                })

                const content = response.content[0]
                if (content.type !== 'text') throw new Error('Resposta inválida')

                // Extrair JSON da resposta
                const jsonMatch = content.text.match(/```json\n?([\s\S]*?)\n?```/)
                if (!jsonMatch) throw new Error('JSON não encontrado na resposta')

                const questaoData = JSON.parse(jsonMatch[1])
                const tempoGeracao = Date.now() - inicioGeracao

                // Salvar questão no banco
                const { data: questaoSalva, error: errQuestao } = await supabase
                  .from('questoes_med')
                  .insert({
                    disciplina_id,
                    assunto_id: assunto.id,
                    sub_assunto_id: subAssunto?.id || null,
                    enunciado: questaoData.enunciado,
                    tipo: questaoData.tipo,
                    alternativas: questaoData.alternativas,
                    resposta_correta: questaoData.resposta_correta,
                    periodo_dificuldade: periodo,
                    fonte_principal: questaoData.fontes_consultadas?.[0]?.titulo || null,
                    referencia_abnt: questaoData.referencia_abnt,
                    palavras_chave: questaoData.palavras_chave,
                    gerado_por_ia: true,
                    modelo_ia: 'claude-sonnet-4-20250514',
                    revisado: false,
                    created_by: user_id
                  })
                  .select()
                  .single()

                if (errQuestao) throw errQuestao

                // Salvar gabarito
                await supabase
                  .from('gabaritos_med')
                  .insert({
                    questao_id: questaoSalva.id,
                    explicacao: questaoData.gabarito_comentado,
                    referencia_abnt: questaoData.referencia_abnt,
                    fontes_consultadas: questaoData.fontes_consultadas,
                    dica_estudo: questaoData.dica_estudo,
                    revisado: false
                  })

                // Log de sucesso
                await supabase
                  .from('admin_geracao_logs')
                  .insert({
                    questao_id: questaoSalva.id,
                    disciplina_id,
                    assunto_id: assunto.id,
                    periodo,
                    status: 'sucesso',
                    tokens_usados: response.usage.input_tokens + response.usage.output_tokens,
                    tempo_geracao_ms: tempoGeracao
                  })

                totalGeradas++

                sendLog('sucesso', {
                  questao_id: questaoSalva.id,
                  enunciado_preview: questaoData.enunciado.substring(0, 100) + '...',
                  tempo_ms: tempoGeracao,
                  tokens: response.usage.input_tokens + response.usage.output_tokens,
                  total_geradas: totalGeradas
                })

              } catch (error) {
                totalErros++
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

                // Log de erro
                await supabase
                  .from('admin_geracao_logs')
                  .insert({
                    disciplina_id,
                    assunto_id: assunto.id,
                    periodo,
                    status: 'erro',
                    erro_mensagem: errorMessage
                  })

                sendLog('erro', {
                  assunto: assunto.nome,
                  periodo,
                  erro: errorMessage,
                  total_erros: totalErros
                })

                // Se muitos erros seguidos, pausar mais
                if (totalErros > 5) {
                  sendLog('aviso', { message: 'Muitos erros, aguardando 10 segundos...' })
                  await new Promise(resolve => setTimeout(resolve, 10000))
                }
              }
            }
          }
        }

        sendLog('concluido', {
          total_geradas: totalGeradas,
          total_erros: totalErros,
          message: `Geração concluída! ${totalGeradas} questões criadas, ${totalErros} erros.`
        })

        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Erro na geração:', error)
    return NextResponse.json(
      { error: 'Erro ao iniciar geração' },
      { status: 500 }
    )
  }
}
```

---

## API DE BUSCA SEMÂNTICA

```typescript
// app/api/medicina/admin/questoes/busca/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Parâmetros de filtro
  const termo = searchParams.get('termo') // Busca por palavra-chave
  const disciplina_id = searchParams.get('disciplina')
  const assunto_id = searchParams.get('assunto')
  const periodo_min = searchParams.get('periodo_min')
  const periodo_max = searchParams.get('periodo_max')
  const tipo = searchParams.get('tipo')
  const apenas_revisadas = searchParams.get('revisadas') === 'true'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    let query = supabase
      .from('questoes_med')
      .select(`
        *,
        disciplina:disciplinas_med(id, nome),
        assunto:assuntos_med(id, nome),
        sub_assunto:sub_assuntos_med(id, nome),
        gabarito:gabaritos_med(*)
      `, { count: 'exact' })

    // Filtro por termo (busca full-text)
    if (termo) {
      query = query.textSearch('search_vector', termo, {
        type: 'websearch',
        config: 'portuguese'
      })
    }

    // Filtros combinados
    if (disciplina_id) {
      query = query.eq('disciplina_id', disciplina_id)
    }

    if (assunto_id) {
      query = query.eq('assunto_id', assunto_id)
    }

    if (periodo_min) {
      query = query.gte('periodo_dificuldade', parseInt(periodo_min))
    }

    if (periodo_max) {
      query = query.lte('periodo_dificuldade', parseInt(periodo_max))
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    if (apenas_revisadas) {
      query = query.eq('revisado', true)
    }

    // Paginação
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      questoes: data,
      total: count,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Erro na busca:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar questões' },
      { status: 500 }
    )
  }
}
```

---

## RATE LIMIT HANDLER

```typescript
// lib/admin/rateLimit.ts
class AnthropicRateLimiter {
  private lastRequest: number = 0
  private minInterval: number = 2000 // 2 segundos entre requests
  private retryAfter: number = 0

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequest

    // Se ainda está no período de retry-after
    if (this.retryAfter > now) {
      const waitTime = this.retryAfter - now
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    // Garantir intervalo mínimo entre requests
    if (elapsed < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed))
    }

    this.lastRequest = Date.now()
  }

  setRetryAfter(seconds: number): void {
    this.retryAfter = Date.now() + (seconds * 1000)
  }
}

export const rateLimiter = new AnthropicRateLimiter()
```

---

## FLUXO COMPLETO DE GERAÇÃO

```
1. Admin seleciona DISCIPLINA
   ↓
2. Sistema carrega ASSUNTOS da disciplina (cascata)
   ↓
3. Sistema carrega SUBASSUNTOS dos assuntos
   ↓
4. Admin seleciona PERÍODOS (pode múltiplos)
   ↓
5. Admin configura QUANTIDADE por período
   ↓
6. Admin clica "INICIAR GERAÇÃO"
   ↓
7. Sistema cria LOTE no banco
   ↓
8. Para cada PERÍODO selecionado:
   Para cada ASSUNTO da disciplina:
     Para cada SUBASSUNTO do assunto:
       ↓
       8a. Aguarda rate limit (3s entre questões)
       8b. Chama API Anthropic (Claude)
       8c. Valida resposta JSON
       8d. Salva questão no banco
       8e. Atualiza log em tempo real
       ↓
9. Marca LOTE como concluído
```

### Tratamento de Erros

```typescript
// Se rate limit (429):
// - Pausa geração
// - Mostra mensagem "Aguardando rate limit..."
// - Espera retry-after header + buffer
// - Retoma automaticamente

// Se erro de parsing:
// - Tenta regenerar a questão (max 3 tentativas)
// - Log do erro
// - Continua com próxima questão

// Se erro de rede:
// - Salva estado do lote
// - Permite retomar depois
```

---

## RESUMO DO PLANO

### Arquivos a Criar (Total: ~20 arquivos)

| Arquivo | Função |
|---------|--------|
| app/medicina/admin/layout.tsx | Layout com proteção de acesso |
| app/medicina/admin/page.tsx | Dashboard admin |
| app/medicina/admin/disciplinas/page.tsx | Gestão de disciplinas |
| app/medicina/admin/questoes/page.tsx | Gestão de questões |
| app/medicina/admin/questoes/gerar/page.tsx | Interface do gerador |
| app/medicina/admin/historico/page.tsx | Histórico de geração |
| app/api/medicina/admin/questoes/gerar/route.ts | API de geração |
| app/api/medicina/admin/questoes/busca/route.ts | API de busca |
| app/api/medicina/admin/disciplinas/route.ts | CRUD disciplinas |
| app/api/medicina/admin/disciplinas/pesquisar/route.ts | Pesquisar com IA |
| components/admin/AdminGuard.tsx | Proteção de rota |
| components/admin/AdminSidebar.tsx | Sidebar admin |
| components/admin/QuestaoGenerator.tsx | UI do gerador |
| components/admin/GenerationLogs.tsx | Logs tempo real |
| components/admin/DisciplinaTree.tsx | Árvore de assuntos |
| lib/admin/questaoPrompts.ts | Prompts de geração |
| lib/admin/livrosFonte.ts | Lista de livros |
| lib/admin/periodos.ts | Níveis de dificuldade |
| lib/admin/auth.ts | Verificação admin |
| lib/admin/rateLimit.ts | Controle rate limit |

### Tabelas no Banco

| Tabela | Ação |
|--------|------|
| questoes_med | Adicionar colunas (periodo, fonte, palavras_chave, etc.) |
| gabaritos_med | Adicionar colunas (referencia_abnt, fontes, dica_estudo) |
| disciplinas_med | Adicionar colunas (ordem, ativo, created_by) |
| assuntos_med | Adicionar colunas (ordem, ativo) |
| sub_assuntos_med | Criar nova tabela |
| admin_geracao_logs | Criar nova tabela |
| lotes_geracao_med | Criar nova tabela |
| livros_referencia_med | Criar nova tabela |

### Funcionalidades

- ✅ Acesso restrito (brunodivinoa@gmail.com)
- ✅ Pesquisar/adicionar disciplinas e assuntos com IA
- ✅ Geração em lote com Claude
- ✅ 1 questão por vez (rate limit de 3s)
- ✅ Logs em tempo real via SSE
- ✅ Nível por período (1º ao 12º)
- ✅ Busca por palavra-chave (full-text search)
- ✅ Filtros combinados
- ✅ Gabarito com referência ABNT
- ✅ Fontes priorizadas (livros > artigos)
- ✅ Especificação "apenas humano"
- ✅ Exclusão de questões na interface
- ✅ Preview de questões geradas
- ✅ Histórico de geração

---

## CHECKLIST DE IMPLEMENTAÇÃO

### Banco de Dados
- [ ] Alterar tabela `questoes_med` (novas colunas)
- [ ] Alterar tabela `gabaritos_med` (novas colunas)
- [ ] Alterar tabela `disciplinas_med` (novas colunas)
- [ ] Alterar tabela `assuntos_med` (novas colunas)
- [ ] Criar tabela `sub_assuntos_med`
- [ ] Criar tabela `admin_geracao_logs`
- [ ] Criar tabela `lotes_geracao_med`
- [ ] Criar tabela `livros_referencia_med`
- [ ] Criar função RPC para full-text search
- [ ] Criar índices para performance

### Backend (APIs)
- [ ] Criar `/api/medicina/admin/questoes/gerar`
- [ ] Criar `/api/medicina/admin/questoes/busca`
- [ ] Criar `/api/medicina/admin/disciplinas` (CRUD)
- [ ] Criar `/api/medicina/admin/disciplinas/pesquisar`
- [ ] Criar verificação de admin
- [ ] Implementar rate limit handler

### Frontend Admin
- [ ] Criar layout admin com verificação de acesso
- [ ] Criar página de disciplinas/assuntos
- [ ] Criar página de geração de questões
- [ ] Criar página de histórico
- [ ] Implementar monitor em tempo real (SSE)
- [ ] Interface de seleção cascata (disciplina → assunto → subassunto)

### Frontend Questões (Usuário)
- [ ] Adicionar filtro por período
- [ ] Adicionar busca por palavra-chave
- [ ] Melhorar combinação de filtros
- [ ] Mostrar período/dificuldade na questão

### Qualidade
- [ ] Prompt com validação de fontes humanas
- [ ] Referências ABNT obrigatórias
- [ ] Prioridade para livros-texto
- [ ] Coerência período x dificuldade

---

## ORDEM DE EXECUÇÃO RECOMENDADA

1. **Fase 1**: Executar alterações no banco de dados (SQL)
2. **Fase 2**: Criar layout admin e verificação de acesso
3. **Fase 3**: Criar API de geração de questão com streaming
4. **Fase 4**: Criar interface de geração com logs em tempo real
5. **Fase 5**: Criar gestão de disciplinas/assuntos
6. **Fase 6**: Implementar pesquisador de assuntos com IA
7. **Fase 7**: Adicionar filtros na página de questões (usuário)
8. **Fase 8**: Testes - Gerar lote de teste, validar qualidade

---

**Documento criado em:** 19/01/2026
**Última atualização:** 19/01/2026
**Autor:** Claude Opus 4.5
**Status:** PLANO COMPLETO - Aguardando aprovação para execução
