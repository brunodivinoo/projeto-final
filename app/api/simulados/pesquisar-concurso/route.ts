import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface DisciplinaEstrutura {
  disciplina: string
  peso_estimado: number
  importancia: 'alta' | 'media' | 'baixa'
  assuntos: Array<{
    nome: string
    peso: number
    subassuntos: string[]
  }>
}

interface ResultadoPesquisa {
  concurso: {
    nome: string
    orgao: string
    banca_provavel: string
    ultima_prova: string
    link_edital?: string
  }
  analise_tendencias: string
  estrutura: DisciplinaEstrutura[]
}

// POST - Pesquisar concurso com Web Search + Gemini
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, query } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: 'Digite pelo menos 3 caracteres para pesquisar' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API de IA não configurada' }, { status: 500 })
    }

    // Verificar se usuário é PRO
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', user_id)
      .single()

    const isPro = profile?.plano?.toLowerCase() === 'pro' ||
                  profile?.plano?.toLowerCase() === 'estuda_pro'

    if (!isPro) {
      return NextResponse.json({
        error: 'Recurso exclusivo para usuários PRO',
        upgrade_required: true
      }, { status: 403 })
    }

    console.log(`[PESQUISAR CONCURSO] Pesquisando: "${query}"`)

    // Passo 1: Usar Gemini com Google Search grounding para buscar informações atualizadas
    const promptPesquisa = `Você é um especialista em concursos públicos brasileiros.

TAREFA: Pesquise informações ATUALIZADAS sobre o seguinte concurso/cargo/instituição:
"${query}"

INSTRUÇÕES:
1. Identifique o concurso ou cargo mais provável que o usuário está buscando
2. Busque informações sobre editais recentes (últimos 3 anos)
3. Identifique as disciplinas cobradas oficialmente
4. Liste os assuntos e subassuntos de cada disciplina
5. Identifique a banca organizadora mais provável
6. Analise tendências dos últimos concursos

FORMATO DE RESPOSTA (JSON estrito):
{
  "concurso": {
    "nome": "Nome completo do concurso ou cargo",
    "orgao": "Órgão ou instituição responsável",
    "banca_provavel": "Nome da banca organizadora mais provável",
    "ultima_prova": "Ano da última prova realizada ou previsão",
    "link_edital": "URL do edital se encontrado (ou null)"
  },
  "analise_tendencias": "Texto descritivo com análise de tendências, assuntos mais cobrados, dicas de estudo baseadas nos últimos concursos (2-4 parágrafos)",
  "estrutura": [
    {
      "disciplina": "Nome da Disciplina",
      "peso_estimado": 8,
      "importancia": "alta",
      "assuntos": [
        {
          "nome": "Nome do Assunto",
          "peso": 7,
          "subassuntos": ["Subassunto 1", "Subassunto 2", "Subassunto 3"]
        }
      ]
    }
  ]
}

REGRAS:
- peso_estimado e peso devem ser números de 1 a 10
- importancia deve ser "alta", "media" ou "baixa"
- Inclua TODAS as disciplinas relevantes para o concurso
- Cada disciplina deve ter pelo menos 3 assuntos
- Cada assunto deve ter pelo menos 2 subassuntos
- A análise deve ser detalhada e útil para o estudante
- Se não encontrar informações específicas, faça estimativas baseadas em concursos similares

Retorne APENAS o JSON, sem markdown ou explicações adicionais.`

    // Chamar Gemini com grounding (Google Search)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptPesquisa }] }],
          generationConfig: {
            temperature: 0.3, // Mais determinístico para dados factuais
            maxOutputTokens: 8192
          },
          // Habilitar Google Search grounding quando disponível
          tools: [{
            googleSearch: {}
          }]
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[PESQUISAR CONCURSO] Erro Gemini:', errorText)

      // Tentar sem grounding se não estiver disponível
      const responseFallback = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptPesquisa }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192
            }
          })
        }
      )

      if (!responseFallback.ok) {
        return NextResponse.json({ error: 'Erro ao pesquisar concurso' }, { status: 500 })
      }

      const dataFallback = await responseFallback.json()
      const textFallback = dataFallback.candidates?.[0]?.content?.parts?.[0]?.text || ''

      const resultado = parseResultado(textFallback)
      if (!resultado) {
        return NextResponse.json({ error: 'Não foi possível processar a pesquisa' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        resultado,
        fonte: 'gemini_conhecimento'
      })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extrair informações de grounding se disponíveis
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata
    const searchQueries = groundingMetadata?.webSearchQueries || []
    const groundingChunks = groundingMetadata?.groundingChunks || []

    console.log('[PESQUISAR CONCURSO] Search queries usadas:', searchQueries)
    console.log('[PESQUISAR CONCURSO] Fontes encontradas:', groundingChunks.length)

    const resultado = parseResultado(text)
    if (!resultado) {
      return NextResponse.json({ error: 'Não foi possível processar a pesquisa' }, { status: 500 })
    }

    // Registrar atividade
    await supabase
      .from('historico_atividades')
      .insert({
        user_id,
        tipo: 'pesquisa_concurso',
        descricao: `Pesquisou: ${query}`,
        detalhes: {
          query,
          concurso_encontrado: resultado.concurso.nome,
          disciplinas: resultado.estrutura.length,
          fontes: groundingChunks.length
        }
      })

    return NextResponse.json({
      success: true,
      resultado,
      fonte: groundingChunks.length > 0 ? 'gemini_web_search' : 'gemini_conhecimento',
      fontes_consultadas: groundingChunks.slice(0, 5).map((chunk: { web?: { uri?: string; title?: string } }) => ({
        url: chunk.web?.uri,
        titulo: chunk.web?.title
      }))
    })

  } catch (error) {
    console.error('[PESQUISAR CONCURSO] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function parseResultado(text: string): ResultadoPesquisa | null {
  try {
    // Tentar parse direto
    const resultado = JSON.parse(text.trim())
    if (validarResultado(resultado)) {
      return resultado
    }
  } catch {
    // Tentar extrair JSON do texto
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const resultado = JSON.parse(jsonMatch[0])
        if (validarResultado(resultado)) {
          return resultado
        }
      } catch {
        console.error('[PESQUISAR CONCURSO] Erro ao fazer parse do JSON extraído')
      }
    }
  }

  console.error('[PESQUISAR CONCURSO] Não foi possível fazer parse do resultado')
  return null
}

function validarResultado(resultado: ResultadoPesquisa): boolean {
  if (!resultado.concurso || !resultado.estrutura) {
    return false
  }

  if (!resultado.concurso.nome || !resultado.concurso.orgao) {
    return false
  }

  if (!Array.isArray(resultado.estrutura) || resultado.estrutura.length === 0) {
    return false
  }

  // Validar estrutura das disciplinas
  for (const disc of resultado.estrutura) {
    if (!disc.disciplina || !Array.isArray(disc.assuntos)) {
      return false
    }
  }

  return true
}
