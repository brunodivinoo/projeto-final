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
 * Inclui: provas, especialidades, nivel de estudo, doencas, medicamentos, areas anatomicas
 */
export function detectEntities(message: string): Array<{ type: string; value: string; confidence?: number }> {
  const entities: Array<{ type: string; value: string; confidence?: number }> = []
  const msgLower = message.toLowerCase()

  // Detectar provas alvo
  const provas = [
    { pattern: /residencia|residência/i, value: 'Residência Médica' },
    { pattern: /revalida/i, value: 'REVALIDA' },
    { pattern: /enade/i, value: 'ENADE' },
    { pattern: /enamed/i, value: 'ENAMED' },
    { pattern: /enare/i, value: 'ENARE' },
    { pattern: /usp/i, value: 'USP' },
    { pattern: /unicamp/i, value: 'UNICAMP' },
    { pattern: /unifesp/i, value: 'UNIFESP' },
    { pattern: /santa\s*casa/i, value: 'Santa Casa' },
    { pattern: /sus/i, value: 'Prova SUS' },
    { pattern: /concurso/i, value: 'Concurso Médico' }
  ]

  for (const prova of provas) {
    if (prova.pattern.test(message)) {
      entities.push({ type: 'prova_alvo', value: prova.value, confidence: 0.9 })
      break
    }
  }

  // Detectar especialidades (expandido)
  const especialidades = [
    'cardiologia', 'neurologia', 'pediatria', 'ginecologia', 'obstetrícia', 'obstetricia',
    'cirurgia geral', 'cirurgia', 'clínica médica', 'clinica medica', 'ortopedia',
    'dermatologia', 'psiquiatria', 'oftalmologia', 'urologia', 'nefrologia',
    'pneumologia', 'gastroenterologia', 'endocrinologia', 'reumatologia',
    'infectologia', 'oncologia', 'hematologia', 'geriatria', 'medicina intensiva',
    'emergência', 'emergencia', 'anestesiologia', 'radiologia', 'patologia',
    'medicina de família', 'medicina de familia', 'otorrinolaringologia',
    'cirurgia cardíaca', 'cirurgia cardiaca', 'cirurgia pediátrica',
    'neonatologia', 'medicina do trabalho', 'medicina esportiva',
    'medicina legal', 'saúde pública', 'saude publica', 'epidemiologia'
  ]

  for (const esp of especialidades) {
    if (msgLower.includes(esp)) {
      entities.push({ type: 'especialidade_interesse', value: esp, confidence: 0.85 })
    }
  }

  // Detectar nivel de estudo
  if (msgLower.includes('interno') || msgLower.includes('internato')) {
    entities.push({ type: 'nivel_estudo', value: 'Internato', confidence: 0.9 })
  } else if (msgLower.includes('residente') || msgLower.includes('r1') || msgLower.includes('r2') || msgLower.includes('r3')) {
    entities.push({ type: 'nivel_estudo', value: 'Residência', confidence: 0.9 })
  } else if (msgLower.includes('graduacao') || msgLower.includes('graduação') || msgLower.includes('academico') || msgLower.includes('acadêmico')) {
    entities.push({ type: 'nivel_estudo', value: 'Graduação', confidence: 0.9 })
  } else if (msgLower.includes('pos-graduacao') || msgLower.includes('pós-graduação') || msgLower.includes('mestrado') || msgLower.includes('doutorado')) {
    entities.push({ type: 'nivel_estudo', value: 'Pós-Graduação', confidence: 0.9 })
  }

  // Detectar doenças e condições médicas
  const doencas = [
    { pattern: /diabetes\s*(mellitus|tipo\s*[12])?/i, value: 'Diabetes Mellitus' },
    { pattern: /hipertens[ãa]o\s*(arterial)?/i, value: 'Hipertensão Arterial' },
    { pattern: /insufici[êe]ncia\s*(card[íi]aca|renal|hep[áa]tica|respirat[óo]ria)/i, value: (m: string) => `Insuficiência ${m}` },
    { pattern: /infarto|iam|sca/i, value: 'Infarto Agudo do Miocárdio' },
    { pattern: /avc|acidente\s+vascular/i, value: 'AVC' },
    { pattern: /pneumonia/i, value: 'Pneumonia' },
    { pattern: /asma/i, value: 'Asma' },
    { pattern: /dpoc/i, value: 'DPOC' },
    { pattern: /c[âa]ncer|neoplasia|tumor/i, value: 'Neoplasia' },
    { pattern: /covid|sars-cov/i, value: 'COVID-19' },
    { pattern: /s[íi]ndrome\s+(?:dos?\s+)?([a-záéíóúãõê\s]+)/i, value: (m: string) => `Síndrome ${m}` },
    { pattern: /lupus|l[úu]pus/i, value: 'Lúpus Eritematoso Sistêmico' },
    { pattern: /sepse|sepsis/i, value: 'Sepse' },
    { pattern: /meningite/i, value: 'Meningite' },
    { pattern: /tuberculose|tb/i, value: 'Tuberculose' },
    { pattern: /hiv|aids/i, value: 'HIV/AIDS' }
  ]

  for (const doenca of doencas) {
    const match = doenca.pattern.exec(message)
    if (match) {
      const valor = typeof doenca.value === 'function' ? doenca.value(match[1] || '') : doenca.value
      entities.push({ type: 'doenca_estudada', value: valor, confidence: 0.8 })
    }
  }

  // Detectar medicamentos (por sufixos farmacológicos)
  const medRegex = /\b([a-záéíóúãõê]+(?:ol|ina|mab|nib|pril|sartan|statina|cilina|micina|zol|pam|lol|dipina|prazol|tidina|setron|triptano))\b/gi
  let medMatch
  while ((medMatch = medRegex.exec(msgLower)) !== null) {
    const med = medMatch[1]
    if (med.length > 4) { // Ignorar palavras muito curtas
      entities.push({ type: 'medicamento_mencionado', value: med, confidence: 0.7 })
    }
  }

  // Detectar áreas anatômicas
  const anatomia = [
    'coração', 'coracao', 'pulmão', 'pulmao', 'fígado', 'figado',
    'rim', 'rins', 'cérebro', 'cerebro', 'estômago', 'estomago',
    'intestino', 'pâncreas', 'pancreas', 'tireoide', 'tireóide',
    'útero', 'utero', 'ovário', 'ovario', 'próstata', 'prostata',
    'mama', 'sistema reprodutor', 'sistema nervoso', 'sistema cardiovascular',
    'sistema respiratório', 'sistema digestório', 'sistema urinário',
    'sistema endócrino', 'sistema imunológico', 'sistema musculoesquelético'
  ]

  for (const area of anatomia) {
    if (msgLower.includes(area)) {
      entities.push({ type: 'area_anatomica', value: area, confidence: 0.75 })
    }
  }

  // Detectar tipo de estudo preferido
  if (msgLower.includes('questão') || msgLower.includes('questao') || msgLower.includes('questoes') || msgLower.includes('questões')) {
    entities.push({ type: 'preferencia_estudo', value: 'questões', confidence: 0.6 })
  }
  if (msgLower.includes('flashcard') || msgLower.includes('flash card')) {
    entities.push({ type: 'preferencia_estudo', value: 'flashcards', confidence: 0.6 })
  }
  if (msgLower.includes('resumo') || msgLower.includes('resumir')) {
    entities.push({ type: 'preferencia_estudo', value: 'resumos', confidence: 0.6 })
  }

  return entities
}

