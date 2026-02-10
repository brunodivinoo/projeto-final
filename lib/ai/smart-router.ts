// Smart Router - Roteador Inteligente de Modelos de IA
// Analisa a complexidade da tarefa e roteia para o modelo mais adequado
// Prioriza economia mantendo qualidade

import { PlanoIA, ReasoningEffort, MensagemIA } from './types'
import { MODELOS, MODELO_PROVIDER_MAP } from './config'
import { analisarComplexidade, ComplexityAnalysis, TarefaIA, getModeloPorTarefa } from './complexity-detector'
import {
  streamWithO4Mini,
  streamWithGPT52,
  streamWithGPT4oVision,
  OpenAIStreamChunk,
  OpenAIStreamOptions,
  chatWithOpenAI,
  chatWithStructuredOutput
} from './openai-advanced'
import { streamWithFallback, StreamChunk, MultiProviderOptions } from './multi-provider'
import { SYSTEM_PROMPT_PREMIUM, SYSTEM_PROMPT_RESIDENCIA } from './prompts'

// ==========================================
// TIPOS
// ==========================================

export interface SmartRouterOptions {
  plano: PlanoIA
  mensagem: string
  historico?: MensagemIA[]
  temImagem?: boolean
  temPdf?: boolean
  imagemBase64?: string
  imagemMediaType?: string
  useWebSearch?: boolean
  useExtendedThinking?: boolean
  thinkingBudget?: number
  forceModel?: string // Forcar modelo especifico
  contextoComprimido?: boolean // Quando Serper+Gemini ja comprimiu o contexto → modo montagem (o4-mini)
  onModelSelected?: (model: string, analysis: ComplexityAnalysis) => void
}

export interface SmartRouterResult {
  modelo: string
  provider: 'claude' | 'openai' | 'gemini'
  analysis: ComplexityAnalysis
  reasoningEffort?: ReasoningEffort
  custoEstimado: number
}

export type SmartStreamChunk = StreamChunk | OpenAIStreamChunk

// ==========================================
// FUNCAO PRINCIPAL - SELECIONAR MODELO
// ==========================================

