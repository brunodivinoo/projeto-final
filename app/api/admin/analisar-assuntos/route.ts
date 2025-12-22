import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface QuestaoAnalise {
  id: string
  disciplina: string
  assunto: string
  subassunto: string
  enunciado: string
  comentario: string
}

export async function POST(req: NextRequest) {
  try {
    const { questoes } = await req.json() as { questoes: QuestaoAnalise[] }

    if (!questoes || questoes.length === 0) {
      return NextResponse.json({ error: 'Nenhuma questão fornecida' }, { status: 400 })
    }

    // Buscar assuntos existentes para padronização
    const { data: assuntosExistentes } = await supabase
      .from('assuntos')
      .select('nome, disciplinas(nome)')
      .limit(500)

    const assuntosPadrao = assuntosExistentes?.map(a => ({
      assunto: a.nome,
      disciplina: (a.disciplinas as { nome?: string } | null)?.nome
    })) || []

    // Montar prompt para análise
    const prompt = `Você é um especialista em concursos públicos brasileiros.

SUA TAREFA: Analisar o ENUNCIADO e o COMENTÁRIO de cada questão para identificar a DISCIPLINA, ASSUNTO e SUBASSUNTO corretos.

ESTRUTURA HIERÁRQUICA:
- DISCIPLINA: A matéria/área do conhecimento (ex: "Direito Constitucional", "Português", "Matemática")
- ASSUNTO: Tema genérico de edital, dentro da disciplina (ex: "Direitos Fundamentais", "Concordância Verbal")
- SUBASSUNTO: Detalhamento específico, AQUI pode ter súmulas, jurisprudência, artigos específicos (ex: "Súmula Vinculante 11", "Art. 5º da CF", "Jurisprudência do STJ")

REGRAS PARA DISCIPLINA (OBRIGATÓRIO):
- SEMPRE identifique a disciplina correta baseado no conteúdo do enunciado e comentário
- NUNCA deixe a disciplina vazia ou em branco
- Use nomes padronizados de editais: "Direito Constitucional", "Direito Penal", "Direito Civil", "Direito Administrativo", "Direito Processual Penal", "Direito Processual Civil", "Língua Portuguesa", "Matemática", "Raciocínio Lógico", "Informática", etc.

REGRAS PARA ASSUNTO:
- Deve ser um TEMA GENÉRICO que aparece em editais de concursos
- NO MÁXIMO 3-4 palavras
- NUNCA coloque súmula, STF, STJ, jurisprudência no ASSUNTO
- Exemplos: "Direitos Fundamentais", "Crimes contra a Pessoa", "Atos Administrativos", "Interpretação de Texto"

REGRAS PARA SUBASSUNTO:
- AQUI SIM pode ter detalhes específicos
- Súmulas (ex: "Súmula Vinculante 11", "Súmula 473 STF")
- Jurisprudência (ex: "Jurisprudência STJ sobre Prescrição")
- Artigos específicos (ex: "Art. 37 da CF")
- Ou deixe vazio se não houver detalhamento específico

EXEMPLOS DE CLASSIFICAÇÃO CORRETA:
1. Questão sobre direito à liberdade e Súmula Vinculante 11:
   - Disciplina: "Direito Constitucional"
   - Assunto: "Direitos Fundamentais"
   - Subassunto: "Súmula Vinculante 11 - Uso de Algemas"

2. Questão sobre prescrição com jurisprudência do STJ:
   - Disciplina: "Direito Civil"
   - Assunto: "Prescrição e Decadência"
   - Subassunto: "Jurisprudência STJ"

3. Questão de português sobre concordância:
   - Disciplina: "Língua Portuguesa"
   - Assunto: "Concordância Verbal"
   - Subassunto: ""

Disciplinas e assuntos existentes no sistema:
${assuntosPadrao.slice(0, 50).map(a => `- ${a.disciplina}: ${a.assunto}`).join('\n')}

QUESTÕES PARA ANALISAR:
${questoes.map((q, i) => `
[${i + 1}] ID: ${q.id}
Dados atuais (podem estar errados): Disc: ${q.disciplina} | Assunto: ${q.assunto} | Sub: ${q.subassunto || 'vazio'}
ENUNCIADO COMPLETO: ${q.enunciado}
COMENTÁRIO/GABARITO COMPLETO: ${q.comentario || 'Não disponível'}
`).join('\n')}

RESPONDA EM JSON (TODOS OS CAMPOS SÃO OBRIGATÓRIOS):
{
  "analises": [
    {
      "questaoId": "id da questão",
      "disciplinaSugerida": "OBRIGATÓRIO - disciplina correta (NUNCA deixe vazio)",
      "assuntoSugerido": "assunto genérico de edital",
      "subassuntoSugerido": "detalhamento específico ou string vazia"
    }
  ]
}

IMPORTANTE: O campo "disciplinaSugerida" é OBRIGATÓRIO e NUNCA pode ficar vazio ou nulo!
Retorne APENAS o JSON, sem markdown.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro Gemini:', response.status, errorText)
      return NextResponse.json({
        error: `Erro na API Gemini: ${response.status}`,
        details: errorText
      }, { status: 500 })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!text) {
      console.error('Resposta vazia da Gemini:', JSON.stringify(data))
      return NextResponse.json({
        error: 'Resposta vazia da IA',
        details: data
      }, { status: 500 })
    }

    // Parse JSON - remover markdown se existir
    let resultado
    let cleanText = text.trim()

    // Remover blocos de código markdown (```json ... ``` ou ``` ... ```)
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

    try {
      resultado = JSON.parse(cleanText)
    } catch {
      console.log('Tentando extrair JSON da resposta...')
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          resultado = JSON.parse(jsonMatch[0])
        } catch (e) {
          console.error('Falha ao parsear JSON extraído:', e)
          return NextResponse.json({
            error: 'Erro ao parsear resposta da IA',
            details: cleanText.slice(0, 500)
          }, { status: 500 })
        }
      } else {
        console.error('Nenhum JSON encontrado na resposta:', cleanText.slice(0, 500))
        return NextResponse.json({
          error: 'Resposta da IA não contém JSON válido',
          details: cleanText.slice(0, 500)
        }, { status: 500 })
      }
    }

    if (!resultado?.analises) {
      console.error('Estrutura inválida:', JSON.stringify(resultado).slice(0, 500))
      return NextResponse.json({
        error: 'Resposta da IA com estrutura inválida',
        details: JSON.stringify(resultado).slice(0, 200)
      }, { status: 500 })
    }

    // Log para debug
    console.log('Resposta da IA:', JSON.stringify(resultado.analises[0], null, 2))

    // Enriquecer resultado com dados originais
    const analises = resultado.analises.map((a: {
      questaoId: string
      disciplinaSugerida?: string
      assuntoSugerido: string
      subassuntoSugerido?: string
    }) => {
      const questaoOriginal = questoes.find(q => q.id === a.questaoId)

      // Se a IA não retornou disciplina, tentar extrair do enunciado/comentário
      let disciplina = a.disciplinaSugerida || ''
      if (!disciplina && questaoOriginal) {
        // Fallback: tentar identificar pelo texto
        const texto = ((questaoOriginal.enunciado || '') + ' ' + (questaoOriginal.comentario || '')).toLowerCase()

        // Ordem importa: mais específico primeiro
        if (texto.includes('processo penal') || texto.includes('cpp') || texto.includes('citação por edital') || texto.includes('ação penal')) {
          disciplina = 'Direito Processual Penal'
        } else if (texto.includes('processo civil') || texto.includes('cpc') || texto.includes('petição inicial')) {
          disciplina = 'Direito Processual Civil'
        } else if (texto.includes('direito penal') || texto.includes('crime') || texto.includes('pena') || texto.includes('delito') || texto.includes('condenado') || texto.includes('réu')) {
          disciplina = 'Direito Penal'
        } else if (texto.includes('direito constitucional') || texto.includes('constituição') || texto.includes('cf/88') || texto.includes('súmula vinculante')) {
          disciplina = 'Direito Constitucional'
        } else if (texto.includes('direito civil') || texto.includes('código civil') || texto.includes('contrato') || texto.includes('obrigação')) {
          disciplina = 'Direito Civil'
        } else if (texto.includes('direito administrativo') || texto.includes('administração pública') || texto.includes('servidor público') || texto.includes('licitação')) {
          disciplina = 'Direito Administrativo'
        } else if (texto.includes('direito tributário') || texto.includes('tributo') || texto.includes('imposto')) {
          disciplina = 'Direito Tributário'
        } else if (texto.includes('direito do trabalho') || texto.includes('clt') || texto.includes('trabalhista')) {
          disciplina = 'Direito do Trabalho'
        } else if (texto.includes('stf') || texto.includes('supremo tribunal federal')) {
          // Se menciona STF mas não identificou outra, provavelmente é constitucional
          disciplina = 'Direito Constitucional'
        } else if (texto.includes('stj') || texto.includes('superior tribunal de justiça')) {
          // STJ pode ser várias coisas, mas vamos para Civil como padrão
          disciplina = 'Direito Civil'
        }
      }

      return {
        questaoId: a.questaoId,
        disciplinaAtual: questaoOriginal?.disciplina || '',
        assuntoAtual: questaoOriginal?.assunto || '',
        subassuntoAtual: questaoOriginal?.subassunto || '',
        disciplinaSugerida: disciplina,
        assuntoSugerido: a.assuntoSugerido,
        subassuntoSugerido: a.subassuntoSugerido || '',
        enunciado: questaoOriginal?.enunciado || '',
        selecionado: false
      }
    })

    return NextResponse.json({ analises })
  } catch (error) {
    console.error('Erro ao analisar assuntos:', error)
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
