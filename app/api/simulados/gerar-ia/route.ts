import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface ConfigGeracaoSimulado {
  titulo: string
  descricao?: string
  modalidade: 'certo_errado' | 'multipla_escolha' | 'mista'
  quantidade_questoes: number
  tempo_limite_minutos?: number
  dificuldades: string[]
  disciplinas: Array<{ nome: string; peso: number }>
  assuntos?: Array<{ nome: string; disciplina: string; peso: number }>
  subassuntos?: Array<{ nome: string; assunto: string; disciplina: string; peso: number }>
  bancas: string[]
  foco_pontos_fracos?: boolean
  baseado_em_erros?: boolean
}

// Função para normalizar texto
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Função para gerar questão com IA
async function gerarQuestaoIA(config: {
  disciplina: string
  assunto: string
  subassunto: string
  banca: string
  dificuldade: string
  modalidade: string
}, tentativa = 1): Promise<{
  enunciado: string
  alternativas?: Record<string, string>
  resposta_correta: string
  explicacao: string
} | null> {
  const MAX_TENTATIVAS = 3

  const isMultipla = config.modalidade === 'multipla_escolha'

  const prompt = isMultipla
    ? `Você é um especialista em elaborar questões de concursos públicos brasileiros.

CONFIGURAÇÃO:
- Disciplina: ${config.disciplina}
- Assunto: ${config.assunto || 'Geral'}
- Subassunto: ${config.subassunto || 'Geral'}
- Estilo da Banca: ${config.banca}
- Dificuldade: ${config.dificuldade}
- Modalidade: Múltipla Escolha (5 alternativas: A, B, C, D, E)

INSTRUÇÕES:
1. Crie UMA questão no estilo da banca ${config.banca}
2. A questão deve ser de dificuldade ${config.dificuldade}
3. Inclua 5 alternativas (A a E), sendo apenas UMA correta
4. Elabore um comentário explicando o gabarito

FORMATO DE RESPOSTA (JSON):
{
  "enunciado": "texto do enunciado",
  "alternativa_a": "texto da alternativa A",
  "alternativa_b": "texto da alternativa B",
  "alternativa_c": "texto da alternativa C",
  "alternativa_d": "texto da alternativa D",
  "alternativa_e": "texto da alternativa E",
  "gabarito": "A",
  "comentario": "explicação detalhada do gabarito"
}

Retorne APENAS o JSON, sem markdown ou explicações.`
    : `Você é um especialista em elaborar questões de concursos públicos brasileiros.

CONFIGURAÇÃO:
- Disciplina: ${config.disciplina}
- Assunto: ${config.assunto || 'Geral'}
- Subassunto: ${config.subassunto || 'Geral'}
- Estilo da Banca: ${config.banca}
- Dificuldade: ${config.dificuldade}
- Modalidade: Certo ou Errado

INSTRUÇÕES:
1. Crie UMA questão no estilo CESPE/CEBRASPE (Certo ou Errado)
2. A questão deve ser uma afirmação que pode ser julgada como CERTA ou ERRADA
3. Elabore um comentário explicando o gabarito

FORMATO DE RESPOSTA (JSON):
{
  "enunciado": "afirmação para julgar",
  "gabarito": "C",
  "comentario": "explicação detalhada do gabarito"
}

Retorne APENAS o JSON, sem markdown ou explicações.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
        })
      }
    )

    if (!response.ok) {
      if (tentativa < MAX_TENTATIVAS) {
        await new Promise(resolve => setTimeout(resolve, 1000 * tentativa))
        return gerarQuestaoIA(config, tentativa + 1)
      }
      return null
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    let questao
    try {
      questao = JSON.parse(text.trim())
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        questao = JSON.parse(jsonMatch[0])
      }
    }

    if (questao && questao.enunciado && questao.gabarito) {
      if (isMultipla) {
        return {
          enunciado: questao.enunciado,
          alternativas: {
            A: questao.alternativa_a,
            B: questao.alternativa_b,
            C: questao.alternativa_c,
            D: questao.alternativa_d,
            E: questao.alternativa_e
          },
          resposta_correta: questao.gabarito,
          explicacao: questao.comentario
        }
      } else {
        return {
          enunciado: questao.enunciado,
          resposta_correta: questao.gabarito,
          explicacao: questao.comentario
        }
      }
    }

    if (tentativa < MAX_TENTATIVAS) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return gerarQuestaoIA(config, tentativa + 1)
    }

    return null
  } catch (err) {
    console.error(`Erro ao gerar questão (tentativa ${tentativa}):`, err)
    if (tentativa < MAX_TENTATIVAS) {
      await new Promise(resolve => setTimeout(resolve, 1000 * tentativa))
      return gerarQuestaoIA(config, tentativa + 1)
    }
    return null
  }
}

// POST - Gerar simulado com IA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, config } = body as { user_id: string; config: ConfigGeracaoSimulado }

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API de IA não configurada' }, { status: 500 })
    }

    // Verificar se usuário é PRO
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
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

    // Verificar limites
    const hoje = new Date().toISOString().split('T')[0]

    const { data: usoHoje } = await supabase
      .from('uso_diario')
      .select('quantidade')
      .eq('user_id', user_id)
      .eq('data', hoje)
      .eq('tipo', 'simulado_ia')
      .maybeSingle()

    const usadoHoje = usoHoje?.quantidade || 0
    const limiteSimuladosIA = 5 // Limite diário para PRO

    if (usadoHoje >= limiteSimuladosIA) {
      return NextResponse.json({
        error: 'Limite diário de simulados com IA atingido',
        limite: limiteSimuladosIA,
        usado: usadoHoje
      }, { status: 429 })
    }

    // Limitar quantidade de questões
    const quantidadeQuestoes = Math.min(Math.max(5, config.quantidade_questoes || 10), 30)

    // Se baseado em erros, buscar disciplinas/assuntos com mais erros
    let disciplinasFinais = config.disciplinas
    const assuntosFinais = config.assuntos || []

    if (config.foco_pontos_fracos || config.baseado_em_erros) {
      // Buscar desempenho do usuário
      const { data: desempenho } = await supabase
        .from('simulado_desempenho')
        .select('area_nome, tipo, total_questoes, acertos, erros')
        .eq('user_id', user_id)

      if (desempenho && desempenho.length > 0) {
        // Agrupar por disciplina e calcular percentual
        const disciplinasDesempenho = new Map<string, { total: number; acertos: number; erros: number }>()
        const assuntosDesempenho = new Map<string, { total: number; acertos: number; erros: number; disciplina: string }>()

        desempenho.forEach(d => {
          if (d.tipo === 'disciplina') {
            const key = d.area_nome
            if (!disciplinasDesempenho.has(key)) {
              disciplinasDesempenho.set(key, { total: 0, acertos: 0, erros: 0 })
            }
            const stats = disciplinasDesempenho.get(key)!
            stats.total += d.total_questoes || 0
            stats.acertos += d.acertos || 0
            stats.erros += d.erros || 0
          } else if (d.tipo === 'assunto') {
            const key = d.area_nome
            if (!assuntosDesempenho.has(key)) {
              assuntosDesempenho.set(key, { total: 0, acertos: 0, erros: 0, disciplina: '' })
            }
            const stats = assuntosDesempenho.get(key)!
            stats.total += d.total_questoes || 0
            stats.acertos += d.acertos || 0
            stats.erros += d.erros || 0
          }
        })

        // Ordenar por pior desempenho (mais erros ou menor percentual)
        const disciplinasOrdenadas = Array.from(disciplinasDesempenho.entries())
          .map(([nome, stats]) => ({
            nome,
            percentual: stats.total > 0 ? (stats.acertos / stats.total) * 100 : 50,
            erros: stats.erros,
            total: stats.total
          }))
          .filter(d => d.total >= 3) // Pelo menos 3 questões respondidas
          .sort((a, b) => a.percentual - b.percentual) // Menor percentual primeiro
          .slice(0, 5)

        if (disciplinasOrdenadas.length > 0) {
          // Calcular pesos inversos (pior desempenho = maior peso)
          const maxPercentual = Math.max(...disciplinasOrdenadas.map(d => d.percentual))
          disciplinasFinais = disciplinasOrdenadas.map(d => ({
            nome: d.nome,
            peso: Math.max(1, Math.round((maxPercentual - d.percentual + 10) / 10))
          }))
        }
      }
    }

    // Distribuir questões entre disciplinas
    const totalPeso = disciplinasFinais.reduce((acc, d) => acc + d.peso, 0) || 1
    const distribuicao: Array<{
      disciplina: string
      assunto: string
      subassunto: string
      banca: string
      dificuldade: string
      modalidade: string
    }> = []

    let questoesRestantes = quantidadeQuestoes

    for (let i = 0; i < disciplinasFinais.length; i++) {
      const disc = disciplinasFinais[i]
      const isUltima = i === disciplinasFinais.length - 1
      const qtdDisc = isUltima
        ? questoesRestantes
        : Math.max(1, Math.round((disc.peso / totalPeso) * quantidadeQuestoes))

      questoesRestantes -= qtdDisc

      // Assuntos desta disciplina
      const assuntosDisc = assuntosFinais.filter(a =>
        normalizarTexto(a.disciplina) === normalizarTexto(disc.nome)
      )

      for (let k = 0; k < qtdDisc; k++) {
        const assunto = assuntosDisc[k % (assuntosDisc.length || 1)]
        const subassunto = config.subassuntos?.find(s =>
          s.assunto === assunto?.nome && s.disciplina === disc.nome
        )
        const banca = config.bancas[k % (config.bancas.length || 1)] || 'CESPE/CEBRASPE'
        const dificuldade = config.dificuldades[k % (config.dificuldades.length || 1)] || 'media'

        let modalidade = config.modalidade
        if (modalidade === 'mista') {
          modalidade = k % 2 === 0 ? 'multipla_escolha' : 'certo_errado'
        }

        distribuicao.push({
          disciplina: disc.nome,
          assunto: assunto?.nome || '',
          subassunto: subassunto?.nome || '',
          banca,
          dificuldade,
          modalidade
        })
      }
    }

    // Gerar questões em paralelo (com limite de concorrência)
    console.log(`[SIMULADO IA] Gerando ${distribuicao.length} questões...`)

    const BATCH_SIZE = 5
    const questoesGeradas: Array<{
      disciplina: string
      assunto: string
      subassunto: string
      banca: string
      dificuldade: string
      modalidade: string
      enunciado: string
      alternativas?: Record<string, string>
      resposta_correta: string
      explicacao: string
    }> = []

    for (let i = 0; i < distribuicao.length; i += BATCH_SIZE) {
      const batch = distribuicao.slice(i, i + BATCH_SIZE)
      const resultados = await Promise.all(
        batch.map(async (item) => {
          const questao = await gerarQuestaoIA(item)
          if (questao) {
            return { ...item, ...questao }
          }
          return null
        })
      )

      questoesGeradas.push(
        ...resultados.filter((q): q is NonNullable<typeof q> => q !== null)
      )
    }

    console.log(`[SIMULADO IA] ${questoesGeradas.length} questões geradas com sucesso`)

    if (questoesGeradas.length === 0) {
      return NextResponse.json({ error: 'Não foi possível gerar questões' }, { status: 500 })
    }

    // Criar o simulado
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados')
      .insert({
        user_id,
        titulo: config.titulo || `Simulado IA - ${new Date().toLocaleDateString('pt-BR')}`,
        descricao: config.descricao || `Simulado gerado com IA focado em: ${disciplinasFinais.map(d => d.nome).join(', ')}`,
        fonte: 'ia',
        modalidade: config.modalidade === 'mista' ? 'multipla_escolha' : config.modalidade,
        quantidade_questoes: questoesGeradas.length,
        tempo_limite_minutos: config.tempo_limite_minutos || null,
        dificuldades: config.dificuldades,
        status: 'pendente'
      })
      .select()
      .single()

    if (simuladoError) {
      console.error('[SIMULADO IA] Erro ao criar simulado:', simuladoError)
      return NextResponse.json({ error: 'Erro ao criar simulado' }, { status: 500 })
    }

    // Salvar questões IA na tabela de questões
    const questoesParaInserir = questoesGeradas.map(q => ({
      enunciado: q.enunciado,
      alternativas: q.alternativas || null,
      resposta_correta: q.resposta_correta,
      explicacao: q.explicacao,
      disciplina: q.disciplina,
      assunto: q.assunto || null,
      subassunto: q.subassunto || null,
      banca: q.banca,
      dificuldade: q.dificuldade,
      modalidade: q.modalidade,
      fonte: 'ia',
      ano: new Date().getFullYear(),
      ativo: true
    }))

    const { data: questoesInseridas, error: questoesError } = await supabase
      .from('questoes')
      .insert(questoesParaInserir)
      .select('id')

    if (questoesError) {
      console.error('[SIMULADO IA] Erro ao salvar questões:', questoesError)
      // Rollback - deletar simulado
      await supabase.from('simulados').delete().eq('id', simulado.id)
      return NextResponse.json({ error: 'Erro ao salvar questões' }, { status: 500 })
    }

    // Vincular questões ao simulado
    const simuladoQuestoes = questoesInseridas?.map((q, index) => ({
      simulado_id: simulado.id,
      questao_id: q.id,
      ordem: index + 1
    })) || []

    const { error: vinculoError } = await supabase
      .from('simulado_questoes')
      .insert(simuladoQuestoes)

    if (vinculoError) {
      console.error('[SIMULADO IA] Erro ao vincular questões:', vinculoError)
    }

    // Salvar disciplinas e assuntos do simulado
    const disciplinasUnicas = [...new Set(questoesGeradas.map(q => q.disciplina))]
    const assuntosUnicos = [...new Set(questoesGeradas.map(q => q.assunto).filter(Boolean))]

    await Promise.all([
      supabase.from('simulado_disciplinas').insert(
        disciplinasUnicas.map(d => ({ simulado_id: simulado.id, disciplina_nome: d }))
      ),
      assuntosUnicos.length > 0 && supabase.from('simulado_assuntos').insert(
        assuntosUnicos.map(a => ({ simulado_id: simulado.id, assunto_nome: a }))
      )
    ])

    // Registrar uso diário
    if (usoHoje) {
      await supabase
        .from('uso_diario')
        .update({ quantidade: usadoHoje + 1 })
        .eq('user_id', user_id)
        .eq('data', hoje)
        .eq('tipo', 'simulado_ia')
    } else {
      await supabase
        .from('uso_diario')
        .insert({
          user_id,
          data: hoje,
          tipo: 'simulado_ia',
          quantidade: 1
        })
    }

    // Registrar atividade
    await supabase
      .from('historico_atividades')
      .insert({
        user_id,
        tipo: 'simulado_ia_gerado',
        descricao: `Gerou simulado com IA: ${config.titulo}`,
        detalhes: {
          simulado_id: simulado.id,
          quantidade_questoes: questoesGeradas.length,
          disciplinas: disciplinasUnicas,
          foco_pontos_fracos: config.foco_pontos_fracos || false
        }
      })

    return NextResponse.json({
      success: true,
      simulado: {
        ...simulado,
        quantidade_questoes: questoesGeradas.length
      },
      estatisticas: {
        questoes_geradas: questoesGeradas.length,
        disciplinas: disciplinasUnicas,
        assuntos: assuntosUnicos,
        restante_hoje: limiteSimuladosIA - usadoHoje - 1
      }
    })

  } catch (error) {
    console.error('[SIMULADO IA] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
