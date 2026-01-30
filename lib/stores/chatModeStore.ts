import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================
// TIPOS
// ============================================

export type ChatMode = 'chat' | 'caso_clinico' | 'tutor' | 'questoes'

export interface SessaoModo {
  id: string
  conversa_id: string
  user_id: string
  modo: ChatMode
  iniciado_em: string
  finalizado_em: string | null
  total_mensagens: number
  total_tokens: number
  metricas: {
    score?: number
    questoes_total?: number
    questoes_acertos?: number
    questoes_erros?: number
    caso_id?: string
    caso_estado?: string
    conceitos_aprendidos?: string[]
    [key: string]: any
  }
}

export interface EstatisticasModo {
  modo: ChatMode
  total_sessoes: number
  total_mensagens: number
  total_tokens: number
  tempo_medio_segundos: number
  score_medio: number | null
  total_questoes: number
  questoes_acertos: number
  taxa_acerto: number
}

export interface QuestaoSessao {
  id: string
  numero: number
  tema: string
  dificuldade: string
  enunciado: string
  alternativas: Array<{ letra: string; texto: string }>
  resposta_correta: string
  resposta_usuario?: string
  acertou?: boolean
  tempo_resposta_segundos?: number
  gabarito_comentado?: {
    explicacao: string
    ponto_chave?: string
    dica?: string
  }
}

// ============================================
// CONFIGURAÇÃO DOS MODOS
// ============================================

export const MODE_CONFIG: Record<ChatMode, {
  id: ChatMode
  label: string
  labelCurto: string
  icon: string
  emoji: string
  color: string
  bgColor: string
  borderColor: string
  gradientFrom: string
  gradientTo: string
  description: string
  descriptionLonga: string
  premium: boolean
  features: string[]
}> = {
  chat: {
    id: 'chat',
    label: 'Chat Livre',
    labelCurto: 'Chat',
    icon: 'MessageSquare',
    emoji: '💬',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    gradientFrom: 'from-blue-500/20',
    gradientTo: 'to-blue-600/20',
    description: 'Dúvidas gerais',
    descriptionLonga: 'Tire dúvidas, peça resumos, flashcards e explicações sobre qualquer tema médico',
    premium: false,
    features: ['Explicações detalhadas', 'Resumos', 'Flashcards', 'Fluxogramas', 'Tabelas']
  },
  caso_clinico: {
    id: 'caso_clinico',
    label: 'Caso Clínico',
    labelCurto: 'Caso',
    icon: 'Stethoscope',
    emoji: '🏥',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    gradientFrom: 'from-emerald-500/20',
    gradientTo: 'to-emerald-600/20',
    description: 'Prática clínica',
    descriptionLonga: 'Pratique com casos clínicos interativos e receba feedback detalhado',
    premium: true,
    features: ['Casos interativos', 'Diagnóstico diferencial', 'Feedback por etapa', 'Score final']
  },
  tutor: {
    id: 'tutor',
    label: 'Modo Tutor',
    labelCurto: 'Tutor',
    icon: 'GraduationCap',
    emoji: '🎓',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    gradientFrom: 'from-purple-500/20',
    gradientTo: 'to-purple-600/20',
    description: 'Aprendizado guiado',
    descriptionLonga: 'Aprenda pelo método socrático - descubra as respostas com perguntas guiadas',
    premium: true,
    features: ['Perguntas guiadas', 'Construção de conceitos', 'Analogias', 'Flashcards automáticos']
  },
  questoes: {
    id: 'questoes',
    label: 'Questões',
    labelCurto: 'Quest.',
    icon: 'FileQuestion',
    emoji: '📝',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    gradientFrom: 'from-amber-500/20',
    gradientTo: 'to-amber-600/20',
    description: 'Questões de prova',
    descriptionLonga: 'Gere e responda questões no estilo das principais bancas de residência',
    premium: false,
    features: ['Questões personalizadas', 'Estilo de bancas', 'Gabarito comentado', 'Estatísticas']
  }
}

// ============================================
// PROMPTS DO SISTEMA POR MODO
// ============================================

