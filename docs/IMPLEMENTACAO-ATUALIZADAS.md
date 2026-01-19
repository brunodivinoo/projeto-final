# 🏥 PLANO DE CORREÇÕES E MELHORIAS - PREPARAMED

**Data:** 19 de Janeiro de 2026  
**Versão:** 1.0  
**Autor:** GitHub Copilot  
**Projeto:** PreparaMed - Plataforma de Estudos para Medicina

---

## 📋 ÍNDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Status das 10 Tarefas Originais](#2-status-das-10-tarefas-originais)
3. [Problemas Críticos Identificados](#3-problemas-críticos-identificados)
4. [Correção: Blur no Gabarito](#4-correção-blur-no-gabarito)
5. [Correção: Chat com Abas por Modo](#5-correção-chat-com-abas-por-modo)
6. [Correção: Erro de Áudio/Transcrição](#6-correção-erro-de-áudiotranscrição)
7. [Correção: Hook useChatIA + API](#7-correção-hook-usechatia--api)
8. [Correção: Modelo de IA por Plano](#8-correção-modelo-de-ia-por-plano)
9. [Melhorias de Performance e UX](#9-melhorias-de-performance-e-ux)
10. [Checklist de Implementação](#10-checklist-de-implementação)

---

## 1. RESUMO EXECUTIVO

### 📊 Visão Geral

O sistema PREPARAMED está **80% completo** em relação às 10 tarefas originais. A arquitetura é sólida, mas há correções críticas necessárias antes do lançamento.

### ✅ Pontos Fortes

| Item | Status | Observação |
|------|--------|------------|
| Sistema de Trial 4h | ✅ Completo | `trial_started_at` + `trial_used` no banco |
| Limites por plano | ✅ Completo | MedAuthContext com `limitesPlano` |
| Streaming de IA | ✅ Completo | ReadableStream bem implementado |
| Banco de dados | ✅ Completo | 36 tabelas `_med` estruturadas |
| Badges/Gamificação | ✅ Completo | 10 badges cadastrados |
| Componentes de IA | ✅ Completo | Voice, ExamAnalyzer, ChatModes |

### ❌ Pontos Críticos para Corrigir

| Prioridade | Problema | Impacto |
|------------|----------|---------|
| 🔴 P0 | Erro de áudio - API ausente | Funcionalidade quebrada |
| 🔴 P0 | Gabarito blur não implementado | Modelo de negócio afetado |
| 🟠 P1 | Chat sem abas por modo | UX comprometida |
| 🟠 P1 | Hook useChatIA com API errada | Não funciona para medicina |
| 🟡 P2 | Modelo de IA fixo (sempre Opus) | Custo elevado desnecessário |
| 🟡 P2 | streamGemini nunca chamado | Código morto |

### 📈 Impacto Estimado Pós-Correções

| Área | Antes | Depois |
|------|-------|--------|
| Funcionalidade | 80% | 100% |
| Performance | 70% | 90% |
| UX | 70% | 95% |
| Custo de IA | Alto | Otimizado |

---

## 2. STATUS DAS 10 TAREFAS ORIGINAIS

### Tabela de Status

| # | Tarefa | Status | Detalhes |
|---|--------|--------|----------|
| 1 | Trial 4h + contador | ✅ FEITO | Campos `trial_started_at`, `trial_used` no `profiles_med` |
| 2 | Limites MedAuthContext | ✅ FEITO | `limitesPlano`, `limites`, `trialStatus` integrados |
| 3 | Flashcards integrado | ✅ FEITO | Hooks e APIs funcionando |
| 4 | Modos do Chat | ⚠️ PARCIAL | Funciona, mas sem abas separadas por modo |
| 5 | Voz (Whisper + TTS) | ❌ QUEBRADO | Erro "Configuração de API ausente" |
| 6 | Análise de Exames | ✅ FEITO | ExamAnalyzer modal funcionando |
| 7 | Gabarito blur FREE | ❌ NÃO FEITO | Não implementado |
| 8 | Badges ranking | ✅ FEITO | 10 badges no banco, hooks existem |
| 9 | Pop-ups estratégicos | ✅ FEITO | UpgradeModal existe |
| 10 | Tabelas no banco | ✅ FEITO | 36 tabelas `_med` verificadas |

### Detalhamento por Tarefa

#### Tarefa 1: Trial 4h ✅
```
Banco de dados:
- profiles_med.trial_started_at (timestamp)
- profiles_med.trial_used (boolean)

Código:
- MedAuthContext calcula tempo restante
- TrialCountdown exibe contador regressivo
```

#### Tarefa 4: Modos do Chat ⚠️
```
Implementado:
- 4 modos: tutor, questoes, resumo, casos
- Troca de modo funciona
- Artefatos marcados com modo

Faltando:
- Histórico separado por modo (abas)
- Cada modo deveria ter suas próprias conversas
```

#### Tarefa 5: Voz ❌
```
Erro: "Configuração de API ausente"
Causa: OPENAI_API_KEY não está na Vercel
Solução: Configurar variável de ambiente
```

#### Tarefa 7: Blur Gabarito ❌
```
Status: Não implementado
Impacto: Usuário FREE vê gabarito sem pagar
Solução: Adicionar blur + botão de upgrade
```

---

## 3. PROBLEMAS CRÍTICOS IDENTIFICADOS

### 🔴 PROBLEMA 1: Erro de Áudio/Transcrição

**Sintoma:**
```
POST /api/medicina/ia/speech/transcribe 500 (Internal Server Error)
{"error":"Configuração de API ausente"}
```

**Causa Raiz:**
A variável `OPENAI_API_KEY` não está configurada na Vercel, ou o código está verificando incorretamente.

**Arquivo Afetado:**
```
app/api/medicina/ia/speech/transcribe/route.ts
```

**Impacto:** 
- Usuários não conseguem usar entrada por voz
- Funcionalidade completamente quebrada em produção

---

### 🔴 PROBLEMA 2: Gabarito sem Blur para FREE

**Sintoma:**
Usuário com plano gratuito (sem trial ativo) consegue ver gabarito e explicação das questões.

**Arquivo Afetado:**
```
app/medicina/(dashboard)/dashboard/questoes/page.tsx
```

**Impacto:**
- Modelo de negócio comprometido
- Sem incentivo para upgrade

---

### 🟠 PROBLEMA 3: Chat sem Abas por Modo

**Sintoma:**
Quando o usuário troca de modo (tutor → questões → resumo), as mensagens ficam todas na mesma timeline.

**Comportamento Atual:**
```
Conversa 1:
  - [TUTOR] Usuário: Explique diabetes
  - [TUTOR] IA: Diabetes é...
  - [QUESTÕES] Usuário: Gere questões sobre diabetes
  - [QUESTÕES] IA: Questão 1...
  - [RESUMO] Usuário: Resuma diabetes
  - [RESUMO] IA: Resumo...
```

**Comportamento Desejado:**
```
[ABA TUTOR]     → Conversa de explicações
[ABA QUESTÕES]  → Conversa de questões geradas
[ABA RESUMO]    → Conversa de resumos
[ABA CASOS]     → Conversa de casos clínicos
```

---

### 🟠 PROBLEMA 4: Hook useChatIA com API Errada

**Sintoma:**
O hook `hooks/useChatIA.ts` faz requisições para `/api/ia/chat` (sistema de concursos) ao invés de `/api/medicina/ia/chat`.

**Código Atual:**
```typescript
// hooks/useChatIA.ts - ERRADO
const res = await fetch(`/api/ia/chat?user_id=${user.id}`)
```

**Código Correto:**
```typescript
// Deveria ser
const res = await fetch(`/api/medicina/ia/chat?user_id=${user.id}`)
```

---

### 🟡 PROBLEMA 5: Modelo de IA Sempre Opus

**Sintoma:**
Todos os planos usam Claude Opus (mais caro), quando Premium deveria usar Sonnet.

**Código Atual:**
```typescript
// app/api/medicina/ia/chat/route.ts
const streamParams = {
  model: MODELOS.claude.opus, // Sempre Opus
  // ...
}
```

**Impacto:**
- Custo elevado desnecessário
- Premium pagando preço de Residência em tokens

---

### 🟡 PROBLEMA 6: Função streamGemini Nunca Chamada

**Sintoma:**
A função `streamGemini` está definida no arquivo mas nunca é executada.

**Código Atual:**
```typescript
// Linha ~217 - Sempre chama Claude
return await streamClaude({...})

// streamGemini existe mas nunca é chamado
async function streamGemini(params) {...}
```

---

## 4. CORREÇÃO: BLUR NO GABARITO

### 📋 Descrição
Adicionar blur no gabarito/explicação para usuários FREE que não estão em trial ativo.

### 📁 Arquivo a Modificar
```
app/medicina/(dashboard)/dashboard/questoes/page.tsx
```

### 🔧 Implementação

#### Passo 1: Criar Componente de Blur

Criar arquivo `components/medicina/questoes/GabaritoBlur.tsx`:

```typescript
'use client'

import { Crown, Sparkles, Lock } from 'lucide-react'
import Link from 'next/link'

interface GabaritoBlurProps {
  children: React.ReactNode
  mostrarBlur: boolean
  tipo: 'gabarito' | 'explicacao'
}

export function GabaritoBlur({ children, mostrarBlur, tipo }: GabaritoBlurProps) {
  if (!mostrarBlur) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* Conteúdo com blur */}
      <div className="blur-md select-none pointer-events-none">
        {children}
      </div>
      
      {/* Overlay com CTA */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6 max-w-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h4 className="text-lg font-semibold text-white mb-2">
            {tipo === 'gabarito' ? 'Gabarito Bloqueado' : 'Explicação Bloqueada'}
          </h4>
          
          <p className="text-white/70 text-sm mb-4">
            Faça upgrade para ver {tipo === 'gabarito' ? 'o gabarito' : 'a explicação completa'} e 
            acelere seus estudos!
          </p>
          
          <Link
            href="/medicina/dashboard/assinatura"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-amber-500/25"
          >
            <Crown className="w-5 h-5" />
            Desbloquear Agora
          </Link>
          
          <p className="text-white/50 text-xs mt-3">
            A partir de R$ 29,90/mês
          </p>
        </div>
      </div>
    </div>
  )
}
```

#### Passo 2: Modificar Página de Questões

No arquivo `app/medicina/(dashboard)/dashboard/questoes/page.tsx`, adicionar a verificação:

```typescript
// No início do componente, após useMedAuth:
const { user, plano, trialStatus } = useMedAuth()

// Criar variável de controle
const deveBlurGabarito = plano === 'gratuito' && !trialStatus?.ativo

// Na renderização das alternativas, adicionar verificação:
{questao.alternativas?.map((alt) => {
  const isSelected = respostaSelecionada === alt.letra
  const isCorreta = alt.letra === questao.gabarito
  const mostrarResultado = jaRespondeu

  // Se deve blur, não mostrar qual é correta
  const mostrarCorreta = mostrarResultado && !deveBlurGabarito

  let bgClass = 'bg-white/5 hover:bg-white/10 border-white/10'
  if (mostrarResultado) {
    if (mostrarCorreta && isCorreta) {
      bgClass = 'bg-green-500/20 border-green-500/50'
    } else if (isSelected && !isCorreta && mostrarCorreta) {
      bgClass = 'bg-red-500/20 border-red-500/50'
    } else if (isSelected && deveBlurGabarito) {
      // Resposta selecionada mas com blur - não revela se está certa
      bgClass = 'bg-blue-500/20 border-blue-500/50'
    }
  }
  // ... resto do código
})}

// Na seção de explicação:
{jaRespondeu && (questao.explicacao || questao.comentario_ia) && (
  <GabaritoBlur mostrarBlur={deveBlurGabarito} tipo="explicacao">
    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <h5 className="text-blue-400 font-medium mb-2">Explicação:</h5>
      <p className="text-white/80 whitespace-pre-wrap">
        {questao.explicacao || questao.comentario_ia}
      </p>
    </div>
  </GabaritoBlur>
)}
```

#### Passo 3: Adicionar Feedback Visual

Após responder, mostrar mensagem para FREE sem trial:

```typescript
{jaRespondeu && deveBlurGabarito && (
  <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
    <div className="flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-amber-200 font-medium">
          Resposta registrada!
        </p>
        <p className="text-amber-200/70 text-sm mt-1">
          Faça upgrade para ver se acertou e acessar a explicação completa.
        </p>
      </div>
    </div>
  </div>
)}
```

### ✅ Resultado Esperado

| Situação | Gabarito | Explicação |
|----------|----------|------------|
| FREE sem trial | 🔒 Blur | 🔒 Blur |
| FREE com trial ativo | ✅ Visível | ✅ Visível |
| Premium | ✅ Visível | ✅ Visível |
| Residência | ✅ Visível | ✅ Visível |

---

## 5. CORREÇÃO: CHAT COM ABAS POR MODO

### 📋 Descrição
Implementar sistema de abas onde cada modo de chat (Tutor, Questões, Resumo, Casos Clínicos) tem seu próprio histórico de conversas separado.

### 📁 Arquivos a Modificar/Criar

```
app/medicina/(dashboard)/dashboard/ia/page.tsx
components/medicina/ia/ChatTabs.tsx (novo)
lib/stores/chatModeStore.ts (modificar)
```

### 🏗️ Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────┐
│                    CHAT IA - PREPARAMED                  │
├─────────┬─────────┬─────────┬─────────────────────────────┤
│  TUTOR  │ QUESTÕES│ RESUMO  │ CASOS CLÍNICOS              │
├─────────┴─────────┴─────────┴─────────────────────────────┤
│                                                           │
│  [Histórico de conversas do modo selecionado]            │
│                                                           │
│  Conversa 1 - 19/01/2026                                 │
│  Conversa 2 - 18/01/2026                                 │
│  Conversa 3 - 17/01/2026                                 │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                   [Área de Chat]                          │
│                                                           │
│  Mensagens da conversa selecionada                        │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  [Input de mensagem]                              [Enviar]│
└───────────────────────────────────────────────────────────┘
```

### 🔧 Implementação

#### Passo 1: Modificar Store do Chat

Arquivo `lib/stores/chatModeStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ChatMode = 'tutor' | 'questoes' | 'resumo' | 'casos'

interface ModeConversation {
  id: string
  titulo: string
  updated_at: string
}

interface ChatModeState {
  // Modo atual
  currentMode: ChatMode
  
  // Conversa ativa por modo
  activeConversationByMode: Record<ChatMode, string | null>
  
  // Lista de conversas por modo (cache local)
  conversationsByMode: Record<ChatMode, ModeConversation[]>
  
  // Actions
  setCurrentMode: (mode: ChatMode) => void
  setActiveConversation: (mode: ChatMode, conversaId: string | null) => void
  addConversation: (mode: ChatMode, conversa: ModeConversation) => void
  removeConversation: (mode: ChatMode, conversaId: string) => void
  setConversations: (mode: ChatMode, conversas: ModeConversation[]) => void
}

export const useChatModeStore = create<ChatModeState>()(
  persist(
    (set) => ({
      currentMode: 'tutor',
      
      activeConversationByMode: {
        tutor: null,
        questoes: null,
        resumo: null,
        casos: null
      },
      
      conversationsByMode: {
        tutor: [],
        questoes: [],
        resumo: [],
        casos: []
      },
      
      setCurrentMode: (mode) => set({ currentMode: mode }),
      
      setActiveConversation: (mode, conversaId) => set((state) => ({
        activeConversationByMode: {
          ...state.activeConversationByMode,
          [mode]: conversaId
        }
      })),
      
      addConversation: (mode, conversa) => set((state) => ({
        conversationsByMode: {
          ...state.conversationsByMode,
          [mode]: [conversa, ...state.conversationsByMode[mode]]
        }
      })),
      
      removeConversation: (mode, conversaId) => set((state) => ({
        conversationsByMode: {
          ...state.conversationsByMode,
          [mode]: state.conversationsByMode[mode].filter(c => c.id !== conversaId)
        }
      })),
      
      setConversations: (mode, conversas) => set((state) => ({
        conversationsByMode: {
          ...state.conversationsByMode,
          [mode]: conversas
        }
      }))
    }),
    {
      name: 'preparamed-chat-mode',
      partialize: (state) => ({
        currentMode: state.currentMode,
        activeConversationByMode: state.activeConversationByMode
      })
    }
  )
)
```

#### Passo 2: Criar Componente de Abas

Arquivo `components/medicina/ia/ChatTabs.tsx`:

```typescript
'use client'

import { BookOpen, FileQuestion, FileText, Stethoscope } from 'lucide-react'
import { ChatMode, useChatModeStore } from '@/lib/stores/chatModeStore'

const TABS: { mode: ChatMode; label: string; icon: React.ElementType; description: string }[] = [
  { 
    mode: 'tutor', 
    label: 'Tutor', 
    icon: BookOpen,
    description: 'Explicações detalhadas'
  },
  { 
    mode: 'questoes', 
    label: 'Questões', 
    icon: FileQuestion,
    description: 'Gerar e resolver questões'
  },
  { 
    mode: 'resumo', 
    label: 'Resumo', 
    icon: FileText,
    description: 'Resumos e flashcards'
  },
  { 
    mode: 'casos', 
    label: 'Casos Clínicos', 
    icon: Stethoscope,
    description: 'Simulação de casos'
  }
]

interface ChatTabsProps {
  onModeChange?: (mode: ChatMode) => void
}

export function ChatTabs({ onModeChange }: ChatTabsProps) {
  const { currentMode, setCurrentMode, conversationsByMode } = useChatModeStore()

  const handleTabClick = (mode: ChatMode) => {
    setCurrentMode(mode)
    onModeChange?.(mode)
  }

  return (
    <div className="flex border-b border-white/10 bg-slate-900/50">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = currentMode === tab.mode
        const conversationCount = conversationsByMode[tab.mode]?.length || 0

        return (
          <button
            key={tab.mode}
            onClick={() => handleTabClick(tab.mode)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 
              transition-all relative group
              ${isActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium text-sm hidden sm:inline">{tab.label}</span>
            
            {/* Badge de contagem */}
            {conversationCount > 0 && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/50'}
              `}>
                {conversationCount}
              </span>
            )}

            {/* Tooltip */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                {tab.description}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
```

#### Passo 3: Modificar Banco de Dados

Adicionar coluna `modo` na tabela `conversas_ia_med`:

```sql
-- Executar no Supabase SQL Editor
ALTER TABLE conversas_ia_med 
ADD COLUMN IF NOT EXISTS modo text DEFAULT 'tutor';

-- Criar índice para busca por modo
CREATE INDEX IF NOT EXISTS idx_conversas_ia_med_modo 
ON conversas_ia_med(user_id, modo);

-- Atualizar conversas existentes
UPDATE conversas_ia_med 
SET modo = 'tutor' 
WHERE modo IS NULL;
```

#### Passo 4: Modificar API de Chat

No arquivo `app/api/medicina/ia/chat/route.ts`, adicionar suporte a modo:

```typescript
// No POST, receber modo
const {
  user_id,
  mensagem,
  conversa_id,
  modo = 'tutor', // Novo parâmetro
  // ... outros campos
} = body

// Ao criar nova conversa, salvar o modo
if (!conversaAtual) {
  const { data: novaConversa, error: convError } = await supabase
    .from('conversas_ia_med')
    .insert({
      user_id,
      titulo: mensagem.substring(0, 50) + (mensagem.length > 50 ? '...' : ''),
      modelo: plano === 'residencia' ? 'claude' : 'gemini',
      modo: modo // Salvar modo
    })
    .select()
    .single()
  // ...
}

// No GET, filtrar por modo
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')
  const conversa_id = searchParams.get('conversa_id')
  const modo = searchParams.get('modo') // Novo parâmetro

  // ...

  // Listar conversas filtradas por modo
  let query = supabase
    .from('conversas_ia_med')
    .select('*')
    .eq('user_id', user_id)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (modo) {
    query = query.eq('modo', modo)
  }

  const { data: conversas } = await query

  return NextResponse.json({ conversas })
}
```

#### Passo 5: Modificar Página Principal do Chat

No arquivo `app/medicina/(dashboard)/dashboard/ia/page.tsx`:

```typescript
// Importar componentes
import { ChatTabs } from '@/components/medicina/ia/ChatTabs'
import { useChatModeStore } from '@/lib/stores/chatModeStore'

export default function IAPage() {
  const { user } = useMedAuth()
  const { 
    currentMode, 
    activeConversationByMode, 
    setActiveConversation,
    setConversations 
  } = useChatModeStore()
  
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [conversas, setConversas] = useState<Conversa[]>([])
  
  // Conversa ativa do modo atual
  const conversaAtual = activeConversationByMode[currentMode]

  // Buscar conversas quando modo muda
  const fetchConversas = useCallback(async () => {
    if (!user) return

    const res = await fetch(
      `/api/medicina/ia/chat?user_id=${user.id}&modo=${currentMode}`
    )
    const data = await res.json()
    
    setConversas(data.conversas || [])
    setConversations(currentMode, data.conversas || [])
  }, [user, currentMode, setConversations])

  useEffect(() => {
    fetchConversas()
  }, [fetchConversas])

  // Handler para troca de modo
  const handleModeChange = (mode: ChatMode) => {
    // Limpar mensagens ao trocar de modo
    setMensagens([])
    
    // Se houver conversa ativa neste modo, carregar
    const conversaDoModo = activeConversationByMode[mode]
    if (conversaDoModo) {
      carregarConversa(conversaDoModo)
    }
  }

  // Ao enviar mensagem, incluir modo
  const enviarMensagem = async (texto: string) => {
    const res = await fetch('/api/medicina/ia/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        mensagem: texto,
        conversa_id: conversaAtual,
        modo: currentMode, // Incluir modo
        // ... outros campos
      })
    })
    // ...
  }

  // Nova conversa no modo atual
  const novaConversa = () => {
    setActiveConversation(currentMode, null)
    setMensagens([])
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Abas de modo */}
      <ChatTabs onModeChange={handleModeChange} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de conversas (filtradas por modo) */}
        <aside className="w-64 border-r border-white/10 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={novaConversa}
              className="w-full py-2 px-4 bg-emerald-500/20 text-emerald-400 rounded-lg"
            >
              + Nova Conversa
            </button>
          </div>
          
          <div className="px-2">
            {conversas.map(conversa => (
              <button
                key={conversa.id}
                onClick={() => {
                  setActiveConversation(currentMode, conversa.id)
                  carregarConversa(conversa.id)
                }}
                className={`w-full text-left p-3 rounded-lg mb-1 ${
                  conversaAtual === conversa.id 
                    ? 'bg-emerald-500/20' 
                    : 'hover:bg-white/5'
                }`}
              >
                {conversa.titulo}
              </button>
            ))}
          </div>
        </aside>

        {/* Área principal do chat */}
        <main className="flex-1 flex flex-col">
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4">
            {mensagens.map(msg => (
              // Renderizar mensagens...
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            {/* Input de mensagem... */}
          </div>
        </main>
      </div>
    </div>
  )
}
```

### ✅ Resultado Esperado

| Modo | Histórico | Conversas |
|------|-----------|-----------|
| Tutor | Separado | Própria lista |
| Questões | Separado | Própria lista |
| Resumo | Separado | Própria lista |
| Casos | Separado | Própria lista |

### 🎨 Visual Final

```
┌──────────────────────────────────────────────────────────┐
│ [🎓 Tutor (3)] [📝 Questões (5)] [📄 Resumo (2)] [🩺 Casos (1)] │
├──────────────────────────────────────────────────────────┤
│ Sidebar          │              Chat Area                │
│ ───────────────  │  ─────────────────────────────────── │
│ + Nova Conversa  │                                       │
│                  │  [Mensagens do modo Tutor]            │
│ > Conversa 1    │                                       │
│   Conversa 2     │  User: Explique diabetes tipo 2      │
│   Conversa 3     │  IA: O diabetes tipo 2 é...          │
│                  │                                       │
└──────────────────────────────────────────────────────────┘
```

---

**Diga "próximo"** para eu enviar as partes 6 a 10 (Correção de Áudio, Hook, Modelo, Performance e Checklist).# 🏥 PLANO DE CORREÇÕES E MELHORIAS - PREPARAMED

**Data:** 19 de Janeiro de 2026  
**Versão:** 1.0  
**Autor:** GitHub Copilot  
**Projeto:** PreparaMed - Plataforma de Estudos para Medicina

---

## 📋 ÍNDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Status das 10 Tarefas Originais](#2-status-das-10-tarefas-originais)
3. [Problemas Críticos Identificados](#3-problemas-críticos-identificados)
4. [Correção: Blur no Gabarito](#4-correção-blur-no-gabarito)
5. [Correção: Chat com Abas por Modo](#5-correção-chat-com-abas-por-modo)
6. [Correção: Erro de Áudio/Transcrição](#6-correção-erro-de-áudiotranscrição)
7. [Correção: Hook useChatIA + API](#7-correção-hook-usechatia--api)
8. [Correção: Modelo de IA por Plano](#8-correção-modelo-de-ia-por-plano)
9. [Melhorias de Performance e UX](#9-melhorias-de-performance-e-ux)
10. [Checklist de Implementação](#10-checklist-de-implementação)

---

## 1. RESUMO EXECUTIVO

### 📊 Visão Geral

O sistema PREPARAMED está **80% completo** em relação às 10 tarefas originais. A arquitetura é sólida, mas há correções críticas necessárias antes do lançamento.

### ✅ Pontos Fortes

| Item | Status | Observação |
|------|--------|------------|
| Sistema de Trial 4h | ✅ Completo | `trial_started_at` + `trial_used` no banco |
| Limites por plano | ✅ Completo | MedAuthContext com `limitesPlano` |
| Streaming de IA | ✅ Completo | ReadableStream bem implementado |
| Banco de dados | ✅ Completo | 36 tabelas `_med` estruturadas |
| Badges/Gamificação | ✅ Completo | 10 badges cadastrados |
| Componentes de IA | ✅ Completo | Voice, ExamAnalyzer, ChatModes |

### ❌ Pontos Críticos para Corrigir

| Prioridade | Problema | Impacto |
|------------|----------|---------|
| 🔴 P0 | Erro de áudio - API ausente | Funcionalidade quebrada |
| 🔴 P0 | Gabarito blur não implementado | Modelo de negócio afetado |
| 🟠 P1 | Chat sem abas por modo | UX comprometida |
| 🟠 P1 | Hook useChatIA com API errada | Não funciona para medicina |
| 🟡 P2 | Modelo de IA fixo (sempre Opus) | Custo elevado desnecessário |
| 🟡 P2 | streamGemini nunca chamado | Código morto |

### 📈 Impacto Estimado Pós-Correções

| Área | Antes | Depois |
|------|-------|--------|
| Funcionalidade | 80% | 100% |
| Performance | 70% | 90% |
| UX | 70% | 95% |
| Custo de IA | Alto | Otimizado |

---

## 2. STATUS DAS 10 TAREFAS ORIGINAIS

### Tabela de Status

| # | Tarefa | Status | Detalhes |
|---|--------|--------|----------|
| 1 | Trial 4h + contador | ✅ FEITO | Campos `trial_started_at`, `trial_used` no `profiles_med` |
| 2 | Limites MedAuthContext | ✅ FEITO | `limitesPlano`, `limites`, `trialStatus` integrados |
| 3 | Flashcards integrado | ✅ FEITO | Hooks e APIs funcionando |
| 4 | Modos do Chat | ⚠️ PARCIAL | Funciona, mas sem abas separadas por modo |
| 5 | Voz (Whisper + TTS) | ❌ QUEBRADO | Erro "Configuração de API ausente" |
| 6 | Análise de Exames | ✅ FEITO | ExamAnalyzer modal funcionando |
| 7 | Gabarito blur FREE | ❌ NÃO FEITO | Não implementado |
| 8 | Badges ranking | ✅ FEITO | 10 badges no banco, hooks existem |
| 9 | Pop-ups estratégicos | ✅ FEITO | UpgradeModal existe |
| 10 | Tabelas no banco | ✅ FEITO | 36 tabelas `_med` verificadas |

### Detalhamento por Tarefa

#### Tarefa 1: Trial 4h ✅
```
Banco de dados:
- profiles_med.trial_started_at (timestamp)
- profiles_med.trial_used (boolean)

Código:
- MedAuthContext calcula tempo restante
- TrialCountdown exibe contador regressivo
```

#### Tarefa 4: Modos do Chat ⚠️
```
Implementado:
- 4 modos: tutor, questoes, resumo, casos
- Troca de modo funciona
- Artefatos marcados com modo

Faltando:
- Histórico separado por modo (abas)
- Cada modo deveria ter suas próprias conversas
```

#### Tarefa 5: Voz ❌
```
Erro: "Configuração de API ausente"
Causa: OPENAI_API_KEY não está na Vercel
Solução: Configurar variável de ambiente
```

#### Tarefa 7: Blur Gabarito ❌
```
Status: Não implementado
Impacto: Usuário FREE vê gabarito sem pagar
Solução: Adicionar blur + botão de upgrade
```

---

## 3. PROBLEMAS CRÍTICOS IDENTIFICADOS

### 🔴 PROBLEMA 1: Erro de Áudio/Transcrição

**Sintoma:**
```
POST /api/medicina/ia/speech/transcribe 500 (Internal Server Error)
{"error":"Configuração de API ausente"}
```

**Causa Raiz:**
A variável `OPENAI_API_KEY` não está configurada na Vercel, ou o código está verificando incorretamente.

**Arquivo Afetado:**
```
app/api/medicina/ia/speech/transcribe/route.ts
```

**Impacto:** 
- Usuários não conseguem usar entrada por voz
- Funcionalidade completamente quebrada em produção

---

### 🔴 PROBLEMA 2: Gabarito sem Blur para FREE

**Sintoma:**
Usuário com plano gratuito (sem trial ativo) consegue ver gabarito e explicação das questões.

**Arquivo Afetado:**
```
app/medicina/(dashboard)/dashboard/questoes/page.tsx
```

**Impacto:**
- Modelo de negócio comprometido
- Sem incentivo para upgrade

---

### 🟠 PROBLEMA 3: Chat sem Abas por Modo

**Sintoma:**
Quando o usuário troca de modo (tutor → questões → resumo), as mensagens ficam todas na mesma timeline.

**Comportamento Atual:**
```
Conversa 1:
  - [TUTOR] Usuário: Explique diabetes
  - [TUTOR] IA: Diabetes é...
  - [QUESTÕES] Usuário: Gere questões sobre diabetes
  - [QUESTÕES] IA: Questão 1...
  - [RESUMO] Usuário: Resuma diabetes
  - [RESUMO] IA: Resumo...
```

**Comportamento Desejado:**
```
[ABA TUTOR]     → Conversa de explicações
[ABA QUESTÕES]  → Conversa de questões geradas
[ABA RESUMO]    → Conversa de resumos
[ABA CASOS]     → Conversa de casos clínicos
```

---

### 🟠 PROBLEMA 4: Hook useChatIA com API Errada

**Sintoma:**
O hook `hooks/useChatIA.ts` faz requisições para `/api/ia/chat` (sistema de concursos) ao invés de `/api/medicina/ia/chat`.

**Código Atual:**
```typescript
// hooks/useChatIA.ts - ERRADO
const res = await fetch(`/api/ia/chat?user_id=${user.id}`)
```

**Código Correto:**
```typescript
// Deveria ser
const res = await fetch(`/api/medicina/ia/chat?user_id=${user.id}`)
```

---

### 🟡 PROBLEMA 5: Modelo de IA Sempre Opus

**Sintoma:**
Todos os planos usam Claude Opus (mais caro), quando Premium deveria usar Sonnet.

**Código Atual:**
```typescript
// app/api/medicina/ia/chat/route.ts
const streamParams = {
  model: MODELOS.claude.opus, // Sempre Opus
  // ...
}
```

**Impacto:**
- Custo elevado desnecessário
- Premium pagando preço de Residência em tokens

---

### 🟡 PROBLEMA 6: Função streamGemini Nunca Chamada

**Sintoma:**
A função `streamGemini` está definida no arquivo mas nunca é executada.

**Código Atual:**
```typescript
// Linha ~217 - Sempre chama Claude
return await streamClaude({...})

// streamGemini existe mas nunca é chamado
async function streamGemini(params) {...}
```

---

## 4. CORREÇÃO: BLUR NO GABARITO

### 📋 Descrição
Adicionar blur no gabarito/explicação para usuários FREE que não estão em trial ativo.

### 📁 Arquivo a Modificar
```
app/medicina/(dashboard)/dashboard/questoes/page.tsx
```

### 🔧 Implementação

#### Passo 1: Criar Componente de Blur

Criar arquivo `components/medicina/questoes/GabaritoBlur.tsx`:

```typescript
'use client'

import { Crown, Sparkles, Lock } from 'lucide-react'
import Link from 'next/link'

interface GabaritoBlurProps {
  children: React.ReactNode
  mostrarBlur: boolean
  tipo: 'gabarito' | 'explicacao'
}

export function GabaritoBlur({ children, mostrarBlur, tipo }: GabaritoBlurProps) {
  if (!mostrarBlur) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* Conteúdo com blur */}
      <div className="blur-md select-none pointer-events-none">
        {children}
      </div>
      
      {/* Overlay com CTA */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6 max-w-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h4 className="text-lg font-semibold text-white mb-2">
            {tipo === 'gabarito' ? 'Gabarito Bloqueado' : 'Explicação Bloqueada'}
          </h4>
          
          <p className="text-white/70 text-sm mb-4">
            Faça upgrade para ver {tipo === 'gabarito' ? 'o gabarito' : 'a explicação completa'} e 
            acelere seus estudos!
          </p>
          
          <Link
            href="/medicina/dashboard/assinatura"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-amber-500/25"
          >
            <Crown className="w-5 h-5" />
            Desbloquear Agora
          </Link>
          
          <p className="text-white/50 text-xs mt-3">
            A partir de R$ 29,90/mês
          </p>
        </div>
      </div>
    </div>
  )
}
```

#### Passo 2: Modificar Página de Questões

No arquivo `app/medicina/(dashboard)/dashboard/questoes/page.tsx`, adicionar a verificação:

```typescript
// No início do componente, após useMedAuth:
const { user, plano, trialStatus } = useMedAuth()

// Criar variável de controle
const deveBlurGabarito = plano === 'gratuito' && !trialStatus?.ativo

// Na renderização das alternativas, adicionar verificação:
{questao.alternativas?.map((alt) => {
  const isSelected = respostaSelecionada === alt.letra
  const isCorreta = alt.letra === questao.gabarito
  const mostrarResultado = jaRespondeu

  // Se deve blur, não mostrar qual é correta
  const mostrarCorreta = mostrarResultado && !deveBlurGabarito

  let bgClass = 'bg-white/5 hover:bg-white/10 border-white/10'
  if (mostrarResultado) {
    if (mostrarCorreta && isCorreta) {
      bgClass = 'bg-green-500/20 border-green-500/50'
    } else if (isSelected && !isCorreta && mostrarCorreta) {
      bgClass = 'bg-red-500/20 border-red-500/50'
    } else if (isSelected && deveBlurGabarito) {
      // Resposta selecionada mas com blur - não revela se está certa
      bgClass = 'bg-blue-500/20 border-blue-500/50'
    }
  }
  // ... resto do código
})}

// Na seção de explicação:
{jaRespondeu && (questao.explicacao || questao.comentario_ia) && (
  <GabaritoBlur mostrarBlur={deveBlurGabarito} tipo="explicacao">
    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <h5 className="text-blue-400 font-medium mb-2">Explicação:</h5>
      <p className="text-white/80 whitespace-pre-wrap">
        {questao.explicacao || questao.comentario_ia}
      </p>
    </div>
  </GabaritoBlur>
)}
```

#### Passo 3: Adicionar Feedback Visual

Após responder, mostrar mensagem para FREE sem trial:

```typescript
{jaRespondeu && deveBlurGabarito && (
  <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
    <div className="flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-amber-200 font-medium">
          Resposta registrada!
        </p>
        <p className="text-amber-200/70 text-sm mt-1">
          Faça upgrade para ver se acertou e acessar a explicação completa.
        </p>
      </div>
    </div>
  </div>
)}
```

### ✅ Resultado Esperado

| Situação | Gabarito | Explicação |
|----------|----------|------------|
| FREE sem trial | 🔒 Blur | 🔒 Blur |
| FREE com trial ativo | ✅ Visível | ✅ Visível |
| Premium | ✅ Visível | ✅ Visível |
| Residência | ✅ Visível | ✅ Visível |

---

## 5. CORREÇÃO: CHAT COM ABAS POR MODO

### 📋 Descrição
Implementar sistema de abas onde cada modo de chat (Tutor, Questões, Resumo, Casos Clínicos) tem seu próprio histórico de conversas separado.

### 📁 Arquivos a Modificar/Criar

```
app/medicina/(dashboard)/dashboard/ia/page.tsx
components/medicina/ia/ChatTabs.tsx (novo)
lib/stores/chatModeStore.ts (modificar)
```

### 🏗️ Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────┐
│                    CHAT IA - PREPARAMED                  │
├─────────┬─────────┬─────────┬─────────────────────────────┤
│  TUTOR  │ QUESTÕES│ RESUMO  │ CASOS CLÍNICOS              │
├─────────┴─────────┴─────────┴─────────────────────────────┤
│                                                           │
│  [Histórico de conversas do modo selecionado]            │
│                                                           │
│  Conversa 1 - 19/01/2026                                 │
│  Conversa 2 - 18/01/2026                                 │
│  Conversa 3 - 17/01/2026                                 │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                   [Área de Chat]                          │
│                                                           │
│  Mensagens da conversa selecionada                        │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  [Input de mensagem]                              [Enviar]│
└───────────────────────────────────────────────────────────┘
```

### 🔧 Implementação

#### Passo 1: Modificar Store do Chat

Arquivo `lib/stores/chatModeStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ChatMode = 'tutor' | 'questoes' | 'resumo' | 'casos'

interface ModeConversation {
  id: string
  titulo: string
  updated_at: string
}

interface ChatModeState {
  // Modo atual
  currentMode: ChatMode
  
  // Conversa ativa por modo
  activeConversationByMode: Record<ChatMode, string | null>
  
  // Lista de conversas por modo (cache local)
  conversationsByMode: Record<ChatMode, ModeConversation[]>
  
  // Actions
  setCurrentMode: (mode: ChatMode) => void
  setActiveConversation: (mode: ChatMode, conversaId: string | null) => void
  addConversation: (mode: ChatMode, conversa: ModeConversation) => void
  removeConversation: (mode: ChatMode, conversaId: string) => void
  setConversations: (mode: ChatMode, conversas: ModeConversation[]) => void
}

export const useChatModeStore = create<ChatModeState>()(
  persist(
    (set) => ({
      currentMode: 'tutor',
      
      activeConversationByMode: {
        tutor: null,
        questoes: null,
        resumo: null,
        casos: null
      },
      
      conversationsByMode: {
        tutor: [],
        questoes: [],
        resumo: [],
        casos: []
      },
      
      setCurrentMode: (mode) => set({ currentMode: mode }),
      
      setActiveConversation: (mode, conversaId) => set((state) => ({
        activeConversationByMode: {
          ...state.activeConversationByMode,
          [mode]: conversaId
        }
      })),
      
      addConversation: (mode, conversa) => set((state) => ({
        conversationsByMode: {
          ...state.conversationsByMode,
          [mode]: [conversa, ...state.conversationsByMode[mode]]
        }
      })),
      
      removeConversation: (mode, conversaId) => set((state) => ({
        conversationsByMode: {
          ...state.conversationsByMode,
          [mode]: state.conversationsByMode[mode].filter(c => c.id !== conversaId)
        }
      })),
      
      setConversations: (mode, conversas) => set((state) => ({
        conversationsByMode: {
          ...state.conversationsByMode,
          [mode]: conversas
        }
      }))
    }),
    {
      name: 'preparamed-chat-mode',
      partialize: (state) => ({
        currentMode: state.currentMode,
        activeConversationByMode: state.activeConversationByMode
      })
    }
  )
)
```

#### Passo 2: Criar Componente de Abas

Arquivo `components/medicina/ia/ChatTabs.tsx`:

```typescript
'use client'

import { BookOpen, FileQuestion, FileText, Stethoscope } from 'lucide-react'
import { ChatMode, useChatModeStore } from '@/lib/stores/chatModeStore'

const TABS: { mode: ChatMode; label: string; icon: React.ElementType; description: string }[] = [
  { 
    mode: 'tutor', 
    label: 'Tutor', 
    icon: BookOpen,
    description: 'Explicações detalhadas'
  },
  { 
    mode: 'questoes', 
    label: 'Questões', 
    icon: FileQuestion,
    description: 'Gerar e resolver questões'
  },
  { 
    mode: 'resumo', 
    label: 'Resumo', 
    icon: FileText,
    description: 'Resumos e flashcards'
  },
  { 
    mode: 'casos', 
    label: 'Casos Clínicos', 
    icon: Stethoscope,
    description: 'Simulação de casos'
  }
]

interface ChatTabsProps {
  onModeChange?: (mode: ChatMode) => void
}

export function ChatTabs({ onModeChange }: ChatTabsProps) {
  const { currentMode, setCurrentMode, conversationsByMode } = useChatModeStore()

  const handleTabClick = (mode: ChatMode) => {
    setCurrentMode(mode)
    onModeChange?.(mode)
  }

  return (
    <div className="flex border-b border-white/10 bg-slate-900/50">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = currentMode === tab.mode
        const conversationCount = conversationsByMode[tab.mode]?.length || 0

        return (
          <button
            key={tab.mode}
            onClick={() => handleTabClick(tab.mode)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 
              transition-all relative group
              ${isActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium text-sm hidden sm:inline">{tab.label}</span>
            
            {/* Badge de contagem */}
            {conversationCount > 0 && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/50'}
              `}>
                {conversationCount}
              </span>
            )}

            {/* Tooltip */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                {tab.description}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
```

#### Passo 3: Modificar Banco de Dados

Adicionar coluna `modo` na tabela `conversas_ia_med`:

```sql
-- Executar no Supabase SQL Editor
ALTER TABLE conversas_ia_med 
ADD COLUMN IF NOT EXISTS modo text DEFAULT 'tutor';

-- Criar índice para busca por modo
CREATE INDEX IF NOT EXISTS idx_conversas_ia_med_modo 
ON conversas_ia_med(user_id, modo);

-- Atualizar conversas existentes
UPDATE conversas_ia_med 
SET modo = 'tutor' 
WHERE modo IS NULL;
```

#### Passo 4: Modificar API de Chat

No arquivo `app/api/medicina/ia/chat/route.ts`, adicionar suporte a modo:

```typescript
// No POST, receber modo
const {
  user_id,
  mensagem,
  conversa_id,
  modo = 'tutor', // Novo parâmetro
  // ... outros campos
} = body

// Ao criar nova conversa, salvar o modo
if (!conversaAtual) {
  const { data: novaConversa, error: convError } = await supabase
    .from('conversas_ia_med')
    .insert({
      user_id,
      titulo: mensagem.substring(0, 50) + (mensagem.length > 50 ? '...' : ''),
      modelo: plano === 'residencia' ? 'claude' : 'gemini',
      modo: modo // Salvar modo
    })
    .select()
    .single()
  // ...
}

// No GET, filtrar por modo
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')
  const conversa_id = searchParams.get('conversa_id')
  const modo = searchParams.get('modo') // Novo parâmetro

  // ...

  // Listar conversas filtradas por modo
  let query = supabase
    .from('conversas_ia_med')
    .select('*')
    .eq('user_id', user_id)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (modo) {
    query = query.eq('modo', modo)
  }

  const { data: conversas } = await query

  return NextResponse.json({ conversas })
}
```

#### Passo 5: Modificar Página Principal do Chat

No arquivo `app/medicina/(dashboard)/dashboard/ia/page.tsx`:

```typescript
// Importar componentes
import { ChatTabs } from '@/components/medicina/ia/ChatTabs'
import { useChatModeStore } from '@/lib/stores/chatModeStore'

export default function IAPage() {
  const { user } = useMedAuth()
  const { 
    currentMode, 
    activeConversationByMode, 
    setActiveConversation,
    setConversations 
  } = useChatModeStore()
  
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [conversas, setConversas] = useState<Conversa[]>([])
  
  // Conversa ativa do modo atual
  const conversaAtual = activeConversationByMode[currentMode]

  // Buscar conversas quando modo muda
  const fetchConversas = useCallback(async () => {
    if (!user) return

    const res = await fetch(
      `/api/medicina/ia/chat?user_id=${user.id}&modo=${currentMode}`
    )
    const data = await res.json()
    
    setConversas(data.conversas || [])
    setConversations(currentMode, data.conversas || [])
  }, [user, currentMode, setConversations])

  useEffect(() => {
    fetchConversas()
  }, [fetchConversas])

  // Handler para troca de modo
  const handleModeChange = (mode: ChatMode) => {
    // Limpar mensagens ao trocar de modo
    setMensagens([])
    
    // Se houver conversa ativa neste modo, carregar
    const conversaDoModo = activeConversationByMode[mode]
    if (conversaDoModo) {
      carregarConversa(conversaDoModo)
    }
  }

  // Ao enviar mensagem, incluir modo
  const enviarMensagem = async (texto: string) => {
    const res = await fetch('/api/medicina/ia/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        mensagem: texto,
        conversa_id: conversaAtual,
        modo: currentMode, // Incluir modo
        // ... outros campos
      })
    })
    // ...
  }

  // Nova conversa no modo atual
  const novaConversa = () => {
    setActiveConversation(currentMode, null)
    setMensagens([])
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Abas de modo */}
      <ChatTabs onModeChange={handleModeChange} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de conversas (filtradas por modo) */}
        <aside className="w-64 border-r border-white/10 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={novaConversa}
              className="w-full py-2 px-4 bg-emerald-500/20 text-emerald-400 rounded-lg"
            >
              + Nova Conversa
            </button>
          </div>
          
          <div className="px-2">
            {conversas.map(conversa => (
              <button
                key={conversa.id}
                onClick={() => {
                  setActiveConversation(currentMode, conversa.id)
                  carregarConversa(conversa.id)
                }}
                className={`w-full text-left p-3 rounded-lg mb-1 ${
                  conversaAtual === conversa.id 
                    ? 'bg-emerald-500/20' 
                    : 'hover:bg-white/5'
                }`}
              >
                {conversa.titulo}
              </button>
            ))}
          </div>
        </aside>

        {/* Área principal do chat */}
        <main className="flex-1 flex flex-col">
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4">
            {mensagens.map(msg => (
              // Renderizar mensagens...
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            {/* Input de mensagem... */}
          </div>
        </main>
      </div>
    </div>
  )
}
```

### ✅ Resultado Esperado

| Modo | Histórico | Conversas |
|------|-----------|-----------|
| Tutor | Separado | Própria lista |
| Questões | Separado | Própria lista |
| Resumo | Separado | Própria lista |
| Casos | Separado | Própria lista |

### 🎨 Visual Final

```
┌──────────────────────────────────────────────────────────┐
│ [🎓 Tutor (3)] [📝 Questões (5)] [📄 Resumo (2)] [🩺 Casos (1)] │
├──────────────────────────────────────────────────────────┤
│ Sidebar          │              Chat Area                │
│ ───────────────  │  ─────────────────────────────────── │
│ + Nova Conversa  │                                       │
│                  │  [Mensagens do modo Tutor]            │
│ > Conversa 1    │                                       │
│   Conversa 2     │  User: Explique diabetes tipo 2      │
│   Conversa 3     │  IA: O diabetes tipo 2 é...          │
│                  │                                       │
└──────────────────────────────────────────────────────────┘
```

---

## 6. CORREÇÃO: ERRO DE ÁUDIO/TRANSCRIÇÃO

### 📋 Descrição
O endpoint de transcrição de áudio retorna erro 500 "Configuração de API ausente" porque a variável `OPENAI_API_KEY` não está configurada na Vercel.

### 🔍 Diagnóstico

**Erro no Console:**
```
POST /api/medicina/ia/speech/transcribe 500 (Internal Server Error)
{"error":"Configuração de API ausente"}
```

**Causa Raiz:**
A API usa OpenAI Whisper para transcrição, mas a chave não está nas variáveis de ambiente da Vercel.

### 📁 Arquivo Afetado
```
app/api/medicina/ia/speech/transcribe/route.ts
```

### 🔧 Implementação

#### Passo 1: Verificar o Código Atual

Primeiro, veja o conteúdo do arquivo:

```powershell
Get-Content "app\api\medicina\ia\speech\transcribe\route.ts"
```

#### Passo 2: Corrigir o Código

O código deve ter uma verificação assim:

```typescript
// filepath: app/api/medicina/ia/speech/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    // Verificar se a API key existe
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY não configurada')
      return NextResponse.json(
        { error: 'Configuração de API ausente' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({ apiKey })

    // Receber o arquivo de áudio
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Arquivo de áudio não enviado' },
        { status: 400 }
      )
    }

    // Transcrever com Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'text'
    })

    return NextResponse.json({ 
      text: transcription,
      success: true 
    })

  } catch (error) {
    console.error('Erro na transcrição:', error)
    
    // Tratamento específico de erros
    if (error instanceof Error) {
      if (error.message.includes('Invalid API Key')) {
        return NextResponse.json(
          { error: 'Chave de API inválida' },
          { status: 401 }
        )
      }
      if (error.message.includes('Rate limit')) {
        return NextResponse.json(
          { error: 'Limite de requisições atingido. Tente novamente em alguns segundos.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erro ao processar áudio. Tente novamente.' },
      { status: 500 }
    )
  }
}
```

#### Passo 3: Configurar Variável na Vercel

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables

2. Adicione a variável:
   ```
   Nome: OPENAI_API_KEY
   Valor: sk-proj-xxxxxxxxxxxxxxxx
   Ambientes: Production, Preview, Development
   ```

3. Faça redeploy:
   ```powershell
   vercel --prod
   ```

#### Passo 4: Fallback para Quando API Falha

No componente de gravação, adicionar fallback:

```typescript
// filepath: components/medicina/ia/VoiceInput.tsx
const handleTranscription = async (audioBlob: Blob) => {
  setIsTranscribing(true)
  setError(null)

  try {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.webm')

    const response = await fetch('/api/medicina/ia/speech/transcribe', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro na transcrição')
    }

    // Sucesso - usar texto transcrito
    onTranscription(data.text)

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    
    // Mostrar erro amigável mas não bloquear o usuário
    setError(errorMessage)
    
    // Oferecer alternativa
    toast.error(
      'Não foi possível transcrever o áudio. Tente digitar sua mensagem.',
      { duration: 5000 }
    )
    
  } finally {
    setIsTranscribing(false)
  }
}
```

### ✅ Checklist de Verificação

- [ ] Variável `OPENAI_API_KEY` configurada na Vercel
- [ ] Código tem tratamento de erro adequado
- [ ] Fallback para usuário quando falha
- [ ] Redeploy feito após configurar variável

---

## 7. CORREÇÃO: HOOK useChatIA + API

### 📋 Descrição
O hook `useChatIA.ts` está fazendo requisições para a API errada (`/api/ia/chat` do sistema de concursos) ao invés da API de medicina (`/api/medicina/ia/chat`).

### 🔍 Problema

**Código Atual:**
```typescript
// hooks/useChatIA.ts - ERRADO
const res = await fetch(`/api/ia/chat?user_id=${user.id}`)
```

**Deveria Ser:**
```typescript
// hooks/useChatIA.ts - CORRETO
const res = await fetch(`/api/medicina/ia/chat?user_id=${user.id}`)
```

### 📁 Arquivo a Modificar
```
hooks/useChatIA.ts
```

### 🔧 Implementação

Substituir o arquivo completo:

```typescript
// filepath: hooks/useChatIA.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useMedAuth } from '@/contexts/MedAuthContext'

export interface Conversa {
  id: string
  user_id: string
  titulo: string
  modo: 'tutor' | 'questoes' | 'resumo' | 'casos'
  modelo: string
  tokens_usados: number
  created_at: string
  updated_at: string
}

export interface Mensagem {
  id: string
  conversa_id: string
  role: 'user' | 'assistant'
  content: string
  tokens: number
  has_image: boolean
  has_pdf: boolean
  created_at: string
}

interface UseChatIAOptions {
  modo?: 'tutor' | 'questoes' | 'resumo' | 'casos'
}

interface ChatData {
  conversas: Conversa[]
  conversaAtual: Conversa | null
  mensagens: Mensagem[]
  loading: boolean
  enviando: boolean
  error: string | null
}

interface ChatActions {
  carregarConversas: () => Promise<void>
  selecionarConversa: (conversaId: string) => Promise<void>
  enviarMensagem: (mensagem: string, opcoes?: {
    imagem_base64?: string
    imagem_tipo?: string
    pdf_base64?: string
  }) => Promise<void>
  novaConversa: () => void
  deletarConversa: (conversaId: string) => Promise<boolean>
  limparErro: () => void
}

// URL base da API de medicina
const API_BASE = '/api/medicina/ia/chat'

export function useChatIA(options: UseChatIAOptions = {}): ChatData & ChatActions {
  const { user } = useMedAuth()
  const { modo = 'tutor' } = options
  
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaAtual, setConversaAtual] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar conversas do modo atual
  const carregarConversas = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`${API_BASE}?user_id=${user.id}&modo=${modo}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar conversas')
      }

      setConversas(data.conversas || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar conversas'
      setError(message)
      console.error('Erro ao carregar conversas:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, modo])

  // Carregar conversas quando montar ou modo mudar
  useEffect(() => {
    carregarConversas()
  }, [carregarConversas])

  // Selecionar conversa e carregar mensagens
  const selecionarConversa = useCallback(async (conversaId: string) => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`${API_BASE}?user_id=${user.id}&conversa_id=${conversaId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar mensagens')
      }

      const conversa = conversas.find(c => c.id === conversaId) || data.conversa
      setConversaAtual(conversa)
      setMensagens(data.mensagens || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar mensagens'
      setError(message)
      console.error('Erro ao carregar mensagens:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, conversas])

  // Enviar mensagem com streaming
  const enviarMensagem = useCallback(async (
    mensagem: string,
    opcoes?: {
      imagem_base64?: string
      imagem_tipo?: string
      pdf_base64?: string
    }
  ) => {
    if (!user?.id || !mensagem.trim()) return

    setEnviando(true)
    setError(null)

    // Adicionar mensagem do usuário otimisticamente
    const msgUsuario: Mensagem = {
      id: `temp-user-${Date.now()}`,
      conversa_id: conversaAtual?.id || '',
      role: 'user',
      content: mensagem,
      tokens: 0,
      has_image: !!opcoes?.imagem_base64,
      has_pdf: !!opcoes?.pdf_base64,
      created_at: new Date().toISOString()
    }
    setMensagens(prev => [...prev, msgUsuario])

    // Adicionar placeholder da resposta
    const msgIATemp: Mensagem = {
      id: `temp-assistant-${Date.now()}`,
      conversa_id: conversaAtual?.id || '',
      role: 'assistant',
      content: '',
      tokens: 0,
      has_image: false,
      has_pdf: false,
      created_at: new Date().toISOString()
    }
    setMensagens(prev => [...prev, msgIATemp])

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          conversa_id: conversaAtual?.id,
          mensagem,
          modo,
          ...opcoes
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao enviar mensagem')
      }

      // Processar streaming
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''
      let novaConversaId = conversaAtual?.id

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'text') {
                  fullResponse += data.content
                  // Atualizar mensagem da IA em tempo real
                  setMensagens(prev => prev.map(m => 
                    m.id === msgIATemp.id 
                      ? { ...m, content: fullResponse }
                      : m
                  ))
                } else if (data.type === 'done') {
                  novaConversaId = data.conversa_id
                } else if (data.type === 'error') {
                  throw new Error(data.error)
                }
              } catch (parseError) {
                // Ignorar linhas que não são JSON válido
              }
            }
          }
        }
      }

      // Atualizar IDs e conversa
      if (novaConversaId && !conversaAtual) {
        const novaConversa: Conversa = {
          id: novaConversaId,
          user_id: user.id,
          titulo: mensagem.substring(0, 50) + (mensagem.length > 50 ? '...' : ''),
          modo,
          modelo: 'claude',
          tokens_usados: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setConversaAtual(novaConversa)
        setConversas(prev => [novaConversa, ...prev])
      }

      // Atualizar IDs das mensagens temporárias
      setMensagens(prev => prev.map(m => {
        if (m.id === msgUsuario.id) {
          return { ...m, id: `user-${Date.now()}`, conversa_id: novaConversaId || '' }
        }
        if (m.id === msgIATemp.id) {
          return { ...m, id: `assistant-${Date.now()}`, conversa_id: novaConversaId || '' }
        }
        return m
      }))

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem'
      setError(message)
      
      // Remover mensagens temporárias em caso de erro
      setMensagens(prev => prev.filter(m => 
        m.id !== msgUsuario.id && m.id !== msgIATemp.id
      ))
      
      console.error('Erro ao enviar mensagem:', err)
    } finally {
      setEnviando(false)
    }
  }, [user?.id, conversaAtual, modo])

  // Nova conversa
  const novaConversa = useCallback(() => {
    setConversaAtual(null)
    setMensagens([])
    setError(null)
  }, [])

  // Deletar conversa
  const deletarConversa = useCallback(async (conversaId: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const res = await fetch(
        `${API_BASE}?conversa_id=${conversaId}&user_id=${user.id}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        throw new Error('Erro ao deletar conversa')
      }

      setConversas(prev => prev.filter(c => c.id !== conversaId))

      if (conversaAtual?.id === conversaId) {
        setConversaAtual(null)
        setMensagens([])
      }

      return true
    } catch (err) {
      console.error('Erro ao deletar conversa:', err)
      return false
    }
  }, [user?.id, conversaAtual])

  // Limpar erro
  const limparErro = useCallback(() => {
    setError(null)
  }, [])

  return {
    conversas,
    conversaAtual,
    mensagens,
    loading,
    enviando,
    error,
    carregarConversas,
    selecionarConversa,
    enviarMensagem,
    novaConversa,
    deletarConversa,
    limparErro
  }
}
```

### ✅ Mudanças Principais

| Item | Antes | Depois |
|------|-------|--------|
| API URL | `/api/ia/chat` | `/api/medicina/ia/chat` |
| Context | `useAuth` | `useMedAuth` |
| Suporte a modo | ❌ | ✅ |
| Streaming | ❌ | ✅ |
| Tratamento de erro | Básico | Completo |

---

## 8. CORREÇÃO: MODELO DE IA POR PLANO

### 📋 Descrição
Atualmente o sistema usa Claude Opus para todos os planos, quando deveria usar:
- **Premium**: Claude Sonnet (mais barato)
- **Residência**: Claude Opus (mais capaz)

### 📁 Arquivo a Modificar
```
app/api/medicina/ia/chat/route.ts
```

### 🔧 Implementação

#### Passo 1: Modificar Seleção de Modelo

No arquivo `app/api/medicina/ia/chat/route.ts`, localizar a função `streamClaude` e modificar:

```typescript
// filepath: app/api/medicina/ia/chat/route.ts

// Antes de streamParams, definir modelo baseado no plano
const modeloPorPlano = {
  gratuito: MODELOS.gemini.flash,    // Se permitido via trial
  premium: MODELOS.claude.sonnet,     // Sonnet para Premium
  residencia: MODELOS.claude.opus     // Opus para Residência
}

const promptPorPlano = {
  gratuito: SYSTEM_PROMPT_PREMIUM,
  premium: SYSTEM_PROMPT_PREMIUM,
  residencia: SYSTEM_PROMPT_RESIDENCIA
}

// Na função streamClaude, usar:
const streamParams: any = {
  model: plano === 'residencia' ? MODELOS.claude.opus : MODELOS.claude.sonnet,
  max_tokens: use_extended_thinking ? 16000 : 8192,
  system: plano === 'residencia' ? SYSTEM_PROMPT_RESIDENCIA : SYSTEM_PROMPT_PREMIUM,
  messages,
  stream: true,
  tools: tools.length > 0 ? tools : undefined
}
```

#### Passo 2: Implementar Roteamento de Modelo

Modificar a lógica principal para escolher entre Claude e Gemini:

```typescript
// filepath: app/api/medicina/ia/chat/route.ts

// No final do POST handler, antes do return
// Escolher modelo baseado no plano
if (plano === 'gratuito') {
  // Gratuito em trial usa Gemini (mais barato)
  return await streamGemini({
    historico,
    mensagem,
    conversa_id: conversaAtual,
    user_id,
    imagem_base64,
    imagem_tipo
  })
} else {
  // Premium e Residência usam Claude (Sonnet ou Opus)
  return await streamClaude({
    historico,
    mensagem,
    conversa_id: conversaAtual,
    user_id,
    plano,
    imagem_base64,
    imagem_tipo,
    pdf_base64,
    use_web_search,
    use_extended_thinking,
    thinking_budget
  })
}
```

#### Passo 3: Atualizar Configuração de Modelos

Verificar/atualizar `lib/ai/config.ts`:

```typescript
// filepath: lib/ai/config.ts
export const MODELOS = {
  claude: {
    opus: 'claude-sonnet-4-20250514',      // Modelo mais capaz
    sonnet: 'claude-sonnet-4-20250514',    // Modelo balanceado
    haiku: 'claude-3-haiku-20240307'       // Modelo mais rápido/barato
  },
  gemini: {
    pro: 'gemini-1.5-pro',
    flash: 'gemini-2.0-flash-exp'          // Mais rápido
  }
}

// Custo por 1M tokens (em USD)
export const CUSTOS_MODELOS = {
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-2.0-flash-exp': { input: 0.075, output: 0.30 }
}
```

### 📊 Resultado: Economia de Custos

| Plano | Modelo Atual | Modelo Correto | Economia |
|-------|--------------|----------------|----------|
| Gratuito (trial) | Opus | Gemini Flash | ~95% |
| Premium | Opus | Sonnet | ~50% |
| Residência | Opus | Opus | 0% |

---

## 9. MELHORIAS DE PERFORMANCE E UX

### 🚀 Performance

#### 9.1 Cache de Conversas com SWR

```typescript
// filepath: hooks/useChatIA.ts (alternativa com SWR)
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useChatConversas(userId: string, modo: string) {
  const { data, error, mutate } = useSWR(
    userId ? `/api/medicina/ia/chat?user_id=${userId}&modo=${modo}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000 // 30 segundos
    }
  )

  return {
    conversas: data?.conversas || [],
    loading: !error && !data,
    error,
    refresh: mutate
  }
}
```

#### 9.2 Debounce na Busca

```typescript
// filepath: hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

#### 9.3 Lazy Loading de Mensagens Antigas

```typescript
// Carregar apenas últimas 20 mensagens inicialmente
// Carregar mais ao scrollar para cima

const [pagina, setPagina] = useState(1)
const MENSAGENS_POR_PAGINA = 20

const carregarMaisMensagens = async () => {
  const res = await fetch(
    `${API_BASE}?conversa_id=${conversaAtual.id}&page=${pagina + 1}&limit=${MENSAGENS_POR_PAGINA}`
  )
  const data = await res.json()
  setMensagens(prev => [...data.mensagens, ...prev])
  setPagina(prev => prev + 1)
}
```

### 🎨 UX

#### 9.4 Skeleton Loading

```typescript
// filepath: components/medicina/ia/ChatSkeleton.tsx
export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-4 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

#### 9.5 Toast Notifications

```typescript
// Usar react-hot-toast para feedback
import toast from 'react-hot-toast'

// Sucesso
toast.success('Mensagem enviada!')

// Erro
toast.error('Não foi possível enviar. Tente novamente.')

// Loading
const toastId = toast.loading('Processando...')
// Depois:
toast.dismiss(toastId)
```

#### 9.6 Indicador de Digitação

```typescript
// filepath: components/medicina/ia/TypingIndicator.tsx
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 p-3">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-white/50 text-sm">IA está pensando...</span>
    </div>
  )
}
```

---

## 10. CHECKLIST DE IMPLEMENTAÇÃO

### 📋 Ordem de Execução Recomendada

Execute as correções na ordem abaixo para evitar conflitos:

#### Fase 1: Infraestrutura (1-2 horas)

- [ ] **1.1** Configurar `OPENAI_API_KEY` na Vercel
- [ ] **1.2** Executar SQL para adicionar coluna `modo` em `conversas_ia_med`
- [ ] **1.3** Fazer redeploy na Vercel

```sql
-- SQL para executar no Supabase
ALTER TABLE conversas_ia_med 
ADD COLUMN IF NOT EXISTS modo text DEFAULT 'tutor';

CREATE INDEX IF NOT EXISTS idx_conversas_ia_med_modo 
ON conversas_ia_med(user_id, modo);
```

#### Fase 2: Correções Críticas (2-3 horas)

- [ ] **2.1** Corrigir API de transcrição de áudio
  - Verificar código em `app/api/medicina/ia/speech/transcribe/route.ts`
  - Adicionar tratamento de erro adequado

- [ ] **2.2** Corrigir hook `useChatIA.ts`
  - Substituir `/api/ia/chat` por `/api/medicina/ia/chat`
  - Adicionar suporte a modo
  - Implementar streaming

- [ ] **2.3** Corrigir seleção de modelo na API
  - Premium = Sonnet
  - Residência = Opus
  - Gratuito (trial) = Gemini Flash

#### Fase 3: Novas Features (3-4 horas)

- [ ] **3.1** Criar componente `GabaritoBlur.tsx`
- [ ] **3.2** Implementar blur na página de questões
- [ ] **3.3** Criar store `chatModeStore.ts`
- [ ] **3.4** Criar componente `ChatTabs.tsx`
- [ ] **3.5** Modificar página de IA para usar abas

#### Fase 4: Testes (1-2 horas)

- [ ] **4.1** Testar transcrição de áudio
- [ ] **4.2** Testar chat em todos os modos
- [ ] **4.3** Testar blur para usuário FREE
- [ ] **4.4** Testar blur desativado durante trial
- [ ] **4.5** Verificar troca de abas preserva histórico

#### Fase 5: Deploy Final

- [ ] **5.1** Commit das mudanças
- [ ] **5.2** Push para repositório
- [ ] **5.3** Deploy na Vercel
- [ ] **5.4** Verificar logs de erro
- [ ] **5.5** Teste em produção

---

### 📊 Resumo de Arquivos a Modificar

| Arquivo | Ação | Prioridade |
|---------|------|------------|
| `.env.local` / Vercel | Adicionar OPENAI_API_KEY | 🔴 P0 |
| `app/api/medicina/ia/speech/transcribe/route.ts` | Corrigir tratamento de erro | 🔴 P0 |
| `hooks/useChatIA.ts` | Reescrever completo | 🟠 P1 |
| `app/api/medicina/ia/chat/route.ts` | Corrigir modelo por plano | 🟠 P1 |
| `components/medicina/questoes/GabaritoBlur.tsx` | Criar novo | 🟠 P1 |
| `app/medicina/(dashboard)/dashboard/questoes/page.tsx` | Adicionar blur | 🟠 P1 |
| `lib/stores/chatModeStore.ts` | Criar novo | 🟡 P2 |
| `components/medicina/ia/ChatTabs.tsx` | Criar novo | 🟡 P2 |
| `app/medicina/(dashboard)/dashboard/ia/page.tsx` | Adicionar abas | 🟡 P2 |

---

### ✅ Critérios de Conclusão

O projeto estará **100% completo** quando:

1. ✅ Áudio/transcrição funcionando sem erros
2. ✅ Chat usando API correta de medicina
3. ✅ Cada plano usando modelo de IA adequado
4. ✅ Gabarito com blur para FREE sem trial
5. ✅ Chat com abas separadas por modo
6. ✅ Todos os testes passando
7. ✅ Deploy em produção sem erros no console

---

## 📞 Suporte

Se encontrar problemas durante a implementação:

1. Verifique os logs na Vercel
2. Execute `node db-query.js list-tables` para verificar banco
3. Teste localmente com `npm run dev`
4. Verifique variáveis de ambiente com `vercel env ls`

---

**Documento gerado em:** 19 de Janeiro de 2026  
**Última atualização:** 19 de Janeiro de 2026  
**Versão:** 1.0