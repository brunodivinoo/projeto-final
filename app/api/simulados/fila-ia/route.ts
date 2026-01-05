import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ItemFila {
  disciplina: string
  assunto?: string
  subassunto?: string
  banca: string
  modalidade: string
  dificuldade: string
}

// GET - Buscar status da fila de geração
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const simulado_id = searchParams.get('simulado_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Se simulado_id fornecido, buscar status específico
    if (simulado_id) {
      const { data: itens, error } = await supabase
        .from('simulado_ia_fila')
        .select('*')
        .eq('simulado_id', simulado_id)
        .eq('user_id', user_id)
        .order('ordem', { ascending: true })

      if (error) {
        console.error('[FILA IA] Erro ao buscar fila:', error)
        return NextResponse.json({ error: 'Erro ao buscar fila' }, { status: 500 })
      }

      const total = itens?.length || 0
      const geradas = itens?.filter(i => i.status === 'concluido').length || 0
      const erros = itens?.filter(i => i.status === 'erro').length || 0
      const pendentes = itens?.filter(i => i.status === 'pendente').length || 0
      const processando = itens?.find(i => i.status === 'processando')

      // Buscar info do simulado
      const { data: simulado } = await supabase
        .from('simulados')
        .select('titulo, status')
        .eq('id', simulado_id)
        .single()

      return NextResponse.json({
        simulado_id,
        simulado_titulo: simulado?.titulo,
        simulado_status: simulado?.status,
        total,
        geradas,
        erros,
        pendentes,
        concluido: pendentes === 0 && !processando,
        item_atual: processando ? {
          disciplina: processando.disciplina,
          assunto: processando.assunto,
          ordem: processando.ordem
        } : null
      })
    }

    // Buscar todas as gerações pendentes do usuário
    const { data: simuladosPendentes, error } = await supabase
      .from('simulados')
      .select('id, titulo, status, quantidade_questoes')
      .eq('user_id', user_id)
      .eq('status', 'gerando')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[FILA IA] Erro ao buscar simulados:', error)
      return NextResponse.json({ error: 'Erro ao buscar simulados' }, { status: 500 })
    }

    // Para cada simulado pendente, buscar progresso
    const simuladosComProgresso = await Promise.all(
      (simuladosPendentes || []).map(async (sim) => {
        const { data: itens } = await supabase
          .from('simulado_ia_fila')
          .select('status')
          .eq('simulado_id', sim.id)

        const total = itens?.length || sim.quantidade_questoes
        const geradas = itens?.filter(i => i.status === 'concluido').length || 0

        return {
          ...sim,
          total,
          geradas,
          percentual: total > 0 ? Math.round((geradas / total) * 100) : 0
        }
      })
    )

    return NextResponse.json({
      simulados_pendentes: simuladosComProgresso
    })

  } catch (error) {
    console.error('[FILA IA] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

interface OpcoesAvancadas {
  distratos?: string
  incluirJurisprudencia?: boolean
  incluirSumulas?: boolean
  incluirSumulasVinculantes?: boolean
  incluirDoutrina?: boolean
}

// POST - Criar simulado e popular fila de geração
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      titulo,
      descricao,
      quantidade_questoes,
      tempo_limite_minutos,
      modalidade,
      dificuldades,
      itens, // Array de disciplinas/assuntos/subassuntos para gerar
      opcoesAvancadas // Opções avançadas (distratos, jurisprudência, etc)
    } = body as {
      user_id: string
      titulo: string
      descricao?: string
      quantidade_questoes: number
      tempo_limite_minutos?: number
      modalidade: string
      dificuldades: string[]
      itens: ItemFila[]
      opcoesAvancadas?: OpcoesAvancadas
    }

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (!itens || itens.length === 0) {
      return NextResponse.json({ error: 'Selecione pelo menos uma disciplina' }, { status: 400 })
    }

    if (quantidade_questoes < 5 || quantidade_questoes > 150) {
      return NextResponse.json({ error: 'Quantidade deve ser entre 5 e 150 questões' }, { status: 400 })
    }

    // Verificar se usuário é PRO
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', user_id)
      .single()

    const isPro = profile?.plano?.toLowerCase() === 'pro' ||
                  profile?.plano?.toLowerCase() === 'estuda_pro'

    if (!isPro) {
      return NextResponse.json({
        error: 'Recurso exclusivo para usuários PRO',
        upgrade_required: true
      }, { status: 403 })
    }

    // Verificar limite diário
    const hoje = new Date().toISOString().split('T')[0]
    const { data: usoHoje } = await supabase
      .from('uso_diario')
      .select('quantidade')
      .eq('user_id', user_id)
      .eq('data', hoje)
      .eq('tipo', 'simulado_ia')
      .maybeSingle()

    const usadoHoje = usoHoje?.quantidade || 0
    const limiteSimuladosIA = 5

    if (usadoHoje >= limiteSimuladosIA) {
      return NextResponse.json({
        error: 'Limite diário de simulados com IA atingido',
        limite: limiteSimuladosIA,
        usado: usadoHoje
      }, { status: 429 })
    }

    console.log(`[FILA IA] Criando simulado com ${quantidade_questoes} questões`)

    // Criar o simulado com status "gerando"
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados')
      .insert({
        user_id,
        titulo: titulo || `Simulado IA - ${new Date().toLocaleDateString('pt-BR')}`,
        descricao,
        fonte: 'ia',
        modalidade: modalidade === 'mista' ? 'multipla_escolha' : modalidade,
        quantidade_questoes,
        tempo_limite_minutos: tempo_limite_minutos || null,
        dificuldades,
        status: 'gerando',
        gerado_por_ia: true,
        opcoes_avancadas: opcoesAvancadas || null
      })
      .select()
      .single()

    if (simuladoError) {
      console.error('[FILA IA] Erro ao criar simulado:', simuladoError)
      return NextResponse.json({ error: 'Erro ao criar simulado' }, { status: 500 })
    }

    // Distribuir questões entre os itens selecionados
    const distribuicao = distribuirQuestoes(itens, quantidade_questoes, modalidade, dificuldades)

    // Popular a fila de geração
    const itensParaInserir = distribuicao.map((item, index) => ({
      user_id,
      simulado_id: simulado.id,
      disciplina: item.disciplina,
      assunto: item.assunto || null,
      subassunto: item.subassunto || null,
      banca: item.banca,
      modalidade: item.modalidade,
      dificuldade: item.dificuldade,
      ordem: index + 1,
      status: 'pendente'
    }))

    const { error: filaError } = await supabase
      .from('simulado_ia_fila')
      .insert(itensParaInserir)

    if (filaError) {
      console.error('[FILA IA] Erro ao popular fila:', filaError)
      // Rollback - deletar simulado
      await supabase.from('simulados').delete().eq('id', simulado.id)
      return NextResponse.json({ error: 'Erro ao criar fila de geração' }, { status: 500 })
    }

    // Salvar disciplinas do simulado
    const disciplinasUnicas = [...new Set(itens.map(i => i.disciplina))]
    await supabase.from('simulado_disciplinas').insert(
      disciplinasUnicas.map(d => ({ simulado_id: simulado.id, disciplina_nome: d }))
    )

    // Registrar uso diário
    if (usoHoje) {
      await supabase
        .from('uso_diario')
        .update({ quantidade: usadoHoje + 1 })
        .eq('user_id', user_id)
        .eq('data', hoje)
        .eq('tipo', 'simulado_ia')
    } else {
      await supabase
        .from('uso_diario')
        .insert({
          user_id,
          data: hoje,
          tipo: 'simulado_ia',
          quantidade: 1
        })
    }

    // Registrar atividade
    await supabase
      .from('historico_atividades')
      .insert({
        user_id,
        tipo: 'simulado_ia_iniciado',
        descricao: `Iniciou geração de simulado com IA: ${titulo}`,
        detalhes: {
          simulado_id: simulado.id,
          quantidade_questoes,
          disciplinas: disciplinasUnicas
        }
      })

    return NextResponse.json({
      success: true,
      simulado: {
        id: simulado.id,
        titulo: simulado.titulo,
        quantidade_questoes
      },
      fila: {
        total: itensParaInserir.length,
        geradas: 0
      }
    })

  } catch (error) {
    console.error('[FILA IA] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Cancelar geração
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, simulado_id } = body

    if (!user_id || !simulado_id) {
      return NextResponse.json({ error: 'user_id e simulado_id são obrigatórios' }, { status: 400 })
    }

    // Verificar se simulado pertence ao usuário
    const { data: simulado } = await supabase
      .from('simulados')
      .select('id, status')
      .eq('id', simulado_id)
      .eq('user_id', user_id)
      .single()

    if (!simulado) {
      return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 })
    }

    // Marcar itens pendentes como cancelados
    await supabase
      .from('simulado_ia_fila')
      .update({ status: 'cancelado' })
      .eq('simulado_id', simulado_id)
      .in('status', ['pendente', 'processando'])

    // Contar questões geradas
    const { count: questoesGeradas } = await supabase
      .from('simulado_ia_fila')
      .select('*', { count: 'exact', head: true })
      .eq('simulado_id', simulado_id)
      .eq('status', 'concluido')

    // Se tem questões geradas, manter simulado como pendente
    // Se não tem, deletar simulado
    if (questoesGeradas && questoesGeradas > 0) {
      await supabase
        .from('simulados')
        .update({
          status: 'pendente',
          quantidade_questoes: questoesGeradas
        })
        .eq('id', simulado_id)

      return NextResponse.json({
        success: true,
        message: `Geração cancelada. ${questoesGeradas} questões já geradas foram mantidas.`,
        questoes_mantidas: questoesGeradas
      })
    } else {
      // Deletar tudo
      await supabase.from('simulado_ia_fila').delete().eq('simulado_id', simulado_id)
      await supabase.from('simulado_disciplinas').delete().eq('simulado_id', simulado_id)
      await supabase.from('simulados').delete().eq('id', simulado_id)

      return NextResponse.json({
        success: true,
        message: 'Geração cancelada e simulado removido.',
        questoes_mantidas: 0
      })
    }

  } catch (error) {
    console.error('[FILA IA] Erro ao cancelar:', error)
    return NextResponse.json({ error: 'Erro ao cancelar geração' }, { status: 500 })
  }
}

