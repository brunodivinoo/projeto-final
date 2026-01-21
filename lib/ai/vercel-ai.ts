// Helpers usando Vercel AI SDK para robustez
// Inclui: retry inteligente, structured outputs, validação com Zod

import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText, streamText, generateObject, tool } from 'ai'
import { z } from 'zod'
import { MODELOS } from './config'
import { SYSTEM_PROMPT_PREMIUM, SYSTEM_PROMPT_RESIDENCIA } from './prompts'

// ==========================================
// CLIENTE ANTHROPIC VIA VERCEL AI SDK
// ==========================================

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// ==========================================
// SCHEMAS DE VALIDAÇÃO COM ZOD
// ==========================================

// Schema para questão de residência
export const QuestaoSchema = z.object({
  disciplina: z.string().describe('Disciplina médica (ex: Clínica Médica, Cirurgia)'),
  assunto: z.string().describe('Assunto específico dentro da disciplina'),
  banca_inspiracao: z.string().optional().describe('Estilo de banca (USP, UNIFESP, etc)'),
  caso_clinico: z.string().optional().describe('Caso clínico para contextualizar'),
  enunciado: z.string().describe('Enunciado da questão'),
  alternativas: z.array(z.object({
    letra: z.enum(['A', 'B', 'C', 'D', 'E']),
    texto: z.string(),
    correta: z.boolean()
  })).length(5).describe('5 alternativas da questão'),
  gabarito: z.enum(['A', 'B', 'C', 'D', 'E']).describe('Letra da alternativa correta'),
  explicacao: z.string().describe('Explicação detalhada do gabarito'),
  dica_estudo: z.string().optional().describe('Dica de estudo relacionada'),
  referencias: z.array(z.string()).optional().describe('Referências bibliográficas')
})

export type QuestaoGerada = z.infer<typeof QuestaoSchema>

// Schema para flashcard
export const FlashcardSchema = z.object({
  frente: z.string().describe('Pergunta ou conceito no front do card'),
  verso: z.string().describe('Resposta ou explicação no verso'),
  dica: z.string().optional().describe('Dica para lembrar'),
  tags: z.array(z.string()).optional().describe('Tags para categorização')
})

export type FlashcardGerado = z.infer<typeof FlashcardSchema>

// Schema para resumo
export const ResumoSchema = z.object({
  titulo: z.string().describe('Título do resumo'),
  topicos: z.array(z.object({
    titulo: z.string(),
    conteudo: z.string(),
    pontos_chave: z.array(z.string()).optional()
  })).describe('Lista de tópicos do resumo'),
  conclusao: z.string().optional().describe('Conclusão/pontos principais'),
  palavras_chave: z.array(z.string()).optional().describe('Palavras-chave do tema')
})

export type ResumoGerado = z.infer<typeof ResumoSchema>

// ==========================================
// CONFIGURAÇÃO DE RETRY
// ==========================================

interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffFactor: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2
}

// Erros que devem fazer retry
const RETRYABLE_ERRORS = [
  'overloaded',
  'rate_limit',
  'timeout',
  'ECONNRESET',
  'ETIMEDOUT',
  '529', // Overloaded
  '503', // Service unavailable
  '502', // Bad gateway
]

function shouldRetry(error: unknown): boolean {
  const errorStr = String(error).toLowerCase()
  return RETRYABLE_ERRORS.some(e => errorStr.includes(e.toLowerCase()))
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ==========================================
// FUNÇÕES COM RETRY INTELIGENTE
// ==========================================

export async function generateWithRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: unknown
  let delay = cfg.initialDelayMs

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      console.error(`[Vercel AI] Tentativa ${attempt + 1}/${cfg.maxRetries + 1} falhou:`, error)

      if (attempt < cfg.maxRetries && shouldRetry(error)) {
        console.log(`[Vercel AI] Aguardando ${delay}ms antes de retry...`)
        await sleep(delay)
        delay = Math.min(delay * cfg.backoffFactor, cfg.maxDelayMs)
      } else {
        break
      }
    }
  }

  throw lastError
}

// ==========================================
// GERAÇÃO DE QUESTÃO ESTRUTURADA
// ==========================================

export async function gerarQuestaoEstruturada(
  prompt: string,
  plano: 'premium' | 'residencia' = 'residencia'
): Promise<QuestaoGerada> {
  const modelo = plano === 'residencia' ? MODELOS.claude.opus : MODELOS.claude.sonnet
  const systemPrompt = plano === 'residencia' ? SYSTEM_PROMPT_RESIDENCIA : SYSTEM_PROMPT_PREMIUM

  return generateWithRetry(async () => {
    const { object } = await generateObject({
      model: anthropic(modelo),
      schema: QuestaoSchema,
      system: systemPrompt + `

IMPORTANTE: Você DEVE retornar um objeto JSON válido seguindo o schema fornecido.
Não inclua explicações ou texto fora do JSON.`,
      prompt
    })

    // Validar que tem exatamente uma alternativa correta
    const corretas = object.alternativas.filter(a => a.correta)
    if (corretas.length !== 1) {
      throw new Error(`Questão inválida: ${corretas.length} alternativas marcadas como corretas`)
    }

    // Validar que o gabarito corresponde
    const alternativaCorreta = object.alternativas.find(a => a.correta)
    if (alternativaCorreta && alternativaCorreta.letra !== object.gabarito) {
      // Corrigir automaticamente
      object.gabarito = alternativaCorreta.letra
    }

    return object
  })
}

// ==========================================
// GERAÇÃO DE MÚLTIPLAS QUESTÕES
// ==========================================

