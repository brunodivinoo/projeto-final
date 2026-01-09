import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Listar sessões do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const id = searchParams.get('id')
    const ciclo_id = searchParams.get('ciclo_id')
    const status = searchParams.get('status')
    const data = searchParams.get('data')
    const ativa = searchParams.get('ativa')
    const limite = parseInt(searchParams.get('limite') || '50')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Buscar sessão específica
    if (id) {
      const { data: sessao, error } = await supabase
        .from('sessoes_estudo')
        .select(`
          *,
          ciclo:ciclos_estudo (id, nome),
          ciclo_item:ciclo_itens (id, nome_display),
          disciplina:disciplinas (id, nome, icon, cor),
          assunto:assuntos (id, nome),
          subassunto:subassuntos (id, nome)
        `)
        .eq('id', id)
        .eq('user_id', user_id)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
      }

      return NextResponse.json(sessao)
    }

    // Buscar sessão ativa (em andamento)
    if (ativa === 'true') {
      const { data: sessao } = await supabase
        .from('sessoes_estudo')
        .select(`
          *,
          ciclo:ciclos_estudo (id, nome),
          ciclo_item:ciclo_itens (id, nome_display),
          disciplina:disciplinas (id, nome, icon, cor),
          assunto:assuntos (id, nome),
          subassunto:subassuntos (id, nome)
        `)
        .eq('user_id', user_id)
        .in('status', ['em_andamento', 'pausada'])
        .order('inicio', { ascending: false })
        .limit(1)
        .single()

      return NextResponse.json(sessao || null)
    }

    // Listar sessões
    let query = supabase
      .from('sessoes_estudo')
      .select(`
        *,
        disciplina:disciplinas (id, nome, icon, cor),
        assunto:assuntos (id, nome),
        subassunto:subassuntos (id, nome)
      `)
      .eq('user_id', user_id)
      .order('inicio', { ascending: false })
      .limit(limite)

    if (ciclo_id) query = query.eq('ciclo_id', ciclo_id)
    if (status) query = query.eq('status', status)
    if (data) query = query.gte('inicio', `${data}T00:00:00`).lte('inicio', `${data}T23:59:59`)

    const { data: sessoes, error } = await query

    if (error) {
      console.error('Erro ao buscar sessões:', error)
      return NextResponse.json({ error: 'Erro ao buscar sessões' }, { status: 500 })
    }

    return NextResponse.json(sessoes)
  } catch (error) {
    console.error('Erro na API de sessões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Iniciar nova sessão
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      ciclo_id,
      ciclo_item_id,
      disciplina_id,
      assunto_id,
      subassunto_id,
      metodo,
      criar_revisao,
      prioridade_revisao
    } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (!disciplina_id || !metodo) {
      return NextResponse.json({ error: 'Disciplina e método são obrigatórios' }, { status: 400 })
    }

    // Verificar se já existe sessão ativa
    const { data: sessaoAtiva } = await supabase
      .from('sessoes_estudo')
      .select('id')
      .eq('user_id', user_id)
      .in('status', ['em_andamento', 'pausada'])
      .limit(1)
      .single()

    if (sessaoAtiva) {
      return NextResponse.json({
        error: 'Já existe uma sessão ativa',
        sessao_id: sessaoAtiva.id
      }, { status: 400 })
    }

    // Criar sessão
    const { data: sessao, error: sessaoError } = await supabase
      .from('sessoes_estudo')
      .insert({
        user_id,
        ciclo_id: ciclo_id || null,
        ciclo_item_id: ciclo_item_id || null,
        disciplina_id,
        assunto_id: assunto_id || null,
        subassunto_id: subassunto_id || null,
        metodo,
        inicio: new Date().toISOString(),
        criar_revisao: criar_revisao !== false,
        prioridade_revisao: prioridade_revisao || 3,
        status: 'em_andamento'
      })
      .select(`
        *,
        disciplina:disciplinas (id, nome, icon, cor),
        assunto:assuntos (id, nome),
        subassunto:subassuntos (id, nome)
      `)
      .single()

    if (sessaoError) {
      console.error('Erro ao criar sessão:', sessaoError)
      return NextResponse.json({ error: 'Erro ao criar sessão' }, { status: 500 })
    }

    return NextResponse.json(sessao, { status: 201 })
  } catch (error) {
    console.error('Erro na API de sessões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Atualizar sessão (pausar, retomar, finalizar)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      user_id,
      acao,
      duracao_segundos,
      pausas,
      tempo_pausado_segundos,
      questoes_feitas,
      questoes_corretas,
      anotacoes,
      avaliacao,
      criar_revisao,
      prioridade_revisao
    } = body

    if (!id || !user_id) {
      return NextResponse.json({ error: 'ID e user_id são obrigatórios' }, { status: 400 })
    }

    // Verificar propriedade
    const { data: sessaoExistente } = await supabase
      .from('sessoes_estudo')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (!sessaoExistente) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    // Ações específicas
    if (acao === 'pausar') {
      updateData.status = 'pausada'
      updateData.pausas = (sessaoExistente.pausas || 0) + 1
    } else if (acao === 'retomar') {
      updateData.status = 'em_andamento'
    } else if (acao === 'finalizar') {
      updateData.status = 'finalizada'
      updateData.fim = new Date().toISOString()
    } else if (acao === 'cancelar') {
      updateData.status = 'cancelada'
      updateData.fim = new Date().toISOString()
    }

    // Atualizar campos fornecidos
    if (duracao_segundos !== undefined) updateData.duracao_segundos = duracao_segundos
    if (pausas !== undefined) updateData.pausas = pausas
    if (tempo_pausado_segundos !== undefined) updateData.tempo_pausado_segundos = tempo_pausado_segundos
    if (questoes_feitas !== undefined) updateData.questoes_feitas = questoes_feitas
    if (questoes_corretas !== undefined) updateData.questoes_corretas = questoes_corretas
    if (anotacoes !== undefined) updateData.anotacoes = anotacoes
    if (avaliacao !== undefined) updateData.avaliacao = avaliacao
    if (criar_revisao !== undefined) updateData.criar_revisao = criar_revisao
    if (prioridade_revisao !== undefined) updateData.prioridade_revisao = prioridade_revisao

    const { error: updateError } = await supabase
      .from('sessoes_estudo')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Erro ao atualizar sessão:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar sessão' }, { status: 500 })
    }

    // Se finalizou, dar XP
    if (acao === 'finalizar' && duracao_segundos && duracao_segundos > 60) {
      const horasEstudadas = duracao_segundos / 3600
      const xpBase = Math.floor(horasEstudadas * 100)
      const xpBonus = questoes_feitas ? Math.floor(questoes_feitas * 2) : 0
      const xpTotal = xpBase + xpBonus

      // Atualizar XP do usuário (ignorar erros se função não existir)
      try {
        await supabase.rpc('incrementar_xp', {
          p_user_id: user_id,
          p_xp: xpTotal
        })
      } catch {
        // Ignorar
      }

      // Atualizar estudo_diario com XP (ignorar erros)
      try {
        await supabase
          .from('estudo_diario')
          .update({ xp_ganho: xpTotal })
          .eq('user_id', user_id)
          .eq('data', new Date().toISOString().split('T')[0])
      } catch {
        // Ignorar
      }
    }

    // Buscar sessão atualizada
    const { data: sessaoAtualizada } = await supabase
      .from('sessoes_estudo')
      .select(`
        *,
        disciplina:disciplinas (id, nome, icon, cor),
        assunto:assuntos (id, nome),
        subassunto:subassuntos (id, nome)
      `)
      .eq('id', id)
      .single()

    return NextResponse.json(sessaoAtualizada)
  } catch (error) {
    console.error('Erro na API de sessões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir sessão
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const user_id = searchParams.get('user_id')

    if (!id || !user_id) {
      return NextResponse.json({ error: 'ID e user_id são obrigatórios' }, { status: 400 })
    }

    const { error } = await supabase
      .from('sessoes_estudo')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)

    if (error) {
      console.error('Erro ao excluir sessão:', error)
      return NextResponse.json({ error: 'Erro ao excluir sessão' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de sessões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
