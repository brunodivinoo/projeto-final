import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// supabase client - usar getSupabaseAdmin() dentro das funções

interface Correcao {
  questaoId: string
  disciplina?: string
  assunto?: string
  subassunto?: string
}

export async function POST(req: NextRequest) {
  try {
    const { correcoes } = await req.json() as { correcoes: Correcao[] }

    if (!correcoes || correcoes.length === 0) {
      return NextResponse.json({ error: 'Nenhuma correção fornecida' }, { status: 400 })
    }

    let sucesso = 0
    let erros = 0
    const detalhesErros: string[] = []

    for (const correcao of correcoes) {
      const updateData: Record<string, string> = {}

      if (correcao.disciplina) {
        updateData.disciplina = correcao.disciplina
      }
      if (correcao.assunto) {
        updateData.assunto = correcao.assunto
      }
      if (correcao.subassunto !== undefined) {
        updateData.subassunto = correcao.subassunto
      }

      if (Object.keys(updateData).length === 0) {
        continue
      }

      const { error } = await getSupabaseAdmin()
        .from('questoes')
        .update(updateData)
        .eq('id', correcao.questaoId)

      if (error) {
        erros++
        detalhesErros.push(`${correcao.questaoId}: ${error.message}`)
      } else {
        sucesso++
      }
    }

    return NextResponse.json({
      sucesso,
      erros,
      detalhesErros: detalhesErros.length > 0 ? detalhesErros : undefined
    })
  } catch (error) {
    console.error('Erro ao aplicar correções:', error)
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
