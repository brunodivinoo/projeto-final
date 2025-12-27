import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumo_id, resumo } = body

    console.log('[EDITAR RESUMO] Iniciando edição:', {
      resumo_id,
      tamanho_conteudo: resumo?.length || 0,
      preview: resumo?.substring(0, 100) + '...'
    })

    if (!resumo_id || !resumo) {
      console.log('[EDITAR RESUMO] Parâmetros inválidos:', { resumo_id, temResumo: !!resumo })
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
      console.error('[EDITAR RESUMO] Erro ao atualizar:', error)
      return NextResponse.json({ error: 'Erro ao atualizar resumo' }, { status: 500 })
    }

    console.log('[EDITAR RESUMO] Sucesso:', {
      id: data.id,
      titulo: data.titulo,
      tamanho_salvo: data.resumo?.length || 0
    })

    return NextResponse.json({
      success: true,
      resumo: data,
      message: 'Resumo atualizado com sucesso'
    })

  } catch (error) {
    console.error('[EDITAR RESUMO] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
