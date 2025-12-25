import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar TODAS as disciplinas, assuntos, subassuntos e bancas
// Diferente do /api/questoes/filtros que filtra por qtd_questoes > 0
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')

    switch (tipo) {
      case 'estrutura': {
        // Buscar estrutura completa: disciplinas -> assuntos -> subassuntos
        const { data: disciplinas, error: errDisc } = await supabase
          .from('disciplinas')
          .select('id, nome')
          .order('nome')

        if (errDisc) throw errDisc

        const { data: assuntos, error: errAss } = await supabase
          .from('assuntos')
          .select('id, nome, disciplina_id')
          .order('nome')

        if (errAss) throw errAss

        const { data: subassuntos, error: errSub } = await supabase
          .from('subassuntos')
          .select('id, nome, assunto_id')
          .order('nome')

        if (errSub) throw errSub

        // Montar estrutura hierárquica
        const estrutura = disciplinas?.map(disc => ({
          id: disc.id,
          nome: disc.nome,
          assuntos: assuntos
            ?.filter(ass => ass.disciplina_id === disc.id)
            .map(ass => ({
              id: ass.id,
              nome: ass.nome,
              subassuntos: subassuntos
                ?.filter(sub => sub.assunto_id === ass.id)
                .map(sub => ({
                  id: sub.id,
                  nome: sub.nome
                })) || []
            })) || []
        })) || []

        return NextResponse.json({ estrutura })
      }

      case 'bancas': {
        // Buscar bancas da tabela bancas (muito mais eficiente)
        const { data: bancasData, error: errBancas } = await supabase
          .from('bancas')
          .select('nome, qtd_questoes')
          .order('nome')

        if (errBancas) throw errBancas

        const bancas = (bancasData || [])
          .filter(b => b.nome)
          .map(b => ({ nome: b.nome, qtd_questoes: b.qtd_questoes || 0 }))
          .sort((a, b) => b.qtd_questoes - a.qtd_questoes)

        return NextResponse.json({ bancas })
      }

      default:
        return NextResponse.json({ error: 'Tipo inválido. Use: estrutura ou bancas' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro ao buscar filtros completos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
