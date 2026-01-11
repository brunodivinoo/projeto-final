// API Route - Geração de Imagens Médicas PREPARAMED

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PlanoIA, verificarLimiteIA, incrementarUsoIA } from '@/lib/ai'
import { MODELOS } from '@/lib/ai/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Estilos disponíveis para geração
const ESTILOS_IMAGEM = {
  anatomico: `Crie uma ilustração anatômica médica profissional, estilo livro didático de anatomia.
Use cores realistas para tecidos e órgãos.
Inclua legendas e setas indicativas quando apropriado.
Qualidade de atlas de anatomia médica.`,

  fluxograma: `Crie um fluxograma médico profissional para tomada de decisão clínica.
Use boxes coloridos, setas direcionais e texto claro.
Siga padrões de algoritmos clínicos.
Formato limpo e organizado, fácil de seguir.`,

  diagrama: `Crie um diagrama médico educativo.
Ilustração clara e didática.
Cores distintas para diferentes elementos.
Estilo de livro-texto médico.`,

  fisiopatologia: `Crie uma ilustração de fisiopatologia médica.
Mostre mecanismos celulares e moleculares.
Use setas para indicar processos e cascatas.
Estilo de revista científica médica.`,

  procedimento: `Crie uma ilustração de procedimento médico passo-a-passo.
Mostre instrumentos e técnica correta.
Numeração de etapas se necessário.
Estilo de manual de procedimentos.`,

  histologia: `Crie uma ilustração histológica médica.
Mostre estruturas celulares e teciduais.
Use cores típicas de colorações histológicas.
Estilo de atlas de histologia.`,

  radiologia: `Crie uma ilustração esquemática de achados radiológicos.
Mostre as estruturas normais vs anormais.
Inclua legendas explicativas.
Estilo educativo para interpretação de exames.`,

  educativo: `Crie uma ilustração médica educativa geral.
Foco em clareza e compreensão.
Estilo adequado para ensino médico.
Cores vibrantes e design moderno.`
}

// ==========================================
// POST - Gerar Imagem Médica
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      prompt,
      estilo = 'educativo',
      titulo
    } = body

    if (!user_id || !prompt) {
      return NextResponse.json(
        { error: 'user_id e prompt são obrigatórios' },
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

    // Verificar se plano permite geração de imagens
    if (plano !== 'residencia') {
      return NextResponse.json(
        { error: 'Geração de imagens disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    // Verificar limite
    const { permitido, usado, limite } = await verificarLimiteIA(user_id, plano, 'imagens')
    if (!permitido) {
      return NextResponse.json(
        {
          error: `Limite de geração de imagens atingido (${usado}/${limite})`,
          usado,
          limite
        },
        { status: 429 }
      )
    }

    // Construir prompt com estilo
    const estiloPrompt = ESTILOS_IMAGEM[estilo as keyof typeof ESTILOS_IMAGEM] || ESTILOS_IMAGEM.educativo

    const promptCompleto = `${estiloPrompt}

CONTEÚDO A ILUSTRAR:
${prompt}

Crie uma imagem profissional de alta qualidade para uso em educação médica.
A imagem deve ser cientificamente precisa e visualmente clara.
NÃO inclua texto com erros ortográficos.
Foque na precisão anatômica e médica.`

    // Usar Gemini para gerar imagem
    const model = genAI.getGenerativeModel({
      model: MODELOS.gemini.image // gemini-2.0-flash-exp com geração de imagem
    })

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: promptCompleto
        }]
      }],
      generationConfig: {
        // @ts-expect-error - responseModalities é uma propriedade beta
        responseModalities: ['image', 'text']
      }
    })

    const response = result.response
    let imagemBase64: string | null = null
    let descricao = ''

    // Extrair imagem e descrição da resposta
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if ('inlineData' in part && part.inlineData) {
          imagemBase64 = part.inlineData.data || null
        } else if ('text' in part && part.text) {
          descricao = part.text
        }
      }
    }

    if (!imagemBase64) {
      return NextResponse.json(
        { error: 'Não foi possível gerar a imagem. Tente reformular o prompt.' },
        { status: 500 }
      )
    }

    // Salvar no banco de dados
    const { data: documento, error: saveError } = await supabase
      .from('documentos_ia_med')
      .insert({
        user_id,
        tipo: 'imagem',
        titulo: titulo || `Ilustração: ${prompt.substring(0, 50)}...`,
        conteudo: descricao,
        formato: 'image/png',
        // Em produção, você salvaria a imagem no storage e guardaria a URL
        // Por ora, guardamos metadados
        tamanho_bytes: Math.ceil(imagemBase64.length * 0.75) // Estimativa do tamanho
      })
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar documento:', saveError)
    }

    // Incrementar uso
    await incrementarUsoIA(user_id, 'imagens', 1, 0, 0, 0.02) // Custo estimado por imagem

    return NextResponse.json({
      success: true,
      imagem_base64: imagemBase64,
      descricao,
      estilo,
      documento_id: documento?.id,
      tokens: {
        input: 0, // Gemini não reporta tokens para imagens
        output: 0,
        total: 0
      }
    })
  } catch (error) {
    console.error('Erro ao gerar imagem:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
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

    const { data: imagens } = await supabase
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

    await supabase
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
