// API Route - Geração de Imagens Médicas PREPARAMED
// Usa DALL-E 3 (GPT Image) para imagens de alta qualidade

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import OpenAI from 'openai'
import { PlanoIA, verificarLimiteIA, incrementarUsoIA } from '@/lib/ai'

// supabase - usar getSupabaseAdmin() dentro das funções

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Estilos disponíveis para geração (otimizados para DALL-E 3)
const ESTILOS_IMAGEM = {
  anatomico: `Ilustração anatômica educacional de alta qualidade para atlas médico profissional.
ESTILO: Diagrama científico no estilo Netter/Sobotta com cores anatomicamente corretas.
FUNDO: Branco limpo, sem distrações.
DETALHES: Linhas precisas, diferenciação clara entre tecidos, proporções corretas.
LEGENDAS: Em português brasileiro com linhas de referência finas.
QUALIDADE: Nível de atlas de anatomia médica profissional.`,

  fluxograma: `Fluxograma médico profissional para tomada de decisão clínica.
Use boxes coloridos distintos, setas direcionais claras e texto legível.
Siga padrões de algoritmos clínicos (guidelines).
Formato limpo, organizado e fácil de seguir passo a passo.
FUNDO: Branco ou gradiente suave.
TEXTO: Em português brasileiro.`,

  diagrama: `Diagrama médico educativo de alta qualidade.
Ilustração clara, didática e visualmente atrativa.
Cores distintas e profissionais para diferentes elementos.
Estilo de livro-texto médico (Guyton, Costanzo).
LEGENDAS: Em português brasileiro.`,

  fisiopatologia: `Ilustração de fisiopatologia médica detalhada.
Mostre mecanismos celulares e moleculares com precisão.
Use setas coloridas para indicar processos, cascatas e interações.
Estilo de revista científica médica de alto impacto.
QUALIDADE: Imagem para publicação científica.`,

  procedimento: `Ilustração de procedimento médico passo-a-passo.
Mostre instrumentos médicos e técnica correta com detalhes.
Numeração clara de etapas sequenciais.
Estilo de manual de procedimentos cirúrgicos.
QUALIDADE: Material de treinamento médico.`,

  histologia: `Fotomicrografia histológica de alta qualidade.
COLORAÇÃO: H&E (hematoxilina e eosina) - núcleos em roxo, citoplasma em rosa.
AUMENTO: 400x com foco nítido em toda a imagem.
Mostre estruturas celulares e teciduais claramente identificáveis.
ESTILO: Atlas de histologia (Junqueira/Ross).`,

  radiologia: `Imagem radiológica educacional de alta qualidade.
TÉCNICA: Escala de cinza padrão radiológico (ossos brancos, ar preto).
Inclua legendas explicativas e setas para achados importantes.
FUNDO: Preto (como lightbox radiológico).
QUALIDADE: Imagem diagnóstica padrão hospitalar.`,

  educativo: `Ilustração médica educativa de alta qualidade.
Foco em clareza, compreensão e engajamento visual.
Estilo moderno e profissional para ensino médico.
Cores vibrantes mas academicamente apropriadas.
LEGENDAS: Em português brasileiro quando necessário.`
}

// Custos por qualidade (DALL-E 3)
const CUSTOS_IMAGEM = {
  standard: 0.04, // $0.04 por imagem standard
  hd: 0.08, // $0.08 por imagem HD
}

