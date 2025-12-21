import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar itens customizados do usuário com contagem de questões
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const tipo = searchParams.get('tipo') // opcional: 'disciplina', 'assunto', 'subassunto', 'banca'

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Buscar itens customizados
    let query = supabase
      .from('conteudo_customizado')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    const { data: itens, error } = await query

    if (error) {
      console.error('Erro ao buscar itens:', error)
      return NextResponse.json({ error: 'Erro ao buscar itens' }, { status: 500 })
    }

    // Contar questões para cada item
    const itensComContagem = await Promise.all(
      (itens || []).map(async (item) => {
        let contagem = 0

        if (item.tipo === 'disciplina') {
          const { count } = await supabase
            .from('questoes_ia_geradas')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
            .eq('disciplina', item.nome)

          contagem = count || 0
        } else if (item.tipo === 'assunto') {
          const { count } = await supabase
            .from('questoes_ia_geradas')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
            .eq('assunto', item.nome)
            .eq('disciplina', item.disciplina)

          contagem = count || 0
        } else if (item.tipo === 'subassunto') {
          const { count } = await supabase
            .from('questoes_ia_geradas')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
            .eq('subassunto', item.nome)
            .eq('assunto', item.assunto)

          contagem = count || 0
        } else if (item.tipo === 'banca') {
          const { count } = await supabase
            .from('questoes_ia_geradas')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
            .eq('banca', item.nome)

          contagem = count || 0
        }

        return {
          ...item,
          questoes_count: contagem
        }
      })
    )

    return NextResponse.json({ itens: itensComContagem })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Editar nome de um item customizado (com propagação para questões)