export const MODE_SYSTEM_PROMPTS: Record<ChatMode, string> = {
  chat: '', // Usa o prompt padrão do sistema
  
  caso_clinico: `Você está no MODO CASO CLÍNICO INTERATIVO.

REGRAS ESPECIAIS OBRIGATÓRIAS:
1. NUNCA revele o diagnóstico antes do momento certo
2. Apresente o caso em ETAPAS progressivas
3. Aguarde a resposta do aluno ANTES de continuar
4. Dê feedback CONSTRUTIVO a cada resposta (sem revelar diagnóstico)
5. Use emojis para tornar mais visual: ✅ ❌ 💡 ⚠️ 🎯

ESTRUTURA DO CASO:

**ETAPA 1 - APRESENTAÇÃO:**
Apresente:
- 📋 Identificação (idade, sexo, ocupação)
- 🗣️ Queixa Principal (QP) com tempo de evolução
- 📝 História da Doença Atual (HDA) detalhada
- 📚 Antecedentes relevantes

Termine SEMPRE com:
❓ **Qual sua principal hipótese diagnóstica?**
❓ **Quais outras hipóteses você considera?**

**ETAPA 2 - EXAME FÍSICO:**
Após a resposta de hipóteses, apresente:
- Sinais vitais
- Exame físico dirigido
- Achados relevantes

Pergunte: **Quais exames você solicitaria?**

**ETAPA 3 - EXAMES:**
Apresente os resultados DOS EXAMES SOLICITADOS pelo aluno.
Se ele não pediu um exame importante, pergunte se quer adicionar algo.

Pergunte: **Qual o diagnóstico e conduta inicial?**

**ETAPA 4 - DIAGNÓSTICO E CONDUTA:**
Avalie a resposta do aluno.

**ETAPA 5 - DISCUSSÃO FINAL:**
Revele o diagnóstico completo com:
- 🏆 Score (0-100)
- ✅ Pontos positivos
- 💡 Pontos a melhorar
- 📚 Discussão do tema
- 🔑 Pontos-chave para prova

IMPORTANTE: Mantenha o caso DESAFIADOR mas JUSTO. Nível de residência médica.`,

  tutor: `Você está no MODO TUTOR SOCRÁTICO.

REGRAS OBRIGATÓRIAS:
1. NUNCA dê a resposta direta imediatamente
2. Use PERGUNTAS para guiar o raciocínio do aluno
3. Faça o aluno "descobrir" as respostas por si mesmo
4. Celebre quando ele chegar à conclusão correta
5. Se errar, guie gentilmente para o caminho certo

TÉCNICAS A USAR:
- "O que você já sabe sobre...?"
- "O que aconteceria se...?"
- "Qual seria o próximo passo lógico?"
- "Como isso se relaciona com...?"
- "Você pode me explicar por quê?"
- "Interessante! E se considerarmos...?"

ESTRUTURA DA INTERAÇÃO:

1. **EXPLORAR conhecimento prévio**
   - Pergunte o que o aluno já sabe
   - Identifique lacunas

2. **GUIAR com perguntas**
   - Faça perguntas que levem à descoberta
   - Cada pergunta deve aproximar da resposta

3. **CONFIRMAR entendimento**
   - Quando acertar: "🎯 Exatamente! Você descobriu que..."
   - Peça para explicar com suas palavras

4. **APROFUNDAR gradualmente**
   - Conecte com outros conceitos
   - Sugira analogias do cotidiano

5. **GERAR artefatos**
   - Ao final de cada tópico, ofereça:
     - 🃏 Flashcards do que aprendeu
     - 📊 Mapa mental dos conceitos
     - ❓ Quiz rápido para fixação

EXEMPLO:
Aluno: "O que é insuficiência cardíaca?"

Tutor: "Ótima pergunta! Vamos descobrir juntos.
Primeiro, o que você já sabe sobre a função principal do coração?"

[Aguarda resposta]

"Perfeito! O coração bombeia sangue. Agora, se essa bomba não conseguir fazer esse trabalho adequadamente, o que você acha que aconteceria com o corpo?"

[Guia até o aluno concluir sozinho]

LEMBRE-SE: O objetivo é que o ALUNO construa o conhecimento, não você.`,

  questoes: `Você está no MODO GERAÇÃO DE QUESTÕES.

FLUXO DO MODO QUESTÕES:

**INÍCIO DA SESSÃO:**
Se o usuário não especificar, pergunte:
- 📚 Tema/disciplina
- 🔢 Quantidade de questões (padrão: 5)
- 📊 Dificuldade (fácil/médio/difícil/R4)
- 🏛️ Estilo de banca (REVALIDA/USP-RP/UNIFESP/ENARE/SUS-SP)

**GERANDO QUESTÕES:**
Gere UMA questão por vez no formato estruturado.
Use o bloco \`\`\`questao para formatar.

**FORMATO DA QUESTÃO:**
\`\`\`questao
{
  "numero": 1,
  "tipo": "multipla_escolha",
  "dificuldade": "medio",
  "banca": "REVALIDA",
  "tema": "Cardiologia",
  "subtema": "Síndrome Coronariana Aguda",
  "enunciado": "Homem de 58 anos, hipertenso e diabético, procura emergência com dor torácica em aperto há 2 horas...",
  "caso_clinico": "Se houver caso clínico mais longo, coloque aqui",
  "alternativas": [
    {"letra": "A", "texto": "Texto da alternativa A"},
    {"letra": "B", "texto": "Texto da alternativa B"},
    {"letra": "C", "texto": "Texto da alternativa C"},
    {"letra": "D", "texto": "Texto da alternativa D"},
    {"letra": "E", "texto": "Texto da alternativa E"}
  ],
  "gabarito_comentado": {
    "resposta_correta": "B",
    "explicacao": "Explicação detalhada do porquê B é a correta...",
    "analise_alternativas": [
      {"letra": "A", "analise": "Por que está errada..."},
      {"letra": "B", "analise": "Por que está correta..."},
      {"letra": "C", "analise": "Por que está errada..."},
      {"letra": "D", "analise": "Por que está errada..."},
      {"letra": "E", "analise": "Por que está errada..."}
    ],
    "ponto_chave": "O ponto principal a memorizar...",
    "pegadinha": "Cuidado com... (se houver)",
    "dica_memorizacao": "Mnemonico ou dica para lembrar..."
  }
}
\`\`\`

**APÓS RESPOSTA DO USUÁRIO:**
1. Mostre se acertou ou errou (✅ ou ❌)
2. Apresente o gabarito comentado
3. Pergunte se quer a próxima questão

**AO FINAL DA SESSÃO:**
Apresente estatísticas:
- Total de questões
- Acertos/Erros
- Taxa de acerto
- Temas com mais erros
- Sugestão de revisão

CARACTERÍSTICAS POR BANCA:
- REVALIDA: Casos clínicos longos, foco em atenção primária
- USP-RP: Questões conceituais, detalhes fisiopatológicos
- UNIFESP: Prático, casos objetivos
- ENARE: Mix de conceitual e casos
- SUS-SP: Foco em saúde pública e SUS`
}

