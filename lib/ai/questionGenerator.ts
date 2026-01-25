/**
 * Sistema de Geração de Questões Profissional
 * Baseado na arquitetura Meta AI
 *
 * Pipeline: Tema → Análise → Criação → Validação → Distratores → Gabarito → Revisão → Entrega
 */

// ============== TIPOS ==============

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
export type NivelCognitivo = 'lembrar' | 'entender' | 'aplicar' | 'analisar' | 'avaliar' | 'criar'

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
  tempoEstimado?: number
}

export interface ConfiguracaoQuestoes {
  quantidade: number
  tema: string
  dificuldade: NivelDificuldade | 'misto'
  incluirCasosClinicos: boolean
  incluirImagens: boolean
  niveisCognitivos: NivelCognitivo[] | 'misto'
  formatoGabarito: 'simples' | 'comentado' | 'detalhado'
  estilo?: EstiloProva
}

export interface DistribuicaoRespostas {
  A: number
  B: number
  C: number
  D: number
  E: number
}

export interface SubtopicoTema {
  nome: string
  usado: boolean
  dificuldade: NivelDificuldade
  nivelCognitivo: NivelCognitivo
}

export interface TemplateQuestao {
  tipo: TipoQuestao
  estrutura: string
  instrucoes: string[]
  exemplos: string[]
  formatoResposta: string
}

// ============== TEMPLATES META AI ==============

/**
 * Template de Caso Clínico (Meta AI)
 * Estrutura: Dados demográficos → História → Exame físico → Exames → Pergunta
 */
const TEMPLATE_CASO_CLINICO = `
**Caso Clínico:**
[DADOS DEMOGRÁFICOS]: Paciente [sexo], [idade] anos, [profissão/contexto relevante].
[QUEIXA PRINCIPAL]: Procura atendimento com queixa de [sintoma principal] há [tempo].
[HISTÓRIA]: [Detalhes da história clínica relevantes para o diagnóstico]
[EXAME FÍSICO]: [Achados relevantes do exame físico]
[EXAMES COMPLEMENTARES]: [Se necessário: resultados de exames laboratoriais/imagem]

Com base no caso acima, [PERGUNTA]:
`

/**
 * Técnicas de criação de distratores (Meta AI)
 */
const TECNICAS_DISTRATORES = {
  trocaNumeros: 'Alterar valores numéricos (doses, percentuais, medidas)',
  inversaoConceitos: 'Inverter causa/efeito, aumento/diminuição, ativação/inibição',
  termosParecidos: 'Usar termos que soam similares mas significam diferente',
  detalhesIrrelevantes: 'Adicionar informações corretas mas que não respondem a pergunta',
  generalizacao: 'Tornar uma afirmação específica muito genérica',
  especificacaoExcessiva: 'Tornar uma afirmação geral muito específica',
  condicaoErrada: 'Usar condição/contexto diferente do perguntado'
}

/**
 * Mapeamento de subtópicos por sistema (para evitar repetição)
 */
