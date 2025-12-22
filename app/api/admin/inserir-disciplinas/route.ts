import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Função para normalizar texto
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

interface Assunto {
  nome: string
  subassuntos: string[]
}

interface Disciplina {
  nome: string
  assuntos: Assunto[]
}

export async function POST(req: NextRequest) {
  try {
    const { disciplinas } = await req.json() as { disciplinas: Disciplina[] }

    if (!disciplinas || disciplinas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma disciplina fornecida' }, { status: 400 })
    }

    let disciplinasInseridas = 0
    let assuntosInseridos = 0
    let subassuntosInseridos = 0

    for (const disc of disciplinas) {
      // Verificar se disciplina existe
      const nomeNormDisc = normalizar(disc.nome)
      const { data: discExistente } = await supabase
        .from('disciplinas')
        .select('id')
        .eq('nome_normalizado', nomeNormDisc)
        .single()

      let disciplinaId: string

      if (!discExistente) {
        // Criar disciplina
        const { data: novaDisc, error: errDisc } = await supabase
          .from('disciplinas')
          .insert({ nome: disc.nome, nome_normalizado: nomeNormDisc })
          .select('id')
          .single()

        if (errDisc) {
          // Tentar buscar novamente (pode ter sido criada em paralelo)
          const { data: discRetry } = await supabase
            .from('disciplinas')
            .select('id')
            .eq('nome_normalizado', nomeNormDisc)
            .single()
          disciplinaId = discRetry?.id || ''
        } else {
          disciplinaId = novaDisc.id
          disciplinasInseridas++
        }
      } else {
        disciplinaId = discExistente.id
      }

      if (!disciplinaId) continue

      // Processar assuntos
      for (const ass of disc.assuntos) {
        const nomeNormAss = normalizar(ass.nome)
        const { data: assExistente } = await supabase
          .from('assuntos')
          .select('id')
          .eq('disciplina_id', disciplinaId)
          .eq('nome_normalizado', nomeNormAss)
          .single()

        let assuntoId: string

        if (!assExistente) {
          // Criar assunto
          const { data: novoAss, error: errAss } = await supabase
            .from('assuntos')
            .insert({
              disciplina_id: disciplinaId,
              nome: ass.nome,
              nome_normalizado: nomeNormAss
            })
            .select('id')
            .single()

          if (errAss) {
            const { data: assRetry } = await supabase
              .from('assuntos')
              .select('id')
              .eq('disciplina_id', disciplinaId)
              .eq('nome_normalizado', nomeNormAss)
              .single()
            assuntoId = assRetry?.id || ''
          } else {
            assuntoId = novoAss.id
            assuntosInseridos++
          }
        } else {
          assuntoId = assExistente.id
        }

        if (!assuntoId) continue

        // Processar subassuntos
        for (const sub of ass.subassuntos) {
          const nomeNormSub = normalizar(sub)

          const { data: subExistente } = await supabase
            .from('subassuntos')
            .select('id')
            .eq('assunto_id', assuntoId)
            .eq('nome_normalizado', nomeNormSub)
            .single()

          if (!subExistente) {
            const { error: errSub } = await supabase
              .from('subassuntos')
              .insert({
                assunto_id: assuntoId,
                nome: sub,
                nome_normalizado: nomeNormSub
              })

            if (!errSub) {
              subassuntosInseridos++
            }
          }
        }
      }
    }

    return NextResponse.json({
      disciplinas: disciplinasInseridas,
      assuntos: assuntosInseridos,
      subassuntos: subassuntosInseridos
    })
  } catch (error) {
    console.error('Erro ao inserir disciplinas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
