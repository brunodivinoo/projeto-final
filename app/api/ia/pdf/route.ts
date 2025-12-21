import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

// GET - Buscar PDFs analisados do usuário
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const pdf_id = searchParams.get('pdf_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (pdf_id) {
      const { data: pdf, error } = await supabase
        .from('pdfs_analisados')
        .select('*')
        .eq('id', pdf_id)
        .eq('user_id', user_id)
        .single()

      if (error) throw error
      return NextResponse.json({ pdf })
    }

    const { data: pdfs, error } = await supabase
      .from('pdfs_analisados')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ pdfs: pdfs || [] })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Analisar PDF e gerar conteúdo
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const user_id = formData.get('user_id') as string
    const file = formData.get('file') as File
    const opcoes = JSON.parse(formData.get('opcoes') as string || '{}')

    if (!user_id || !file) {
      return NextResponse.json({ error: 'user_id e file são obrigatórios' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
    }

    // Verificar tipo do arquivo
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos' }, { status: 400 })
    }

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
      .select('limite_pdfs_mes, limite_pdf_tamanho_mb')
      .eq('nome', planoNome)
      .single()

    const limitePDFs = plano?.limite_pdfs_mes || 3
    const limiteTamanhoMB = plano?.limite_pdf_tamanho_mb || 50

    // Verificar tamanho do arquivo
    const tamanhoMB = file.size / (1024 * 1024)
    if (tamanhoMB > limiteTamanhoMB) {
      return NextResponse.json({
        error: `Arquivo muito grande. Limite: ${limiteTamanhoMB}MB`,
        tamanho: tamanhoMB.toFixed(2),
        limite: limiteTamanhoMB
      }, { status: 400 })
    }

    // Verificar limite mensal
    const primeiroDiaMes = new Date()
    primeiroDiaMes.setDate(1)
    const mesRef = primeiroDiaMes.toISOString().split('T')[0]

    const { data: usoMes } = await supabase
      .from('uso_mensal')
      .select('quantidade')
      .eq('user_id', user_id)
      .eq('mes_referencia', mesRef)
      .eq('tipo', 'pdfs')
      .maybeSingle()

    const usadoMes = usoMes?.quantidade || 0

    if (limitePDFs !== -1 && usadoMes >= limitePDFs) {
      return NextResponse.json({
        error: 'Limite mensal de PDFs atingido',
        limite: limitePDFs,
        usado: usadoMes
      }, { status: 429 })
    }

    // Converter PDF para base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Extrair texto do PDF usando Gemini Vision
    const extractResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64
                }
              },
              {
                text: `Extraia TODO o texto deste PDF de forma organizada.
Mantenha a estrutura original (títulos, subtítulos, parágrafos, listas).
Identifique e destaque:
- Disciplina/matéria principal
- Assuntos abordados
- Conceitos-chave

Retorne no formato:
DISCIPLINA: [identificada ou "Não identificada"]
ASSUNTOS: [lista separada por vírgula]

CONTEÚDO:
[texto extraído organizado]`
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        })
      }
    )

    if (!extractResponse.ok) {
      const errData = await extractResponse.json()
      console.error('Erro Gemini:', errData)
      return NextResponse.json({ error: 'Erro ao processar PDF' }, { status: 500 })
    }

    const extractData = await extractResponse.json()
    const textoExtraido = extractData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textoExtraido) {
      return NextResponse.json({ error: 'Não foi possível extrair texto do PDF' }, { status: 500 })
    }

    // Parsear disciplina e assuntos
    const disciplinaMatch = textoExtraido.match(/DISCIPLINA:\s*(.+)/i)
    const assuntosMatch = textoExtraido.match(/ASSUNTOS:\s*(.+)/i)
    const conteudoMatch = textoExtraido.match(/CONTEÚDO:\s*([\s\S]+)/i)

    const disciplina = disciplinaMatch?.[1]?.trim() || 'Não identificada'
    const assuntos = assuntosMatch?.[1]?.split(',').map((a: string) => a.trim()) || []
    const conteudo = conteudoMatch?.[1]?.trim() || textoExtraido

    // Salvar PDF no banco
    const { data: pdfSalvo, error: errPdf } = await supabase
      .from('pdfs_analisados')
      .insert({
        user_id,
        nome_arquivo: file.name,
        tamanho_bytes: file.size,
        conteudo_extraido: conteudo.substring(0, 50000),
        disciplinas_detectadas: [disciplina],
        assuntos_detectados: assuntos
      })
      .select()
      .single()

    if (errPdf) throw errPdf

    // Gerar conteúdos solicitados
    const resultados: {
      resumo?: string
      flashcards?: Array<{ frente: string; verso: string }>
      questoes?: Array<{ enunciado: string; gabarito: string; comentario: string }>
    } = {}

    // Gerar Resumo se solicitado
    if (opcoes.resumo) {
      const resumoPrompt = `Baseado no seguinte conteúdo extraído de um PDF, gere um resumo completo e didático para estudos de concursos:

${conteudo.substring(0, 15000)}

REGRAS:
1. Organize em tópicos claros
2. Destaque termos importantes em **negrito**
3. Inclua dicas de memorização
4. Seja conciso mas completo

Gere o resumo:`

      const resumoRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: resumoPrompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 4096 }
          })
        }
      )

      if (resumoRes.ok) {
        const resumoData = await resumoRes.json()
        resultados.resumo = resumoData.candidates?.[0]?.content?.parts?.[0]?.text

        // Salvar resumo
        if (resultados.resumo) {
          await supabase
            .from('resumos_ia')
            .insert({
              user_id,
              pdf_id: pdfSalvo.id,
              titulo: `Resumo: ${file.name}`,
              resumo: resultados.resumo,
              conteudo_original: conteudo.substring(0, 10000),
              disciplina,
              assunto: assuntos[0] || null
            })
        }
      }
    }

    // Gerar Flashcards se solicitado
    if (opcoes.flashcards) {
      const flashcardsPrompt = `Baseado no seguinte conteúdo, gere 10 flashcards para revisão espaçada:

${conteudo.substring(0, 10000)}

REGRAS:
1. Perguntas objetivas e diretas
2. Respostas concisas
3. Foque nos pontos mais importantes

Retorne APENAS um JSON array no formato:
[
  {"frente": "pergunta", "verso": "resposta"},
  ...
]`

      const flashRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: flashcardsPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
          })
        }
      )

      if (flashRes.ok) {
        const flashData = await flashRes.json()
        const flashText = flashData.candidates?.[0]?.content?.parts?.[0]?.text || ''

        try {
          const jsonMatch = flashText.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            resultados.flashcards = JSON.parse(jsonMatch[0])

            // Salvar flashcards no banco (buscar ou criar deck)
            let { data: deck } = await supabase
              .from('decks')
              .select('id')
              .eq('user_id', user_id)
              .eq('nome', `PDF: ${file.name}`)
              .maybeSingle()

            if (!deck) {
              const { data: novoDeck } = await supabase
                .from('decks')
                .insert({
                  user_id,
                  nome: `PDF: ${file.name}`,
                  descricao: `Flashcards gerados do PDF ${file.name}`,
                  cor: '#137fec'
                })
                .select('id')
                .single()
              deck = novoDeck
            }

            if (deck && resultados.flashcards) {
              const cardsParaInserir = resultados.flashcards.map(f => ({
                deck_id: deck.id,
                frente: f.frente,
                verso: f.verso,
                origem: 'ia_pdf'
              }))

              await supabase.from('flashcards').insert(cardsParaInserir)
            }
          }
        } catch (e) {
          console.error('Erro ao parsear flashcards:', e)
        }
      }
    }

    // Gerar Questões se solicitado
    if (opcoes.questoes) {
      const questoesPrompt = `Baseado no seguinte conteúdo, gere 5 questões de múltipla escolha no estilo concursos:

${conteudo.substring(0, 10000)}

Retorne APENAS um JSON array no formato:
[
  {
    "enunciado": "texto da questão",
    "alternativa_a": "opção A",
    "alternativa_b": "opção B",
    "alternativa_c": "opção C",
    "alternativa_d": "opção D",
    "alternativa_e": "opção E",
    "gabarito": "A",
    "comentario": "explicação"
  },
  ...
]`

      const questRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: questoesPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
          })
        }
      )

      if (questRes.ok) {
        const questData = await questRes.json()
        const questText = questData.candidates?.[0]?.content?.parts?.[0]?.text || ''

        try {
          const jsonMatch = questText.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const questoesParsed = JSON.parse(jsonMatch[0])

            // Salvar questões
            const questoesParaInserir = questoesParsed.map((q: {
              enunciado: string
              alternativa_a?: string
              alternativa_b?: string
              alternativa_c?: string
              alternativa_d?: string
              alternativa_e?: string
              gabarito: string
              comentario?: string
            }) => ({
              user_id,
              disciplina,
              assunto: assuntos[0] || null,
              banca: 'IA',
              dificuldade: 'media',
              modalidade: 'multipla_escolha',
              enunciado: q.enunciado,
              alternativa_a: q.alternativa_a,
              alternativa_b: q.alternativa_b,
              alternativa_c: q.alternativa_c,
              alternativa_d: q.alternativa_d,
              alternativa_e: q.alternativa_e,
              gabarito: q.gabarito,
              comentario: q.comentario,
              pdf_origem_id: pdfSalvo.id
            }))

            await supabase.from('questoes_ia_geradas').insert(questoesParaInserir)

            resultados.questoes = questoesParsed
          }
        } catch (e) {
          console.error('Erro ao parsear questões:', e)
        }
      }
    }

    // Atualizar PDF com resultados
    await supabase
      .from('pdfs_analisados')
      .update({
        resumo_gerado: !!resultados.resumo,
        flashcards_gerados: resultados.flashcards?.length || 0,
        questoes_geradas: resultados.questoes?.length || 0
      })
      .eq('id', pdfSalvo.id)

    // Registrar uso mensal
    if (usoMes) {
      await supabase
        .from('uso_mensal')
        .update({ quantidade: usadoMes + 1 })
        .eq('user_id', user_id)
        .eq('mes_referencia', mesRef)
        .eq('tipo', 'pdfs')
    } else {
      await supabase
        .from('uso_mensal')
        .insert({
          user_id,
          mes_referencia: mesRef,
          tipo: 'pdfs',
          quantidade: 1
        })
    }

    // Registrar atividade
    await supabase
      .from('historico_atividades')
      .insert({
        user_id,
        tipo: 'pdf_analisado',
        descricao: `Analisou PDF: ${file.name}`,
        detalhes: {
          pdf_id: pdfSalvo.id,
          resumo: !!resultados.resumo,
          flashcards: resultados.flashcards?.length || 0,
          questoes: resultados.questoes?.length || 0
        }
      })

    return NextResponse.json({
      success: true,
      pdf: pdfSalvo,
      resultados,
      restante: limitePDFs === -1 ? -1 : limitePDFs - usadoMes - 1
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Deletar PDF
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const pdf_id = searchParams.get('pdf_id')
    const user_id = searchParams.get('user_id')

    if (!pdf_id || !user_id) {
      return NextResponse.json({ error: 'pdf_id e user_id são obrigatórios' }, { status: 400 })
    }

    const { error } = await supabase
      .from('pdfs_analisados')
      .delete()
      .eq('id', pdf_id)
      .eq('user_id', user_id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
