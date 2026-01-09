import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Buscar teoria específica com conteúdo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const nivelAcesso = searchParams.get('nivel') || 'basico' // basico, avancado, expert

    const { data: teoria, error } = await supabase
      .from('teorias_med')
      .select(`
        *,
        disciplina:disciplinas_med(id, nome),
        assunto:assuntos_med(id, nome),
        subassunto:subassuntos_med(id, nome)
      `)
      .eq('id', id)
      .single()

    if (error || !teoria) {
      return NextResponse.json(
        { error: 'Teoria não encontrada' },
        { status: 404 }
      )
    }

    // Filtrar conteúdo baseado no nível de acesso
    let conteudo = teoria.conteudo_basico
    if (nivelAcesso === 'avancado' || nivelAcesso === 'expert') {
      conteudo = teoria.conteudo_avancado || teoria.conteudo_basico
    }
    if (nivelAcesso === 'expert') {
      conteudo = teoria.conteudo_expert || teoria.conteudo_avancado || teoria.conteudo_basico
    }

    // Buscar progresso do usuário
    let progresso = null
    if (userId) {
      const { data: progressoData } = await supabase
        .from('progresso_leitura_med')
        .select('*')
        .eq('user_id', userId)
        .eq('teoria_id', id)
        .single()

      progresso = progressoData
    }

    // Buscar questões relacionadas
    const { data: questoesRelacionadas } = await supabase
      .from('questoes_med')
      .select('id, enunciado, dificuldade')
      .eq('teoria_id', id)
      .eq('ativo', true)
      .limit(5)

    // Buscar artigos relacionados
    const { data: artigosRelacionados } = await supabase
      .from('teoria_artigos_med')
      .select(`
        artigo:artigos_med(id, titulo, autores, ano, journal, resumo_ia)
      `)
      .eq('teoria_id', id)
      .limit(5)

    return NextResponse.json({
      teoria: {
        ...teoria,
        conteudo, // Conteúdo filtrado pelo nível
        conteudo_basico: undefined,
        conteudo_avancado: undefined,
        conteudo_expert: undefined
      },
      progresso,
      questoesRelacionadas: questoesRelacionadas || [],
      artigos: artigosRelacionados?.map(a => a.artigo) || []
    })

  } catch (error) {
    console.error('Erro ao buscar teoria:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar teoria' },
      { status: 500 }
    )
  }
}
