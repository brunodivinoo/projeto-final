import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Obter filtros disponíveis para simulados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modalidade = searchParams.get('modalidade')
    const disciplinaSelecionada = searchParams.get('disciplina')
    const assuntoSelecionado = searchParams.get('assunto')

    // Buscar todas as disciplinas com contagem de questões
    let disciplinasQuery = supabase
      .from('questoes')
      .select('disciplina')

    if (modalidade) {
      disciplinasQuery = disciplinasQuery.eq('modalidade', modalidade)
    }

    const { data: questoesDisciplinas } = await disciplinasQuery

    // Contar questões por disciplina
    const disciplinasCount = new Map<string, number>()
    questoesDisciplinas?.forEach(q => {
      if (q.disciplina) {
        disciplinasCount.set(q.disciplina, (disciplinasCount.get(q.disciplina) || 0) + 1)
      }
    })

    const disciplinas = Array.from(disciplinasCount.entries())
      .map(([nome, count]) => ({ nome, questoes: count }))
      .sort((a, b) => b.questoes - a.questoes)

    // Buscar assuntos (filtrado por disciplina se selecionada)
    let assuntosQuery = supabase
      .from('questoes')
      .select('assunto, disciplina')

    if (modalidade) {
      assuntosQuery = assuntosQuery.eq('modalidade', modalidade)
    }

    if (disciplinaSelecionada) {
      assuntosQuery = assuntosQuery.eq('disciplina', disciplinaSelecionada)
    }

    const { data: questoesAssuntos } = await assuntosQuery

    // Contar questões por assunto
    const assuntosCount = new Map<string, number>()
    questoesAssuntos?.forEach(q => {
      if (q.assunto) {
        assuntosCount.set(q.assunto, (assuntosCount.get(q.assunto) || 0) + 1)
      }
    })

    const assuntos = Array.from(assuntosCount.entries())
      .map(([nome, count]) => ({ nome, questoes: count }))
      .sort((a, b) => b.questoes - a.questoes)

    // Buscar subassuntos (filtrado por assunto se selecionado)
    let subassuntosQuery = supabase
      .from('questoes')
      .select('subassunto, assunto, disciplina')

    if (modalidade) {
      subassuntosQuery = subassuntosQuery.eq('modalidade', modalidade)
    }

    if (disciplinaSelecionada) {
      subassuntosQuery = subassuntosQuery.eq('disciplina', disciplinaSelecionada)
    }

    if (assuntoSelecionado) {
      subassuntosQuery = subassuntosQuery.eq('assunto', assuntoSelecionado)
    }

    const { data: questoesSubassuntos } = await subassuntosQuery

    // Contar questões por subassunto
    const subassuntosCount = new Map<string, number>()
    questoesSubassuntos?.forEach(q => {
      if (q.subassunto) {
        subassuntosCount.set(q.subassunto, (subassuntosCount.get(q.subassunto) || 0) + 1)
      }
    })

    const subassuntos = Array.from(subassuntosCount.entries())
      .map(([nome, count]) => ({ nome, questoes: count }))
      .sort((a, b) => b.questoes - a.questoes)

    // Buscar bancas disponíveis
    const { data: bancasData } = await supabase
      .from('questoes')
      .select('banca')
      .not('banca', 'is', null)

    const bancasCount = new Map<string, number>()
    bancasData?.forEach(q => {
      if (q.banca) {
        bancasCount.set(q.banca, (bancasCount.get(q.banca) || 0) + 1)
      }
    })

    const bancas = Array.from(bancasCount.entries())
      .map(([nome, count]) => ({ nome, questoes: count }))
      .filter(b => b.nome && b.nome.trim() !== '')
      .sort((a, b) => b.questoes - a.questoes)

    // Buscar anos disponíveis
    const { data: anosData } = await supabase
      .from('questoes')
      .select('ano')
      .not('ano', 'is', null)

    const anosCount = new Map<number, number>()
    anosData?.forEach(q => {
      if (q.ano) {
        anosCount.set(q.ano, (anosCount.get(q.ano) || 0) + 1)
      }
    })

    const anos = Array.from(anosCount.entries())
      .map(([ano, count]) => ({ ano, questoes: count }))
      .sort((a, b) => b.ano - a.ano)

    // Dificuldades disponíveis
    const { data: dificuldadesData } = await supabase
      .from('questoes')
      .select('dificuldade')
      .not('dificuldade', 'is', null)

    const dificuldadesCount = new Map<string, number>()
    dificuldadesData?.forEach(q => {
      if (q.dificuldade) {
        dificuldadesCount.set(q.dificuldade, (dificuldadesCount.get(q.dificuldade) || 0) + 1)
      }
    })

    const dificuldades = [
      { nome: 'facil', label: 'Fácil', questoes: dificuldadesCount.get('facil') || 0 },
      { nome: 'medio', label: 'Médio', questoes: dificuldadesCount.get('medio') || 0 },
      { nome: 'dificil', label: 'Difícil', questoes: dificuldadesCount.get('dificil') || 0 }
    ]

    // Modalidades disponíveis
    const { data: modalidadesData } = await supabase
      .from('questoes')
      .select('modalidade')

    const modalidadesCount = new Map<string, number>()
    modalidadesData?.forEach(q => {
      if (q.modalidade) {
        modalidadesCount.set(q.modalidade, (modalidadesCount.get(q.modalidade) || 0) + 1)
      }
    })

    const modalidades = [
      { nome: 'certo_errado', label: 'Certo ou Errado', questoes: modalidadesCount.get('certo_errado') || 0 },
      { nome: 'multipla_escolha', label: 'Múltipla Escolha', questoes: modalidadesCount.get('multipla_escolha') || 0 }
    ]

    // Contar total de questões disponíveis com os filtros atuais
    let totalQuery = supabase
      .from('questoes')
      .select('*', { count: 'exact', head: true })

    if (modalidade) {
      totalQuery = totalQuery.eq('modalidade', modalidade)
    }
    if (disciplinaSelecionada) {
      totalQuery = totalQuery.eq('disciplina', disciplinaSelecionada)
    }
    if (assuntoSelecionado) {
      totalQuery = totalQuery.eq('assunto', assuntoSelecionado)
    }

    const { count: totalQuestoes } = await totalQuery

    return NextResponse.json({
      disciplinas,
      assuntos,
      subassuntos,
      bancas,
      anos,
      dificuldades,
      modalidades,
      total_questoes_disponiveis: totalQuestoes || 0
    })
  } catch (error) {
    console.error('[FILTROS SIMULADOS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
