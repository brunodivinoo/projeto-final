import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'

// Função para normalizar nome (remover acentos, lowercase)
function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Tipo de match para determinar confiança
type TipoMatch = 'nocoes_de' | 'para_cargo' | 'mapeamento' | 'parte_especifica'

interface MatchInfo {
  disciplina: DisciplinaComQtd
  tipo: TipoMatch
}

// Função para detectar duplicatas localmente
function detectarDuplicatasLocal(disciplinas: DisciplinaComQtd[]): SugestaoMesclagem[] {
  const sugestoes: SugestaoMesclagem[] = []
  const processados = new Set<string>()

  // Mapeamentos conhecidos (alta confiança)
  const mapeamentos: Record<string, string[]> = {
    'raciocinio logico': ['raciocinio logico matematico', 'raciocinio logico-matematico', 'logica', 'matematica e raciocinio logico'],
    'lingua portuguesa': ['portugues', 'gramatica'],
    'informatica': ['nocoes de informatica', 'informatica basica'],
    'direito constitucional': ['nocoes de direito constitucional'],
    'direito administrativo': ['nocoes de direito administrativo'],
    'direito penal': ['nocoes de direito penal', 'direito penal (parte geral)', 'direito penal (parte especial)', 'direito penal militar'],
    'direito civil': ['nocoes de direito civil'],
    'contabilidade': ['nocoes de contabilidade', 'contabilidade geral', 'contabilidade publica']
  }

  for (const disc of disciplinas) {
    if (processados.has(disc.id)) continue

    const nomeNorm = normalizarNome(disc.nome)
    const matches: MatchInfo[] = []

    for (const outra of disciplinas) {
      if (outra.id === disc.id || processados.has(outra.id)) continue

      const outraNorm = normalizarNome(outra.nome)

      // 1. Verificar "Noções de X" vs "X" (ALTA confiança)
      if (outraNorm.startsWith('nocoes de ') && outraNorm.replace('nocoes de ', '') === nomeNorm) {
        matches.push({ disciplina: outra, tipo: 'nocoes_de' })
        continue
      }
      if (nomeNorm.startsWith('nocoes de ') && nomeNorm.replace('nocoes de ', '') === outraNorm) {
        matches.push({ disciplina: outra, tipo: 'nocoes_de' })
        continue
      }

      // 2. Verificar "(para Cargo)" (ALTA confiança)
      if (outraNorm.includes('(para ') || outraNorm.includes(' para ')) {
        const semCargo = outraNorm.replace(/\s*\(para\s+[^)]+\)\s*/g, '').replace(/\s+para\s+\w+/g, '').trim()
        if (semCargo === nomeNorm || nomeNorm.includes(semCargo)) {
          matches.push({ disciplina: outra, tipo: 'para_cargo' })
          continue
        }
      }

      // 3. Verificar "Parte Geral" / "Parte Especial" (ALTA confiança)
      if (outraNorm.includes('(parte ') || outraNorm.includes(' parte ')) {
        const semParte = outraNorm
          .replace(/\s*\(parte\s+(geral|especial)\)\s*/gi, '')
          .replace(/\s+parte\s+(geral|especial)/gi, '')
          .trim()
        if (semParte === nomeNorm) {
          matches.push({ disciplina: outra, tipo: 'parte_especifica' })
          continue
        }
      }

      // 4. Verificar mapeamentos conhecidos (MEDIA confiança - são sugestões baseadas em domínio)
      for (const [base, variacoes] of Object.entries(mapeamentos)) {
        if ((nomeNorm.includes(base) || variacoes.some(v => nomeNorm.includes(v))) &&
            (outraNorm.includes(base) || variacoes.some(v => outraNorm.includes(v)))) {
          if (!matches.find(m => m.disciplina.id === outra.id)) {
            matches.push({ disciplina: outra, tipo: 'mapeamento' })
          }
        }
      }
    }

    if (matches.length > 0) {
      // A principal é a que tem mais questões
      const todas = [disc, ...matches.map(m => m.disciplina)].sort((a, b) => (b.qtd_questoes || 0) - (a.qtd_questoes || 0))
      const principal = todas[0]
      const mesclar = todas.slice(1)

      // Determinar confiança baseada nos tipos de match
      // Alta: se TODOS os matches são de alta confiança (nocoes_de, para_cargo, parte_especifica)
      // Media: se há algum match de mapeamento
      const tiposAlta: TipoMatch[] = ['nocoes_de', 'para_cargo', 'parte_especifica']
      const todosAltaConfianca = matches.every(m => tiposAlta.includes(m.tipo))
      const confianca = todosAltaConfianca ? 'alta' : 'media'

      // Gerar motivo detalhado
      const motivos: string[] = []
      if (matches.some(m => m.tipo === 'nocoes_de')) {
        motivos.push('Variação "Noções de X" detectada')
      }
      if (matches.some(m => m.tipo === 'para_cargo')) {
        motivos.push('Variação com cargo específico detectada')
      }
      if (matches.some(m => m.tipo === 'parte_especifica')) {
        motivos.push('Variação "Parte Geral/Especial" detectada')
      }
      if (matches.some(m => m.tipo === 'mapeamento')) {
        motivos.push('Disciplinas relacionadas por mapeamento')
      }

      sugestoes.push({
        disciplinaPrincipal: principal,
        disciplinasParaMesclar: mesclar,
        motivo: motivos.join('; '),
        confianca
      })

      // Marcar como processados
      todas.forEach(d => processados.add(d.id))
    }
  }

  return sugestoes
}

