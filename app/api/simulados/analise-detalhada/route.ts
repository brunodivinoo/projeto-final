import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface PontoForteOuFraco {
  area: string
  tipo: 'disciplina' | 'assunto' | 'subassunto'
  percentual_acerto: number
  total_questoes: number
  acertos: number
  erros: number
  tendencia: 'melhorando' | 'piorando' | 'estavel'
  ultima_aparicao: string
  recomendacao: string
}

interface AnaliseDetalhada {
  pontos_fortes: PontoForteOuFraco[]
  pontos_fracos: PontoForteOuFraco[]
  areas_neutras: PontoForteOuFraco[]
  analise_por_dificuldade: Array<{
    dificuldade: string
    percentual: number
    total: number
    acertos: number
    erros: number
  }>
  analise_por_tempo: {
    tempo_medio_acertos: number
    tempo_medio_erros: number
    questoes_rapidas_corretas: number
    questoes_lentas_corretas: number
    insight: string
  }
  padroes_identificados: string[]
  plano_estudo_sugerido: Array<{
    prioridade: number
    area: string
    acao: string
    tempo_sugerido: string
    recursos: string[]
  }>
  resumo_ia?: string
}

// GET - Obter análise detalhada de pontos fortes e fracos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const incluir_ia = searchParams.get('incluir_ia') !== 'false'

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Verificar se usuário é PRO
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano, nome')
      .eq('id', user_id)
      .single()

    const isPro = profile?.plano?.toLowerCase() === 'pro' ||
                  profile?.plano?.toLowerCase() === 'estuda_pro'

    if (!isPro) {
      return NextResponse.json({
        error: 'Recurso exclusivo para usuários PRO',
        upgrade_required: true
      }, { status: 403 })
    }

    // Buscar todos os dados de desempenho
    const { data: desempenho } = await supabase
      .from('simulado_desempenho')
      .select('*')
      .eq('user_id', user_id)

    // Buscar questões respondidas com detalhes
    const { data: respostas } = await supabase
      .from('simulado_questoes')
      .select(`
        esta_correta,
        tempo_resposta_segundos,
        respondida_em,
        questao:questoes(id, disciplina, assunto, subassunto, dificuldade, enunciado)
      `)
      .eq('user_id', user_id)
      .not('esta_correta', 'is', null)
      .order('respondida_em', { ascending: false })
      .limit(500)

    if (!respostas || respostas.length === 0) {
      return NextResponse.json({
        error: 'Dados insuficientes para análise',
        minimo_questoes: 20
      }, { status: 400 })
    }

    // Processar desempenho por área
    const porDisciplina = new Map<string, {
      acertos: number
      erros: number
      total: number
      tempos: number[]
      datas: string[]
    }>()

    const porAssunto = new Map<string, {
      acertos: number
      erros: number
      total: number
      disciplina: string
      tempos: number[]
      datas: string[]
    }>()

    const porDificuldade = new Map<string, { acertos: number; erros: number; total: number }>()

    const temposAcertos: number[] = []
    const temposErros: number[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    respostas.forEach((r: any) => {
      const questaoData = Array.isArray(r.questao) ? r.questao[0] : r.questao
      const disciplina = questaoData?.disciplina || 'Sem disciplina'
      const assunto = questaoData?.assunto || 'Geral'
      const dificuldade = questaoData?.dificuldade || 'media'
      const tempo = r.tempo_resposta_segundos || 0
      const data = r.respondida_em || ''

      // Por disciplina
      if (!porDisciplina.has(disciplina)) {
        porDisciplina.set(disciplina, { acertos: 0, erros: 0, total: 0, tempos: [], datas: [] })
      }
      const statDisc = porDisciplina.get(disciplina)!
      statDisc.total++
      if (r.esta_correta) statDisc.acertos++
      else statDisc.erros++
      if (tempo) statDisc.tempos.push(tempo)
      if (data) statDisc.datas.push(data)

      // Por assunto
      const assuntoKey = `${disciplina}:${assunto}`
      if (!porAssunto.has(assuntoKey)) {
        porAssunto.set(assuntoKey, { acertos: 0, erros: 0, total: 0, disciplina, tempos: [], datas: [] })
      }
      const statAss = porAssunto.get(assuntoKey)!
      statAss.total++
      if (r.esta_correta) statAss.acertos++
      else statAss.erros++
      if (tempo) statAss.tempos.push(tempo)
      if (data) statAss.datas.push(data)

      // Por dificuldade
      if (!porDificuldade.has(dificuldade)) {
        porDificuldade.set(dificuldade, { acertos: 0, erros: 0, total: 0 })
      }
      const statDif = porDificuldade.get(dificuldade)!
      statDif.total++
      if (r.esta_correta) statDif.acertos++
      else statDif.erros++

      // Tempos por resultado
      if (tempo) {
        if (r.esta_correta) temposAcertos.push(tempo)
        else temposErros.push(tempo)
      }
    })

    // Classificar pontos fortes, fracos e neutros
    const pontosFortes: PontoForteOuFraco[] = []
    const pontosFracos: PontoForteOuFraco[] = []
    const areasNeutras: PontoForteOuFraco[] = []

    // Processar disciplinas
    porDisciplina.forEach((stats, disciplina) => {
      if (stats.total < 5) return // Mínimo de 5 questões

      const percentual = Math.round((stats.acertos / stats.total) * 100)
      const tendencia = calcularTendencia(stats.datas, respostas, disciplina)
      const ultimaData = stats.datas.length > 0
        ? stats.datas.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : ''

      const ponto: PontoForteOuFraco = {
        area: disciplina,
        tipo: 'disciplina',
        percentual_acerto: percentual,
        total_questoes: stats.total,
        acertos: stats.acertos,
        erros: stats.erros,
        tendencia,
        ultima_aparicao: ultimaData,
        recomendacao: gerarRecomendacao(disciplina, percentual, tendencia, 'disciplina')
      }

      if (percentual >= 70) {
        pontosFortes.push(ponto)
      } else if (percentual < 50) {
        pontosFracos.push(ponto)
      } else {
        areasNeutras.push(ponto)
      }
    })

    // Processar assuntos (apenas os mais relevantes)
    porAssunto.forEach((stats, key) => {
      if (stats.total < 3) return // Mínimo de 3 questões

      const assunto = key.split(':')[1]
      const percentual = Math.round((stats.acertos / stats.total) * 100)
      const tendencia = calcularTendenciaAssunto(stats.datas, respostas, assunto)
      const ultimaData = stats.datas.length > 0
        ? stats.datas.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : ''

      const ponto: PontoForteOuFraco = {
        area: `${assunto} (${stats.disciplina})`,
        tipo: 'assunto',
        percentual_acerto: percentual,
        total_questoes: stats.total,
        acertos: stats.acertos,
        erros: stats.erros,
        tendencia,
        ultima_aparicao: ultimaData,
        recomendacao: gerarRecomendacao(assunto, percentual, tendencia, 'assunto')
      }

      // Apenas adicionar se for muito forte ou muito fraco
      if (percentual >= 80) {
        pontosFortes.push(ponto)
      } else if (percentual < 40) {
        pontosFracos.push(ponto)
      }
    })

    // Ordenar por relevância
    pontosFortes.sort((a, b) => b.percentual_acerto - a.percentual_acerto)
    pontosFracos.sort((a, b) => a.percentual_acerto - b.percentual_acerto)

    // Análise por dificuldade
    const analisePorDificuldade = Array.from(porDificuldade.entries())
      .map(([dificuldade, stats]) => ({
        dificuldade,
        percentual: Math.round((stats.acertos / stats.total) * 100),
        total: stats.total,
        acertos: stats.acertos,
        erros: stats.erros
      }))
      .sort((a, b) => {
        const ordem = { 'facil': 0, 'media': 1, 'dificil': 2 }
        return (ordem[a.dificuldade as keyof typeof ordem] || 1) - (ordem[b.dificuldade as keyof typeof ordem] || 1)
      })

    // Análise por tempo
    const tempoMedioAcertos = temposAcertos.length > 0
      ? Math.round(temposAcertos.reduce((a, b) => a + b, 0) / temposAcertos.length)
      : 0
    const tempoMedioErros = temposErros.length > 0
      ? Math.round(temposErros.reduce((a, b) => a + b, 0) / temposErros.length)
      : 0

    // Questões rápidas vs lentas
    const tempoMediano = [...temposAcertos, ...temposErros].sort((a, b) => a - b)
    const mediana = tempoMediano[Math.floor(tempoMediano.length / 2)] || 60

    let questoesRapidasCorretas = 0
    let questoesLentasCorretas = 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    respostas.forEach((r: any) => {
      if (r.esta_correta && r.tempo_resposta_segundos) {
        if (r.tempo_resposta_segundos < mediana) questoesRapidasCorretas++
        else questoesLentasCorretas++
      }
    })

    // Insight sobre tempo
    let insightTempo = ''
    if (tempoMedioAcertos < tempoMedioErros) {
      insightTempo = 'Você tende a acertar mais rápido do que errar, indicando bom conhecimento quando sabe a resposta.'
    } else if (tempoMedioAcertos > tempoMedioErros * 1.5) {
      insightTempo = 'Você demora mais nas respostas corretas. Considere confiar mais na primeira impressão.'
    } else {
      insightTempo = 'Seu tempo de resposta é consistente entre acertos e erros.'
    }

    const analisePorTempo = {
      tempo_medio_acertos: tempoMedioAcertos,
      tempo_medio_erros: tempoMedioErros,
      questoes_rapidas_corretas: questoesRapidasCorretas,
      questoes_lentas_corretas: questoesLentasCorretas,
      insight: insightTempo
    }

    // Identificar padrões
    const padroes = identificarPadroes(
      pontosFortes,
      pontosFracos,
      analisePorDificuldade,
      analisePorTempo
    )

    // Gerar plano de estudo
    const planoEstudo = gerarPlanoEstudo(pontosFracos, areasNeutras)

    // Gerar resumo com IA (opcional)
    let resumoIA: string | undefined
    if (incluir_ia && GEMINI_API_KEY && pontosFracos.length > 0) {
      resumoIA = await gerarResumoComIA({
        nome: profile?.nome || 'Estudante',
        pontosFortes: pontosFortes.slice(0, 3),
        pontosFracos: pontosFracos.slice(0, 5),
        padroes
      })
    }

    const analise: AnaliseDetalhada = {
      pontos_fortes: pontosFortes.slice(0, 10),
      pontos_fracos: pontosFracos.slice(0, 10),
      areas_neutras: areasNeutras.slice(0, 5),
      analise_por_dificuldade: analisePorDificuldade,
      analise_por_tempo: analisePorTempo,
      padroes_identificados: padroes,
      plano_estudo_sugerido: planoEstudo,
      resumo_ia: resumoIA
    }

    return NextResponse.json(analise)

  } catch (error) {
    console.error('[ANALISE DETALHADA] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function calcularTendencia(
  datas: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  respostas: any[],
  disciplina: string
): 'melhorando' | 'piorando' | 'estavel' {
  const respostasDisc = respostas.filter((r: any) => {
    const q = Array.isArray(r.questao) ? r.questao[0] : r.questao
    return q?.disciplina === disciplina
  })
  if (respostasDisc.length < 10) return 'estavel'

  // Dividir em duas metades cronológicas
  const metade = Math.floor(respostasDisc.length / 2)
  const primeirasRespostas = respostasDisc.slice(metade) // Mais antigas
  const ultimasRespostas = respostasDisc.slice(0, metade) // Mais recentes

  const percentualPrimeiras = primeirasRespostas.filter(r => r.esta_correta).length / primeirasRespostas.length * 100
  const percentualUltimas = ultimasRespostas.filter(r => r.esta_correta).length / ultimasRespostas.length * 100

  if (percentualUltimas - percentualPrimeiras > 10) return 'melhorando'
  if (percentualUltimas - percentualPrimeiras < -10) return 'piorando'
  return 'estavel'
}

function calcularTendenciaAssunto(
  _datas: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  respostas: any[],
  assunto: string
): 'melhorando' | 'piorando' | 'estavel' {
  const respostasAss = respostas.filter((r: any) => {
    const q = Array.isArray(r.questao) ? r.questao[0] : r.questao
    return q?.assunto === assunto
  })
  if (respostasAss.length < 6) return 'estavel'

  const metade = Math.floor(respostasAss.length / 2)
  const primeiras = respostasAss.slice(metade)
  const ultimas = respostasAss.slice(0, metade)

  const percentualPrimeiras = primeiras.filter(r => r.esta_correta).length / primeiras.length * 100
  const percentualUltimas = ultimas.filter(r => r.esta_correta).length / ultimas.length * 100

  if (percentualUltimas - percentualPrimeiras > 15) return 'melhorando'
  if (percentualUltimas - percentualPrimeiras < -15) return 'piorando'
  return 'estavel'
}

function gerarRecomendacao(
  area: string,
  percentual: number,
  tendencia: 'melhorando' | 'piorando' | 'estavel',
  tipo: 'disciplina' | 'assunto'
): string {
  if (percentual >= 80) {
    return `Continue praticando ${area} para manter a excelência. Considere desafios mais difíceis.`
  } else if (percentual >= 70) {
    if (tendencia === 'melhorando') {
      return `Ótimo progresso em ${area}! Continue no ritmo atual.`
    }
    return `Bom desempenho em ${area}. Foque em detalhes para alcançar a excelência.`
  } else if (percentual >= 50) {
    if (tendencia === 'piorando') {
      return `Atenção: ${area} está piorando. Revise o conteúdo base.`
    }
    return `${area} precisa de atenção. Dedique mais tempo a exercícios práticos.`
  } else {
    if (tendencia === 'melhorando') {
      return `${area} está difícil, mas você está progredindo! Mantenha a dedicação.`
    }
    return `Priorize ${area} nos estudos. Considere revisar a teoria fundamental.`
  }
}

function identificarPadroes(
  pontosFortes: PontoForteOuFraco[],
  pontosFracos: PontoForteOuFraco[],
  porDificuldade: Array<{ dificuldade: string; percentual: number; total: number }>,
  porTempo: { tempo_medio_acertos: number; tempo_medio_erros: number }
): string[] {
  const padroes: string[] = []

  // Padrão: Dificuldade
  const facil = porDificuldade.find(d => d.dificuldade === 'facil')
  const dificil = porDificuldade.find(d => d.dificuldade === 'dificil')

  if (facil && dificil && facil.percentual - dificil.percentual > 30) {
    padroes.push('Grande queda de desempenho em questões difíceis comparado às fáceis.')
  }

  if (dificil && dificil.percentual > 60) {
    padroes.push('Bom desempenho mesmo em questões difíceis - indica conhecimento sólido.')
  }

  // Padrão: Tempo
  if (porTempo.tempo_medio_erros < porTempo.tempo_medio_acertos * 0.7) {
    padroes.push('Respostas erradas são dadas mais rapidamente - evite pressa.')
  }

  // Padrão: Tendências
  const melhorando = pontosFracos.filter(p => p.tendencia === 'melhorando')
  const piorando = pontosFortes.filter(p => p.tendencia === 'piorando')

  if (melhorando.length >= 2) {
    padroes.push(`${melhorando.length} áreas fracas estão melhorando - bom progresso!`)
  }

  if (piorando.length >= 2) {
    padroes.push(`Atenção: ${piorando.length} pontos fortes estão apresentando queda.`)
  }

  // Padrão: Concentração de erros
  if (pontosFracos.length > 0) {
    const totalErros = pontosFracos.reduce((acc, p) => acc + p.erros, 0)
    const errosTop2 = pontosFracos.slice(0, 2).reduce((acc, p) => acc + p.erros, 0)

    if (errosTop2 / totalErros > 0.5) {
      padroes.push(`Maioria dos erros concentrada em ${pontosFracos.slice(0, 2).map(p => p.area).join(' e ')}.`)
    }
  }

  // Padrão: Equilíbrio
  if (pontosFortes.length >= 3 && pontosFracos.length <= 2) {
    padroes.push('Perfil equilibrado com mais pontos fortes que fracos.')
  }

  return padroes
}

function gerarPlanoEstudo(
  pontosFracos: PontoForteOuFraco[],
  areasNeutras: PontoForteOuFraco[]
): Array<{
  prioridade: number
  area: string
  acao: string
  tempo_sugerido: string
  recursos: string[]
}> {
  const plano: Array<{
    prioridade: number
    area: string
    acao: string
    tempo_sugerido: string
    recursos: string[]
  }> = []

  // Prioridade 1: Pontos fracos com tendência de piora
  pontosFracos
    .filter(p => p.tendencia === 'piorando')
    .slice(0, 2)
    .forEach((p, i) => {
      plano.push({
        prioridade: i + 1,
        area: p.area,
        acao: 'Revisão urgente da teoria + exercícios básicos',
        tempo_sugerido: '2-3 horas semanais',
        recursos: ['Resumos teóricos', 'Questões comentadas de nível fácil', 'Videoaulas']
      })
    })

  // Prioridade 2: Demais pontos fracos
  pontosFracos
    .filter(p => p.tendencia !== 'piorando')
    .slice(0, 3)
    .forEach((p, i) => {
      plano.push({
        prioridade: plano.length + 1,
        area: p.area,
        acao: p.tendencia === 'melhorando'
          ? 'Manter ritmo atual de estudos + aumentar dificuldade'
          : 'Praticar com questões de múltiplas bancas',
        tempo_sugerido: '1-2 horas semanais',
        recursos: ['Questões por assunto', 'Simulados focados', 'Mapas mentais']
      })
    })

  // Prioridade 3: Áreas neutras que precisam de atenção
  areasNeutras
    .filter(p => p.tendencia === 'piorando')
    .slice(0, 2)
    .forEach((p) => {
      plano.push({
        prioridade: plano.length + 1,
        area: p.area,
        acao: 'Manutenção para evitar queda',
        tempo_sugerido: '30 min - 1 hora semanal',
        recursos: ['Revisão rápida', 'Questões aleatórias']
      })
    })

  return plano.slice(0, 7) // Máximo 7 itens no plano
}

async function gerarResumoComIA(dados: {
  nome: string
  pontosFortes: PontoForteOuFraco[]
  pontosFracos: PontoForteOuFraco[]
  padroes: string[]
}): Promise<string | undefined> {
  if (!GEMINI_API_KEY) return undefined

  const prompt = `Você é um tutor especializado em concursos públicos. Analise o perfil do aluno e gere um resumo motivacional e prático em 3-4 frases.

ALUNO: ${dados.nome}

PONTOS FORTES:
${dados.pontosFortes.map(p => `- ${p.area}: ${p.percentual_acerto}% de acerto`).join('\n') || '- Nenhum ponto forte significativo ainda'}

PONTOS FRACOS:
${dados.pontosFracos.map(p => `- ${p.area}: ${p.percentual_acerto}% de acerto (${p.tendencia})`).join('\n') || '- Nenhum ponto fraco significativo'}

PADRÕES IDENTIFICADOS:
${dados.padroes.join('\n') || '- Perfil em construção'}

Gere um resumo personalizado, direto e motivacional. Não use emojis. Foque em ações concretas.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
        })
      }
    )

    if (!response.ok) return undefined

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  } catch {
    return undefined
  }
}
