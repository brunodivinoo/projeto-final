import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { coachCheckIn, type ProfileContext, CheckInDiarioSchema } from '@/lib/nutrivida/ai-engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 60

// =====================================================
// POST - Check-in diário com Coach Virtual
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const { userId, checkIn } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId e obrigatorio' },
        { status: 400 }
      )
    }

    // Validar check-in
    const validacao = CheckInDiarioSchema.safeParse(checkIn)
    if (!validacao.success) {
      return NextResponse.json(
        { error: 'Dados de check-in invalidos', details: validacao.error },
        { status: 400 }
      )
    }

    // Buscar perfil
    const { data: profile } = await supabase
      .from('profiles_nutri')
      .select('nome, peso_atual, peso_meta, idade_bebe, amamentando, plano')
      .eq('id', userId)
      .single()

    const perfil: ProfileContext = {
      nome: profile?.nome || 'Usuaria',
      peso_atual: profile?.peso_atual || undefined,
      peso_meta: profile?.peso_meta || undefined,
      idade_bebe: profile?.idade_bebe || undefined,
      amamentando: profile?.amamentando || false,
      plano: profile?.plano || 'normal'
    }

    // Buscar histórico recente (últimos 3 dias)
    const { data: historicoData } = await supabase
      .from('metas_nutri')
      .select('meta_json, created_at')
      .eq('user_id', userId)
      .eq('tipo', 'check_in')
      .order('created_at', { ascending: false })
      .limit(3)

    const historicoRecente = historicoData?.map(h => {
      const data = h.meta_json as Record<string, unknown>
      return `${new Date(h.created_at).toLocaleDateString('pt-BR')}: Humor ${data.humor}, Energia ${data.energia}/10, Agua ${data.agua_ml}ml`
    }).join('\n')

    // Obter resposta do coach
    const coachResponse = await coachCheckIn(validacao.data, perfil, historicoRecente)

    // Salvar check-in no banco
    try {
      await supabase
        .from('metas_nutri')
        .insert({
          user_id: userId,
          tipo: 'check_in',
          descricao: `Check-in ${new Date().toLocaleDateString('pt-BR')}`,
          meta_json: {
            ...validacao.data,
            coach_response: coachResponse
          }
        })

      // Atualizar água do dia
      const hoje = new Date().toISOString().split('T')[0]
      const { data: aguaHoje } = await supabase
        .from('agua_diaria_nutri')
        .select('id, quantidade_ml')
        .eq('user_id', userId)
        .eq('data', hoje)
        .single()

      if (aguaHoje) {
        await supabase
          .from('agua_diaria_nutri')
          .update({ quantidade_ml: validacao.data.agua_ml })
          .eq('id', aguaHoje.id)
      } else {
        await supabase
          .from('agua_diaria_nutri')
          .insert({
            user_id: userId,
            quantidade_ml: validacao.data.agua_ml,
            data: hoje
          })
      }
    } catch (dbError) {
      console.error('Erro ao salvar check-in:', dbError)
    }

    return NextResponse.json({ coach: coachResponse })
  } catch (error) {
    console.error('Erro no coach:', error)
    return NextResponse.json(
      { error: 'Erro ao processar check-in' },
      { status: 500 }
    )
  }
}

// =====================================================
// GET - Buscar histórico de check-ins
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dias = parseInt(searchParams.get('dias') || '7')

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId e obrigatorio' },
        { status: 400 }
      )
    }

    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - dias)

    const { data: checkins } = await supabase
      .from('metas_nutri')
      .select('meta_json, created_at')
      .eq('user_id', userId)
      .eq('tipo', 'check_in')
      .gte('created_at', dataInicio.toISOString())
      .order('created_at', { ascending: false })

    // Calcular estatísticas
    const stats = {
      total_checkins: checkins?.length || 0,
      media_energia: 0,
      media_sono: 0,
      media_agua: 0,
      dias_exercicio: 0
    }

    if (checkins?.length) {
      const energias: number[] = []
      const sonos: number[] = []
      const aguas: number[] = []
      let exercicios = 0

      checkins.forEach(c => {
        const data = c.meta_json as Record<string, unknown>
        if (data.energia) energias.push(data.energia as number)
        if (data.sono_horas) sonos.push(data.sono_horas as number)
        if (data.agua_ml) aguas.push(data.agua_ml as number)
        if (data.exercicio) exercicios++
      })

      stats.media_energia = energias.length ? Math.round(energias.reduce((a, b) => a + b, 0) / energias.length * 10) / 10 : 0
      stats.media_sono = sonos.length ? Math.round(sonos.reduce((a, b) => a + b, 0) / sonos.length * 10) / 10 : 0
      stats.media_agua = aguas.length ? Math.round(aguas.reduce((a, b) => a + b, 0) / aguas.length) : 0
      stats.dias_exercicio = exercicios
    }

    return NextResponse.json({
      checkins: checkins || [],
      stats
    })
  } catch (error) {
    console.error('Erro ao buscar check-ins:', error)
    return NextResponse.json({ checkins: [], stats: {} })
  }
}
