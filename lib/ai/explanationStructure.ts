/**
 * Explanation Structure - Inspirado na Meta AI
 *
 * Templates estruturados para explicações educacionais:
 * - Diferentes formatos para diferentes tipos de conteúdo
 * - Estrutura clara e organizada
 * - Integração de elementos visuais e práticos
 * - Adaptação ao nível do estudante
 */

import type { NivelConhecimento, PreferenciaEstudo } from './userProfileManager'
import type { NivelUrgencia } from './urgencyDetector'

export type TipoExplicacao =
  | 'conceito'           // Explicação de conceito/definição
  | 'processo'           // Descrição de processo/mecanismo
  | 'comparacao'         // Comparação entre elementos
  | 'caso_explicativo'   // Explicação via caso clínico
  | 'revisao_rapida'     // Resumo rápido para revisão
  | 'aprofundamento'     // Explicação detalhada/avançada
  | 'mnemonica'          // Técnicas de memorização
  | 'fluxograma_texto'   // Fluxo de decisão em texto

export interface ConfiguracaoExplicacao {
  tipo: TipoExplicacao
  nivel: NivelConhecimento
  preferencia: PreferenciaEstudo
  urgencia: NivelUrgencia
  incluirImagens: boolean
  incluirExemplos: boolean
  incluirQuestoes: boolean
  incluirResumo: boolean
  incluirReferencias: boolean
}

export interface TemplateExplicacao {
  tipo: TipoExplicacao
  titulo: string
  estrutura: string[]
  elementosObrigatorios: string[]
  elementosOpcionais: string[]
  exemploPratico: string
}