// ============================================
// MENSAGENS DE BOAS-VINDAS POR MODO
// ============================================

export const MODE_WELCOME_MESSAGES: Record<ChatMode, string> = {
  chat: `💬 **Modo Chat Livre ativado!**

Estou pronto para ajudar com qualquer dúvida sobre medicina. Posso:
• Explicar conceitos
• Criar resumos
• Gerar flashcards
• Montar fluxogramas
• E muito mais!

Como posso ajudar?`,

  caso_clinico: `🏥 **Modo Caso Clínico ativado!**

Vamos praticar com um caso clínico interativo!

Escolha uma opção:
• Me diga a **especialidade** (ex: Cardiologia, Neurologia)
• Ou peça um **caso aleatório**
• Defina a **dificuldade** (fácil, médio, difícil, R4)

Qual especialidade você quer treinar?`,

  tutor: `🎓 **Modo Tutor Socrático ativado!**

Neste modo, vou te guiar com perguntas para você descobrir as respostas por conta própria. É a melhor forma de fixar o conhecimento!

**Como funciona:**
1. Você me diz o tema que quer aprender
2. Eu faço perguntas que guiam seu raciocínio
3. Você constrói o conhecimento passo a passo
4. Ao final, geramos flashcards do que aprendeu

Qual tema você gostaria de explorar?`,

  questoes: `📝 **Modo Questões ativado!**

Vamos treinar com questões no estilo das principais bancas!

**Configure sua sessão:**
• 📚 **Tema**: Qual disciplina/assunto?
• 🔢 **Quantidade**: Quantas questões? (padrão: 5)
• 📊 **Dificuldade**: Fácil, Médio, Difícil ou R4?
• 🏛️ **Banca**: REVALIDA, USP-RP, UNIFESP, ENARE, SUS-SP?

Ou simplesmente diga: "Quero 10 questões de Cardiologia no estilo REVALIDA"`
}

