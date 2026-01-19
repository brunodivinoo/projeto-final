/**
 * Serviço de Anotação de Imagens Médicas
 *
 * FLUXO:
 * 1. DALL-E 3 gera imagem ultra-realista SEM texto
 * 2. Este serviço usa Claude/GPT-4 Vision para:
 *    - Analisar a imagem
 *    - Identificar estruturas
 *    - Gerar coordenadas de anotações
 * 3. Frontend renderiza as anotações via CSS/Canvas
 *
 * Isso separa a geração visual (DALL-E) da anotação inteligente (Claude/GPT-4)
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ============================================
// TIPOS
// ============================================

export interface ImageAnnotation {
  id: string
  label: string // Texto da legenda (em português)
  labelEn?: string // Texto em inglês (opcional)
  position: {
    x: number // Porcentagem (0-100) da posição X
    y: number // Porcentagem (0-100) da posição Y
  }
  // Opcional: linha de conexão para a estrutura
  pointer?: {
    x: number
    y: number
  }
  color?: string // Cor sugerida para a anotação
  importance?: 'primary' | 'secondary' | 'tertiary'
}

export interface AnnotatedImage {
  originalUrl: string
  annotations: ImageAnnotation[]
  description: string // Descrição geral da imagem
  structures: string[] // Lista de estruturas identificadas
}

export interface AnnotateImageRequest {
  imageUrl: string
  imageType: 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram'
  context?: string // Contexto adicional (ex: "músculo do braço")
  maxAnnotations?: number
  language?: 'pt' | 'en' | 'both'
}

// ============================================
// FUNÇÃO PRINCIPAL DE ANOTAÇÃO
// ============================================

/**
 * Analisa uma imagem médica e gera anotações inteligentes
 * Usa Claude Vision para identificar estruturas e posições
 */
export async function annotateImage(
  request: AnnotateImageRequest
): Promise<AnnotatedImage> {
  const {
    imageUrl,
    imageType,
    context,
    maxAnnotations = 10,
    language = 'pt',
  } = request

  console.log('[Annotation] Analisando imagem para anotações...')
  console.log('[Annotation] Tipo:', imageType)
  console.log('[Annotation] Contexto:', context)

  // Prompt para Claude Vision analisar a imagem
  const analysisPrompt = buildAnnotationPrompt(imageType, context, maxAnnotations, language)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: analysisPrompt,
            },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Resposta inválida do Claude')
    }

    // Extrair JSON da resposta
    const jsonMatch = content.text.match(/```json\n?([\s\S]*?)\n?```/)
    if (!jsonMatch) {
      console.error('[Annotation] JSON não encontrado na resposta')
      throw new Error('Formato de resposta inválido')
    }

    const result = JSON.parse(jsonMatch[1]) as {
      description: string
      structures: string[]
      annotations: ImageAnnotation[]
    }

    console.log('[Annotation] Anotações geradas:', result.annotations.length)

    return {
      originalUrl: imageUrl,
      annotations: result.annotations,
      description: result.description,
      structures: result.structures,
    }
  } catch (error) {
    console.error('[Annotation] Erro na anotação:', error)
    throw error
  }
}

// ============================================
// CONSTRUÇÃO DO PROMPT
// ============================================

