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
 */
export function detectEntities(message: string): Array<{ type: string; value: string }> {
  const entities: Array<{ type: string; value: string }> = []
  const msgLower = message.toLowerCase()

  // Detectar provas alvo
  const provas = [
    { pattern: /residencia|residência/, value: 'Residência Médica' },
    { pattern: /revalida/, value: 'REVALIDA' },
    { pattern: /enade/, value: 'ENADE' },
    { pattern: /usp/, value: 'USP' },
    { pattern: /unicamp/, value: 'UNICAMP' },
    { pattern: /unifesp/, value: 'UNIFESP' }
  ]

  for (const prova of provas) {
    if (prova.pattern.test(msgLower)) {
      entities.push({ type: 'prova_alvo', value: prova.value })
      break
    }
  }

  // Detectar especialidades
  const especialidades = [
    'cardiologia', 'neurologia', 'pediatria', 'ginecologia', 'cirurgia',
    'clinica medica', 'clínica médica', 'ortopedia', 'dermatologia',
    'psiquiatria', 'oftalmologia', 'urologia', 'nefrologia', 'pneumologia',
    'gastroenterologia', 'endocrinologia', 'reumatologia', 'infectologia',
    'oncologia', 'hematologia', 'geriatria', 'medicina intensiva'
  ]

  for (const esp of especialidades) {
    if (msgLower.includes(esp)) {
      entities.push({ type: 'especialidade_interesse', value: esp })
    }
  }

  // Detectar nivel de estudo
  if (msgLower.includes('interno') || msgLower.includes('internato')) {
    entities.push({ type: 'nivel_estudo', value: 'Internato' })
  } else if (msgLower.includes('residente') || msgLower.includes('r1') || msgLower.includes('r2')) {
    entities.push({ type: 'nivel_estudo', value: 'Residência' })
  } else if (msgLower.includes('graduacao') || msgLower.includes('graduação') || msgLower.includes('academico') || msgLower.includes('acadêmico')) {
    entities.push({ type: 'nivel_estudo', value: 'Graduação' })
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
