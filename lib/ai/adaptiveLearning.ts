/**
 * Sistema de Aprendizado Adaptativo
 * Baseado na arquitetura Meta AI
 *
 * Funcionalidades:
 * - Análise de desempenho do usuário
 * - Adaptação de dificuldade em tempo real
 * - Identificação de pontos fracos
 * - Feedback educacional personalizado
 * - Recomendações de estudo
 */

import type { NivelDificuldade, NivelCognitivo } from './questionGenerator'

// ============== TIPOS ==============

export interface DesempenhoUsuario {
  userId: string
  totalQuestoes: number
  acertos: number
  erros: number
  taxaAcerto: number
  errosPorTema: Record<string, number>
  acertosPorTema: Record<string, number>
  tempoMedioResposta: number // em segundos
  ultimasRespostas: RespostaHistorico[]
  sequenciaAtual: {
    acertos: number
    erros: number
  }
  dificuldadeAtual: NivelDificuldade
  nivelCognitivoAtual: NivelCognitivo
}

export interface RespostaHistorico {
  resultado: 'acerto' | 'erro'
  tema: string
  dificuldade: NivelDificuldade
  nivelCognitivo: NivelCognitivo
  tempoResposta: number
  dataHora: Date
}

export interface AdaptacaoRecomendada {
  ajusteDificuldade: 'diminuir' | 'manter' | 'aumentar'
  novaDificuldade: NivelDificuldade
  novoNivelCognitivo: NivelCognitivo
  temasParaReforcar: string[]
  temasFortes: string[]
  mensagemMotivacional: string
  proximaQuestaoConfig: {
    dificuldade: NivelDificuldade
    temasSugeridos: string[]
    nivelCognitivo: NivelCognitivo
    incluirCasoClinico: boolean
  }
  recomendacoesEstudo: string[]
  metaProximaSessao: string
}

export interface FeedbackQuestao {
  tipo: 'acerto' | 'erro' | 'parcial'
  mensagemPrincipal: string
  explicacaoDetalhada: string
  pontosFortes: string[]
  pontosParaMelhorar: string[]
  recursosRecomendados: string[]
  dicaMemorizacao: string
  proximoPasso: string
}

// ============== CONSTANTES ==============

// Limiares para adaptação
const LIMIARES = {
  // Taxa de acerto para aumentar dificuldade
  AUMENTAR_DIFICULDADE: 0.8,
  // Taxa de acerto para diminuir dificuldade
  DIMINUIR_DIFICULDADE: 0.4,
  // Número mínimo de questões para análise confiável
  MIN_QUESTOES_ANALISE: 5,
  // Número de últimas respostas para análise de tendência
  JANELA_TENDENCIA: 10,
  // Sequência de acertos para aumentar dificuldade
  SEQUENCIA_ACERTOS_AUMENTAR: 5,
  // Sequência de erros para diminuir dificuldade
  SEQUENCIA_ERROS_DIMINUIR: 3,
  // Número de erros em tema para marcar como ponto fraco
  ERROS_PONTO_FRACO: 3
}

// Mensagens motivacionais por faixa de desempenho
const MENSAGENS_MOTIVACIONAIS = {
  excelente: [
    'Excelente desempenho! Você está dominando o conteúdo!',
    'Parabéns! Sua dedicação está dando resultados!',
    'Impressionante! Continue assim e o sucesso é garantido!',
    'Você está arrasando! Esse nível de preparo vai fazer diferença na prova!'
  ],
  bom: [
    'Bom trabalho! Continue praticando para melhorar ainda mais.',
    'Você está no caminho certo! Mantenha o foco.',
    'Ótimo progresso! Cada questão é uma oportunidade de aprender.',
    'Muito bem! Com mais prática você vai dominar esse conteúdo.'
  ],
  regular: [
    'Você está progredindo! Foque nos temas que precisa reforçar.',
    'Não desanime! O aprendizado é um processo gradual.',
    'Continue firme! Revise os conceitos básicos para fortalecer sua base.',
    'Cada erro é uma chance de aprender algo novo. Vamos em frente!'
  ],
  precisa_atencao: [
    'Vamos revisar os conceitos básicos juntos. Você consegue!',
    'Não se preocupe com os erros, eles fazem parte do aprendizado.',
    'Sugiro dar um passo atrás e revisar o conteúdo fundamental.',
    'Está difícil? Vamos focar no básico primeiro e construir daí.'
  ]
}

