// LangChain - Classificador de Intencao
// Analisa a mensagem do usuario e decide qual "caminho" seguir

import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

// ==========================================
// TIPOS DE INTENCAO
// ==========================================

export const IntentionSchema = z.object({
  primaryIntent: z.enum([
    'chat_simples',        // Resposta direta, conversa casual
    'gerar_questoes',      // Criar questoes de prova
    'gerar_flashcards',    // Criar flashcards
    'caso_clinico',        // Simulacao de atendimento
    'buscar_informacao',   // Precisa pesquisar na web
    'analisar_imagem',     // Vision - analise de imagem
    'explicar_conceito',   // Explicacao detalhada de conceito
    'resumir_conteudo',    // Resumo de materia
    'plano_estudos',       // Planejamento de estudos
    'tarefa_complexa'      // Aciona multi-agentes
  ]),
  secondaryIntents: z.array(z.enum([
    'chat_simples',
    'gerar_questoes',
    'gerar_flashcards',
    'caso_clinico',
    'buscar_informacao',
    'analisar_imagem',
    'explicar_conceito',
    'resumir_conteudo',
    'plano_estudos',
    'tarefa_complexa'
  ])).optional(),
  confidence: z.number().min(0).max(1),
  topic: z.string().optional(),
  specialty: z.string().optional(),
  complexity: z.enum(['baixa', 'media', 'alta']),
  needsWebSearch: z.boolean(),
  needsMultiAgent: z.boolean(),
  suggestedChain: z.string(),
  reasoning: z.string()
})

export type Intention = z.infer<typeof IntentionSchema>

// ==========================================
// PROMPT DO CLASSIFICADOR
// ==========================================

const CLASSIFIER_PROMPT = `Voce e um classificador de intencoes para um assistente de estudos medicos.
Sua tarefa e analisar a mensagem do usuario e determinar:

1. INTENCAO PRIMARIA - O que o usuario quer PRINCIPALMENTE:
   - chat_simples: Conversa casual, pergunta simples, duvida rapida
   - gerar_questoes: Quer criar questoes de prova, simulado, exercicios
   - gerar_flashcards: Quer criar flashcards para revisao
   - caso_clinico: Quer simular atendimento, caso clinico interativo
   - buscar_informacao: Precisa de informacao atualizada (medicamentos, guidelines, noticias)
   - analisar_imagem: Enviou imagem para analise (exame, radiografia, foto)
   - explicar_conceito: Quer explicacao detalhada de um conceito medico
   - resumir_conteudo: Quer resumo de uma materia/topico
   - plano_estudos: Quer montar cronograma, plano de estudos, organizacao
   - tarefa_complexa: Tarefa que precisa de multiplas etapas coordenadas

2. INTENCOES SECUNDARIAS - Se houver mais de uma coisa pedida

3. CONFIANCA - De 0 a 1, quao certo voce esta da classificacao

4. TOPICO - Qual topico medico (anatomia, fisiologia, cardiologia, etc)

5. ESPECIALIDADE - Se aplicavel (cardiologia, neurologia, pediatria, etc)

6. COMPLEXIDADE - baixa, media ou alta

7. PRECISA WEB - Se precisa buscar informacao atualizada na internet

8. PRECISA MULTI-AGENTES - Se e uma tarefa complexa que precisa de coordenacao

9. CHAIN SUGERIDA - Qual chain deve processar (chat-chain, questoes-chain, flashcards-chain, resumo-chain, plano-estudos-crew)

10. RACIOCINIO - Breve explicacao da sua classificacao

RESPONDA APENAS EM JSON VALIDO com a estrutura:
{
  "primaryIntent": "...",
  "secondaryIntents": ["..."] ou null,
  "confidence": 0.95,
  "topic": "...",
  "specialty": "...",
  "complexity": "media",
  "needsWebSearch": false,
  "needsMultiAgent": false,
  "suggestedChain": "chat-chain",
  "reasoning": "..."
}`

// ==========================================
// FUNCAO DE CLASSIFICACAO
// ==========================================

export interface ClassifierOptions {
  provider?: 'claude' | 'gemini' | 'openai'
  hasImage?: boolean
  previousContext?: string
}

