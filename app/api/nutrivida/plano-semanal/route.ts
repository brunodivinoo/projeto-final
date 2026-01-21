import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { gerarPlanoSemanal, type ProfileContext } from '@/lib/nutrivida/ai-engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 120

// =====================================================
// POST - Gerar plano alimentar semanal personalizado
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const { userId, preferencias } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId e obrigatorio' },
        { status: 400 }
      )
    }

    // Buscar perfil completo
    const { data: profile, error: profileError } = await supabase
      .from('profiles_nutri')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil nao encontrado' },
        { status: 404 }
      )
    }

    const perfil: ProfileContext = {
      nome: profile.nome || undefined,
      idade: profile.idade || undefined,
      peso_atual: profile.peso_atual || undefined,
      peso_meta: profile.peso_meta || undefined,
      altura: profile.altura || undefined,
      idade_bebe: profile.idade_bebe || undefined,
      amamentando: profile.amamentando || false,
      plano: profile.plano || 'normal',
      semana_gestacao: profile.semana_gestacao || undefined,
      restricoes: profile.restricoes || undefined,
      preferencias: profile.preferencias || undefined
    }

    // Gerar plano com IA
    const plano = await gerarPlanoSemanal(perfil, preferencias)

    // Se retornou string, é fallback de erro
    if (typeof plano === 'string') {
      return NextResponse.json({ plano, tipo: 'fallback' })
    }

    // Salvar plano no banco
    try {
      await supabase
        .from('metas_nutri')
        .insert({
          user_id: userId,
          tipo: 'plano_semanal',
          descricao: `Plano Semanal - ${new Date().toLocaleDateString('pt-BR')}`,
          meta_json: plano,
          data_inicio: new Date().toISOString(),
          data_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })

      // Adicionar itens da lista de compras
      if (plano.lista_compras?.length) {
        const itensCompras = plano.lista_compras.map(item => ({
          user_id: userId,
          nome: item.item,
          quantidade: item.quantidade,
          categoria: item.categoria,
          comprado: false
        }))

        await supabase
          .from('lista_compras_nutri')
          .insert(itensCompras)
      }
    } catch (dbError) {
      console.error('Erro ao salvar plano:', dbError)
    }

    return NextResponse.json({ plano, tipo: 'gerado' })
  } catch (error) {
    console.error('Erro ao gerar plano:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar plano alimentar' },
      { status: 500 }
    )
  }
}

// =====================================================
// GET - Buscar plano semanal ativo
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId e obrigatorio' },
        { status: 400 }
      )
    }

    const { data: plano } = await supabase
      .from('metas_nutri')
      .select('*')
      .eq('user_id', userId)
      .eq('tipo', 'plano_semanal')
      .gte('data_fim', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!plano) {
      return NextResponse.json({ plano: null })
    }

    return NextResponse.json({ plano: plano.meta_json })
  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return NextResponse.json({ plano: null })
  }
}