export function selecionarModelo(options: SmartRouterOptions): SmartRouterResult {
  const {
    plano,
    mensagem,
    historico = [],
    temImagem = false,
    temPdf = false,
    useWebSearch = false,
    contextoComprimido = false,
    forceModel
  } = options

  // MODO MONTAGEM: Serper+Gemini já comprimiu o contexto
  // GPT-5.2 organiza a resposta com profundidade (o4-mini era raso demais)
  if (contextoComprimido && !temImagem && !temPdf) {
    console.log('[SmartRouter] MODO MONTAGEM: contexto pré-comprimido → GPT-5.2 (organização detalhada)')
    return {
      modelo: MODELOS.openai.gpt52,
      provider: 'openai' as const,
      analysis: {
        nivel: 'moderada' as const,
        score: 55,
        fatores: ['Contexto pré-comprimido pelo Serper+Gemini Flash', 'GPT-5.2 organiza resposta detalhada e aprofundada'],
        modeloRecomendado: 'gpt-5.2' as const,
        motivo: 'Modo montagem: GPT-5.2 organiza conteúdo web com profundidade e clareza'
      },
      reasoningEffort: 'medium' as ReasoningEffort,
      custoEstimado: estimarCusto(MODELOS.openai.gpt52, 3000)
    }
  }

  // Se modelo foi forcado, usar ele
  if (forceModel) {
    const provider = MODELO_PROVIDER_MAP[forceModel] || 'openai'
    return {
      modelo: forceModel,
      provider,
      analysis: {
        nivel: 'moderada',
        score: 50,
        fatores: ['Modelo forcado pelo usuario'],
        modeloRecomendado: forceModel as 'o4-mini' | 'gpt-5.2' | 'claude-opus',
        motivo: 'Modelo especificado manualmente'
      },
      custoEstimado: 0
    }
  }

  // PRIMEIRA MENSAGEM: SEMPRE GPT-5.2 (conteúdo rico obrigatório)
  if (historico.length === 0) {
    console.log('[SmartRouter] PRIMEIRA MENSAGEM → GPT-5.2 (conteúdo rico obrigatório)')
    const analysis = analisarComplexidade(mensagem, {
      historicoMensagens: 0,
      temImagem,
      temPdf,
      plano: plano === 'gratuito' ? 'premium' : plano
    })
    return {
      modelo: MODELOS.openai.gpt52,
      provider: 'openai' as const,
      analysis: {
        ...analysis,
        modeloRecomendado: 'gpt-5.2' as const,
        motivo: 'Primeira mensagem: GPT-5.2 para conteúdo detalhado e aprofundado'
      },
      reasoningEffort: 'high' as ReasoningEffort,
      custoEstimado: estimarCusto(MODELOS.openai.gpt52, 4000)
    }
  }

  // Analisar complexidade da mensagem
  const analysis = analisarComplexidade(mensagem, {
    historicoMensagens: historico.length,
    temImagem,
    temPdf,
    plano: plano === 'gratuito' ? 'premium' : plano
  })

  // Web search agora é feito via Serper + compressão, não precisa mais de Claude
  // GPT-5.2 monta a resposta com o contexto pré-comprimido
  if (useWebSearch) {
    return {
      modelo: MODELOS.openai.gpt52,
      provider: 'openai' as const,
      analysis: {
        ...analysis,
        modeloRecomendado: 'gpt-5.2' as const,
        motivo: 'Web Search via Serper + montagem GPT-5.2 (economia vs Claude)'
      },
      reasoningEffort: 'medium' as ReasoningEffort,
      custoEstimado: estimarCusto(MODELOS.openai.gpt52, 2000)
    }
  }

  // Mapear modelo recomendado para modelo real
  let modelo: string
  let provider: 'claude' | 'openai' | 'gemini'
  let reasoningEffort: ReasoningEffort | undefined

  switch (analysis.modeloRecomendado) {
    case 'o4-mini':
      modelo = MODELOS.openai.o4Mini
      provider = 'openai'
      reasoningEffort = analysis.reasoningEffort || 'low'
      break

    case 'gpt-5.2':
      modelo = MODELOS.openai.gpt52
      provider = 'openai'
      reasoningEffort = analysis.reasoningEffort || 'medium'
      break

    case 'claude-opus':
      modelo = MODELOS.claude.opus
      provider = 'claude'
      break

    default:
      // Default para o4-mini (mais economico)
      modelo = MODELOS.openai.o4Mini
      provider = 'openai'
      reasoningEffort = 'low'
  }

  // Override para vision - usar gpt-4o
  if (temImagem && provider === 'openai') {
    modelo = MODELOS.openai.gpt4o
  }

  return {
    modelo,
    provider,
    analysis,
    reasoningEffort,
    custoEstimado: estimarCusto(modelo, 2000)
  }
}

// ==========================================
// STREAMING INTELIGENTE
// ==========================================