// Templates de explicação por tipo
export const TEMPLATES_EXPLICACAO: Record<TipoExplicacao, TemplateExplicacao> = {
  conceito: {
    tipo: 'conceito',
    titulo: 'Explicação de Conceito',
    estrutura: [
      '## 📖 [NOME DO CONCEITO]',
      '',
      '### O que é?',
      '[Definição clara e objetiva em 2-3 frases]',
      '',
      '### Características principais',
      '- [Característica 1]',
      '- [Característica 2]',
      '- [Característica 3]',
      '',
      '### Por que é importante?',
      '[Relevância clínica/prática em 2-3 frases]',
      '',
      '### Exemplo prático',
      '[Situação que ilustra o conceito]',
      '',
      '### 💡 Para lembrar',
      '[Dica de memorização ou ponto-chave]'
    ],
    elementosObrigatorios: ['definição', 'características', 'importância'],
    elementosOpcionais: ['exemplo', 'dica de memorização', 'imagem', 'questão'],
    exemploPratico: 'Conceito: Homeostase - "Tendência do organismo de manter o equilíbrio interno..."'
  },

  processo: {
    tipo: 'processo',
    titulo: 'Explicação de Processo/Mecanismo',
    estrutura: [
      '## ⚙️ [NOME DO PROCESSO]',
      '',
      '### Visão geral',
      '[O que é e qual sua função - 2-3 frases]',
      '',
      '### Etapas do processo',
      '',
      '**1️⃣ [Etapa 1]**',
      '[Descrição da etapa]',
      '',
      '**2️⃣ [Etapa 2]**',
      '[Descrição da etapa]',
      '',
      '**3️⃣ [Etapa 3]**',
      '[Descrição da etapa]',
      '',
      '### Fatores que influenciam',
      '- **Estimuladores:** [Lista]',
      '- **Inibidores:** [Lista]',
      '',
      '### Aplicação clínica',
      '[Como isso se manifesta na prática/doença]',
      '',
      '### 🔄 Resumo do fluxo',
      '[Etapa 1] → [Etapa 2] → [Etapa 3] → [Resultado]'
    ],
    elementosObrigatorios: ['visão geral', 'etapas', 'resumo do fluxo'],
    elementosOpcionais: ['fatores moduladores', 'aplicação clínica', 'imagem', 'questão'],
    exemploPratico: 'Processo: Cascata de coagulação - etapas da via intrínseca e extrínseca'
  },

  comparacao: {
    tipo: 'comparacao',
    titulo: 'Comparação entre Elementos',
    estrutura: [
      '## ⚖️ [ELEMENTO A] vs [ELEMENTO B]',
      '',
      '### Resumo das diferenças',
      '| Aspecto | [Elemento A] | [Elemento B] |',
      '|---------|--------------|--------------|',
      '| [Aspecto 1] | [Valor] | [Valor] |',
      '| [Aspecto 2] | [Valor] | [Valor] |',
      '| [Aspecto 3] | [Valor] | [Valor] |',
      '',
      '### [Elemento A] em detalhes',
      '[Descrição específica]',
      '',
      '### [Elemento B] em detalhes',
      '[Descrição específica]',
      '',
      '### Semelhanças',
      '- [Semelhança 1]',
      '- [Semelhança 2]',
      '',
      '### Quando usar cada um?',
      '- **Use [A] quando:** [Contexto]',
      '- **Use [B] quando:** [Contexto]',
      '',
      '### 💡 Dica de memorização',
      '[Macete para diferenciar]'
    ],
    elementosObrigatorios: ['tabela comparativa', 'descrição individual', 'diferenciação prática'],
    elementosOpcionais: ['semelhanças', 'dica de memorização', 'questão comparativa'],
    exemploPratico: 'Comparação: Diabetes Tipo 1 vs Tipo 2'
  },

  caso_explicativo: {
    tipo: 'caso_explicativo',
    titulo: 'Explicação via Caso Clínico',
    estrutura: [
      '## 🏥 Entendendo [TEMA] através de um caso',
      '',
      '### 📋 O Caso',
      '**Paciente:** [Perfil básico]',
      '**Queixa:** "[Sintoma principal]"',
      '',
      '### 🔍 Vamos analisar juntos',
      '',
      '**Por que esse sintoma aparece?**',
      '[Explicação do mecanismo usando o caso]',
      '',
      '**O que esperar no exame físico?**',
      '[Achados e sua explicação]',
      '',
      '**O que os exames mostrariam?**',
      '[Alterações esperadas e por quê]',
      '',
      '### 📚 Conceitos envolvidos',
      '1. **[Conceito 1]:** [Breve explicação]',
      '2. **[Conceito 2]:** [Breve explicação]',
      '',
      '### ✅ Pontos-chave do caso',
      '- [Ponto 1]',
      '- [Ponto 2]',
      '- [Ponto 3]'
    ],
    elementosObrigatorios: ['caso ilustrativo', 'análise passo a passo', 'conceitos extraídos'],
    elementosOpcionais: ['conduta', 'diagnósticos diferenciais', 'questão sobre o caso'],
    exemploPratico: 'Caso: Paciente com dor torácica - explicando IAM'
  },

  revisao_rapida: {
    tipo: 'revisao_rapida',
    titulo: 'Revisão Rápida',
    estrutura: [
      '## ⚡ Revisão Rápida: [TEMA]',
      '',
      '### 📌 TL;DR (Resumo em 3 pontos)',
      '1. [Ponto mais importante]',
      '2. [Segundo ponto crucial]',
      '3. [Terceiro ponto essencial]',
      '',
      '### 🎯 Conceitos-chave',
      '- **[Termo 1]:** [Definição curta]',
      '- **[Termo 2]:** [Definição curta]',
      '- **[Termo 3]:** [Definição curta]',
      '',
      '### 🧠 Para não esquecer',
      '> [Mnemônico ou frase de memorização]',
      '',
      '### ⚠️ Pegadinhas comuns',
      '- [Erro comum 1 e correção]',
      '- [Erro comum 2 e correção]',
      '',
      '### 📝 Testou? Pergunta rápida:',
      '[Uma questão de fixação simples]'
    ],
    elementosObrigatorios: ['resumo em pontos', 'conceitos-chave'],
    elementosOpcionais: ['mnemônico', 'pegadinhas', 'questão rápida'],
    exemploPratico: 'Revisão: Sinais de alerta em cefaleia'
  },

  aprofundamento: {
    tipo: 'aprofundamento',
    titulo: 'Explicação Aprofundada',
    estrutura: [
      '## 🔬 [TEMA] - Análise Aprofundada',
      '',
      '### Contexto e importância',
      '[Contextualização detalhada do tema]',
      '',
      '### Base teórica',
      '[Fundamentação científica/fisiológica]',
      '',
      '### Mecanismos moleculares/celulares',
      '[Descrição dos processos em nível molecular]',
      '',
      '### Correlações clínicas',
      '[Como se manifesta clinicamente]',
      '',
      '### Implicações terapêuticas',
      '[Como o conhecimento impacta o tratamento]',
      '',
      '### Evidências científicas',
      '[Estudos relevantes ou guidelines]',
      '',
      '### Avanços recentes',
      '[Descobertas ou mudanças de paradigma]',
      '',
      '### 📚 Para saber mais',
      '- [Referência 1]',
      '- [Referência 2]'
    ],
    elementosObrigatorios: ['base teórica', 'mecanismos', 'correlações clínicas'],
    elementosOpcionais: ['evidências', 'avanços recentes', 'referências'],
    exemploPratico: 'Aprofundamento: Via de sinalização da insulina'
  },

  mnemonica: {
    tipo: 'mnemonica',
    titulo: 'Técnicas de Memorização',
    estrutura: [
      '## 🧠 Memorizando: [TEMA]',
      '',
      '### 📝 O que precisamos lembrar',
      '[Lista do conteúdo a memorizar]',
      '',
      '### 🎯 Mnemônico principal',
      '> **[SIGLA/PALAVRA-CHAVE]**',
      '> - **[Letra]** = [Significado]',
      '> - **[Letra]** = [Significado]',
      '> - **[Letra]** = [Significado]',
      '',
      '### 🖼️ Associação visual',
      '[Descrição de imagem mental ou história]',
      '',
      '### 🔗 Conexões lógicas',
      '[Como relacionar os conceitos entre si]',
      '',
      '### 📖 Contexto que ajuda a fixar',
      '[Mini caso ou situação que ilustra]',
      '',
      '### ✅ Teste sua memória',
      '[Pergunta para autoavaliação]'
    ],
    elementosObrigatorios: ['conteúdo a memorizar', 'mnemônico', 'teste de memória'],
    elementosOpcionais: ['associação visual', 'conexões lógicas', 'contexto'],
    exemploPratico: 'Mnemônico: ABCDE do atendimento ao politraumatizado'
  },

  fluxograma_texto: {
    tipo: 'fluxograma_texto',
    titulo: 'Fluxo de Decisão',
    estrutura: [
      '## 📊 Fluxo de Decisão: [TEMA]',
      '',
      '### Ponto de partida',
      '📍 [Situação inicial/queixa]',
      '',
      '### Algoritmo',
      '',
      '```',
      '[Situação inicial]',
      '      │',
      '      ▼',
      '  [Pergunta 1]?',
      '    /      \\',
      '  SIM      NÃO',
      '   │        │',
      '   ▼        ▼',
      '[Ação A]  [Pergunta 2]?',
      '            /     \\',
      '          SIM     NÃO',
      '           │       │',
      '           ▼       ▼',
      '        [Ação B] [Ação C]',
      '```',
      '',
      '### Explicação das decisões',
      '',
      '**Se [condição 1]:** [Por que essa ação]',
      '',
      '**Se [condição 2]:** [Por que essa ação]',
      '',
      '### ⚠️ Sinais de alerta',
      '- [Quando desviar do fluxo padrão]',
      '',
      '### 📋 Resumo prático',
      '[Versão simplificada do algoritmo]'
    ],
    elementosObrigatorios: ['ponto de partida', 'algoritmo visual', 'explicação das decisões'],
    elementosOpcionais: ['sinais de alerta', 'resumo prático'],
    exemploPratico: 'Fluxo: Abordagem de dor torácica no PS'
  }
}

