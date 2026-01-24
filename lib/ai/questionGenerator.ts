/**
 * Question Generator - Inspirado na Meta AI
 *
 * Sistema avançado de geração de questões:
 * - Múltiplos tipos (múltipla escolha, V/F, dissertativa, caso clínico)
 * - Níveis de dificuldade adaptativos
 * - Integração inteligente com imagens
 * - Templates estruturados para diferentes estilos de prova
 */

export type TipoQuestao =
  | 'multipla_escolha'
  | 'verdadeiro_falso'
  | 'dissertativa'
  | 'caso_clinico'
  | 'associacao'
  | 'completar_lacunas'
  | 'interpretacao_imagem'
  | 'sequencia_logica'

export type NivelDificuldade = 'facil' | 'medio' | 'dificil' | 'muito_dificil'

export type EstiloProva =
  | 'enade'
  | 'residencia'
  | 'revalida'
  | 'concurso'
  | 'faculdade'
  | 'simulado_geral'

export interface ConfiguracaoQuestao {
  tipo: TipoQuestao
  nivel: NivelDificuldade
  estilo?: EstiloProva
  incluirImagem?: boolean
  incluirExplicacao?: boolean
  incluirDicas?: boolean
  areasTematicas?: string[]
  tempoEstimado?: number // minutos
}

export interface TemplateQuestao {
  tipo: TipoQuestao
  estrutura: string
  instrucoes: string[]
  exemplos: string[]
  formatoResposta: string
}

