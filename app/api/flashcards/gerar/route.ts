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

    if (limiteFlashcards !== -1 && (totalFlashcards || 0) + qtd > limiteFlashcards) {
      return NextResponse.json({
        error: 'Limite de flashcards atingido',
        limite: limiteFlashcards,
        atual: totalFlashcards,
        disponivel: limiteFlashcards - (totalFlashcards || 0)
      }, { status: 429 })
    }

    // Construir prompt para o Gemini
    let topico = disciplina || 'tema geral'
    if (assunto) topico += ` - ${assunto}`
    if (subassunto) topico += ` - ${subassunto}`

    const nivelDificuldade = dificuldade === 'facil' ? 'basico, para iniciantes' :
                            dificuldade === 'dificil' ? 'avancado, para estudantes experientes' :
                            'intermediario'

    const prompt = `Voce e um especialista em criar flashcards educacionais para concursos publicos e vestibulares.

Gere exatamente ${qtd} flashcards sobre o topico: "${topico}"

Nivel de dificuldade: ${nivelDificuldade}

Instrucoes:
1. Cada flashcard deve ter uma pergunta (frente) e resposta (verso)
2. As perguntas devem ser claras e objetivas
3. As respostas devem ser concisas mas completas
4. Use linguagem formal e tecnica quando apropriado
5. Varie os tipos de perguntas (definicao, conceito, aplicacao, comparacao)
6. Evite perguntas muito longas ou respostas excessivamente complexas

IMPORTANTE: Retorne APENAS um array JSON valido, sem markdown, sem explicacoes, no formato:
[{"frente":"pergunta aqui","verso":"resposta aqui"}]

Retorne APENAS o JSON, nada mais.`

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
      .slice(0, qtd)
      .map(f => ({
        deck_id,
        user_id,
        frente: f.frente.trim(),
        verso: f.verso.trim(),
        dificuldade: dificuldade || 'medio',
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