export async function gerarQuestoesEmLote(
  prompt: string,
  quantidade: number,
  plano: 'premium' | 'residencia' = 'residencia',
  onProgress?: (questao: QuestaoGerada, index: number) => void
): Promise<QuestaoGerada[]> {
  const questoes: QuestaoGerada[] = []

  // Gerar cada questão individualmente para maior confiabilidade
  for (let i = 0; i < quantidade; i++) {
    const questaoPrompt = `${prompt}

Esta é a questão ${i + 1} de ${quantidade}.
${i > 0 ? `As questões anteriores já cobriram: ${questoes.map(q => q.assunto).join(', ')}.
Gere uma questão sobre um assunto DIFERENTE dentro do tema solicitado.` : ''}`

    try {
      const questao = await gerarQuestaoEstruturada(questaoPrompt, plano)
      questoes.push(questao)
      onProgress?.(questao, i)
    } catch (error) {
      console.error(`[Vercel AI] Erro ao gerar questão ${i + 1}:`, error)
      // Continuar tentando as próximas questões
    }
  }

  return questoes
}

// ==========================================
// GERAÇÃO DE FLASHCARDS ESTRUTURADOS
// ==========================================

export async function gerarFlashcardsEstruturados(
  tema: string,
  quantidade: number = 10,
  plano: 'premium' | 'residencia' = 'premium'
): Promise<FlashcardGerado[]> {
  const modelo = plano === 'residencia' ? MODELOS.claude.opus : MODELOS.claude.sonnet
  const systemPrompt = plano === 'residencia' ? SYSTEM_PROMPT_RESIDENCIA : SYSTEM_PROMPT_PREMIUM

  const FlashcardsArraySchema = z.object({
    flashcards: z.array(FlashcardSchema)
  })

  return generateWithRetry(async () => {
    const { object } = await generateObject({
      model: anthropic(modelo),
      schema: FlashcardsArraySchema,
      system: systemPrompt,
      prompt: `Gere ${quantidade} flashcards educativos sobre o tema: ${tema}

Os flashcards devem ser úteis para estudantes de medicina se preparando para residência.
Cada card deve focar em um conceito específico e ser memorável.`
    })

    return object.flashcards
  })
}

// ==========================================
// GERAÇÃO DE RESUMO ESTRUTURADO
// ==========================================

export async function gerarResumoEstruturado(
  conteudo: string,
  plano: 'premium' | 'residencia' = 'premium'
): Promise<ResumoGerado> {
  const modelo = plano === 'residencia' ? MODELOS.claude.opus : MODELOS.claude.sonnet
  const systemPrompt = plano === 'residencia' ? SYSTEM_PROMPT_RESIDENCIA : SYSTEM_PROMPT_PREMIUM

  return generateWithRetry(async () => {
    const { object } = await generateObject({
      model: anthropic(modelo),
      schema: ResumoSchema,
      system: systemPrompt,
      prompt: `Crie um resumo estruturado do seguinte conteúdo médico:

${conteudo}

O resumo deve ser organizado em tópicos claros, com pontos-chave destacados.`
    })

    return object
  })
}

// ==========================================
// CHAT COM STREAMING E RETRY
// ==========================================

export async function chatStreamComRetry(
  mensagens: Array<{ role: 'user' | 'assistant'; content: string }>,
  plano: 'premium' | 'residencia' = 'residencia',
  options: {
    maxTokens?: number
    temperature?: number
    onChunk?: (chunk: string) => void
  } = {}
) {
  const modelo = plano === 'residencia' ? MODELOS.claude.opus : MODELOS.claude.sonnet
  const systemPrompt = plano === 'residencia' ? SYSTEM_PROMPT_RESIDENCIA : SYSTEM_PROMPT_PREMIUM

  return generateWithRetry(async () => {
    const result = streamText({
      model: anthropic(modelo),
      system: systemPrompt,
      messages: mensagens.map(m => ({
        role: m.role,
        content: m.content
      })),
      maxOutputTokens: options.maxTokens || 8192
    })

    let fullText = ''

    for await (const chunk of result.textStream) {
      fullText += chunk
      options.onChunk?.(chunk)
    }

    return {
      text: fullText,
      usage: await result.usage
    }
  })
}

// ==========================================
// VALIDAÇÃO DE RESPOSTA
// ==========================================

export function validarQuestao(questao: unknown): { valida: boolean; erros: string[] } {
  const erros: string[] = []

  try {
    const parsed = QuestaoSchema.parse(questao)

    // Validações adicionais
    if (parsed.alternativas.length !== 5) {
      erros.push(`Deve ter exatamente 5 alternativas, tem ${parsed.alternativas.length}`)
    }

    const corretas = parsed.alternativas.filter(a => a.correta)
    if (corretas.length !== 1) {
      erros.push(`Deve ter exatamente 1 alternativa correta, tem ${corretas.length}`)
    }

    const letras = parsed.alternativas.map(a => a.letra)
    const letrasEsperadas = ['A', 'B', 'C', 'D', 'E']
    if (!letrasEsperadas.every(l => letras.includes(l as 'A' | 'B' | 'C' | 'D' | 'E'))) {
      erros.push('Alternativas devem ter letras A, B, C, D, E')
    }

    if (parsed.enunciado.length < 50) {
      erros.push('Enunciado muito curto (mínimo 50 caracteres)')
    }

    if (parsed.explicacao.length < 100) {
      erros.push('Explicação muito curta (mínimo 100 caracteres)')
    }

  } catch (zodError) {
    if (zodError instanceof z.ZodError) {
      erros.push(...zodError.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`))
    } else {
      erros.push('Erro de validação desconhecido')
    }
  }

  return { valida: erros.length === 0, erros }
}

// ==========================================
// EXPORTAR SCHEMAS PARA USO EXTERNO
// ==========================================

export const Schemas = {
  Questao: QuestaoSchema,
  Flashcard: FlashcardSchema,
  Resumo: ResumoSchema
}
