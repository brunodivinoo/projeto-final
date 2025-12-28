import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface SugestaoIA {
  tipo: 'foco_estudo' | 'simulado_recomendado' | 'revisao' | 'dica' | 'alerta'
  titulo: string
  descricao: string
  prioridade: 'alta' | 'media' | 'baixa'
  acao_sugerida?: {
    tipo: 'criar_simulado' | 'revisar' | 'estudar' | 'praticar'
    config?: Record<string, unknown>
  }
  disciplinas_relacionadas?: string[]
  assuntos_relacionados?: string[]
}

// GET - Obter sugestões da IA baseadas no desempenho
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

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

    // Buscar dados de desempenho do usuário
    const [
      { data: simulados },
      { data: desempenho },
      { data: ultimasQuestoes }
    ] = await Promise.all([
      // Últimos 20 simulados finalizados
      supabase
        .from('simulados')
        .select('id, titulo, pontuacao, acertos, erros, quantidade_questoes, finalizado_em, tempo_gasto_segundos')
        .eq('user_id', user_id)
        .eq('status', 'finalizado')
        .order('finalizado_em', { ascending: false })
        .limit(20),

      // Desempenho por área
      supabase
        .from('simulado_desempenho')
        .select('*')
        .eq('user_id', user_id),

      // Últimas 100 respostas
      supabase
        .from('simulado_questoes')
        .select(`
          esta_correta,
          tempo_resposta_segundos,
          respondida_em,
          questao:questoes(disciplina, assunto, dificuldade)
        `)
        .eq('user_id', user_id)
        .not('esta_correta', 'is', null)
        .order('respondida_em', { ascending: false })
        .limit(100)
    ])

    // Processar dados para análise
    const totalSimulados = simulados?.length || 0
    const mediaGeral = totalSimulados > 0
      ? simulados!.reduce((acc, s) => acc + (s.pontuacao || 0), 0) / totalSimulados
      : 0

    // Agrupar desempenho por disciplina
    const desempenhoPorDisciplina = new Map<string, { total: number; acertos: number; erros: number }>()
    const desempenhoPorAssunto = new Map<string, { total: number; acertos: number; erros: number; disciplina: string }>()

    desempenho?.forEach(d => {
      if (d.tipo === 'disciplina') {
        const key = d.area_nome
        if (!desempenhoPorDisciplina.has(key)) {
          desempenhoPorDisciplina.set(key, { total: 0, acertos: 0, erros: 0 })
        }
        const stats = desempenhoPorDisciplina.get(key)!
        stats.total += d.total_questoes || 0
        stats.acertos += d.acertos || 0
        stats.erros += d.erros || 0
      } else if (d.tipo === 'assunto') {
        const key = d.area_nome
        if (!desempenhoPorAssunto.has(key)) {
          desempenhoPorAssunto.set(key, { total: 0, acertos: 0, erros: 0, disciplina: '' })
        }
        const stats = desempenhoPorAssunto.get(key)!
        stats.total += d.total_questoes || 0
        stats.acertos += d.acertos || 0
        stats.erros += d.erros || 0
      }
    })

    // Identificar pontos fracos (< 50% acerto e pelo menos 5 questões)
    const pontosFracos = Array.from(desempenhoPorDisciplina.entries())
      .map(([nome, stats]) => ({
        nome,
        percentual: stats.total > 0 ? (stats.acertos / stats.total) * 100 : 0,
        total: stats.total,
        erros: stats.erros
      }))
      .filter(d => d.percentual < 50 && d.total >= 5)
      .sort((a, b) => a.percentual - b.percentual)
      .slice(0, 5)

    // Identificar pontos fortes (> 70% acerto)
    const pontosFortes = Array.from(desempenhoPorDisciplina.entries())
      .map(([nome, stats]) => ({
        nome,
        percentual: stats.total > 0 ? (stats.acertos / stats.total) * 100 : 0,
        total: stats.total
      }))
      .filter(d => d.percentual >= 70 && d.total >= 5)
      .sort((a, b) => b.percentual - a.percentual)
      .slice(0, 3)

    // Analisar tendência recente (últimos 5 simulados vs anteriores)
    let tendencia: 'melhorando' | 'piorando' | 'estavel' = 'estavel'
    if (simulados && simulados.length >= 6) {
      const ultimos5 = simulados.slice(0, 5)
      const anteriores = simulados.slice(5, 10)

      const mediaUltimos = ultimos5.reduce((acc, s) => acc + (s.pontuacao || 0), 0) / ultimos5.length
      const mediaAnteriores = anteriores.reduce((acc, s) => acc + (s.pontuacao || 0), 0) / anteriores.length

      if (mediaUltimos > mediaAnteriores + 5) {
        tendencia = 'melhorando'
      } else if (mediaUltimos < mediaAnteriores - 5) {
        tendencia = 'piorando'
      }
    }

    // Calcular tempo médio por questão
    const temposQuestoes = ultimasQuestoes
      ?.filter(q => q.tempo_resposta_segundos)
      .map(q => q.tempo_resposta_segundos!) || []
    const tempoMedioPorQuestao = temposQuestoes.length > 0
      ? temposQuestoes.reduce((a, b) => a + b, 0) / temposQuestoes.length
      : 0

    // Usar IA para gerar sugestões personalizadas
    const sugestoesIA = await gerarSugestoesComIA({
      nomeUsuario: profile?.nome || 'Estudante',
      totalSimulados,
      mediaGeral,
      pontosFracos,
      pontosFortes,
      tendencia,
      tempoMedioPorQuestao,
      ultimoSimulado: simulados?.[0]
    })

    // Salvar sugestões no banco
    if (sugestoesIA.length > 0) {
      // Marcar sugestões antigas como visualizadas
      await supabase
        .from('simulado_sugestoes')
        .update({ visualizada: true })
        .eq('user_id', user_id)
        .eq('visualizada', false)

      // Inserir novas sugestões
      const sugestoesParaInserir = sugestoesIA.map((s, index) => ({
        user_id,
        tipo: s.tipo,
        titulo: s.titulo,
        descricao: s.descricao,
        prioridade: index + 1,
        config_sugerida: s.acao_sugerida?.config || null,
        disciplinas_relacionadas: s.disciplinas_relacionadas || [],
        assuntos_relacionados: s.assuntos_relacionados || [],
        visualizada: false,
        gerada_em: new Date().toISOString()
      }))

      await supabase
        .from('simulado_sugestoes')
        .insert(sugestoesParaInserir)
    }

    return NextResponse.json({
      sugestoes: sugestoesIA,
      analise: {
        total_simulados: totalSimulados,
        media_geral: Math.round(mediaGeral * 100) / 100,
        tendencia,
        pontos_fracos: pontosFracos,
        pontos_fortes: pontosFortes,
        tempo_medio_por_questao: Math.round(tempoMedioPorQuestao)
      }
    })

  } catch (error) {
    console.error('[SUGESTOES IA] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Função para gerar sugestões usando IA
async function gerarSugestoesComIA(dados: {
  nomeUsuario: string
  totalSimulados: number
  mediaGeral: number
  pontosFracos: Array<{ nome: string; percentual: number; erros: number }>
  pontosFortes: Array<{ nome: string; percentual: number }>
  tendencia: 'melhorando' | 'piorando' | 'estavel'
  tempoMedioPorQuestao: number
  ultimoSimulado?: { titulo: string; pontuacao: number; finalizado_em: string } | null
}): Promise<SugestaoIA[]> {
  if (!GEMINI_API_KEY) {
    // Fallback para sugestões básicas sem IA
    return gerarSugestoesBasicas(dados)
  }

  const prompt = `Você é um tutor especializado em preparação para concursos públicos brasileiros.

DADOS DO ALUNO:
- Nome: ${dados.nomeUsuario}
- Total de simulados realizados: ${dados.totalSimulados}
- Média geral de acertos: ${dados.mediaGeral.toFixed(1)}%
- Tendência recente: ${dados.tendencia === 'melhorando' ? 'MELHORANDO' : dados.tendencia === 'piorando' ? 'PIORANDO' : 'ESTÁVEL'}
- Tempo médio por questão: ${Math.round(dados.tempoMedioPorQuestao)} segundos
${dados.ultimoSimulado ? `- Último simulado: "${dados.ultimoSimulado.titulo}" com ${dados.ultimoSimulado.pontuacao}% de acerto` : ''}

PONTOS FRACOS (disciplinas com maior dificuldade):
${dados.pontosFracos.length > 0 ? dados.pontosFracos.map(p => `- ${p.nome}: ${p.percentual.toFixed(1)}% de acerto (${p.erros} erros)`).join('\n') : '- Nenhum ponto fraco significativo identificado'}

PONTOS FORTES (disciplinas com bom desempenho):
${dados.pontosFortes.length > 0 ? dados.pontosFortes.map(p => `- ${p.nome}: ${p.percentual.toFixed(1)}% de acerto`).join('\n') : '- Nenhum ponto forte significativo identificado'}

TAREFA:
Gere de 3 a 5 sugestões personalizadas para melhorar o desempenho deste aluno nos estudos para concursos.

FORMATO DE RESPOSTA (JSON array):
[
  {
    "tipo": "foco_estudo" | "simulado_recomendado" | "revisao" | "dica" | "alerta",
    "titulo": "título curto e direto",
    "descricao": "descrição com no máximo 2 frases explicando a sugestão",
    "prioridade": "alta" | "media" | "baixa",
    "disciplinas_relacionadas": ["disciplina1", "disciplina2"],
    "acao_sugerida": {
      "tipo": "criar_simulado" | "revisar" | "estudar" | "praticar",
      "config": {
        "quantidade_questoes": 10,
        "dificuldade": "media",
        "tempo_limite": 30
      }
    }
  }
]

REGRAS:
1. Priorize sugestões sobre os pontos fracos
2. Seja específico e acionável
3. Use linguagem motivacional mas direta
4. Se a tendência for "piorando", inclua um alerta
5. Se o tempo médio for muito alto (> 120s), sugira treinar velocidade
6. Retorne APENAS o JSON array, sem markdown

Retorne as sugestões:`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
      }
    )

    if (!response.ok) {
      console.error('[SUGESTOES IA] Erro na API Gemini:', response.status)
      return gerarSugestoesBasicas(dados)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    let sugestoes: SugestaoIA[]
    try {
      sugestoes = JSON.parse(text.trim())
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        sugestoes = JSON.parse(jsonMatch[0])
      } else {
        return gerarSugestoesBasicas(dados)
      }
    }

    // Validar e sanitizar sugestões
    return sugestoes
      .filter(s => s.tipo && s.titulo && s.descricao)
      .slice(0, 5)
      .map(s => ({
        tipo: s.tipo,
        titulo: s.titulo.slice(0, 100),
        descricao: s.descricao.slice(0, 300),
        prioridade: s.prioridade || 'media',
        acao_sugerida: s.acao_sugerida,
        disciplinas_relacionadas: s.disciplinas_relacionadas?.slice(0, 5),
        assuntos_relacionados: s.assuntos_relacionados?.slice(0, 5)
      }))

  } catch (error) {
    console.error('[SUGESTOES IA] Erro ao gerar sugestões:', error)
    return gerarSugestoesBasicas(dados)
  }
}

