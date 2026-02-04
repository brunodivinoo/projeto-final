// API Route - Chat IA com LangChain Orchestrator
// Nova arquitetura com classificador de intencao e multi-agentes

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Configuracao
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Importacoes do LangChain
import {
  orchestrate,
  classifyIntent,
  type OrchestratorInput,
  type Intention
} from '@/lib/langchain'

// Importacoes do sistema de agentes
import {
  generateStudyPlan,
  generateContent,
  type StudyPlanRequest,
  type ContentRequest
} from '@/lib/agents'

// Supabase
// supabase - usar getSupabaseAdmin() dentro das funções

// ==========================================
// TIPOS
// ==========================================

interface RequestBody {
  user_id: string
  mensagem: string
  conversa_id?: string
  modo?: 'chat' | 'questoes' | 'flashcards' | 'caso_clinico' | 'tutor' | 'plano_estudos'
  use_web_search?: boolean
  use_extended_thinking?: boolean
  context?: {
    previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
    userProfile?: Record<string, unknown>
  }
}

// ==========================================
// POST - Processar mensagem
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()

    const {
      user_id,
      mensagem,
      conversa_id,
      modo = 'chat',
      use_web_search = false,
      context
    } = body

    // Validar usuario
    if (!user_id || !mensagem) {
      return NextResponse.json(
        { error: 'user_id e mensagem sao obrigatorios' },
        { status: 400 }
      )
    }

    // Buscar perfil do usuario
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles_med')
      .select('plano, nome')
      .eq('id', user_id)
      .single()

    const plano = profile?.plano || 'premium'
    const isResidencia = plano === 'residencia'

    // Definir system prompt baseado no plano
    const systemPrompt = isResidencia
      ? getResidenciaSystemPrompt(profile?.nome)
      : getPremiumSystemPrompt(profile?.nome)

    // ==========================================
    // CLASSIFICAR INTENCAO
    // ==========================================
    console.log('[LangChain API] Classificando intencao...')

    const intention = await classifyIntent(mensagem, {
      previousContext: context?.previousMessages?.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')
    })

    console.log(`[LangChain API] Intencao: ${intention.primaryIntent} (${intention.confidence})`)

    // ==========================================
    // ROTEAR PARA HANDLER APROPRIADO
    // ==========================================

    // Modo forcado pelo frontend
    if (modo === 'plano_estudos' || intention.primaryIntent === 'plano_estudos') {
      return await handleStudyPlan(mensagem, intention)
    }

    if (modo === 'questoes' || intention.primaryIntent === 'gerar_questoes') {
      return await handleQuestoes(mensagem, intention)
    }

    if (modo === 'flashcards' || intention.primaryIntent === 'gerar_flashcards') {
      return await handleFlashcards(mensagem, intention)
    }

    // ==========================================
    // CHAT PADRAO COM ORQUESTRADOR
    // ==========================================
    console.log('[LangChain API] Usando orquestrador padrao...')

    const result = await orchestrate({
      message: mensagem,
      systemPrompt,
      userId: user_id,
      conversaId: conversa_id,
      previousMessages: context?.previousMessages,
      preferredProvider: isResidencia ? 'claude' : 'gemini'
    })

    // Salvar mensagem e resposta no banco
    if (conversa_id) {
      await saveMessages(conversa_id, user_id, mensagem, result.response)
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      intention: {
        primary: result.intention.primaryIntent,
        confidence: result.intention.confidence,
        topic: result.intention.topic
      },
      tokens: result.tokens,
      provider: result.provider,
      artifacts: result.artifacts
    })

  } catch (error) {
    console.error('[LangChain API] Erro:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      response: 'Ocorreu um problema temporario. Por favor, tente novamente.'
    }, { status: 500 })
  }
}

// ==========================================
// HANDLERS ESPECIFICOS
// ==========================================

async function handleStudyPlan(mensagem: string, intention: Intention) {
  console.log('[LangChain API] Gerando plano de estudos...')

  // Extrair informacoes da mensagem
  const horasMatch = mensagem.match(/(\d+)\s*h(oras?)?/i)
  const diasMatch = mensagem.match(/(\d+)\s*dias?/i)

  const request: StudyPlanRequest = {
    objetivo: mensagem,
    provaAlvo: intention.topic || undefined,
    horasDisponiveis: horasMatch ? parseInt(horasMatch[1]) : 4,
    areasFortes: undefined,
    areasFracas: undefined,
    incluirMaterial: true,
    nivelDetalhe: 'detalhado'
  }

  if (diasMatch) {
    // Se especificou dias, calcular data
    const dias = parseInt(diasMatch[1])
    const dataFim = new Date()
    dataFim.setDate(dataFim.getDate() + dias)
    request.dataProva = dataFim.toISOString().split('T')[0]
  }

  const result = await generateStudyPlan(request)

  return NextResponse.json({
    success: true,
    response: result.formatted,
    intention: {
      primary: 'plano_estudos',
      confidence: intention.confidence,
      topic: intention.topic
    },
    artifacts: {
      type: 'plano_estudos',
      data: result.plano
    },
    executionLog: result.executionLog
  })
}

