import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // 'disciplinas', 'assuntos', 'subassuntos', 'bancas', 'anos'
    const disciplinaIds = searchParams.get('disciplina_ids')?.split(',').filter(Boolean) || []
    const assuntoIds = searchParams.get('assunto_ids')?.split(',').filter(Boolean) || []

    switch (tipo) {
      case 'disciplinas': {
        const { data, error } = await supabase
          .from('disciplinas')
          .select('id, nome, qtd_questoes')
          .gt('qtd_questoes', 0)
          .order('nome')

        if (error) throw error
        return NextResponse.json({ disciplinas: data })
      }

      case 'assuntos': {
        if (disciplinaIds.length === 0) {
          return NextResponse.json({ assuntos: [] })
        }

        const { data, error } = await supabase
          .from('assuntos')
          .select('id, nome, qtd_questoes, disciplina_id, disciplinas(nome)')
          .in('disciplina_id', disciplinaIds)
          .gt('qtd_questoes', 0)
          .order('nome')

        if (error) throw error

        // Agrupar por disciplina
        const assuntosAgrupados: Record<string, {
          disciplina: string
          disciplina_id: string
          assuntos: Array<{ id: string; nome: string; qtd_questoes: number }>
        }> = {}

        data?.forEach((assunto) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const disciplinaData = assunto.disciplinas as any
          const discNome = disciplinaData?.nome || 'Outros'
          if (!assuntosAgrupados[assunto.disciplina_id]) {
            assuntosAgrupados[assunto.disciplina_id] = {
              disciplina: discNome,
              disciplina_id: assunto.disciplina_id,
              assuntos: []
            }
          }
          assuntosAgrupados[assunto.disciplina_id].assuntos.push({
            id: assunto.id,
            nome: assunto.nome,
            qtd_questoes: assunto.qtd_questoes
          })
        })

        return NextResponse.json({ assuntos: Object.values(assuntosAgrupados) })
      }

      case 'subassuntos': {
        if (assuntoIds.length === 0) {
          return NextResponse.json({ subassuntos: [] })
        }

        const { data, error } = await supabase
          .from('subassuntos')
          .select('id, nome, qtd_questoes, assunto_id, assuntos(nome, disciplinas(nome))')
          .in('assunto_id', assuntoIds)
          .gt('qtd_questoes', 0)
          .order('nome')

        if (error) throw error

        // Agrupar por assunto
        const subassuntosAgrupados: Record<string, {
          assunto: string
          assunto_id: string
          disciplina: string
          subassuntos: Array<{ id: string; nome: string; qtd_questoes: number }>
        }> = {}

        data?.forEach((sub) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const assuntoData = sub.assuntos as any
          if (!subassuntosAgrupados[sub.assunto_id]) {
            subassuntosAgrupados[sub.assunto_id] = {
              assunto: assuntoData?.nome || 'Outros',
              assunto_id: sub.assunto_id,
              disciplina: assuntoData?.disciplinas?.nome || 'Outros',
              subassuntos: []
            }
          }
          subassuntosAgrupados[sub.assunto_id].subassuntos.push({
            id: sub.id,
            nome: sub.nome,
            qtd_questoes: sub.qtd_questoes
          })
        })

        return NextResponse.json({ subassuntos: Object.values(subassuntosAgrupados) })
      }

      case 'bancas': {
        // Buscar bancas com paginação para suportar grandes volumes
        const bancasCount: Record<string, number> = {}
        let offset = 0
        const limit = 1000
        let hasMore = true

        while (hasMore) {
          const { data, error } = await supabase
            .from('questoes')
            .select('banca')
            .not('banca', 'is', null)
            .range(offset, offset + limit - 1)

          if (error || !data || data.length === 0) {
            hasMore = false
            break
          }

          data.forEach((q) => {
            if (q.banca) {
              bancasCount[q.banca] = (bancasCount[q.banca] || 0) + 1
            }
          })

          offset += limit
          hasMore = data.length === limit
        }

        const bancas = Object.entries(bancasCount)
          .map(([nome, qtd]) => ({ nome, qtd_questoes: qtd }))
          .sort((a, b) => b.qtd_questoes - a.qtd_questoes)

        return NextResponse.json({ bancas })
      }

      case 'anos': {
        // Buscar anos com paginação para suportar grandes volumes
        const anosCount: Record<number, number> = {}
        let offset = 0
        const limit = 1000
        let hasMore = true

        while (hasMore) {
          const { data, error } = await supabase
            .from('questoes')
            .select('ano')
            .not('ano', 'is', null)
            .range(offset, offset + limit - 1)

          if (error || !data || data.length === 0) {
            hasMore = false
            break
          }

          data.forEach((q) => {
            if (q.ano) {
              anosCount[q.ano] = (anosCount[q.ano] || 0) + 1
            }
          })

          offset += limit
          hasMore = data.length === limit
        }

        const anos = Object.entries(anosCount)
          .map(([ano, qtd]) => ({ ano: parseInt(ano), qtd_questoes: qtd }))
          .sort((a, b) => b.ano - a.ano)

        return NextResponse.json({ anos })
      }

      case 'dificuldades': {
        // Buscar dificuldades com paginação
        const difCount: Record<string, number> = {}
        let offset = 0
        const limit = 1000
        let hasMore = true

        while (hasMore) {
          const { data, error } = await supabase
            .from('questoes')
            .select('dificuldade')
            .not('dificuldade', 'is', null)
            .range(offset, offset + limit - 1)

          if (error || !data || data.length === 0) {
            hasMore = false
            break
          }

          data.forEach((q) => {
            if (q.dificuldade) {
              difCount[q.dificuldade] = (difCount[q.dificuldade] || 0) + 1
            }
          })

          offset += limit
          hasMore = data.length === limit
        }

        const dificuldades = Object.entries(difCount)
          .map(([nome, qtd]) => ({ nome, qtd_questoes: qtd }))
          .sort((a, b) => b.qtd_questoes - a.qtd_questoes)

        return NextResponse.json({ dificuldades })
      }

      case 'modalidades': {
        // Buscar modalidades com paginação
        const modCount: Record<string, number> = {}
        let offset = 0
        const limit = 1000
        let hasMore = true

        while (hasMore) {
          const { data, error } = await supabase
            .from('questoes')
            .select('modalidade')
            .not('modalidade', 'is', null)
            .range(offset, offset + limit - 1)

          if (error || !data || data.length === 0) {
            hasMore = false
            break
          }

          data.forEach((q) => {
            if (q.modalidade) {
              modCount[q.modalidade] = (modCount[q.modalidade] || 0) + 1
            }
          })

          offset += limit
          hasMore = data.length === limit
        }

        const modalidades = Object.entries(modCount)
          .map(([nome, qtd]) => ({ nome, qtd_questoes: qtd }))
          .sort((a, b) => b.qtd_questoes - a.qtd_questoes)

        return NextResponse.json({ modalidades })
      }

      default:
        return NextResponse.json({ error: 'Tipo de filtro inválido' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro ao buscar filtros:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