// Templates para cada tipo de questão
export const TEMPLATES_QUESTAO: Record<TipoQuestao, TemplateQuestao> = {
  multipla_escolha: {
    tipo: 'multipla_escolha',
    estrutura: `
**Questão [N]** ([área])

[Enunciado contextualizado]

a) [Alternativa A]
b) [Alternativa B]
c) [Alternativa C]
d) [Alternativa D]
e) [Alternativa E]

---
**Gabarito:** [Letra]
**Justificativa:** [Explicação detalhada de por que a alternativa está correta e as outras incorretas]
`.trim(),
    instrucoes: [
      'Crie um enunciado contextualizado e clínico quando possível',
      'Inclua 5 alternativas (a-e)',
      'Apenas UMA alternativa deve estar correta',
      'As alternativas incorretas devem ser plausíveis (distratores)',
      'Evite "todas as anteriores" ou "nenhuma das anteriores"',
      'Use linguagem técnica apropriada ao nível',
      'Inclua justificativa explicando cada alternativa'
    ],
    exemplos: [
      'Questão de caso clínico com hipótese diagnóstica',
      'Questão de mecanismo fisiopatológico',
      'Questão de tratamento/conduta'
    ],
    formatoResposta: 'Letra única (a, b, c, d ou e)'
  },

  verdadeiro_falso: {
    tipo: 'verdadeiro_falso',
    estrutura: `
**Questão [N]** ([área])

Analise as afirmativas abaixo:

I. [Afirmativa 1]
II. [Afirmativa 2]
III. [Afirmativa 3]
IV. [Afirmativa 4]

Assinale a alternativa correta:
a) Apenas I e II estão corretas
b) Apenas I e III estão corretas
c) Apenas II e IV estão corretas
d) Apenas I, II e III estão corretas
e) Todas estão corretas

---
**Gabarito:** [Letra]
**Análise:**
- I. [V/F] - [Justificativa]
- II. [V/F] - [Justificativa]
- III. [V/F] - [Justificativa]
- IV. [V/F] - [Justificativa]
`.trim(),
    instrucoes: [
      'Inclua 4-5 afirmativas',
      'Misture afirmativas verdadeiras e falsas',
      'As afirmativas falsas devem ter erros sutis mas identificáveis',
      'Justifique cada afirmativa individualmente'
    ],
    exemplos: [
      'Afirmativas sobre características de uma doença',
      'Afirmativas sobre efeitos de medicamentos',
      'Afirmativas sobre processos fisiológicos'
    ],
    formatoResposta: 'Combinação de afirmativas corretas'
  },

  dissertativa: {
    tipo: 'dissertativa',
    estrutura: `
**Questão [N]** (Dissertativa - [área])

[Enunciado detalhado com contexto]

**Responda:**
[Pergunta específica que requer resposta elaborada]

---
**Resposta esperada:**
[Resposta modelo com todos os pontos esperados]

**Critérios de avaliação:**
- [Critério 1]: [X pontos]
- [Critério 2]: [X pontos]
- [Critério 3]: [X pontos]
`.trim(),
    instrucoes: [
      'Formule pergunta que exija resposta elaborada',
      'Defina critérios claros de avaliação',
      'Indique os pontos principais esperados',
      'Inclua resposta modelo completa'
    ],
    exemplos: [
      'Descreva a fisiopatologia de...',
      'Compare e contraste os mecanismos de...',
      'Justifique a conduta terapêutica para...'
    ],
    formatoResposta: 'Texto dissertativo de 1-3 parágrafos'
  },

  caso_clinico: {
    tipo: 'caso_clinico',
    estrutura: `
**📋 CASO CLÍNICO [N]** ([especialidade])

**Identificação:** [Sexo, idade, profissão]

**Queixa Principal:** "[QP]"

**História da Doença Atual:**
[HDA detalhada com evolução temporal]

**Antecedentes:**
- Pessoais: [AP]
- Familiares: [AF]
- Medicamentos em uso: [Medicações]

**Exame Físico:**
[Dados relevantes do exame físico]

**Exames Complementares:**
[Resultados de exames relevantes]

---

**Com base no caso, responda:**

1. Qual a principal hipótese diagnóstica? Justifique.
2. Quais exames complementares você solicitaria?
3. Qual a conduta terapêutica inicial?

---
**Discussão do Caso:**
[Análise detalhada com respostas e raciocínio clínico]
`.trim(),
    instrucoes: [
      'Crie caso realista e detalhado',
      'Inclua dados clínicos relevantes para o diagnóstico',
      'Mantenha coerência interna do caso',
      'Formule 2-4 perguntas sobre o caso',
      'Inclua discussão completa do caso'
    ],
    exemplos: [
      'Caso de emergência cardiovascular',
      'Caso de doença infecciosa',
      'Caso de condição crônica descompensada'
    ],
    formatoResposta: 'Respostas para cada pergunta do caso'
  },

  associacao: {
    tipo: 'associacao',
    estrutura: `
**Questão [N]** (Associação - [área])

Associe as colunas:

**COLUNA A - [Categoria]**
(1) [Item 1]
(2) [Item 2]
(3) [Item 3]
(4) [Item 4]
(5) [Item 5]

**COLUNA B - [Categoria]**
( ) [Descrição A]
( ) [Descrição B]
( ) [Descrição C]
( ) [Descrição D]
( ) [Descrição E]

---
**Gabarito:** [Sequência correta]
**Explicação:** [Justificativa de cada associação]
`.trim(),
    instrucoes: [
      'Crie duas colunas relacionadas',
      'Use 4-6 itens em cada coluna',
      'As associações devem ser claras mas não óbvias',
      'Pode incluir distratores (itens sem par)'
    ],
    exemplos: [
      'Doenças e seus sintomas característicos',
      'Medicamentos e seus mecanismos de ação',
      'Estruturas anatômicas e suas funções'
    ],
    formatoResposta: 'Sequência de números'
  },

  completar_lacunas: {
    tipo: 'completar_lacunas',
    estrutura: `
**Questão [N]** (Complete as lacunas - [área])

Complete o texto abaixo:

[Texto com ______ (1), ______ (2), ______ (3) representando lacunas]

**Banco de palavras:**
[ ] [Palavra 1]
[ ] [Palavra 2]
[ ] [Palavra 3]
[ ] [Palavra 4] (distrator)
[ ] [Palavra 5] (distrator)

---
**Gabarito:**
(1) [Palavra correta]
(2) [Palavra correta]
(3) [Palavra correta]

**Texto completo:**
[Texto preenchido corretamente]
`.trim(),
    instrucoes: [
      'Crie texto coerente com 3-5 lacunas',
      'As lacunas devem testar conceitos importantes',
      'Inclua banco de palavras com distratores',
      'Forneça o texto completo no gabarito'
    ],
    exemplos: [
      'Descrição de processo fisiológico',
      'Explicação de mecanismo de doença',
      'Ciclo ou via metabólica'
    ],
    formatoResposta: 'Palavras que completam as lacunas'
  },

  interpretacao_imagem: {
    tipo: 'interpretacao_imagem',
    estrutura: `
**Questão [N]** (Interpretação de Imagem - [área])

📷 **Observe a imagem abaixo:**

[Descrição da imagem ou placeholder para imagem real]

**Com base na imagem, responda:**

1. Identifique a estrutura/alteração principal indicada.
2. [Pergunta específica sobre a imagem]
3. [Pergunta de correlação clínica]

---
**Gabarito:**
1. [Identificação correta]
2. [Resposta]
3. [Resposta com correlação]

**Explicação da imagem:**
[Descrição detalhada dos achados e sua relevância]
`.trim(),
    instrucoes: [
      'Descreva claramente a imagem ou solicite busca',
      'Formule perguntas sobre identificação e interpretação',
      'Correlacione com aspectos clínicos',
      'Inclua explicação detalhada dos achados'
    ],
    exemplos: [
      'Imagem de exame de imagem (RX, TC, RM)',
      'Lâmina de histologia/patologia',
      'Diagrama anatômico com estruturas a identificar'
    ],
    formatoResposta: 'Identificações e análise da imagem'
  },

  sequencia_logica: {
    tipo: 'sequencia_logica',
    estrutura: `
**Questão [N]** (Sequência Lógica - [área])

Ordene corretamente as etapas do processo de [processo]:

( ) [Etapa A]
( ) [Etapa B]
( ) [Etapa C]
( ) [Etapa D]
( ) [Etapa E]

Assinale a alternativa com a sequência correta:
a) A - B - C - D - E
b) B - A - D - C - E
c) C - A - B - E - D
d) [Sequência correta]
e) E - D - C - B - A

---
**Gabarito:** [Letra]
**Sequência correta explicada:**
1. [Etapa] - [Justificativa]
2. [Etapa] - [Justificativa]
3. [Etapa] - [Justificativa]
4. [Etapa] - [Justificativa]
5. [Etapa] - [Justificativa]
`.trim(),
    instrucoes: [
      'Escolha um processo com ordem definida',
      'Liste 4-6 etapas fora de ordem',
      'Inclua alternativas com sequências plausíveis',
      'Explique a ordem correta no gabarito'
    ],
    exemplos: [
      'Etapas de um ciclo celular',
      'Sequência de atendimento em emergência',
      'Cascata de coagulação'
    ],
    formatoResposta: 'Sequência ordenada de etapas'
  }
}

