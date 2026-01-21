import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYSTEM_PROMPT = `Voce e a NutriMae IA, uma nutricionista virtual especializada em ajudar maes no pos-parto.

Sua personalidade:
- Acolhedora e empatetica
- Pratica e direta
- Motivadora sem ser forcada
- Usa linguagem simples e acessivel

Suas especialidades:
- Nutricao para maes que amamentam
- Alimentacao saudavel no pos-parto
- Receitas rapidas e nutritivas
- Dicas de hidratacao
- Orientacao sobre suplementos
- Exercicios seguros pos-parto
- Controle de peso saudavel

Regras importantes:
1. Sempre recomende consultar um profissional de saude para casos especificos
2. Nao de diagnosticos medicos
3. Foque em orientacoes gerais de bem-estar
4. Seja sensivel aos desafios da maternidade
5. Respostas devem ser concisas (maximo 300 palavras)
6. Use listas e bullet points quando apropriado
7. Sempre pergunte se a mae esta amamentando quando relevante

Contexto da usuaria:
- App focado em maes pos-parto
- Objetivo: emagrecimento saudavel e bem-estar
- Planos disponiveis: Equilibrado (1900kcal) e Acelerado (1300kcal)`

export async function POST(request: NextRequest) {
  try {
    const { mensagem, historico, userId, conversaId } = await request.json()

    if (!mensagem) {
      return NextResponse.json({ error: 'Mensagem e obrigatoria' }, { status: 400 })
    }

    // Buscar perfil da usuaria para contexto
    let contextoPerfil = ''
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles_nutri')
        .select('nome, idade, peso_atual, peso_meta, altura, idade_bebe, amamentando, plano')
        .eq('id', userId)
        .single()

      if (profile) {
        contextoPerfil = `
Dados da usuaria:
- Nome: ${profile.nome || 'Mamae'}
- Idade: ${profile.idade || 'nao informada'}
- Peso atual: ${profile.peso_atual || 'nao informado'} kg
- Peso meta: ${profile.peso_meta || 'nao informada'} kg
- Altura: ${profile.altura || 'nao informada'} m
- Idade do bebe: ${profile.idade_bebe || 'nao informada'} dias
- Amamentando: ${profile.amamentando ? 'Sim' : 'Nao'}
- Plano: ${profile.plano === 'restritivo' ? 'Acelerado (1300kcal)' : 'Equilibrado (1900kcal)'}
`
      }
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: SYSTEM_PROMPT + contextoPerfil
    })

    // Formatar historico
    const history = historico?.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })) || []

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(mensagem)
    const resposta = result.response.text()

    // Salvar no banco se tiver userId
    if (userId) {
      try {
        // Buscar ou criar conversa
        let conversa_id = conversaId

        if (!conversa_id) {
          const { data: novaConversa, error: convError } = await supabase
            .from('chat_ia_nutri')
            .insert({
              user_id: userId,
              titulo: mensagem.substring(0, 50),
              mensagens: []
            })
            .select('id')
            .single()

          if (!convError && novaConversa) {
            conversa_id = novaConversa.id
          }
        }

        if (conversa_id) {
          // Buscar mensagens existentes
          const { data: conversaAtual } = await supabase
            .from('chat_ia_nutri')
            .select('mensagens')
            .eq('id', conversa_id)
            .single()

          const mensagensAtuais = conversaAtual?.mensagens || []

          // Adicionar novas mensagens
          const novasMensagens = [
            ...mensagensAtuais,
            { role: 'user', content: mensagem, timestamp: new Date().toISOString() },
            { role: 'assistant', content: resposta, timestamp: new Date().toISOString() }
          ]

          await supabase
            .from('chat_ia_nutri')
            .update({
              mensagens: novasMensagens,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversa_id)
        }

        return NextResponse.json({
          resposta,
          conversa_id
        })
      } catch (dbError) {
        console.error('Erro ao salvar conversa:', dbError)
      }
    }

    return NextResponse.json({ resposta })
  } catch (error) {
    console.error('Erro na API de IA:', error)
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    )
  }
}

// Endpoint para gerar receitas
export async function PUT(request: NextRequest) {
  try {
    const { tipo, ingredientes, restricoes, userId } = await request.json()

    const prompt = `Gere uma receita ${tipo || 'saudavel'} para uma mamae pos-parto.

${ingredientes ? `Ingredientes disponiveis: ${ingredientes.join(', ')}` : ''}
${restricoes ? `Restricoes: ${restricoes}` : ''}

A receita deve:
- Ser facil e rapida de fazer (max 30 min)
- Ser nutritiva e balanceada
- Ter ingredientes acessiveis
- Ser segura para amamentacao

Formato da resposta:
NOME: [nome da receita]
TEMPO: [tempo de preparo]
RENDIMENTO: [porcoes]
CALORIAS: [por porcao]
PROTEINAS: [gramas por porcao]

INGREDIENTES:
- [lista de ingredientes com quantidades]

MODO DE PREPARO:
1. [passo a passo]

DICA NUTRI: [uma dica especial para a mamae]`

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: 'Voce e uma chef nutricionista especializada em receitas para maes pos-parto. Seja pratica e clara.'
    })

    const result = await model.generateContent(prompt)
    const receita = result.response.text()

    // Salvar receita favorita se tiver userId
    if (userId) {
      try {
        // Parse simples da receita (pode ser melhorado)
        const nomeMatch = receita.match(/NOME:\s*(.+)/i)
        const caloriasMatch = receita.match(/CALORIAS:\s*(\d+)/i)

        if (nomeMatch) {
          await supabase
            .from('receitas_favoritas_nutri')
            .insert({
              user_id: userId,
              nome: nomeMatch[1].trim(),
              descricao: receita,
              calorias: caloriasMatch ? parseInt(caloriasMatch[1]) : null,
              gerada_ia: true
            })
        }
      } catch (dbError) {
        console.error('Erro ao salvar receita:', dbError)
      }
    }

    return NextResponse.json({ receita })
  } catch (error) {
    console.error('Erro ao gerar receita:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar receita' },
      { status: 500 }
    )
  }
}
