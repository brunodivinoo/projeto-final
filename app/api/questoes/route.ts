import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parâmetros de filtro
    const disciplinas = searchParams.get('disciplinas')?.split(',').filter(Boolean) || []
    const assuntos = searchParams.get('assuntos')?.split(',').filter(Boolean) || []
    const subassuntos = searchParams.get('subassuntos')?.split(',').filter(Boolean) || []
    const bancas = searchParams.get('bancas')?.split(',').filter(Boolean) || []
    const anos = searchParams.get('anos')?.split(',').filter(Boolean).map(Number) || []
    const dificuldades = searchParams.get('dificuldades')?.split(',').filter(Boolean) || []
    const modalidades = searchParams.get('modalidades')?.split(',').filter(Boolean) || []
    const tipoProva = searchParams.get('tipo_prova') || null

    // Parâmetros de paginação
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const porPagina = parseInt(searchParams.get('por_pagina') || '5')

    // Validar porPagina
    const porPaginaValido = [5, 10, 15, 20].includes(porPagina) ? porPagina : 5

    // Calcular offset
    const offset = (pagina - 1) * porPaginaValido

    // Construir query base
    let query = supabase
      .from('questoes')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (disciplinas.length > 0) {
      query = query.in('disciplina', disciplinas)
    }
    if (assuntos.length > 0) {
      query = query.in('assunto', assuntos)
    }
    if (subassuntos.length > 0) {
      query = query.in('subassunto', subassuntos)
    }
    if (bancas.length > 0) {
      query = query.in('banca', bancas)
    }
    if (anos.length > 0) {
      query = query.in('ano', anos)
    }
    if (dificuldades.length > 0) {
      query = query.in('dificuldade', dificuldades)
    }
    if (modalidades.length > 0) {
      query = query.in('modalidade', modalidades)
    }
    if (tipoProva) {
      query = query.eq('tipo_prova', tipoProva)
    }

    // Ordenar e paginar
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + porPaginaValido - 1)

    const { data: questoes, count, error } = await query

    if (error) {
      console.error('Erro ao buscar questões:', error)
      return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
    }

    // Calcular total de páginas
    const totalPaginas = Math.ceil((count || 0) / porPaginaValido)

    return NextResponse.json({
      questoes,
      paginacao: {
        pagina,
        porPagina: porPaginaValido,
        total: count,
        totalPaginas,
        temAnterior: pagina > 1,
        temProxima: pagina < totalPaginas
      }
    })
  } catch (error) {
    console.error('Erro na API de questões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