export async function* streamInteligente(
  options: SmartRouterOptions
): AsyncGenerator<SmartStreamChunk> {
  const {
    plano,
    mensagem,
    historico = [],
    temImagem = false,
    imagemBase64,
    imagemMediaType,
    useWebSearch = false,
    useExtendedThinking = false,
    thinkingBudget = 8000,
    onModelSelected
  } = options

  // Selecionar modelo
  const routerResult = selecionarModelo(options)
  const { modelo, provider, analysis, reasoningEffort } = routerResult

  // Callback para informar modelo selecionado
  onModelSelected?.(modelo, analysis)

  console.log(`[SmartRouter] Modelo selecionado: ${modelo} (${provider})`)
  console.log(`[SmartRouter] Complexidade: ${analysis.nivel} (score: ${analysis.score})`)
  console.log(`[SmartRouter] Motivo: ${analysis.motivo}`)

  // Preparar mensagens
  const messages = historico
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  // Adicionar mensagem atual
  messages.push({ role: 'user', content: mensagem })

  // Selecionar system prompt com detecção de primeira mensagem
  let systemPrompt = plano === 'residencia'
    ? SYSTEM_PROMPT_RESIDENCIA
    : SYSTEM_PROMPT_PREMIUM

  // MODO MONTAGEM: instruir modelo a organizar informações pré-digeridas mantendo formatos obrigatórios
  if (options.contextoComprimido) {
    systemPrompt += `\n\n## MODO MONTAGEM - RESPOSTA BASEADA EM PESQUISA WEB
Você está recebendo informações PESQUISADAS NA WEB de fontes médicas confiáveis (diretrizes brasileiras, PubMed, etc).
Sua função é ORGANIZAR essas informações em uma AULA COMPLETA, detalhada e aprofundada para o estudante.

### COMO MONTAR A RESPOSTA (DETALHADA E APROFUNDADA):
1. **COMECE com resposta DIRETA** - 1-3 linhas respondendo a pergunta principal
2. **APROFUNDE com parágrafos explicativos** - Escreva textos COMPLETOS, não apenas bullets. O estudante precisa de texto corrido para anotar e estudar. Mínimo 3-5 parágrafos densos de conteúdo.
3. **ORGANIZE por seções claras** - Use ### títulos numerados para cada aspecto (Definição, Classificação, Fisiopatologia, Diagnóstico, Tratamento, etc.)
4. **USE TABELAS para comparações** - NUNCA compare coisas em texto corrido, use tabela. SEMPRE com linha em branco antes e depois.
5. **EXPLIQUE cada conceito** - Não apenas liste, EXPLIQUE com detalhes, exemplos práticos e correlações clínicas
6. **CITE as fontes inline** - Use [1], [2], [3] no texto E liste fontes no final
7. **COMPLEMENTE o contexto web com seu conhecimento médico** - As fontes web trazem dados; você deve EXPANDIR com explicações didáticas de livros-texto (Harrison, Cecil, Sabiston)
8. **Se os dados não cobrem algo, COMPLEMENTE** - Use conhecimento de livros-texto e indique: "Segundo Harrison (2020)..."
9. **GERE IMAGENS contextuais** - Use [IMAGE_SEARCH: termo específico médico] em PELO MENOS 5 pontos diferentes do texto, sempre DENTRO do contexto da explicação
10. **NUNCA seja raso** - Cada seção deve ter no MÍNIMO 2-3 parágrafos. O estudante precisa de material COMPLETO para estudar.

⚠️ REGRAS OBRIGATÓRIAS MESMO NO MODO MONTAGEM:

### QUESTÕES - FORMATO OBRIGATÓRIO:
Se gerar questões, SEMPRE use o formato \`\`\`questao com JSON estruturado.
NUNCA gere questões como texto puro markdown (com "A)", "B)", "Gabarito:").
Formato exato:
\`\`\`questao
{
  "numero": 1,
  "tipo": "multipla_escolha",
  "dificuldade": "medio",
  "disciplina": "Nome",
  "assunto": "Assunto",
  "enunciado": "Texto do enunciado",
  "alternativas": [
    {"letra": "A", "texto": "..."},
    {"letra": "B", "texto": "..."},
    {"letra": "C", "texto": "..."},
    {"letra": "D", "texto": "..."},
    {"letra": "E", "texto": "..."}
  ],
  "gabarito_comentado": {
    "resposta_correta": "C",
    "explicacao_geral": "...",
    "analise_alternativas": [
      {"letra": "A", "correta": false, "analise": "..."},
      {"letra": "B", "correta": false, "analise": "..."},
      {"letra": "C", "correta": true, "analise": "..."},
      {"letra": "D", "correta": false, "analise": "..."},
      {"letra": "E", "correta": false, "analise": "..."}
    ],
    "ponto_chave": "...",
    "dica_memorizacao": "...",
    "referencias": ["SOBRENOME. Título. Ed. Editora, Ano. (Assunto)"]
  }
}
\`\`\`

### FONTES E REFERÊNCIAS - OBRIGATÓRIO EM TODA RESPOSTA:
TODA resposta DEVE ter citações inline [1], [2], [3] no texto E uma seção de fontes ao final:
📚 **Fontes:**
[1] AUTOR. Título. Ed. Editora, Ano.
[2] DIRETRIZ/SOCIEDADE. Título. Revista, Ano.
Use as fontes do contexto comprimido + livros-texto de referência (Harrison, Cecil, Sabiston, etc).
Se o contexto trouxer fontes, MANTENHA e CITE-AS. Se não trouxer, cite livros-texto relevantes.`
  }

  // Primeira mensagem: injetar instrução de resposta rica
  if (historico.length === 0) {
    systemPrompt += `\n\n<first_message_context>
ATENÇÃO: Esta é a PRIMEIRA MENSAGEM do usuário neste chat novo.
Siga OBRIGATORIAMENTE a regra de PRIMEIRA MENSAGEM - TODOS obrigatórios:
1. Texto DETALHADO e APROFUNDADO (mín. 5-7 parágrafos densos de conteúdo)
2. MÍNIMO 5 marcadores [IMAGE_SEARCH: termo médico específico] DIFERENTES em pontos contextuais do texto
3. 5 flashcards (\`\`\`flashcards:Título) com JSON
4. 1 fluxograma Mermaid (\`\`\`mermaid) + 1 organograma (\`\`\`tree:Título)
5. 2-3 questões em formato \`\`\`questao JSON (com referências ABNT no gabarito)
6. Referências ABNT ao final (diretrizes brasileiras + livros-texto)
7. No final: oferecer questões, flashcards, fluxograma, organograma, diagrama, mais imagens

⚠️ IMAGENS: Use [IMAGE_SEARCH: termo] DENTRO do texto, no ponto onde a imagem faz sentido contextual.
Exemplo: "O coração possui 4 câmaras [IMAGE_SEARCH: anatomia coração câmaras cardíacas]..."
NUNCA use termos genéricos como "estudante medicina". Use termos MÉDICOS ESPECÍFICOS.
Termos bons: "anatomia coração válvulas", "eletrocardiograma normal ECG", "classificação hipertensão tabela"
Termos ruins: "pessoa estudando", "livro medicina", "hospital"
</first_message_context>`
  } else {
    systemPrompt += `\n\n<followup_context>
OBRIGATÓRIO em TODA resposta:
- MÍNIMO 3 marcadores [IMAGE_SEARCH: termo médico específico] em pontos contextuais
- Fontes ABNT ao final
- Oferta de recursos no final
- Respostas DETALHADAS e APROFUNDADAS (mín. 3 parágrafos)
</followup_context>`
  }

  // Reforço de regras para modelos OpenAI
  if (provider === 'openai') {
    systemPrompt += `\n\n## REGRAS CRÍTICAS (NUNCA IGNORE):
1. Questões: SEMPRE use \`\`\`questao com JSON. NUNCA texto puro com A), B), C).
2. Fontes: TODA resposta DEVE terminar com seção 📚 **Fontes:** com citações ABNT [1], [2], [3].
3. Citações inline: use [1], [2] no texto para indicar a fonte de cada afirmação.
4. Tabelas: SEMPRE linha em branco antes e depois. NUNCA junte cabeçalho com título.
5. Imagens: use [IMAGE_SEARCH: termo médico específico] DENTRO do texto contextual. NUNCA termos genéricos.
6. Profundidade: EXPLIQUE cada conceito com detalhes. NUNCA seja raso ou superficial. O estudante precisa de material COMPLETO.`
  }

  // Rotear para provider correto
  if (provider === 'openai') {
    const openaiOptions: OpenAIStreamOptions = {
      plano,
      model: modelo,
      reasoningEffort,
      maxTokens: 16384 // Sempre dar espaço para respostas completas e detalhadas
    }

    // Streaming com imagem
    if (temImagem && imagemBase64 && imagemMediaType) {
      yield* streamWithGPT4oVision(
        messages,
        systemPrompt,
        imagemBase64,
        imagemMediaType,
        openaiOptions
      )
      return
    }

    // Streaming com gpt-5.2 (raciocinio avancado)
    if (modelo === MODELOS.openai.gpt52) {
      yield* streamWithGPT52(messages, systemPrompt, openaiOptions)
      return
    }

    // Streaming com o4-mini (rapido e economico)
    yield* streamWithO4Mini(messages, systemPrompt, openaiOptions)
    return
  }

  // Fallback para multi-provider (Gemini + Claude como último recurso)
  // Usado apenas se OpenAI falhar completamente
  const fallbackOptions: MultiProviderOptions = {
    plano: plano === 'gratuito' ? 'premium' : plano,
    useWebSearch: false, // Serper já fez a busca
    useExtendedThinking: useExtendedThinking,
    thinkingBudget,
    maxTokens: plano === 'residencia' ? 16384 : 8192
  }

  yield* streamWithFallback(messages, fallbackOptions)
}

