import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

// GET - Buscar conversas do usuário
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const conversa_id = searchParams.get('conversa_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Se tem conversa_id, buscar mensagens dessa conversa
    if (conversa_id) {
      const { data: mensagens, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('conversa_id', conversa_id)
        .order('created_at', { ascending: true })

      if (error) throw error

      return NextResponse.json({ mensagens: mensagens || [] })
    }

    // Senão, buscar todas as conversas do usuário
    const { data: conversas, error } = await supabase
      .from('chat_conversas')
      .select('*')
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ conversas: conversas || [] })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Enviar mensagem e receber resposta da IA
export async function POST(req: NextRequest) {
  try {
    const { user_id, conversa_id, mensagem } = await req.json()

    if (!user_id || !mensagem) {
      return NextResponse.json({ error: 'user_id e mensagem são obrigatórios' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
    }

    // Verificar limite diário
    const hoje = new Date().toISOString().split('T')[0]

    // Buscar plano do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', user_id)
      .single()

    const planoNome = profile?.plano?.toUpperCase() === 'ESTUDA_PRO' ? 'ESTUDA_PRO' : 'FREE'

    // Buscar limites
    const { data: plano } = await supabase
      .from('planos')
      .select('limite_chat_mensagens_dia')
      .eq('nome', planoNome)
      .single()

    const limiteMensagens = plano?.limite_chat_mensagens_dia || 10

    // Verificar uso de hoje
    const { data: usoHoje } = await supabase
      .from('uso_diario')
      .select('quantidade')
      .eq('user_id', user_id)
      .eq('data', hoje)
      .eq('tipo', 'chat_mensagens')
      .maybeSingle()

    const usadoHoje = usoHoje?.quantidade || 0

    if (limiteMensagens !== -1 && usadoHoje >= limiteMensagens) {
      return NextResponse.json({
        error: 'Limite diário de mensagens atingido',
        limite: limiteMensagens,
        usado: usadoHoje
      }, { status: 429 })
    }

    let conversaAtual = conversa_id

    // Se não tem conversa, criar uma nova
    if (!conversaAtual) {
      // Gerar título baseado na mensagem
      const titulo = mensagem.length > 50 ? mensagem.substring(0, 50) + '...' : mensagem

      const { data: novaConversa, error: errConv } = await supabase
        .from('chat_conversas')
        .insert({
          user_id,
          titulo,
          contexto: null
        })
        .select('id')
        .single()

      if (errConv) throw errConv
      conversaAtual = novaConversa.id
    }

    // Salvar mensagem do usuário
    const { error: errMsgUser } = await supabase
      .from('chat_mensagens')
      .insert({
        conversa_id: conversaAtual,
        role: 'user',
        content: mensagem
      })

    if (errMsgUser) throw errMsgUser

    // Buscar histórico da conversa para contexto
    const { data: historico } = await supabase
      .from('chat_mensagens')
      .select('role, content')
      .eq('conversa_id', conversaAtual)
      .order('created_at', { ascending: true })
      .limit(20) // Últimas 20 mensagens para contexto

    // Montar contexto para o Gemini
    const historicoFormatado = (historico || []).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))

    // Prompt de sistema
    const systemPrompt = `Você é um assistente de estudos especializado em concursos públicos brasileiros.
Suas principais características:
- Responda de forma clara, didática e objetiva
- Use exemplos práticos quando possível
- Cite fontes legais quando relevante (leis, artigos, súmulas)
- Se não souber algo, admita e sugira onde o usuário pode encontrar a informação
- Mantenha o foco em ajudar o usuário a aprender e memorizar o conteúdo
- Use formatação markdown para organizar as respostas (listas, negrito, etc)
- Seja amigável mas profissional`

    // Chamar Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Entendido! Estou pronto para ajudar com seus estudos para concursos. Como posso ajudar?' }] },
            ...historicoFormatado
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    )

    if (!response.ok) {
      const errData = await response.json()
      console.error('Erro Gemini:', errData)
      return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 })
    }

    const data = await response.json()
    const respostaIA = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui processar sua mensagem.'

    // Salvar resposta da IA
    const { data: msgIA, error: errMsgIA } = await supabase
      .from('chat_mensagens')
      .insert({
        conversa_id: conversaAtual,
        role: 'assistant',
        content: respostaIA
      })
      .select()
      .single()

    if (errMsgIA) throw errMsgIA

    // Atualizar updated_at da conversa
    await supabase
      .from('chat_conversas')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversaAtual)

    // Registrar uso diário
    if (usoHoje) {
      await supabase
        .from('uso_diario')
        .update({ quantidade: usadoHoje + 1 })
        .eq('user_id', user_id)
        .eq('data', hoje)
        .eq('tipo', 'chat_mensagens')
    } else {
      await supabase
        .from('uso_diario')
        .insert({
          user_id,
          data: hoje,
          tipo: 'chat_mensagens',
          quantidade: 1
        })
    }

    return NextResponse.json({
      success: true,
      conversa_id: conversaAtual,
      resposta: respostaIA,
      mensagem_id: msgIA.id
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Deletar conversa
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const conversa_id = searchParams.get('conversa_id')
    const user_id = searchParams.get('user_id')

    if (!conversa_id || !user_id) {
      return NextResponse.json({ error: 'conversa_id e user_id são obrigatórios' }, { status: 400 })
    }

    // Deletar mensagens primeiro
    await supabase
      .from('chat_mensagens')
      .delete()
      .eq('conversa_id', conversa_id)

    // Deletar conversa
    const { error } = await supabase
      .from('chat_conversas')
      .delete()
      .eq('id', conversa_id)
      .eq('user_id', user_id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
