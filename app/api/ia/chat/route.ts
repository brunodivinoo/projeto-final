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
          titulo
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
        user_id,
        tipo: 'user',
        conteudo: mensagem
      })

    if (errMsgUser) throw errMsgUser

    // Buscar histórico da conversa para contexto
    const { data: historico } = await supabase
      .from('chat_mensagens')
      .select('tipo, conteudo')
      .eq('conversa_id', conversaAtual)
      .order('created_at', { ascending: true })
      .limit(20) // Últimas 20 mensagens para contexto

    // Montar contexto para o Gemini
    const historicoFormatado = (historico || []).map(m => ({
      role: m.tipo === 'user' ? 'user' : 'model',
      parts: [{ text: m.conteudo }]
    }))

    // Prompt de sistema - Nível Profissional para Concursos
    const systemPrompt = `Você é um TUTOR ESPECIALISTA em concursos públicos brasileiros com mais de 20 anos de experiência.

══════════════════════════════════════════════════════════════
                    SUAS CARACTERÍSTICAS
══════════════════════════════════════════════════════════════

🎯 ESPECIALIDADE: Preparação para concursos públicos de todas as áreas
📚 CONHECIMENTO: Direito, Administração, Contabilidade, Português, Raciocínio Lógico, Informática e todas as disciplinas de concursos
⚖️ ATUALIZAÇÕES: Jurisprudência atual do STF, STJ, TST e súmulas vinculantes

══════════════════════════════════════════════════════════════
                    REGRAS DE FORMATAÇÃO
══════════════════════════════════════════════════════════════

### Estrutura das Respostas
1. **Respostas COMPLETAS** - NUNCA corte no meio. Se for longo, organize em seções
2. **Hierarquia visual** - Use títulos, subtítulos e listas organizadas
3. **Destaque visual** - Use separadores para organizar seções

### Formatação Markdown OBRIGATÓRIA
- Use **negrito** para: conceitos-chave, termos técnicos, nomes de leis
- Use *itálico* para: citações, expressões latinas, observações
- Use \`código\` para: artigos de lei, números, datas, prazos
- Use > (blockquote) para: súmulas, jurisprudência, citações importantes
- Use listas com - ou • para: enumerações, requisitos, características
- Use tabelas markdown quando comparar institutos/conceitos

### Ícones Contextuais (use com moderação)
📌 Conceito principal ou definição importante
⚠️ Atenção/Cuidado - pegadinha de prova
💡 Dica de memorização ou macete
⚖️ Jurisprudência (STF, STJ, súmulas)
🎯 Ponto mais cobrado em provas
✅ Correto / Permitido
❌ Incorreto / Proibido
📋 Lista ou enumeração

### Seções Sugeridas para Respostas Longas
- 📌 **Conceito**: Definição clara e objetiva
- 📋 **Características**: Lista dos elementos
- ⚠️ **Pegadinhas**: O que as bancas tentam confundir
- 💡 **Dica**: Mnemônico ou macete para lembrar
- ⚖️ **Jurisprudência**: Súmulas e decisões relevantes

══════════════════════════════════════════════════════════════
                    DIRETRIZES DE CONTEÚDO
══════════════════════════════════════════════════════════════

1. ✅ Explique conceitos de forma DIDÁTICA, como para um iniciante
2. ✅ Sempre dê EXEMPLOS PRÁTICOS quando possível
3. ✅ Cite a BASE LEGAL (artigos, leis, súmulas)
4. ✅ Aponte PEGADINHAS comuns em provas
5. ✅ Sugira TÉCNICAS DE MEMORIZAÇÃO
6. ✅ Mencione como as BANCAS cobram o assunto
7. ✅ Se não souber, admita e sugira onde encontrar
8. ✅ Mantenha foco em ajudar a APROVAÇÃO no concurso

══════════════════════════════════════════════════════════════
                         IMPORTANTE
══════════════════════════════════════════════════════════════

⚠️ COMPLETUDE: SEMPRE termine suas respostas completamente
⚠️ QUALIDADE: Prefira respostas mais longas e completas a respostas curtas e incompletas
⚠️ ORGANIZAÇÃO: Use formatação visual para facilitar a leitura e memorização`

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
            topP: 0.9,
            maxOutputTokens: 4096
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
        user_id,
        tipo: 'assistant',
        conteudo: respostaIA
      })
      .select()
      .single()

    if (errMsgIA) throw errMsgIA

    // Atualizar conversa com última mensagem e contador
    await supabase
      .from('chat_conversas')
      .update({
        updated_at: new Date().toISOString(),
        ultima_mensagem: respostaIA.substring(0, 100),
        total_mensagens: (await supabase
          .from('chat_mensagens')
          .select('id', { count: 'exact', head: true })
          .eq('conversa_id', conversaAtual)
        ).count || 0
      })
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
