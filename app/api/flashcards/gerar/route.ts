import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface FlashcardGerado {
  frente: string
  verso: string
}

export async function POST(req: NextRequest) {
  try {
    const {
      user_id,
      deck_id,
      disciplina,
      assunto,
      subassunto,
      dificuldade,
      quantidade
    } = await req.json()

    if (!user_id || !deck_id) {
      return NextResponse.json({ error: 'user_id e deck_id sao obrigatorios' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key nao configurada' }, { status: 500 })
    }

    // Validar quantidade (max 10)
    const qtd = Math.min(Math.max(1, quantidade || 5), 10)

    // Verificar limites do usuario
    const hoje = new Date().toISOString().split('T')[0]

    // Buscar plano do usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', user_id)
      .single()

    const planoNome = profile?.plano?.toUpperCase() || 'FREE'

    // Buscar limites do plano
    const { data: plano } = await supabase
      .from('planos')
      .select('limite_geracoes_flashcards_dia, limite_flashcards')
      .eq('nome', planoNome)
      .single()

    const limiteGeracoes = plano?.limite_geracoes_flashcards_dia || 3
    const limiteFlashcards = plano?.limite_flashcards || 50

    // Verificar uso de hoje
    const { data: usoHoje } = await supabase
      .from('uso_diario')
      .select('quantidade')
      .eq('user_id', user_id)
      .eq('data', hoje)
      .eq('tipo', 'geracoes_flashcards')
      .maybeSingle()

    const geracoesHoje = usoHoje?.quantidade || 0

    if (limiteGeracoes !== -1 && geracoesHoje >= limiteGeracoes) {
      return NextResponse.json({
        error: 'Limite de geracoes diarias atingido',
        limite: limiteGeracoes,
        usado: geracoesHoje
      }, { status: 429 })
    }

    // Verificar total de flashcards do usuario
    const { count: totalFlashcards } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)

    const flashcardsAtuais = totalFlashcards || 0
    let qtdAjustada = qtd

    // Se tem limite e vai ultrapassar, ajustar quantidade ou bloquear
    if (limiteFlashcards !== -1) {
      const espacoDisponivel = limiteFlashcards - flashcardsAtuais

      if (espacoDisponivel <= 0) {
        return NextResponse.json({
          error: 'Limite de flashcards atingido',
          limite: limiteFlashcards,
          atual: flashcardsAtuais,
          disponivel: 0
        }, { status: 429 })
      }

      // Ajustar quantidade para gerar apenas o que cabe
      if (qtd > espacoDisponivel) {
        qtdAjustada = espacoDisponivel
      }
    }

    // Construir contexto hierarquico
    const temDisciplina = disciplina && disciplina.trim()
    const temAssunto = assunto && assunto.trim()
    const temSubassunto = subassunto && subassunto.trim()

    let contextoTopico = ''
    if (temDisciplina) {
      contextoTopico = `Disciplina: ${disciplina}`
      if (temAssunto) {
        contextoTopico += `\nAssunto: ${assunto}`
        if (temSubassunto) {
          contextoTopico += `\nTopico especifico: ${subassunto}`
        }
      }
    } else {
      contextoTopico = 'Tema: Conhecimentos gerais para concursos'
    }

    // Configuracao de dificuldade detalhada
    const configDificuldade = {
      facil: {
        nivel: 'BASICO',
        descricao: 'conceitos fundamentais, definicoes diretas, informacoes introdutorias',
        tipoPerguntas: 'O que e...?, Qual a definicao de...?, Cite...',
        complexidadeResposta: 'respostas curtas e diretas (1-2 frases)'
      },
      medio: {
        nivel: 'INTERMEDIARIO',
        descricao: 'aplicacao de conceitos, relacoes entre temas, casos praticos',
        tipoPerguntas: 'Qual a diferenca entre...?, Como funciona...?, Em que situacao...?',
        complexidadeResposta: 'respostas moderadas com explicacao (2-3 frases)'
      },
      dificil: {
        nivel: 'AVANCADO',
        descricao: 'excecoes, jurisprudencia, casos controversos, detalhes especificos',
        tipoPerguntas: 'Qual a excecao...?, Segundo o STF...?, Diferencie criticamente...',
        complexidadeResposta: 'respostas completas com fundamentacao (3-4 frases)'
      }
    }

    const config = configDificuldade[dificuldade as keyof typeof configDificuldade] || configDificuldade.medio

    const prompt = `Voce e um ESPECIALISTA em criar flashcards para CONCURSOS PUBLICOS brasileiros, com vasta experiencia em bancas como CESPE/CEBRASPE, FGV, FCC, VUNESP.

## CONTEXTO DO ESTUDO
${contextoTopico}

## CONFIGURACAO
- Quantidade: ${qtdAjustada} flashcards
- Nivel: ${config.nivel}
- Foco: ${config.descricao}

## REGRAS OBRIGATORIAS PARA OS FLASHCARDS

### FRENTE (Pergunta):
- Use linguagem clara e objetiva, como questoes de concurso
- Tipos de pergunta recomendados: ${config.tipoPerguntas}
- Seja especifico - evite perguntas vagas ou muito amplas
- Maximo 2 linhas

### VERSO (Resposta):
- ${config.complexidadeResposta}
- Inclua palavras-chave que facilitam memorizacao
- Use estrutura: conceito principal + detalhe importante (quando aplicavel)
- Para listas, limite a 3-4 itens principais
- Quando relevante, inclua: artigo de lei, sumula, ou jurisprudencia

### TECNICAS DE MEMORIZACAO (aplique quando possivel):
- Acronimos ou mnemonicos conhecidos da area
- Associacoes logicas
- Destaque de excecoes importantes
- Comparacoes que caem em prova

### VARIEDADE - cada flashcard deve ser DIFERENTE:
1. Definicao/Conceito
2. Diferenciacao (X vs Y)
3. Aplicacao pratica
4. Excecao ou detalhe importante
5. Classificacao ou lista
6. Caso concreto ou exemplo

## FORMATO DE SAIDA
Retorne APENAS um array JSON valido, sem markdown, sem explicacoes:
[{"frente":"pergunta aqui","verso":"resposta aqui"}]

IMPORTANTE:
- Nao repita conteudo entre flashcards
- Cada card deve cobrir um aspecto diferente do tema
- Foque no que MAIS CAI em provas de concurso
- Retorne SOMENTE o JSON, nada antes ou depois`

    // Chamar API do Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API Error:', error)
      return NextResponse.json({ error: 'Erro na API do Gemini' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extrair JSON da resposta
    let flashcards: FlashcardGerado[] = []
    try {
      // Tentar parsear diretamente
      flashcards = JSON.parse(text.trim())
    } catch {
      // Tentar extrair JSON do texto
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        try {
          flashcards = JSON.parse(jsonMatch[0])
        } catch {
          console.error('Erro ao parsear JSON dos flashcards')
          return NextResponse.json({ error: 'Erro ao processar resposta da IA' }, { status: 500 })
        }
      }
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json({ error: 'Nenhum flashcard gerado' }, { status: 500 })
    }

    // Validar e limpar flashcards
    const flashcardsValidos = flashcards
      .filter(f => f.frente && f.verso)
      .slice(0, qtdAjustada)
      .map(f => ({
        deck_id,
        user_id,
        frente: f.frente.trim(),
        verso: f.verso.trim(),
        dificuldade: dificuldade || 'medio',
        disciplina: disciplina?.trim() || null,
        assunto: assunto?.trim() || null,
        subassunto: subassunto?.trim() || null,
        proxima_revisao: new Date().toISOString(),
        status: 'novo'
      }))

    if (flashcardsValidos.length === 0) {
      return NextResponse.json({ error: 'Nenhum flashcard valido gerado' }, { status: 500 })
    }

    // Inserir flashcards no banco
    const { data: insertedCards, error: insertError } = await supabase
      .from('flashcards')
      .insert(flashcardsValidos)
      .select()

    if (insertError) {
      console.error('Erro ao inserir flashcards:', insertError)
      return NextResponse.json({ error: 'Erro ao salvar flashcards' }, { status: 500 })
    }

    // Atualizar contadores do deck
    const { count: deckTotal } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('deck_id', deck_id)

    await supabase
      .from('flashcard_decks')
      .update({
        total_cards: deckTotal || 0,
        cards_para_revisar: deckTotal || 0
      })
      .eq('id', deck_id)

    // Registrar uso diario
    if (usoHoje) {
      await supabase
        .from('uso_diario')
        .update({ quantidade: geracoesHoje + 1 })
        .eq('user_id', user_id)
        .eq('data', hoje)
        .eq('tipo', 'geracoes_flashcards')
    } else {
      await supabase
        .from('uso_diario')
        .insert({
          user_id,
          data: hoje,
          tipo: 'geracoes_flashcards',
          quantidade: 1
        })
    }

    return NextResponse.json({
      success: true,
      flashcards: insertedCards,
      quantidade: insertedCards?.length || 0,
      geracoes_restantes: limiteGeracoes === -1 ? -1 : limiteGeracoes - geracoesHoje - 1
    })

  } catch (error) {
    console.error('Erro ao gerar flashcards:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