// Ordem de dificuldade para progressão
const ORDEM_DIFICULDADE: NivelDificuldade[] = ['facil', 'medio', 'dificil', 'muito_dificil']

// Ordem de níveis cognitivos (Bloom)
const ORDEM_BLOOM: NivelCognitivo[] = ['lembrar', 'entender', 'aplicar', 'analisar', 'avaliar', 'criar']

// ============== FUNÇÕES PRINCIPAIS ==============

/**
 * Cria um perfil de desempenho inicial para um usuário
 */
export function criarPerfilDesempenho(userId: string): DesempenhoUsuario {
  return {
    userId,
    totalQuestoes: 0,
    acertos: 0,
    erros: 0,
    taxaAcerto: 0,
    errosPorTema: {},
    acertosPorTema: {},
    tempoMedioResposta: 0,
    ultimasRespostas: [],
    sequenciaAtual: { acertos: 0, erros: 0 },
    dificuldadeAtual: 'medio',
    nivelCognitivoAtual: 'entender'
  }
}

/**
 * Atualiza o perfil de desempenho com uma nova resposta
 */
export function atualizarDesempenho(
  perfil: DesempenhoUsuario,
  resposta: {
    acertou: boolean
    tema: string
    dificuldade: NivelDificuldade
    nivelCognitivo: NivelCognitivo
    tempoResposta: number
  }
): DesempenhoUsuario {
  const novoTotal = perfil.totalQuestoes + 1
  const novosAcertos = perfil.acertos + (resposta.acertou ? 1 : 0)
  const novosErros = perfil.erros + (resposta.acertou ? 0 : 1)

  // Atualizar erros/acertos por tema
  const errosPorTema = { ...perfil.errosPorTema }
  const acertosPorTema = { ...perfil.acertosPorTema }

  if (resposta.acertou) {
    acertosPorTema[resposta.tema] = (acertosPorTema[resposta.tema] || 0) + 1
  } else {
    errosPorTema[resposta.tema] = (errosPorTema[resposta.tema] || 0) + 1
  }

  // Atualizar sequência
  const sequenciaAtual = resposta.acertou
    ? { acertos: perfil.sequenciaAtual.acertos + 1, erros: 0 }
    : { acertos: 0, erros: perfil.sequenciaAtual.erros + 1 }

  // Adicionar ao histórico (manter últimas N)
  const novaResposta: RespostaHistorico = {
    resultado: resposta.acertou ? 'acerto' : 'erro',
    tema: resposta.tema,
    dificuldade: resposta.dificuldade,
    nivelCognitivo: resposta.nivelCognitivo,
    tempoResposta: resposta.tempoResposta,
    dataHora: new Date()
  }

  const ultimasRespostas = [...perfil.ultimasRespostas, novaResposta]
    .slice(-LIMIARES.JANELA_TENDENCIA)

  // Calcular tempo médio
  const tempoMedioResposta = ultimasRespostas.reduce((acc, r) => acc + r.tempoResposta, 0) /
    ultimasRespostas.length

  return {
    ...perfil,
    totalQuestoes: novoTotal,
    acertos: novosAcertos,
    erros: novosErros,
    taxaAcerto: novosAcertos / novoTotal,
    errosPorTema,
    acertosPorTema,
    tempoMedioResposta,
    ultimasRespostas,
    sequenciaAtual
  }
}

/**
 * Analisa o desempenho e retorna recomendações de adaptação
 */