async function handleQuestoes(mensagem: string, intention: Intention) {
  console.log('[LangChain API] Gerando questoes...')

  // Extrair quantidade
  const match = mensagem.match(/(\d+)\s*quest/i)
  const quantidade = match ? Math.min(parseInt(match[1]), 20) : 5

  const request: ContentRequest = {
    tema: intention.topic || mensagem.replace(/gere?|crie?|\d+|quest(oes|ao)?/gi, '').trim() || 'medicina geral',
    tipos: ['questoes'],
    quantidades: { questoes: quantidade },
    dificuldade: 'mista',
    revisarConteudo: true
  }

  const result = await generateContent(request)

  return NextResponse.json({
    success: true,
    response: result.formatted,
    intention: {
      primary: 'gerar_questoes',
      confidence: intention.confidence,
      topic: intention.topic
    },
    artifacts: {
      type: 'questoes',
      data: result.conteudos[0]
    }
  })
}

async function handleFlashcards(mensagem: string, intention: Intention) {
  console.log('[LangChain API] Gerando flashcards...')

  const match = mensagem.match(/(\d+)\s*flash/i)
  const quantidade = match ? Math.min(parseInt(match[1]), 30) : 10

  const request: ContentRequest = {
    tema: intention.topic || mensagem.replace(/gere?|crie?|\d+|flash\s*cards?/gi, '').trim() || 'medicina geral',
    tipos: ['flashcards'],
    quantidades: { flashcards: quantidade },
    revisarConteudo: false // Flashcards sao mais simples, nao precisa revisar
  }

  const result = await generateContent(request)

  return NextResponse.json({
    success: true,
    response: result.formatted,
    intention: {
      primary: 'gerar_flashcards',
      confidence: intention.confidence,
      topic: intention.topic
    },
    artifacts: {
      type: 'flashcards',
      data: result.conteudos[0]
    }
  })
}

// ==========================================
// HELPERS
// ==========================================

async function saveMessages(
  conversaId: string,
  userId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
    // Salvar mensagem do usuario
    await getSupabaseAdmin().from('mensagens_med').insert({
      conversa_id: conversaId,
      user_id: userId,
      role: 'user',
      content: userMessage
    })

    // Salvar resposta do assistente
    await getSupabaseAdmin().from('mensagens_med').insert({
      conversa_id: conversaId,
      user_id: userId,
      role: 'assistant',
      content: assistantResponse
    })
  } catch (error) {
    console.error('[LangChain API] Erro ao salvar mensagens:', error)
  }
}

function getResidenciaSystemPrompt(nome?: string): string {
  return `Voce e o PREPARA MED IA, assistente de estudos para residencia medica.
${nome ? `O estudante se chama ${nome}.` : ''}

Voce tem acesso a:
- Busca web para guidelines e informacoes atualizadas
- Geracao de questoes no estilo REVALIDA, USP, UNICAMP
- Criacao de flashcards para memorizacao
- Analise de imagens medicas
- Planejamento de estudos personalizado

Responda de forma didatica, completa e focada em provas de residencia.
Use referencias quando apropriado.
Inclua diagramas Mermaid quando ajudar na compreensao.`
}

function getPremiumSystemPrompt(nome?: string): string {
  return `Voce e o PREPARA MED IA, assistente de estudos medicos.
${nome ? `O estudante se chama ${nome}.` : ''}

Ajude com:
- Explicacoes de conceitos medicos
- Questoes e exercicios
- Flashcards para revisao
- Duvidas gerais sobre medicina

Responda de forma clara e didatica.`
}

// ==========================================
// GET - Info da API
// ==========================================

export async function GET() {
  return NextResponse.json({
    name: 'PREPARA MED - LangChain API',
    version: '2.0.0',
    features: [
      'Intent Classification',
      'Multi-Provider Fallback',
      'Conversation Memory',
      'Multi-Agent System',
      'Content Generation'
    ],
    chains: ['chat', 'questoes', 'flashcards', 'resumo'],
    agents: ['researcher', 'planner', 'creator', 'reviewer'],
    crews: ['study-plan', 'content']
  })
}
