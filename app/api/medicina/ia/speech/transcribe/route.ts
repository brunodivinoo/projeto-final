import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    // Verificar se a API key existe
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY não configurada')
      return NextResponse.json({ error: 'Configuração de API ausente' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'Áudio não enviado' }, { status: 400 })
    }

    // Verificar tamanho do arquivo (máx 25MB para Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Áudio muito grande (máx 25MB)' }, { status: 400 })
    }

    // Verificar se o arquivo tem conteúdo
    if (audioFile.size < 100) {
      return NextResponse.json({ error: 'Áudio muito curto ou vazio' }, { status: 400 })
    }

    console.log(`Transcrevendo áudio: ${audioFile.name}, tamanho: ${audioFile.size} bytes, tipo: ${audioFile.type}`)

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json',
    })

    console.log(`Transcrição concluída: "${transcription.text}"`)

    if (!transcription.text || transcription.text.trim() === '') {
      return NextResponse.json({
        text: '',
        warning: 'Nenhuma fala detectada no áudio'
      })
    }

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('Erro na transcrição:', error)

    // Verificar tipo de erro
    if (error instanceof Error) {
      if (error.message.includes('Invalid file format')) {
        return NextResponse.json({ error: 'Formato de áudio não suportado' }, { status: 400 })
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ error: 'Limite de requisições atingido. Tente novamente.' }, { status: 429 })
      }
    }

    return NextResponse.json({ error: 'Erro na transcrição. Tente novamente.' }, { status: 500 })
  }
}