export function analisarDesempenhoEAdaptar(
  perfil: DesempenhoUsuario
): AdaptacaoRecomendada {
  // Calcular tendência recente
  const tendenciaRecente = calcularTendenciaRecente(perfil)

  // Identificar temas fracos e fortes
  const { temasParaReforcar, temasFortes } = identificarTemasDestaque(perfil)

  // Determinar ajuste de dificuldade
  const ajuste = determinarAjusteDificuldade(perfil, tendenciaRecente)

  // Calcular nova dificuldade
  const novaDificuldade = calcularNovaDificuldade(perfil.dificuldadeAtual, ajuste)

  // Calcular novo nível cognitivo
  const novoNivelCognitivo = calcularNovoNivelCognitivo(perfil.nivelCognitivoAtual, ajuste)

  // Selecionar mensagem motivacional
  const mensagemMotivacional = selecionarMensagemMotivacional(perfil.taxaAcerto, tendenciaRecente)

  // Gerar recomendações de estudo
  const recomendacoesEstudo = gerarRecomendacoesEstudo(perfil, temasParaReforcar)

  // Definir meta para próxima sessão
  const metaProximaSessao = definirMetaProximaSessao(perfil)

  return {
    ajusteDificuldade: ajuste,
    novaDificuldade,
    novoNivelCognitivo,
    temasParaReforcar,
    temasFortes,
    mensagemMotivacional,
    proximaQuestaoConfig: {
      dificuldade: novaDificuldade,
      temasSugeridos: temasParaReforcar.length > 0 ? temasParaReforcar : temasFortes,
      nivelCognitivo: novoNivelCognitivo,
      incluirCasoClinico: perfil.taxaAcerto >= 0.6 && novaDificuldade !== 'facil'
    },
    recomendacoesEstudo,
    metaProximaSessao
  }
}

/**
 * Gera feedback educacional detalhado para uma resposta
 */
export function gerarFeedbackQuestao(
  acertou: boolean,
  questao: {
    enunciado: string
    tema: string
    respostaCorreta: string
    respostaUsuario: string
    explicacao: string
    dificuldade: NivelDificuldade
  },
  perfil: DesempenhoUsuario
): FeedbackQuestao {
  const tipo = acertou ? 'acerto' : 'erro'

  // Mensagem principal
  const mensagemPrincipal = acertou
    ? gerarMensagemAcerto(perfil)
    : gerarMensagemErro(questao.tema, perfil)

  // Explicação detalhada
  const explicacaoDetalhada = acertou
    ? `Excelente! Você respondeu corretamente: **${questao.respostaCorreta}**\n\n${questao.explicacao}`
    : `A resposta correta era **${questao.respostaCorreta}**, não "${questao.respostaUsuario}".\n\n${questao.explicacao}`

  // Pontos fortes e para melhorar
  const pontosFortes = identificarPontosFortes(perfil, acertou, questao.tema)
  const pontosParaMelhorar = identificarPontosParaMelhorar(perfil, acertou, questao.tema)

  // Recursos recomendados
  const recursosRecomendados = gerarRecursosRecomendados(questao.tema, questao.dificuldade)

  // Dica de memorização
  const dicaMemorizacao = gerarDicaMemorizacao(questao.tema, acertou)

  // Próximo passo
  const proximoPasso = acertou
    ? 'Continue praticando para consolidar esse conhecimento!'
    : `Revise o tema "${questao.tema}" antes de continuar.`

  return {
    tipo,
    mensagemPrincipal,
    explicacaoDetalhada,
    pontosFortes,
    pontosParaMelhorar,
    recursosRecomendados,
    dicaMemorizacao,
    proximoPasso
  }
}

/**
 * Gera relatório de progresso do usuário
 */
