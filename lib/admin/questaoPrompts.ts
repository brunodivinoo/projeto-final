// lib/admin/questaoPrompts.ts
// Prompts para geração de questões médicas com IA

import { LIVROS_POR_DISCIPLINA } from './livrosFonte'
import { PERIODOS_DIFICULDADE } from './periodos'

export type TipoQuestao =
  | 'multipla_escolha'
  | 'verdadeiro_falso'
  | 'caso_clinico'
  | 'imagem'
  | 'afirmativa'
  | 'associacao'
  | 'sequencia'
  | 'lacuna'
  | 'multipla_resposta'

export interface GerarQuestaoParams {
  disciplina: string
  assunto: string
  subAssunto?: string
  periodo: number
  tipoQuestao: TipoQuestao
}

export interface QuestaoGerada {
  enunciado: string
  tipo: TipoQuestao
  alternativas: Array<{
    letra: string
    texto: string
    correta: boolean
  }>
  resposta_correta: string
  gabarito_comentado: string
  referencia_abnt: string
  fontes_consultadas: Array<{
    tipo: string
    titulo: string
    autor: string
    edicao: string
    ano: number
    capitulo?: string
    paginas?: string
  }>
  palavras_chave: string[]
  dica_estudo: string
}

export function buildPromptQuestao(params: GerarQuestaoParams): string {
  const { disciplina, assunto, subAssunto, periodo, tipoQuestao } = params
  const periodoInfo = PERIODOS_DIFICULDADE[periodo]
  const livrosRecomendados = LIVROS_POR_DISCIPLINA[disciplina] || ['Harrison', 'Guyton']

  const tiposDescricao: Record<string, { texto: string; estrutura: string; regras: string }> = {
    multipla_escolha: {
      texto: 'múltipla escolha',
      estrutura: `[
    {"letra": "A", "texto": "...", "correta": false},
    {"letra": "B", "texto": "...", "correta": true},
    {"letra": "C", "texto": "...", "correta": false},
    {"letra": "D", "texto": "...", "correta": false},
    {"letra": "E", "texto": "...", "correta": false}
  ]`,
      regras: `- Enunciado claro e objetivo
- 5 alternativas (A, B, C, D, E)
- Apenas UMA alternativa correta
- Distratores plausíveis mas claramente incorretos
- Evitar "todas as alternativas" ou "nenhuma das alternativas"`
    },
    caso_clinico: {
      texto: 'caso clínico',
      estrutura: `[
    {"letra": "A", "texto": "...", "correta": false},
    {"letra": "B", "texto": "...", "correta": true},
    {"letra": "C", "texto": "...", "correta": false},
    {"letra": "D", "texto": "...", "correta": false},
    {"letra": "E", "texto": "...", "correta": false}
  ]`,
      regras: `- Caso clínico realista e detalhado (mínimo 150 palavras)
- Dados relevantes do paciente: idade, sexo, queixa principal, história da doença atual, antecedentes
- Exame físico pertinente e exames complementares quando necessário
- 5 alternativas sobre diagnóstico, conduta ou tratamento
- Apenas UMA alternativa correta`
    },
    imagem: {
      texto: 'questão com análise de imagem',
      estrutura: `[
    {"letra": "A", "texto": "...", "correta": false},
    {"letra": "B", "texto": "...", "correta": true},
    {"letra": "C", "texto": "...", "correta": false},
    {"letra": "D", "texto": "...", "correta": false},
    {"letra": "E", "texto": "...", "correta": false}
  ]`,
      regras: `- Descreva detalhadamente a imagem que acompanharia a questão (RX, ECG, dermatoscopia, etc.)
- No campo "descricao_imagem" explique o que a imagem mostraria
- Inclua achados normais e anormais que seriam visíveis
- 5 alternativas sobre interpretação da imagem
- Apenas UMA alternativa correta`
    },
    afirmativa: {
      texto: 'afirmativas verdadeiro/falso',
      estrutura: `[
    {"letra": "I", "texto": "Afirmativa 1...", "correta": true},
    {"letra": "II", "texto": "Afirmativa 2...", "correta": false},
    {"letra": "III", "texto": "Afirmativa 3...", "correta": true},
    {"letra": "IV", "texto": "Afirmativa 4...", "correta": false}
  ]`,
      regras: `- Apresente 4 afirmativas relacionadas ao tema
- Cada afirmativa pode ser verdadeira ou falsa
- Ao final, pergunte quais afirmativas estão corretas
- Alternativas finais: (A) I e II, (B) II e III, (C) I e III, (D) II e IV, (E) I, III e IV
- Marque a alternativa correta baseada nas afirmativas`
    },
    associacao: {
      texto: 'associação de colunas',
      estrutura: `[
    {"letra": "1-A", "texto": "Item 1 corresponde a A", "correta": true},
    {"letra": "2-B", "texto": "Item 2 corresponde a B", "correta": true},
    {"letra": "3-C", "texto": "Item 3 corresponde a C", "correta": true},
    {"letra": "4-D", "texto": "Item 4 corresponde a D", "correta": true}
  ]`,
      regras: `- Apresente duas colunas para associação
- Coluna 1: conceitos, doenças, medicamentos, etc.
- Coluna 2: características, mecanismos, indicações, etc.
- 4 a 5 itens em cada coluna
- O aluno deve relacionar corretamente os itens`
    },
    sequencia: {
      texto: 'sequência/ordenação',
      estrutura: `[
    {"letra": "1", "texto": "Primeiro passo...", "correta": true},
    {"letra": "2", "texto": "Segundo passo...", "correta": true},
    {"letra": "3", "texto": "Terceiro passo...", "correta": true},
    {"letra": "4", "texto": "Quarto passo...", "correta": true},
    {"letra": "5", "texto": "Quinto passo...", "correta": true}
  ]`,
      regras: `- Apresente passos de um procedimento, algoritmo diagnóstico ou terapêutico
- Os passos devem estar em ordem aleatória no enunciado
- O aluno deve ordená-los corretamente
- Indique a sequência correta no gabarito
- Pode ser: ACLS, ATLS, procedimentos cirúrgicos, raciocínio clínico, etc.`
    },
    lacuna: {
      texto: 'preencher lacunas',
      estrutura: `[
    {"letra": "A", "texto": "termo1, termo2, termo3", "correta": false},
    {"letra": "B", "texto": "termo1, termo2, termo3", "correta": true},
    {"letra": "C", "texto": "termo1, termo2, termo3", "correta": false},
    {"letra": "D", "texto": "termo1, termo2, termo3", "correta": false},
    {"letra": "E", "texto": "termo1, termo2, termo3", "correta": false}
  ]`,
      regras: `- Texto com 2-4 lacunas (indicadas por _____)
- Lacunas devem testar conceitos importantes
- 5 alternativas com combinações de termos
- Apenas UMA combinação correta
- Evitar lacunas que aceitem múltiplas respostas corretas`
    },
    multipla_resposta: {
      texto: 'múltipla resposta (mais de uma correta)',
      estrutura: `[
    {"letra": "A", "texto": "...", "correta": true},
    {"letra": "B", "texto": "...", "correta": true},
    {"letra": "C", "texto": "...", "correta": false},
    {"letra": "D", "texto": "...", "correta": true},
    {"letra": "E", "texto": "...", "correta": false}
  ]`,
      regras: `- Enunciado deve indicar "marque TODAS as alternativas corretas"
- 5 alternativas (A, B, C, D, E)
- 2 a 4 alternativas podem estar corretas
- No gabarito, liste todas as corretas (ex: "A, B, D")
- Explique por que cada uma está correta ou incorreta`
    },
    verdadeiro_falso: {
      texto: 'verdadeiro ou falso',
      estrutura: `[
    {"letra": "V", "texto": "Verdadeiro", "correta": true ou false},
    {"letra": "F", "texto": "Falso", "correta": true ou false}
  ]`,
      regras: `- Afirmação clara e objetiva
- Resposta: Verdadeiro ou Falso
- Sem ambiguidade`
    }
  }

  const tipoInfo = tiposDescricao[tipoQuestao] || tiposDescricao.multipla_escolha
  const tipoTexto = tipoInfo.texto
  const estruturaAlternativas = tipoInfo.estrutura
  const regrasEstrutura = tipoInfo.regras

  return `Você é um professor de medicina especialista em ${disciplina}, com vasta experiência em elaboração de questões para provas de faculdade e concursos de residência médica no Brasil.

## TAREFA
Crie UMA questão de ${tipoTexto} sobre:

- **Disciplina:** ${disciplina}
- **Assunto:** ${assunto}
${subAssunto ? `- **Sub-assunto:** ${subAssunto}` : ''}
- **Nível:** ${periodoInfo?.nome || `${periodo}º Período`} (${periodoInfo?.nivel || 'Intermediário'})
- **Complexidade esperada:** ${periodoInfo?.descricao || 'Nível intermediário'}

## REGRAS OBRIGATÓRIAS

### 1. ESPECIFICIDADE HUMANA
⚠️ IMPORTANTE: Todas as informações devem ser EXCLUSIVAMENTE sobre:
- Anatomia HUMANA (não animal)
- Fisiologia HUMANA
- Patologia HUMANA
- Desenvolvimento embrionário HUMANO
- Nunca usar dados de estudos em animais como resposta correta para questões sobre humanos

### 2. ESTRUTURA DA QUESTÃO
${regrasEstrutura}

### 3. FONTES E REFERÊNCIAS
Prioridade de fontes (USAR NESTA ORDEM):
${livrosRecomendados.map((l, i) => `${i + 1}. ${l}`).join('\n')}

⚠️ Artigos científicos APENAS se não houver informação nos livros-texto.

### 4. FORMATO DE RESPOSTA (JSON)
\`\`\`json
{
  "enunciado": "Texto completo do enunciado",
  "tipo": "${tipoQuestao}",
  "alternativas": ${estruturaAlternativas},
  "resposta_correta": "B",
  "gabarito_comentado": "Explicação DETALHADA e DIDÁTICA de por que a alternativa B está correta e por que as outras estão incorretas. Deve incluir: conceitos fundamentais, fisiopatologia quando aplicável, correlações clínicas, dicas para memorização. Mínimo 300 palavras.",
  "referencia_abnt": "Referência completa no formato ABNT. Exemplo: HALL, John E. Guyton e Hall: Tratado de Fisiologia Médica. 14. ed. Rio de Janeiro: Elsevier, 2021. Cap. X, p. XX-XX.",
  "fontes_consultadas": [
    {
      "tipo": "livro",
      "titulo": "Guyton e Hall - Tratado de Fisiologia Médica",
      "autor": "John E. Hall",
      "edicao": "14ª edição",
      "ano": 2021,
      "capitulo": "X",
      "paginas": "XX-XX"
    }
  ],
  "palavras_chave": ["palavra1", "palavra2", "palavra3"],
  "dica_estudo": "Uma dica curta para o aluno memorizar o conceito"
}
\`\`\`

## GABARITO COMENTADO - REQUISITOS

O gabarito DEVE conter:
1. **Por que a correta está certa** - Explicação completa com base científica
2. **Por que cada errada está errada** - Análise de cada distrator
3. **Conceito-chave** - O que o aluno precisa saber
4. **Correlação clínica** - Quando aplicável, como isso aparece na prática
5. **Dica de memorização** - Mnemônico ou associação útil
6. **Referência ABNT** - Citação completa da fonte

## EXEMPLO DE GABARITO BEM ELABORADO

"A alternativa B está correta porque [explicação detalhada do conceito com base no livro-fonte].

A alternativa A está incorreta porque [explicação].
A alternativa C está incorreta porque [explicação].
A alternativa D está incorreta porque [explicação].
A alternativa E está incorreta porque [explicação].

**Conceito-chave:** [resumo do que precisa saber]

**Correlação clínica:** [aplicação prática]

**Dica de memorização:** [mnemônico ou associação]

**Referência:** HALL, John E. Guyton e Hall: Tratado de Fisiologia Médica. 14. ed. Rio de Janeiro: Elsevier, 2021. Cap. X, p. XX-XX."

---

Agora, gere a questão seguindo TODAS as regras acima. Responda APENAS com o JSON, sem texto adicional.`
}