// Fallback: sugestões básicas sem IA
function gerarSugestoesBasicas(dados: {
  totalSimulados: number
  mediaGeral: number
  pontosFracos: Array<{ nome: string; percentual: number }>
  tendencia: 'melhorando' | 'piorando' | 'estavel'
  tempoMedioPorQuestao: number
}): SugestaoIA[] {
  const sugestoes: SugestaoIA[] = []

  // Sugestão baseada nos pontos fracos
  if (dados.pontosFracos.length > 0) {
    const disciplinaMaisFraca = dados.pontosFracos[0]
    sugestoes.push({
      tipo: 'foco_estudo',
      titulo: `Foque em ${disciplinaMaisFraca.nome}`,
      descricao: `Seu desempenho em ${disciplinaMaisFraca.nome} está em ${disciplinaMaisFraca.percentual.toFixed(0)}%. Recomendamos fazer simulados focados nesta disciplina para melhorar.`,
      prioridade: 'alta',
      disciplinas_relacionadas: [disciplinaMaisFraca.nome],
      acao_sugerida: {
        tipo: 'criar_simulado',
        config: {
          disciplinas: [{ nome: disciplinaMaisFraca.nome, peso: 1 }],
          quantidade_questoes: 15,
          dificuldade: 'media'
        }
      }
    })
  }

  // Sugestão baseada na tendência
  if (dados.tendencia === 'piorando') {
    sugestoes.push({
      tipo: 'alerta',
      titulo: 'Atenção: Desempenho em queda',
      descricao: 'Seus últimos simulados mostram uma queda no desempenho. Considere revisar os conteúdos e reduzir a quantidade de questões por sessão para focar na qualidade.',
      prioridade: 'alta',
      acao_sugerida: {
        tipo: 'revisar'
      }
    })
  } else if (dados.tendencia === 'melhorando') {
    sugestoes.push({
      tipo: 'dica',
      titulo: 'Continue assim!',
      descricao: `Seu desempenho está melhorando! Mantenha a consistência nos estudos. Sua média atual é de ${dados.mediaGeral.toFixed(0)}%.`,
      prioridade: 'baixa'
    })
  }

  // Sugestão baseada no tempo
  if (dados.tempoMedioPorQuestao > 120) {
    sugestoes.push({
      tipo: 'dica',
      titulo: 'Treine sua velocidade',
      descricao: `Você leva em média ${Math.round(dados.tempoMedioPorQuestao / 60)} minutos por questão. Para provas de concurso, tente reduzir para 2-3 minutos por questão.`,
      prioridade: 'media',
      acao_sugerida: {
        tipo: 'praticar',
        config: {
          tempo_limite_minutos: 30,
          quantidade_questoes: 15
        }
      }
    })
  }

  // Sugestão para iniciantes
  if (dados.totalSimulados < 5) {
    sugestoes.push({
      tipo: 'simulado_recomendado',
      titulo: 'Complete mais simulados',
      descricao: 'Você completou poucos simulados ainda. Quanto mais praticar, melhor conseguiremos identificar seus pontos fortes e fracos.',
      prioridade: 'media',
      acao_sugerida: {
        tipo: 'criar_simulado',
        config: {
          quantidade_questoes: 10,
          modalidade: 'multipla_escolha'
        }
      }
    })
  }

  return sugestoes.slice(0, 5)
}

// POST - Marcar sugestão como visualizada/aplicada
export async function POST(request: NextRequest) {
  try {
    const { user_id, sugestao_id, acao } = await request.json()

    if (!user_id || !sugestao_id) {
      return NextResponse.json({ error: 'user_id e sugestao_id são obrigatórios' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { visualizada: true }
    if (acao === 'aplicada') {
      updateData.aplicada_em = new Date().toISOString()
    }

    const { error } = await supabase
      .from('simulado_sugestoes')
      .update(updateData)
      .eq('id', sugestao_id)
      .eq('user_id', user_id)

    if (error) {
      console.error('[SUGESTOES IA] Erro ao atualizar sugestão:', error)
      return NextResponse.json({ error: 'Erro ao atualizar sugestão' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[SUGESTOES IA] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
