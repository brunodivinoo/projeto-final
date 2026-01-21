import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analisarFotoPrato } from '@/lib/nutrivida/ai-engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 60

// =====================================================
// POST - Analisar foto de prato com IA Vision
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Imagem e obrigatoria' },
        { status: 400 }
      )
    }

    // Converter arquivo para base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')

    // Analisar com IA Vision
    const analise = await analisarFotoPrato(base64, file.type)

    // Salvar no banco se tiver userId
    if (userId) {
      try {
        // Upload da imagem para o storage
        const fileName = `${userId}/${Date.now()}-${file.name}`
        const { data: uploadData } = await supabase.storage
          .from('fotos-pratos-nutri')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false
          })

        // Salvar análise no banco
        await supabase
          .from('refeicoes_diarias_nutri')
          .insert({
            user_id: userId,
            tipo_refeicao: 'analisada',
            refeicao_selecionada: {
              analise,
              foto_url: uploadData?.path || null,
              data_analise: new Date().toISOString()
            }
          })
      } catch (dbError) {
        console.error('Erro ao salvar analise:', dbError)
      }
    }

    return NextResponse.json({ analise })
  } catch (error) {
    console.error('Erro ao analisar prato:', error)
    return NextResponse.json(
      { error: 'Erro ao analisar imagem' },
      { status: 500 }
    )
  }
}
