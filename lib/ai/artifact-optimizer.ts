// Artifact Optimizer - Otimizacao de Geracao de Artefatos
// Usa modelos OpenAI especificos para cada tipo de artefato
// o4-mini: flashcards, resumos (tarefas estruturadas)
// gpt-5.2: questoes, simulados (requer raciocinio)

import {
  gerarFlashcardsComOpenAI,
  gerarQuestoesComOpenAI,
  FlashcardGenerated,
  QuestaoGenerated
} from './openai-advanced'

// ==========================================
// TIPOS
// ==========================================

export interface ArtefatoConfig {
  tipo: 'flashcard' | 'questao' | 'resumo' | 'simulado' | 'plano_estudos'
  tema: string
  quantidade: number
  contexto?: string
  opcoes?: {
    dificuldade?: 'facil' | 'medio' | 'dificil' | 'misto'
    estilo?: string
    incluirExplicacao?: boolean
    incluirImagens?: boolean
  }
}

export interface ArtefatoResult {
  tipo: ArtefatoConfig['tipo']
  dados: FlashcardGenerated[] | QuestaoGenerated[] | string
  modelo_usado: string
  tokens: { input: number; output: number }
  custo_estimado: number
  tempo_ms: number
}

// ==========================================
// MAPEAMENTO DE MODELO POR ARTEFATO
// ==========================================

export const MODELO_POR_ARTEFATO = {
  flashcard: {
    modelo: 'o4-mini',
    reasoningEffort: 'low' as const,
    motivo: 'Flashcards sao estruturados e nao requerem raciocinio complexo'
  },
  questao: {
    modelo: 'gpt-5.2',
    reasoningEffort: 'high' as const,
    motivo: 'Questoes precisam de raciocinio para criar distratores plausíveis'
  },
  resumo: {
    modelo: 'o4-mini',
    reasoningEffort: 'medium' as const,
    motivo: 'Resumos sao extracao de informacao, nao criacao'
  },
  simulado: {
    modelo: 'gpt-5.2',
    reasoningEffort: 'high' as const,
    motivo: 'Simulados sao conjuntos de questoes que precisam de coerencia'
  },
  plano_estudos: {
    modelo: 'o4-mini',
    reasoningEffort: 'medium' as const,
    motivo: 'Planos sao organizacao de conteudo, nao criacao complexa'
  }
}

// ==========================================
// FUNCAO PRINCIPAL - GERAR ARTEFATO
// ==========================================

export async function gerarArtefato(config: ArtefatoConfig): Promise<ArtefatoResult> {
  const startTime = Date.now()
  const modeloConfig = MODELO_POR_ARTEFATO[config.tipo]

  console.log(`[ArtifactOptimizer] Gerando ${config.tipo} com ${modeloConfig.modelo}`)
  console.log(`[ArtifactOptimizer] Motivo: ${modeloConfig.motivo}`)

  let resultado: ArtefatoResult

  switch (config.tipo) {
    case 'flashcard':
      resultado = await gerarFlashcards(config, startTime)
      break

    case 'questao':
      resultado = await gerarQuestoes(config, startTime)
      break

    case 'simulado':
      resultado = await gerarSimulado(config, startTime)
      break

    case 'resumo':
      resultado = await gerarResumo(config, startTime)
      break

    case 'plano_estudos':
      resultado = await gerarPlanoEstudos(config, startTime)
      break

    default:
      throw new Error(`Tipo de artefato nao suportado: ${config.tipo}`)
  }

  console.log(`[ArtifactOptimizer] Artefato gerado em ${resultado.tempo_ms}ms`)
  console.log(`[ArtifactOptimizer] Tokens: input=${resultado.tokens.input}, output=${resultado.tokens.output}`)
  console.log(`[ArtifactOptimizer] Custo estimado: $${resultado.custo_estimado.toFixed(4)}`)

  return resultado
}

// ==========================================
// GERADORES ESPECIFICOS
// ==========================================

