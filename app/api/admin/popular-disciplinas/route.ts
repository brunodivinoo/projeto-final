import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface Assunto {
  nome: string
  subassuntos: string[]
}

interface Disciplina {
  nome: string
  assuntos: Assunto[]
}

// Mapeamento de disciplinas similares para nome padrão
const DISCIPLINAS_PADRAO: Record<string, string> = {
  // Raciocínio Lógico
  'raciocinio logico': 'Raciocínio Lógico-Matemático',
  'raciocinio logico matematico': 'Raciocínio Lógico-Matemático',
  'raciocinio logico-matematico': 'Raciocínio Lógico-Matemático',
  'raciocinio logico e matematico': 'Raciocínio Lógico-Matemático',
  'raciocinio logico e matematica': 'Raciocínio Lógico-Matemático',
  'logica': 'Raciocínio Lógico-Matemático',
  'matematica e raciocinio logico': 'Raciocínio Lógico-Matemático',

  // Português
  'lingua portuguesa': 'Língua Portuguesa',
  'portugues': 'Língua Portuguesa',
  'gramatica': 'Língua Portuguesa',
  'interpretacao de texto': 'Língua Portuguesa',

  // Informática
  'informatica': 'Informática',
  'nocoes de informatica': 'Informática',
  'tecnologia da informacao': 'Informática',
  'informatica basica': 'Informática',

  // Direito Constitucional
  'direito constitucional': 'Direito Constitucional',
  'nocoes de direito constitucional': 'Direito Constitucional',

  // Direito Administrativo
  'direito administrativo': 'Direito Administrativo',
  'nocoes de direito administrativo': 'Direito Administrativo',

  // Direito Penal
  'direito penal': 'Direito Penal',
  'nocoes de direito penal': 'Direito Penal',

  // Direito Processual Penal
  'direito processual penal': 'Direito Processual Penal',
  'nocoes de direito processual penal': 'Direito Processual Penal',
  'processo penal': 'Direito Processual Penal',

  // Direito Civil
  'direito civil': 'Direito Civil',
  'nocoes de direito civil': 'Direito Civil',

  // Direito Processual Civil
  'direito processual civil': 'Direito Processual Civil',
  'nocoes de direito processual civil': 'Direito Processual Civil',
  'processo civil': 'Direito Processual Civil',

  // Contabilidade
  'contabilidade': 'Contabilidade',
  'nocoes de contabilidade': 'Contabilidade',
  'contabilidade geral': 'Contabilidade',
  'contabilidade basica': 'Contabilidade',

  // Direito Tributário
  'direito tributario': 'Direito Tributário',
  'nocoes de direito tributario': 'Direito Tributário',
  'legislacao tributaria': 'Direito Tributário',

  // Direito Financeiro
  'direito financeiro': 'Direito Financeiro',
  'nocoes de direito financeiro': 'Direito Financeiro',
  'direito financeiro e tributario': 'Direito Financeiro e Tributário',
  'nocoes de direito financeiro e tributario': 'Direito Financeiro e Tributário',

  // AFO
  'administracao financeira e orcamentaria': 'Administração Financeira e Orçamentária',
  'afo': 'Administração Financeira e Orçamentária',
  'orcamento publico': 'Administração Financeira e Orçamentária',

  // Administração
  'administracao': 'Administração',
  'administracao geral': 'Administração',
  'nocoes de administracao': 'Administração',
  'administracao publica': 'Administração Pública',
  'nocoes de administracao publica': 'Administração Pública',

  // Economia
  'economia': 'Economia',
  'nocoes de economia': 'Economia',
  'economia brasileira': 'Economia',

  // Atualidades
  'atualidades': 'Atualidades',
  'conhecimentos gerais': 'Atualidades',
  'atualidades e conhecimentos gerais': 'Atualidades',

  // Ética
  'etica': 'Ética no Serviço Público',
  'etica no servico publico': 'Ética no Serviço Público',
  'etica publica': 'Ética no Serviço Público',

  // Arquivologia
  'arquivologia': 'Arquivologia',
  'nocoes de arquivologia': 'Arquivologia',
  'arquivo': 'Arquivologia',

  // Legislação Especial
  'legislacao penal especial': 'Legislação Penal Especial',
  'leis penais especiais': 'Legislação Penal Especial',
  'legislacao especial': 'Legislação Penal Especial'
}

