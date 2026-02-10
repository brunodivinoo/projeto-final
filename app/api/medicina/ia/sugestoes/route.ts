/**
 * API Route - Sugestões Inteligentes
 *
 * GET: Retorna sugestões personalizadas baseadas no histórico de aprendizado do usuário
 * POST: Gera sugestões contextuais com IA baseadas nas mensagens da conversa atual
 */

import { NextRequest, NextResponse } from 'next/server'
import { cachedResponse } from '@/lib/api-cache'
import { getAllSuggestions } from '@/lib/suggestions'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { MODELOS } from '@/lib/ai/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Buscar sugestões personalizadas
    const sugestoes = await getAllSuggestions(userId)

    return cachedResponse({
      success: true,
      sugestoes: {
        topics: sugestoes.topics.slice(0, 4),
        actions: sugestoes.actions.slice(0, 4),
        reviews: sugestoes.reviews.slice(0, 3)
      }
    }, 'private-medium')
  } catch (error) {
    console.error('[Sugestões API] Erro:', error)
    return NextResponse.json({
      success: true,
      sugestoes: {
        topics: [],
        actions: [
          { type: 'action', text: 'Gerar questões', fullPrompt: 'Gere 5 questões sobre um tema de medicina', icon: '📝', priority: 1 },
          { type: 'action', text: 'Criar flashcards', fullPrompt: 'Crie flashcards sobre um tema médico', icon: '🃏', priority: 2 },
          { type: 'action', text: 'Explicar conceito', fullPrompt: 'Explique detalhadamente um conceito médico', icon: '📚', priority: 3 },
          { type: 'action', text: 'Caso clínico', fullPrompt: 'Apresente um caso clínico para análise', icon: '🏥', priority: 4 }
        ],
        reviews: []
      }
    })
  }
}

// POST: Gerar sugestões contextuais com IA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mensagens } = body as { mensagens: { role: string; content: string }[] }

    if (!mensagens || mensagens.length === 0) {
      return NextResponse.json({ suggestions: [] }, { status: 400 })
    }

    // Pegar as últimas 6 mensagens (3 pares user/assistant) para contexto
    const recentMessages = mensagens.slice(-6)

    // Montar contexto resumido
    const contexto = recentMessages.map(m => {
      const role = m.role === 'user' ? 'Aluno' : 'Professor'
      // Limitar cada mensagem a 300 chars para não estourar tokens
      const content = m.content.length > 300
        ? m.content.substring(0, 300) + '...'
        : m.content
      return `${role}: ${content}`
    }).join('\n')

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: MODELOS.gemini.flash,
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 256
      }
    })

    const prompt = `Você é um tutor de medicina para residência médica. Com base na conversa abaixo entre aluno e professor, gere exatamente 4 sugestões de próximas perguntas que o aluno poderia fazer para aprofundar o estudo.

CONVERSA:
${contexto}

REGRAS:
- Gere 4 sugestões curtas (máximo 8 palavras cada)
- Cada sugestão deve ser uma ação direta: "Gere questões sobre X", "Crie flashcards de Y", "Explique Z", "Compare A vs B", "Faça um fluxograma de W"
- As sugestões devem ser DIFERENTES entre si (cobrir diferentes tipos: questões, flashcards, explicação, comparação, fluxograma)
- Baseie-se no CONTEXTO da conversa - aprofunde no tema discutido
- Formato: uma sugestão por linha, sem numeração, sem aspas, sem marcadores

SUGESTÕES:`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Parsear as 4 linhas
    const suggestions = text
      .split('\n')
      .map(line => line.replace(/^[-•*\d.)\s]+/, '').trim())
      .filter(line => line.length > 5 && line.length < 80)
      .slice(0, 4)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[Sugestões IA] Erro:', error)
    return NextResponse.json({ suggestions: [] })
  }
}
