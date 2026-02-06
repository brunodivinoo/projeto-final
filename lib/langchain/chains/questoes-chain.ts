// LangChain - Chain para Geracao de Questoes
// Gera questoes de prova no formato estruturado

import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

// ==========================================
// TIPOS E SCHEMAS
// ==========================================

export const QuestaoSchema = z.object({
  enunciado: z.string().min(20),
  alternativas: z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
    E: z.string().optional()
  }),
  gabarito: z.enum(['A', 'B', 'C', 'D', 'E']),
  explicacao: z.string().min(50),
  dificuldade: z.enum(['facil', 'media', 'dificil']),
  tema: z.string(),
  tags: z.array(z.string()).optional()
})

export const QuestoesOutputSchema = z.object({
  questoes: z.array(QuestaoSchema),
  metadata: z.object({
    tema_principal: z.string(),
    total_geradas: z.number(),
    distribuicao_dificuldade: z.object({
      facil: z.number(),
      media: z.number(),
      dificil: z.number()
    })
  })
})

export type Questao = z.infer<typeof QuestaoSchema>
export type QuestoesOutput = z.infer<typeof QuestoesOutputSchema>

// ==========================================
// PROMPT PARA GERACAO DE QUESTOES
// ==========================================

const QUESTOES_SYSTEM_PROMPT = `Voce e um especialista em criar questoes de concursos medicos (REVALIDA, residencia, provas de especialidades).

REGRAS OBRIGATORIAS:
1. Todas as questoes devem ter formato de multipla escolha (A, B, C, D, E)
2. Cada questao deve ter uma EXPLICACAO DETALHADA do gabarito
3. As questoes devem cobrir diferentes niveis de dificuldade
4. Use casos clinicos realistas quando apropriado
5. Evite pegadinhas; foque em conhecimento clinico relevante
6. Alternativas incorretas devem ser plausiveis (distratores de qualidade)

ESTRUTURA JSON OBRIGATORIA:
{
  "questoes": [
    {
      "enunciado": "Texto completo da questao...",
      "alternativas": {
        "A": "Alternativa A",
        "B": "Alternativa B",
        "C": "Alternativa C",
        "D": "Alternativa D",
        "E": "Alternativa E"
      },
      "gabarito": "A",
      "explicacao": "Explicacao detalhada de por que A esta correta e as outras erradas...",
      "dificuldade": "media",
      "tema": "Cardiologia - Insuficiencia Cardiaca",
      "tags": ["ICC", "tratamento", "farmacos"]
    }
  ],
  "metadata": {
    "tema_principal": "Cardiologia",
    "total_geradas": 5,
    "distribuicao_dificuldade": { "facil": 1, "media": 3, "dificil": 1 }
  }
}

RESPONDA APENAS O JSON, SEM TEXTO ADICIONAL.`

// ==========================================
// FUNCAO PRINCIPAL
// ==========================================

export interface QuestoesChainInput {
  tema: string
  quantidade: number
  dificuldade?: 'facil' | 'media' | 'dificil' | 'mista'
  estilo?: 'revalida' | 'residencia' | 'especialidade' | 'geral'
  incluirCasosClinicas?: boolean
  provider?: 'claude' | 'gemini'
  contextoAdicional?: string
}