interface DisciplinaComQtd {
  id: string
  nome: string
  qtd_questoes: number
}

interface SugestaoMesclagem {
  disciplinaPrincipal: DisciplinaComQtd
  disciplinasParaMesclar: DisciplinaComQtd[]
  motivo: string
  confianca: 'alta' | 'media' | 'baixa'
}

// GET - Detectar disciplinas duplicadas/similares (detecção local rápida)
export async function GET() {
  try {
    // Buscar todas as disciplinas
    const { data: disciplinas, error } = await supabase
      .from('disciplinas')
      .select('id, nome, qtd_questoes')
      .order('nome')

    if (error) {
      console.error('Erro ao buscar disciplinas:', error)
      return NextResponse.json({
        error: `Erro ao buscar disciplinas: ${error.message}`,
        details: error
      }, { status: 500 })
    }

    if (!disciplinas || disciplinas.length < 2) {
      return NextResponse.json({ sugestoes: [], disciplinas: disciplinas || [] })
    }

    // Usar detecção local (rápida e confiável)
    const sugestoesLocais = detectarDuplicatasLocal(disciplinas)

    return NextResponse.json({
      sugestoes: sugestoesLocais,
      disciplinas,
      totalDisciplinas: disciplinas.length
    })
  } catch (error) {
    console.error('Erro ao detectar duplicatas:', error)
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// POST - Executar mesclagem de disciplinas
export async function POST(req: NextRequest) {
  try {
    const { disciplinaPrincipalId, disciplinasParaMesclarIds } = await req.json() as {
      disciplinaPrincipalId: string
      disciplinasParaMesclarIds: string[]
    }

    if (!disciplinaPrincipalId || !disciplinasParaMesclarIds?.length) {
      return NextResponse.json({ error: 'IDs obrigatórios' }, { status: 400 })
    }

    // Buscar disciplina principal
    const { data: principal, error: errPrincipal } = await supabase
      .from('disciplinas')
      .select('id, nome')
      .eq('id', disciplinaPrincipalId)
      .single()

    if (errPrincipal || !principal) {
      return NextResponse.json({ error: 'Disciplina principal não encontrada' }, { status: 404 })
    }

    // Buscar disciplinas para mesclar
    const { data: paraMesclar, error: errMesclar } = await supabase
      .from('disciplinas')
      .select('id, nome')
      .in('id', disciplinasParaMesclarIds)

    if (errMesclar || !paraMesclar?.length) {
      return NextResponse.json({ error: 'Disciplinas para mesclar não encontradas' }, { status: 404 })
    }

    const resultados = {
      questoesAtualizadas: 0,
      assuntosMesclados: 0,
      disciplinasRemovidas: 0,
      erros: [] as string[]
    }

    for (const disc of paraMesclar) {
      // 1. Contar questões que serão atualizadas
      const { count: qtdQuestoes } = await supabase
        .from('questoes')
        .select('*', { count: 'exact', head: true })
        .eq('disciplina', disc.nome)

      // 2. Atualizar questões: trocar disciplina
      const { error: errQuestoes } = await supabase
        .from('questoes')
        .update({ disciplina: principal.nome })
        .eq('disciplina', disc.nome)

      if (errQuestoes) {
        resultados.erros.push(`Erro ao atualizar questões de ${disc.nome}: ${errQuestoes.message}`)
      } else {
        resultados.questoesAtualizadas += qtdQuestoes || 0
      }

      // 3. Buscar assuntos da disciplina para mesclar
      const { data: assuntos } = await supabase
        .from('assuntos')
        .select('id, nome')
        .eq('disciplina_id', disc.id)

      if (assuntos?.length) {
        for (const assunto of assuntos) {
          // Verificar se já existe assunto com mesmo nome na disciplina principal
          const { data: assuntoExistente } = await supabase
            .from('assuntos')
            .select('id')
            .eq('disciplina_id', principal.id)
            .ilike('nome', assunto.nome)
            .single()

          if (assuntoExistente) {
            // Mover subassuntos para o assunto existente
            await supabase
              .from('subassuntos')
              .update({ assunto_id: assuntoExistente.id })
              .eq('assunto_id', assunto.id)

            // Deletar assunto duplicado (subassuntos já foram movidos)
            await supabase
              .from('assuntos')
              .delete()
              .eq('id', assunto.id)
          } else {
            // Mover assunto para a disciplina principal
            await supabase
              .from('assuntos')
              .update({ disciplina_id: principal.id })
              .eq('id', assunto.id)
          }
          resultados.assuntosMesclados++
        }
      }

      // 3. Deletar disciplina mesclada
      const { error: errDelete } = await supabase
        .from('disciplinas')
        .delete()
        .eq('id', disc.id)

      if (errDelete) {
        resultados.erros.push(`Erro ao deletar ${disc.nome}: ${errDelete.message}`)
      } else {
        resultados.disciplinasRemovidas++
      }
    }

    // 4. Atualizar contagem de questões da disciplina principal
    const { count: novaQtd } = await supabase
      .from('questoes')
      .select('*', { count: 'exact', head: true })
      .eq('disciplina', principal.nome)

    await supabase
      .from('disciplinas')
      .update({ qtd_questoes: novaQtd || 0 })
      .eq('id', principal.id)

    return NextResponse.json({
      sucesso: true,
      disciplinaPrincipal: principal.nome,
      resultados
    })
  } catch (error) {
    console.error('Erro ao mesclar disciplinas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
