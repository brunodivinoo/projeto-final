import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  chatNutriIA,
  gerarReceita,
  dicaDoDia,
  type ProfileContext
} from '@/lib/nutrivida/ai-engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================================================
// POST - Chat com a NutriVida IA (com retry, cache, fallback)
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const { mensagem, historico, userId, conversaId, modo } = await request.json()

    if (!mensagem) {
      return NextResponse.json({ error: 'Mensagem e obrigatoria' }, { status: 400 })
    }

    // Buscar perfil da usuaria para contexto
    let perfil: ProfileContext | undefined
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles_nutri')
        .select('nome, idade, peso_atual, peso_meta, altura, idade_bebe, amamentando, plano, semana_gestacao, restricoes, preferencias')
        .eq('id', userId)
        .single()

      if (profile) {
        perfil = {
          nome: profile.nome || undefined,
          idade: profile.idade || undefined,
          peso_atual: profile.peso_atual || undefined,
          peso_meta: profile.peso_meta || undefined,
          altura: profile.altura || undefined,
          idade_bebe: profile.idade_bebe || undefined,
          amamentando: profile.amamentando || false,
          plano: profile.plano || 'normal',
          semana_gestacao: profile.semana_gestacao || undefined,
          restricoes: profile.restricoes || undefined,
          preferencias: profile.preferencias || undefined
        }
      }
    }

    // Usar o novo engine de IA avançado com retry, cache e fallback
    const { resposta, fromCache } = await chatNutriIA(
      mensagem,
      historico || [],
      perfil,
      modo || 'normal'
    )

    // Salvar no banco se tiver userId
    if (userId) {
      try {
        let conversa_id = conversaId

        if (!conversa_id) {
          const { data: novaConversa, error: convError } = await supabase
            .from('chat_ia_nutri')
            .insert({
              user_id: userId,
              titulo: mensagem.substring(0, 50),
              mensagens: []
            })
            .select('id')
            .single()

          if (!convError && novaConversa) {
            conversa_id = novaConversa.id
          }
        }

        if (conversa_id) {
          const { data: conversaAtual } = await supabase
            .from('chat_ia_nutri')
            .select('mensagens')
            .eq('id', conversa_id)
            .single()

          const mensagensAtuais = conversaAtual?.mensagens || []

          const novasMensagens = [
            ...mensagensAtuais,
            { role: 'user', content: mensagem, timestamp: new Date().toISOString() },
            { role: 'assistant', content: resposta, timestamp: new Date().toISOString(), fromCache }
          ]

          await supabase
            .from('chat_ia_nutri')
            .update({
              mensagens: novasMensagens,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversa_id)
        }

        return NextResponse.json({
          resposta,
          conversa_id,
          fromCache
        })
      } catch (dbError) {
        console.error('Erro ao salvar conversa:', dbError)
      }
    }

    return NextResponse.json({ resposta, fromCache })
  } catch (error) {
    console.error('Erro na API de IA:', error)
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    )
  }
}

// =====================================================
// PUT - Gerar receitas (com retry e cache)
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const { tipo, ingredientes, restricoes, tempoMax, userId } = await request.json()

    // Usar o novo engine de IA avançado
    const receita = await gerarReceita(tipo, ingredientes, restricoes, tempoMax)

    // Salvar receita favorita se tiver userId
    if (userId) {
      try {
        const nomeMatch = receita.match(/NOME:\s*(.+)/i)
        const caloriasMatch = receita.match(/CALORIAS:\s*(\d+)/i)
        const proteinasMatch = receita.match(/PROTEINAS:\s*(\d+)/i)

        if (nomeMatch) {
          await supabase
            .from('receitas_favoritas_nutri')
            .insert({
              user_id: userId,
              nome: nomeMatch[1].trim(),
              descricao: receita,
              calorias: caloriasMatch ? parseInt(caloriasMatch[1]) : null,
              proteinas: proteinasMatch ? parseInt(proteinasMatch[1]) : null,
              tipo: tipo || 'geral',
              gerada_ia: true
            })
        }
      } catch (dbError) {
        console.error('Erro ao salvar receita:', dbError)
      }
    }

    return NextResponse.json({ receita })
  } catch (error) {
    console.error('Erro ao gerar receita:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar receita' },
      { status: 500 }
    )
  }
}

// =====================================================
// GET - Dica do dia personalizada
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let perfil: ProfileContext = {}

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles_nutri')
        .select('nome, idade_bebe, amamentando, plano')
        .eq('id', userId)
        .single()

      if (profile) {
        perfil = {
          nome: profile.nome || undefined,
          idade_bebe: profile.idade_bebe || undefined,
          amamentando: profile.amamentando || false,
          plano: profile.plano || 'normal'
        }
      }
    }

    const dica = await dicaDoDia(perfil)

    return NextResponse.json({ dica })
  } catch (error) {
    console.error('Erro ao gerar dica:', error)
    return NextResponse.json(
      { dica: 'Beba agua! A hidratacao e essencial para sua saude.' }
    )
  }
}
