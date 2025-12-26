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

## ESTRUTURA VISUAL OBRIGATÓRIA

### Hierarquia de Informação
- Use "━━━" para separar seções PRINCIPAIS (apenas 3-4 no documento)
- Use "───" para separar subseções
- Mantenha espaçamento consistente entre blocos

### Formatação de Texto (MARKDOWN)
- Use **negrito** para: termos técnicos, nomes de leis, conceitos-chave, palavras que precisam de destaque
- Use *itálico* para: citações, expressões latinas, ênfase suave
- Use ~~tachado~~ para: indicar o que NÃO é correto (ex: "NÃO é ~~crime culposo~~, é crime doloso")
- Use \`código\` para: artigos de lei, números, datas, prazos

### Ícones Contextuais (use com moderação, escolha os mais relevantes)
📌 Conceito principal ou definição importante
⚠️ Atenção/Cuidado - pegadinhas de prova
💡 Dica de memorização ou macete
⚖️ Jurisprudência (STF, STJ, súmulas)
📋 Lista ou enumeração importante
🎯 Ponto mais cobrado em provas
✅ Correto / Permitido
❌ Incorreto / Proibido
🔗 Conexão entre conceitos

### Caixas de Destaque
Use caixas ASCII apenas para seções MUITO importantes:
┌─────────────────────────────────┐
│  TÍTULO DA CAIXA               │
├─────────────────────────────────┤
│  Conteúdo importante aqui      │
└─────────────────────────────────┘

### Seções OBRIGATÓRIAS
1. Pontos-Chave (conceitos principais)
2. Pegadinhas de Prova (erros comuns)
3. Dicas de Memorização (mnemonicos, macetes)
4. Jurisprudência Relevante (se aplicável)

### Hierarquia de Tópicos
▸ Tópico principal (nível 1)
  → Subtópico (nível 2)
    • Detalhe (nível 3)`,
        exemplo: `# 📚 [TÍTULO DO TEMA]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📌 Pontos-Chave

▸ **Conceito Principal 1**
  → Definição clara e objetiva do conceito
  → Elementos constitutivos: são \`3 requisitos\` essenciais
    • Primeiro requisito obrigatório
    • Segundo requisito obrigatório
    • Terceiro requisito obrigatório
  → *Natureza jurídica*: classificação técnica

▸ **Conceito Principal 2**
  → Explicação detalhada do instituto
  → Diferenças para institutos similares:
    • ✅ Instituto A: [característica]
    • ❌ Instituto B: [diferença]

───────────────────────────────────────────────────

## ⚠️ Pegadinhas de Prova

> ⚡ As bancas costumam trocar **X** por **Y** - CUIDADO!

> ⚡ NÃO é ~~conceito errado~~, é **conceito correto**

> ⚡ O prazo é de \`X dias\`, NÃO \`Y dias\`

───────────────────────────────────────────────────

## 💡 Dicas de Memorização

🧠 **Mnemônico**: SIGLA para memorizar os elementos
📝 **Macete**: Associação prática para lembrar
🎯 **Mais cobrado**: Ponto que aparece frequentemente

───────────────────────────────────────────────────

## ⚖️ Jurisprudência

┌─────────────────────────────────────────────────┐
│  📜 **STF** - Súmula XXX                        │
│  "Texto da súmula ou entendimento"              │
├─────────────────────────────────────────────────┤
│  📜 **STJ** - Súmula YYY                        │
│  "Entendimento consolidado"                     │
└─────────────────────────────────────────────────┘`
      },
      mapa_mental: {
        instrucao: `Crie um MAPA MENTAL textual PROFISSIONAL com estrutura visual clara.

## ESTRUTURA VISUAL OBRIGATÓRIA

### Hierarquia de Informação
- Centro: Tema principal em destaque com caixa
- Nível 1: 3-4 ramos principais (aspectos principais do tema)
- Nível 2: 3-5 sub-itens por ramo
- Nível 3: Detalhes específicos quando necessário

### Formatação de Texto (MARKDOWN)
- Use **negrito** para: conceitos principais, termos técnicos
- Use *itálico* para: observações, notas explicativas
- Use \`código\` para: artigos, números, datas

### Estrutura de Ramificação
Use caracteres ASCII para criar ramificações visuais:
- ─ │ ├ └ ┌ ┐ para linhas e conexões
- → para indicar direção/consequência
- ▸ para listar itens

### Seções OBRIGATÓRIAS
1. Mapa Visual Central (com ramificações)
2. Conexões Importantes (relações entre conceitos)
3. Palavras-Chave (hashtags para revisão rápida)
4. Dica de Memorização (mnemônico ou associação)

### Ícones por Categoria
📗 Conceito/Definição
📘 Características
📙 Aplicação/Exemplos
📕 Exceções/Cuidados
🔗 Conexões entre temas`,
        exemplo: `# 🧠 Mapa Mental: [TEMA]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📌 Visão Geral

\`\`\`
                ╔════════════════════════╗
                ║   📌 **TEMA CENTRAL**  ║
                ║    [Nome do Conceito]  ║
                ╚═══════════╤════════════╝
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 📗 ASPECTO 1 │    │ 📘 ASPECTO 2 │    │ 📙 ASPECTO 3 │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       ├─ Item A           ├─ Item D           ├─ Item G
       │  └→ detalhe       │  └→ detalhe       │  └→ detalhe
       ├─ Item B           ├─ Item E           ├─ Item H
       │  └→ detalhe       │  └→ detalhe       │  └→ detalhe
       └─ Item C           └─ Item F           └─ Item I
\`\`\`

───────────────────────────────────────────────────

## 🔗 Conexões Importantes

> **Aspecto 1** ←──*relaciona-se com*──→ **Aspecto 2**

> **Item A** ←──*é pressuposto de*──→ **Item D**

> **Aspecto 3** ←──*depende de*──→ **Aspecto 1**

───────────────────────────────────────────────────

## 🏷️ Palavras-Chave

\`#conceito1\` \`#conceito2\` \`#conceito3\` \`#conceito4\` \`#conceito5\`

───────────────────────────────────────────────────

## 💡 Para Memorizar

🧠 **Mnemônico**: SIGLA ou frase para lembrar
🎯 **Mais importante**: O ponto central do tema
⚠️ **Cuidado**: Pegadinha comum em provas`
      },
      fichamento: {
        instrucao: `Crie um FICHAMENTO ACADÊMICO PROFISSIONAL completo para concursos públicos.

## ESTRUTURA VISUAL OBRIGATÓRIA

### Formatação de Texto (MARKDOWN)
- Use **negrito** para: termos-chave, conceitos importantes, palavras de destaque
- Use *itálico* para: citações, expressões latinas, observações
- Use \`código\` para: artigos de lei, números, datas, prazos
- Use > (blockquote) para: citações literais do texto original

### Hierarquia de Informação
- Use "━━━" para separar seções PRINCIPAIS
- Use "───" para separar subseções
- Mantenha espaçamento consistente

### Seções OBRIGATÓRIAS
1. **Referência** - Identificação do tema, área e data
2. **Palavras-Chave** - Hashtags para revisão rápida
3. **Citações e Análises** - Trechos importantes com comentários
4. **Conceitos Fundamentais** - Definições técnicas com exemplos
5. **Questões para Revisão** - Perguntas no estilo de prova
6. **Síntese Final** - Resumo dos pontos essenciais

### Estrutura de Conceitos
▸ **CONCEITO**
  → Definição: explicação técnica
  → Exemplo: caso prático
  → Base legal: artigo/lei

### Ícones Contextuais
📖 Referência/Fonte
🏷️ Palavras-chave
📝 Citações
📚 Conceitos
❓ Questões
✅ Síntese`,
        exemplo: `# 📋 Fichamento: [TEMA]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📖 Referência

| Campo | Valor |
|-------|-------|
| **Tema** | Nome completo do tema |
| **Área** | Disciplina › Assunto › Subassunto |
| **Data** | Data do estudo |

───────────────────────────────────────────────────

## 🏷️ Palavras-Chave

\`#termo1\` \`#termo2\` \`#termo3\` \`#termo4\` \`#termo5\` \`#termo6\`

───────────────────────────────────────────────────

## 📝 Citações e Análises

> *"Citação literal importante do texto original"*

**Análise**: Explicação do significado e relevância jurídica/técnica desta passagem.

**Aplicação em prova**: Como este conceito costuma ser cobrado em concursos.

- - -

> *"Outra citação relevante do texto"*

**Análise**: Comentário crítico sobre o trecho.

**Conexão**: Relação com outros temas ou institutos.

───────────────────────────────────────────────────

## 📚 Conceitos Fundamentais

▸ **CONCEITO 1**
  → *Definição*: Explicação técnica clara e completa
  → *Exemplo*: Caso prático ilustrativo
  → *Base legal*: \`Art. X, Lei Y\`

▸ **CONCEITO 2**
  → *Definição*: Explicação técnica clara e completa
  → *Exemplo*: Caso prático ilustrativo
  → *Base legal*: \`Art. Z, Lei W\`

───────────────────────────────────────────────────

## ❓ Questões para Revisão

**1. Pergunta no estilo de prova de concurso?**
> R: Resposta objetiva e fundamentada.

**2. Outra pergunta relevante?**
> R: Resposta objetiva e fundamentada.

**3. Terceira pergunta importante?**
> R: Resposta objetiva e fundamentada.

───────────────────────────────────────────────────

## ✅ Síntese Final

┌─────────────────────────────────────────────────┐
│ Resumo de 3-5 linhas consolidando os pontos     │
│ mais importantes do tema, destacando o que é    │
│ **essencial memorizar** para a prova.           │
└─────────────────────────────────────────────────┘`
      },
      esquema: {
        instrucao: `Crie um ESQUEMA VISUAL PROFISSIONAL com tabelas comparativas e fluxogramas.

## ESTRUTURA VISUAL OBRIGATÓRIA

### Formatação de Texto (MARKDOWN)
- Use **negrito** para: títulos de colunas, conceitos-chave
- Use *itálico* para: observações, notas
- Use \`código\` para: artigos, números, prazos
- Use tabelas markdown para comparações

### Elementos Visuais
- Tabelas markdown para quadros comparativos
- Blocos de código (\`\`\`) para fluxogramas ASCII
- Caixas ASCII para regras importantes
- Setas: → ▶ ▼ para indicar fluxos e consequências

### Seções OBRIGATÓRIAS
1. **Quadro Comparativo** - Tabela comparando institutos/conceitos
2. **Fluxograma** - Processo/procedimento visual
3. **Regras e Exceções** - Regra geral vs exceções
4. **Legenda** - Símbolos utilizados

### Estrutura de Comparação
| Aspecto | Instituto A | Instituto B |
|---------|-------------|-------------|
| Conceito | X | Y |
| Requisitos | A, B, C | D, E |

### Ícones de Legenda
✅ Aplicável / Correto
❌ Não aplicável / Incorreto
⚠️ Atenção / Cuidado
📌 Importante
💡 Dica
⚖️ Jurisprudência`,
        exemplo: `# 📊 Esquema Visual: [TEMA]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 Quadro Comparativo

| **Aspecto** | **Instituto A** | **Instituto B** |
|-------------|-----------------|-----------------|
| *Conceito* | Definição de A | Definição de B |
| *Natureza* | Classificação | Classificação |
| *Requisitos* | • Item 1 • Item 2 | • Item 1 • Item 2 |
| *Efeitos* | Consequências | Consequências |
| *Prazo* | \`X dias\` | \`Y dias\` |
| *Base Legal* | \`Art. X, Lei Y\` | \`Art. Z, Lei W\` |

───────────────────────────────────────────────────

## 🔄 Fluxograma do Processo

\`\`\`
     ┌─────────────┐
     │   INÍCIO    │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐      SIM      ┌─────────────┐
     │  Requisito  │──────────────▶│   ETAPA 2   │
     │    OK?      │               │ [descrição] │
     └──────┬──────┘               └──────┬──────┘
            │ NÃO                         │
            ▼                             ▼
     ┌─────────────┐               ┌─────────────┐
     │  ARQUIVAR   │               │   ETAPA 3   │
     │  ou SANAR   │               │ [descrição] │
     └─────────────┘               └──────┬──────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │  CONCLUSÃO  │
                                   │ [resultado] │
                                   └─────────────┘
\`\`\`

───────────────────────────────────────────────────

## 📝 Regras e Exceções

┌─────────────────────────────────────────────────┐
│ **REGRA GERAL**                                 │
│ Descrição da regra principal aplicável          │
│ → *Fundamento*: \`Art. X, Lei Y\`               │
└─────────────────────────────────────────────────┘

> ⚠️ **EXCEÇÃO 1**: Caso em que a regra não se aplica
> → *Hipótese*: Quando ocorre esta situação

> ⚠️ **EXCEÇÃO 2**: Outro caso especial
> → *Hipótese*: Quando ocorre esta situação

───────────────────────────────────────────────────

## 🎯 Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Aplicável / Correto |
| ❌ | Não aplicável / Incorreto |
| ⚠️ | Atenção / Cuidado |
| 📌 | Importante |
| 💡 | Dica |
| ⚖️ | Súmula / Jurisprudência |
| → | Gera / Produz |
| ← | Decorre de |`
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