export function buildPromptPesquisarAssuntos(disciplina: string, assuntosExistentes: string[]): string {
  return `Você é um especialista em currículo de medicina no Brasil.

DISCIPLINA: ${disciplina}
ASSUNTOS JÁ CADASTRADOS: ${assuntosExistentes.length > 0 ? assuntosExistentes.join(', ') : 'Nenhum'}

Sua tarefa:
1. Liste TODOS os assuntos que deveriam existir nesta disciplina
2. Para cada assunto, liste os subassuntos principais
3. Identifique o que está FALTANDO comparado ao que já temos

Baseie-se nos livros-texto mais usados e nas Diretrizes Curriculares Nacionais do MEC para o curso de Medicina.

Responda em JSON:
\`\`\`json
{
  "disciplina": "${disciplina}",
  "assuntos": [
    {
      "nome": "Nome do Assunto",
      "descricao": "Breve descrição",
      "sub_assuntos": [
        {
          "nome": "Nome do Sub-assunto",
          "descricao": "Breve descrição"
        }
      ],
      "periodos_relacionados": [1, 2, 3]
    }
  ],
  "assuntos_faltantes": ["Lista de assuntos que faltam no banco"]
}
\`\`\`

Liste de forma COMPLETA e DETALHADA. Não omita nenhum assunto importante.`
}