/**
 * Seleciona o melhor tipo de explicação baseado na pergunta
 */
export function selecionarTipoExplicacao(
  pergunta: string,
  config: Partial<ConfiguracaoExplicacao> = {}
): TipoExplicacao {
  const perguntaLower = pergunta.toLowerCase()

  // Se urgência crítica ou alta, usar revisão rápida
  if (config.urgencia === 'critica' || config.urgencia === 'alta') {
    return 'revisao_rapida'
  }

  // Detectar por palavras-chave
  if (perguntaLower.includes('diferença') || perguntaLower.includes('diferenca') ||
      perguntaLower.includes('comparar') || perguntaLower.includes('versus') ||
      perguntaLower.includes(' vs ') || perguntaLower.includes(' x ')) {
    return 'comparacao'
  }

  if (perguntaLower.includes('processo') || perguntaLower.includes('mecanismo') ||
      perguntaLower.includes('como funciona') || perguntaLower.includes('via de') ||
      perguntaLower.includes('cascata') || perguntaLower.includes('ciclo')) {
    return 'processo'
  }

  if (perguntaLower.includes('caso') || perguntaLower.includes('paciente') ||
      perguntaLower.includes('exemplo prático') || perguntaLower.includes('exemplo pratico')) {
    return 'caso_explicativo'
  }

  if (perguntaLower.includes('resumo') || perguntaLower.includes('rápido') ||
      perguntaLower.includes('rapido') || perguntaLower.includes('revisar') ||
      perguntaLower.includes('revisão') || perguntaLower.includes('revisao')) {
    return 'revisao_rapida'
  }

  if (perguntaLower.includes('memoriz') || perguntaLower.includes('mnemônico') ||
      perguntaLower.includes('mnemonico') || perguntaLower.includes('macete') ||
      perguntaLower.includes('dica para lembrar')) {
    return 'mnemonica'
  }

  if (perguntaLower.includes('fluxo') || perguntaLower.includes('algoritmo') ||
      perguntaLower.includes('quando') || perguntaLower.includes('conduta') ||
      perguntaLower.includes('decidir')) {
    return 'fluxograma_texto'
  }

  if (perguntaLower.includes('aprofundar') || perguntaLower.includes('detalhado') ||
      perguntaLower.includes('molecular') || perguntaLower.includes('avançado') ||
      perguntaLower.includes('avancado') || config.nivel === 'avancado') {
    return 'aprofundamento'
  }

  // Padrão: explicação de conceito
  return 'conceito'
}

