import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Criar cliente Supabase com service role para bypass de RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Gerar hash único para identificar questão
function gerarHashQuestao(enunciado: string): string {
  return crypto.createHash('md5').update(enunciado.trim().toLowerCase()).digest('hex').substring(0, 16)
}

// GET - Buscar respostas do usuário
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('user_id')
  const conversaId = searchParams.get('conversa_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
  }

  try {
    let query = supabase
      .from('respostas_questoes_ia_med')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (conversaId) {
      query = query.eq('conversa_id', conversaId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar respostas:', error)
      // Se a tabela não existir, retornar vazio
      if (error.code === '42P01') {
        return NextResponse.json({
          respostas: [],
          estatisticas: { total: 0, acertos: 0, erros: 0, taxa: 0 }
        })
      }
      throw error
    }

    // Calcular estatísticas
    const total = data?.length || 0
    const acertos = data?.filter(r => r.acertou).length || 0
    const erros = total - acertos
    const taxa = total > 0 ? Math.round((acertos / total) * 100) : 0

    return NextResponse.json({
      respostas: data || [],
      estatisticas: {
        total,
        acertos,
        erros,
        taxa
      }
    })
  } catch (error) {
    console.error('Erro ao buscar respostas:', error)
    return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 })
  }
}

// POST - Salvar resposta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      conversa_id,
      enunciado,
      questao_numero,
      disciplina,
      assunto,
      resposta_usuario,
      resposta_correta,
      acertou,
      tempo_resposta_segundos
    } = body

    if (!user_id || !conversa_id || !enunciado || !resposta_usuario || !resposta_correta) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const questaoHash = gerarHashQuestao(enunciado)

    // Verificar se já existe resposta para esta questão
    const { data: existente } = await supabase
      .from('respostas_questoes_ia_med')
      .select('id, tentativas')
      .eq('user_id', user_id)
      .eq('conversa_id', conversa_id)
      .eq('questao_hash', questaoHash)
      .single()

    if (existente) {
      // Atualizar resposta existente (nova tentativa)
      const { data, error } = await supabase
        .from('respostas_questoes_ia_med')
        .update({
          resposta_usuario,
          acertou,
          tempo_resposta_segundos,
          tentativas: (existente.tentativas || 1) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data, atualizado: true })
    } else {
      // Inserir nova resposta
      const { data, error } = await supabase
        .from('respostas_questoes_ia_med')
        .insert({
          user_id,
          conversa_id,
          questao_hash: questaoHash,
          questao_numero: questao_numero || 1,
          disciplina: disciplina || 'Geral',
          assunto: assunto || 'Geral',
          resposta_usuario,
          resposta_correta,
          acertou,
          tempo_resposta_segundos: tempo_resposta_segundos || 0
        })
        .select()
        .single()

      if (error) {
        // Se a tabela não existir, retornar sucesso silencioso
        if (error.code === '42P01') {
          console.warn('Tabela respostas_questoes_ia_med não existe ainda')
          return NextResponse.json({ success: true, data: null, tabela_nao_existe: true })
        }
        throw error
      }
      return NextResponse.json({ success: true, data, novo: true })
    }
  } catch (error) {
    console.error('Erro ao salvar resposta:', error)
    return NextResponse.json({ error: 'Erro ao salvar resposta' }, { status: 500 })
  }
}