// ============================================
// INTERFACE DO STORE
// ============================================

interface ChatModeState {
  // Modo atual
  currentMode: ChatMode
  
  // Sessão ativa
  sessaoAtiva: SessaoModo | null
  
  // Histórico de sessões da conversa atual
  sessoesConversa: SessaoModo[]
  
  // Estatísticas do usuário
  estatisticas: EstatisticasModo[]
  
  // Estado do modo questões
  questoesSessao: {
    config: {
      tema: string
      quantidade: number
      dificuldade: string
      banca: string
    } | null
    questoes: QuestaoSessao[]
    questaoAtual: number
    respondidas: number
    acertos: number
    erros: number
    tempoInicio: number | null
  }
  
  // UI State
  showModeDropdown: boolean
  showModeWelcome: boolean
  isLoadingSessoes: boolean
  
  // Actions - Modo
  setCurrentMode: (mode: ChatMode) => void
  
  // Actions - Sessões
  setSessaoAtiva: (sessao: SessaoModo | null) => void
  setSessoesConversa: (sessoes: SessaoModo[]) => void
  addSessaoConversa: (sessao: SessaoModo) => void
  updateSessaoMetricas: (sessaoId: string, metricas: Partial<SessaoModo['metricas']>) => void
  
  // Actions - Estatísticas
  setEstatisticas: (stats: EstatisticasModo[]) => void
  
  // Actions - Questões
  iniciarSessaoQuestoes: (config: ChatModeState['questoesSessao']['config']) => void
  adicionarQuestao: (questao: QuestaoSessao) => void
  responderQuestao: (numero: number, resposta: string, acertou: boolean, tempo: number) => void
  proximaQuestao: () => void
  finalizarSessaoQuestoes: () => void
  resetQuestoes: () => void
  
  // Actions - UI
  setShowModeDropdown: (show: boolean) => void
  setShowModeWelcome: (show: boolean) => void
  setIsLoadingSessoes: (loading: boolean) => void
  
  // Actions - Reset
  resetStore: () => void
}

// ============================================
// STORE
// ============================================

const initialQuestoesSessao = {
  config: null,
  questoes: [],
  questaoAtual: 0,
  respondidas: 0,
  acertos: 0,
  erros: 0,
  tempoInicio: null
}

