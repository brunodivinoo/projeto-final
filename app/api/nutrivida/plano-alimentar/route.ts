import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { gerarPlanoAlimentarCompleto, ProfileContext } from '@/lib/nutrivida/ai-engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticacao
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 401 })
    }

    // Buscar body
    const body = await request.json()
    const { periodo, preferencias } = body as {
      periodo: 'dia' | 'semana' | 'mes'
      preferencias?: string
    }

    if (!periodo || !['dia', 'semana', 'mes'].includes(periodo)) {
      return NextResponse.json({ error: 'Periodo invalido' }, { status: 400 })
    }

    // Buscar perfil do usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles_nutri')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })
    }

    // Montar contexto do perfil
    const perfilContext: ProfileContext = {
      nome: profile.nome,
      peso_atual: profile.peso_atual,
      peso_meta: profile.peso_meta,
      altura: profile.altura,
      amamentando: profile.amamentando,
      plano: profile.plano,
      restricoes: profile.restricoes || [],
      preferencias: profile.preferencias || []
    }

    // Gerar plano com IA
    const plano = await gerarPlanoAlimentarCompleto(perfilContext, periodo, preferencias)

    if (!plano) {
      return NextResponse.json({
        error: 'Nao foi possivel gerar o plano. Tente novamente.'
      }, { status: 500 })
    }

    // Salvar plano no banco (metas_nutri)
    const { error: saveError } = await supabase
      .from('metas_nutri')
      .upsert({
        user_id: user.id,
        meta_calorias: plano.meta_calorias_diaria,
        plano_alimentar: plano,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (saveError) {
      console.error('Erro ao salvar plano:', saveError)
    }

    // Salvar refeicoes do primeiro dia em refeicoes_diarias_nutri
    if (plano.dias.length > 0) {
      const primeiroDia = plano.dias[0]

      for (const refeicao of primeiroDia.refeicoes) {
        const refeicaoFormatada = {
          id: `plano_${Date.now()}_${refeicao.tipo}`,
          nome: refeicao.nome,
          descricao: refeicao.descricao,
          calorias: refeicao.calorias,
          proteinas: refeicao.proteinas,
          carboidratos: refeicao.carboidratos,
          gorduras: refeicao.gorduras,
          ingredientes: refeicao.ingredientes.map(i => i.nome),
          ingredientes_detalhados: refeicao.ingredientes,
          modo_preparo: refeicao.modo_preparo,
          tempo_preparo: refeicao.tempo_preparo,
          restritivo: perfilContext.plano === 'restritivo'
        }

        await supabase
          .from('refeicoes_diarias_nutri')
          .upsert({
            user_id: user.id,
            tipo_refeicao: refeicao.tipo,
            refeicao_selecionada: refeicaoFormatada,
            data: primeiroDia.data
          }, {
            onConflict: 'user_id,tipo_refeicao,data'
          })
      }
    }

    // Adicionar itens a lista de compras
    for (const item of plano.lista_compras) {
      // Verificar se item ja existe
      const { data: existente } = await supabase
        .from('lista_compras_nutri')
        .select('id, quantidade')
        .eq('user_id', user.id)
        .eq('item_nome', item.item)
        .single()

      if (existente) {
        // Atualizar quantidade
        await supabase
          .from('lista_compras_nutri')
          .update({
            quantidade: existente.quantidade + item.quantidade,
            quantidade_compra: `${existente.quantidade + item.quantidade} ${item.unidade}`
          })
          .eq('id', existente.id)
      } else {
        // Inserir novo
        await supabase
          .from('lista_compras_nutri')
          .insert({
            user_id: user.id,
            item_nome: item.item,
            categoria: item.categoria,
            quantidade: item.quantidade,
            unidade: item.unidade,
            quantidade_compra: `${item.quantidade} ${item.unidade}`,
            comprado: false
          })
      }
    }

    return NextResponse.json({
      success: true,
      plano,
      message: `Plano de ${periodo} gerado com sucesso!`
    })

  } catch (error) {
    console.error('Erro na API plano-alimentar:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// GET para buscar plano salvo
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 401 })
    }

    // Buscar plano salvo
    const { data: metas, error } = await supabase
      .from('metas_nutri')
      .select('plano_alimentar, meta_calorias, updated_at')
      .eq('user_id', user.id)
      .single()

    if (error || !metas?.plano_alimentar) {
      return NextResponse.json({
        plano: null,
        message: 'Nenhum plano encontrado'
      })
    }

    return NextResponse.json({
      plano: metas.plano_alimentar,
      meta_calorias: metas.meta_calorias,
      atualizado_em: metas.updated_at
    })

  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
