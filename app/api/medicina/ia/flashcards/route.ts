// API Route - Geração de Flashcards IA PREPARAMED

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PlanoIA, verificarLimiteIA, incrementarUsoIA, calcularCusto } from '@/lib/ai'
import { PROMPT_GERAR_FLASHCARDS, SYSTEM_PROMPT_PREMIUM, SYSTEM_PROMPT_RESIDENCIA } from '@/lib/ai/prompts'
import { MODELOS } from '@/lib/ai/config'
import { TOOL_GERAR_FLASHCARDS } from '@/lib/ai/tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface Flashcard {
  frente: string
  verso: string
  dificuldade: 'facil' | 'medio' | 'dificil'
  tags?: string[]
}

// ==========================================
// POST - Gerar Flashcards
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, tema, quantidade = 10, dificuldade = 'misto' } = body

    if (!user_id || !tema) {
      return NextResponse.json(
        { error: 'user_id e tema são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar quantidade
    const qtd = Math.min(Math.max(parseInt(quantidade) || 10, 1), 30) // Entre 1 e 30

    // Buscar plano do usuário
    const { data: profile } = await supabase
      .from('profiles_med')
      .select('plano')
      .eq('id', user_id)
      .single()

    const plano = (profile?.plano || 'gratuito') as PlanoIA

    // Verificar se plano permite
    if (plano === 'gratuito') {
      return NextResponse.json(
        { error: 'Geração de flashcards não disponível no plano gratuito' },
        { status: 403 }
      )
    }

    // Verificar limite
    const { permitido, usado, limite } = await verificarLimiteIA(user_id, plano, 'flashcards')
    if (!permitido) {
      return NextResponse.json(
        {
          error: `Limite de flashcards atingido (${usado}/${limite})`,
          usado,
          limite
        },
        { status: 429 }
      )
    }

    // Construir prompt
    const promptCompleto = `${PROMPT_GERAR_FLASHCARDS}

TEMA: ${tema}
QUANTIDADE: ${qtd} flashcards
DIFICULDADE: ${dificuldade === 'misto' ? 'variada (fácil, médio e difícil)' : dificuldade}

Gere exatamente ${qtd} flashcards de alta qualidade para provas de residência médica.
Retorne em formato JSON com a estrutura: { "flashcards": [{ "frente": "...", "verso": "...", "dificuldade": "facil|medio|dificil", "tags": ["..."] }] }`

    let flashcards: Flashcard[] = []
    let tokensInput = 0
    let tokensOutput = 0

    if (plano === 'residencia') {
      // CLAUDE - Usar structured output
      const response = await anthropic.messages.create({
        model: MODELOS.claude.opus,
        max_tokens: 8192,
        system: SYSTEM_PROMPT_RESIDENCIA,
        tools: [TOOL_GERAR_FLASHCARDS],
        tool_choice: { type: 'tool', name: 'gerar_flashcards' },
        messages: [{ role: 'user', content: promptCompleto }]
      })

      tokensInput = response.usage.input_tokens
      tokensOutput = response.usage.output_tokens

      // Extrair flashcards
      const toolUse = response.content.find(b => b.type === 'tool_use')

      if (toolUse && toolUse.type === 'tool_use') {
        const resultado = toolUse.input as { flashcards: Flashcard[] }
        flashcards = resultado.flashcards || []
      }
    } else {
      // GEMINI - Gerar com JSON mode
      const model = genAI.getGenerativeModel({
        model: MODELOS.gemini.flash,
        systemInstruction: SYSTEM_PROMPT_PREMIUM,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      })

      const result = await model.generateContent(promptCompleto)
      const jsonResponse = result.response.text()

      try {
        const parsed = JSON.parse(jsonResponse)
        flashcards = parsed.flashcards || []
      } catch {
        // Tentar extrair JSON do texto
        const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          flashcards = parsed.flashcards || []
        }
      }

      // Estimar tokens
      tokensInput = Math.ceil(promptCompleto.length / 4)
      tokensOutput = Math.ceil(jsonResponse.length / 4)
    }

    // Salvar flashcards no banco
    const flashcardsParaSalvar = flashcards.map(f => ({
      user_id,
      tema,
      frente: f.frente,
      verso: f.verso,
      dificuldade: f.dificuldade || 'medio',
      tags: f.tags || [tema]
    }))

    const { data: savedFlashcards, error: saveError } = await supabase
      .from('flashcards_ia_med')
      .insert(flashcardsParaSalvar)
      .select()

    if (saveError) {
      console.error('Erro ao salvar flashcards:', saveError)
    }

    // Incrementar uso (conta quantidade de flashcards)
    const custo = calcularCusto(
      plano === 'residencia' ? MODELOS.claude.opus : 'gemini-flash',
      tokensInput,
      tokensOutput
    )
    await incrementarUsoIA(user_id, 'flashcards', flashcards.length, tokensInput, tokensOutput, custo)

    return NextResponse.json({
      success: true,
      flashcards: savedFlashcards || flashcards,
      quantidade: flashcards.length,
      tokens: tokensInput + tokensOutput
    })
  } catch (error) {
    console.error('Erro ao gerar flashcards:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ==========================================
// GET - Listar Flashcards do Usuário
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const tema = searchParams.get('tema')
    const para_revisar = searchParams.get('para_revisar')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    let query = supabase
      .from('flashcards_ia_med')
      .select('*')
      .eq('user_id', user_id)

    if (tema) {
      query = query.eq('tema', tema)
    }

    if (para_revisar === 'true') {
      // Flashcards que precisam ser revisados (próxima revisão <= agora)
      query = query.or(`proxima_revisao.is.null,proxima_revisao.lte.${new Date().toISOString()}`)
    }

    const { data: flashcards } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    // Agrupar por tema
    const temas = [...new Set(flashcards?.map(f => f.tema) || [])]

    return NextResponse.json({ flashcards, temas })
  } catch (error) {
    console.error('Erro ao buscar flashcards:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ==========================================
// PUT - Atualizar Flashcard (após revisão)
// ==========================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { flashcard_id, user_id, acertou } = body

    if (!flashcard_id || !user_id || acertou === undefined) {
      return NextResponse.json(
        { error: 'flashcard_id, user_id e acertou são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar flashcard atual
    const { data: flashcard } = await supabase
      .from('flashcards_ia_med')
      .select('*')
      .eq('id', flashcard_id)
      .eq('user_id', user_id)
      .single()

    if (!flashcard) {
      return NextResponse.json({ error: 'Flashcard não encontrado' }, { status: 404 })
    }

    // Calcular próxima revisão (algoritmo simples de repetição espaçada)
    const revisoes = (flashcard.revisoes || 0) + 1
    let diasAteProximaRevisao = 1

    if (acertou) {
      // Se acertou, aumenta o intervalo
      diasAteProximaRevisao = Math.min(Math.pow(2, revisoes), 30) // Máximo 30 dias
    } else {
      // Se errou, volta para 1 dia
      diasAteProximaRevisao = 1
    }

    const proximaRevisao = new Date()
    proximaRevisao.setDate(proximaRevisao.getDate() + diasAteProximaRevisao)

    // Atualizar flashcard
    const { data: updated } = await supabase
      .from('flashcards_ia_med')
      .update({
        revisoes,
        proxima_revisao: proximaRevisao.toISOString()
      })
      .eq('id', flashcard_id)
      .select()
      .single()

    return NextResponse.json({
      success: true,
      flashcard: updated,
      proxima_revisao: proximaRevisao.toISOString(),
      dias_ate_revisao: diasAteProximaRevisao
    })
  } catch (error) {
    console.error('Erro ao atualizar flashcard:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ==========================================
// DELETE - Excluir Flashcard(s)
// ==========================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const flashcard_id = searchParams.get('flashcard_id')
    const tema = searchParams.get('tema')
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (flashcard_id) {
      // Deletar um flashcard específico
      await supabase
        .from('flashcards_ia_med')
        .delete()
        .eq('id', flashcard_id)
        .eq('user_id', user_id)
    } else if (tema) {
      // Deletar todos de um tema
      await supabase
        .from('flashcards_ia_med')
        .delete()
        .eq('tema', tema)
        .eq('user_id', user_id)
    } else {
      return NextResponse.json(
        { error: 'flashcard_id ou tema é obrigatório' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar flashcard:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