// Características por estilo de prova
export const ESTILOS_PROVA: Record<EstiloProva, {
  caracteristicas: string[]
  tiposPreferidos: TipoQuestao[]
  nivelMedio: NivelDificuldade
  tempoMedioPorQuestao: number
}> = {
  enade: {
    caracteristicas: [
      'Questões contextualizadas',
      'Foco em competências e habilidades',
      'Interdisciplinaridade',
      'Textos-base extensos',
      'Situações-problema'
    ],
    tiposPreferidos: ['multipla_escolha', 'caso_clinico', 'dissertativa'],
    nivelMedio: 'medio',
    tempoMedioPorQuestao: 4
  },
  residencia: {
    caracteristicas: [
      'Alta especificidade',
      'Casos clínicos complexos',
      'Conhecimento aprofundado',
      'Detalhes de conduta',
      'Atualizações recentes'
    ],
    tiposPreferidos: ['caso_clinico', 'multipla_escolha', 'verdadeiro_falso'],
    nivelMedio: 'dificil',
    tempoMedioPorQuestao: 2
  },
  revalida: {
    caracteristicas: [
      'Atenção básica e primária',
      'Saúde pública brasileira',
      'Situações ambulatoriais',
      'Abordagem em UBS',
      'Políticas do SUS'
    ],
    tiposPreferidos: ['caso_clinico', 'multipla_escolha'],
    nivelMedio: 'medio',
    tempoMedioPorQuestao: 3
  },
  concurso: {
    caracteristicas: [
      'Questões objetivas',
      'Legislação em saúde',
      'Conhecimentos gerais da área',
      'Protocolos estabelecidos'
    ],
    tiposPreferidos: ['multipla_escolha', 'verdadeiro_falso'],
    nivelMedio: 'medio',
    tempoMedioPorQuestao: 2
  },
  faculdade: {
    caracteristicas: [
      'Conteúdo do semestre/disciplina',
      'Teoria e prática',
      'Questões variadas',
      'Níveis progressivos'
    ],
    tiposPreferidos: ['multipla_escolha', 'dissertativa', 'verdadeiro_falso', 'caso_clinico'],
    nivelMedio: 'medio',
    tempoMedioPorQuestao: 3
  },
  simulado_geral: {
    caracteristicas: [
      'Mix de estilos',
      'Cobertura ampla',
      'Níveis variados',
      'Feedback detalhado'
    ],
    tiposPreferidos: ['multipla_escolha', 'caso_clinico', 'verdadeiro_falso'],
    nivelMedio: 'medio',
    tempoMedioPorQuestao: 3
  }
}

