import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

export async function POST(req: NextRequest) {
  try {
    const { prompt, type } = await req.json()

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
    }

    const systemPrompts: Record<string, string> = {
      questoes: 'Você é um professor especialista em criar questões de vestibular. Gere questões no formato: QUESTÃO: [pergunta]\nA) [opção]\nB) [opção]\nC) [opção]\nD) [opção]\nE) [opção]\nRESPOSTA: [letra]\nEXPLICAÇÃO: [explicação breve]',
      resumo: 'Você é um especialista em criar resumos concisos e didáticos. Organize o conteúdo em tópicos principais com bullet points.',
      flashcards: 'Gere flashcards no formato JSON: [{"frente": "pergunta", "verso": "resposta"}]. Retorne apenas o JSON.',
      chat: 'Você é um tutor educacional amigável. Responda de forma clara e didática, usando exemplos quando necessário.',
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompts[type] || systemPrompts.chat}\n\nUsuário: ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API Error:', error)
      return NextResponse.json({ error: 'Erro na API do Gemini' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta'

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
