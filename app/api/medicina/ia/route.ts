import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// POST - Fazer pergunta para IA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, mensagem, contexto, tipo } = body

    if (!userId || !mensagem) {
      return NextResponse.json(
        { error: 'userId e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar limite de perguntas
    const mesRef = new Date().toISOString().slice(0, 7)
    const { data: limiteData } = await getSupabaseAdmin()
      .from('limites_uso_med')
      .select('perguntas_ia_mes')
      .eq('user_id', userId)
      .eq('mes_referencia', mesRef)
      .single()

    const { data: profile } = await getSupabaseAdmin()
      .from('profiles_med')
      .select('plano')
      .eq('id', userId)
      .single()

    const plano = profile?.plano || 'gratuito'
    const limites: Record<string, number> = {
      gratuito: 0,
      premium: 100,
      residencia: -1
    }

    const limite = limites[plano]
    const usadas = limiteData?.perguntas_ia_mes || 0

    if (limite === 0) {
      return NextResponse.json(
        { error: 'Seu plano não inclui acesso à IA Tutora. Faça upgrade para acessar.' },
        { status: 403 }
      )
    }

    if (limite !== -1 && usadas >= limite) {
      return NextResponse.json(
        { error: 'Limite de perguntas do mês atingido' },
        { status: 403 }
      )
    }

    // Construir prompt baseado no tipo
    let systemPrompt = `Você é um tutor de medicina especializado em preparação para provas de residência médica no Brasil.
Você deve:
- Responder de forma clara, didática e precisa
- Usar terminologia médica apropriada
- Dar exemplos práticos quando possível
- Ser conciso mas completo

⚠️ REGRA OBRIGATÓRIA - REFERÊNCIAS BIBLIOGRÁFICAS:
TODA resposta DEVE terminar com a seção "📚 Referências:" contendo:
- Fontes em formato ABNT
- Cada fonte deve indicar o assunto específico que fundamenta

Formato ABNT:
SOBRENOME, N. A. **Título do Livro.** X. ed. Cidade: Editora, Ano. Cap. X. *(Assunto específico)*

Exemplo:
📚 **Referências:**
- HALL, J. E. **Guyton e Hall - Tratado de Fisiologia Médica.** 14. ed. Rio de Janeiro: Elsevier, 2021. Cap. 26. *(Fisiologia cardíaca)*
- KUMAR, V. et al. **Robbins & Cotran - Bases Patológicas das Doenças.** 10. ed. Rio de Janeiro: Elsevier, 2021. Cap. 12. *(Patologia cardiovascular)*

Livros de referência por área:
- Fisiologia: Guyton
- Anatomia: Moore, Netter, Sobotta
- Patologia: Robbins, Bogliolo
- Histologia: Junqueira
- Farmacologia: Rang & Dale, Goodman
- Clínica Médica: Harrison
- Imunologia: Abbas
- Microbiologia: Jawetz
- Semiologia: Porto
- Pediatria: Nelson
- Obstetrícia: Williams
- Cirurgia: Sabiston

Mantenha um tom profissional mas acessível.`

    if (tipo === 'explicar_questao') {
      systemPrompt += `

Você está explicando uma questão de prova. Analise cada alternativa, explique por que a correta está certa e por que as outras estão erradas.`
    } else if (tipo === 'resumir') {
      systemPrompt += `

Você está criando um resumo para estudo. Seja objetivo, destaque os pontos principais e crie uma estrutura fácil de memorizar.`
    } else if (tipo === 'flashcards') {
      systemPrompt += `

Você está criando flashcards para revisão. Crie perguntas diretas na frente e respostas concisas no verso.
Retorne no formato JSON: { "flashcards": [{ "frente": "pergunta", "verso": "resposta" }] }`
    }

    // Fazer chamada para Gemini
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' })

    const fullPrompt = contexto
      ? `${systemPrompt}\n\nContexto: ${contexto}\n\nPergunta do usuário: ${mensagem}`
      : `${systemPrompt}\n\nPergunta do usuário: ${mensagem}`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const resposta = response.text() || 'Desculpe, não consegui gerar uma resposta.'

    // Salvar no histórico
    await getSupabaseAdmin()
      .from('chat_ia_med')
      .insert({
        user_id: userId,
        mensagem_usuario: mensagem,
        resposta_ia: resposta,
        contexto: contexto ? { tipo, dados: contexto } : null
      })

    // Atualizar contador
    await getSupabaseAdmin()
      .from('limites_uso_med')
      .upsert({
        user_id: userId,
        mes_referencia: mesRef,
        perguntas_ia_mes: usadas + 1
      }, {
        onConflict: 'user_id,mes_referencia'
      })

    // Atualizar estudo diário
    const hoje = new Date().toISOString().split('T')[0]
    const { data: estudoHoje } = await getSupabaseAdmin()
      .from('estudo_diario_med')
      .select('*')
      .eq('user_id', userId)
      .eq('data', hoje)
      .single()

    if (estudoHoje) {
      await getSupabaseAdmin()
        .from('estudo_diario_med')
        .update({ perguntas_ia: estudoHoje.perguntas_ia + 1 })
        .eq('id', estudoHoje.id)
    } else {
      await getSupabaseAdmin()
        .from('estudo_diario_med')
        .insert({ user_id: userId, data: hoje, perguntas_ia: 1 })
    }

    return NextResponse.json({
      resposta,
      perguntasRestantes: limite === -1 ? -1 : limite - usadas - 1
    })

  } catch (error) {
    console.error('Erro na IA:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pergunta' },
      { status: 500 }
    )
  }
}

// GET - Buscar histórico de conversas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const { data: historico, error } = await getSupabaseAdmin()
      .from('chat_ia_med')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ historico: historico || [] })

  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar histórico' },
      { status: 500 }
    )
  }
}
