import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Buscar tópico com respostas
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Buscar tópico
    const { data: topico, error: topicoError } = await supabase
      .from('forum_topicos_med')
      .select(`
        *,
        autor:profiles_med!forum_topicos_med_user_id_fkey(id, nome, plano, avatar_url),
        disciplina:disciplinas_med(id, nome),
        questao:questoes_med(id, enunciado),
        teoria:teorias_med(id, titulo)
      `)
      .eq('id', id)
      .single()

    if (topicoError || !topico) {
      return NextResponse.json(
        { error: 'Tópico não encontrado' },
        { status: 404 }
      )
    }

    // Incrementar visualizações
    await supabase
      .from('forum_topicos_med')
      .update({ visualizacoes: (topico.visualizacoes || 0) + 1 })
      .eq('id', id)

    // Buscar respostas
    const { data: respostas } = await supabase
      .from('forum_respostas_med')
      .select(`
        *,
        autor:profiles_med!forum_respostas_med_user_id_fkey(id, nome, plano, avatar_url)
      `)
      .eq('topico_id', id)
      .order('melhor_resposta', { ascending: false })
      .order('votos_positivos', { ascending: false })
      .order('created_at', { ascending: true })

    return NextResponse.json({
      topico,
      respostas: respostas || []
    })

  } catch (error) {
    console.error('Erro ao buscar tópico:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tópico' },
      { status: 500 }
    )
  }
}

// POST - Adicionar resposta ao tópico
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, conteudo, parentId } = body

    if (!userId || !conteudo) {
      return NextResponse.json(
        { error: 'userId e conteudo são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar resposta
    const { data: resposta, error } = await supabase
      .from('forum_respostas_med')
      .insert({
        topico_id: id,
        user_id: userId,
        conteudo,
        parent_id: parentId || null
      })
      .select(`
        *,
        autor:profiles_med!forum_respostas_med_user_id_fkey(id, nome, plano, avatar_url)
      `)
      .single()

    if (error) throw error

    // Atualizar contador de respostas no tópico
    const { data: topico } = await supabase
      .from('forum_topicos_med')
      .select('total_respostas')
      .eq('id', id)
      .single()

    await supabase
      .from('forum_topicos_med')
      .update({
        total_respostas: (topico?.total_respostas || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    return NextResponse.json({ resposta })

  } catch (error) {
    console.error('Erro ao criar resposta:', error)
    return NextResponse.json(
      { error: 'Erro ao criar resposta' },
      { status: 500 }
    )
  }
}

// PUT - Votar em resposta ou marcar como melhor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: topicoId } = await params
    const body = await request.json()
    const { userId, respostaId, acao, voto } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Votar
    if (acao === 'votar' && respostaId && voto) {
      // Verificar se já votou
      const { data: votoExistente } = await supabase
        .from('forum_votos_med')
        .select('*')
        .eq('user_id', userId)
        .eq('resposta_id', respostaId)
        .single()

      if (votoExistente) {
        // Atualizar ou remover voto
        if (votoExistente.tipo === voto) {
          // Remover voto
          await supabase
            .from('forum_votos_med')
            .delete()
            .eq('user_id', userId)
            .eq('resposta_id', respostaId)
        } else {
          // Atualizar voto
          await supabase
            .from('forum_votos_med')
            .update({ tipo: voto })
            .eq('user_id', userId)
            .eq('resposta_id', respostaId)
        }
      } else {
        // Criar voto
        await supabase
          .from('forum_votos_med')
          .insert({
            user_id: userId,
            resposta_id: respostaId,
            tipo: voto
          })
      }

      // Recontar votos
      const { count: positivos } = await supabase
        .from('forum_votos_med')
        .select('*', { count: 'exact' })
        .eq('resposta_id', respostaId)
        .eq('tipo', 'positivo')

      const { count: negativos } = await supabase
        .from('forum_votos_med')
        .select('*', { count: 'exact' })
        .eq('resposta_id', respostaId)
        .eq('tipo', 'negativo')

      await supabase
        .from('forum_respostas_med')
        .update({
          votos_positivos: positivos || 0,
          votos_negativos: negativos || 0
        })
        .eq('id', respostaId)

      return NextResponse.json({ success: true })
    }

    // Marcar como melhor resposta
    if (acao === 'melhor_resposta' && respostaId) {
      // Verificar se é o autor do tópico
      const { data: topico } = await supabase
        .from('forum_topicos_med')
        .select('user_id')
        .eq('id', topicoId)
        .single()

      if (topico?.user_id !== userId) {
        return NextResponse.json(
          { error: 'Apenas o autor do tópico pode marcar a melhor resposta' },
          { status: 403 }
        )
      }

      // Desmarcar melhor resposta anterior
      await supabase
        .from('forum_respostas_med')
        .update({ melhor_resposta: false })
        .eq('topico_id', topicoId)

      // Marcar nova melhor resposta
      await supabase
        .from('forum_respostas_med')
        .update({ melhor_resposta: true })
        .eq('id', respostaId)

      // Marcar tópico como resolvido
      await supabase
        .from('forum_topicos_med')
        .update({ resolvido: true })
        .eq('id', topicoId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Erro na ação:', error)
    return NextResponse.json(
      { error: 'Erro ao processar ação' },
      { status: 500 }
    )
  }
}
