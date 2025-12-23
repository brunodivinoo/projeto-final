import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
type TipoMatch = 'nocoes_de' | 'para_cargo' | 'parte_geral_especial'

interface MatchInfo {
  disciplina: DisciplinaComQtd
  tipo: TipoMatch
}

// Disciplinas que NUNCA devem ser mescladas (são disciplinas distintas)
const DISCIPLINAS_DISTINTAS = [
  'militar',           // Direito Penal Militar != Direito Penal
  'processual',        // Direito Processual != Direito (Civil/Penal)
  'tributario',        // Direito Tributário != Direito Financeiro
  'previdenciario',    // Direito Previdenciário != outros
  'ambiental',         // Direito Ambiental != outros
  'eleitoral',         // Direito Eleitoral != outros
  'trabalho',          // Direito do Trabalho != outros
  'empresarial',       // Direito Empresarial != outros
  'consumidor',        // Direito do Consumidor != outros
  'internacional',     // Direito Internacional != outros
  'agrario',           // Direito Agrário != outros
  'publica',           // Contabilidade Pública != Contabilidade Geral (são diferentes!)
  'custos',            // Contabilidade de Custos != Contabilidade Geral
]

// Verificar se duas disciplinas são incompatíveis para mesclagem
function saoIncompativeis(nome1: string, nome2: string): boolean {
  const n1 = normalizarNome(nome1)
  const n2 = normalizarNome(nome2)

  // Se uma tem termo distintivo que a outra não tem, são incompatíveis
  for (const termo of DISCIPLINAS_DISTINTAS) {
    const n1Tem = n1.includes(termo)
    const n2Tem = n2.includes(termo)
    // Se uma tem e outra não, são disciplinas diferentes
    if (n1Tem !== n2Tem) return true
  }

  return false
}

// Função para detectar duplicatas localmente - CONSERVADORA
function detectarDuplicatasLocal(disciplinas: DisciplinaComQtd[]): SugestaoMesclagem[] {
  const sugestoes: SugestaoMesclagem[] = []
  const processados = new Set<string>()

  for (const disc of disciplinas) {
    if (processados.has(disc.id)) continue

    const nomeNorm = normalizarNome(disc.nome)
    const matches: MatchInfo[] = []

    for (const outra of disciplinas) {
      if (outra.id === disc.id || processados.has(outra.id)) continue

      const outraNorm = normalizarNome(outra.nome)

      // PRIMEIRO: Verificar se são incompatíveis (NUNCA mesclar)
      if (saoIncompativeis(disc.nome, outra.nome)) {
        continue
      }

      // 1. Verificar "Noções de X" vs "X" (ALTA confiança)
      // Ex: "Informática" e "Noções de Informática" = mesma coisa
      if (outraNorm.startsWith('nocoes de ')) {
        const semNocoes = outraNorm.replace('nocoes de ', '')
        if (semNocoes === nomeNorm) {
          matches.push({ disciplina: outra, tipo: 'nocoes_de' })
          continue
        }
      }
      if (nomeNorm.startsWith('nocoes de ')) {
        const semNocoes = nomeNorm.replace('nocoes de ', '')
        if (semNocoes === outraNorm) {
          matches.push({ disciplina: outra, tipo: 'nocoes_de' })
          continue
        }
      }

      // 2. Verificar "(para Cargo)" (ALTA confiança)
      // Ex: "Contabilidade" e "Noções de Contabilidade (para Delegado)" = mesma coisa
      if (outraNorm.includes('(para ')) {
        const semCargo = outraNorm.replace(/\s*\(para\s+[^)]+\)\s*/g, '').trim()
        const semCargoSemNocoes = semCargo.replace(/^nocoes de\s+/, '')
        if (semCargo === nomeNorm || semCargoSemNocoes === nomeNorm) {
          matches.push({ disciplina: outra, tipo: 'para_cargo' })
          continue
        }
      }

      // 3. Verificar "Parte Geral" / "Parte Especial" APENAS se for o MESMO ramo do direito
      // Ex: "Direito Penal" e "Direito Penal (Parte Geral)" = mesma coisa
      // MAS: "Direito Penal" e "Direito Penal Militar" = DIFERENTES (já filtrado acima)
      if (outraNorm.includes('(parte geral)') || outraNorm.includes('(parte especial)')) {
        const semParte = outraNorm
          .replace(/\s*\(parte\s+(geral|especial)\)\s*/gi, '')
          .trim()
        if (semParte === nomeNorm) {
          matches.push({ disciplina: outra, tipo: 'parte_geral_especial' })
          continue
        }
      }
    }

    if (matches.length > 0) {
      // A principal é a que tem mais questões
      const todas = [disc, ...matches.map(m => m.disciplina)].sort((a, b) => (b.qtd_questoes || 0) - (a.qtd_questoes || 0))
      const principal = todas[0]
      const mesclar = todas.slice(1)

      // Gerar motivo detalhado
      const motivos: string[] = []
      if (matches.some(m => m.tipo === 'nocoes_de')) {
        motivos.push('Variação "Noções de X" detectada')
      }
      if (matches.some(m => m.tipo === 'para_cargo')) {
        motivos.push('Variação com cargo específico detectada')
      }
      if (matches.some(m => m.tipo === 'parte_geral_especial')) {
        motivos.push('Variação "Parte Geral/Especial" detectada')
      }

      sugestoes.push({
        disciplinaPrincipal: principal,
        disciplinasParaMesclar: mesclar,
        motivo: motivos.join('; '),
        confianca: 'alta' // Agora todas as sugestões são de alta confiança (conservadoras)
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
