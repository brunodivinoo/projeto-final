/**
 * Exportacoes centralizadas do modulo Hugging Face
 *
 * Este arquivo facilita a importacao de todas as funcionalidades
 * do modulo de integracao com Hugging Face.
 */

// Configuracoes
export {
  hf,
  HF_MODELS,
  FEATURES,
  type MedicalEmbedding,
  type RAGResult,
  type MedicalEntity
} from './config'

// Embeddings medicos
export {
  generateMedicalEmbedding,
  generateBatchEmbeddings,
  semanticSearch,
  cosineSimilarity,
  clearEmbeddingsCache
} from './medical-embeddings'

// Base de conhecimento
export {
  MEDICAL_KNOWLEDGE,
  type MedicalSystem,
  detectMedicalSystem,
  getMedicalKnowledge,
  generateMedicalContext,
  suggestRelatedTopics
} from './medical-knowledge-base'

// RAG medico
export {
  addKnowledge,
  retrieveRelevantKnowledge,
  enrichQueryWithContext,
  addCitationsToResponse,
  validateMedicalResponse,
  clearKnowledgeBase
} from './medical-rag'

// Agentes inteligentes
export {
  type AgentType,
  detectAgentType,
  prepareAgentContext,
  formatAgentResponse,
  suggestNextSteps
} from './smart-agents'

// Sistema de variabilidade de respostas
export {
  VARIATION_CONFIG,
  generateUniqueSeed,
  generateDailySeed,
  selectTeachingApproach,
  getApproachInstruction,
  generateVariedPrompt,
  detectResponseType,
  extractTopic,
  checkResponseSimilarity,
  adjustTemperature,
  selectResponseStyle,
  generateStyleInstructions,
  type VariationConfigType,
  type TeachingApproach
} from './response-variation'

// Importar FEATURES localmente para uso na funcao de inicializacao
import { FEATURES as _FEATURES } from './config'

// Funcao de inicializacao (chamar ao iniciar o app)
export async function initializeHuggingFace(): Promise<void> {
  console.log('[HuggingFace] Inicializando modulo...')
  console.log('[HuggingFace] Features habilitadas:', {
    embeddings: _FEATURES.MEDICAL_EMBEDDINGS,
    rag: _FEATURES.MEDICAL_RAG,
    agents: _FEATURES.SMART_AGENTS
  })

  // Aqui pode adicionar inicializacoes adicionais se necessario
  // Por exemplo, pre-carregar embeddings, conectar a vector database, etc.
}
