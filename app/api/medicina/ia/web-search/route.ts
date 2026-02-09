// API Route - Web Search Médico PREPARAMED
// Refatorado: usa Serper + Gemini Flash (compressão) ao invés de Claude web_search
// Custo: ~$0.002/busca vs ~$0.05/busca anterior (redução de 96%)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PlanoIA, verificarLimiteIA, incrementarUsoIA } from '@/lib/ai'
import { buscarWebMedica } from '@/lib/services/serperWebService'
import { comprimirContexto, formatarContextoComprimido } from '@/lib/ai/contextCompressor'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { MODELOS } from '@/lib/ai/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ==========================================
// POST - Busca Web com IA (via Serper + Gemini Flash)
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      query,
      contexto,
      conversa_id
    } = body

    if (!user_id || !query) {
      return NextResponse.json(
        { error: 'user_id e query são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar plano do usuário
    const { data: profile } = await supabase
      .from('profiles_med')
      .select('plano')
      .eq('id', user_id)
      .single()

    const plano = (profile?.plano || 'gratuito') as PlanoIA

    // Verificar limite de web search
    const { permitido, usado, limite } = await verificarLimiteIA(user_id, plano, 'web_search')
    if (!permitido) {
      return NextResponse.json(
        { error: 'Limite de buscas web atingido', usado, limite },
        { status: 429 }
      )
    }

    // 1. Buscar via Serper (diretrizes brasileiras + fontes médicas)
    const queryCompleta = contexto ? `${contexto} ${query}` : query
    const resultadosBusca = await buscarWebMedica(queryCompleta, 8)

    if (!resultadosBusca.success || resultadosBusca.resultados.length === 0) {
      return NextResponse.json({
        success: true,
        resposta: 'Não foram encontrados resultados relevantes para esta busca.',
        citacoes: [],
        resultados_busca: [],
        fontes_filtradas: true,
        tokens: { input: 0, output: 0, total: 0 },
        custo_estimado: 0.001,
        conversa_id
      })
    }

    // 2. Comprimir resultados com Gemini Flash (ultra-barato)
    const contextoComprimido = await comprimirContexto(
      resultadosBusca.resultados.map(r => ({
        titulo: r.titulo,
        url: r.url,
        snippet: r.snippet,
        ehDiretriz: r.ehDiretriz,
      })),
      query
    )

    // 3. Gerar resposta final com Gemini Flash (modelo barato)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: MODELOS.gemini.flash,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    })

    const dataAtual = new Date().toLocaleDateString('pt-BR')
    const promptFinal = `Você é um professor de medicina brasileiro. Com base nas informações abaixo (de fontes confiáveis e diretrizes brasileiras), responda a pergunta do usuário de forma clara, completa e com referências.

PERGUNTA: ${query}
${contexto ? `CONTEXTO: ${contexto}` : ''}

INFORMAÇÕES DAS FONTES:
${contextoComprimido.resumo}

REGRAS:
1. Use APENAS informações das fontes fornecidas
2. Cite as fontes no formato [1], [2], etc.
3. Priorize informações de diretrizes brasileiras
4. Formato: parágrafos claros + referências ABNT no final
5. Se a informação for insuficiente, diga claramente

REFERÊNCIAS DISPONÍVEIS:
${contextoComprimido.fontes.map((f, i) => `[${i + 1}] ${f.titulo}. Disponível em: ${f.url}. Acesso em: ${dataAtual}.`).join('\n')}`

    const result = await model.generateContent(promptFinal)
    const resposta = result.response.text()

    // Estimar tokens (Gemini Flash)
    const tokensInput = Math.ceil(promptFinal.length / 4)
    const tokensOutput = Math.ceil(resposta.length / 4)

    // Extrair citações dos resultados
    const citacoes = contextoComprimido.fontes.map(f => ({
      titulo: f.titulo,
      url: f.url,
      trecho: f.ehDiretriz ? '[Diretriz Brasileira]' : '[Fonte Médica]'
    }))

    // Salvar na conversa se houver conversa_id
    if (conversa_id) {
      await supabase
        .from('mensagens_ia_med')
        .insert({
          conversa_id,
          role: 'user',
          content: `[Busca Web] ${query}`
        })

      await supabase
        .from('mensagens_ia_med')
        .insert({
          conversa_id,
          role: 'assistant',
          content: resposta,
          tokens: tokensInput + tokensOutput
        })

      await supabase
        .from('conversas_ia_med')
        .update({
          tokens_usados: tokensInput + tokensOutput,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversa_id)
    }

    // Custo estimado (Gemini Flash: ~$0.075/1M input, ~$0.30/1M output)
    const custoEstimado = (tokensInput * 0.000000075) + (tokensOutput * 0.0000003) + 0.001 // + Serper cost
    await incrementarUsoIA(user_id, 'web_search', 1, tokensInput, tokensOutput, custoEstimado)

    return NextResponse.json({
      success: true,
      resposta,
      citacoes,
      resultados_busca: resultadosBusca.resultados.map(r => ({
        titulo: r.titulo,
        url: r.url,
        snippet: r.snippet
      })),
      fontes_filtradas: true,
      tokens: {
        input: tokensInput,
        output: tokensOutput,
        total: tokensInput + tokensOutput
      },
      custo_estimado: custoEstimado,
      conversa_id,
      // Metadados extras
      diretrizes_encontradas: resultadosBusca.resultados.filter(r => r.ehDiretriz).length,
      compressao: {
        tokens_originais: contextoComprimido.tokensOriginais,
        tokens_comprimidos: contextoComprimido.tokensComprimidos,
        taxa: contextoComprimido.taxaCompressao
      }
    })
  } catch (error) {
    console.error('Erro na busca web:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