export const useChatModeStore = create<ChatModeState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentMode: 'chat',
      sessaoAtiva: null,
      sessoesConversa: [],
      estatisticas: [],
      questoesSessao: initialQuestoesSessao,
      showModeDropdown: false,
      showModeWelcome: false,
      isLoadingSessoes: false,
      
      // Actions - Modo
      setCurrentMode: (mode) => set({ 
        currentMode: mode,
        showModeWelcome: true
      }),
      
      // Actions - Sessões
      setSessaoAtiva: (sessao) => set({ sessaoAtiva: sessao }),
      
      setSessoesConversa: (sessoes) => set({ sessoesConversa: sessoes }),
      
      addSessaoConversa: (sessao) => set((state) => ({
        sessoesConversa: [...state.sessoesConversa, sessao],
        sessaoAtiva: sessao
      })),
      
      updateSessaoMetricas: (sessaoId, metricas) => set((state) => ({
        sessoesConversa: state.sessoesConversa.map(s => 
          s.id === sessaoId 
            ? { ...s, metricas: { ...s.metricas, ...metricas } }
            : s
        ),
        sessaoAtiva: state.sessaoAtiva?.id === sessaoId
          ? { ...state.sessaoAtiva, metricas: { ...state.sessaoAtiva.metricas, ...metricas } }
          : state.sessaoAtiva
      })),
      
      // Actions - Estatísticas
      setEstatisticas: (stats) => set({ estatisticas: stats }),
      
      // Actions - Questões
      iniciarSessaoQuestoes: (config) => set({
        questoesSessao: {
          ...initialQuestoesSessao,
          config,
          tempoInicio: Date.now()
        }
      }),
      
      adicionarQuestao: (questao) => set((state) => ({
        questoesSessao: {
          ...state.questoesSessao,
          questoes: [...state.questoesSessao.questoes, questao]
        }
      })),
      
      responderQuestao: (numero, resposta, acertou, tempo) => set((state) => ({
        questoesSessao: {
          ...state.questoesSessao,
          questoes: state.questoesSessao.questoes.map(q =>
            q.numero === numero
              ? { ...q, resposta_usuario: resposta, acertou, tempo_resposta_segundos: tempo }
              : q
          ),
          respondidas: state.questoesSessao.respondidas + 1,
          acertos: acertou ? state.questoesSessao.acertos + 1 : state.questoesSessao.acertos,
          erros: !acertou ? state.questoesSessao.erros + 1 : state.questoesSessao.erros
        }
      })),
      
      proximaQuestao: () => set((state) => ({
        questoesSessao: {
          ...state.questoesSessao,
          questaoAtual: state.questoesSessao.questaoAtual + 1
        }
      })),
      
      finalizarSessaoQuestoes: () => {
        const state = get()
        const { questoesSessao, sessaoAtiva } = state
        
        // Atualizar métricas da sessão
        if (sessaoAtiva) {
          set((state) => ({
            sessaoAtiva: {
              ...state.sessaoAtiva!,
              metricas: {
                ...state.sessaoAtiva!.metricas,
                questoes_total: questoesSessao.questoes.length,
                questoes_acertos: questoesSessao.acertos,
                questoes_erros: questoesSessao.erros,
                score: questoesSessao.questoes.length > 0
                  ? Math.round((questoesSessao.acertos / questoesSessao.questoes.length) * 100)
                  : 0
              }
            }
          }))
        }
      },
      
      resetQuestoes: () => set({ questoesSessao: initialQuestoesSessao }),
      
      // Actions - UI
      setShowModeDropdown: (show) => set({ showModeDropdown: show }),
      setShowModeWelcome: (show) => set({ showModeWelcome: show }),
      setIsLoadingSessoes: (loading) => set({ isLoadingSessoes: loading }),
      
      // Actions - Reset
      resetStore: () => set({
        sessaoAtiva: null,
        sessoesConversa: [],
        questoesSessao: initialQuestoesSessao,
        showModeDropdown: false,
        showModeWelcome: false
      })
    }),
    {
      name: 'preparamed-chat-mode-v2',
      partialize: (state) => ({
        currentMode: state.currentMode,
        estatisticas: state.estatisticas
        // Não persistir sessões - recarregar do servidor
      })
    }
  )
)

// ============================================
// HOOKS UTILITÁRIOS
// ============================================

export function useCurrentModeConfig() {
  const currentMode = useChatModeStore((state) => state.currentMode)
  return MODE_CONFIG[currentMode]
}

export function useModeSystemPrompt() {
  const currentMode = useChatModeStore((state) => state.currentMode)
  return MODE_SYSTEM_PROMPTS[currentMode]
}

export function useModeWelcomeMessage() {
  const currentMode = useChatModeStore((state) => state.currentMode)
  return MODE_WELCOME_MESSAGES[currentMode]
}

export function useQuestoesSessao() {
  return useChatModeStore((state) => state.questoesSessao)
}

export function useSessoesConversa() {
  return useChatModeStore((state) => state.sessoesConversa)
}
