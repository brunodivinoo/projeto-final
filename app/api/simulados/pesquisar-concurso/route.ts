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
    const promptPesquisa = `Você é o maior especialista em concursos públicos brasileiros com 30 anos de experiência.

TAREFA CRÍTICA: Pesquise informações COMPLETAS e DETALHADAS sobre:
"${query}"

=== INSTRUÇÕES DETALHADAS ===

1. IDENTIFICAÇÃO DO CONCURSO:
   - Identifique EXATAMENTE qual concurso/cargo/vestibular o usuário quer
   - Se for cargo específico (ex: "Auditor Fiscal"), liste o concurso correto
   - Se for instituição (ex: "Polícia Federal"), liste o cargo mais buscado

2. DISCIPLINAS - SEJA COMPLETO:
   - Liste TODAS as disciplinas cobradas no edital (mínimo 8-15 disciplinas para concursos federais)
   - Para cada disciplina, liste TODOS os assuntos importantes (mínimo 5-10 por disciplina)
   - Para cada assunto, liste os principais subassuntos (3-8 por assunto)

   DISCIPLINAS TÍPICAS DE CONCURSOS (inclua as aplicáveis):
   - Conhecimentos Básicos: Língua Portuguesa, Raciocínio Lógico, Informática, Atualidades, Inglês
   - Direitos: Constitucional, Administrativo, Penal, Processual Penal, Civil, Tributário, Previdenciário
   - Exatas: Matemática Financeira, Estatística, Contabilidade, Economia, AFO
   - Específicas: Legislação Específica, Regimento Interno, Ética no Serviço Público
   - Outras: Administração Pública, Auditoria, Gestão de Pessoas

3. ASSUNTOS POR DISCIPLINA - EXEMPLOS DO NÍVEL DE DETALHE ESPERADO:

   LÍNGUA PORTUGUESA deve incluir:
   - Interpretação de texto (inferência, tipologia textual, gêneros textuais, figuras de linguagem)
   - Gramática (morfologia, sintaxe, concordância, regência, crase, pontuação)
   - Redação Oficial (estrutura, linguagem, tipos de documentos)
   - Semântica (sinônimos, antônimos, polissemia, homonímia)
   - Coesão e Coerência textual

   DIREITO CONSTITUCIONAL deve incluir:
   - Princípios Fundamentais
   - Direitos e Garantias Fundamentais (direitos individuais, sociais, políticos)
   - Organização do Estado (União, Estados, Municípios, DF)
   - Organização dos Poderes (Executivo, Legislativo, Judiciário)
   - Controle de Constitucionalidade
   - Administração Pública (princípios, servidores)
   - Ordem Econômica e Financeira
   - Ordem Social
   - Defesa do Estado e das Instituições Democráticas

   DIREITO ADMINISTRATIVO deve incluir:
   - Princípios da Administração Pública
   - Organização Administrativa (direta, indireta, autarquias, fundações)
   - Atos Administrativos (elementos, atributos, classificação, extinção)
   - Poderes Administrativos (vinculado, discricionário, hierárquico, disciplinar, regulamentar, de polícia)
   - Licitações e Contratos (Lei 14.133/2021)
   - Serviços Públicos
   - Servidores Públicos (regime jurídico, direitos, deveres)
   - Responsabilidade Civil do Estado
   - Controle da Administração
   - Improbidade Administrativa
   - Processo Administrativo

4. ANÁLISE DE TENDÊNCIAS:
   - Mencione os últimos 3 editais/concursos realizados
   - Aponte os assuntos mais cobrados
   - Indique mudanças recentes na legislação que podem cair
   - Dê dicas estratégicas de estudo
   - Mencione o perfil das provas da banca (cespe: certo/errado, fcc: múltipla escolha, etc)

=== FORMATO DE RESPOSTA (JSON) ===
{
  "concurso": {
    "nome": "Nome COMPLETO do concurso/cargo",
    "orgao": "Órgão ou instituição",
    "banca_provavel": "Nome da banca organizadora",
    "ultima_prova": "Ano da última prova ou previsão",
    "link_edital": "URL do edital (ou null)"
  },
  "analise_tendencias": "Análise DETALHADA com 3-5 parágrafos: histórico dos últimos concursos, assuntos mais cobrados pela banca, mudanças legislativas recentes, dicas de estudo, perfil da prova",
  "estrutura": [
    {
      "disciplina": "Nome da Disciplina",
      "peso_estimado": 8,
      "importancia": "alta",
      "assuntos": [
        {
          "nome": "Nome do Assunto",
          "peso": 7,
          "subassuntos": ["Sub1", "Sub2", "Sub3", "Sub4", "Sub5"]
        },
        {
          "nome": "Outro Assunto",
          "peso": 6,
          "subassuntos": ["Sub1", "Sub2", "Sub3"]
        }
      ]
    }
  ]
}

=== REGRAS OBRIGATÓRIAS ===
- MÍNIMO 10 disciplinas para concursos federais, 8 para estaduais, 6 para municipais
- MÍNIMO 5 assuntos por disciplina
- MÍNIMO 3 subassuntos por assunto
- peso_estimado e peso: números de 1 a 10 baseados na importância real
- importancia: "alta" (disciplinas eliminatórias/maior peso), "media" (cobradas), "baixa" (complementares)
- Análise de tendências DEVE ter pelo menos 500 caracteres
- Inclua legislação atualizada (Lei 14.133/2021, reforma administrativa, etc)

Retorne APENAS o JSON, sem markdown ou explicações.`

    // Chamar Gemini com grounding (Google Search)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptPesquisa }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 16384 // Aumentado para respostas mais completas
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
              temperature: 0.4,
              maxOutputTokens: 16384
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
