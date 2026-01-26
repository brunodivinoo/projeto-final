/**
 * Servico de Embeddings Medicos
 *
 * Usa PubMedBERT para criar representacoes vetoriais de texto medico,
 * permitindo busca semantica de alta qualidade.
 *
 * MELHORIA: Adiciona busca semantica ao sistema existente
 * NAO SUBSTITUI: O sistema atual de busca continua funcionando
 */

import { hf, HF_MODELS, FEATURES, type MedicalEmbedding } from './config'

// Cache de embeddings para evitar chamadas repetidas
const embeddingsCache = new Map<string, number[]>()

/**
 * Gera embedding para um texto medico
 */
export async function generateMedicalEmbedding(text: string): Promise<number[]> {
  // Se feature desabilitada, retorna array vazio
  if (!FEATURES.MEDICAL_EMBEDDINGS) {
    console.log('[HF] Medical embeddings desabilitado')
    return []
  }

  // Verificar cache
  const cacheKey = text.substring(0, 100) // Usar primeiros 100 chars como chave
  if (embeddingsCache.has(cacheKey)) {
    return embeddingsCache.get(cacheKey)!
  }

  try {
    const response = await hf.featureExtraction({
      model: HF_MODELS.MEDICAL_EMBEDDINGS,
      inputs: text,
    })

    // Converter para array de numeros
    const embedding = Array.isArray(response)
      ? (response as number[])
      : Object.values(response as Record<string, number>)

    // Salvar no cache (limitar tamanho do cache)
    if (embeddingsCache.size > 1000) {
      const firstKey = embeddingsCache.keys().next().value
      if (firstKey) embeddingsCache.delete(firstKey)
    }
    embeddingsCache.set(cacheKey, embedding)

    return embedding
  } catch (error) {
    console.error('[HF] Erro ao gerar embedding medico:', error)
    return []
  }
}

/**
 * Gera embeddings para multiplos textos
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<MedicalEmbedding[]> {
  if (!FEATURES.MEDICAL_EMBEDDINGS) {
    return texts.map(text => ({ text, embedding: [] }))
  }

  const results: MedicalEmbedding[] = []

  // Processar em lotes de 10 para evitar rate limiting
  const batchSize = 10
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const embeddings = await Promise.all(
      batch.map(text => generateMedicalEmbedding(text))
    )

    batch.forEach((text, idx) => {
      results.push({ text, embedding: embeddings[idx] })
    })

    // Pequeno delay entre lotes
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * Calcula similaridade entre dois embeddings (cosine similarity)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}

/**
 * Busca semantica - encontra textos mais similares
 */
export async function semanticSearch(
  query: string,
  documents: string[],
  topK: number = 5
): Promise<Array<{ text: string; similarity: number; index: number }>> {
  if (!FEATURES.MEDICAL_EMBEDDINGS || documents.length === 0) {
    // Fallback: retorna os primeiros documentos
    return documents.slice(0, topK).map((text, index) => ({
      text,
      similarity: 1 - (index * 0.1),
      index
    }))
  }

  try {
    // Gerar embedding da query
    const queryEmbedding = await generateMedicalEmbedding(query)

    // Gerar embeddings dos documentos
    const docEmbeddings = await generateBatchEmbeddings(documents)

    // Calcular similaridades
    const similarities = docEmbeddings.map((doc, index) => ({
      text: doc.text,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
      index
    }))

    // Ordenar por similaridade e retornar top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
  } catch (error) {
    console.error('[HF] Erro na busca semantica:', error)
    // Fallback
    return documents.slice(0, topK).map((text, index) => ({
      text,
      similarity: 0.5,
      index
    }))
  }
}

/**
 * Limpa o cache de embeddings
 */
export function clearEmbeddingsCache(): void {
  embeddingsCache.clear()
}
