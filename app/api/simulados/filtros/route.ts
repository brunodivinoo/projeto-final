import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cache simples em memória para reduzir queries repetidas
let cacheModalidades: { data: { nome: string; label: string; questoes: number }[]; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// GET - Obter filtros disponíveis para simulados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modalidade = searchParams.get('modalidade')
    const disciplinasSelecionadas = searchParams.get('disciplinas')?.split(',').filter(Boolean) || []

    // Buscar modalidades (sem filtro, para mostrar contagem total de cada tipo)
    // Usar cache se disponível
    let modalidades: { nome: string; label: string; questoes: number }[]

    if (cacheModalidades && (Date.now() - cacheModalidades.timestamp) < CACHE_TTL) {
      modalidades = cacheModalidades.data
    } else {
      const { data: modalidadesData } = await supabase
        .from('questoes')
        .select('modalidade')

      const modalidadesCount = new Map<string, number>()
      modalidadesData?.forEach(q => {
        if (q.modalidade) {
          modalidadesCount.set(q.modalidade, (modalidadesCount.get(q.modalidade) || 0) + 1)
        }
      })

      modalidades = [
        { nome: 'certo_errado', label: 'Certo ou Errado', questoes: modalidadesCount.get('certo_errado') || 0 },
        { nome: 'multipla_escolha', label: 'Múltipla Escolha', questoes: modalidadesCount.get('multipla_escolha') || 0 }
      ]

      cacheModalidades = { data: modalidades, timestamp: Date.now() }
    }

    // Buscar todas as questões com disciplina, assunto e filtrar por modalidade
    let questoesQuery = supabase
      .from('questoes')
      .select('disciplina, assunto')

    if (modalidade) {
      questoesQuery = questoesQuery.eq('modalidade', modalidade)
    }

    const { data: questoesData } = await questoesQuery

    // Estrutura hierárquica: disciplina -> assuntos
    const hierarquia = new Map<string, { total: number; assuntos: Map<string, number> }>()

    questoesData?.forEach(q => {
      if (q.disciplina) {
        if (!hierarquia.has(q.disciplina)) {
          hierarquia.set(q.disciplina, { total: 0, assuntos: new Map() })
        }
        const disc = hierarquia.get(q.disciplina)!
        disc.total++

        if (q.assunto) {
          disc.assuntos.set(q.assunto, (disc.assuntos.get(q.assunto) || 0) + 1)
        }
      }
    })

    // Converter para formato de resposta
    const disciplinas = Array.from(hierarquia.entries())
      .map(([nome, data]) => ({
        nome,
        questoes: data.total,
        assuntos: Array.from(data.assuntos.entries())
          .map(([assuntoNome, count]) => ({ nome: assuntoNome, questoes: count }))
          .sort((a, b) => b.questoes - a.questoes)
      }))
      .sort((a, b) => b.questoes - a.questoes)

    // Assuntos flat (para compatibilidade) - filtrado por disciplinas selecionadas
    const assuntos: { nome: string; questoes: number; disciplina: string }[] = []

    if (disciplinasSelecionadas.length > 0) {
      disciplinasSelecionadas.forEach(disc => {
        const discData = hierarquia.get(disc)
        if (discData) {
          discData.assuntos.forEach((count, assuntoNome) => {
            assuntos.push({ nome: assuntoNome, questoes: count, disciplina: disc })
          })
        }
      })
      assuntos.sort((a, b) => b.questoes - a.questoes)
    }

    // Buscar bancas, anos e dificuldades em paralelo
    const [bancasResult, anosResult, dificuldadesResult] = await Promise.all([
      supabase
        .from('questoes')
        .select('banca')
        .not('banca', 'is', null)
        .then(({ data }) => {
          const bancasCount = new Map<string, number>()
          data?.forEach(q => {
            if (q.banca) {
              bancasCount.set(q.banca, (bancasCount.get(q.banca) || 0) + 1)
            }
          })
          return Array.from(bancasCount.entries())
            .map(([nome, count]) => ({ nome, questoes: count }))
            .filter(b => b.nome && b.nome.trim() !== '')
            .sort((a, b) => b.questoes - a.questoes)
        }),

      supabase
        .from('questoes')
        .select('ano')
        .not('ano', 'is', null)
        .then(({ data }) => {
          const anosCount = new Map<number, number>()
          data?.forEach(q => {
            if (q.ano) {
              anosCount.set(q.ano, (anosCount.get(q.ano) || 0) + 1)
            }
          })
          return Array.from(anosCount.entries())
            .map(([ano, count]) => ({ ano, questoes: count }))
            .sort((a, b) => b.ano - a.ano)
        }),

      supabase
        .from('questoes')
        .select('dificuldade')
        .not('dificuldade', 'is', null)
        .then(({ data }) => {
          const dificuldadesCount = new Map<string, number>()
          data?.forEach(q => {
            if (q.dificuldade) {
              dificuldadesCount.set(q.dificuldade, (dificuldadesCount.get(q.dificuldade) || 0) + 1)
            }
          })
          return [
            { nome: 'facil', label: 'Fácil', questoes: dificuldadesCount.get('facil') || 0 },
            { nome: 'medio', label: 'Médio', questoes: dificuldadesCount.get('medio') || 0 },
            { nome: 'dificil', label: 'Difícil', questoes: dificuldadesCount.get('dificil') || 0 }
          ]
        })
    ])

    // Calcular total disponível com a modalidade selecionada
    const totalQuestoes = modalidade
      ? modalidades.find(m => m.nome === modalidade)?.questoes || 0
      : modalidades.reduce((sum, m) => sum + m.questoes, 0)

    return NextResponse.json({
      disciplinas,
      assuntos,
      subassuntos: [], // Deprecated, mantido para compatibilidade
      bancas: bancasResult,
      anos: anosResult,
      dificuldades: dificuldadesResult,
      modalidades,
      total_questoes_disponiveis: totalQuestoes
    })
  } catch (error) {
    console.error('[FILTROS SIMULADOS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
