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
      .from('questoes_respostas')
      .select('resposta, correta')
      .eq('questao_id', questaoId)

    if (error) throw error

    // Buscar informações da questão (modalidade)
    const { data: questao } = await supabase
      .from('questoes')
      .select('modalidade, gabarito')
      .eq('id', questaoId)
      .single()

    const totalRespostas = respostas?.length || 0
    const acertos = respostas?.filter(r => r.correta).length || 0
    const erros = totalRespostas - acertos
    const taxaAcerto = totalRespostas > 0 ? Math.round((acertos / totalRespostas) * 100) : 0

    // Calcular distribuição por alternativa
    const distribuicao: Record<string, number> = {}
    respostas?.forEach(r => {
      distribuicao[r.resposta] = (distribuicao[r.resposta] || 0) + 1
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

    // Verificar se já respondeu
    const { data: existingResposta } = await supabase
      .from('questoes_respostas')
      .select('id')
      .eq('questao_id', questaoId)
      .eq('user_id', user.id)
      .single()

    if (existingResposta) {
      return NextResponse.json({ error: 'Questão já respondida' }, { status: 400 })
    }

    // Registrar resposta
    const { error } = await supabase
      .from('questoes_respostas')
      .insert({
        questao_id: questaoId,
        user_id: user.id,
        resposta,
        correta,
        tempo_resposta
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao registrar resposta:', error)
    return NextResponse.json({ error: 'Erro ao registrar resposta' }, { status: 500 })
  }
}
