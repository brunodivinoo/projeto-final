/**
 * Configuracao do Hugging Face para PREPARA MED
 *
 * Este arquivo configura a conexao com a API do Hugging Face
 * e define os modelos utilizados para cada funcionalidade.
 */

import { HfInference } from '@huggingface/inference'

// Cliente Hugging Face
export const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Configuracoes de modelos
export const HF_MODELS = {
  // Embeddings medicos - para busca semantica
  MEDICAL_EMBEDDINGS: 'NeuML/pubmedbert-base-embeddings',

  // Modelo de texto medico (fallback gratuito)
  MEDICAL_TEXT: 'google/medgemma-4b-it',

  // Modelo de classificacao medica
  MEDICAL_CLASSIFIER: 'medicalai/ClinicalBERT',

  // Modelo para NER medico (Named Entity Recognition)
  MEDICAL_NER: 'd4data/biomedical-ner-all',
} as const

// Feature flags
export const FEATURES = {
  MEDICAL_EMBEDDINGS: process.env.ENABLE_MEDICAL_EMBEDDINGS === 'true',
  MEDICAL_RAG: process.env.ENABLE_MEDICAL_RAG === 'true',
  SMART_AGENTS: process.env.ENABLE_SMART_AGENTS === 'true',
} as const

// Tipos
export interface MedicalEmbedding {
  text: string
  embedding: number[]
  metadata?: Record<string, unknown>
}

export interface RAGResult {
  answer: string
  sources: Array<{
    text: string
    relevance: number
    source?: string
  }>
  confidence: number
}

export interface MedicalEntity {
  entity: string
  type: 'DISEASE' | 'DRUG' | 'SYMPTOM' | 'PROCEDURE' | 'ANATOMY' | 'OTHER'
  start: number
  end: number
  confidence: number
}
