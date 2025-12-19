import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar estatísticas de uma questão
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questaoId } = await params

    // Buscar todas as respostas da questão
    const { data: respostas, error } = await supabase
      .from('respostas_usuario')
      .select('resposta_selecionada, acertou')
      .eq('questao_id', questaoId)

    if (error) throw error

    // Buscar informações da questão (modalidade)
    const { data: questao } = await supabase
      .from('questoes')
      .select('modalidade, gabarito')
      .eq('id', questaoId)
      .single()

    const totalRespostas = respostas?.length || 0
    const acertos = respostas?.filter(r => r.acertou).length || 0
    const erros = totalRespostas - acertos
    const taxaAcerto = totalRespostas > 0 ? Math.round((acertos / totalRespostas) * 100) : 0

    // Calcular distribuição por alternativa
    const distribuicao: Record<string, number> = {}
    respostas?.forEach(r => {
      if (r.resposta_selecionada) {
        distribuicao[r.resposta_selecionada] = (distribuicao[r.resposta_selecionada] || 0) + 1
      }
    })

    // Converter para porcentagens
    const distribuicaoPorcentagem: Record<string, number> = {}
    Object.keys(distribuicao).forEach(key => {
      distribuicaoPorcentagem[key] = totalRespostas > 0
        ? Math.round((distribuicao[key] / totalRespostas) * 100)
        : 0
    })

    // Se for múltipla escolha, garantir que todas as alternativas apareçam
    if (questao?.modalidade === 'multipla_escolha_5') {
      ['A', 'B', 'C', 'D', 'E'].forEach(letra => {
        if (!distribuicaoPorcentagem[letra]) {
          distribuicaoPorcentagem[letra] = 0
        }
      })
    } else if (questao?.modalidade === 'certo_errado') {
      ['C', 'E'].forEach(letra => {
        if (!distribuicaoPorcentagem[letra]) {
          distribuicaoPorcentagem[letra] = 0
        }
      })
    }

    return NextResponse.json({
      totalRespostas,
      acertos,
      erros,
      taxaAcerto,
      distribuicao: distribuicaoPorcentagem,
      gabarito: questao?.gabarito,
      modalidade: questao?.modalidade
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}

// POST - Registrar resposta do usuário
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questaoId } = await params
    const body = await request.json()
    const { resposta, correta, tempo_resposta } = body

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar dados da questão para registrar com contexto
    const { data: questao } = await supabase
      .from('questoes')
      .select('disciplina, assunto, subassunto, dificuldade')
      .eq('id', questaoId)
      .single()

    // Verificar se já respondeu esta questão
    const { data: existingResposta } = await supabase
      .from('respostas_usuario')
      .select('id')
      .eq('questao_id', questaoId)
      .eq('user_id', user.id)
      .single()

    if (existingResposta) {
      return NextResponse.json({ error: 'Questão já respondida', jaRespondida: true }, { status: 400 })
    }

    // 1. Registrar resposta na tabela respostas_usuario
    const { error: respostaError } = await supabase
      .from('respostas_usuario')
      .insert({
        user_id: user.id,
        questao_id: questaoId,
        resposta_selecionada: resposta,
        acertou: correta,
        tempo_segundos: tempo_resposta || null
      })

    if (respostaError) {
      console.error('Erro ao inserir resposta:', respostaError)
      throw respostaError
    }

    // 2. Registrar atividade no histórico
    const atividadeTitulo = correta
      ? `Questão respondida corretamente`
      : `Questão respondida`
    const atividadeDescricao = questao
      ? `${questao.disciplina}${questao.assunto ? ` - ${questao.assunto}` : ''}`
      : 'Questão respondida'

    await supabase
      .from('historico_atividades')
      .insert({
        user_id: user.id,
        tipo: 'questao',
        titulo: atividadeTitulo,
        descricao: atividadeDescricao,
        icone: correta ? 'check_circle' : 'quiz',
        cor: correta ? '#22c55e' : '#3b82f6',
        metadata: {
          questao_id: questaoId,
          disciplina: questao?.disciplina,
          assunto: questao?.assunto,
          acertou: correta
        }
      })

    // 3. Atualizar estatísticas do usuário
    const hoje = new Date().toISOString().split('T')[0]

    // Buscar ou criar estatísticas
    const { data: statsExistentes } = await supabase
      .from('estatisticas_usuario')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (statsExistentes) {
      // Atualizar estatísticas existentes
      await supabase
        .from('estatisticas_usuario')
        .update({
          questoes_respondidas: (statsExistentes.questoes_respondidas || 0) + 1,
          questoes_corretas: correta
            ? (statsExistentes.questoes_corretas || 0) + 1
            : statsExistentes.questoes_corretas || 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    } else {
      // Criar nova entrada de estatísticas
      await supabase
        .from('estatisticas_usuario')
        .insert({
          user_id: user.id,
          questoes_respondidas: 1,
          questoes_corretas: correta ? 1 : 0,
          sequencia_dias: 1,
          maior_sequencia: 1,
          ultimo_acesso: hoje
        })
    }

    // 4. Atualizar uso diário (para controle de limites)
    const { data: usoDiario } = await supabase
      .from('uso_diario')
      .select('id, quantidade')
      .eq('user_id', user.id)
      .eq('tipo', 'questoes')
      .eq('data', hoje)
      .single()

    if (usoDiario) {
      await supabase
        .from('uso_diario')
        .update({ quantidade: usoDiario.quantidade + 1 })
        .eq('id', usoDiario.id)
    } else {
      await supabase
        .from('uso_diario')
        .insert({
          user_id: user.id,
          tipo: 'questoes',
          quantidade: 1,
          data: hoje
        })
    }

    return NextResponse.json({
      success: true,
      acertou: correta,
      disciplina: questao?.disciplina
    })
  } catch (error) {
    console.error('Erro ao registrar resposta:', error)
    return NextResponse.json({ error: 'Erro ao registrar resposta' }, { status: 500 })
  }
}
