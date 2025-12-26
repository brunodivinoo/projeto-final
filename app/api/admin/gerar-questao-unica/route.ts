import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

// POST - Gerar UMA questão e salvar
export async function POST(req: NextRequest) {
  try {
    const { fila_id, user_id } = await req.json() as {
      fila_id: string
      user_id: string
    }

    if (!fila_id || !user_id) {
      return NextResponse.json({ error: 'fila_id e user_id obrigatórios' }, { status: 400 })
    }

    // Buscar item da fila
    const { data: item, error: fetchError } = await supabase
      .from('geracao_fila')
      .select('*')
      .eq('id', fila_id)
      .eq('user_id', user_id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    // Verificar se ainda precisa gerar
    if (item.geradas >= item.quantidade) {
      // Marcar como concluído
      await supabase
        .from('geracao_fila')
        .update({ status: 'concluido', completed_at: new Date().toISOString() })
        .eq('id', fila_id)

      return NextResponse.json({ concluido: true, geradas: item.geradas })
    }

    // Verificar se foi cancelado
    if (item.status === 'cancelado') {
      return NextResponse.json({ cancelado: true })
    }

    // Atualizar status para processando
    if (item.status === 'pendente') {
      await supabase
        .from('geracao_fila')
        .update({ status: 'processando', started_at: new Date().toISOString() })
        .eq('id', fila_id)
    }

    // Montar prompt para UMA questão - PROMPTS DIDÁTICOS OTIMIZADOS
    const bancaUpperCase = item.banca.toUpperCase()

    // Estilo por banca
    const estilosBanca: Record<string, string> = {
      'CESPE': 'Assertivas longas (3-5 linhas), tecnicas, com pegadinhas sutis em palavras como "sempre", "nunca", "somente". Use negacoes e inversoes logicas.',
      'CEBRASPE': 'Assertivas longas (3-5 linhas), tecnicas, com pegadinhas sutis em palavras como "sempre", "nunca", "somente". Use negacoes e inversoes logicas.',
      'FGV': 'Questoes contextualizadas com situacoes praticas e casos concretos.',
      'FCC': 'Assertivas mais diretas, focadas na letra da lei, menos interpretativas.',
      'VUNESP': 'Assertivas claras e objetivas, nivel medio de complexidade.',
      'ENEM': 'Questoes interdisciplinares, contextualizadas com situacoes do cotidiano.',
      'INEP': 'Questoes interdisciplinares, contextualizadas com situacoes do cotidiano.'
    }
    const estiloBanca = estilosBanca[bancaUpperCase] || estilosBanca['CESPE']

    const prompt = item.modalidade === 'certo_errado'
      ? `Voce e um PROFESSOR ESPECIALISTA em concursos publicos brasileiros.
Crie 1 questao CERTO/ERRADO no estilo ${bancaUpperCase} com comentario DIDATICO.

DISCIPLINA: ${item.disciplina}
ASSUNTO: ${item.assunto || 'Geral'}${item.subassunto ? `\nTEMA ESPECIFICO: ${item.subassunto}` : ''}
DIFICULDADE: ${item.dificuldade}

ESTILO DA BANCA ${bancaUpperCase}: ${estiloBanca}

ESTRUTURA DO COMENTARIO (como professor ensinando):
1. Resposta direta: "A assertiva esta [CERTA/ERRADA]."
2. Explicacao do conceito central
3. Fundamentacao legal/doutrinaria/jurisprudencial
4. Se ERRADO: "O erro esta em [X]. O correto seria..."
5. Se CERTO: "A assertiva esta perfeita porque..."
6. Contexto pratico ou dica estrategica (varie!)

RESPONDA EM JSON:
{"enunciado":"afirmacao para julgar (2-5 linhas)","gabarito":"CERTO ou ERRADO","comentario":"comentario didatico completo"}

Apenas JSON, sem markdown.`
      : `Voce e um PROFESSOR ESPECIALISTA em concursos publicos brasileiros.
Crie 1 questao MULTIPLA ESCOLHA (A-E) no estilo ${bancaUpperCase} com comentario DIDATICO.

DISCIPLINA: ${item.disciplina}
ASSUNTO: ${item.assunto || 'Geral'}${item.subassunto ? `\nTEMA ESPECIFICO: ${item.subassunto}` : ''}
DIFICULDADE: ${item.dificuldade}

ESTILO DA BANCA ${bancaUpperCase}: ${estiloBanca}

REGRAS:
- 5 alternativas (A-E), apenas 1 correta
- Distratores devem ser PLAUSIVEIS (erros comuns)
- Varie a letra do gabarito

ESTRUTURA DO COMENTARIO (como professor ensinando):
1. "Gabarito: Letra X" + contextualizacao
2. Conceito-chave e fundamentacao
3. ANALISE DE CADA ALTERNATIVA:
   "A) [CORRETA/INCORRETA] - Explicacao..."
   "B) [CORRETA/INCORRETA] - Explicacao..."
   "C) [CORRETA/INCORRETA] - Explicacao..."
   "D) [CORRETA/INCORRETA] - Explicacao..."
   "E) [CORRETA/INCORRETA] - Explicacao..."
4. Dica estrategica ou macete (varie!)

RESPONDA EM JSON:
{"enunciado":"texto completo contextualizado","alternativa_a":"opcao A","alternativa_b":"opcao B","alternativa_c":"opcao C","alternativa_d":"opcao D","alternativa_e":"opcao E","gabarito":"A/B/C/D/E","comentario":"comentario didatico com analise de cada alternativa"}

Apenas JSON, sem markdown.`

    // Chamar Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 4096
          }
        })
      }
    )

    if (!response.ok) {
      // Incrementar erro
      await supabase
        .from('geracao_fila')
        .update({ erros: item.erros + 1 })
        .eq('id', fila_id)

      return NextResponse.json({
        erro: true,
        message: 'Erro na API Gemini',
        status: response.status
      })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse do JSON
    let questao
    try {
      // Tentar parse direto
      questao = JSON.parse(text.trim())
    } catch {
      // Tentar extrair JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        questao = JSON.parse(jsonMatch[0])
      }
    }

    if (!questao || !questao.enunciado) {
      // Incrementar erro
      await supabase
        .from('geracao_fila')
        .update({ erros: item.erros + 1 })
        .eq('id', fila_id)

      return NextResponse.json({
        erro: true,
        message: 'Resposta inválida da IA',
        resposta: text.slice(0, 200)
      })
    }

    // Inserir questão no banco
    const questaoParaInserir = {
      tipo_prova: 'concurso',
      modalidade: questao.alternativa_a ? 'multipla_escolha_5' : 'certo_errado',
      disciplina: item.disciplina,
      assunto: item.assunto || null,
      subassunto: item.subassunto || null,
      banca: item.banca.toUpperCase(),
      ano: 2025,
      dificuldade: item.dificuldade,
      enunciado: questao.enunciado,
      alternativa_a: questao.alternativa_a || null,
      alternativa_b: questao.alternativa_b || null,
      alternativa_c: questao.alternativa_c || null,
      alternativa_d: questao.alternativa_d || null,
      alternativa_e: questao.alternativa_e || null,
      gabarito: questao.gabarito,
      comentario: questao.comentario,
      id_original: `ia-admin-${user_id.slice(0, 8)}-${Date.now()}`
    }

    const { error: insertError } = await supabase
      .from('questoes')
      .insert(questaoParaInserir)

    if (insertError) {
      console.error('Erro ao inserir questão:', insertError)
      await supabase
        .from('geracao_fila')
        .update({ erros: item.erros + 1 })
        .eq('id', fila_id)

      return NextResponse.json({
        erro: true,
        message: 'Erro ao salvar questão',
        details: insertError.message
      })
    }

    // Atualizar qtd_questoes nas tabelas de referência (incrementar)
    // 1. Disciplina - buscar ID e incrementar
    const { data: discData } = await supabase
      .from('disciplinas')
      .select('id, qtd_questoes')
      .eq('nome', item.disciplina)
      .single()

    if (discData) {
      await supabase
        .from('disciplinas')
        .update({ qtd_questoes: (discData.qtd_questoes || 0) + 1 })
        .eq('id', discData.id)

      // 2. Assunto - buscar ID e incrementar
      if (item.assunto) {
        const { data: assData } = await supabase
          .from('assuntos')
          .select('id, qtd_questoes')
          .eq('disciplina_id', discData.id)
          .eq('nome', item.assunto)
          .single()

        if (assData) {
          await supabase
            .from('assuntos')
            .update({ qtd_questoes: (assData.qtd_questoes || 0) + 1 })
            .eq('id', assData.id)

          // 3. Subassunto - buscar ID e incrementar
          if (item.subassunto) {
            const { data: subData } = await supabase
              .from('subassuntos')
              .select('id, qtd_questoes')
              .eq('assunto_id', assData.id)
              .eq('nome', item.subassunto)
              .single()

            if (subData) {
              await supabase
                .from('subassuntos')
                .update({ qtd_questoes: (subData.qtd_questoes || 0) + 1 })
                .eq('id', subData.id)
            }
          }
        }
      }
    }

    // Atualizar contador de geradas
    const novasGeradas = item.geradas + 1
    const statusFinal = novasGeradas >= item.quantidade ? 'concluido' : 'processando'

    await supabase
      .from('geracao_fila')
      .update({
        geradas: novasGeradas,
        status: statusFinal,
        ...(statusFinal === 'concluido' ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', fila_id)

    return NextResponse.json({
      sucesso: true,
      geradas: novasGeradas,
      total: item.quantidade,
      concluido: novasGeradas >= item.quantidade,
      questao: {
        disciplina: item.disciplina,
        assunto: item.assunto,
        subassunto: item.subassunto,
        enunciado: questao.enunciado.slice(0, 100) + '...'
      }
    })
  } catch (error) {
    console.error('Erro ao gerar questão:', error)
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