export function gerarRelatorioProgresso(perfil: DesempenhoUsuario): string {
  const tendencia = calcularTendenciaRecente(perfil)
  const { temasParaReforcar, temasFortes } = identificarTemasDestaque(perfil)

  let relatorio = `
## 📊 Relatório de Progresso

### Estatísticas Gerais
- **Total de questões:** ${perfil.totalQuestoes}
- **Acertos:** ${perfil.acertos} (${(perfil.taxaAcerto * 100).toFixed(1)}%)
- **Erros:** ${perfil.erros}
- **Tempo médio por questão:** ${perfil.tempoMedioResposta.toFixed(1)}s

### Tendência Recente (últimas ${perfil.ultimasRespostas.length} questões)
- Taxa de acerto: **${(tendencia * 100).toFixed(1)}%**
- Sequência atual: ${perfil.sequenciaAtual.acertos > 0
    ? `🔥 ${perfil.sequenciaAtual.acertos} acertos seguidos!`
    : perfil.sequenciaAtual.erros > 0
      ? `⚠️ ${perfil.sequenciaAtual.erros} erros seguidos`
      : 'Começando nova sequência'}

### Nível Atual
- **Dificuldade:** ${traduzirDificuldade(perfil.dificuldadeAtual)}
- **Nível cognitivo:** ${traduzirNivelCognitivo(perfil.nivelCognitivoAtual)}
`

  if (temasFortes.length > 0) {
    relatorio += `
### ✅ Temas Fortes
${temasFortes.map(t => `- ${t}`).join('\n')}
`
  }

  if (temasParaReforcar.length > 0) {
    relatorio += `
### ⚠️ Temas para Reforçar
${temasParaReforcar.map(t => `- ${t}`).join('\n')}
`
  }

  // Recomendação
  const adaptacao = analisarDesempenhoEAdaptar(perfil)
  relatorio += `
### 💡 Recomendação
${adaptacao.mensagemMotivacional}

**Meta para próxima sessão:** ${adaptacao.metaProximaSessao}
`

  return relatorio
}

// ============== FUNÇÕES AUXILIARES ==============

function calcularTendenciaRecente(perfil: DesempenhoUsuario): number {
  if (perfil.ultimasRespostas.length === 0) return 0.5

  const acertosRecentes = perfil.ultimasRespostas.filter(r => r.resultado === 'acerto').length
  return acertosRecentes / perfil.ultimasRespostas.length
}

function identificarTemasDestaque(perfil: DesempenhoUsuario): {
  temasParaReforcar: string[]
  temasFortes: string[]
} {
  const temasParaReforcar: string[] = []
  const temasFortes: string[] = []

  // Identificar temas com mais erros
  for (const [tema, erros] of Object.entries(perfil.errosPorTema)) {
    const acertos = perfil.acertosPorTema[tema] || 0
    const total = erros + acertos

    if (total >= 3) {
      const taxa = acertos / total
      if (taxa < 0.5) {
        temasParaReforcar.push(tema)
      } else if (taxa >= 0.8) {
        temasFortes.push(tema)
      }
    } else if (erros >= LIMIARES.ERROS_PONTO_FRACO) {
      temasParaReforcar.push(tema)
    }
  }

  // Ordenar por número de erros (decrescente)
  temasParaReforcar.sort((a, b) =>
    (perfil.errosPorTema[b] || 0) - (perfil.errosPorTema[a] || 0)
  )

  return {
    temasParaReforcar: temasParaReforcar.slice(0, 5),
    temasFortes: temasFortes.slice(0, 5)
  }
}

function determinarAjusteDificuldade(
  perfil: DesempenhoUsuario,
  tendenciaRecente: number
): 'diminuir' | 'manter' | 'aumentar' {
  // Verificar sequência de acertos
  if (perfil.sequenciaAtual.acertos >= LIMIARES.SEQUENCIA_ACERTOS_AUMENTAR) {
    return 'aumentar'
  }

  // Verificar sequência de erros
  if (perfil.sequenciaAtual.erros >= LIMIARES.SEQUENCIA_ERROS_DIMINUIR) {
    return 'diminuir'
  }

  // Verificar taxa de acerto recente
  if (perfil.ultimasRespostas.length >= LIMIARES.MIN_QUESTOES_ANALISE) {
    if (tendenciaRecente >= LIMIARES.AUMENTAR_DIFICULDADE) {
      return 'aumentar'
    }
    if (tendenciaRecente <= LIMIARES.DIMINUIR_DIFICULDADE) {
      return 'diminuir'
    }
  }

  return 'manter'
}