// Função para normalizar nome (remover acentos, lowercase, remover sufixos de cargo)
function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ')
    .trim()
}

// Disciplinas que devem ser mantidas como estão (específicas de estado/região)
const DISCIPLINAS_ESPECIFICAS_PERMITIDAS = [
  'legislacao especifica',
  'historia de',
  'geografia de',
  'realidade',
  'legislacao estadual',
  'legislacao municipal',
  'direito estadual',
  'direito municipal',
  'estatuto da',
  'lei organica',
  'regimento interno'
]

// Função para verificar se é uma disciplina específica permitida
function isDisciplinaEspecificaPermitida(nome: string): boolean {
  const nomeNorm = normalizarNome(nome)
  return DISCIPLINAS_ESPECIFICAS_PERMITIDAS.some(padrao => nomeNorm.includes(padrao))
}

// Função para remover sufixos de cargo do nome da disciplina
function removerSufixosCargo(nome: string): string {
  // Se for disciplina específica permitida (ex: "História de Goiás"), manter como está
  if (isDisciplinaEspecificaPermitida(nome)) {
    return nome.trim()
  }

  // Padrões para remover: "(para Delegado)", "(para Agente, ocasionalmente)", etc.
  const padroes = [
    /\s*\(para\s+[^)]+\)\s*/gi,
    /\s*\(ocasionalmente\)\s*/gi,
    /\s*-\s*para\s+.+$/gi,
    /\s+para\s+(delegado|agente|escriv[aã]o|perito|analista|t[eé]cnico|auditor|fiscal|procurador|defensor)/gi
  ]

  let resultado = nome
  for (const padrao of padroes) {
    resultado = resultado.replace(padrao, '')
  }

  return resultado.trim()
}

// Função para padronizar nome da disciplina
function padronizarDisciplina(nome: string): string {
  // Se for disciplina específica permitida, manter o nome original
  if (isDisciplinaEspecificaPermitida(nome)) {
    return nome.trim()
  }

  // Remover sufixos de cargo
  const semSufixo = removerSufixosCargo(nome)

  // Normalizar para busca no mapeamento
  const normalizado = normalizarNome(semSufixo)

  // Verificar se existe no mapeamento
  if (DISCIPLINAS_PADRAO[normalizado]) {
    return DISCIPLINAS_PADRAO[normalizado]
  }

  // Verificar se começa com alguma chave do mapeamento
  for (const [chave, valor] of Object.entries(DISCIPLINAS_PADRAO)) {
    if (normalizado.startsWith(chave) || normalizado.includes(chave)) {
      return valor
    }
  }

  // Se não encontrar, retornar o nome limpo (sem sufixo de cargo)
  return semSufixo
}

// Função para mesclar disciplinas duplicadas
function mesclarDisciplinas(disciplinas: Disciplina[]): Disciplina[] {
  const mapa = new Map<string, Disciplina>()

  for (const disc of disciplinas) {
    const nomePadrao = padronizarDisciplina(disc.nome)
    const chave = normalizarNome(nomePadrao)

    if (mapa.has(chave)) {
      // Mesclar assuntos
      const existente = mapa.get(chave)!

      for (const assunto of disc.assuntos || []) {
        const assuntoNorm = normalizarNome(assunto.nome)
        const assuntoExistente = existente.assuntos.find(
          a => normalizarNome(a.nome) === assuntoNorm
        )

        if (assuntoExistente) {
          // Mesclar subassuntos
          const subExistentes = new Set(
            assuntoExistente.subassuntos.map(s => normalizarNome(s))
          )
          for (const sub of assunto.subassuntos || []) {
            if (!subExistentes.has(normalizarNome(sub))) {
              assuntoExistente.subassuntos.push(sub)
            }
          }
        } else {
          // Adicionar assunto novo
          existente.assuntos.push(assunto)
        }
      }
    } else {
      // Nova disciplina com nome padronizado
      mapa.set(chave, {
        nome: nomePadrao,
        assuntos: disc.assuntos || []
      })
    }
  }

  // Ordenar por nome
  return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome))
}