// Extrair JSON de uma resposta da IA
export function extrairJsonDaResposta(texto: string): QuestaoGerada | null {
  try {
    // Tentar extrair JSON do bloco de código
    const jsonMatch = texto.match(/```json\n?([\s\S]*?)\n?```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1])
    }

    // Tentar parsear diretamente se não tiver bloco de código
    const cleanText = texto.trim()
    if (cleanText.startsWith('{')) {
      return JSON.parse(cleanText)
    }

    return null
  } catch {
    return null
  }
}

// Validar questão gerada
export function validarQuestaoGerada(questao: QuestaoGerada): { valida: boolean; erros: string[] } {
  const erros: string[] = []

  if (!questao.enunciado || questao.enunciado.length < 20) {
    erros.push('Enunciado muito curto ou ausente')
  }

  if (!questao.alternativas || questao.alternativas.length < 2) {
    erros.push('Alternativas insuficientes')
  }

  const corretas = questao.alternativas?.filter(a => a.correta) || []
  if (corretas.length !== 1) {
    erros.push(`Deve ter exatamente 1 alternativa correta (encontradas: ${corretas.length})`)
  }

  if (!questao.gabarito_comentado || questao.gabarito_comentado.length < 100) {
    erros.push('Gabarito comentado muito curto')
  }

  if (!questao.palavras_chave || questao.palavras_chave.length < 2) {
    erros.push('Palavras-chave insuficientes')
  }

  return {
    valida: erros.length === 0,
    erros
  }
}
