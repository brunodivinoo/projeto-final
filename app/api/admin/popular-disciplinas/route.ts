import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface Assunto {
  nome: string
  subassuntos: string[]
}

interface Disciplina {
  nome: string
  assuntos: Assunto[]
}

export async function POST(req: NextRequest) {
  try {
    const { concurso } = await req.json() as { concurso?: string }

    const prompt = `Você é um especialista em concursos públicos brasileiros com conhecimento atualizado de 2025.

${concurso
  ? `Liste TODAS as disciplinas, assuntos e subassuntos que caem no concurso: ${concurso}`
  : `Liste TODAS as principais disciplinas, assuntos e subassuntos que caem nos concursos públicos do Brasil em 2025.

Inclua concursos de:
- Tribunais (TRF, TRT, TRE, TJ)
- Receita Federal
- Polícias (Federal, Civil, Militar)
- INSS
- Banco do Brasil, Caixa
- Prefeituras e Estados
- Área Fiscal
- Área Jurídica
- Área Administrativa`
}

IMPORTANTE:
- Seja EXTENSIVO, não resuma
- Inclua TODOS os assuntos relevantes de cada disciplina
- Inclua subassuntos quando aplicável
- Use nomenclatura oficial de editais
- Dados atualizados de 2025

DISCIPLINAS OBRIGATÓRIAS (expanda cada uma com seus assuntos):
- Língua Portuguesa
- Raciocínio Lógico
- Matemática Financeira
- Informática
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
- Legislação Específica
- Contabilidade Geral
- Contabilidade Pública
- Auditoria
- Administração Pública
- Administração Geral
- Gestão de Pessoas
- Economia
- Atualidades
- Ética no Serviço Público
- Arquivologia
- Criminologia
- Medicina Legal

RESPONDA EM JSON:
{
  "disciplinas": [
    {
      "nome": "Nome da Disciplina",
      "assuntos": [
        {
          "nome": "Nome do Assunto",
          "subassuntos": ["Subassunto 1", "Subassunto 2"]
        }
      ]
    }
  ]
}

Retorne APENAS o JSON válido, sem markdown ou explicações.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 32768 }
        })
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro na API Gemini' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON
    let resultado: { disciplinas: Disciplina[] }
    try {
      resultado = JSON.parse(text.trim())
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        resultado = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({ error: 'Resposta inválida da IA' }, { status: 500 })
      }
    }

    if (!resultado?.disciplinas) {
      return NextResponse.json({ error: 'Resposta inválida da IA' }, { status: 500 })
    }

    return NextResponse.json({ disciplinas: resultado.disciplinas })
  } catch (error) {
    console.error('Erro ao popular disciplinas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
