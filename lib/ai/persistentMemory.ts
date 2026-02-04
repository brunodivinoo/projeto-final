// Persistent Memory - Sistema de memoria persistente no Supabase
// Salva contexto de conversa entre sessoes

import { createClient } from '@supabase/supabase-js'

// ==========================================
// TIPOS
// ==========================================

export interface MemoryEntry {
  id?: string
  user_id: string
  conversa_id?: string
  tipo: 'entity' | 'summary' | 'preference' | 'learning'
  chave: string
  valor: string
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  expires_at?: string
}

export interface UserMemory {
  entities: Record<string, string>  // nome_paciente, medicamento_atual, etc.
  summaries: string[]               // resumos de conversas anteriores
  preferences: Record<string, unknown> // preferencias do usuario
  learningTopics: string[]          // topicos que o usuario estudou
}

export interface ConversationContext {
  lastTopics: string[]
  mentionedEntities: string[]
  studyProgress: Record<string, number>
  lastInteractionDate: string
}

// ==========================================
// CLIENTE SUPABASE
// ==========================================

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ==========================================
// FUNCOES DE MEMORIA
// ==========================================

/**
 * Salva uma entrada de memoria
 */
export async function saveMemory(entry: Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
  const supabase = getSupabase()

  try {
    // Verificar se já existe entrada com mesma chave para o usuario
    const { data: existing } = await supabase
      .from('user_memory_med')
      .select('id')
      .eq('user_id', entry.user_id)
      .eq('tipo', entry.tipo)
      .eq('chave', entry.chave)
      .single()

    if (existing) {
      // Atualizar existente
      const { error } = await supabase
        .from('user_memory_med')
        .update({
          valor: entry.valor,
          metadata: entry.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        console.error('[Memory] Erro ao atualizar:', error)
        return false
      }
    } else {
      // Inserir nova
      const { error } = await supabase
        .from('user_memory_med')
        .insert({
          ...entry,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('[Memory] Erro ao inserir:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('[Memory] Erro:', error)
    return false
  }
}

/**
 * Busca todas as memorias de um usuario
 */
export async function getUserMemory(userId: string): Promise<UserMemory> {
  const supabase = getSupabase()

  const memory: UserMemory = {
    entities: {},
    summaries: [],
    preferences: {},
    learningTopics: []
  }

  try {
    const { data, error } = await supabase
      .from('user_memory_med')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Memory] Erro ao buscar:', error)
      return memory
    }

    if (data) {
      for (const entry of data) {
        switch (entry.tipo) {
          case 'entity':
            memory.entities[entry.chave] = entry.valor
            break
          case 'summary':
            memory.summaries.push(entry.valor)
            break
          case 'preference':
            memory.preferences[entry.chave] = JSON.parse(entry.valor)
            break
          case 'learning':
            memory.learningTopics.push(entry.valor)
            break
        }
      }
    }
  } catch (error) {
    console.error('[Memory] Erro:', error)
  }

  return memory
}

/**
 * Salva entidade detectada na conversa
 */
export async function saveEntity(
  userId: string,
  entityType: string,
  entityValue: string,
  conversaId?: string
): Promise<boolean> {
  return saveMemory({
    user_id: userId,
    conversa_id: conversaId,
    tipo: 'entity',
    chave: entityType,
    valor: entityValue,
    metadata: { detectedAt: new Date().toISOString() }
  })
}

/**
 * Salva resumo de conversa
 */
export async function saveConversationSummary(
  userId: string,
  conversaId: string,
  summary: string
): Promise<boolean> {
  return saveMemory({
    user_id: userId,
    conversa_id: conversaId,
    tipo: 'summary',
    chave: `summary_${conversaId}`,
    valor: summary,
    metadata: { conversaId }
  })
}

/**
 * Salva topico estudado
 */
export async function saveLearningTopic(
  userId: string,
  topic: string
): Promise<boolean> {
  return saveMemory({
    user_id: userId,
    tipo: 'learning',
    chave: topic.toLowerCase().replace(/\s+/g, '_'),
    valor: topic,
    metadata: { studiedAt: new Date().toISOString() }
  })
}

/**
 * Salva preferencia do usuario
 */
export async function savePreference(
  userId: string,
  key: string,
  value: unknown
): Promise<boolean> {
  return saveMemory({
    user_id: userId,
    tipo: 'preference',
    chave: key,
    valor: JSON.stringify(value)
  })
}

/**
 * Busca contexto para enriquecer o prompt
 */
export async function getContextForPrompt(userId: string): Promise<string> {
  const memory = await getUserMemory(userId)

  let context = ''

  // Adicionar entidades conhecidas
  if (Object.keys(memory.entities).length > 0) {
    context += '\n\n## CONTEXTO DO USUARIO (da memoria persistente)\n'
    for (const [key, value] of Object.entries(memory.entities)) {
      const keyFormatted = key.replace(/_/g, ' ')
      context += `- ${keyFormatted}: ${value}\n`
    }
  }

  // Adicionar topicos estudados recentemente
  if (memory.learningTopics.length > 0) {
    const recentTopics = memory.learningTopics.slice(0, 10)
    context += `\n## TOPICOS ESTUDADOS RECENTEMENTE\n`
    context += recentTopics.join(', ') + '\n'
  }

  // Adicionar resumo das ultimas conversas
  if (memory.summaries.length > 0) {
    const lastSummary = memory.summaries[0]
    context += `\n## RESUMO DA ULTIMA CONVERSA\n${lastSummary}\n`
  }

  return context
}

/**
 * Detecta e extrai entidades da mensagem
 * Sistema aprimorado com mais categorias e padroes
 */
export function detectEntities(message: string): Array<{ type: string; value: string; confidence?: number }> {
  const entities: Array<{ type: string; value: string; confidence?: number }> = []
  const msgLower = message.toLowerCase()

  // ==========================================
  // 1. PROVAS E CONCURSOS
  // ==========================================
  const provas = [
    { pattern: /residencia|residência/, value: 'Residencia Medica', confidence: 0.9 },
    { pattern: /revalida/, value: 'REVALIDA', confidence: 0.95 },
    { pattern: /enade/, value: 'ENADE', confidence: 0.95 },
    { pattern: /enare/, value: 'ENARE', confidence: 0.95 },
    { pattern: /\busp\b/, value: 'USP', confidence: 0.9 },
    { pattern: /\bunicamp\b/, value: 'UNICAMP', confidence: 0.9 },
    { pattern: /\bunifesp\b/, value: 'UNIFESP', confidence: 0.9 },
    { pattern: /santa\s*casa/, value: 'Santa Casa', confidence: 0.9 },
    { pattern: /\bfmusp\b/, value: 'FMUSP', confidence: 0.9 },
    { pattern: /\bsus\b.*prova|prova.*\bsus\b/, value: 'Prova SUS', confidence: 0.85 },
    { pattern: /einstein/, value: 'Hospital Albert Einstein', confidence: 0.85 },
    { pattern: /sirio.*libanes|sirio-libanes/, value: 'Sirio-Libanes', confidence: 0.85 },
    { pattern: /\bac\b.*camargo|a\.c\..*camargo/, value: 'A.C. Camargo', confidence: 0.85 },
    { pattern: /inep/, value: 'INEP', confidence: 0.9 },
    { pattern: /crm|conselho.*medicina/, value: 'CRM', confidence: 0.8 }
  ]

  for (const prova of provas) {
    if (prova.pattern.test(msgLower)) {
      entities.push({ type: 'prova_alvo', value: prova.value, confidence: prova.confidence })
      break
    }
  }

  // ==========================================
  // 2. ESPECIALIDADES MEDICAS (lista expandida)
  // ==========================================
  const especialidades = [
    // Clinicas
    'cardiologia', 'neurologia', 'pneumologia', 'gastroenterologia',
    'nefrologia', 'endocrinologia', 'reumatologia', 'infectologia',
    'hematologia', 'oncologia', 'geriatria', 'medicina intensiva',
    'emergencia', 'urgencia', 'clinica medica', 'clinica geral',
    // Cirurgicas
    'cirurgia geral', 'cirurgia cardiaca', 'cirurgia toracica',
    'cirurgia vascular', 'cirurgia plastica', 'neurocirurgia',
    'cirurgia pediatrica', 'cirurgia oncologica', 'cirurgia de cabeca e pescoco',
    // Pediatria
    'pediatria', 'neonatologia', 'pediatria geral',
    // Ginecologia e Obstetricia
    'ginecologia', 'obstetricia', 'ginecologia e obstetricia', 'mastologia',
    // Outras
    'ortopedia', 'traumatologia', 'dermatologia', 'psiquiatria',
    'oftalmologia', 'otorrinolaringologia', 'urologia', 'anestesiologia',
    'radiologia', 'patologia', 'medicina nuclear', 'medicina do trabalho',
    'medicina esportiva', 'medicina de familia', 'medicina preventiva',
    'alergia', 'imunologia', 'coloproctologia', 'angiologia',
    'medicina legal', 'genetica medica', 'nutrologia', 'acupuntura',
    'homeopatia', 'medicina fisica', 'reabilitacao', 'terapia intensiva'
  ]

  for (const esp of especialidades) {
    if (msgLower.includes(esp)) {
      entities.push({ type: 'especialidade_interesse', value: esp, confidence: 0.85 })
    }
  }

  // ==========================================
  // 3. NIVEL DE ESTUDO/CARREIRA
  // ==========================================
  if (msgLower.includes('interno') || msgLower.includes('internato')) {
    entities.push({ type: 'nivel_estudo', value: 'Internato', confidence: 0.9 })
  } else if (/\br[1-5]\b/.test(msgLower) || msgLower.includes('residente')) {
    const match = msgLower.match(/\br([1-5])\b/)
    const ano = match ? match[1] : ''
    entities.push({ type: 'nivel_estudo', value: ano ? `R${ano}` : 'Residencia', confidence: 0.9 })
  } else if (msgLower.includes('graduacao') || msgLower.includes('graduação') || msgLower.includes('academico') || msgLower.includes('acadêmico')) {
    entities.push({ type: 'nivel_estudo', value: 'Graduacao', confidence: 0.85 })
  } else if (msgLower.includes('medico') || msgLower.includes('médico')) {
    if (msgLower.includes('formado') || msgLower.includes('formada')) {
      entities.push({ type: 'nivel_estudo', value: 'Medico Formado', confidence: 0.8 })
    }
  }

  // Detectar ano do curso
  const anoMatch = msgLower.match(/(\d)[oº°]?\s*ano/i)
  if (anoMatch) {
    entities.push({ type: 'ano_curso', value: `${anoMatch[1]}o ano`, confidence: 0.9 })
  }

  // ==========================================
  // 4. DISPONIBILIDADE DE TEMPO
  // ==========================================
  const horasMatch = msgLower.match(/(\d+)\s*hora[s]?\s*(por\s*dia|diaria|\/dia)?/i)
  if (horasMatch) {
    entities.push({ type: 'horas_estudo_diarias', value: `${horasMatch[1]} horas`, confidence: 0.85 })
  }

  // Dias ate a prova
  const diasProvaMatch = msgLower.match(/(\d+)\s*(dias?|semanas?|mes(?:es)?)\s*(para|ate|até|faltam?)/i)
  if (diasProvaMatch) {
    entities.push({ type: 'tempo_ate_prova', value: `${diasProvaMatch[1]} ${diasProvaMatch[2]}`, confidence: 0.8 })
  }

  // ==========================================
  // 5. DOENCAS E CONDICOES (para contexto de estudo)
  // ==========================================
  const doencas = [
    // Cardiovasculares
    'infarto', 'icc', 'insuficiencia cardiaca', 'hipertensao', 'arritmia',
    'fibrilacao atrial', 'endocardite', 'pericardite', 'miocardite',
    // Respiratorias
    'pneumonia', 'dpoc', 'asma', 'tuberculose', 'covid', 'embolia pulmonar',
    // Neurologicas
    'avc', 'meningite', 'encefalite', 'parkinson', 'alzheimer', 'epilepsia',
    'esclerose multipla', 'guillain-barre', 'cefaleia', 'enxaqueca',
    // Gastro
    'cirrose', 'hepatite', 'pancreatite', 'colecistite', 'apendicite',
    'doenca de crohn', 'retocolite', 'ulcera peptica', 'refluxo',
    // Endocrinas
    'diabetes', 'hipotireoidismo', 'hipertireoidismo', 'cushing',
    'addison', 'feocromocitoma', 'cetoacidose',
    // Renais
    'insuficiencia renal', 'glomerulonefrite', 'nefrite', 'calculo renal',
    // Infecciosas
    'sepse', 'meningite', 'endocardite', 'osteomielite', 'celulite',
    'dengue', 'leishmaniose', 'malaria', 'chagas', 'toxoplasmose',
    // Oncologicas
    'leucemia', 'linfoma', 'mieloma', 'cancer de mama', 'cancer de pulmao',
    // Reumatologicas
    'lupus', 'artrite reumatoide', 'esclerodermia', 'vasculite', 'gota',
    // Emergencias
    'choque', 'trauma', 'politrauma', 'queimadura', 'intoxicacao', 'overdose'
  ]

  for (const doenca of doencas) {
    if (msgLower.includes(doenca)) {
      entities.push({ type: 'topico_medico', value: doenca, confidence: 0.9 })
    }
  }

  // ==========================================
  // 6. MEDICAMENTOS (contexto de estudo)
  // ==========================================
  const medicamentos = [
    'anticoagulante', 'warfarina', 'heparina', 'rivaroxabana',
    'antibiotico', 'amoxicilina', 'azitromicina', 'ciprofloxacino',
    'antihipertensivo', 'losartana', 'enalapril', 'anlodipino',
    'insulina', 'metformina', 'glibenclamida',
    'corticoide', 'prednisona', 'dexametasona',
    'analgesico', 'dipirona', 'paracetamol', 'morfina', 'tramadol',
    'antiinflamatorio', 'ibuprofeno', 'diclofenaco', 'nimesulida',
    'diuretico', 'furosemida', 'hidroclorotiazida', 'espironolactona',
    'antidepressivo', 'fluoxetina', 'sertralina', 'escitalopram',
    'broncodilatador', 'salbutamol', 'formoterol'
  ]

  for (const med of medicamentos) {
    if (msgLower.includes(med)) {
      entities.push({ type: 'medicamento_estudo', value: med, confidence: 0.85 })
    }
  }

  // ==========================================
  // 7. TIPO DE CONTEUDO PREFERIDO
  // ==========================================
  if (msgLower.includes('questao') || msgLower.includes('questoes') || msgLower.includes('questões')) {
    entities.push({ type: 'preferencia_conteudo', value: 'questoes', confidence: 0.9 })
  }
  if (msgLower.includes('flashcard') || msgLower.includes('flashcards')) {
    entities.push({ type: 'preferencia_conteudo', value: 'flashcards', confidence: 0.9 })
  }
  if (msgLower.includes('resumo') || msgLower.includes('resumos')) {
    entities.push({ type: 'preferencia_conteudo', value: 'resumos', confidence: 0.9 })
  }
  if (msgLower.includes('mapa mental') || msgLower.includes('mapas mentais')) {
    entities.push({ type: 'preferencia_conteudo', value: 'mapas_mentais', confidence: 0.9 })
  }
  if (msgLower.includes('video') || msgLower.includes('videos') || msgLower.includes('vídeos')) {
    entities.push({ type: 'preferencia_conteudo', value: 'videos', confidence: 0.85 })
  }

  // ==========================================
  // 8. DIFICULDADE/NIVEL
  // ==========================================
  if (msgLower.includes('facil') || msgLower.includes('fácil') || msgLower.includes('basico') || msgLower.includes('básico')) {
    entities.push({ type: 'nivel_dificuldade', value: 'facil', confidence: 0.85 })
  } else if (msgLower.includes('dificil') || msgLower.includes('difícil') || msgLower.includes('avancado') || msgLower.includes('avançado')) {
    entities.push({ type: 'nivel_dificuldade', value: 'dificil', confidence: 0.85 })
  } else if (msgLower.includes('medio') || msgLower.includes('médio') || msgLower.includes('intermediario') || msgLower.includes('intermediário')) {
    entities.push({ type: 'nivel_dificuldade', value: 'medio', confidence: 0.85 })
  }

  // ==========================================
  // 9. OBJETIVOS
  // ==========================================
  if (msgLower.includes('revisar') || msgLower.includes('revisao') || msgLower.includes('revisão')) {
    entities.push({ type: 'objetivo', value: 'revisao', confidence: 0.85 })
  }
  if (msgLower.includes('aprender') || msgLower.includes('entender') || msgLower.includes('compreender')) {
    entities.push({ type: 'objetivo', value: 'aprendizado', confidence: 0.8 })
  }
  if (msgLower.includes('praticar') || msgLower.includes('treinar') || msgLower.includes('exercitar')) {
    entities.push({ type: 'objetivo', value: 'pratica', confidence: 0.85 })
  }

  return entities
}

/**
 * Processa mensagem e salva entidades detectadas
 */
export async function processMessageForMemory(
  userId: string,
  message: string,
  conversaId?: string
): Promise<void> {
  const entities = detectEntities(message)

  for (const entity of entities) {
    await saveEntity(userId, entity.type, entity.value, conversaId)
  }

  // Extrair topico principal se for pergunta de estudo
  const topicMatch = message.match(/sobre\s+(.{3,50})[\?\.]?/i)
  if (topicMatch) {
    const topic = topicMatch[1].trim()
    await saveLearningTopic(userId, topic)
  }
}

/**
 * Gera resumo automatico de uma conversa
 */
export async function generateAndSaveConversationSummary(
  userId: string,
  conversaId: string,
  messages: Array<{ role: string; content: string }>
): Promise<void> {
  // Gerar resumo simples (pode ser melhorado com IA)
  const userMessages = messages.filter(m => m.role === 'user')
  const topics = userMessages.map(m => {
    // Extrair primeiras palavras-chave
    const words = m.content.split(' ').slice(0, 10).join(' ')
    return words
  })

  const summary = `Conversa sobre: ${topics.slice(0, 3).join('; ')}`

  await saveConversationSummary(userId, conversaId, summary)
}

// ==========================================
// SQL PARA CRIAR TABELA (executar no Supabase)
// ==========================================

export const CREATE_TABLE_SQL = `
-- Tabela de memoria persistente
CREATE TABLE IF NOT EXISTS user_memory_med (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversa_id UUID REFERENCES conversas_ia_med(id) ON DELETE SET NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entity', 'summary', 'preference', 'learning')),
  chave VARCHAR(100) NOT NULL,
  valor TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, tipo, chave)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory_med(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_tipo ON user_memory_med(tipo);
CREATE INDEX IF NOT EXISTS idx_user_memory_updated ON user_memory_med(updated_at DESC);

-- RLS
ALTER TABLE user_memory_med ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memory"
  ON user_memory_med FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory"
  ON user_memory_med FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory"
  ON user_memory_med FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memory"
  ON user_memory_med FOR DELETE
  USING (auth.uid() = user_id);

-- Service role pode tudo
CREATE POLICY "Service role full access"
  ON user_memory_med
  USING (auth.jwt() ->> 'role' = 'service_role');
`

// ==========================================
// EXPORTS
// ==========================================

export default {
  saveMemory,
  getUserMemory,
  saveEntity,
  saveConversationSummary,
  saveLearningTopic,
  savePreference,
  getContextForPrompt,
  detectEntities,
  processMessageForMemory,
  generateAndSaveConversationSummary
}
