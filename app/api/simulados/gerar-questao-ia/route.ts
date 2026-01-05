import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

// POST - Gerar UMA questão da fila
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, simulado_id } = body

    if (!user_id || !simulado_id) {
      return NextResponse.json({ error: 'user_id e simulado_id são obrigatórios' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API de IA não configurada' }, { status: 500 })
    }

    // Buscar próximo item pendente da fila
    const { data: proximoItem, error: itemError } = await supabase
      .from('simulado_ia_fila')
      .select('*')
      .eq('simulado_id', simulado_id)
      .eq('user_id', user_id)
      .eq('status', 'pendente')
      .order('ordem', { ascending: true })
      .limit(1)
      .single()

    if (itemError || !proximoItem) {
      // Verificar se já concluiu
      const { count: pendentes } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)
        .eq('status', 'pendente')

      const { count: total } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)

      const { count: geradas } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)
        .eq('status', 'concluido')

      if (pendentes === 0) {
        // Atualizar status do simulado para pendente (pronto para iniciar)
        await supabase
          .from('simulados')
          .update({ status: 'pendente' })
          .eq('id', simulado_id)

        return NextResponse.json({
          concluido: true,
          total: total || 0,
          geradas: geradas || 0,
          message: 'Todas as questões foram geradas com sucesso!'
        })
      }

      return NextResponse.json({
        concluido: false,
        erro: true,
        message: 'Nenhum item pendente encontrado'
      })
    }

    // Marcar item como processando
    await supabase
      .from('simulado_ia_fila')
      .update({ status: 'processando' })
      .eq('id', proximoItem.id)

    // Buscar opções avançadas do simulado
    const { data: simulado } = await supabase
      .from('simulados')
      .select('opcoes_avancadas')
      .eq('id', simulado_id)
      .single()

    const opcoesAvancadas = simulado?.opcoes_avancadas || {}

    // Gerar questão com Gemini
    const questao = await gerarQuestaoComGemini({
      disciplina: proximoItem.disciplina,
      assunto: proximoItem.assunto || '',
      subassunto: proximoItem.subassunto || '',
      banca: proximoItem.banca,
      modalidade: proximoItem.modalidade,
      dificuldade: proximoItem.dificuldade,
      opcoesAvancadas
    })

    if (!questao) {
      // Marcar como erro
      await supabase
        .from('simulado_ia_fila')
        .update({
          status: 'erro',
          erro_msg: 'Falha ao gerar questão com IA',
          processed_at: new Date().toISOString()
        })
        .eq('id', proximoItem.id)

      // Buscar contadores atualizados
      const { count: total } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)

      const { count: geradas } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)
        .eq('status', 'concluido')

      const { count: erros } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)
        .eq('status', 'erro')

      return NextResponse.json({
        concluido: false,
        erro: true,
        item_erro: proximoItem.ordem,
        total: total || 0,
        geradas: geradas || 0,
        erros: erros || 0,
        message: 'Erro ao gerar questão, tentando próxima...'
      })
    }

    // Inserir questão no banco
    const { data: questaoInserida, error: questaoError } = await supabase
      .from('questoes')
      .insert({
        enunciado: questao.enunciado,
        alternativas: questao.alternativas || null,
        resposta_correta: questao.resposta_correta,
        explicacao: questao.explicacao,
        disciplina: proximoItem.disciplina,
        assunto: proximoItem.assunto || null,
        subassunto: proximoItem.subassunto || null,
        banca: proximoItem.banca,
        dificuldade: proximoItem.dificuldade,
        modalidade: proximoItem.modalidade,
        fonte: 'ia',
        ano: new Date().getFullYear(),
        ativo: true
      })
      .select('id')
      .single()

    if (questaoError || !questaoInserida) {
      console.error('[GERAR QUESTAO IA] Erro ao inserir questão:', questaoError)

      await supabase
        .from('simulado_ia_fila')
        .update({
          status: 'erro',
          erro_msg: 'Erro ao salvar questão no banco',
          processed_at: new Date().toISOString()
        })
        .eq('id', proximoItem.id)

      return NextResponse.json({
        concluido: false,
        erro: true,
        message: 'Erro ao salvar questão'
      })
    }

    // Vincular questão ao simulado
    await supabase
      .from('simulado_questoes')
      .insert({
        simulado_id,
        questao_id: questaoInserida.id,
        ordem: proximoItem.ordem
      })

    // Atualizar item da fila como concluído
    await supabase
      .from('simulado_ia_fila')
      .update({
        status: 'concluido',
        questao_id: questaoInserida.id,
        processed_at: new Date().toISOString()
      })
      .eq('id', proximoItem.id)

    // Buscar contadores atualizados
    const { count: total } = await supabase
      .from('simulado_ia_fila')
      .select('*', { count: 'exact', head: true })
      .eq('simulado_id', simulado_id)

    const { count: geradas } = await supabase
      .from('simulado_ia_fila')
      .select('*', { count: 'exact', head: true })
      .eq('simulado_id', simulado_id)
      .eq('status', 'concluido')

    const { count: pendentes } = await supabase
      .from('simulado_ia_fila')
      .select('*', { count: 'exact', head: true })
      .eq('simulado_id', simulado_id)
      .eq('status', 'pendente')

    // Verificar se concluiu todas
    const concluido = pendentes === 0
    if (concluido) {
      await supabase
        .from('simulados')
        .update({ status: 'pendente' })
        .eq('id', simulado_id)

      // Registrar atividade de conclusão
      await supabase
        .from('historico_atividades')
        .insert({
          user_id,
          tipo: 'simulado_ia_concluido',
          descricao: `Simulado com IA gerado com sucesso`,
          detalhes: {
            simulado_id,
            total_questoes: geradas
          }
        })
    }

    return NextResponse.json({
      concluido,
      total: total || 0,
      geradas: geradas || 0,
      pendentes: pendentes || 0,
      item_atual: {
        ordem: proximoItem.ordem,
        disciplina: proximoItem.disciplina,
        assunto: proximoItem.assunto
      },
      message: concluido ? 'Simulado gerado com sucesso!' : `Questão ${geradas}/${total} gerada`
    })

  } catch (error) {
    console.error('[GERAR QUESTAO IA] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Normalizar nome da banca para formato padrão
function normalizarBanca(banca: string): string {
  const bancaNormalizada = banca.toLowerCase().trim()

  // Mapeamento de variações comuns
  const mapeamento: Record<string, string> = {
    'cespe': 'CESPE/CEBRASPE',
    'cebraspe': 'CESPE/CEBRASPE',
    'cespe/cebraspe': 'CESPE/CEBRASPE',
    'cesgranrio': 'CESGRANRIO',
    'fcc': 'FCC',
    'fundação carlos chagas': 'FCC',
    'vunesp': 'VUNESP',
    'fgv': 'FGV',
    'fundação getúlio vargas': 'FGV',
    'fundacao getulio vargas': 'FGV',
    'ibfc': 'IBFC',
    'iades': 'IADES',
    'idecan': 'IDECAN',
    'aocp': 'AOCP',
    'quadrix': 'QUADRIX',
    'funcab': 'FUNCAB',
    'consulplan': 'CONSULPLAN',
    'instituto cidades': 'INSTITUTO CIDADES',
    'esaf': 'ESAF',
    'fundatec': 'FUNDATEC'
  }

  return mapeamento[bancaNormalizada] || banca.toUpperCase()
}

interface OpcoesAvancadas {
  distratos?: string
  incluirJurisprudencia?: boolean
  incluirSumulas?: boolean
  incluirSumulasVinculantes?: boolean
  incluirDoutrina?: boolean
}

async function gerarQuestaoComGemini(config: {
  disciplina: string
  assunto: string
  subassunto: string
  banca: string
  modalidade: string
  dificuldade: string
  opcoesAvancadas?: OpcoesAvancadas
}): Promise<{
  enunciado: string
  alternativas?: Record<string, string>
  resposta_correta: string
  explicacao: string
} | null> {
  const MAX_TENTATIVAS = 3
  const isMultipla = config.modalidade === 'multipla_escolha'
  const bancaNormalizada = normalizarBanca(config.banca)
  const opcoes = config.opcoesAvancadas || {}

  // Contexto específico para cada assunto/subassunto
  const contextoAssunto = config.subassunto
    ? `focando especificamente em "${config.subassunto}" dentro de "${config.assunto}"`
    : config.assunto
      ? `focando no assunto "${config.assunto}"`
      : ''

  // Nível de dificuldade descritivo
  const nivelDificuldade = {
    'facil': 'FÁCIL (questão direta, conceitos básicos, sem pegadinhas)',
    'media': 'MÉDIA (requer conhecimento intermediário, pode ter algumas nuances)',
    'dificil': 'DIFÍCIL (questão complexa, detalhes técnicos, análise aprofundada)'
  }[config.dificuldade] || 'MÉDIA'

  // Montar instruções de distratos (temas a NÃO abordar)
  const instrucaoDistratos = opcoes.distratos?.trim()
    ? `\n\nTEMAS/CONTEÚDOS A NÃO ABORDAR (DISTRATOS):\n${opcoes.distratos}\n- NÃO mencione nem aborde esses temas na questão ou nas alternativas.`
    : ''

  // Montar instruções de conteúdo jurídico
  const conteudosJuridicos: string[] = []
  if (opcoes.incluirJurisprudencia) {
    conteudosJuridicos.push('jurisprudência dos tribunais superiores (STF, STJ, TST, etc.)')
  }
  if (opcoes.incluirSumulas) {
    conteudosJuridicos.push('súmulas dos tribunais')
  }
  if (opcoes.incluirSumulasVinculantes) {
    conteudosJuridicos.push('súmulas vinculantes do STF')
  }
  if (opcoes.incluirDoutrina) {
    conteudosJuridicos.push('entendimentos doutrinários')
  }

  const instrucaoConteudoJuridico = conteudosJuridicos.length > 0
    ? `\n\nCONTEÚDO JURÍDICO A INCLUIR:\n- A questão DEVE abordar ou fazer referência a: ${conteudosJuridicos.join(', ')}\n- Cite jurisprudências, súmulas ou doutrinas REAIS e EXISTENTES. NÃO INVENTE informações.\n- Se não houver jurisprudência/súmula/doutrina relevante para o tema específico, adapte a questão para um tema onde exista.`
    : ''

  // Instrução de qualidade e veracidade
  const instrucaoQualidade = `

REGRAS DE QUALIDADE E VERACIDADE:
1. NUNCA invente leis, artigos, súmulas, jurisprudências ou doutrinas. Use APENAS informações REAIS e VERIFICÁVEIS.
2. Se citar um artigo de lei, ele deve EXISTIR com aquele número e conteúdo.
3. Se citar uma súmula ou súmula vinculante, ela deve ser REAL com o número correto.
4. Se citar jurisprudência, deve ser um entendimento CONSOLIDADO dos tribunais.
5. Em caso de dúvida sobre a existência de uma informação, prefira questões conceituais.
6. O comentário deve ser RICO, DIDÁTICO e EDUCATIVO, como uma aula sobre o tema.`

  const prompt = isMultipla
    ? `Você é um professor experiente e especialista em elaborar questões de concursos públicos brasileiros com mais de 20 anos de experiência.

CONFIGURAÇÃO DA QUESTÃO:
- Disciplina: ${config.disciplina}
- Assunto: ${config.assunto || 'Geral'}${config.subassunto ? `\n- Subassunto específico: ${config.subassunto}` : ''}
- Estilo da Banca: ${bancaNormalizada}
- Nível: ${nivelDificuldade}
- Tipo: Múltipla Escolha (5 alternativas: A, B, C, D, E)

INSTRUÇÕES IMPORTANTES:
1. Crie UMA questão ORIGINAL e INÉDITA ${contextoAssunto}
2. Use o estilo característico da banca ${bancaNormalizada}:
   ${bancaNormalizada === 'CESPE/CEBRASPE' ? '- Textos mais longos, contextualização, pegadinhas sutis' : ''}
   ${bancaNormalizada === 'FCC' ? '- Questões diretas, alternativas bem estruturadas, foco em legislação' : ''}
   ${bancaNormalizada === 'FGV' ? '- Questões elaboradas, interdisciplinaridade, casos práticos' : ''}
   ${bancaNormalizada === 'VUNESP' ? '- Questões claras, foco em conhecimento aplicado' : ''}
3. Inclua 5 alternativas (A a E), sendo APENAS UMA correta
4. As alternativas incorretas devem ser plausíveis mas claramente distinguíveis
5. O enunciado deve ser completo e autoexplicativo
${instrucaoDistratos}${instrucaoConteudoJuridico}${instrucaoQualidade}

IMPORTANTE PARA O COMENTÁRIO:
- Explique de forma DIDÁTICA e ACESSÍVEL, como um professor explicaria para um aluno
- Use linguagem clara, evite jargões excessivos
- Explique POR QUE a alternativa correta está certa
- Explique brevemente POR QUE cada alternativa errada está incorreta
- Cite a fundamentação legal, jurisprudencial ou doutrinária quando aplicável
- Se possível, inclua dicas de estudo ou macetes para memorização
- Evite respostas robotizadas ou mecânicas

FORMATO DE RESPOSTA (JSON puro, sem markdown):
{
  "enunciado": "texto completo do enunciado",
  "alternativa_a": "texto da alternativa A",
  "alternativa_b": "texto da alternativa B",
  "alternativa_c": "texto da alternativa C",
  "alternativa_d": "texto da alternativa D",
  "alternativa_e": "texto da alternativa E",
  "gabarito": "A",
  "comentario": "Explicação didática completa com fundamentação"
}

Retorne APENAS o JSON, sem \`\`\`json ou qualquer formatação adicional.`
    : `Você é um professor experiente e especialista em elaborar questões de concursos públicos brasileiros com mais de 20 anos de experiência.

CONFIGURAÇÃO DA QUESTÃO:
- Disciplina: ${config.disciplina}
- Assunto: ${config.assunto || 'Geral'}${config.subassunto ? `\n- Subassunto específico: ${config.subassunto}` : ''}
- Estilo da Banca: ${bancaNormalizada} (Certo ou Errado)
- Nível: ${nivelDificuldade}
- Tipo: Julgamento de assertiva (CERTO ou ERRADO)

INSTRUÇÕES IMPORTANTES:
1. Crie UMA afirmação ORIGINAL e INÉDITA ${contextoAssunto}
2. Use o estilo característico de questões CESPE/CEBRASPE:
   - Afirmações técnicas e precisas
   - Pode conter pegadinhas sutis (palavras como "sempre", "nunca", "somente")
   - Nível de detalhe adequado à dificuldade
3. A afirmação deve ser claramente CERTA ou ERRADA (sem ambiguidade)
${instrucaoDistratos}${instrucaoConteudoJuridico}${instrucaoQualidade}

IMPORTANTE PARA O COMENTÁRIO:
- Explique de forma DIDÁTICA e ACESSÍVEL, como um professor explicaria para um aluno
- Use linguagem clara, evite jargões excessivos
- Explique POR QUE a afirmação está certa OU errada
- Se ERRADA, indique qual seria a informação correta
- Cite a fundamentação legal, jurisprudencial ou doutrinária quando aplicável
- Se possível, inclua dicas de estudo ou macetes para memorização
- Evite respostas robotizadas ou mecânicas

FORMATO DE RESPOSTA (JSON puro, sem markdown):
{
  "enunciado": "afirmação para julgar",
  "gabarito": "C",
  "comentario": "Explicação didática completa com fundamentação"
}

REGRAS:
- gabarito: "C" para CERTO ou "E" para ERRADO
- A afirmação deve ser tecnicamente precisa

Retorne APENAS o JSON, sem \`\`\`json ou qualquer formatação adicional.`

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 4096,
              topP: 0.95,
              topK: 40
            }
          })
        }
      )

      if (!response.ok) {
        console.error(`[GERAR QUESTAO IA] Erro Gemini (tentativa ${tentativa}):`, response.status)
        if (tentativa < MAX_TENTATIVAS) {
          await delay(1000 * tentativa)
          continue
        }
        return null
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      // Parse JSON
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
            explicacao: questao.comentario || ''
          }
        } else {
          return {
            enunciado: questao.enunciado,
            resposta_correta: questao.gabarito,
            explicacao: questao.comentario || ''
          }
        }
      }

      if (tentativa < MAX_TENTATIVAS) {
        await delay(500)
      }

    } catch (err) {
      console.error(`[GERAR QUESTAO IA] Erro (tentativa ${tentativa}):`, err)
      if (tentativa < MAX_TENTATIVAS) {
        await delay(1000 * tentativa)
      }
    }
  }

  return null
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
