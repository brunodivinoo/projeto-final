/**
 * API Route - Sugestões Inteligentes
 *
 * Retorna sugestões personalizadas baseadas no histórico de aprendizado do usuário
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllSuggestions } from '@/lib/suggestions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Buscar sugestões personalizadas
    const sugestoes = await getAllSuggestions(userId)

    return NextResponse.json({
      success: true,
      sugestoes: {
        topics: sugestoes.topics.slice(0, 4),
        actions: sugestoes.actions.slice(0, 4),
        reviews: sugestoes.reviews.slice(0, 3)
      }
    })
  } catch (error) {
    console.error('[Sugestões API] Erro:', error)
    // Em caso de erro, retornar sugestões padrão
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
