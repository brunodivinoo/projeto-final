import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface QuestaoSemDisciplina {
  id: string
  enunciado: string
  assunto: string
  subassunto: string | null
}

export async function POST(req: NextRequest) {
  try {
    const { questoes } = await req.json() as { questoes: QuestaoSemDisciplina[] }

    if (!questoes || questoes.length === 0) {
      return NextResponse.json({ error: 'Nenhuma questão fornecida' }, { status: 400 })
    }

    // Montar prompt para análise
    const prompt = `Você é um especialista em concursos públicos brasileiros.

SUA TAREFA: Identificar a DISCIPLINA correta de cada questão baseado no enunciado, assunto e subassunto fornecidos.

REGRAS IMPORTANTES:
1. A disciplina deve ser identificada pelo CONTEÚDO do enunciado, não apenas pelo assunto
2. Use nomes padronizados de editais de concursos
3. NUNCA deixe a disciplina vazia

DISCIPLINAS PADRONIZADAS (use exatamente estes nomes):
- Direito Constitucional
- Direito Administrativo
- Direito Civil
- Direito Penal
- Direito Processual Civil
- Direito Processual Penal
- Direito do Trabalho
- Direito Tributário
- Direito Empresarial
- Direito Previdenciário
- Direito Eleitoral
- Direito Ambiental
- Direitos Humanos
- Legislação Penal Especial
- Língua Portuguesa
- Matemática
- Raciocínio Lógico
- Informática
- Contabilidade
- Administração
- Economia
- Atualidades

DICAS DE IDENTIFICAÇÃO:
- Constituição, CF/88, direitos fundamentais, organização do Estado → Direito Constitucional
- Administração pública, licitação, atos administrativos, servidor público → Direito Administrativo
- Crimes, penas, tipicidade, dolo, culpa, código penal → Direito Penal
- Processo penal, CPP, inquérito, ação penal, citação → Direito Processual Penal
- Processo civil, CPC, petição inicial, contestação, recursos → Direito Processual Civil
- Contratos, obrigações, família, sucessões, código civil → Direito Civil
- CLT, empregado, empregador, trabalhista → Direito do Trabalho
- Tributos, impostos, ICMS, contribuinte → Direito Tributário
- Concordância, regência, ortografia, interpretação de texto → Língua Portuguesa
- Proposições, silogismo, lógica → Raciocínio Lógico

QUESTÕES PARA ANALISAR:
${questoes.map((q, i) => `
[${i + 1}] ID: ${q.id}
Assunto atual: ${q.assunto || 'Não informado'}
Subassunto: ${q.subassunto || 'Não informado'}
ENUNCIADO: ${q.enunciado}
`).join('\n')}

RESPONDA EM JSON:
{
  "sugestoes": [
    {
      "questaoId": "id da questão",
      "disciplinaSugerida": "disciplina identificada",
      "confianca": "alta" | "media" | "baixa",
      "motivo": "breve explicação do porquê desta disciplina"
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
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
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

    if (!resultado?.sugestoes) {
      console.error('Estrutura inválida:', JSON.stringify(resultado).slice(0, 500))
      return NextResponse.json({
        error: 'Resposta da IA com estrutura inválida',
        details: JSON.stringify(resultado).slice(0, 200)
      }, { status: 500 })
    }

    // Enriquecer resultado com dados originais
    const sugestoes = resultado.sugestoes.map((s: {
      questaoId: string
      disciplinaSugerida: string
      confianca: string
      motivo: string
    }) => {
      const questaoOriginal = questoes.find(q => q.id === s.questaoId)

      return {
        questaoId: s.questaoId,
        assuntoAtual: questaoOriginal?.assunto || '',
        subassuntoAtual: questaoOriginal?.subassunto || '',
        enunciado: questaoOriginal?.enunciado || '',
        disciplinaSugerida: s.disciplinaSugerida,
        confianca: s.confianca,
        motivo: s.motivo,
        selecionado: false
      }
    })

    return NextResponse.json({ sugestoes })
  } catch (error) {
    console.error('Erro ao corrigir disciplinas:', error)
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
