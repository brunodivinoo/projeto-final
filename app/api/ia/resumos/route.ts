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

    // Determinar formato do resumo com instruções detalhadas e diferenciadas - NÍVEL PROFISSIONAL
    const formatoConfig: Record<string, { instrucao: string; exemplo: string }> = {
      topicos: {
        instrucao: `Crie um resumo em TÓPICOS hierárquicos de NÍVEL PROFISSIONAL para concursos públicos.

REGRAS DE ESTRUTURA:
• Use exatamente a formatação visual do exemplo
• Caixas com bordas ASCII para cada seção
• Hierarquia com símbolos: ▸ (principal) → (sub) • (detalhe)
• Seções OBRIGATÓRIAS: Pontos-Chave, Pegadinhas de Prova, Dicas de Memorização, Jurisprudência
• Formato clean e espaçado para fácil leitura
• Destaque termos importantes em **negrito**`,
        exemplo: `═══════════════════════════════════════════════════════════════
                         📚 [TÍTULO DO TEMA]
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│  📌 PONTOS-CHAVE                                            │
└─────────────────────────────────────────────────────────────┘

  ▸ **Conceito Principal 1**
    → Definição clara e objetiva do conceito
    → Elementos constitutivos essenciais
      • Primeiro elemento ou requisito
      • Segundo elemento ou requisito
      • Terceiro elemento ou requisito
    → Natureza jurídica: [classificação]

  ▸ **Conceito Principal 2**
    → Explicação detalhada
    → Diferenças para institutos similares
      • Ponto distintivo 1
      • Ponto distintivo 2

  ▸ **Conceito Principal 3**
    → Hipóteses de aplicação
    → Consequências jurídicas
      • Efeito 1
      • Efeito 2

┌─────────────────────────────────────────────────────────────┐
│  ⚠️ PEGADINHAS DE PROVA                                     │
└─────────────────────────────────────────────────────────────┘

  ⚡ As bancas costumam trocar [X] por [Y] - CUIDADO!
  ⚡ Não confundir [conceito A] com [conceito B]
  ⚡ O prazo é de [X] dias, NÃO [Y] dias

┌─────────────────────────────────────────────────────────────┐
│  💡 DICAS DE MEMORIZAÇÃO                                    │
└─────────────────────────────────────────────────────────────┘

  🧠 Mnemônico: [SIGLA ou frase para memorizar]
  📝 Macete: [associação para lembrar]
  🎯 Ponto mais cobrado: [tema frequente em provas]

┌─────────────────────────────────────────────────────────────┐
│  ⚖️ JURISPRUDÊNCIA RELEVANTE                                │
└─────────────────────────────────────────────────────────────┘

  📜 STF: [Súmula ou decisão importante]
  📜 STJ: [Súmula ou entendimento consolidado]
  📜 Tema: [Número do tema de repercussão geral se houver]`
      },
      mapa_mental: {
        instrucao: `Crie um MAPA MENTAL textual PROFISSIONAL com estrutura visual clara usando caracteres ASCII.

REGRAS DE ESTRUTURA:
• Caixa central destacada com o tema principal
• Ramificações visuais usando ─, │, ├, └, ┌, ┐
• Máximo 4 ramos principais
• Cada ramo com 3-5 sub-itens
• Seção de CONEXÕES mostrando relações entre conceitos
• Seção de PALAVRAS-CHAVE com hashtags
• Use emojis para identificar categorias`,
        exemplo: `═══════════════════════════════════════════════════════════════
                         🧠 MAPA MENTAL
═══════════════════════════════════════════════════════════════

                    ╔═══════════════════════╗
                    ║    📌 TEMA CENTRAL    ║
                    ║   [Nome do Conceito]  ║
                    ╚═══════════╤═══════════╝
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  📗 ASPECTO 1 │      │  📘 ASPECTO 2 │      │  📙 ASPECTO 3 │
│   [Título]    │      │   [Título]    │      │   [Título]    │
└───────┬───────┘      └───────┬───────┘      └───────┬───────┘
        │                      │                      │
        ├── Item 1.1           ├── Item 2.1           ├── Item 3.1
        │   └── detalhe        │   └── detalhe        │   └── detalhe
        ├── Item 1.2           ├── Item 2.2           ├── Item 3.2
        │   └── detalhe        │   └── detalhe        │   └── detalhe
        ├── Item 1.3           ├── Item 2.3           ├── Item 3.3
        └── Item 1.4           └── Item 2.4           └── Item 3.4

┌─────────────────────────────────────────────────────────────┐
│  🔗 CONEXÕES IMPORTANTES                                    │
└─────────────────────────────────────────────────────────────┘

  [Aspecto 1] ←─── relaciona-se com ───→ [Aspecto 2]
  [Item 1.1] ←─── é pressuposto de ───→ [Item 2.1]
  [Aspecto 3] ←─── depende de ───→ [Aspecto 1]

┌─────────────────────────────────────────────────────────────┐
│  🏷️ PALAVRAS-CHAVE                                          │
└─────────────────────────────────────────────────────────────┘

  #conceito1  #conceito2  #conceito3  #conceito4  #conceito5

┌─────────────────────────────────────────────────────────────┐
│  💡 PARA MEMORIZAR                                          │
└─────────────────────────────────────────────────────────────┘

  🎯 O mais importante: [ponto central]
  ⚠️ Cuidado com: [pegadinha comum]`
      },
      fichamento: {
        instrucao: `Crie um FICHAMENTO ACADÊMICO PROFISSIONAL completo e estruturado para concursos.

REGRAS DE ESTRUTURA:
• Use caixas ASCII para delimitar cada seção
• Seções OBRIGATÓRIAS: Referência, Palavras-Chave, Citações, Conceitos, Questões, Síntese
• Citações devem ter análise e aplicação prática
• Conceitos com definição técnica e exemplo
• Questões no formato de prova (pergunta + resposta)
• Síntese final objetiva`,
        exemplo: `═══════════════════════════════════════════════════════════════
                     📋 FICHAMENTO ACADÊMICO
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│  📖 REFERÊNCIA                                              │
├─────────────────────────────────────────────────────────────┤
│  Tema: [Nome completo do tema]                              │
│  Área: [Disciplina] › [Assunto] › [Subassunto]              │
│  Data de estudo: [Data]                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🏷️ PALAVRAS-CHAVE                                          │
├─────────────────────────────────────────────────────────────┤
│  #termo1  #termo2  #termo3  #termo4  #termo5  #termo6       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📝 CITAÇÕES E ANÁLISES                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  "[Citação literal importante do texto original]"           │
│                                                             │
│  ➤ Análise: Explicação do significado e relevância          │
│    jurídica/técnica desta passagem.                         │
│                                                             │
│  ➤ Aplicação: Como este conceito costuma ser cobrado        │
│    em provas de concurso público.                           │
│                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                             │
│  "[Outra citação relevante do texto]"                       │
│                                                             │
│  ➤ Análise: Comentário crítico sobre o trecho.              │
│                                                             │
│  ➤ Conexão: Relação com outros temas ou institutos.         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📚 CONCEITOS FUNDAMENTAIS                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ▸ **CONCEITO 1**                                           │
│    Definição: [Explicação técnica clara e completa]         │
│    Exemplo: [Caso prático ilustrativo]                      │
│    Base legal: [Artigo/lei se aplicável]                    │
│                                                             │
│  ▸ **CONCEITO 2**                                           │
│    Definição: [Explicação técnica clara e completa]         │
│    Exemplo: [Caso prático ilustrativo]                      │
│    Base legal: [Artigo/lei se aplicável]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ❓ QUESTÕES PARA REVISÃO                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. [Pergunta no estilo de prova de concurso]               │
│     R: [Resposta objetiva e fundamentada]                   │
│                                                             │
│  2. [Outra pergunta relevante]                              │
│     R: [Resposta objetiva e fundamentada]                   │
│                                                             │
│  3. [Terceira pergunta importante]                          │
│     R: [Resposta objetiva e fundamentada]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ✅ SÍNTESE FINAL                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Resumo de 3-5 linhas consolidando os pontos mais          │
│  importantes do tema, destacando o que é essencial          │
│  memorizar para a prova]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘`
      },
      esquema: {
        instrucao: `Crie um ESQUEMA VISUAL PROFISSIONAL usando tabelas, quadros comparativos e fluxogramas em ASCII.

REGRAS DE ESTRUTURA:
• Use tabelas ASCII alinhadas para comparações
• Inclua OBRIGATORIAMENTE: Quadro Comparativo e Fluxograma
• Caixas bem definidas com bordas duplas ou simples
• Setas e símbolos para indicar fluxos (→, ▶, ▼)
• Seção de Regras/Fórmulas quando aplicável
• Legenda explicativa no final
• Formato ideal para memorização visual`,
        exemplo: `╔═════════════════════════════════════════════════════════════╗
║                    📊 ESQUEMA VISUAL                        ║
║                    [Nome do Tema]                           ║
╚═════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│  📋 QUADRO COMPARATIVO                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┬──────────────────┬──────────────────┐     │
│  │   ASPECTO    │    INSTITUTO A   │    INSTITUTO B   │     │
│  ├──────────────┼──────────────────┼──────────────────┤     │
│  │ Conceito     │ [definição]      │ [definição]      │     │
│  ├──────────────┼──────────────────┼──────────────────┤     │
│  │ Natureza     │ [classificação]  │ [classificação]  │     │
│  ├──────────────┼──────────────────┼──────────────────┤     │
│  │ Requisitos   │ • item 1         │ • item 1         │     │
│  │              │ • item 2         │ • item 2         │     │
│  ├──────────────┼──────────────────┼──────────────────┤     │
│  │ Efeitos      │ [consequências]  │ [consequências]  │     │
│  ├──────────────┼──────────────────┼──────────────────┤     │
│  │ Prazo        │ [tempo]          │ [tempo]          │     │
│  ├──────────────┼──────────────────┼──────────────────┤     │
│  │ Base Legal   │ Art. X, Lei Y    │ Art. Z, Lei W    │     │
│  └──────────────┴──────────────────┴──────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔄 FLUXOGRAMA DO PROCESSO                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│      ┌───────────┐                                          │
│      │  INÍCIO   │                                          │
│      └─────┬─────┘                                          │
│            │                                                │
│            ▼                                                │
│      ┌───────────┐     SIM     ┌───────────────┐           │
│      │ Requisito │────────────▶│   ETAPA 2     │           │
│      │   OK?     │             │ [descrição]   │           │
│      └─────┬─────┘             └───────┬───────┘           │
│            │ NÃO                       │                    │
│            ▼                           ▼                    │
│      ┌───────────┐             ┌───────────────┐           │
│      │ ARQUIVAR  │             │   ETAPA 3     │           │
│      │  ou SANAR │             │ [descrição]   │           │
│      └───────────┘             └───────┬───────┘           │
│                                        │                    │
│                                        ▼                    │
│                                ┌───────────────┐           │
│                                │   CONCLUSÃO   │           │
│                                │  [resultado]  │           │
│                                └───────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📝 REGRAS E EXCEÇÕES                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ REGRA GERAL: [descrição da regra principal]           │  │
│  │ ▸ Fundamento: [base legal ou doutrinária]             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ EXCEÇÃO 1: [caso em que a regra não se aplica]        │  │
│  │ ▸ Hipótese: [quando ocorre]                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ EXCEÇÃO 2: [outro caso especial]                      │  │
│  │ ▸ Hipótese: [quando ocorre]                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🎯 LEGENDA                                                 │
├─────────────────────────────────────────────────────────────┤
│  ✅ = Aplicável      ❌ = Não aplicável    ⚠️ = Atenção     │
│  📌 = Importante     💡 = Dica             ⚖️ = Súmula      │
│  → = Gera/Produz     ← = Decorre de        ↔ = Relaciona   │
└─────────────────────────────────────────────────────────────┘`
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
