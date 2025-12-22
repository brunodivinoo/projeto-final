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

Analise as questões abaixo e sugira o ASSUNTO correto para cada uma, baseado no enunciado e na disciplina.

REGRAS OBRIGATÓRIAS:
1. O assunto deve ser um TEMA/TÓPICO que aparece em editais de concursos
2. Considere a DISCIPLINA da questão para sugerir assuntos apropriados
3. O assunto deve ter NO MÁXIMO 3-4 palavras
4. Retorne APENAS o nome do assunto, sem incluir a disciplina
5. NUNCA mantenha assuntos com palavras como: "súmula", "STF", "STJ", "processada", "jurisprudência", "repercussão", "para revisao", "geral"

EXEMPLOS POR DISCIPLINA:
- Direito Constitucional: "Direitos Fundamentais", "Organização do Estado", "Controle de Constitucionalidade"
- Direito Administrativo: "Atos Administrativos", "Licitações", "Servidores Públicos"
- Direito Penal: "Crimes contra a Pessoa", "Crimes contra o Patrimônio", "Teoria do Crime"
- Direito Civil: "Contratos", "Responsabilidade Civil", "Direito das Obrigações"
- Português: "Interpretação de Texto", "Concordância Verbal", "Regência", "Pontuação"
- Matemática: "Porcentagem", "Razão e Proporção", "Equações", "Geometria"
- Raciocínio Lógico: "Lógica Proposicional", "Sequências", "Análise Combinatória"
- Informática: "Sistemas Operacionais", "Redes de Computadores", "Segurança da Informação"
- Contabilidade: "Balanço Patrimonial", "DRE", "Análise de Balanços"

CORREÇÕES ESPERADAS:
- "sumulas stf processadas" → use o tema real (ex: "Direitos Fundamentais")
- "jurisprudencia stj" → use o tema real (ex: "Prescrição")
- "sumulas para revisao" → use o tema real (ex: "Competência")
- "repercussao geral" → use o tema real (ex: "Tributos em Espécie")

Assuntos já existentes no sistema (use preferencialmente se aplicável):
${assuntosPadrao.slice(0, 50).map(a => `- ${a.assunto}`).join('\n')}

QUESTÕES PARA ANALISAR:
${questoes.map((q, i) => `
[${i + 1}] ID: ${q.id}
Disciplina: ${q.disciplina} | Assunto atual: ${q.assunto}
Enunciado: ${q.enunciado.slice(0, 300)}
`).join('\n')}

RESPONDA EM JSON:
{
  "analises": [
    {
      "questaoId": "id da questão",
      "assuntoSugerido": "nome do assunto correto"
    }
  ]
}

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

    // Enriquecer resultado com dados originais
    const analises = resultado.analises.map((a: { questaoId: string; assuntoSugerido: string }) => {
      const questaoOriginal = questoes.find(q => q.id === a.questaoId)
      return {
        questaoId: a.questaoId,
        disciplinaAtual: questaoOriginal?.disciplina || '',
        assuntoAtual: questaoOriginal?.assunto || '',
        subassuntoAtual: questaoOriginal?.subassunto || '',
        assuntoSugerido: a.assuntoSugerido,
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
