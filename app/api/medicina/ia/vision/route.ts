// API Route - Análise de Imagens Médicas (Vision) PREPARAMED

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { PlanoIA, verificarLimiteIA, incrementarUsoIA, calcularCusto } from '@/lib/ai'
import { PROMPT_ANALISAR_IMAGEM, SYSTEM_PROMPT_RESIDENCIA } from '@/lib/ai/prompts'
import { MODELOS } from '@/lib/ai/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// Tipos de imagem suportados
const TIPOS_SUPORTADOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// ==========================================
// POST - Analisar Imagem Médica
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      imagem_base64,
      imagem_tipo,
      pergunta,
      tipo_exame,
      conversa_id
    } = body

    if (!user_id || !imagem_base64 || !imagem_tipo) {
      return NextResponse.json(
        { error: 'user_id, imagem_base64 e imagem_tipo são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de imagem
    if (!TIPOS_SUPORTADOS.includes(imagem_tipo)) {
      return NextResponse.json(
        { error: `Tipo de imagem não suportado. Use: ${TIPOS_SUPORTADOS.join(', ')}` },
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

    // Verificar se plano permite Vision
    if (plano !== 'residencia') {
      return NextResponse.json(
        { error: 'Análise de imagens disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    // Verificar limite
    const { permitido, usado, limite } = await verificarLimiteIA(user_id, plano, 'vision')
    if (!permitido) {
      return NextResponse.json(
        {
          error: `Limite de análises de imagem atingido (${usado}/${limite})`,
          usado,
          limite
        },
        { status: 429 }
      )
    }

    // Construir prompt específico para o tipo de exame
    let promptFinal = PROMPT_ANALISAR_IMAGEM

    if (tipo_exame) {
      const tiposExame: Record<string, string> = {
        ecg: `Analise este ECG de forma sistemática:
1. DADOS TÉCNICOS: Frequência cardíaca, ritmo, eixo elétrico
2. ONDAS: P, complexo QRS, onda T, intervalos PR, QT, QTc
3. SEGMENTOS: ST (supra/infra), ponto J
4. ACHADOS: Liste todas as alterações encontradas
5. CONCLUSÃO: Diagnóstico eletrocardiográfico
6. CORRELAÇÃO CLÍNICA: Possíveis causas e significado clínico`,

        rx_torax: `Analise este raio-X de tórax de forma sistemática:
1. TÉCNICA: PA/AP, incidência, qualidade técnica
2. PARTES MOLES: Mamas, tecido subcutâneo
3. ARCABOUÇO ÓSSEO: Clavículas, costelas, coluna
4. MEDIASTINO: Silhueta cardíaca, aorta, traqueia
5. HILOS: Tamanho, densidade, posição
6. PARÊNQUIMA PULMONAR: Transparência, padrão intersticial/alveolar
7. PLEURA: Espessamento, derrame
8. CONCLUSÃO: Diagnóstico radiológico`,

        tc_cranio: `Analise esta TC de crânio:
1. TÉCNICA: Com/sem contraste, janela (parênquima/óssea)
2. PARÊNQUIMA: Substância branca e cinzenta, diferenciação
3. SISTEMA VENTRICULAR: Tamanho, simetria, desvios
4. CISTERNA: Perimesencefálica, basilar
5. LINHA MÉDIA: Desvio, herniação
6. OSSOS: Fraturas, lesões líticas/blásticas
7. ACHADOS: Hemorragias, isquemia, massas
8. CONCLUSÃO: Diagnóstico tomográfico`,

        ultrassom_abdominal: `Analise este ultrassom abdominal:
1. FÍGADO: Tamanho, ecogenicidade, lesões focais
2. VESÍCULA BILIAR: Paredes, cálculos, bile
3. VIAS BILIARES: Calibre, dilatação
4. PÂNCREAS: Visualização, ecogenicidade
5. BAÇO: Tamanho, ecogenicidade
6. RINS: Dimensões, parênquima, sistema coletor
7. AORTA/VEIA CAVA: Calibre
8. LÍQUIDO LIVRE: Presença, quantidade
9. CONCLUSÃO: Achados ultrassonográficos`,

        dermatologia: `Analise esta lesão dermatológica:
1. LOCALIZAÇÃO: Região anatômica
2. MORFOLOGIA: Tipo primário (mácula, pápula, placa, nódulo, etc)
3. CARACTERÍSTICAS: Cor, bordas, superfície, tamanho estimado
4. DISTRIBUIÇÃO: Isolada, agrupada, linear, simétrica
5. DIAGNÓSTICO DIFERENCIAL: Liste 3-5 hipóteses
6. REGRA ABCDE: Se lesão melanocítica (Assimetria, Bordas, Cor, Diâmetro, Evolução)
7. SUGESTÃO DE CONDUTA: Biópsia, dermatoscopia, observação`
      }

      if (tiposExame[tipo_exame]) {
        promptFinal = tiposExame[tipo_exame]
      }
    }

    // Adicionar pergunta do usuário se houver
    const promptCompleto = pergunta
      ? `${promptFinal}\n\nPERGUNTA ESPECÍFICA DO USUÁRIO: ${pergunta}`
      : promptFinal

    // Chamar Claude Vision
    const response = await anthropic.messages.create({
      model: MODELOS.claude.opus,
      max_tokens: 4096,
      system: SYSTEM_PROMPT_RESIDENCIA,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imagem_tipo as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imagem_base64
            }
          },
          {
            type: 'text',
            text: promptCompleto
          }
        ]
      }]
    })

    // Extrair resposta
    let analise = ''
    for (const block of response.content) {
      if (block.type === 'text') {
        analise += block.text
      }
    }

    const tokensInput = response.usage.input_tokens
    const tokensOutput = response.usage.output_tokens

    // Se houver conversa_id, salvar como mensagem
    if (conversa_id) {
      // Salvar mensagem do usuário
      await supabase
        .from('mensagens_ia_med')
        .insert({
          conversa_id,
          role: 'user',
          content: pergunta || 'Analise esta imagem médica',
          has_image: true
        })

      // Salvar resposta
      await supabase
        .from('mensagens_ia_med')
        .insert({
          conversa_id,
          role: 'assistant',
          content: analise,
          tokens: tokensInput + tokensOutput
        })

      // Atualizar conversa
      await supabase
        .from('conversas_ia_med')
        .update({
          tokens_usados: tokensInput + tokensOutput,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversa_id)
    }

    // Incrementar uso
    const custo = calcularCusto(MODELOS.claude.opus, tokensInput, tokensOutput)
    await incrementarUsoIA(user_id, 'vision', 1, tokensInput, tokensOutput, custo)

    return NextResponse.json({
      success: true,
      analise,
      tipo_exame: tipo_exame || 'geral',
      tokens: {
        input: tokensInput,
        output: tokensOutput,
        total: tokensInput + tokensOutput
      },
      conversa_id
    })
  } catch (error) {
    console.error('Erro ao analisar imagem:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
