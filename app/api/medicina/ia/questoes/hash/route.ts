import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// POST - Calcular hash de enunciado (para matching client-side)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enunciado } = body

    if (!enunciado) {
      return NextResponse.json({ error: 'enunciado é obrigatório' }, { status: 400 })
    }

    const hash = crypto.createHash('md5').update(enunciado.trim().toLowerCase()).digest('hex').substring(0, 16)

    return NextResponse.json({ hash })
  } catch (error) {
    console.error('Erro ao calcular hash:', error)
    return NextResponse.json({ error: 'Erro ao calcular hash' }, { status: 500 })
  }
}

// GET - Calcular hash de múltiplos enunciados
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const enunciados = searchParams.get('enunciados')

  if (!enunciados) {
    return NextResponse.json({ error: 'enunciados é obrigatório (JSON array)' }, { status: 400 })
  }

  try {
    const enunciadosArray = JSON.parse(enunciados) as string[]
    const hashes: Record<string, string> = {}

    for (const e of enunciadosArray) {
      const hash = crypto.createHash('md5').update(e.trim().toLowerCase()).digest('hex').substring(0, 16)
      hashes[e] = hash
    }

    return NextResponse.json({ hashes })
  } catch (error) {
    console.error('Erro ao calcular hashes:', error)
    return NextResponse.json({ error: 'Erro ao calcular hashes' }, { status: 500 })
  }
}