/**
 * Gera instruções de estrutura para o prompt do sistema
 */
export function gerarInstrucoesEstrutura(
  tipoExplicacao: TipoExplicacao,
  config: Partial<ConfiguracaoExplicacao> = {}
): string {
  const template = TEMPLATES_EXPLICACAO[tipoExplicacao]
  const instrucoes: string[] = []

  instrucoes.push(`## 📋 ESTRUTURA DE RESPOSTA: ${template.titulo}`)
  instrucoes.push('')
  instrucoes.push('### Siga esta estrutura:')
  instrucoes.push('```')
  instrucoes.push(template.estrutura.join('\n'))
  instrucoes.push('```')
  instrucoes.push('')

  // Elementos obrigatórios
  instrucoes.push('### ✅ Obrigatório incluir:')
  template.elementosObrigatorios.forEach(elem => {
    instrucoes.push(`- ${elem}`)
  })
  instrucoes.push('')

  // Elementos opcionais baseados na config
  const elementosAdicionais: string[] = []
  if (config.incluirImagens) elementosAdicionais.push('imagem ilustrativa')
  if (config.incluirExemplos) elementosAdicionais.push('exemplo prático')
  if (config.incluirQuestoes) elementosAdicionais.push('questão de fixação')
  if (config.incluirResumo) elementosAdicionais.push('resumo ao final')
  if (config.incluirReferencias) elementosAdicionais.push('referências bibliográficas')

  if (elementosAdicionais.length > 0) {
    instrucoes.push('### ➕ Incluir também:')
    elementosAdicionais.forEach(elem => {
      instrucoes.push(`- ${elem}`)
    })
    instrucoes.push('')
  }

  // Adaptações por nível
  if (config.nivel) {
    instrucoes.push(`### 🎓 Adaptação para nível ${config.nivel}:`)
    switch (config.nivel) {
      case 'iniciante':
        instrucoes.push('- Use linguagem acessível')
        instrucoes.push('- Explique termos técnicos')
        instrucoes.push('- Use analogias do dia-a-dia')
        instrucoes.push('- Evite excesso de detalhes')
        break
      case 'intermediario':
        instrucoes.push('- Balance termos técnicos e explicações')
        instrucoes.push('- Inclua correlações clínicas')
        instrucoes.push('- Relacione com conhecimentos prévios')
        break
      case 'avancado':
        instrucoes.push('- Use terminologia técnica precisa')
        instrucoes.push('- Inclua detalhes moleculares quando relevante')
        instrucoes.push('- Mencione evidências científicas')
        instrucoes.push('- Discuta nuances e exceções')
        break
    }
    instrucoes.push('')
  }

  return instrucoes.join('\n')
}

/**
 * Gera prompt completo de estruturação
 */
export function gerarPromptEstruturado(
  pergunta: string,
  tema: string,
  config: ConfiguracaoExplicacao
): string {
  const tipoExplicacao = selecionarTipoExplicacao(pergunta, config)
  const instrucoesEstrutura = gerarInstrucoesEstrutura(tipoExplicacao, config)

  let prompt = `
# 📚 INSTRUÇÃO DE RESPOSTA ESTRUTURADA

**Tema:** ${tema}
**Pergunta:** ${pergunta}
**Tipo de explicação:** ${tipoExplicacao}
**Nível do estudante:** ${config.nivel}

${instrucoesEstrutura}
`

  // Adicionar instruções específicas de urgência
  if (config.urgencia === 'critica' || config.urgencia === 'alta') {
    prompt += `
### ⚡ URGÊNCIA ${config.urgencia.toUpperCase()}:
- Comece com o mais importante
- Seja direto e objetivo
- Evite introduções longas
- Destaque pontos-chave em negrito
`
  }

  // Adicionar instruções de imagem
  if (config.incluirImagens) {
    prompt += `
### 🖼️ IMAGENS:
- Use a ferramenta buscar_imagens_medicas para imagem relevante
- Posicione a imagem próxima ao conteúdo relacionado
`
  }

  return prompt.trim()
}

