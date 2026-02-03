// LangChain - Chain para Geracao de Flashcards
// Gera flashcards no formato estruturado

import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

// ==========================================
// TIPOS E SCHEMAS
// ==========================================

// Função para normalizar valores de dificuldade (remove acentos e normaliza)
function normalizeDificuldade(value: unknown): 'facil' | 'media' | 'dificil' | undefined {
  if (!value || typeof value !== 'string') return undefined

  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim()

  // Mapear variações para valores válidos
  const mapping: Record<string, 'facil' | 'media' | 'dificil'> = {
    'facil': 'facil',
    'fácil': 'facil',
    'baixa': 'facil',
    'baixo': 'facil',
    'easy': 'facil',
    'media': 'media',
    'média': 'media',
    'medio': 'media',
    'médio': 'media',
    'moderada': 'media',
    'moderado': 'media',
    'medium': 'media',
    'intermediaria': 'media',
    'intermediario': 'media',
    'dificil': 'dificil',
    'difícil': 'dificil',
    'alta': 'dificil',
    'alto': 'dificil',
    'hard': 'dificil',
    'avancada': 'dificil',
    'avancado': 'dificil',
  }

  return mapping[normalized] || undefined
}

export const FlashcardSchema = z.object({
  frente: z.string().min(5),
  verso: z.string().min(10),
  categoria: z.string(),
  dificuldade: z.preprocess(
    normalizeDificuldade,
    z.enum(['facil', 'media', 'dificil']).optional()
  ),
  dica: z.string().optional(),
  tags: z.array(z.string()).optional()
})

export const FlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema),
  metadata: z.object({
    tema: z.string(),
    total: z.number(),
    categorias: z.array(z.string())
  })
})

export type Flashcard = z.infer<typeof FlashcardSchema>
export type FlashcardsOutput = z.infer<typeof FlashcardsOutputSchema>

// ==========================================
// PROMPT PARA GERACAO DE FLASHCARDS
// ==========================================

const FLASHCARDS_SYSTEM_PROMPT = `Voce e um especialista em criar flashcards para estudos medicos.

REGRAS PARA BONS FLASHCARDS:
1. FRENTE: Pergunta clara e objetiva (o que testar)
2. VERSO: Resposta concisa mas completa
3. Uma informacao por flashcard (atomicidade)
4. Use mneumonicos quando apropriado
5. Inclua dicas para facilitar a memorizacao
6. Agrupe por categorias logicas

TIPOS DE FLASHCARDS:
- Definicoes: "O que e X?"
- Comparacoes: "Diferenca entre X e Y?"
- Causas: "Principais causas de X?"
- Tratamento: "Tratamento de primeira linha para X?"
- Diagnostico: "Criterios diagnosticos de X?"
- Fisiopatologia: "Mecanismo de X?"

ESTRUTURA JSON OBRIGATORIA:
{
  "flashcards": [
    {
      "frente": "Quais sao os criterios de Framingham para ICC?",
      "verso": "MAIORES: DPN, estase jugular, estertores, cardiomegalia, EAP, B3, PVC>16\\nMENORES: edema MMII, tosse noturna, dispneia aos esforcos, hepatomegalia, derrame pleural, FC>120",
      "categoria": "Cardiologia - ICC",
      "dificuldade": "media",
      "dica": "Lembre: maiores = sinais de congestao central",
      "tags": ["ICC", "criterios", "Framingham"]
    }
  ],
  "metadata": {
    "tema": "Insuficiencia Cardiaca",
    "total": 10,
    "categorias": ["Definicao", "Criterios", "Tratamento"]
  }
}

RESPONDA APENAS O JSON, SEM TEXTO ADICIONAL.`

// ==========================================
// FUNCAO PRINCIPAL
// ==========================================

export interface FlashcardsChainInput {
  tema: string
  quantidade: number
  tipo?: 'definicoes' | 'comparacoes' | 'tratamento' | 'misto'
  nivel?: 'basico' | 'intermediario' | 'avancado'
  provider?: 'claude' | 'gemini'
  contextoAdicional?: string
}

export async function runFlashcardsChain(input: FlashcardsChainInput): Promise<FlashcardsOutput> {
  const {
    tema,
    quantidade,
    tipo = 'misto',
    nivel = 'intermediario',
    provider = 'gemini', // Gemini e mais barato para flashcards
    contextoAdicional
  } = input

  // Construir prompt
  let userPrompt = `Gere ${quantidade} flashcards sobre: ${tema}\n\n`
  userPrompt += `Tipo: ${tipo === 'misto' ? 'Varie entre definicoes, comparacoes, tratamento, diagnostico' : tipo}\n`
  userPrompt += `Nivel: ${nivel}\n`

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
      maxTokens: 6000
    })
  } else {
    llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey: process.env.GEMINI_API_KEY!,
      temperature: 0.7,
      maxOutputTokens: 6000
    })
  }

  // Executar
  const response = await llm.invoke([
    new SystemMessage(FLASHCARDS_SYSTEM_PROMPT),
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
  const validated = FlashcardsOutputSchema.parse(parsed)

  return validated
}

// ==========================================
// FUNCAO PARA EXPORTAR PARA ANKI
// ==========================================

export function exportToAnkiFormat(output: FlashcardsOutput): string {
  // Formato TSV para importar no Anki
  // Colunas: frente, verso, tags
  let tsv = ''

  output.flashcards.forEach(card => {
    const frente = card.frente.replace(/\t/g, ' ').replace(/\n/g, '<br>')
    const verso = card.verso.replace(/\t/g, ' ').replace(/\n/g, '<br>')
    const tags = [card.categoria, ...(card.tags || [])].join(' ')

    tsv += `${frente}\t${verso}\t${tags}\n`
  })

  return tsv
}

// ==========================================
// FUNCAO PARA FORMATAR PARA EXIBICAO
// ==========================================

export function formatFlashcardsParaExibicao(output: FlashcardsOutput): string {
  let texto = `# Flashcards - ${output.metadata.tema}\n\n`
  texto += `Total: ${output.metadata.total} flashcards\n`
  texto += `Categorias: ${output.metadata.categorias.join(', ')}\n\n`
  texto += `---\n\n`

  output.flashcards.forEach((card, i) => {
    texto += `### Flashcard ${i + 1}\n\n`
    texto += `**FRENTE:**\n${card.frente}\n\n`
    texto += `<details>\n<summary>Ver Resposta</summary>\n\n`
    texto += `**VERSO:**\n${card.verso}\n\n`
    if (card.dica) {
      texto += `**Dica:** ${card.dica}\n\n`
    }
    texto += `*Categoria: ${card.categoria}*\n`
    texto += `</details>\n\n---\n\n`
  })

  return texto
}

// ==========================================
// EXPORT
// ==========================================

export default {
  runFlashcardsChain,
  exportToAnkiFormat,
  formatFlashcardsParaExibicao,
  FlashcardSchema,
  FlashcardsOutputSchema
}
