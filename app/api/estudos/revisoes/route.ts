import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Listar revisões do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const hoje = searchParams.get('hoje')
    const pendentes = searchParams.get('pendentes')
    const atrasadas = searchParams.get('atrasadas')
    const disciplina_id = searchParams.get('disciplina_id')
    const limite = parseInt(searchParams.get('limite') || '50')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Atualizar revisões atrasadas (ignorar erros se função não existir)
    try {
      await supabase.rpc('atualizar_revisoes_atrasadas')
    } catch {
      // Ignorar
    }

    // Buscar revisão específica
    if (id) {
      const { data: revisao, error } = await supabase
        .from('revisoes')
        .select(`
          *,
          sessao_origem:sessoes_estudo (id, metodo, duracao_segundos),
          disciplina:disciplinas (id, nome),
          assunto:assuntos (id, nome),
          subassunto:subassuntos (id, nome),
          revisao_historico (*)
        `)
        .eq('id', id)
        .eq('user_id', user_id)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Revisão não encontrada' }, { status: 404 })
      }

      return NextResponse.json(revisao)
    }

    const dataHoje = new Date().toISOString().split('T')[0]

    // Buscar revisões para hoje
    if (hoje === 'true') {
      const { data: revisoes, error } = await supabase
        .from('revisoes')
        .select(`
          *,
          disciplina:disciplinas (id, nome),
          assunto:assuntos (id, nome),
          subassunto:subassuntos (id, nome)
        `)
        .eq('user_id', user_id)
        .in('status', ['pendente', 'atrasada'])
        .lte('proxima_revisao', dataHoje)
        .order('prioridade', { ascending: false })
        .order('proxima_revisao', { ascending: true })
        .limit(limite)

      if (error) {
        console.error('Erro ao buscar revisões:', error)
        return NextResponse.json({ error: 'Erro ao buscar revisões' }, { status: 500 })
      }

      return NextResponse.json(revisoes)
    }

    // Buscar pendentes
    if (pendentes === 'true') {
      const { data: revisoes, error } = await supabase
        .from('revisoes')
        .select(`
          *,
          disciplina:disciplinas (id, nome),
          assunto:assuntos (id, nome),
          subassunto:subassuntos (id, nome)
        `)
        .eq('user_id', user_id)
        .eq('status', 'pendente')
        .order('proxima_revisao', { ascending: true })
        .limit(limite)

      if (error) {
        console.error('Erro ao buscar revisões:', error)
        return NextResponse.json({ error: 'Erro ao buscar revisões' }, { status: 500 })
      }

      return NextResponse.json(revisoes)
    }

    // Buscar atrasadas
    if (atrasadas === 'true') {
      const { data: revisoes, error } = await supabase
        .from('revisoes')
        .select(`
          *,
          disciplina:disciplinas (id, nome),
          assunto:assuntos (id, nome),
          subassunto:subassuntos (id, nome)
        `)
        .eq('user_id', user_id)
        .eq('status', 'atrasada')
        .order('proxima_revisao', { ascending: true })
        .limit(limite)

      if (error) {
        console.error('Erro ao buscar revisões:', error)
        return NextResponse.json({ error: 'Erro ao buscar revisões' }, { status: 500 })
      }

      return NextResponse.json(revisoes)
    }

    // Listar todas as revisões
    let query = supabase
      .from('revisoes')
      .select(`
        *,
        disciplina:disciplinas (id, nome),
        assunto:assuntos (id, nome),
        subassunto:subassuntos (id, nome)
      `)
      .eq('user_id', user_id)
      .order('proxima_revisao', { ascending: true })
      .limit(limite)

    if (status) query = query.eq('status', status)
    if (disciplina_id) query = query.eq('disciplina_id', disciplina_id)

    const { data: revisoes, error } = await query

    if (error) {
      console.error('Erro ao buscar revisões:', error)
      return NextResponse.json({ error: 'Erro ao buscar revisões' }, { status: 500 })
    }

    return NextResponse.json(revisoes)
  } catch (error) {
    console.error('Erro na API de revisões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar nova revisão manual
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      disciplina_id,
      assunto_id,
      subassunto_id,
      titulo,
      descricao,
      metodo_original,
      prioridade,
      proxima_revisao
    } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (!disciplina_id) {
      return NextResponse.json({ error: 'Disciplina é obrigatória' }, { status: 400 })
    }

    // Criar revisão
    const { data: revisao, error: revisaoError } = await supabase
      .from('revisoes')
      .insert({
        user_id,
        disciplina_id,
        assunto_id: assunto_id || null,
        subassunto_id: subassunto_id || null,
        titulo,
        descricao,
        metodo_original: metodo_original || 'outro',
        data_estudo: new Date().toISOString().split('T')[0],
        proxima_revisao: proxima_revisao || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        prioridade: prioridade || 3
      })
      .select(`
        *,
        disciplina:disciplinas (id, nome),
        assunto:assuntos (id, nome),
        subassunto:subassuntos (id, nome)
      `)
      .single()

    if (revisaoError) {
      console.error('Erro ao criar revisão:', revisaoError)
      return NextResponse.json({ error: 'Erro ao criar revisão' }, { status: 500 })
    }

    return NextResponse.json(revisao, { status: 201 })
  } catch (error) {
    console.error('Erro na API de revisões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Registrar revisão feita (SM-2)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, user_id, qualidade, tempo_segundos, anotacoes, arquivar } = body

    if (!id || !user_id) {
      return NextResponse.json({ error: 'ID e user_id são obrigatórios' }, { status: 400 })
    }

    // Verificar propriedade
    const { data: revisaoExistente } = await supabase
      .from('revisoes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (!revisaoExistente) {
      return NextResponse.json({ error: 'Revisão não encontrada' }, { status: 404 })
    }

    // Arquivar revisão
    if (arquivar === true) {
      const { error } = await supabase
        .from('revisoes')
        .update({ status: 'arquivada' })
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: 'Erro ao arquivar revisão' }, { status: 500 })
      }

      return NextResponse.json({ success: true, arquivada: true })
    }

    // Registrar revisão com SM-2
    if (qualidade !== undefined && qualidade >= 0 && qualidade <= 5) {
      // Calcular próxima revisão usando SM-2
      const { data: sm2Result } = await supabase.rpc('calcular_proxima_revisao', {
        p_qualidade: qualidade,
        p_repeticoes: revisaoExistente.repeticoes || 0,
        p_fator_facilidade: revisaoExistente.fator_facilidade || 2.5,
        p_intervalo: revisaoExistente.intervalo || 1
      })

      const resultado = sm2Result?.[0] || {
        nova_repeticao: qualidade >= 3 ? (revisaoExistente.repeticoes || 0) + 1 : 0,
        novo_intervalo: qualidade >= 3 ? Math.max(1, Math.round((revisaoExistente.intervalo || 1) * (revisaoExistente.fator_facilidade || 2.5))) : 1,
        novo_fator: Math.max(1.3, (revisaoExistente.fator_facilidade || 2.5) + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02))),
        proxima_data: new Date(Date.now() + (qualidade >= 3 ? (revisaoExistente.intervalo || 1) * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      }

      // Registrar histórico
      await supabase.from('revisao_historico').insert({
        revisao_id: id,
        data_revisao: new Date().toISOString().split('T')[0],
        qualidade,
        tempo_segundos: tempo_segundos || 0,
        intervalo_anterior: revisaoExistente.intervalo,
        novo_intervalo: resultado.novo_intervalo,
        fator_anterior: revisaoExistente.fator_facilidade,
        novo_fator: resultado.novo_fator,
        anotacoes
      })

      // Atualizar revisão
      const { error: updateError } = await supabase
        .from('revisoes')
        .update({
          repeticoes: resultado.nova_repeticao,
          intervalo: resultado.novo_intervalo,
          fator_facilidade: resultado.novo_fator,
          proxima_revisao: resultado.proxima_data,
          status: qualidade >= 4 ? 'concluida' : 'pendente'
        })
        .eq('id', id)

      if (updateError) {
        console.error('Erro ao atualizar revisão:', updateError)
        return NextResponse.json({ error: 'Erro ao atualizar revisão' }, { status: 500 })
      }

      // Atualizar estudo_diario (ignorar erros)
      try {
        await supabase
          .from('estudo_diario')
          .upsert({
            user_id,
            data: new Date().toISOString().split('T')[0],
            total_revisoes: 1
          }, {
            onConflict: 'user_id,data',
            ignoreDuplicates: false
          })
      } catch {
        // Ignorar
      }

      // Buscar revisão atualizada
      const { data: revisaoAtualizada } = await supabase
        .from('revisoes')
        .select(`
          *,
          disciplina:disciplinas (id, nome),
          assunto:assuntos (id, nome),
          subassunto:subassuntos (id, nome)
        `)
        .eq('id', id)
        .single()

      return NextResponse.json({
        ...revisaoAtualizada,
        sm2: resultado
      })
    }

    return NextResponse.json({ error: 'Qualidade é obrigatória (0-5)' }, { status: 400 })
  } catch (error) {
    console.error('Erro na API de revisões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir revisão
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const user_id = searchParams.get('user_id')

    if (!id || !user_id) {
      return NextResponse.json({ error: 'ID e user_id são obrigatórios' }, { status: 400 })
    }

    const { error } = await supabase
      .from('revisoes')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)

    if (error) {
      console.error('Erro ao excluir revisão:', error)
      return NextResponse.json({ error: 'Erro ao excluir revisão' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de revisões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
