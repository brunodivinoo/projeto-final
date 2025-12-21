import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

// GET - Buscar resumos do usuário
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const resumo_id = searchParams.get('resumo_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (resumo_id) {
      const { data: resumo, error } = await supabase
        .from('resumos_ia')
        .select('*')
        .eq('id', resumo_id)
        .eq('user_id', user_id)
        .single()

      if (error) throw error
      return NextResponse.json({ resumo })
    }

    const { data: resumos, error } = await supabase
      .from('resumos_ia')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ resumos: resumos || [] })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Gerar resumo
export async function POST(req: NextRequest) {
  try {
    const { user_id, texto, titulo, disciplina, assunto, formato } = await req.json()

    if (!user_id || !texto) {
      return NextResponse.json({ error: 'user_id e texto são obrigatórios' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
    }

    // Verificar limite mensal
    const primeiroDiaMes = new Date()
    primeiroDiaMes.setDate(1)
    const mesRef = primeiroDiaMes.toISOString().split('T')[0]

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
      .select('limite_resumos_mes')
      .eq('nome', planoNome)
      .single()

    const limiteResumos = plano?.limite_resumos_mes || 5

    // Verificar uso do mês
    const { data: usoMes } = await supabase
      .from('uso_mensal')
      .select('quantidade')
      .eq('user_id', user_id)
      .eq('mes_referencia', mesRef)
      .eq('tipo', 'resumos')
      .maybeSingle()

    const usadoMes = usoMes?.quantidade || 0

    if (limiteResumos !== -1 && usadoMes >= limiteResumos) {
      return NextResponse.json({
        error: 'Limite mensal de resumos atingido',
        limite: limiteResumos,
        usado: usadoMes
      }, { status: 429 })
    }

    // Determinar formato do resumo com instruções detalhadas e diferenciadas
    const formatoConfig: Record<string, { instrucao: string; exemplo: string }> = {
      topicos: {
        instrucao: `Crie um resumo em TÓPICOS hierárquicos bem organizados.

ESTRUTURA OBRIGATÓRIA:
• Use marcadores (•, ◦, ▪) para diferentes níveis de hierarquia
• Nível 1: Conceitos principais (•)
• Nível 2: Detalhamentos (◦)
• Nível 3: Exemplos/exceções (▪)
• Agrupe por temas relacionados
• Máximo 3 níveis de profundidade
• Cada tópico deve ser autossuficiente para revisão rápida`,
        exemplo: `📚 TÍTULO DO TEMA

• **Conceito Principal 1**
  ◦ Definição clara e objetiva
  ◦ Características essenciais
    ▪ Exemplo prático
    ▪ Exceção importante
  ◦ Consequências jurídicas

• **Conceito Principal 2**
  ◦ Elementos constitutivos
  ◦ Diferença para conceitos similares

💡 DICA DE PROVA: [macete ou ponto mais cobrado]

⚠️ ATENÇÃO: [pegadinha comum em provas]`
      },
      mapa_mental: {
        instrucao: `Crie um MAPA MENTAL textual com estrutura visual clara usando caracteres ASCII.

ESTRUTURA OBRIGATÓRIA:
• Centro: Conceito principal em destaque
• Ramificações: Use caracteres ├── │ └── para criar árvore visual
• Cada ramo principal deve ter 2-4 sub-ramos
• Use emojis temáticos para identificar categorias
• Inclua conexões entre conceitos quando relevante
• Formato ideal para memorização visual`,
        exemplo: `                    ┌─────────────────────┐
                    │   📌 TEMA CENTRAL   │
                    └──────────┬──────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ 📗 CONCEITO 1│      │ 📘 CONCEITO 2│      │ 📙 CONCEITO 3│
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
   ├── Elemento A        ├── Tipo X            ├── Fase 1
   ├── Elemento B        ├── Tipo Y            ├── Fase 2
   └── Elemento C        └── Tipo Z            └── Fase 3

🔗 CONEXÕES IMPORTANTES:
Conceito 1 + Conceito 2 = [resultado]
Conceito 3 depende de → Conceito 1`
      },
      fichamento: {
        instrucao: `Crie um FICHAMENTO acadêmico completo e estruturado.

ESTRUTURA OBRIGATÓRIA:
• REFERÊNCIA: Identificação do conteúdo
• PALAVRAS-CHAVE: 5-8 termos principais
• CITAÇÕES: Trechos importantes entre aspas com análise
• CONCEITOS: Definições técnicas extraídas
• COMENTÁRIOS: Análise crítica e conexões
• QUESTÕES: Pontos que podem cair em prova
• RESUMO FINAL: Síntese em 2-3 frases`,
        exemplo: `═══════════════════════════════════════════════════════
                    📋 FICHAMENTO
═══════════════════════════════════════════════════════

📌 REFERÊNCIA
Tema: [nome do tema]
Área: [disciplina/assunto]

🏷️ PALAVRAS-CHAVE
#termo1 #termo2 #termo3 #termo4 #termo5

───────────────────────────────────────────────────────
📝 CITAÇÕES E ANÁLISES
───────────────────────────────────────────────────────

[1] "Trecho literal importante do texto"
    ➤ Análise: Explicação do significado e relevância
    ➤ Aplicação: Como isso aparece em provas

[2] "Outro trecho relevante"
    ➤ Análise: Comentário crítico
    ➤ Conexão: Relação com outros temas

───────────────────────────────────────────────────────
📖 CONCEITOS EXTRAÍDOS
───────────────────────────────────────────────────────

• **Termo 1**: Definição técnica completa
• **Termo 2**: Definição técnica completa

───────────────────────────────────────────────────────
💭 COMENTÁRIOS CRÍTICOS
───────────────────────────────────────────────────────

[Análise pessoal sobre pontos importantes, contradições,
evolução do entendimento, posições doutrinárias]

───────────────────────────────────────────────────────
❓ QUESTÕES PARA REVISÃO
───────────────────────────────────────────────────────

1. [Pergunta que pode cair em prova]
2. [Outra pergunta relevante]

───────────────────────────────────────────────────────
✅ RESUMO FINAL
───────────────────────────────────────────────────────

[Síntese de 2-3 frases do conteúdo principal]`
      },
      esquema: {
        instrucao: `Crie um ESQUEMA visual usando tabelas, quadros e diagramas em texto.

ESTRUTURA OBRIGATÓRIA:
• Use tabelas ASCII para comparações
• Crie quadros para classificações
• Use setas e símbolos para fluxos
• Organize visualmente para memorização
• Ideal para comparar conceitos similares
• Inclua legendas quando necessário`,
        exemplo: `╔══════════════════════════════════════════════════════════╗
║                    📊 TÍTULO DO ESQUEMA                   ║
╚══════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────┐
│                   CLASSIFICAÇÃO GERAL                    │
├─────────────────────┬─────────────────┬─────────────────┤
│      TIPO A         │      TIPO B     │      TIPO C     │
├─────────────────────┼─────────────────┼─────────────────┤
│ • Característica 1  │ • Caract. 1     │ • Caract. 1     │
│ • Característica 2  │ • Caract. 2     │ • Caract. 2     │
│ • Característica 3  │ • Caract. 3     │ • Caract. 3     │
└─────────────────────┴─────────────────┴─────────────────┘

═══════════════════════════════════════════════════════════
                    QUADRO COMPARATIVO
═══════════════════════════════════════════════════════════

┌──────────────┬────────────────────┬────────────────────┐
│   ASPECTO    │     INSTITUTO A    │     INSTITUTO B    │
├──────────────┼────────────────────┼────────────────────┤
│ Definição    │ [definição]        │ [definição]        │
├──────────────┼────────────────────┼────────────────────┤
│ Requisitos   │ [requisitos]       │ [requisitos]       │
├──────────────┼────────────────────┼────────────────────┤
│ Efeitos      │ [efeitos]          │ [efeitos]          │
├──────────────┼────────────────────┼────────────────────┤
│ Prazo        │ [prazo]            │ [prazo]            │
└──────────────┴────────────────────┴────────────────────┘

═══════════════════════════════════════════════════════════
                    FLUXO / PROCESSO
═══════════════════════════════════════════════════════════

   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ ETAPA 1 │ ───▶ │ ETAPA 2 │ ───▶ │ ETAPA 3 │
   └─────────┘      └─────────┘      └─────────┘
        │                                  │
        ▼                                  ▼
   [resultado 1]                    [resultado final]

═══════════════════════════════════════════════════════════

🔑 LEGENDA:
✓ = Aplicável  |  ✗ = Não aplicável  |  ◐ = Parcial`
      }
    }

    const config = formatoConfig[formato || 'topicos'] || formatoConfig.topicos

    const prompt = `Você é um especialista em criar materiais de estudo para concursos públicos brasileiros.

══════════════════════════════════════════════════════════════
                         TEXTO ORIGINAL
══════════════════════════════════════════════════════════════
${texto}

══════════════════════════════════════════════════════════════
                         CONFIGURAÇÕES
══════════════════════════════════════════════════════════════
${disciplina ? `📚 DISCIPLINA: ${disciplina}` : ''}
${assunto ? `📖 ASSUNTO: ${assunto}` : ''}
📋 FORMATO: ${formato || 'topicos'}

══════════════════════════════════════════════════════════════
                    INSTRUÇÕES DO FORMATO
══════════════════════════════════════════════════════════════
${config.instrucao}

══════════════════════════════════════════════════════════════
                    EXEMPLO DE ESTRUTURA
══════════════════════════════════════════════════════════════
${config.exemplo}

══════════════════════════════════════════════════════════════
                      REGRAS OBRIGATÓRIAS
══════════════════════════════════════════════════════════════
1. SIGA EXATAMENTE a estrutura do exemplo acima
2. Extraia os pontos MAIS IMPORTANTES para concursos
3. Use linguagem TÉCNICA e PRECISA
4. Destaque termos-chave em **negrito**
5. Inclua DICAS DE MEMORIZAÇÃO (macetes, mnemonicos)
6. Mencione SÚMULAS e JURISPRUDÊNCIA relevantes
7. Aponte PEGADINHAS comuns em provas
8. Mantenha o resumo COMPLETO mas OBJETIVO
9. Use os MESMOS símbolos e formatação do exemplo
10. Adapte o conteúdo ao formato solicitado

GERE O RESUMO NO FORMATO ${formato?.toUpperCase() || 'TÓPICOS'}:`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 4096
          }
        })
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao gerar resumo' }, { status: 500 })
    }

    const data = await response.json()
    const conteudoResumo = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!conteudoResumo) {
      return NextResponse.json({ error: 'Não foi possível gerar o resumo' }, { status: 500 })
    }

    // Gerar título se não fornecido
    let tituloFinal = titulo
    if (!tituloFinal) {
      const tituloPrompt = `Baseado no seguinte resumo, gere um título curto (máximo 60 caracteres):
${conteudoResumo.substring(0, 500)}

Retorne APENAS o título, sem aspas ou explicações.`

      const tituloRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: tituloPrompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 100 }
          })
        }
      )

      if (tituloRes.ok) {
        const tituloData = await tituloRes.json()
        tituloFinal = tituloData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Resumo sem título'
      } else {
        tituloFinal = 'Resumo sem título'
      }
    }

    // Salvar resumo
    const { data: resumo, error: errInsert } = await supabase
      .from('resumos_ia')
      .insert({
        user_id,
        titulo: tituloFinal.substring(0, 100),
        resumo: conteudoResumo,
        conteudo_original: texto.substring(0, 10000),
        disciplina: disciplina || null,
        assunto: assunto || null
      })
      .select()
      .single()

    if (errInsert) throw errInsert

    // Registrar uso mensal
    if (usoMes) {
      await supabase
        .from('uso_mensal')
        .update({ quantidade: usadoMes + 1 })
        .eq('user_id', user_id)
        .eq('mes_referencia', mesRef)
        .eq('tipo', 'resumos')
    } else {
      await supabase
        .from('uso_mensal')
        .insert({
          user_id,
          mes_referencia: mesRef,
          tipo: 'resumos',
          quantidade: 1
        })
    }

    // Registrar atividade
    await supabase
      .from('historico_atividades')
      .insert({
        user_id,
        tipo: 'resumo_gerado',
        descricao: `Gerou resumo: ${tituloFinal}`,
        detalhes: { resumo_id: resumo.id, formato }
      })

    return NextResponse.json({
      success: true,
      resumo,
      restante: limiteResumos === -1 ? -1 : limiteResumos - usadoMes - 1
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Deletar resumo
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const resumo_id = searchParams.get('resumo_id')
    const user_id = searchParams.get('user_id')

    if (!resumo_id || !user_id) {
      return NextResponse.json({ error: 'resumo_id e user_id são obrigatórios' }, { status: 400 })
    }

    const { error } = await supabase
      .from('resumos_ia')
      .delete()
      .eq('id', resumo_id)
      .eq('user_id', user_id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