const SUBTOPICOS_POR_TEMA: Record<string, SubtopicoTema[]> = {
  'sistema cardiovascular': [
    { nome: 'Anatomia do coração (câmaras, válvulas)', usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
    { nome: 'Circulação pulmonar vs sistêmica', usado: false, dificuldade: 'facil', nivelCognitivo: 'entender' },
    { nome: 'Ciclo cardíaco (sístole/diástole)', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Sistema de condução elétrica', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Regulação da pressão arterial', usado: false, dificuldade: 'medio', nivelCognitivo: 'analisar' },
    { nome: 'Débito cardíaco e seus determinantes', usado: false, dificuldade: 'dificil', nivelCognitivo: 'aplicar' },
    { nome: 'ECG básico e interpretação', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Fisiopatologia da insuficiência cardíaca', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Doenças valvares', usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
    { nome: 'Farmacologia cardiovascular', usado: false, dificuldade: 'dificil', nivelCognitivo: 'aplicar' },
  ],
  'sistema respiratório': [
    { nome: 'Anatomia das vias aéreas', usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
    { nome: 'Anatomia dos pulmões', usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
    { nome: 'Mecânica respiratória', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Trocas gasosas', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Transporte de O2 e CO2', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Controle da respiração', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Espirometria e volumes pulmonares', usado: false, dificuldade: 'dificil', nivelCognitivo: 'aplicar' },
    { nome: 'Fisiopatologia da asma', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Fisiopatologia da DPOC', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Insuficiência respiratória', usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
  ],
  'sistema nervoso': [
    { nome: 'Neurônio e sinapse', usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
    { nome: 'Divisões do sistema nervoso', usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
    { nome: 'Anatomia do encéfalo', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Medula espinhal e reflexos', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Sistema nervoso autônomo', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Neurotransmissores', usado: false, dificuldade: 'dificil', nivelCognitivo: 'aplicar' },
    { nome: 'Vias sensitivas e motoras', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Pares cranianos', usado: false, dificuldade: 'dificil', nivelCognitivo: 'lembrar' },
    { nome: 'Fisiopatologia do AVC', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Doenças neurodegenerativas', usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
  ],
  'sistema digestório': [
    { nome: 'Anatomia do trato gastrointestinal', usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
    { nome: 'Glândulas anexas (fígado, pâncreas)', usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
    { nome: 'Motilidade gastrointestinal', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Secreção gástrica e pancreática', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Digestão e absorção de nutrientes', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Fisiopatologia da úlcera péptica', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Hepatites e cirrose', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Pancreatite aguda e crônica', usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
    { nome: 'Doenças inflamatórias intestinais', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Síndrome do intestino irritável', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
  ],
  'sistema endócrino': [
    { nome: 'Hipotálamo e hipófise', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Tireoide e paratireoides', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Suprarrenais (cortisol, aldosterona)', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Pâncreas endócrino (insulina, glucagon)', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Diabetes mellitus tipo 1 e 2', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Hipo e hipertireoidismo', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Síndrome de Cushing', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Insuficiência adrenal', usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
    { nome: 'Regulação do cálcio e fósforo', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Feocromocitoma', usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
  ],
  'sistema renal': [
    { nome: 'Anatomia renal e néfron', usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
    { nome: 'Filtração glomerular', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Reabsorção e secreção tubular', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Regulação do equilíbrio ácido-base', usado: false, dificuldade: 'dificil', nivelCognitivo: 'aplicar' },
    { nome: 'Regulação do volume e osmolaridade', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Insuficiência renal aguda', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Doença renal crônica', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Distúrbios hidroeletrolíticos', usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
    { nome: 'Glomerulonefrites', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Litíase renal', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
  ],
  'farmacologia': [
    { nome: 'Farmacocinética básica', usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
    { nome: 'Farmacodinâmica (receptores)', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Antibióticos', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Anti-hipertensivos', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Anti-inflamatórios (AINEs e corticoides)', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Analgésicos e anestésicos', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Interações medicamentosas', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Efeitos adversos e toxicidade', usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
    { nome: 'Farmacologia do SNC', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Quimioterapia antineoplásica', usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
  ],
  'imunologia': [
    { nome: 'Células do sistema imune', usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
    { nome: 'Imunidade inata vs adaptativa', usado: false, dificuldade: 'facil', nivelCognitivo: 'entender' },
    { nome: 'Anticorpos e suas classes', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
    { nome: 'Resposta imune humoral e celular', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Hipersensibilidade tipo I-IV', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Doenças autoimunes', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Imunodeficiências', usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
    { nome: 'Transplantes e rejeição', usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
    { nome: 'Vacinação e imunização', usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
    { nome: 'Sistema complemento', usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
  ],
}

// Templates para cada tipo de questão (mantidos do arquivo original)
export const TEMPLATES_QUESTAO: Record<TipoQuestao, TemplateQuestao> = {
  multipla_escolha: {
    tipo: 'multipla_escolha',
    estrutura: `
**Questão [N]** | Nível: [FÁCIL/MÉDIO/DIFÍCIL] | Bloom: [Nível Cognitivo]

[Enunciado contextualizado]

a) [Alternativa A]
b) [Alternativa B]
c) [Alternativa C]
d) [Alternativa D]
e) [Alternativa E]

---
**Gabarito:** [Letra]
**Justificativa:** [Explicação detalhada]
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
**Questão [N]** | Nível: [FÁCIL/MÉDIO/DIFÍCIL] | Bloom: [Nível Cognitivo]

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
**Análise detalhada de cada afirmativa:**
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
**Questão [N]** (Dissertativa) | Nível: [FÁCIL/MÉDIO/DIFÍCIL] | Bloom: [Nível Cognitivo]

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
**📋 CASO CLÍNICO [N]** | Nível: [FÁCIL/MÉDIO/DIFÍCIL] | Bloom: [Nível Cognitivo]

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
**Questão [N]** (Associação) | Nível: [FÁCIL/MÉDIO/DIFÍCIL] | Bloom: [Nível Cognitivo]

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
**Explicação de cada associação:**
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
**Questão [N]** (Complete as lacunas) | Nível: [FÁCIL/MÉDIO/DIFÍCIL] | Bloom: [Nível Cognitivo]

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
**Questão [N]** (Interpretação de Imagem) | Nível: [FÁCIL/MÉDIO/DIFÍCIL] | Bloom: [Nível Cognitivo]

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

**Explicação detalhada da imagem:**
[Descrição dos achados e sua relevância]
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
**Questão [N]** (Sequência Lógica) | Nível: [FÁCIL/MÉDIO/DIFÍCIL] | Bloom: [Nível Cognitivo]

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
    'Foco em memorização e compreensão básica',
    'Vocabulário simples e acessível'
  ],
  medio: [
    'Requer integração de conhecimentos',
    'Alternativas mais próximas entre si',
    'Aplicação de conceitos',
    'Inclui interpretação de dados simples',
    'Casos clínicos simples podem ser usados'
  ],
  dificil: [
    'Exige raciocínio clínico elaborado',
    'Casos atípicos ou com múltiplas variáveis',
    'Análise crítica de condutas',
    'Integração de múltiplas áreas',
    'Distratores muito plausíveis'
  ],
  muito_dificil: [
    'Situações raras ou complexas',
    'Detalhes sutis diferenciais',
    'Exige conhecimento aprofundado',
    'Múltiplas etapas de raciocínio',
    'Requer domínio completo do tema'
  ]
}

// ============== FUNÇÕES PRINCIPAIS ==============

/**
 * Gera distribuição de respostas corretas (Meta AI: A-D 20-30%, E 10-20%)
 */
function gerarDistribuicaoRespostas(quantidade: number): string[] {
  const letras = ['A', 'B', 'C', 'D', 'E']
  const distribuicao: string[] = []

  // Distribuição alvo: A-D ~22% cada, E ~12%
  const alvos = { A: 0.22, B: 0.22, C: 0.22, D: 0.22, E: 0.12 }
  const contagem = { A: 0, B: 0, C: 0, D: 0, E: 0 }

  for (let i = 0; i < quantidade; i++) {
    // Encontrar letra mais "atrasada" em relação ao alvo
    let melhorLetra = 'A'
    let maiorDiferenca = -1

    for (const letra of letras) {
      const atual = contagem[letra as keyof typeof contagem] / (i + 1)
      const alvo = alvos[letra as keyof typeof alvos]
      const diferenca = alvo - atual

      if (diferenca > maiorDiferenca) {
        maiorDiferenca = diferenca
        melhorLetra = letra
      }
    }

    // Adicionar aleatoriedade (30% de chance de escolher aleatório)
    if (Math.random() < 0.3) {
      melhorLetra = letras[Math.floor(Math.random() * 5)]
    }

    distribuicao.push(melhorLetra)
    contagem[melhorLetra as keyof typeof contagem]++
  }

  // Embaralhar para não ficar previsível
  return distribuicao.sort(() => Math.random() - 0.5)
}

/**
 * Seleciona subtópicos para evitar repetição (Meta AI)
 */
function selecionarSubtopicos(
  tema: string,
  quantidade: number,
  dificuldade: NivelDificuldade | 'misto'
): SubtopicoTema[] {
  // Normalizar tema
  const temaNormalizado = tema.toLowerCase()

  // Buscar subtópicos do tema (procurar correspondência parcial)
  let subtopicos: SubtopicoTema[] | undefined

  for (const [key, value] of Object.entries(SUBTOPICOS_POR_TEMA)) {
    if (temaNormalizado.includes(key) || key.includes(temaNormalizado)) {
      subtopicos = value
      break
    }
  }

  // Se não encontrou, criar subtópicos genéricos
  if (!subtopicos) {
    subtopicos = [
      { nome: `Conceitos básicos de ${tema}`, usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
      { nome: `Definições e terminologia de ${tema}`, usado: false, dificuldade: 'facil', nivelCognitivo: 'lembrar' },
      { nome: `Estrutura e anatomia de ${tema}`, usado: false, dificuldade: 'facil', nivelCognitivo: 'entender' },
      { nome: `Funcionamento e fisiologia de ${tema}`, usado: false, dificuldade: 'medio', nivelCognitivo: 'entender' },
      { nome: `Mecanismos de ${tema}`, usado: false, dificuldade: 'medio', nivelCognitivo: 'aplicar' },
      { nome: `Alterações patológicas de ${tema}`, usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
      { nome: `Diagnóstico diferencial em ${tema}`, usado: false, dificuldade: 'dificil', nivelCognitivo: 'analisar' },
      { nome: `Tratamento e manejo de ${tema}`, usado: false, dificuldade: 'dificil', nivelCognitivo: 'aplicar' },
      { nome: `Correlações clínicas de ${tema}`, usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
      { nome: `Casos especiais e complicações de ${tema}`, usado: false, dificuldade: 'dificil', nivelCognitivo: 'avaliar' },
    ]
  }

  // Filtrar por dificuldade se não for misto
  let subtopicosDisponiveis = [...subtopicos]
  if (dificuldade !== 'misto') {
    const filtrados = subtopicos.filter(s => s.dificuldade === dificuldade)
    if (filtrados.length >= Math.min(3, quantidade)) {
      subtopicosDisponiveis = filtrados
    }
  }

  // Selecionar aleatoriamente
  const selecionados: SubtopicoTema[] = []
  const disponiveis = [...subtopicosDisponiveis]

  for (let i = 0; i < Math.min(quantidade, disponiveis.length); i++) {
    const index = Math.floor(Math.random() * disponiveis.length)
    selecionados.push(disponiveis[index])
    disponiveis.splice(index, 1)
  }

  // Se ainda precisa de mais, repetir com variação
  while (selecionados.length < quantidade) {
    const index = Math.floor(Math.random() * subtopicosDisponiveis.length)
    selecionados.push({
      ...subtopicosDisponiveis[index],
      nome: subtopicosDisponiveis[index].nome + ' (aprofundamento)'
    })
  }

  return selecionados
}

/**
 * Gera prompt completo para criar questões profissionais (Pipeline Meta AI)
 */
export function gerarPromptQuestoesProfissional(config: ConfiguracaoQuestoes): string {
  // 1. ANÁLISE DE CONTEÚDO - Selecionar subtópicos
  const subtopicos = selecionarSubtopicos(config.tema, config.quantidade, config.dificuldade)

  // 2. GERAR DISTRIBUIÇÃO DE RESPOSTAS
  const distribuicaoRespostas = gerarDistribuicaoRespostas(config.quantidade)

  // 3. DEFINIR DISTRIBUIÇÃO DE DIFICULDADE
  let distribuicaoDificuldade = ''
  if (config.dificuldade === 'misto') {
    const faceis = Math.round(config.quantidade * 0.3)
    const medias = Math.round(config.quantidade * 0.5)
    const dificeis = config.quantidade - faceis - medias
    distribuicaoDificuldade = `
- ${faceis} questões FÁCEIS (30%)
- ${medias} questões MÉDIAS (50%)
- ${dificeis} questões DIFÍCEIS (20%)`
  } else {
    distribuicaoDificuldade = `- Todas as questões devem ser de nível ${config.dificuldade.toUpperCase()}`
  }

  // 4. Obter info do estilo se especificado
  const estiloInfo = config.estilo ? ESTILOS_PROVA[config.estilo] : null

  // 5. MONTAR PROMPT COMPLETO
  return `
## GERAR ${config.quantidade} QUESTÕES PROFISSIONAIS SOBRE: ${config.tema.toUpperCase()}

### PIPELINE DE CRIAÇÃO (siga esta ordem):

---

## PASSO 1: SUBTÓPICOS A COBRIR (não repetir!)

Cada questão deve abordar um subtópico DIFERENTE:
${subtopicos.map((s, i) => `${i + 1}. **Questão ${i + 1}**: ${s.nome} (${s.dificuldade}, ${s.nivelCognitivo})`).join('\n')}

---

## PASSO 2: DISTRIBUIÇÃO DE RESPOSTAS CORRETAS

Para evitar padrões previsíveis, use esta distribuição:
${distribuicaoRespostas.map((letra, i) => `- Questão ${i + 1}: Resposta correta = **${letra}**`).join('\n')}

---

## PASSO 3: DISTRIBUIÇÃO DE DIFICULDADE
${distribuicaoDificuldade}

**O que define cada nível:**
- **FÁCIL**: Vocabulário simples, conceito direto, memorização
- **MÉDIA**: Requer compreensão, pode ter caso clínico simples
- **DIFÍCIL**: Análise/avaliação, caso clínico complexo, integração de conhecimentos

---

## PASSO 4: NÍVEIS COGNITIVOS (Taxonomia de Bloom)

Variar os níveis cognitivos das questões:
- **Lembrar**: "Qual é...", "Cite...", "Defina..."
- **Entender**: "Explique...", "Por que...", "Qual a função..."
- **Aplicar**: Casos clínicos, "O que acontece se..."
- **Analisar**: "Compare...", "Qual a relação...", "Diferencie..."
- **Avaliar**: "Qual a melhor conduta...", "Qual o prognóstico..."

---

## PASSO 5: CRIAÇÃO DOS DISTRATORES (Alternativas Erradas)

Use estas técnicas para criar alternativas erradas PLAUSÍVEIS:

1. **Troca de números**: Alterar doses, valores, percentuais
   - Correto: "frequência de 60-100 bpm" → Errado: "frequência de 40-60 bpm"

2. **Inversão de conceitos**: Inverter causa/efeito
   - Correto: "vasoconstrição causa hipertensão" → Errado: "vasodilatação causa hipertensão"

3. **Termos parecidos**: Usar termos que soam similar
   - Correto: "hipertrofia" → Errado: "hiperplasia"

4. **Detalhes irrelevantes**: Informação correta mas que não responde
   - Pergunta sobre função → Alternativa descreve anatomia (correta, mas não responde)

5. **Generalização/Especificação**: Tornar muito genérico ou muito específico

⚠️ **NUNCA usar**:
- Alternativas absurdas ou obviamente erradas
- "Todas as anteriores" ou "Nenhuma das anteriores"
- Pegadinhas injustas ou enganosas

---

## PASSO 6: FORMATO DE CADA QUESTÃO

${config.incluirCasosClinicos ? `
### Para questões COM CASO CLÍNICO (inclua em ~50% das questões):
${TEMPLATE_CASO_CLINICO}
` : ''}

### Estrutura obrigatória para CADA questão:

**IMPORTANTE - VARIAÇÃO:**
- Enunciados devem VARIAR em tamanho: 30% curtos (2-3 linhas), 40% médios (4-6 linhas), 30% longos (7+ linhas ou com caso clínico)
- Alternativas devem variar: algumas com 1 linha, outras com 2-3 linhas
- Dificuldade REAL: questões fáceis devem ser fáceis de verdade, difíceis devem exigir análise aprofundada

**REGRA DE IMAGENS NO ENUNCIADO:**
- SÓ incluir imagem no enunciado quando for uma imagem PURAMENTE VISUAL (anatomia, histologia, radiografia)
- NÃO colocar imagens com texto explicativo no enunciado (revelaria a resposta)
- Exemplo BOM: "Observe a imagem anatômica abaixo e identifique..." + ![anatomia](imagem_sem_labels)
- Exemplo RUIM: Colocar imagem de "Resumo de anatomia do coração" no enunciado

\`\`\`questao
{
  "numero": [N],
  "enunciado": "[ENUNCIADO - tamanho variável, contextualizado]",
  "imagem_enunciado": "[OPCIONAL - SÓ imagem sem texto, puramente visual]",
  "nivel": "[facil/medio/dificil]",
  "bloom": "[lembrar/entender/aplicar/analisar/avaliar]",
  "alternativas": [
    {"letra": "a", "texto": "[Alternativa A - tamanho variável]"},
    {"letra": "b", "texto": "[Alternativa B]"},
    {"letra": "c", "texto": "[Alternativa C]"},
    {"letra": "d", "texto": "[Alternativa D]"},
    {"letra": "e", "texto": "[Alternativa E]"}
  ],
  "gabarito": "[letra]"
}
\`\`\`

### ⚠️ GABARITO COMENTADO - OBRIGATÓRIO E DETALHADO:

**APÓS cada questão, SEMPRE inclua um gabarito comentado EXTENSO e DETALHADO:**

---
**📚 GABARITO COMENTADO - Questão [N]**

**✅ Resposta correta: Alternativa [LETRA]**

**🔬 EXPLICAÇÃO DETALHADA:**
[Explicação EXTENSA de 3-5 parágrafos sobre por que esta é a resposta correta. Inclua:
- O conceito fundamental por trás da resposta
- A fisiopatologia/mecanismo envolvido
- Como aplicar este conhecimento clinicamente
- Dados epidemiológicos relevantes (se aplicável)]

**❌ POR QUE AS OUTRAS ESTÃO ERRADAS:**
- **Alternativa A:** [Explicação detalhada do erro, não apenas "está errada"]
- **Alternativa B:** [Explicação detalhada do erro]
- **Alternativa C:** [Explicação detalhada do erro]
- **Alternativa D:** [Explicação detalhada do erro]
- **Alternativa E:** [Explicação detalhada do erro]

**🖼️ IMAGENS DE REFERÊNCIA:**
[OBRIGATÓRIO: Use a ferramenta buscar_imagens_medicas para incluir 1-2 imagens relevantes no gabarito. Imagens no gabarito PODEM ter texto explicativo pois ajudam no aprendizado]

![Descrição](url_da_imagem_relevante)
📌 Fonte: [fonte da imagem]

**💡 DICA DE MEMORIZAÇÃO:**
[Mnemônico prático ou dica de estudo]

**📖 REFERÊNCIAS BIBLIOGRÁFICAS (ABNT):**
1. SOBRENOME, Nome. Título do livro. Xª ed. Cidade: Editora, Ano. p. XX-XX.
2. [Segunda referência se aplicável]

**🔗 TEMAS RELACIONADOS:**
- [Tema relacionado 1 para estudo adicional]
- [Tema relacionado 2]

---

${config.incluirImagens ? `
### 🖼️ REGRAS DE IMAGENS:

**NO ENUNCIADO:**
- Use APENAS imagens SEM TEXTO (anatomia pura, radiografia sem laudo, histologia sem labels)
- A imagem deve fazer parte da questão, não revelar a resposta
- Busque com: buscar_imagens_medicas("estrutura anatômica X", tipo="anatomia")

**NO GABARITO (OBRIGATÓRIO):**
- SEMPRE busque 1-2 imagens relevantes para o gabarito comentado
- Imagens no gabarito PODEM e DEVEM ter texto explicativo (diagramas, infográficos, resumos visuais)
- Ajudam a fixar o conteúdo e enriquecem a explicação
- Busque com: buscar_imagens_medicas("resumo de X" ou "diagrama de Y")
` : `
### 🖼️ IMAGENS NO GABARITO:
- SEMPRE busque 1-2 imagens relevantes para o gabarito comentado de cada questão
- Use a ferramenta buscar_imagens_medicas para encontrar imagens educativas
- Imagens no gabarito ajudam na fixação do conteúdo
`}

---

## PASSO 7: REFERÊNCIAS BIBLIOGRÁFICAS

Use estas fontes confiáveis:
- GUYTON, A.C.; HALL, J.E. Tratado de Fisiologia Médica. 13ª ed. Rio de Janeiro: Elsevier, 2017.
- TORTORA, G.J.; DERRICKSON, B. Princípios de Anatomia e Fisiologia. 14ª ed. Rio de Janeiro: Guanabara Koogan, 2019.
- MOORE, K.L.; DALLEY, A.F. Anatomia Orientada para a Clínica. 8ª ed. Rio de Janeiro: Guanabara Koogan, 2019.
- KUMAR, V.; ABBAS, A.K. Robbins Patologia Básica. 10ª ed. Rio de Janeiro: Elsevier, 2018.
- RANG, H.P.; DALE, M.M. Farmacologia. 9ª ed. Rio de Janeiro: Elsevier, 2020.
- PORTO, C.C. Semiologia Médica. 8ª ed. Rio de Janeiro: Guanabara Koogan, 2019.

${estiloInfo ? `
---

## ESTILO DE PROVA: ${config.estilo?.toUpperCase()}

Características específicas deste estilo:
${estiloInfo.caracteristicas.map(c => `- ${c}`).join('\n')}

Tipos preferidos: ${estiloInfo.tiposPreferidos.join(', ')}
` : ''}

---

## PASSO 8: VALIDAÇÃO FINAL (Checklist OBRIGATÓRIO)

Antes de entregar, VERIFIQUE:
- [ ] Quantidade correta: ${config.quantidade} questões
- [ ] Cada questão tem exatamente 5 alternativas (a, b, c, d, e)
- [ ] Distribuição de respostas segue o padrão definido
- [ ] Subtópicos são diferentes entre questões (sem repetição)
- [ ] **GABARITO EXTENSO:** Cada questão tem gabarito comentado com 3-5 parágrafos de explicação
- [ ] **ALTERNATIVAS ERRADAS:** Cada alternativa errada tem explicação DETALHADA do erro (não só "está errada")
- [ ] **IMAGENS NO GABARITO:** Cada gabarito tem pelo menos 1 imagem relevante buscada
- [ ] **REFERÊNCIAS:** Cada questão tem referência bibliográfica no formato ABNT
- [ ] **DICA:** Cada questão tem dica de memorização ou mnemônico
- [ ] Nível de dificuldade indicado E realista (fácil = memorização, difícil = análise)
- [ ] Nível cognitivo (Bloom) indicado
- [ ] **VARIAÇÃO:** Enunciados com tamanhos variados (curtos, médios, longos)
${config.incluirImagens ? '- [ ] Imagens no enunciado são APENAS visuais (sem texto)' : ''}
${config.incluirCasosClinicos ? '- [ ] Casos clínicos são realistas, detalhados e plausíveis' : ''}

⚠️ **NÃO PROSSIGA se algum item não estiver marcado!**

---

## SEQUENCIAMENTO

Organize as questões em ordem:
1. Primeiro: questões mais FÁCEIS (aquecimento)
2. Meio: questões MÉDIAS
3. Final: questões DIFÍCEIS
4. Agrupar por subtópico quando fizer sentido

---

## AGORA, GERE AS ${config.quantidade} QUESTÕES:

Siga o pipeline completo. Não pule etapas. Garanta qualidade profissional.
Use o formato JSON dentro de blocos \`\`\`questao para cada questão.
`
}

/**
 * Valida as questões geradas
 */
export function validarQuestoesGeradas(
  resposta: string,
  config: ConfiguracaoQuestoes
): {
  valido: boolean
  questoesEncontradas: number
  problemasEncontrados: string[]
  qualidade: number // 0-100
} {
  const problemas: string[] = []
  let pontos = 100

  // 1. Contar questões
  const questoesRegex = /```questao|```question|\*\*Questão\s*\d+\*\*/gi
  const questoes = resposta.match(questoesRegex) || []
  const questoesEncontradas = questoes.length

  if (questoesEncontradas < config.quantidade) {
    problemas.push(`Faltam ${config.quantidade - questoesEncontradas} questões`)
    pontos -= (config.quantidade - questoesEncontradas) * 10
  }

  // 2. Verificar alternativas (5 por questão)
  const alternativas = resposta.match(/^[a-e]\)|"letra":\s*"[a-e]"/gm) || []
  const alternativasEsperadas = config.quantidade * 5

  if (alternativas.length < alternativasEsperadas * 0.9) {
    problemas.push('Algumas questões podem estar com alternativas faltando')
    pontos -= 10
  }

  // 3. Verificar gabaritos
  const gabaritos = resposta.match(/gabarito|resposta correta/gi) || []
  if (gabaritos.length < config.quantidade * 0.8) {
    problemas.push('Algumas questões estão sem gabarito')
    pontos -= 15
  }

  // 4. Verificar explicações das erradas
  const explicacoesErradas = resposta.match(/por que.*(errad|incorret)|"erradas":/gi) || []
  if (explicacoesErradas.length < config.quantidade * 0.5) {
    problemas.push('Faltam explicações das alternativas erradas')
    pontos -= 10
  }

  // 5. Verificar referências
  const referencias = resposta.match(/(GUYTON|TORTORA|MOORE|ROBBINS|RANG|PORTO|referencia|referência|📚)/gi) || []
  if (referencias.length < config.quantidade * 0.8) {
    problemas.push('Faltam referências bibliográficas')
    pontos -= 10
  }

  // 6. Verificar dicas de memorização
  const dicas = resposta.match(/(dica|💡|mnemônico|memoriz|dica_memorizacao)/gi) || []
  if (dicas.length < config.quantidade * 0.5) {
    problemas.push('Faltam dicas de memorização')
    pontos -= 5
  }

  // 7. Verificar níveis indicados
  const niveis = resposta.match(/(fácil|facil|médio|medio|difícil|dificil|nível|nivel|"nivel")/gi) || []
  if (niveis.length < config.quantidade) {
    problemas.push('Nem todas questões têm nível de dificuldade indicado')
    pontos -= 5
  }

  // 8. Verificar Bloom
  const bloom = resposta.match(/(lembrar|entender|aplicar|analisar|avaliar|criar|bloom)/gi) || []
  if (bloom.length < config.quantidade * 0.5) {
    problemas.push('Faltam indicações de nível cognitivo (Bloom)')
    pontos -= 5
  }

  return {
    valido: problemas.length === 0,
    questoesEncontradas,
    problemasEncontrados: problemas,
    qualidade: Math.max(0, pontos)
  }
}

/**
 * Gera prompt de continuação se questões incompletas
 */
export function gerarPromptContinuacaoQuestoes(
  validacao: ReturnType<typeof validarQuestoesGeradas>,
  config: ConfiguracaoQuestoes,
  questoesJaGeradas: number
): string {
  return `
## CONTINUE GERANDO AS QUESTÕES FALTANTES

Você gerou ${questoesJaGeradas} de ${config.quantidade} questões.

**PROBLEMAS DETECTADOS:**
${validacao.problemasEncontrados.map(p => `- ${p}`).join('\n')}

**AÇÃO NECESSÁRIA:**
${config.quantidade - questoesJaGeradas > 0
  ? `- Gerar mais ${config.quantidade - questoesJaGeradas} questões (começar da questão ${questoesJaGeradas + 1})`
  : '- Completar gabaritos/referências faltantes'}

**REGRAS:**
- NÃO repita questões já feitas
- Continue a numeração de onde parou
- Mantenha o mesmo padrão de qualidade
- Siga a distribuição de respostas definida anteriormente

CONTINUE AGORA:
`
}

// ============== FUNÇÕES AUXILIARES (mantidas do original) ==============

/**
 * Gera configuração completa para geração de questões (compatibilidade)
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
    incluirDicas: config.incluirDicas ?? true,
    areasTematicas: config.areasTematicas || [],
    tempoEstimado: config.tempoEstimado
  }

  // Obter template
  const template = TEMPLATES_QUESTAO[configuracao.tipo]

  // Criar config de questões para usar o prompt profissional
  const configQuestoes: ConfiguracaoQuestoes = {
    quantidade,
    tema,
    dificuldade: configuracao.nivel === 'muito_dificil' ? 'dificil' : configuracao.nivel,
    incluirCasosClinicos: configuracao.tipo === 'caso_clinico' || quantidade >= 5,
    incluirImagens: configuracao.incluirImagem ?? false,
    niveisCognitivos: 'misto',
    formatoGabarito: 'detalhado',
    estilo: configuracao.estilo
  }

  // Gerar prompt profissional
  const prompt = gerarPromptQuestoesProfissional(configQuestoes)

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
    'ecg', 'eletrocardiograma', 'dermatolog', 'lesão', 'lesao',
    'rx', 'tc', 'rm', 'pet', 'cintilografia', 'endoscop'
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
    return tiposEstilo[0]
  }

  // Detectar por tema
  if (temaLower.includes('caso') || temaLower.includes('paciente') ||
      temaLower.includes('clínico') || temaLower.includes('clinico')) {
    return 'caso_clinico'
  }

  if (temaLower.includes('imagem') || temaLower.includes('identific') ||
      temaLower.includes('anatomia') || temaLower.includes('histolog')) {
    return 'interpretacao_imagem'
  }

  if (temaLower.includes('sequência') || temaLower.includes('sequencia') ||
      temaLower.includes('ordem') || temaLower.includes('etapas')) {
    return 'sequencia_logica'
  }

  if (temaLower.includes('associar') || temaLower.includes('relacionar') ||
      temaLower.includes('correlacionar')) {
    return 'associacao'
  }

  if (temaLower.includes('dissertativa') || temaLower.includes('explique') ||
      temaLower.includes('descreva') || temaLower.includes('discorra')) {
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
      if (!/[a-e]\)|"letra":\s*"[a-e]"/gi.test(questao)) {
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