// ==========================================
// FUNCOES AUXILIARES PARA TAREFAS ESPECIFICAS
// ==========================================

/**
 * Chat simples - usa o4-mini para economia
 */
export async function* chatSimples(
  mensagem: string,
  historico: MensagemIA[] = [],
  plano: PlanoIA = 'premium'
): AsyncGenerator<OpenAIStreamChunk> {
  const systemPrompt = plano === 'residencia'
    ? SYSTEM_PROMPT_RESIDENCIA
    : SYSTEM_PROMPT_PREMIUM

  const messages = historico
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  messages.push({ role: 'user', content: mensagem })

  yield* streamWithO4Mini(messages, systemPrompt, {
    plano,
    reasoningEffort: 'low',
    maxTokens: 4096
  })
}

/**
 * Chat complexo - usa gpt-5.2 para raciocinio
 */
export async function* chatComplexo(
  mensagem: string,
  historico: MensagemIA[] = [],
  plano: PlanoIA = 'residencia'
): AsyncGenerator<OpenAIStreamChunk> {
  const systemPrompt = plano === 'residencia'
    ? SYSTEM_PROMPT_RESIDENCIA
    : SYSTEM_PROMPT_PREMIUM

  const messages = historico
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  messages.push({ role: 'user', content: mensagem })

  yield* streamWithGPT52(messages, systemPrompt, {
    plano,
    reasoningEffort: 'high',
    maxTokens: 16384
  })
}

