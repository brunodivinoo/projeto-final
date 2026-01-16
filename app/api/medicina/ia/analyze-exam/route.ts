import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXAM_PROMPTS: Record<string, string> = {
  ecg: `Você é um cardiologista experiente analisando um ECG. Analise sistematicamente:
1. Ritmo (sinusal, FA, flutter, etc.)
2. Frequência cardíaca
3. Eixo elétrico
4. Intervalos (PR, QRS, QT)
5. Alterações de ST-T
6. Sobrecarga de câmaras
7. Conclusão e diagnóstico provável

Seja didático, explicando cada achado para um estudante de medicina.`,

  raio_x: `Você é um radiologista analisando uma radiografia. Analise sistematicamente:
1. Qualidade técnica (penetração, rotação, inspiração)
2. Estruturas ósseas
3. Partes moles
4. Mediastino e silhueta cardíaca
5. Campos pulmonares
6. Seios costofrênicos
7. Conclusão e diagnóstico provável

Seja didático, explicando cada achado para um estudante de medicina.`,

  tc: `Você é um radiologista analisando uma tomografia computadorizada. Analise:
1. Técnica do exame
2. Estruturas anatômicas visíveis
3. Achados normais
4. Achados patológicos
5. Diagnóstico diferencial
6. Conclusão

Seja didático, explicando cada achado para um estudante de medicina.`,

  laboratorio: `Você é um médico analisando exames laboratoriais. Para cada valor:
1. Identifique se está normal, alto ou baixo
2. Explique o significado clínico
3. Correlacione os achados entre si
4. Sugira possíveis diagnósticos
5. Recomende exames complementares se necessário

Seja didático, explicando o raciocínio clínico.`,

  dermatoscopia: `Você é um dermatologista analisando uma imagem. Avalie:
1. Padrão global (reticular, globular, homogêneo, etc.)
2. Simetria
3. Bordas
4. Cores presentes
5. Estruturas (rede pigmentar, glóbulos, estrias, véu azul-esbranquiçado)
6. Critérios ABCDE
7. Conclusão: benigno, suspeito ou maligno

IMPORTANTE: Sempre recomende avaliação presencial com dermatologista.`,

  fundoscopia: `Você é um oftalmologista analisando uma imagem de fundo de olho. Avalie:
1. Disco óptico (cor, bordas, escavação)
2. Vasos retinianos (calibre, cruzamentos)
3. Mácula
4. Retina periférica
5. Achados patológicos
6. Diagnóstico provável

Seja didático, explicando cada achado.`,

  geral: `Você é um médico experiente analisando uma imagem médica.
Descreva detalhadamente o que você observa, identifique achados normais e anormais,
e forneça uma análise educativa que ajude o estudante a aprender.

Se identificar achados preocupantes, recomende sempre avaliação presencial com especialista.`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const image = formData.get('image') as File
    const examType = (formData.get('examType') as string) || 'geral'
    const question = (formData.get('question') as string) || ''
    const userId = formData.get('userId') as string

    if (!image) {
      return NextResponse.json({ error: 'Imagem não enviada' }, { status: 400 })
    }

    // Verificar tamanho (máximo 10MB)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem muito grande. Máximo 10MB.' }, { status: 400 })
    }

    // Verificar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP.' }, { status: 400 })
    }

    // Converter imagem para base64
    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = image.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

    // Montar prompt
    const systemPrompt = EXAM_PROMPTS[examType] || EXAM_PROMPTS.geral
    const userPrompt = question
      ? `Analise esta imagem e responda: ${question}`
      : 'Analise esta imagem detalhadamente.'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
      system: systemPrompt + `

IMPORTANTE: Esta análise é apenas para fins educacionais.
Sempre recomende que o estudante busque orientação de um profissional qualificado para casos reais.
Nunca forneça diagnósticos definitivos sem ressalvas sobre a necessidade de avaliação presencial.`,
    })

    const analysisText = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    return NextResponse.json({
      analysis: analysisText,
      examType,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    })
  } catch (error) {
    console.error('Erro na análise:', error)
    return NextResponse.json({ error: 'Erro ao analisar imagem' }, { status: 500 })
  }
}
