import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { resumo_id } = await request.json()

    if (!resumo_id) {
      return NextResponse.json({ error: 'ID do resumo é obrigatório' }, { status: 400 })
    }

    // Verificar se o resumo existe
    const { data: resumo, error: fetchError } = await supabase
      .from('resumos_ia')
      .select('id, compartilhado')
      .eq('id', resumo_id)
      .single()

    if (fetchError || !resumo) {
      return NextResponse.json({ error: 'Resumo não encontrado' }, { status: 404 })
    }

    // Atualizar o status de compartilhado
    if (!resumo.compartilhado) {
      const { error: updateError } = await supabase
        .from('resumos_ia')
        .update({ compartilhado: true })
        .eq('id', resumo_id)

      if (updateError) {
        console.error('Erro ao atualizar status de compartilhamento:', updateError)
        return NextResponse.json({ error: 'Erro ao compartilhar resumo' }, { status: 500 })
      }
    }

    // Gerar o link de compartilhamento
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://estudaai.com.br'
    const link = `${baseUrl}/compartilhado/resumo/${resumo_id}`

    return NextResponse.json({
      success: true,
      link,
      message: 'Resumo compartilhado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao compartilhar resumo:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
