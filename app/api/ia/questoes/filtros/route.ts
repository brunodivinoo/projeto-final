import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar filtros disponíveis para o usuário
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Buscar disciplinas, assuntos, subassuntos e bancas das questões do usuário
    const { data: questoes } = await supabase
      .from('questoes_ia_geradas')
      .select('disciplina, assunto, subassunto, banca, dificuldade, modalidade')
      .eq('user_id', user_id)

    if (!questoes || questoes.length === 0) {
      // Se não tem questões, buscar do banco geral de disciplinas/assuntos/bancas
      const [disciplinasResult, bancasResult] = await Promise.all([
        supabase.from('disciplinas').select('nome').order('nome'),
        supabase.from('bancas').select('nome').order('nome')
      ])

      return NextResponse.json({
        disciplinas: disciplinasResult.data?.map(d => d.nome) || [],
        assuntos: [],
        subassuntos: [],
        bancas: bancasResult.data?.map(b => b.nome) || [],
        dificuldades: ['facil', 'media', 'dificil'],
        modalidades: ['multipla_escolha', 'certo_errado']
      })
    }

    // Extrair valores únicos
    const disciplinas = [...new Set(questoes.map(q => q.disciplina).filter(Boolean))]
    const assuntos = [...new Set(questoes.map(q => q.assunto).filter(Boolean))]
    const subassuntos = [...new Set(questoes.map(q => q.subassunto).filter(Boolean))]
    const bancas = [...new Set(questoes.map(q => q.banca).filter(Boolean))]
    const dificuldades = [...new Set(questoes.map(q => q.dificuldade).filter(Boolean))]
    const modalidades = [...new Set(questoes.map(q => q.modalidade).filter(Boolean))]

    // Buscar também do banco geral para sugestões
    const [disciplinasGerais, bancasGerais] = await Promise.all([
      supabase.from('disciplinas').select('nome').order('nome').limit(50),
      supabase.from('bancas').select('nome').order('nome').limit(20)
    ])

    // Merge sem duplicatas
    const todasDisciplinas = [...new Set([
      ...disciplinas,
      ...(disciplinasGerais.data?.map(d => d.nome) || [])
    ])].sort()

    const todasBancas = [...new Set([
      ...bancas,
      ...(bancasGerais.data?.map(b => b.nome) || [])
    ])].sort()

    return NextResponse.json({
      disciplinas: todasDisciplinas,
      assuntos: assuntos.sort(),
      subassuntos: subassuntos.sort(),
      bancas: todasBancas,
      dificuldades: dificuldades.length > 0 ? dificuldades : ['facil', 'media', 'dificil'],
      modalidades: modalidades.length > 0 ? modalidades : ['multipla_escolha', 'certo_errado']
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