export async function classifyIntent(
  message: string,
  options: ClassifierOptions = {}
): Promise<Intention> {
  const { provider = 'gemini', hasImage = false, previousContext } = options

  // Usar Gemini por padrao (mais rapido e barato para classificacao)
  let model

  try {
    switch (provider) {
      case 'claude':
        model = new ChatAnthropic({
          modelName: 'claude-3-5-haiku-latest',
          anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
          temperature: 0.1,
          maxTokens: 500
        })
        break
      case 'openai':
        model = new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          openAIApiKey: process.env.OPENAI_API_KEY!,
          temperature: 0.1,
          maxTokens: 500
        })
        break
      case 'gemini':
      default:
        model = new ChatGoogleGenerativeAI({
          model: 'gemini-2.0-flash',
          apiKey: process.env.GEMINI_API_KEY!,
          temperature: 0.1,
          maxOutputTokens: 500
        })
    }
  } catch {
    // Fallback para Gemini se provider falhar
    model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey: process.env.GEMINI_API_KEY!,
      temperature: 0.1,
      maxOutputTokens: 500
    })
  }

  // Construir mensagem com contexto
  let userMessage = `MENSAGEM DO USUARIO:\n"${message}"`

  if (hasImage) {
    userMessage += '\n\n[NOTA: O usuario enviou uma imagem junto com a mensagem]'
  }

  if (previousContext) {
    userMessage += `\n\nCONTEXTO ANTERIOR:\n${previousContext}`
  }

  try {
    const response = await model.invoke([
      new SystemMessage(CLASSIFIER_PROMPT),
      new HumanMessage(userMessage)
    ])

    // Extrair JSON da resposta
    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)

    // Tentar parsear JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Nao foi possivel extrair JSON da resposta')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validar com Zod
    const validated = IntentionSchema.parse(parsed)

    return validated

  } catch (error) {
    console.error('[IntentClassifier] Erro na classificacao:', error)

    // Fallback inteligente baseado em keywords
    return getFallbackIntention(message, hasImage)
  }
}

// ==========================================
// FALLBACK BASEADO EM KEYWORDS
// ==========================================

function getFallbackIntention(message: string, hasImage: boolean): Intention {
  const msgLower = message.toLowerCase()

  // Se tem imagem, priorizar analise
  if (hasImage) {
    return {
      primaryIntent: 'analisar_imagem',
      confidence: 0.9,
      complexity: 'media',
      needsWebSearch: false,
      needsMultiAgent: false,
      suggestedChain: 'chat-chain',
      reasoning: 'Usuario enviou imagem para analise'
    }
  }

  // Detectar questoes
  if (
    msgLower.includes('quest') ||
    msgLower.includes('simulado') ||
    msgLower.includes('exercicio') ||
    msgLower.includes('prova') ||
    /\d+\s*(questoes|questao|perguntas)/i.test(msgLower)
  ) {
    return {
      primaryIntent: 'gerar_questoes',
      confidence: 0.85,
      complexity: 'media',
      needsWebSearch: false,
      needsMultiAgent: false,
      suggestedChain: 'questoes-chain',
      reasoning: 'Usuario pediu geracao de questoes'
    }
  }

  // Detectar flashcards
  if (
    msgLower.includes('flashcard') ||
    msgLower.includes('flash card') ||
    msgLower.includes('cartoes') ||
    msgLower.includes('anki')
  ) {
    return {
      primaryIntent: 'gerar_flashcards',
      confidence: 0.85,
      complexity: 'media',
      needsWebSearch: false,
      needsMultiAgent: false,
      suggestedChain: 'flashcards-chain',
      reasoning: 'Usuario pediu flashcards'
    }
  }

  // Detectar caso clinico
  if (
    msgLower.includes('caso clinico') ||
    msgLower.includes('simulacao') ||
    msgLower.includes('atendimento') ||
    msgLower.includes('paciente ficticio')
  ) {
    return {
      primaryIntent: 'caso_clinico',
      confidence: 0.85,
      complexity: 'alta',
      needsWebSearch: false,
      needsMultiAgent: false,
      suggestedChain: 'chat-chain',
      reasoning: 'Usuario quer simulacao de caso clinico'
    }
  }

  // Detectar plano de estudos
  if (
    msgLower.includes('plano de estudo') ||
    msgLower.includes('cronograma') ||
    msgLower.includes('organizar estudo') ||
    msgLower.includes('como estudar') ||
    msgLower.includes('residencia')
  ) {
    return {
      primaryIntent: 'plano_estudos',
      confidence: 0.8,
      complexity: 'alta',
      needsWebSearch: false,
      needsMultiAgent: true,
      suggestedChain: 'plano-estudos-crew',
      reasoning: 'Usuario quer plano de estudos (tarefa complexa)'
    }
  }

  // Detectar necessidade de busca web
  if (
    msgLower.includes('atualizado') ||
    msgLower.includes('recente') ||
    msgLower.includes('novidade') ||
    msgLower.includes('guideline') ||
    msgLower.includes('bula') ||
    msgLower.includes('medicamento')
  ) {
    return {
      primaryIntent: 'buscar_informacao',
      confidence: 0.75,
      complexity: 'media',
      needsWebSearch: true,
      needsMultiAgent: false,
      suggestedChain: 'chat-chain',
      reasoning: 'Usuario precisa de informacao atualizada'
    }
  }

  // Detectar explicacao
  if (
    msgLower.includes('explique') ||
    msgLower.includes('explica') ||
    msgLower.includes('o que e') ||
    msgLower.includes('o que sao') ||
    msgLower.includes('como funciona') ||
    msgLower.includes('qual a diferenca')
  ) {
    return {
      primaryIntent: 'explicar_conceito',
      confidence: 0.8,
      complexity: 'media',
      needsWebSearch: false,
      needsMultiAgent: false,
      suggestedChain: 'chat-chain',
      reasoning: 'Usuario quer explicacao de conceito'
    }
  }

  // Detectar resumo
  if (
    msgLower.includes('resum') ||
    msgLower.includes('sintetize') ||
    msgLower.includes('principais pontos')
  ) {
    return {
      primaryIntent: 'resumir_conteudo',
      confidence: 0.8,
      complexity: 'media',
      needsWebSearch: false,
      needsMultiAgent: false,
      suggestedChain: 'resumo-chain',
      reasoning: 'Usuario quer resumo de conteudo'
    }
  }

  // Default: chat simples
  return {
    primaryIntent: 'chat_simples',
    confidence: 0.6,
    complexity: 'baixa',
    needsWebSearch: false,
    needsMultiAgent: false,
    suggestedChain: 'chat-chain',
    reasoning: 'Classificacao padrao para conversa'
  }
}

