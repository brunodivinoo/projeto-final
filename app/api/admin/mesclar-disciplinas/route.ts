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

// Função para detectar duplicatas localmente (fallback sem IA)
function detectarDuplicatasLocal(disciplinas: DisciplinaComQtd[]): SugestaoMesclagem[] {
  const sugestoes: SugestaoMesclagem[] = []
  const processados = new Set<string>()

  // Mapeamentos conhecidos
  const mapeamentos: Record<string, string[]> = {
    'raciocinio logico': ['raciocinio logico matematico', 'raciocinio logico-matematico', 'logica', 'matematica e raciocinio logico'],
    'lingua portuguesa': ['portugues', 'gramatica'],
    'informatica': ['nocoes de informatica', 'informatica basica'],
    'direito constitucional': ['nocoes de direito constitucional'],
    'direito administrativo': ['nocoes de direito administrativo'],
    'direito penal': ['nocoes de direito penal'],
    'direito civil': ['nocoes de direito civil'],
    'contabilidade': ['nocoes de contabilidade', 'contabilidade geral']
  }

  for (const disc of disciplinas) {
    if (processados.has(disc.id)) continue

    const nomeNorm = normalizarNome(disc.nome)
    const paraMesclar: DisciplinaComQtd[] = []

    // Verificar variações com "Noções de" ou "para Cargo"
    for (const outra of disciplinas) {
      if (outra.id === disc.id || processados.has(outra.id)) continue

      const outraNorm = normalizarNome(outra.nome)

      // Verificar se uma é "Noções de X" da outra
      if (outraNorm.startsWith('nocoes de ') && outraNorm.replace('nocoes de ', '') === nomeNorm) {
        paraMesclar.push(outra)
        continue
      }
      if (nomeNorm.startsWith('nocoes de ') && nomeNorm.replace('nocoes de ', '') === outraNorm) {
        paraMesclar.push(outra)
        continue
      }

      // Verificar se tem "(para Cargo)" - indicando ser específica de cargo
      if (outraNorm.includes('(para ') || outraNorm.includes(' para ')) {
        const semCargo = outraNorm.replace(/\s*\(para\s+[^)]+\)\s*/g, '').replace(/\s+para\s+\w+/g, '').trim()
        if (semCargo === nomeNorm || nomeNorm.includes(semCargo)) {
          paraMesclar.push(outra)
          continue
        }
      }

      // Verificar mapeamentos conhecidos
      for (const [base, variacoes] of Object.entries(mapeamentos)) {
        if ((nomeNorm.includes(base) || variacoes.some(v => nomeNorm.includes(v))) &&
            (outraNorm.includes(base) || variacoes.some(v => outraNorm.includes(v)))) {
          if (!paraMesclar.find(p => p.id === outra.id)) {
            paraMesclar.push(outra)
          }
        }
      }
    }

    if (paraMesclar.length > 0) {
      // A principal é a que tem mais questões
      const todas = [disc, ...paraMesclar].sort((a, b) => (b.qtd_questoes || 0) - (a.qtd_questoes || 0))
      const principal = todas[0]
      const mesclar = todas.slice(1)

      sugestoes.push({
        disciplinaPrincipal: principal,
        disciplinasParaMesclar: mesclar,
        motivo: 'Variações do mesmo nome detectadas automaticamente',
        confianca: 'media'
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

// GET - Detectar disciplinas duplicadas/similares usando IA
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

    // Se não tiver API key do Gemini, usar detecção local
    if (!GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY não configurada, usando detecção local')
      const sugestoesLocais = detectarDuplicatasLocal(disciplinas)
      return NextResponse.json({
        sugestoes: sugestoesLocais,
        disciplinas,
        totalDisciplinas: disciplinas.length,
        metodo: 'local'
      })
    }

    // Montar lista de disciplinas para a IA analisar
    const listaDisciplinas = disciplinas.map(d => `- "${d.nome}" (${d.qtd_questoes} questões)`).join('\n')

    const prompt = `Você é um especialista em organização de bancos de dados de concursos públicos.

Analise a lista de disciplinas abaixo e identifique DUPLICATAS ou SIMILARES que devem ser MESCLADAS:

${listaDisciplinas}

REGRAS PARA IDENTIFICAR DUPLICATAS:
1. Nomes diferentes para a mesma matéria:
   - "Raciocínio Lógico e Matemática" = "Raciocínio Lógico-Matemático"
   - "Noções de Direito Constitucional" = "Direito Constitucional"
   - "Português" = "Língua Portuguesa"

2. Variações com/sem acento ou hífen:
   - "Lógico-Matemático" = "Logico Matematico"

3. Variações com "Noções de":
   - "Noções de X" deve ser mesclado com "X"

4. NÃO mesclar disciplinas específicas de estado/região:
   - "História de Goiás" é diferente de "História do Brasil"
   - "Legislação Específica da PM-GO" deve ficar separada

5. NÃO mesclar disciplinas realmente diferentes:
   - "Direito Penal" é diferente de "Direito Civil"
   - "Contabilidade Pública" pode ser diferente de "Contabilidade Geral"

Para cada grupo de duplicatas, escolha a disciplina com MAIS questões como principal.

RESPONDA EM JSON:
{
  "sugestoes": [
    {
      "principal": "Nome da disciplina principal (a que vai ficar)",
      "mesclar": ["Nome duplicata 1", "Nome duplicata 2"],
      "motivo": "Explicação curta do porquê são duplicatas",
      "confianca": "alta" ou "media" ou "baixa"
    }
  ]
}

Se não houver duplicatas, retorne: {"sugestoes": []}

IMPORTANTE: Seja CONSERVADOR. Na dúvida, NÃO sugira mesclagem.
Retorne APENAS o JSON, sem markdown.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro na API Gemini:', response.status, errorText, '- Usando fallback local')
      // Fallback para detecção local quando Gemini falha
      const sugestoesLocais = detectarDuplicatasLocal(disciplinas)
      return NextResponse.json({
        sugestoes: sugestoesLocais,
        disciplinas,
        totalDisciplinas: disciplinas.length,
        metodo: 'local (fallback)',
        aviso: 'API Gemini indisponível, usando detecção local'
      })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON
    let resultado: { sugestoes: Array<{ principal: string; mesclar: string[]; motivo: string; confianca: string }> }
    try {
      resultado = JSON.parse(text.trim())
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        resultado = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({ sugestoes: [], disciplinas })
      }
    }

    // Mapear sugestões para incluir IDs e quantidades
    const sugestoesCompletas: SugestaoMesclagem[] = []

    for (const sug of resultado.sugestoes || []) {
      const principal = disciplinas.find(d =>
        d.nome.toLowerCase() === sug.principal.toLowerCase()
      )

      if (!principal) continue

      const paraMesclar = sug.mesclar
        .map(nome => disciplinas.find(d => d.nome.toLowerCase() === nome.toLowerCase()))
        .filter((d): d is DisciplinaComQtd => d !== undefined)

      if (paraMesclar.length === 0) continue

      sugestoesCompletas.push({
        disciplinaPrincipal: principal,
        disciplinasParaMesclar: paraMesclar,
        motivo: sug.motivo,
        confianca: (sug.confianca as 'alta' | 'media' | 'baixa') || 'media'
      })
    }

    return NextResponse.json({
      sugestoes: sugestoesCompletas,
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