/**
 * Chat com pesquisa web - usa Claude Opus
 */
export async function* chatComPesquisa(
  mensagem: string,
  historico: MensagemIA[] = [],
  plano: PlanoIA = 'residencia'
): AsyncGenerator<StreamChunk> {
  const messages = historico
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  messages.push({ role: 'user', content: mensagem })

  yield* streamWithFallback(messages, {
    plano: plano === 'gratuito' ? 'premium' : plano,
    useWebSearch: true,
    maxTokens: 16384
  })
}

/**
 * Chat com resposta estruturada (citacoes)
 */
export async function chatEstruturado(
  mensagem: string,
  historico: MensagemIA[] = [],
  plano: PlanoIA = 'residencia'
) {
  const mensagens: MensagemIA[] = [
    ...historico,
    { role: 'user', content: mensagem }
  ]

  return chatWithStructuredOutput(mensagens, { plano })
}

// ==========================================
// ESTIMATIVA DE CUSTO
// ==========================================

function estimarCusto(modelo: string, tokensEstimados: number): number {
  const precos: Record<string, { input: number; output: number }> = {
    'o4-mini': { input: 1.10 / 1_000_000, output: 4.40 / 1_000_000 },
    'gpt-5.2': { input: 2.50 / 1_000_000, output: 10.00 / 1_000_000 },
    'gpt-4o': { input: 2.50 / 1_000_000, output: 10.00 / 1_000_000 },
    'claude-opus-4-5-20251101': { input: 5.00 / 1_000_000, output: 25.00 / 1_000_000 },
    'claude-sonnet-4-20250514': { input: 3.00 / 1_000_000, output: 15.00 / 1_000_000 }
  }

  const preco = precos[modelo] || precos['o4-mini']
  return (tokensEstimados * preco.input) + (tokensEstimados * preco.output)
}

// ==========================================
// FUNCAO PARA OBTER STATS DE ROTEAMENTO
// ==========================================

export interface RoutingStats {
  totalRequests: number
  byModel: Record<string, number>
  byComplexity: Record<string, number>
  custoTotal: number
  economiaVsOpus: number
}

// Cache em memoria para stats (em producao usar Redis)
const routingStats: RoutingStats = {
  totalRequests: 0,
  byModel: {},
  byComplexity: {},
  custoTotal: 0,
  economiaVsOpus: 0
}

export function registrarRoteamento(
  modelo: string,
  complexidade: string,
  custo: number
) {
  routingStats.totalRequests++
  routingStats.byModel[modelo] = (routingStats.byModel[modelo] || 0) + 1
  routingStats.byComplexity[complexidade] = (routingStats.byComplexity[complexidade] || 0) + 1
  routingStats.custoTotal += custo

  // Calcular economia vs usar Opus para tudo
  const custoOpus = custo * (25 / 4.4) // aproximacao
  routingStats.economiaVsOpus += (custoOpus - custo)
}

export function getRoutingStats(): RoutingStats {
  return { ...routingStats }
}

export function resetRoutingStats() {
  routingStats.totalRequests = 0
  routingStats.byModel = {}
  routingStats.byComplexity = {}
  routingStats.custoTotal = 0
  routingStats.economiaVsOpus = 0
}

// ==========================================
// EXPORTS
// ==========================================

export default streamInteligente
