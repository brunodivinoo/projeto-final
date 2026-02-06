import { NextRequest, NextResponse } from 'next/server'

// Kokoro TTS via HuggingFace Space API (gratuito)
// Vozes pt-BR: pf_dora (feminina), pm_alex (masculino), pm_santa (masculino)
const KOKORO_GRADIO_URL = 'https://hexgrad-kokoro-tts.hf.space/call/generate_all'

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'pf_dora', speed = 1.0 } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'Texto não enviado' }, { status: 400 })
    }

    // Limitar e preparar texto
    const cleanText = prepareTextForTTS(text.slice(0, 3000))

    if (!cleanText.trim()) {
      return NextResponse.json({ error: 'Texto vazio após limpeza' }, { status: 400 })
    }

    // Tentar Kokoro via Gradio API
    try {
      const audio = await callKokoroGradio(cleanText, voice, speed)
      if (audio) {
        return new NextResponse(new Uint8Array(audio), {
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Length': audio.length.toString(),
          },
        })
      }
    } catch (e) {
      console.error('[TTS] Kokoro falhou:', e)
    }

    // Fallback: sinalizar para usar Web Speech API no cliente
    return NextResponse.json({
      fallback: true,
      text: cleanText,
      message: 'Usar síntese local'
    })

  } catch (error) {
    console.error('[TTS] Erro na síntese:', error)
    return NextResponse.json({ error: 'Erro na síntese' }, { status: 500 })
  }
}

async function callKokoroGradio(text: string, voice: string, speed: number): Promise<Buffer | null> {
  // Step 1: Submeter
  const submitRes = await fetch(KOKORO_GRADIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [text, voice, speed] }),
    signal: AbortSignal.timeout(30000)
  })

  if (!submitRes.ok) throw new Error(`Gradio submit: ${submitRes.status}`)

  const { event_id } = await submitRes.json()
  if (!event_id) throw new Error('Sem event_id')

  // Step 2: Buscar resultado via SSE
  const resultRes = await fetch(
    `https://hexgrad-kokoro-tts.hf.space/call/generate_all/${event_id}`,
    { signal: AbortSignal.timeout(60000) }
  )

  if (!resultRes.ok) throw new Error(`Gradio result: ${resultRes.status}`)

  const resultText = await resultRes.text()
  const lines = resultText.split('\n')

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('event: complete')) {
      const dataLine = lines[i + 1]
      if (dataLine?.startsWith('data: ')) {
        const data = JSON.parse(dataLine.slice(6))
        if (data[0]?.url) {
          const audioRes = await fetch(data[0].url)
          return Buffer.from(await audioRes.arrayBuffer())
        }
      }
    }
  }

  return null
}

// Preparar texto para TTS - remover markdown/código/artefatos
function prepareTextForTTS(text: string): string {
  let clean = text

  // Substituir blocos de código por descrições faladas
  clean = clean.replace(/```[\s\S]*?```/g, (match) => {
    if (match.includes('```questao')) return 'Aqui tem um deck de questão que você pode clicar para ver na lateral. '
    if (match.includes('```flashcard')) return 'Aqui tem um deck de flashcards que você pode clicar para estudar. '
    if (match.includes('```mermaid')) return 'Aqui tem um diagrama que você pode clicar para ver na lateral. '
    return ''
  })

  // Remover formatação markdown
  clean = clean.replace(/#{1,6}\s+/g, '')
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1')
  clean = clean.replace(/\*([^*]+)\*/g, '$1')
  clean = clean.replace(/`([^`]+)`/g, '$1')
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, 'Aqui tem uma imagem: $1. ')

  // Tabelas -> descrição
  clean = clean.replace(/\|[^\n]+\|[\s\S]*?\n(?=\n|$)/g, 'Aqui tem uma tabela com informações relevantes. ')

  // Limpar bullets e numeração
  clean = clean.replace(/^[\s]*[-*+]\s+/gm, '')
  clean = clean.replace(/^[\s]*\d+\.\s+/gm, '')

  // Limpar linhas vazias e emojis
  clean = clean.replace(/\n{3,}/g, '\n\n')
  clean = clean.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')

  return clean.trim()
}