// ==========================================
// FUNCAO PARA OBTER INSTRUCOES BASEADAS NA INTENCAO
// ==========================================

export function getIntentInstructions(intention: Intention): string {
  const instructions: Record<string, string> = {
    chat_simples: `
Responda de forma direta e conversacional.
Seja conciso mas completo.
Use linguagem acessivel.`,

    gerar_questoes: `
IMPORTANTE: Gere questoes no formato estruturado.
Inclua: enunciado, alternativas (A-E), gabarito e explicacao.
Varie dificuldade e temas.
Use casos clinicos quando apropriado.`,

    gerar_flashcards: `
IMPORTANTE: Gere flashcards no formato estruturado.
Cada flashcard deve ter: frente (pergunta) e verso (resposta).
Seja conciso mas informativo.
Foque em informacoes memoraveis.`,

    caso_clinico: `
IMPORTANTE: Voce esta conduzindo uma simulacao de caso clinico.
Apresente o paciente progressivamente.
Responda como se fosse o paciente quando questionado.
Forneca exames quando solicitados.
Conduza o aluno no raciocinio clinico.`,

    buscar_informacao: `
IMPORTANTE: Use busca web para obter informacao atualizada.
Cite fontes confiaveis.
Priorize guidelines e consensos.
Indique data da informacao.`,

    analisar_imagem: `
IMPORTANTE: Analise a imagem fornecida.
Descreva achados relevantes.
Sugira diagnosticos diferenciais se aplicavel.
Correlacione com a historia clinica.`,

    explicar_conceito: `
IMPORTANTE: Forneca explicacao detalhada e didatica.
Use analogias quando util.
Estruture em topicos.
Inclua exemplos praticos.`,

    resumir_conteudo: `
IMPORTANTE: Forneca resumo estruturado.
Use bullet points.
Destaque pontos principais.
Inclua tabelas se util.`,

    plano_estudos: `
IMPORTANTE: Crie plano de estudos personalizado.
Considere tempo disponivel.
Distribua materias por prioridade.
Inclua revisoes espacadas.
Sugira simulados.`,

    tarefa_complexa: `
IMPORTANTE: Esta e uma tarefa complexa que requer multiplas etapas.
Divida em subtarefas.
Execute cada etapa cuidadosamente.
Compile resultado final.`
  }

  return instructions[intention.primaryIntent] || instructions.chat_simples
}

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {
  classifyIntent,
  getIntentInstructions,
  IntentionSchema
}