// Função para distribuir questões entre disciplinas/assuntos
function distribuirQuestoes(
  itens: ItemFila[],
  quantidade: number,
  modalidadeGeral: string,
  dificuldades: string[]
): Array<{
  disciplina: string
  assunto?: string
  subassunto?: string
  banca: string
  modalidade: string
  dificuldade: string
}> {
  const distribuicao: Array<{
    disciplina: string
    assunto?: string
    subassunto?: string
    banca: string
    modalidade: string
    dificuldade: string
  }> = []

  // Se há menos itens que questões, repetir ciclicamente
  for (let i = 0; i < quantidade; i++) {
    const itemBase = itens[i % itens.length]

    // Determinar modalidade
    let modalidade = modalidadeGeral
    if (modalidadeGeral === 'mista') {
      modalidade = i % 2 === 0 ? 'multipla_escolha' : 'certo_errado'
    }

    // Rotacionar dificuldades
    const dificuldade = dificuldades[i % dificuldades.length] || 'media'

    distribuicao.push({
      disciplina: itemBase.disciplina,
      assunto: itemBase.assunto,
      subassunto: itemBase.subassunto,
      banca: itemBase.banca || 'CESPE/CEBRASPE',
      modalidade,
      dificuldade
    })
  }

  return distribuicao
}
