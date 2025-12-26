import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(request: NextRequest) {
  try {
    const { resumo_id, resumo } = await request.json()

    if (!resumo_id || !resumo) {
      return NextResponse.json({ error: 'resumo_id e resumo são obrigatórios' }, { status: 400 })
    }

    // Atualizar o conteúdo do resumo
    const { data, error } = await supabase
      .from('resumos_ia')
      .update({ resumo })
      .eq('id', resumo_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar resumo:', error)
      return NextResponse.json({ error: 'Erro ao atualizar resumo' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      resumo: data,
      message: 'Resumo atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao editar resumo:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