/**
 * Valida se a resposta segue a estrutura esperada
 */
export function validarEstruturaResposta(
  resposta: string,
  tipoExplicacao: TipoExplicacao
): { valida: boolean; elementosFaltantes: string[] } {
  const template = TEMPLATES_EXPLICACAO[tipoExplicacao]
  const elementosFaltantes: string[] = []

  // Verificar elementos obrigatórios
  const verificadores: Record<string, RegExp> = {
    'definição': /o que é|definição|definiç/i,
    'características': /característic|propriedade|aspecto/i,
    'importância': /importân|relevân|por que/i,
    'etapas': /etapa|passo|fase|\d+[.º°)]\s/i,
    'visão geral': /visão geral|resumo|introdução/i,
    'resumo do fluxo': /→|>>|fluxo|sequência/i,
    'tabela comparativa': /\|.*\|.*\|/i,
    'descrição individual': /em detalhe|especific/i,
    'diferenciação prática': /quando usar|indicaç|situaç/i,
    'caso ilustrativo': /paciente|caso|exemplo/i,
    'análise passo a passo': /analis|vamos|observe/i,
    'conceitos extraídos': /conceito|ponto|chave/i,
    'resumo em pontos': /tl;dr|resum|ponto/i,
    'conceitos-chave': /conceito|chave|termo/i,
    'base teórica': /teor|fundament|base/i,
    'mecanismos': /mecanismo|molecul|celul/i,
    'correlações clínicas': /clínic|prática|manifest/i,
    'conteúdo a memorizar': /memori|lembr|fixar/i,
    'mnemônico': /mnemôn|sigla|macete/i,
    'teste de memória': /teste|pergunta|quiz/i,
    'ponto de partida': /iníci|ponto de partida|situação/i,
    'algoritmo visual': /│|▼|→|fluxo/i,
    'explicação das decisões': /se.*:|decisão|escolh/i
  }

  for (const elemento of template.elementosObrigatorios) {
    const verificador = verificadores[elemento]
    if (verificador && !verificador.test(resposta)) {
      elementosFaltantes.push(elemento)
    }
  }

  return {
    valida: elementosFaltantes.length === 0,
    elementosFaltantes
  }
}

/**
 * Gera sugestão de melhoria para estrutura incompleta
 */
export function gerarSugestaoMelhoria(elementosFaltantes: string[]): string {
  if (elementosFaltantes.length === 0) return ''

  let sugestao = '\n\n---\n**💡 Para melhorar esta explicação, adicione:**\n'
  elementosFaltantes.forEach(elem => {
    sugestao += `- ${elem}\n`
  })

  return sugestao
}

/**
 * Combina múltiplos templates para respostas complexas
 */
export function combinarTemplates(
  tiposPrimarios: TipoExplicacao[],
  config: Partial<ConfiguracaoExplicacao> = {}
): string {
  const instrucoes: string[] = []

  instrucoes.push('## 📚 RESPOSTA COMBINADA')
  instrucoes.push('')
  instrucoes.push('Esta resposta deve combinar os seguintes elementos:')
  instrucoes.push('')

  tiposPrimarios.forEach((tipo, index) => {
    const template = TEMPLATES_EXPLICACAO[tipo]
    instrucoes.push(`### ${index + 1}. ${template.titulo}`)
    instrucoes.push(`Elementos obrigatórios: ${template.elementosObrigatorios.join(', ')}`)
    instrucoes.push('')
  })

  // Ordem sugerida
  instrucoes.push('### 📋 Ordem sugerida:')
  if (tiposPrimarios.includes('revisao_rapida')) {
    instrucoes.push('1. Resumo inicial (se inclui revisão rápida)')
  }
  instrucoes.push('2. Explicação principal')
  if (tiposPrimarios.includes('comparacao')) {
    instrucoes.push('3. Tabela comparativa')
  }
  if (tiposPrimarios.includes('caso_explicativo')) {
    instrucoes.push('4. Caso ilustrativo')
  }
  if (config.incluirQuestoes) {
    instrucoes.push('5. Questão de fixação')
  }

  return instrucoes.join('\n')
}