/**
 * Processa mensagem e salva entidades detectadas
 * Salva apenas entidades com confiança >= threshold
 */
export async function processMessageForMemory(
  userId: string,
  message: string,
  conversaId?: string,
  confidenceThreshold: number = 0.6
): Promise<{ entitiesFound: number; topicsSaved: number }> {
  const entities = detectEntities(message)
  let entitiesFound = 0
  let topicsSaved = 0

  // Salvar entidades com confiança suficiente
  for (const entity of entities) {
    if ((entity.confidence || 0.5) >= confidenceThreshold) {
      const saved = await saveEntity(userId, entity.type, entity.value, conversaId)
      if (saved) entitiesFound++
    }
  }

  // Extrair topico principal - multiplas estratégias
  const topicPatterns = [
    /sobre\s+(?:o\s+|a\s+|os\s+|as\s+)?(.{3,80})[\?\.]?$/i,
    /(?:estud|aprend|revis|entend)(?:ar|er|o)\s+(?:sobre\s+)?(.{3,80})[\?\.]?$/i,
    /(?:explique|me explique|o que [ée])\s+(.{3,80})[\?\.]?$/i,
    /(?:gere|crie)\s+.*(?:sobre|de)\s+(.{3,80})$/i
  ]

  for (const pattern of topicPatterns) {
    const topicMatch = message.match(pattern)
    if (topicMatch) {
      const topic = topicMatch[1]
        .replace(/[?.!,;]+$/, '')
        .replace(/\s+/g, ' ')
        .trim()
      if (topic.length >= 3 && topic.length <= 100) {
        const saved = await saveLearningTopic(userId, topic)
        if (saved) topicsSaved++
        break
      }
    }
  }

  return { entitiesFound, topicsSaved }
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
