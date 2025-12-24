import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mapeamento de termos para identificar disciplinas que devem ser separadas
const TERMOS_SEPARACAO = [
  { termo: 'militar', novaDisciplina: 'Direito Penal Militar' },
  { termo: 'processual penal militar', novaDisciplina: 'Direito Processual Penal Militar' },
]

interface QuestaoParaSeparar {
  id: string
  disciplina: string
  assunto: string | null
  enunciado: string
  termoEncontrado: string
  novaDisciplina: string
}

// GET - Detectar questões que podem precisar ser separadas
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const disciplinaOrigem = url.searchParams.get('disciplina') || 'Direito Penal'

    // Buscar questões da disciplina
    const { data: questoes, error } = await supabase
      .from('questoes')
      .select('id, disciplina, assunto, enunciado')
      .eq('disciplina', disciplinaOrigem)

    if (error) {
      console.error('Erro ao buscar questões:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Encontrar questões que contêm termos de outras disciplinas
    const questoesParaSeparar: QuestaoParaSeparar[] = []

    for (const q of questoes || []) {
      const textoCompleto = `${q.assunto || ''} ${q.enunciado || ''}`.toLowerCase()

      for (const { termo, novaDisciplina } of TERMOS_SEPARACAO) {
        if (textoCompleto.includes(termo)) {
          // Evitar duplicatas se já foi adicionado com outro termo
          if (!questoesParaSeparar.some(qp => qp.id === q.id)) {
            questoesParaSeparar.push({
              id: q.id,
              disciplina: q.disciplina,
              assunto: q.assunto,
              enunciado: q.enunciado?.substring(0, 200) + '...',
              termoEncontrado: termo,
              novaDisciplina
            })
          }
        }
      }
    }

    // Agrupar por nova disciplina
    const agrupado: Record<string, QuestaoParaSeparar[]> = {}
    for (const q of questoesParaSeparar) {
      if (!agrupado[q.novaDisciplina]) {
        agrupado[q.novaDisciplina] = []
      }
      agrupado[q.novaDisciplina].push(q)
    }

    return NextResponse.json({
      disciplinaOrigem,
      totalQuestoes: questoes?.length || 0,
      questoesParaSeparar: questoesParaSeparar.length,
      agrupado,
      sugestoes: Object.entries(agrupado).map(([disciplina, questoes]) => ({
        novaDisciplina: disciplina,
        quantidade: questoes.length,
        questoes: questoes.slice(0, 5) // Mostrar apenas 5 exemplos
      }))
    })
  } catch (error) {
    console.error('Erro ao detectar separações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Executar separação de disciplinas
export async function POST(req: NextRequest) {
  try {
    const {
      disciplinaOrigem,
      novaDisciplina,
      questaoIds,
      criarDisciplina = true
    } = await req.json() as {
      disciplinaOrigem: string
      novaDisciplina: string
      questaoIds?: string[]
      criarDisciplina?: boolean
    }

    if (!disciplinaOrigem || !novaDisciplina) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios' }, { status: 400 })
    }

    const resultados = {
      disciplinaCriada: false,
      disciplinaId: null as string | null,
      questoesMovidas: 0,
      erros: [] as string[]
    }

    // 1. Verificar/criar disciplina destino
    let { data: disciplinaExistente } = await supabase
      .from('disciplinas')
      .select('id, nome')
      .ilike('nome', novaDisciplina)
      .single()

    if (!disciplinaExistente && criarDisciplina) {
      const { data: novaDisciplinaData, error: errCriar } = await supabase
        .from('disciplinas')
        .insert({ nome: novaDisciplina, qtd_questoes: 0 })
        .select('id, nome')
        .single()

      if (errCriar) {
        resultados.erros.push(`Erro ao criar disciplina: ${errCriar.message}`)
      } else {
        disciplinaExistente = novaDisciplinaData
        resultados.disciplinaCriada = true
      }
    }

    if (!disciplinaExistente) {
      return NextResponse.json({
        error: 'Disciplina destino não existe e não foi possível criar',
        resultados
      }, { status: 400 })
    }

    resultados.disciplinaId = disciplinaExistente.id

    // 2. Mover questões
    let questoesParaMover: { id: string }[] = []

    if (questaoIds && questaoIds.length > 0) {
      // Usar IDs específicos
      questoesParaMover = questaoIds.map(id => ({ id }))
    } else {
      // Buscar automaticamente por termo
      const { data: questoes } = await supabase
        .from('questoes')
        .select('id, assunto, enunciado')
        .eq('disciplina', disciplinaOrigem)

      const termo = TERMOS_SEPARACAO.find(t => t.novaDisciplina === novaDisciplina)?.termo

      if (termo && questoes) {
        questoesParaMover = questoes.filter(q => {
          const texto = `${q.assunto || ''} ${q.enunciado || ''}`.toLowerCase()
          return texto.includes(termo)
        })
      }
    }

    // 3. Atualizar disciplina das questões
    if (questoesParaMover.length > 0) {
      const ids = questoesParaMover.map(q => q.id)

      const { error: errUpdate } = await supabase
        .from('questoes')
        .update({ disciplina: novaDisciplina })
        .in('id', ids)

      if (errUpdate) {
        resultados.erros.push(`Erro ao mover questões: ${errUpdate.message}`)
      } else {
        resultados.questoesMovidas = ids.length
      }
    }

    // 4. Atualizar contagens
    // Contar questões da disciplina origem
    const { count: countOrigem } = await supabase
      .from('questoes')
      .select('*', { count: 'exact', head: true })
      .eq('disciplina', disciplinaOrigem)

    // Atualizar contagem da origem
    const { data: discOrigem } = await supabase
      .from('disciplinas')
      .select('id')
      .ilike('nome', disciplinaOrigem)
      .single()

    if (discOrigem) {
      await supabase
        .from('disciplinas')
        .update({ qtd_questoes: countOrigem || 0 })
        .eq('id', discOrigem.id)
    }

    // Contar e atualizar destino
    const { count: countDestino } = await supabase
      .from('questoes')
      .select('*', { count: 'exact', head: true })
      .eq('disciplina', novaDisciplina)

    await supabase
      .from('disciplinas')
      .update({ qtd_questoes: countDestino || 0 })
      .eq('id', disciplinaExistente.id)

    return NextResponse.json({
      sucesso: true,
      resultados
    })
  } catch (error) {
    console.error('Erro ao separar disciplinas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Criar disciplina manualmente
export async function PUT(req: NextRequest) {
  try {
    const { nome } = await req.json() as { nome: string }

    if (!nome) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    }

    // Verificar se já existe
    const { data: existente } = await supabase
      .from('disciplinas')
      .select('id, nome')
      .ilike('nome', nome)
      .single()

    if (existente) {
      return NextResponse.json({
        sucesso: true,
        disciplina: existente,
        mensagem: 'Disciplina já existe'
      })
    }

    // Criar nova
    const { data: nova, error } = await supabase
      .from('disciplinas')
      .insert({ nome, qtd_questoes: 0 })
      .select('id, nome')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      sucesso: true,
      disciplina: nova,
      mensagem: 'Disciplina criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar disciplina:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