function buildAnnotationPrompt(
  imageType: string,
  context: string | undefined,
  maxAnnotations: number,
  language: string
): string {
  const languageInstructions = {
    pt: 'Todos os labels devem estar em PORTUGUÊS DO BRASIL.',
    en: 'All labels must be in ENGLISH.',
    both: 'Forneça labels em português (label) e inglês (labelEn).',
  }

  const typeInstructions: Record<string, string> = {
    anatomy: `
Esta é uma imagem ANATÔMICA. Identifique:
- Músculos (com nomes anatômicos corretos)
- Ossos e estruturas ósseas
- Artérias e veias principais
- Nervos importantes
- Órgãos visíveis
- Ligamentos e tendões
    `,
    histology: `
Esta é uma lâmina HISTOLÓGICA. Identifique:
- Tipos celulares visíveis
- Estruturas teciduais
- Núcleos e citoplasma característicos
- Matriz extracelular
- Organização tecidual
    `,
    radiology: `
Esta é uma imagem RADIOLÓGICA. Identifique:
- Estruturas ósseas
- Órgãos visíveis
- Espaços aéreos
- Achados normais ou anormais
- Referências anatômicas
    `,
    pathology: `
Esta é uma imagem de PATOLOGIA. Identifique:
- Lesões visíveis
- Tecido normal vs alterado
- Características patológicas
- Estruturas anatômicas afetadas
    `,
    diagram: `
Este é um DIAGRAMA médico. Identifique:
- Elementos principais do fluxo
- Processos representados
- Conexões importantes
- Estruturas esquematizadas
    `,
  }

  return `
Você é um especialista em anatomia médica e educação em saúde.
Analise esta imagem médica e identifique as estruturas importantes para anotação.

${typeInstructions[imageType] || typeInstructions.anatomy}

${context ? `CONTEXTO ADICIONAL: ${context}` : ''}

${languageInstructions[language as keyof typeof languageInstructions]}

INSTRUÇÕES DE POSICIONAMENTO:
- As coordenadas X e Y são em PORCENTAGEM (0-100)
- X=0 é a borda esquerda, X=100 é a borda direita
- Y=0 é o topo, Y=100 é a parte inferior
- Posicione os labels PRÓXIMOS às estruturas, mas sem sobrepor
- Para estruturas no centro, use x entre 30-70
- Evite colocar labels nas bordas extremas

RESPONDA APENAS COM JSON no seguinte formato:
\`\`\`json
{
  "description": "Descrição breve da imagem",
  "structures": ["lista", "de", "estruturas", "identificadas"],
  "annotations": [
    {
      "id": "1",
      "label": "Nome da Estrutura",
      ${language === 'both' ? '"labelEn": "Structure Name",' : ''}
      "position": { "x": 50, "y": 30 },
      "pointer": { "x": 45, "y": 35 },
      "color": "#FF0000",
      "importance": "primary"
    }
  ]
}
\`\`\`

Limite: máximo ${maxAnnotations} anotações.
Priorize as estruturas mais importantes para aprendizado médico.
Use cores diferentes para categorias diferentes:
- Vermelho (#E53935) para artérias
- Azul (#1E88E5) para veias
- Amarelo (#FDD835) para nervos
- Verde (#43A047) para músculos
- Branco (#FFFFFF) para ossos
- Rosa (#EC407A) para órgãos
  `.trim()
}

// ============================================
// COMPONENTE DE OVERLAY (para o frontend)
// ============================================

/**
 * Gera CSS para overlay de anotações
 * O frontend pode usar isso para posicionar labels
 */
export function generateAnnotationCSS(annotations: ImageAnnotation[]): string {
  return annotations
    .map(
      (ann, i) => `
.annotation-${ann.id} {
  position: absolute;
  left: ${ann.position.x}%;
  top: ${ann.position.y}%;
  transform: translate(-50%, -50%);
  color: ${ann.color || '#FFFFFF'};
  font-size: ${ann.importance === 'primary' ? '14px' : '12px'};
  font-weight: ${ann.importance === 'primary' ? 'bold' : 'normal'};
  text-shadow: 0 0 3px #000, 0 0 5px #000;
  z-index: ${100 - i};
  pointer-events: none;
}
    `.trim()
    )
    .join('\n\n')
}

/**
 * Gera dados para SVG overlay
 * Útil para desenhar linhas de conexão
 */
export function generateSVGData(annotations: ImageAnnotation[]): string {
  const lines = annotations
    .filter((ann) => ann.pointer)
    .map(
      (ann) => `
<line
  x1="${ann.position.x}%"
  y1="${ann.position.y}%"
  x2="${ann.pointer!.x}%"
  y2="${ann.pointer!.y}%"
  stroke="${ann.color || '#FFFFFF'}"
  stroke-width="1"
  opacity="0.8"
/>
    `.trim()
    )
    .join('\n')

  return `
<svg class="annotation-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
  ${lines}
</svg>
  `.trim()
}
