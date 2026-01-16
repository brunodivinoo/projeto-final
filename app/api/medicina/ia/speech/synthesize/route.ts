import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const { text, voice = 'nova' } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'Texto não enviado' }, { status: 400 })
    }

    // Limitar texto para não ficar muito caro
    const limitedText = text.slice(0, 4000)

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: limitedText,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Erro na síntese:', error)
    return NextResponse.json({ error: 'Erro na síntese' }, { status: 500 })
  }
}