// Instruções por nível de dificuldade
export const INSTRUCOES_NIVEL: Record<NivelDificuldade, string[]> = {
  facil: [
    'Perguntas diretas sobre conceitos básicos',
    'Alternativas claramente distinguíveis',
    'Evitar "pegadinhas"',
    'Foco em memorização e compreensão básica'
  ],
  medio: [
    'Requer integração de conhecimentos',
    'Alternativas mais próximas entre si',
    'Aplicação de conceitos',
    'Inclui interpretação de dados simples'
  ],
  dificil: [
    'Exige raciocínio clínico elaborado',
    'Casos atípicos ou com múltiplas variáveis',
    'Análise crítica de condutas',
    'Integração de múltiplas áreas'
  ],
  muito_dificil: [
    'Situações raras ou complexas',
    'Detalhes sutis diferenciais',
    'Exige conhecimento aprofundado',
    'Múltiplas etapas de raciocínio'
  ]
}

/**
 * Gera configuração completa para geração de questões
 */
export function gerarConfiguracaoQuestao(
  tema: string,
  quantidade: number,
  config: Partial<ConfiguracaoQuestao> = {}
): {
  prompt: string
  config: ConfiguracaoQuestao
  templateBase: TemplateQuestao
} {
  // Configuração padrão
  const configuracao: ConfiguracaoQuestao = {
    tipo: config.tipo || 'multipla_escolha',
    nivel: config.nivel || 'medio',
    estilo: config.estilo,
    incluirImagem: config.incluirImagem ?? false,
    incluirExplicacao: config.incluirExplicacao ?? true,
    incluirDicas: config.incluirDicas ?? false,
    areasTematicas: config.areasTematicas || [],
    tempoEstimado: config.tempoEstimado
  }

  // Obter template
  const template = TEMPLATES_QUESTAO[configuracao.tipo]

  // Obter instruções do estilo de prova (se especificado)
  const estiloInfo = configuracao.estilo ? ESTILOS_PROVA[configuracao.estilo] : null

  // Construir prompt
  let prompt = `
## 📝 GERAÇÃO DE QUESTÕES

**Tema:** ${tema}
**Quantidade:** ${quantidade} questões
**Tipo:** ${configuracao.tipo.replace('_', ' ')}
**Nível:** ${configuracao.nivel}
${configuracao.estilo ? `**Estilo:** ${configuracao.estilo}` : ''}

### ESTRUTURA BASE:
${template.estrutura}

### INSTRUÇÕES:
${template.instrucoes.map(i => `- ${i}`).join('\n')}

### INSTRUÇÕES DE NÍVEL (${configuracao.nivel}):
${INSTRUCOES_NIVEL[configuracao.nivel].map(i => `- ${i}`).join('\n')}
`

  if (estiloInfo) {
    prompt += `
### CARACTERÍSTICAS DO ESTILO ${configuracao.estilo?.toUpperCase()}:
${estiloInfo.caracteristicas.map(c => `- ${c}`).join('\n')}
`
  }

  if (configuracao.incluirImagem) {
    prompt += `
### IMAGENS:
- OBRIGATÓRIO incluir imagem de referência
- Use a ferramenta buscar_imagens_medicas para obter imagem relevante
- A imagem deve estar diretamente relacionada à questão
`
  }

  if (configuracao.incluirExplicacao) {
    prompt += `
### EXPLICAÇÃO:
- OBRIGATÓRIO incluir gabarito comentado
- Explique por que cada alternativa está certa ou errada
- Inclua referências quando possível
`
  }

  if (configuracao.incluirDicas) {
    prompt += `
### DICAS DE ESTUDO:
- Após a explicação, inclua 2-3 dicas de estudo relacionadas
- Sugira tópicos para revisão
`
  }

  prompt += `
### FORMATO DE SAÍDA:
Gere ${quantidade} questões seguindo EXATAMENTE o template acima.
Numere as questões de 1 a ${quantidade}.
Separe cada questão com uma linha horizontal (---).
`

  return {
    prompt: prompt.trim(),
    config: configuracao,
    templateBase: template
  }
}