async function gerarFlashcards(
  config: ArtefatoConfig,
  startTime: number
): Promise<ArtefatoResult> {
  const flashcards = await gerarFlashcardsComOpenAI(
    config.tema,
    config.quantidade,
    config.contexto
  )

  const tempo = Date.now() - startTime

  // Estimar tokens (aproximado)
  const tokensInput = Math.ceil((config.tema.length + (config.contexto?.length || 0)) / 4)
  const tokensOutput = flashcards.reduce((acc, f) =>
    acc + Math.ceil((f.frente.length + f.verso.length + (f.explicacao?.length || 0)) / 4), 0)

  // Custo o4-mini: $1.10/1M input, $4.40/1M output
  const custo = (tokensInput / 1_000_000) * 1.10 + (tokensOutput / 1_000_000) * 4.40

  return {
    tipo: 'flashcard',
    dados: flashcards,
    modelo_usado: 'o4-mini',
    tokens: { input: tokensInput, output: tokensOutput },
    custo_estimado: custo,
    tempo_ms: tempo
  }
}

async function gerarQuestoes(
  config: ArtefatoConfig,
  startTime: number
): Promise<ArtefatoResult> {
  const questoes = await gerarQuestoesComOpenAI(
    config.tema,
    config.quantidade,
    config.opcoes?.estilo || 'ENARE',
    config.contexto
  )

  const tempo = Date.now() - startTime

  // Estimar tokens
  const tokensInput = Math.ceil((config.tema.length + (config.contexto?.length || 0)) / 4)
  const tokensOutput = questoes.reduce((acc, q) =>
    acc + Math.ceil((q.enunciado.length + q.explicacao.length +
      q.alternativas.reduce((a, alt) => a + alt.texto.length, 0)) / 4), 0)

  // Custo gpt-5.2: $2.50/1M input, $10.00/1M output
  const custo = (tokensInput / 1_000_000) * 2.50 + (tokensOutput / 1_000_000) * 10.00

  return {
    tipo: 'questao',
    dados: questoes,
    modelo_usado: 'gpt-5.2',
    tokens: { input: tokensInput, output: tokensOutput },
    custo_estimado: custo,
    tempo_ms: tempo
  }
}

async function gerarSimulado(
  config: ArtefatoConfig,
  startTime: number
): Promise<ArtefatoResult> {
  // Simulado e um conjunto de questoes (minimo 10)
  const quantidade = Math.max(config.quantidade, 10)

  // Dividir em lotes para melhor qualidade
  const lotes = Math.ceil(quantidade / 5)
  const questoes: QuestaoGenerated[] = []

  for (let i = 0; i < lotes; i++) {
    const qtdLote = Math.min(5, quantidade - questoes.length)
    const subtema = i === 0 ? config.tema : `${config.tema} (parte ${i + 1})`

    const loteQuestoes = await gerarQuestoesComOpenAI(
      subtema,
      qtdLote,
      config.opcoes?.estilo || 'ENARE',
      config.contexto
    )

    questoes.push(...loteQuestoes)

    if (questoes.length >= quantidade) break
  }

  const tempo = Date.now() - startTime

  const tokensInput = Math.ceil((config.tema.length + (config.contexto?.length || 0)) / 4) * lotes
  const tokensOutput = questoes.reduce((acc, q) =>
    acc + Math.ceil((q.enunciado.length + q.explicacao.length +
      q.alternativas.reduce((a, alt) => a + alt.texto.length, 0)) / 4), 0)

  const custo = (tokensInput / 1_000_000) * 2.50 + (tokensOutput / 1_000_000) * 10.00

  return {
    tipo: 'simulado',
    dados: questoes,
    modelo_usado: 'gpt-5.2',
    tokens: { input: tokensInput, output: tokensOutput },
    custo_estimado: custo,
    tempo_ms: tempo
  }
}

async function gerarResumo(
  config: ArtefatoConfig,
  startTime: number
): Promise<ArtefatoResult> {
  // Para resumos, usamos o4-mini com prompt especifico
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const prompt = config.contexto
    ? `Com base no seguinte contexto:\n${config.contexto}\n\nCrie um resumo estruturado sobre: ${config.tema}`
    : `Crie um resumo estruturado e completo sobre: ${config.tema}`

  const response = await openai.chat.completions.create({
    model: 'o4-mini',
    max_completion_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: `Voce e um especialista em educacao medica. Crie resumos estruturados, claros e pedagogicos em portugues brasileiro.

Estrutura do resumo:
1. Use ## para titulos de secao
2. Use ### para subtitulos
3. Use listas com - para pontos importantes
4. Use **negrito** para termos-chave
5. Inclua uma secao de "Pontos-Chave" ao final
6. Inclua referencias quando relevante`
      },
      { role: 'user', content: prompt }
    ]
  })

  const resumo = response.choices[0]?.message?.content || ''
  const tempo = Date.now() - startTime

  const tokensInput = response.usage?.prompt_tokens || 0
  const tokensOutput = response.usage?.completion_tokens || 0

  const custo = (tokensInput / 1_000_000) * 1.10 + (tokensOutput / 1_000_000) * 4.40

  return {
    tipo: 'resumo',
    dados: resumo,
    modelo_usado: 'o4-mini',
    tokens: { input: tokensInput, output: tokensOutput },
    custo_estimado: custo,
    tempo_ms: tempo
  }
}

