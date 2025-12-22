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

Analise as questões abaixo e sugira o ASSUNTO correto para cada uma, baseado no enunciado e comentário.

IMPORTANTE:
- Use assuntos PADRONIZADOS que existem em editais de concursos
- NÃO use números de súmulas como assunto (ex: "Súmula 123" é errado)
- NÃO use termos técnicos muito específicos
- Use nomes de assuntos genéricos e reconhecíveis

Assuntos existentes no sistema (use preferencialmente estes):
${assuntosPadrao.slice(0, 100).map(a => `- ${a.disciplina}: ${a.assunto}`).join('\n')}

QUESTÕES PARA ANALISAR:
${questoes.map((q, i) => `
---QUESTÃO ${i + 1}---
ID: ${q.id}
Disciplina: ${q.disciplina}
Assunto Atual: ${q.assunto}
Enunciado: ${q.enunciado.slice(0, 500)}
Comentário: ${(q.comentario || '').slice(0, 300)}
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
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
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

    // Parse JSON
    let resultado
    try {
      resultado = JSON.parse(text.trim())
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        resultado = JSON.parse(jsonMatch[0])
      }
    }

    if (!resultado?.analises) {
      return NextResponse.json({ error: 'Resposta inválida da IA' }, { status: 500 })
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
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
