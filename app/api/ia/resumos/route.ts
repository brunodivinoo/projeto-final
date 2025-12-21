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

    // Determinar formato do resumo
    const formatoConfig: Record<string, { instrucao: string; exemplo: string }> = {
      topicos: {
        instrucao: 'Organize em tópicos e subtópicos claros, usando bullets',
        exemplo: '- Tópico Principal\n  - Subtópico 1\n  - Subtópico 2'
      },
      mapa_mental: {
        instrucao: 'Estruture como um mapa mental em texto, com hierarquia clara',
        exemplo: 'CONCEITO CENTRAL\n├── Ramo 1\n│   ├── Detalhe 1.1\n│   └── Detalhe 1.2\n└── Ramo 2'
      },
      fichamento: {
        instrucao: 'Faça um fichamento acadêmico com citações diretas e comentários',
        exemplo: 'FICHAMENTO\n[Citação] "texto original"\nComentário: análise do trecho'
      },
      esquema: {
        instrucao: 'Crie um esquema visual em texto para memorização',
        exemplo: '┌─────────────────┐\n│   CONCEITO     │\n├────────┬────────┤\n│ Tipo A │ Tipo B │\n└────────┴────────┘'
      }
    }

    const config = formatoConfig[formato || 'topicos'] || formatoConfig.topicos

    const prompt = `Você é um especialista em criar resumos para concursos públicos brasileiros.

TEXTO PARA RESUMIR:
${texto}

${disciplina ? `DISCIPLINA: ${disciplina}` : ''}
${assunto ? `ASSUNTO: ${assunto}` : ''}

FORMATO SOLICITADO: ${formato || 'tópicos'}
${config.instrucao}

REGRAS:
1. Extraia os pontos mais importantes para concursos
2. Use linguagem técnica correta
3. Destaque termos-chave em **negrito**
4. Inclua dicas de memorização quando possível
5. Se houver jurisprudência ou súmulas relevantes, mencione
6. Mantenha o resumo conciso mas completo
7. Use o formato especificado

Exemplo de formato:
${config.exemplo}

Gere o resumo:`

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
        conteudo: conteudoResumo,
        texto_original: texto.substring(0, 10000),
        disciplina: disciplina || null,
        assunto: assunto || null,
        formato: formato || 'topicos'
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