function calcularNovaDificuldade(
  atual: NivelDificuldade,
  ajuste: 'diminuir' | 'manter' | 'aumentar'
): NivelDificuldade {
  const indiceAtual = ORDEM_DIFICULDADE.indexOf(atual)

  if (ajuste === 'aumentar' && indiceAtual < ORDEM_DIFICULDADE.length - 1) {
    return ORDEM_DIFICULDADE[indiceAtual + 1]
  }

  if (ajuste === 'diminuir' && indiceAtual > 0) {
    return ORDEM_DIFICULDADE[indiceAtual - 1]
  }

  return atual
}

function calcularNovoNivelCognitivo(
  atual: NivelCognitivo,
  ajuste: 'diminuir' | 'manter' | 'aumentar'
): NivelCognitivo {
  const indiceAtual = ORDEM_BLOOM.indexOf(atual)

  // Avançar mais devagar no nível cognitivo
  if (ajuste === 'aumentar' && indiceAtual < ORDEM_BLOOM.length - 1) {
    return ORDEM_BLOOM[indiceAtual + 1]
  }

  if (ajuste === 'diminuir' && indiceAtual > 0) {
    return ORDEM_BLOOM[indiceAtual - 1]
  }

  return atual
}

function selecionarMensagemMotivacional(
  taxaAcerto: number,
  tendenciaRecente: number
): string {
  // Usar tendência recente se tiver dados suficientes
  const taxa = tendenciaRecente > 0 ? tendenciaRecente : taxaAcerto

  let categoria: keyof typeof MENSAGENS_MOTIVACIONAIS

  if (taxa >= 0.8) {
    categoria = 'excelente'
  } else if (taxa >= 0.6) {
    categoria = 'bom'
  } else if (taxa >= 0.4) {
    categoria = 'regular'
  } else {
    categoria = 'precisa_atencao'
  }

  const mensagens = MENSAGENS_MOTIVACIONAIS[categoria]
  return mensagens[Math.floor(Math.random() * mensagens.length)]
}

function gerarRecomendacoesEstudo(
  perfil: DesempenhoUsuario,
  temasParaReforcar: string[]
): string[] {
  const recomendacoes: string[] = []

  // Recomendações baseadas em temas fracos
  if (temasParaReforcar.length > 0) {
    recomendacoes.push(`Revise os conceitos básicos de: ${temasParaReforcar.slice(0, 3).join(', ')}`)
  }

  // Recomendações baseadas em desempenho geral
  if (perfil.taxaAcerto < 0.5) {
    recomendacoes.push('Foque em questões de nível fácil para fortalecer a base')
    recomendacoes.push('Revise a teoria antes de fazer mais questões')
  } else if (perfil.taxaAcerto < 0.7) {
    recomendacoes.push('Pratique casos clínicos simples para consolidar')
    recomendacoes.push('Faça revisões espaçadas dos temas estudados')
  } else {
    recomendacoes.push('Aumente gradualmente a complexidade das questões')
    recomendacoes.push('Experimente questões de residência para desafiar-se')
  }

  // Recomendação de tempo
  if (perfil.tempoMedioResposta > 120) {
    recomendacoes.push('Tente reduzir o tempo de resposta sem perder qualidade')
  } else if (perfil.tempoMedioResposta < 30 && perfil.taxaAcerto < 0.6) {
    recomendacoes.push('Leia as questões com mais atenção antes de responder')
  }

  return recomendacoes.slice(0, 5)
}

function definirMetaProximaSessao(perfil: DesempenhoUsuario): string {
  const { temasParaReforcar } = identificarTemasDestaque(perfil)

  if (perfil.totalQuestoes < 10) {
    return 'Complete pelo menos 10 questões para ter uma análise mais precisa'
  }

  if (perfil.taxaAcerto < 0.5) {
    return `Alcançar 60% de acertos em ${temasParaReforcar[0] || 'questões básicas'}`
  }

  if (perfil.taxaAcerto < 0.7) {
    return `Manter sequência de 5+ acertos e revisar ${temasParaReforcar[0] || 'temas mais difíceis'}`
  }

  if (perfil.taxaAcerto < 0.8) {
    return 'Praticar questões de nível difícil mantendo taxa acima de 70%'
  }

  return 'Manter excelência e experimentar questões de muito alta dificuldade'
}

