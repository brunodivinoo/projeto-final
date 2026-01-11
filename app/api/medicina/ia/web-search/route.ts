// API Route - Web Search Médico PREPARAMED

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { PlanoIA, verificarLimiteIA, incrementarUsoIA, calcularCusto, CUSTO_WEB_SEARCH } from '@/lib/ai'
import { SYSTEM_PROMPT_RESIDENCIA } from '@/lib/ai/prompts'
import { MODELOS } from '@/lib/ai/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// Domínios médicos confiáveis para busca
const DOMINIOS_MEDICOS = [
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'uptodate.com',
  'medscape.com',
  'scielo.br',
  'who.int',
  'cdc.gov',
  'nejm.org',
  'thelancet.com',
  'bmj.com',
  'jamanetwork.com',
  'nature.com/nm',
  'cochranelibrary.com',
  'gov.br/saude',
  'bvsalud.org',
  'msdmanuals.com',
  'dynamed.com',
  'accessmedicine.com'
]

// ==========================================
// POST - Busca Web com IA
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      query,
      contexto,
      apenas_fontes_medicas = true,
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

    // Verificar se plano permite Web Search
    if (plano !== 'residencia') {
      return NextResponse.json(
        { error: 'Busca web disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    // Verificar limite
    const { permitido, usado, limite } = await verificarLimiteIA(user_id, plano, 'web_search')
    if (!permitido) {
      return NextResponse.json(
        {
          error: `Limite de buscas web atingido`,
          usado,
          limite
        },
        { status: 429 }
      )
    }

    // Construir prompt para busca
    const promptBusca = contexto
      ? `Contexto: ${contexto}\n\nPergunta: ${query}\n\nBusque informações atualizadas e baseadas em evidências para responder esta pergunta médica. Cite as fontes.`
      : `${query}\n\nBusque informações médicas atualizadas e baseadas em evidências. Priorize fontes como PubMed, UpToDate, diretrizes de sociedades médicas e artigos de revisão. Cite todas as fontes.`

    // Configurar tool de web search
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webSearchTool: any = {
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 5,
      allowed_domains: apenas_fontes_medicas ? DOMINIOS_MEDICOS : undefined
    }

    // Chamar Claude com Web Search
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (anthropic.messages.create as any)({
      model: MODELOS.claude.sonnet, // Sonnet para buscas (mais rápido e econômico)
      max_tokens: 4096,
      system: SYSTEM_PROMPT_RESIDENCIA,
      tools: [webSearchTool],
      messages: [{ role: 'user', content: promptBusca }]
    })

    // Extrair resposta e citações
    let resposta = ''
    const citacoes: Array<{
      titulo: string
      url: string
      trecho: string
    }> = []
    const resultadosBusca: Array<{
      titulo: string
      url: string
      snippet: string
    }> = []

    for (const block of response.content) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blk = block as any

      if (blk.type === 'text') {
        resposta += blk.text

        // Extrair citações do texto (formato [1], [2], etc)
        if (blk.citations) {
          for (const citation of blk.citations) {
            citacoes.push({
              titulo: citation.document_title || 'Fonte',
              url: citation.url || '',
              trecho: citation.cited_text || ''
            })
          }
        }
      } else if (blk.type === 'tool_use' && blk.name === 'web_search') {
        const results = blk.input?.results || []
        for (const result of results) {
          resultadosBusca.push({
            titulo: result.title || '',
            url: result.url || '',
            snippet: result.snippet || ''
          })
        }
      }
    }

    const tokensInput = response.usage.input_tokens
    const tokensOutput = response.usage.output_tokens

    // Se houver conversa_id, salvar como mensagem
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

    // Incrementar uso
    const custoTokens = calcularCusto(MODELOS.claude.sonnet, tokensInput, tokensOutput)
    const custoTotal = custoTokens + CUSTO_WEB_SEARCH
    await incrementarUsoIA(user_id, 'web_search', 1, tokensInput, tokensOutput, custoTotal)

    return NextResponse.json({
      success: true,
      resposta,
      citacoes,
      resultados_busca: resultadosBusca,
      fontes_filtradas: apenas_fontes_medicas,
      tokens: {
        input: tokensInput,
        output: tokensOutput,
        total: tokensInput + tokensOutput
      },
      custo_estimado: custoTotal,
      conversa_id
    })
  } catch (error) {
    console.error('Erro na busca web:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