/**
 * Determina se uma questão deve incluir imagem baseado no tema
 */
export function deveIncluirImagem(tema: string): boolean {
  const temaLower = tema.toLowerCase()

  const temasVisuais = [
    'anatom', 'histolog', 'imagem', 'radiolog', 'raio-x', 'tomograf',
    'ressonância', 'ultrassom', 'microscop', 'lâmina', 'corte',
    'célula', 'tecido', 'órgão', 'estrutura', 'diagrama',
    'ecg', 'eletrocardiograma', 'dermatolog', 'lesão', 'lesao'
  ]

  return temasVisuais.some(t => temaLower.includes(t))
}

/**
 * Sugere tipo de questão baseado no tema
 */
export function sugerirTipoQuestao(tema: string, estilo?: EstiloProva): TipoQuestao {
  const temaLower = tema.toLowerCase()

  // Se especificou estilo, preferir tipos do estilo
  if (estilo) {
    const tiposEstilo = ESTILOS_PROVA[estilo].tiposPreferidos
    // Retornar o tipo mais comum do estilo
    return tiposEstilo[0]
  }

  // Detectar por tema
  if (temaLower.includes('caso') || temaLower.includes('paciente') ||
      temaLower.includes('clínico') || temaLower.includes('clinico')) {
    return 'caso_clinico'
  }

  if (temaLower.includes('imagem') || temaLower.includes('identific') ||
      temaLower.includes('anatomia')) {
    return 'interpretacao_imagem'
  }

  if (temaLower.includes('sequência') || temaLower.includes('sequencia') ||
      temaLower.includes('ordem') || temaLower.includes('etapas')) {
    return 'sequencia_logica'
  }

  if (temaLower.includes('associar') || temaLower.includes('relacionar')) {
    return 'associacao'
  }

  if (temaLower.includes('dissertativa') || temaLower.includes('explique') ||
      temaLower.includes('descreva')) {
    return 'dissertativa'
  }

  // Padrão
  return 'multipla_escolha'
}

/**
 * Valida se uma questão gerada está completa
 */
export function validarQuestaoGerada(
  questao: string,
  tipo: TipoQuestao
): { valida: boolean; problemas: string[] } {
  const problemas: string[] = []

  // Verificações gerais
  if (questao.length < 100) {
    problemas.push('Questão muito curta')
  }

  // Verificações específicas por tipo
  switch (tipo) {
    case 'multipla_escolha':
      if (!/[a-e]\)/gi.test(questao)) {
        problemas.push('Faltam alternativas (a-e)')
      }
      if (!/gabarito/i.test(questao)) {
        problemas.push('Falta gabarito')
      }
      break

    case 'verdadeiro_falso':
      if (!/[IVX]+\./gi.test(questao) && !/^\s*(I|II|III|IV|V)/gm.test(questao)) {
        problemas.push('Faltam afirmativas numeradas')
      }
      break

    case 'caso_clinico':
      if (!/queixa/i.test(questao) && !/história/i.test(questao)) {
        problemas.push('Falta estrutura de caso clínico')
      }
      break

    case 'dissertativa':
      if (!/resposta esperada/i.test(questao) && !/gabarito/i.test(questao)) {
        problemas.push('Falta resposta esperada')
      }
      break
  }

  return {
    valida: problemas.length === 0,
    problemas
  }
}

/**
 * Gera prompt de correção para questão incompleta
 */
export function gerarPromptCorrecao(
  questaoOriginal: string,
  problemas: string[]
): string {
  return `
A questão gerada está incompleta. Corrija os seguintes problemas:

${problemas.map((p, i) => `${i + 1}. ${p}`).join('\n')}

**Questão original:**
${questaoOriginal}

**Instruções:**
- Mantenha o conteúdo existente
- APENAS adicione o que está faltando
- NÃO repita o conteúdo já existente
`.trim()
}