export async function runQuestoesChain(input: QuestoesChainInput): Promise<QuestoesOutput> {
  const {
    tema,
    quantidade,
    dificuldade = 'mista',
    estilo = 'residencia',
    incluirCasosClinicas = true,
    provider = 'claude',
    contextoAdicional
  } = input

  // Construir prompt do usuario
  let userPrompt = `Gere ${quantidade} questoes sobre: ${tema}\n\n`
  userPrompt += `Estilo: ${estilo.toUpperCase()}\n`
  userPrompt += `Dificuldade: ${dificuldade === 'mista' ? 'Varie entre facil, media e dificil' : dificuldade}\n`

  if (incluirCasosClinicas) {
    userPrompt += `Inclua casos clinicos em pelo menos 50% das questoes.\n`
  }

  if (contextoAdicional) {
    userPrompt += `\nContexto adicional: ${contextoAdicional}\n`
  }

  userPrompt += `\nResponda APENAS com o JSON estruturado.`

  // Selecionar modelo
  let llm

  if (provider === 'claude') {
    llm = new ChatAnthropic({
      modelName: 'claude-sonnet-4-20250514',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
      temperature: 0.7,
      maxTokens: 8000
    })
  } else {
    llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey: process.env.GEMINI_API_KEY!,
      temperature: 0.7,
      maxOutputTokens: 8000
    })
  }

  // Executar
  const response = await llm.invoke([
    new SystemMessage(QUESTOES_SYSTEM_PROMPT),
    new HumanMessage(userPrompt)
  ])

  const content = typeof response.content === 'string'
    ? response.content
    : JSON.stringify(response.content)

  // Extrair JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Nao foi possivel extrair JSON da resposta')
  }

  // Parsear e validar
  const parsed = JSON.parse(jsonMatch[0])
  const validated = QuestoesOutputSchema.parse(parsed)

  return validated
}

// ==========================================
// FUNCAO COM VALIDACAO E RETRY
// ==========================================

export async function runQuestoesChainWithValidation(
  input: QuestoesChainInput,
  maxRetries: number = 2
): Promise<QuestoesOutput> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await runQuestoesChain(input)

      // Validar quantidade
      if (result.questoes.length < input.quantidade * 0.8) {
        console.warn(`[QuestoesChain] Gerou apenas ${result.questoes.length} de ${input.quantidade} questoes`)

        if (attempt < maxRetries) {
          // Tentar gerar mais
          const faltam = input.quantidade - result.questoes.length
          const complemento = await runQuestoesChain({
            ...input,
            quantidade: faltam,
            contextoAdicional: `IMPORTANTE: Gere questoes DIFERENTES das anteriores sobre ${input.tema}`
          })

          result.questoes.push(...complemento.questoes)
          result.metadata.total_geradas = result.questoes.length
        }
      }

      return result

    } catch (error) {
      console.error(`[QuestoesChain] Tentativa ${attempt + 1} falhou:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      // Tentar com outro provider
      if (attempt === 0 && input.provider === 'claude') {
        console.log('[QuestoesChain] Tentando com Gemini...')
        input.provider = 'gemini'
      }
    }
  }

  throw lastError || new Error('Falha ao gerar questoes')
}

// ==========================================
// FUNCAO PARA FORMATAR QUESTOES PARA EXIBICAO
// ==========================================

export function formatQuestoesParaExibicao(output: QuestoesOutput): string {
  // Gera blocos ```questao com JSON estruturado para renderização como DECK cards
  // O ArtifactRenderer detecta esses blocos e renderiza como cards clicáveis na sidebar
  let texto = `Questoes - ${output.metadata.tema_principal}\nTotal: ${output.metadata.total_geradas} questoes\n`

  output.questoes.forEach((q, i) => {
    const questionJson = {
      numero: i + 1,
      tipo: 'multipla_escolha',
      dificuldade: q.dificuldade === 'media' ? 'medio' : q.dificuldade,
      disciplina: output.metadata.tema_principal,
      assunto: q.tema || output.metadata.tema_principal,
      enunciado: q.enunciado,
      alternativas: Object.entries(q.alternativas)
        .filter(([, alt]) => alt)
        .map(([letra, texto]) => ({
          letra,
          texto
        })),
      gabarito_comentado: {
        resposta_correta: q.gabarito,
        explicacao: q.explicacao
      }
    }

    texto += `\n\`\`\`questao\n${JSON.stringify(questionJson, null, 2)}\n\`\`\`\n`
  })

  return texto
}

// ==========================================
// EXPORT
// ==========================================

export default {
  runQuestoesChain,
  runQuestoesChainWithValidation,
  formatQuestoesParaExibicao,
  QuestaoSchema,
  QuestoesOutputSchema
}
