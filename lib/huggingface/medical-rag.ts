/**
 * Servico de RAG (Retrieval Augmented Generation) Medico
 *
 * Combina busca semantica com geracao de texto para
 * produzir respostas mais precisas e fundamentadas.
 *
 * MELHORIA: Adiciona contexto relevante as respostas da IA
 * NAO SUBSTITUI: Claude/Gemini continuam sendo os modelos principais
 */

import { generateMedicalEmbedding } from './medical-embeddings'
import { generateMedicalContext, suggestRelatedTopics } from './medical-knowledge-base'
import { FEATURES } from './config'

// Base de conhecimento em memoria (pode ser expandida com Supabase)
interface KnowledgeChunk {
  id: string
  content: string
  source: string
  topic: string
  embedding?: number[]
}

// Cache de chunks processados
let knowledgeBase: KnowledgeChunk[] = []

/**
 * Adiciona conhecimento a base (pode ser chamado ao inicializar)
 */
export async function addKnowledge(chunks: Omit<KnowledgeChunk, 'embedding'>[]): Promise<void> {
  if (!FEATURES.MEDICAL_RAG) return

  for (const chunk of chunks) {
    const embedding = await generateMedicalEmbedding(chunk.content)
    knowledgeBase.push({
      ...chunk,
      embedding
    })
  }
}

/**
 * Busca conhecimento relevante para uma query
 */
export async function retrieveRelevantKnowledge(
  query: string,
  topK: number = 3
): Promise<Array<{ content: string; source: string; relevance: number }>> {
  if (!FEATURES.MEDICAL_RAG || knowledgeBase.length === 0) {
    return []
  }

  try {
    const queryEmbedding = await generateMedicalEmbedding(query)

    // Calcular similaridade com cada chunk
    const results = knowledgeBase.map(chunk => {
      if (!chunk.embedding || chunk.embedding.length === 0) {
        return { content: chunk.content, source: chunk.source, relevance: 0 }
      }

      // Cosine similarity
      let dotProduct = 0
      let normA = 0
      let normB = 0

      for (let i = 0; i < queryEmbedding.length; i++) {
        dotProduct += queryEmbedding[i] * chunk.embedding[i]
        normA += queryEmbedding[i] * queryEmbedding[i]
        normB += chunk.embedding[i] * chunk.embedding[i]
      }

      const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))

      return {
        content: chunk.content,
        source: chunk.source,
        relevance: similarity
      }
    })

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, topK)
      .filter(r => r.relevance > 0.3) // Filtrar resultados com baixa relevancia
  } catch (error) {
    console.error('[HF RAG] Erro ao recuperar conhecimento:', error)
    return []
  }
}

/**
 * Enriquece uma query com contexto medico
 *
 * Esta e a funcao principal que MELHORA as respostas sem substituir a IA
 */
export async function enrichQueryWithContext(query: string): Promise<{
  enrichedPrompt: string
  medicalContext: string
  relatedTopics: string[]
  sources: Array<{ content: string; source: string; relevance: number }>
}> {
  // 1. Detectar contexto medico
  const medicalContext = generateMedicalContext(query)

  // 2. Buscar conhecimento relevante
  const sources = await retrieveRelevantKnowledge(query)

  // 3. Sugerir topicos relacionados
  const relatedTopics = suggestRelatedTopics(query)

  // 4. Montar prompt enriquecido
  let enrichedPrompt = ''

  if (medicalContext) {
    enrichedPrompt += medicalContext + '\n\n'
  }

  if (sources.length > 0) {
    enrichedPrompt += '[CONHECIMENTO RELEVANTE RECUPERADO]\n'
    sources.forEach((source, idx) => {
      enrichedPrompt += `${idx + 1}. ${source.content} (Fonte: ${source.source})\n`
    })
    enrichedPrompt += '\n'
  }

  return {
    enrichedPrompt,
    medicalContext,
    relatedTopics,
    sources
  }
}

/**
 * Processa resposta da IA para adicionar citacoes
 */
export function addCitationsToResponse(
  response: string,
  sources: Array<{ content: string; source: string; relevance: number }>
): string {
  if (sources.length === 0) {
    return response
  }

  // Adicionar secao de referencias ao final
  let citedResponse = response

  citedResponse += '\n\n---\n**Fontes consultadas:**\n'
  sources.forEach((source, idx) => {
    citedResponse += `${idx + 1}. ${source.source}\n`
  })

  return citedResponse
}

/**
 * Verifica se uma resposta da IA esta correta (fact-checking basico)
 */
export async function validateMedicalResponse(
  response: string,
  query: string
): Promise<{
  isValid: boolean
  confidence: number
  warnings: string[]
}> {
  const warnings: string[] = []
  let confidence = 0.8 // Confianca base

  // Verificar se menciona tratamentos sem cuidados
  const dangerousPatterns = [
    /tome\s+\d+\s*(mg|ml|g)/i,
    /automedicar/i,
    /sem\s+consultar/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(response)) {
      warnings.push('Resposta pode conter recomendacoes de dosagem. Sempre consulte um medico.')
      confidence -= 0.1
    }
  }

  // Verificar se tem disclaimer medico
  const hasDisclaimer = response.toLowerCase().includes('consulte') ||
                        response.toLowerCase().includes('medico') ||
                        response.toLowerCase().includes('profissional')

  // Importar detectMedicalSystem inline para evitar circular dependency
  const { detectMedicalSystem } = await import('./medical-knowledge-base')

  if (!hasDisclaimer && detectMedicalSystem(query)) {
    warnings.push('Considere adicionar recomendacao de consulta medica.')
    confidence -= 0.05
  }

  return {
    isValid: warnings.length === 0,
    confidence: Math.max(0.5, confidence),
    warnings
  }
}

/**
 * Limpa a base de conhecimento
 */
export function clearKnowledgeBase(): void {
  knowledgeBase = []
}