function gerarMensagemAcerto(perfil: DesempenhoUsuario): string {
  const sequencia = perfil.sequenciaAtual.acertos

  if (sequencia >= 10) return '🔥 INCRÍVEL! 10+ acertos seguidos! Você está em chamas!'
  if (sequencia >= 5) return '🌟 Excelente! Sequência de 5+ acertos!'
  if (sequencia >= 3) return '👏 Muito bem! Continuando a sequência!'

  return '✅ Correto! Bom trabalho!'
}

function gerarMensagemErro(tema: string, perfil: DesempenhoUsuario): string {
  const errosNoTema = perfil.errosPorTema[tema] || 0

  if (errosNoTema >= 3) {
    return `⚠️ Este tema "${tema}" precisa de atenção especial. Vamos revisar?`
  }

  return '❌ Não foi dessa vez, mas você aprende com cada erro!'
}

function identificarPontosFortes(
  perfil: DesempenhoUsuario,
  acertou: boolean,
  tema: string
): string[] {
  const pontos: string[] = []

  if (acertou) {
    pontos.push(`Demonstrou conhecimento em "${tema}"`)

    if (perfil.sequenciaAtual.acertos >= 3) {
      pontos.push('Mantendo boa sequência de acertos')
    }

    if (perfil.taxaAcerto >= 0.7) {
      pontos.push('Taxa de acerto geral acima de 70%')
    }
  }

  return pontos
}

function identificarPontosParaMelhorar(
  perfil: DesempenhoUsuario,
  acertou: boolean,
  tema: string
): string[] {
  const pontos: string[] = []

  if (!acertou) {
    pontos.push(`Revisar conceitos de "${tema}"`)

    const errosNoTema = perfil.errosPorTema[tema] || 0
    if (errosNoTema >= 2) {
      pontos.push('Este tema aparece frequentemente nos erros')
    }
  }

  if (perfil.tempoMedioResposta > 120) {
    pontos.push('Trabalhar na velocidade de resolução')
  }

  return pontos
}

function gerarRecursosRecomendados(tema: string, dificuldade: NivelDificuldade): string[] {
  const recursos: string[] = []

  recursos.push(`📚 Revise o capítulo sobre "${tema}" no Guyton ou similar`)
  recursos.push(`🎥 Busque videoaulas sobre "${tema}"`)

  if (dificuldade === 'dificil' || dificuldade === 'muito_dificil') {
    recursos.push('📖 Consulte artigos de revisão sobre o tema')
    recursos.push('🏥 Pratique com casos clínicos reais')
  }

  return recursos
}

function gerarDicaMemorizacao(tema: string, acertou: boolean): string {
  if (acertou) {
    return `💡 Dica: Faça um mapa mental de "${tema}" para consolidar ainda mais!`
  }
  return `💡 Dica: Crie flashcards sobre "${tema}" para revisar periodicamente.`
}

function traduzirDificuldade(dificuldade: NivelDificuldade): string {
  const traducoes: Record<NivelDificuldade, string> = {
    facil: 'Fácil',
    medio: 'Médio',
    dificil: 'Difícil',
    muito_dificil: 'Muito Difícil'
  }
  return traducoes[dificuldade]
}

function traduzirNivelCognitivo(nivel: NivelCognitivo): string {
  const traducoes: Record<NivelCognitivo, string> = {
    lembrar: 'Lembrar (Memorização)',
    entender: 'Entender (Compreensão)',
    aplicar: 'Aplicar (Aplicação)',
    analisar: 'Analisar (Análise)',
    avaliar: 'Avaliar (Avaliação)',
    criar: 'Criar (Síntese)'
  }
  return traducoes[nivel]
}
