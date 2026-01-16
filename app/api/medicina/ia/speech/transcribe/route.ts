import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'Áudio não enviado' }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('Erro na transcrição:', error)
    return NextResponse.json({ error: 'Erro na transcrição' }, { status: 500 })
  }
}