async function gerarPlanoEstudos(
  config: ArtefatoConfig,
  startTime: number
): Promise<ArtefatoResult> {
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const schema = {
    type: 'object' as const,
    properties: {
      titulo: { type: 'string' as const },
      duracao_semanas: { type: 'number' as const },
      horas_por_dia: { type: 'number' as const },
      semanas: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            numero: { type: 'number' as const },
            tema_principal: { type: 'string' as const },
            dias: {
              type: 'array' as const,
              items: {
                type: 'object' as const,
                properties: {
                  dia: { type: 'string' as const },
                  atividades: {
                    type: 'array' as const,
                    items: {
                      type: 'object' as const,
                      properties: {
                        tipo: { type: 'string' as const },
                        descricao: { type: 'string' as const },
                        duracao_minutos: { type: 'number' as const }
                      },
                      required: ['tipo', 'descricao', 'duracao_minutos']
                    }
                  }
                },
                required: ['dia', 'atividades']
              }
            }
          },
          required: ['numero', 'tema_principal', 'dias']
        }
      },
      recursos_recomendados: {
        type: 'array' as const,
        items: { type: 'string' as const }
      },
      dicas: {
        type: 'array' as const,
        items: { type: 'string' as const }
      }
    },
    required: ['titulo', 'duracao_semanas', 'horas_por_dia', 'semanas', 'recursos_recomendados', 'dicas']
  }

  const response = await openai.chat.completions.create({
    model: 'o4-mini',
    messages: [
      {
        role: 'system',
        content: `Voce e um especialista em planejamento de estudos para medicina. Crie planos de estudo realistas e eficazes em portugues brasileiro.

Considere:
1. Distribuicao equilibrada de carga
2. Revisoes espacadas (spaced repetition)
3. Pratica ativa (questoes, casos clinicos)
4. Descanso adequado
5. Simulados periodicos`
      },
      {
        role: 'user',
        content: config.contexto
          ? `${config.contexto}\n\nCrie um plano de estudos para: ${config.tema}`
          : `Crie um plano de estudos detalhado para: ${config.tema}`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'plano_estudos',
        strict: true,
        schema
      }
    }
  })

  const plano = response.choices[0]?.message?.content || '{}'
  const tempo = Date.now() - startTime

  const tokensInput = response.usage?.prompt_tokens || 0
  const tokensOutput = response.usage?.completion_tokens || 0

  const custo = (tokensInput / 1_000_000) * 1.10 + (tokensOutput / 1_000_000) * 4.40

  return {
    tipo: 'plano_estudos',
    dados: plano,
    modelo_usado: 'o4-mini',
    tokens: { input: tokensInput, output: tokensOutput },
    custo_estimado: custo,
    tempo_ms: tempo
  }
}

// ==========================================
// FUNCAO DE COMPARATIVO DE CUSTOS
// ==========================================

export function calcularEconomia(
  tipo: ArtefatoConfig['tipo'],
  tokensInput: number,
  tokensOutput: number
): { custoOpenAI: number; custoOpus: number; economia: number; percentual: number } {
  const modeloConfig = MODELO_POR_ARTEFATO[tipo]

  // Custos OpenAI
  let custoOpenAI: number
  if (modeloConfig.modelo === 'o4-mini') {
    custoOpenAI = (tokensInput / 1_000_000) * 1.10 + (tokensOutput / 1_000_000) * 4.40
  } else {
    custoOpenAI = (tokensInput / 1_000_000) * 2.50 + (tokensOutput / 1_000_000) * 10.00
  }

  // Custo Claude Opus
  const custoOpus = (tokensInput / 1_000_000) * 5.00 + (tokensOutput / 1_000_000) * 25.00

  const economia = custoOpus - custoOpenAI
  const percentual = (economia / custoOpus) * 100

  return {
    custoOpenAI,
    custoOpus,
    economia,
    percentual
  }
}

// ==========================================
// EXPORTS
// ==========================================

export default gerarArtefato
