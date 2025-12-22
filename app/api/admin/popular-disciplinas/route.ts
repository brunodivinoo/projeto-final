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

export async function POST(req: NextRequest) {
  try {
    const { concurso } = await req.json() as { concurso?: string }

    let prompt: string

    if (concurso) {
      // Prompt específico para um concurso
      prompt = `Você é um especialista em concursos públicos brasileiros com conhecimento COMPLETO e ATUALIZADO de 2025.

TAREFA: Liste TODAS as disciplinas, assuntos e subassuntos que caem no concurso: "${concurso}"

INSTRUÇÕES IMPORTANTES:
1. Considere TODOS os cargos deste concurso (ex: Agente, Escrivão, Delegado, Perito, Técnico, Analista, etc.)
2. Inclua disciplinas de conhecimentos BÁSICOS e ESPECÍFICOS
3. Para cada disciplina, liste TODOS os assuntos que aparecem nos editais
4. Para cada assunto, liste os subassuntos/tópicos detalhados
5. Use a nomenclatura OFICIAL dos editais
6. NÃO resuma, NÃO simplifique - seja EXTENSIVO
7. Inclua legislação específica do órgão quando houver

EXEMPLO DE DETALHAMENTO ESPERADO:
- Direito Constitucional deve ter: Princípios Fundamentais, Direitos e Garantias Fundamentais (com subassuntos: Direitos Individuais, Direitos Sociais, Nacionalidade, Direitos Políticos), Organização do Estado, Organização dos Poderes, Controle de Constitucionalidade, etc.
- Direito Administrativo deve ter: Princípios, Organização Administrativa, Poderes Administrativos, Atos Administrativos, Licitações (Lei 14.133/2021), Contratos, Servidores Públicos, Responsabilidade Civil, etc.

PARA CONCURSOS POLICIAIS INCLUA:
- Direito Penal (Parte Geral e Especial completos)
- Direito Processual Penal (completo)
- Legislação Penal Especial (Lei de Drogas, Maria da Penha, Crimes Hediondos, etc.)
- Criminologia
- Medicina Legal
- Legislação Específica do Órgão

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

REGRAS:
- Mínimo de 15 disciplinas
- Cada disciplina deve ter pelo menos 5-10 assuntos
- Cada assunto deve ter pelo menos 3-5 subassuntos quando aplicável
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

    // Log de estatísticas
    const stats = {
      disciplinas: resultado.disciplinas.length,
      assuntos: resultado.disciplinas.reduce((acc, d) => acc + (d.assuntos?.length || 0), 0),
      subassuntos: resultado.disciplinas.reduce((acc, d) =>
        acc + (d.assuntos?.reduce((acc2, a) => acc2 + (a.subassuntos?.length || 0), 0) || 0), 0
      )
    }
    console.log(`Popular disciplinas - ${concurso || 'geral'}:`, stats)

    return NextResponse.json({
      disciplinas: resultado.disciplinas,
      stats
    })
  } catch (error) {
    console.error('Erro ao popular disciplinas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