export async function PUT(req: NextRequest) {
  try {
    const { item_id, user_id, novo_nome, propagar_questoes } = await req.json()

    if (!item_id || !user_id || !novo_nome) {
      return NextResponse.json({ error: 'item_id, user_id e novo_nome são obrigatórios' }, { status: 400 })
    }

    // Buscar o item atual
    const { data: item, error: fetchError } = await supabase
      .from('conteudo_customizado')
      .select('*')
      .eq('id', item_id)
      .eq('user_id', user_id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    const nomeAntigo = item.nome
    const novoNomeNormalizado = novo_nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

    // Verificar se já existe outro item com o mesmo nome normalizado
    const { data: existente } = await supabase
      .from('conteudo_customizado')
      .select('id')
      .eq('user_id', user_id)
      .eq('tipo', item.tipo)
      .eq('nome_normalizado', novoNomeNormalizado)
      .neq('id', item_id)
      .single()

    if (existente) {
      return NextResponse.json({ error: 'Já existe um item com esse nome' }, { status: 400 })
    }

    // Atualizar o item customizado
    const { error: updateError } = await supabase
      .from('conteudo_customizado')
      .update({
        nome: novo_nome.trim(),
        nome_normalizado: novoNomeNormalizado
      })
      .eq('id', item_id)

    if (updateError) {
      console.error('Erro ao atualizar item:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 })
    }

    // Propagar alteração para as questões se solicitado
    let questoesAtualizadas = 0
    if (propagar_questoes) {
      if (item.tipo === 'disciplina') {
        // Contar questões afetadas
        const { count } = await supabase
          .from('questoes_ia_geradas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('disciplina', nomeAntigo)

        questoesAtualizadas = count || 0

        // Atualizar disciplina em todas as questões
        if (questoesAtualizadas > 0) {
          await supabase
            .from('questoes_ia_geradas')
            .update({ disciplina: novo_nome.trim() })
            .eq('user_id', user_id)
            .eq('disciplina', nomeAntigo)
        }

        // Também atualizar os assuntos e subassuntos que referenciam essa disciplina
        await supabase
          .from('conteudo_customizado')
          .update({
            disciplina: novo_nome.trim(),
            disciplina_normalizada: novoNomeNormalizado
          })
          .eq('user_id', user_id)
          .eq('disciplina', nomeAntigo)

      } else if (item.tipo === 'assunto') {
        // Contar questões afetadas
        const { count } = await supabase
          .from('questoes_ia_geradas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('assunto', nomeAntigo)
          .eq('disciplina', item.disciplina)

        questoesAtualizadas = count || 0

        // Atualizar assunto nas questões
        if (questoesAtualizadas > 0) {
          await supabase
            .from('questoes_ia_geradas')
            .update({ assunto: novo_nome.trim() })
            .eq('user_id', user_id)
            .eq('assunto', nomeAntigo)
            .eq('disciplina', item.disciplina)
        }

        // Também atualizar os subassuntos que referenciam esse assunto
        await supabase
          .from('conteudo_customizado')
          .update({
            assunto: novo_nome.trim(),
            assunto_normalizado: novoNomeNormalizado
          })
          .eq('user_id', user_id)
          .eq('assunto', nomeAntigo)
          .eq('disciplina', item.disciplina)

      } else if (item.tipo === 'subassunto') {
        // Contar questões afetadas
        const { count } = await supabase
          .from('questoes_ia_geradas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('subassunto', nomeAntigo)
          .eq('assunto', item.assunto)

        questoesAtualizadas = count || 0

        // Atualizar subassunto nas questões
        if (questoesAtualizadas > 0) {
          await supabase
            .from('questoes_ia_geradas')
            .update({ subassunto: novo_nome.trim() })
            .eq('user_id', user_id)
            .eq('subassunto', nomeAntigo)
            .eq('assunto', item.assunto)
        }

      } else if (item.tipo === 'banca') {
        // Contar questões afetadas
        const { count } = await supabase
          .from('questoes_ia_geradas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('banca', nomeAntigo)

        questoesAtualizadas = count || 0

        // Atualizar banca nas questões
        if (questoesAtualizadas > 0) {
          await supabase
            .from('questoes_ia_geradas')
            .update({ banca: novo_nome.trim() })
            .eq('user_id', user_id)
            .eq('banca', nomeAntigo)
        }
      }
    }

    return NextResponse.json({
      success: true,
      questoes_atualizadas: questoesAtualizadas
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Deletar item customizado (com opção de deletar questões)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const item_id = searchParams.get('item_id')
    const user_id = searchParams.get('user_id')
    const deletar_questoes = searchParams.get('deletar_questoes') === 'true'

    if (!item_id || !user_id) {
      return NextResponse.json({ error: 'item_id e user_id são obrigatórios' }, { status: 400 })
    }

    // Buscar o item
    const { data: item, error: fetchError } = await supabase
      .from('conteudo_customizado')
      .select('*')
      .eq('id', item_id)
      .eq('user_id', user_id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    let questoesDeletadas = 0

    // Deletar questões relacionadas se solicitado
    if (deletar_questoes) {
      if (item.tipo === 'disciplina') {
        // Contar primeiro
        const { count } = await supabase
          .from('questoes_ia_geradas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('disciplina', item.nome)

        questoesDeletadas = count || 0

        // Deletar questões
        if (questoesDeletadas > 0) {
          await supabase
            .from('questoes_ia_geradas')
            .delete()
            .eq('user_id', user_id)
            .eq('disciplina', item.nome)
        }

        // Deletar também assuntos e subassuntos dessa disciplina
        await supabase
          .from('conteudo_customizado')
          .delete()
          .eq('user_id', user_id)
          .eq('disciplina', item.nome)
          .in('tipo', ['assunto', 'subassunto'])

      } else if (item.tipo === 'assunto') {
        // Contar primeiro
        const { count } = await supabase
          .from('questoes_ia_geradas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('assunto', item.nome)
          .eq('disciplina', item.disciplina)

        questoesDeletadas = count || 0

        // Deletar questões
        if (questoesDeletadas > 0) {
          await supabase
            .from('questoes_ia_geradas')
            .delete()
            .eq('user_id', user_id)
            .eq('assunto', item.nome)
            .eq('disciplina', item.disciplina)
        }

        // Deletar também subassuntos desse assunto
        await supabase
          .from('conteudo_customizado')
          .delete()
          .eq('user_id', user_id)
          .eq('assunto', item.nome)
          .eq('disciplina', item.disciplina)
          .eq('tipo', 'subassunto')

      } else if (item.tipo === 'subassunto') {
        // Contar primeiro
        const { count } = await supabase
          .from('questoes_ia_geradas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('subassunto', item.nome)
          .eq('assunto', item.assunto)

        questoesDeletadas = count || 0

        // Deletar questões
        if (questoesDeletadas > 0) {
          await supabase
            .from('questoes_ia_geradas')
            .delete()
            .eq('user_id', user_id)
            .eq('subassunto', item.nome)
            .eq('assunto', item.assunto)
        }

      } else if (item.tipo === 'banca') {
        // Contar primeiro
        const { count } = await supabase
          .from('questoes_ia_geradas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('banca', item.nome)

        questoesDeletadas = count || 0

        // Deletar questões
        if (questoesDeletadas > 0) {
          await supabase
            .from('questoes_ia_geradas')
            .delete()
            .eq('user_id', user_id)
            .eq('banca', item.nome)
        }
      }
    }

    // Deletar o item customizado
    const { error: deleteError } = await supabase
      .from('conteudo_customizado')
      .delete()
      .eq('id', item_id)
      .eq('user_id', user_id)

    if (deleteError) {
      console.error('Erro ao deletar item:', deleteError)
      return NextResponse.json({ error: 'Erro ao deletar item' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      questoes_deletadas: questoesDeletadas
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