export async function POST(req: NextRequest) {
  try {
    const { concurso } = await req.json() as { concurso?: string }

    let prompt: string

    if (concurso) {
      // Prompt específico para um concurso
      prompt = `Você é um especialista em concursos públicos brasileiros com conhecimento COMPLETO e ATUALIZADO de 2025.

TAREFA: Liste TODAS as disciplinas, assuntos e subassuntos que caem no concurso: "${concurso}"

REGRA CRÍTICA DE NOMENCLATURA:
- NÃO inclua nome de cargo no nome da disciplina!
- ERRADO: "Noções de Contabilidade (para Delegado)" ou "Direito Penal para Agente"
- CERTO: "Contabilidade" ou "Direito Penal"
- Quando houver disciplina específica de cargo, apenas inclua os assuntos relevantes na disciplina BASE
- Use SEMPRE nomes GENÉRICOS e PADRONIZADOS

PADRONIZAÇÃO OBRIGATÓRIA:
- "Raciocínio Lógico-Matemático" (não "Raciocínio Lógico e Matemática")
- "Língua Portuguesa" (não "Português")
- "Informática" (não "Noções de Informática")
- "Direito Constitucional" (não "Noções de Direito Constitucional")
- "Contabilidade" (não "Noções de Contabilidade")

INSTRUÇÕES:
1. Considere TODOS os cargos, mas NÃO crie disciplinas separadas por cargo
2. Mescle todos os assuntos de todos os cargos na disciplina correspondente
3. Para cada disciplina, liste TODOS os assuntos que aparecem nos editais
4. Para cada assunto, liste os subassuntos/tópicos detalhados
5. NÃO resuma - seja EXTENSIVO

EXEMPLO:
Se Delegado tem "Direito Penal Especial" e Agente tem "Noções de Direito Penal":
- Crie UMA disciplina "Direito Penal" com TODOS os assuntos de ambos os cargos

RESPONDA EM JSON:
{
  "disciplinas": [
    {
      "nome": "Nome Padronizado da Disciplina",
      "assuntos": [
        {
          "nome": "Nome do Assunto",
          "subassuntos": ["Subassunto 1", "Subassunto 2", "Subassunto 3"]
        }
      ]
    }
  ]
}

REGRAS:
- Mínimo de 15 disciplinas
- Cada disciplina deve ter pelo menos 5-10 assuntos
- Cada assunto deve ter pelo menos 3-5 subassuntos quando aplicável
- NUNCA inclua "(para X)" ou "para Y" no nome da disciplina
- Retorne APENAS o JSON válido, sem markdown ou explicações`

    } else {
      // Prompt geral para todos os concursos
      prompt = `Você é um especialista em concursos públicos brasileiros com conhecimento COMPLETO e ATUALIZADO de 2025.

TAREFA: Liste TODAS as disciplinas, assuntos e subassuntos que caem nos principais concursos públicos do Brasil.

CONSIDERE OS SEGUINTES CONCURSOS:
- Tribunais (TRF, TRT, TRE, TJ, STF, STJ, TST, TSE)
- Receita Federal, PGFN, TCU, CGU
- Polícia Federal, Polícia Rodoviária Federal, Polícias Civis e Militares
- INSS, IBGE, FUNAI
- Banco do Brasil, Caixa Econômica, BNDES
- Banco Central, CVM, SUSEP
- Prefeituras e Estados (todas as áreas)
- Área Fiscal (Auditor, AFRFB, Fiscal de tributos)
- Área Jurídica (Procurador, Defensor, Juiz, Promotor)
- Área Administrativa (Técnico, Analista)
- Área de TI (Analista de Sistemas, Desenvolvedor)
- Área de Saúde (Enfermeiro, Médico, Técnico)

DISCIPLINAS OBRIGATÓRIAS (expanda CADA UMA com TODOS os assuntos):

CONHECIMENTOS BÁSICOS:
- Língua Portuguesa (Interpretação, Gramática, Redação Oficial)
- Raciocínio Lógico e Matemático
- Matemática Financeira
- Estatística
- Informática e Tecnologia da Informação
- Atualidades e Conhecimentos Gerais
- Ética no Serviço Público

DIREITO:
- Direito Constitucional (COMPLETO)
- Direito Administrativo (COMPLETO com Lei 14.133/2021)
- Direito Civil (Parte Geral, Obrigações, Contratos, Família, Sucessões)
- Direito Processual Civil (Novo CPC completo)
- Direito Penal (Parte Geral e Especial)
- Direito Processual Penal (CPP completo)
- Direito do Trabalho
- Direito Processual do Trabalho
- Direito Tributário
- Direito Empresarial/Comercial
- Direito Previdenciário
- Direito Eleitoral
- Direito Ambiental
- Direito Internacional
- Direitos Humanos
- Legislação Penal Especial

CONTABILIDADE E FINANÇAS:
- Contabilidade Geral/Societária
- Contabilidade Pública/Governamental
- Contabilidade de Custos
- Análise de Demonstrações Contábeis
- Auditoria
- Orçamento Público
- Administração Financeira e Orçamentária (AFO)

ADMINISTRAÇÃO:
- Administração Geral
- Administração Pública
- Gestão de Pessoas
- Gestão de Projetos
- Gestão de Processos
- Planejamento Estratégico

ECONOMIA:
- Microeconomia
- Macroeconomia
- Economia Brasileira
- Economia do Setor Público
- Finanças Públicas

OUTRAS:
- Arquivologia
- Biblioteconomia
- Criminologia
- Medicina Legal
- Segurança Pública

INSTRUÇÕES:
1. Para CADA disciplina, liste TODOS os assuntos relevantes (mínimo 8-15 assuntos por disciplina)
2. Para CADA assunto, liste os subassuntos/tópicos (mínimo 3-8 subassuntos)
3. Use nomenclatura OFICIAL de editais
4. NÃO resuma, NÃO simplifique - seja o mais EXTENSIVO possível
5. Inclua legislações atualizadas (Lei 14.133/2021, etc.)

RESPONDA EM JSON:
{
  "disciplinas": [
    {
      "nome": "Nome da Disciplina",
      "assuntos": [
        {
          "nome": "Nome do Assunto",
          "subassuntos": ["Subassunto 1", "Subassunto 2", "Subassunto 3"]
        }
      ]
    }
  ]
}

Retorne APENAS o JSON válido, sem markdown ou explicações.`
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 65536 // Máximo para respostas extensas
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro Gemini:', errorText)
      return NextResponse.json({ error: 'Erro na API Gemini' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON
    let resultado: { disciplinas: Disciplina[] }
    try {
      resultado = JSON.parse(text.trim())
    } catch {
      // Tentar extrair JSON do texto
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          resultado = JSON.parse(jsonMatch[0])
        } catch {
          console.error('JSON inválido:', text.slice(0, 500))
          return NextResponse.json({ error: 'Resposta inválida da IA - JSON malformado' }, { status: 500 })
        }
      } else {
        console.error('Nenhum JSON encontrado:', text.slice(0, 500))
        return NextResponse.json({ error: 'Resposta inválida da IA - sem JSON' }, { status: 500 })
      }
    }

    if (!resultado?.disciplinas || !Array.isArray(resultado.disciplinas)) {
      return NextResponse.json({ error: 'Resposta inválida da IA - estrutura incorreta' }, { status: 500 })
    }

    // Aplicar normalização e mesclagem de disciplinas duplicadas
    const disciplinasMescladas = mesclarDisciplinas(resultado.disciplinas)

    // Log de estatísticas (antes e depois)
    const statsAntes = {
      disciplinas: resultado.disciplinas.length,
      assuntos: resultado.disciplinas.reduce((acc, d) => acc + (d.assuntos?.length || 0), 0),
      subassuntos: resultado.disciplinas.reduce((acc, d) =>
        acc + (d.assuntos?.reduce((acc2, a) => acc2 + (a.subassuntos?.length || 0), 0) || 0), 0
      )
    }

    const statsDepois = {
      disciplinas: disciplinasMescladas.length,
      assuntos: disciplinasMescladas.reduce((acc, d) => acc + (d.assuntos?.length || 0), 0),
      subassuntos: disciplinasMescladas.reduce((acc, d) =>
        acc + (d.assuntos?.reduce((acc2, a) => acc2 + (a.subassuntos?.length || 0), 0) || 0), 0
      )
    }

    console.log(`Popular disciplinas - ${concurso || 'geral'}:`)
    console.log(`  Antes da mesclagem: ${statsAntes.disciplinas} disc, ${statsAntes.assuntos} ass, ${statsAntes.subassuntos} sub`)
    console.log(`  Depois da mesclagem: ${statsDepois.disciplinas} disc, ${statsDepois.assuntos} ass, ${statsDepois.subassuntos} sub`)

    return NextResponse.json({
      disciplinas: disciplinasMescladas,
      stats: statsDepois
    })
  } catch (error) {
    console.error('Erro ao popular disciplinas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