// ==========================================
// POST - Gerar Imagem Médica com DALL-E 3
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      prompt,
      estilo = 'educativo',
      titulo,
      quality = 'standard', // 'standard' ou 'hd'
      size = '1024x1024', // '1024x1024', '1024x1792', '1792x1024'
    } = body

    if (!user_id || !prompt) {
      return NextResponse.json(
        { error: 'user_id e prompt são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar plano do usuário
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles_med')
      .select('plano')
      .eq('id', user_id)
      .single()

    const plano = (profile?.plano || 'gratuito') as PlanoIA

    // Limites por plano (imagens por mês)
    const limitesPorPlano: Record<string, number> = {
      gratuito: 5,
      premium: 30,
      residencia: 100,
    }

    // Verificar limite
    const { permitido, usado, limite } = await verificarLimiteIA(user_id, plano, 'imagens')
    if (!permitido) {
      return NextResponse.json(
        {
          error: `Limite de geração de imagens atingido (${usado}/${limite}). Faça upgrade para gerar mais imagens.`,
          usado,
          limite,
          plano
        },
        { status: 429 }
      )
    }

    // Construir prompt com estilo
    const estiloPrompt = ESTILOS_IMAGEM[estilo as keyof typeof ESTILOS_IMAGEM] || ESTILOS_IMAGEM.educativo

    const promptCompleto = `${estiloPrompt}

CONTEÚDO A ILUSTRAR:
${prompt}

REQUISITOS OBRIGATÓRIOS:
- Imagem profissional de alta qualidade para educação médica
- Cientificamente precisa e visualmente clara
- NÃO inclua texto com erros ortográficos
- Precisão anatômica e médica é essencial
- Cores realistas e apropriadas para o contexto médico`

    console.log(`[DALL-E 3] Gerando imagem para usuário ${user_id}`)
    console.log(`[DALL-E 3] Estilo: ${estilo}, Qualidade: ${quality}`)

    // Gerar imagem com DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: promptCompleto,
      n: 1,
      size: size as '1024x1024' | '1024x1792' | '1792x1024',
      quality: quality as 'standard' | 'hd',
      style: 'natural', // 'vivid' ou 'natural' - natural é melhor para imagens médicas
      response_format: 'url', // Retorna URL temporária
    })

    if (!response.data || response.data.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível gerar a imagem. Tente reformular o prompt.' },
        { status: 500 }
      )
    }

    const imagemGerada = response.data[0]
    const imageUrl = imagemGerada.url
    const revisedPrompt = imagemGerada.revised_prompt || prompt

    console.log(`[DALL-E 3] Imagem gerada com sucesso!`)

    // Salvar no banco de dados
    const { data: documento, error: saveError } = await getSupabaseAdmin()
      .from('documentos_ia_med')
      .insert({
        user_id,
        tipo: 'imagem',
        titulo: titulo || `Ilustração: ${prompt.substring(0, 50)}...`,
        conteudo: revisedPrompt,
        formato: 'image/png',
        url: imageUrl, // URL da imagem gerada
        tamanho_bytes: 0, // Não temos o tamanho exato
        metadata: {
          estilo,
          quality,
          size,
          modelo: 'dall-e-3',
          revised_prompt: revisedPrompt,
          gerado_em: new Date().toISOString(),
        }
      })
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar documento:', saveError)
    }

    // Calcular custo
    const custo = CUSTOS_IMAGEM[quality as keyof typeof CUSTOS_IMAGEM] || 0.04

    // Incrementar uso
    await incrementarUsoIA(user_id, 'imagens', 1, 0, 0, custo)

    return NextResponse.json({
      success: true,
      imagem_url: imageUrl,
      revised_prompt: revisedPrompt,
      estilo,
      quality,
      documento_id: documento?.id,
      custo_estimado: custo,
      modelo: 'dall-e-3'
    })
  } catch (error: unknown) {
    console.error('Erro ao gerar imagem:', error)

    const err = error as { message?: string; code?: string; status?: number }

    // Tratamento de erros específicos da OpenAI
    if (err.code === 'content_policy_violation') {
      return NextResponse.json(
        { error: 'O prompt foi rejeitado pela moderação. Tente descrever de forma diferente.' },
        { status: 400 }
      )
    }

    if (err.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: err.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ==========================================
// GET - Listar Imagens Geradas
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const { data: imagens } = await getSupabaseAdmin()
      .from('documentos_ia_med')
      .select('*')
      .eq('user_id', user_id)
      .eq('tipo', 'imagem')
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ imagens })
  } catch (error) {
    console.error('Erro ao buscar imagens:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ==========================================
// DELETE - Excluir Imagem
// ==========================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documento_id = searchParams.get('documento_id')
    const user_id = searchParams.get('user_id')

    if (!documento_id || !user_id) {
      return NextResponse.json(
        { error: 'documento_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    await getSupabaseAdmin()
      .from('documentos_ia_med')
      .delete()
      .eq('id', documento_id)
      .eq('user_id', user_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar imagem:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
