'use client'

import { useMemo, memo} from 'react'

interface SuggestionChipsProps {
  lastMessage: string
  chatMode?: string
  onSuggestionClick: (suggestion: string) => void
}

// Mapeamento de temas médicos para sugestões contextuais
const SUGGESTION_MAP: Record<string, string[]> = {
  // Cardiologia
  cardiologia: [
    'Gere 5 questões sobre insuficiência cardíaca',
    'Crie flashcards de arritmias cardíacas',
    'Explique o manejo de SCA',
    'Compare betabloqueadores vs BCC'
  ],
  icc: [
    'Classificação de NYHA - quando usar cada tratamento?',
    'Flashcards sobre inibidores da SGLT2 na IC',
    'Questões sobre critérios de Framingham',
    'Quando indicar CDI na insuficiência cardíaca?'
  ],
  iam: [
    'Conduta no IAM com supra de ST',
    'Flashcards dos critérios eletrocardiográficos',
    'Questões sobre terapia antitrombótica',
    'Complicações mecânicas do IAM'
  ],
  // Pneumologia
  pneumonia: [
    'Critérios de CURB-65 e PSI',
    'Flashcards antibioticoterapia empírica',
    'Gere questões sobre pneumonia atípica',
    'Quando internar paciente com PAC?'
  ],
  dpoc: [
    'Classificação GOLD e tratamento escalonado',
    'Flashcards sobre broncodilatadores',
    'Questões sobre exacerbação de DPOC',
    'Diferenças entre DPOC e asma'
  ],
  asma: [
    'Steps do tratamento da asma - GINA',
    'Quando usar corticoide sistêmico na crise?',
    'Flashcards sobre classificação de gravidade',
    'Questões sobre asma na emergência'
  ],
  // Neurologia
  avc: [
    'Protocolo de trombólise no AVC isquêmico',
    'Flashcards sobre escala NIHSS',
    'Questões sobre AVC hemorrágico',
    'Critérios de indicação de trombectomia'
  ],
  // Gastro
  hepatite: [
    'Marcadores sorológicos das hepatites virais',
    'Flashcards sobre hepatite B - perfis',
    'Questões sobre hepatite autoimune',
    'Quando tratar hepatite C?'
  ],
  cirrose: [
    'Classificação de Child-Pugh e MELD',
    'Complicações da hipertensão portal',
    'Flashcards sobre encefalopatia hepática',
    'Indicações de transplante hepático'
  ],
  // Endócrino
  diabetes: [
    'Algoritmo de tratamento do DM2',
    'Flashcards sobre insulinas disponíveis',
    'Questões sobre cetoacidose diabética',
    'Metas glicêmicas por perfil de paciente'
  ],
  tireoide: [
    'Investigação de nódulo tireoidiano',
    'Flashcards sobre hipotireoidismo',
    'Questões sobre tireotoxicose',
    'Quando pedir cintilografia?'
  ],
  // Infectologia
  hiv: [
    'Esquema antirretroviral inicial - Brasil',
    'Flashcards sobre infecções oportunistas',
    'Quando iniciar profilaxia para PCP?',
    'Questões sobre diagnóstico do HIV'
  ],
  tuberculose: [
    'Esquema RIPE - doses e duração',
    'Flashcards sobre TB extrapulmonar',
    'Questões sobre ILTB',
    'Quando suspeitar de TB multidroga?'
  ],
  // Pediatria
  pediatria: [
    'Calendário vacinal atualizado - PNI',
    'Marcos do desenvolvimento infantil',
    'Flashcards sobre desidratação pediátrica',
    'Questões sobre infecções na infância'
  ],
  // Ginecologia/Obstetrícia
  gestacao: [
    'Pré-natal - exames por trimestre',
    'Flashcards sobre pré-eclâmpsia',
    'Questões sobre diabetes gestacional',
    'Indicações de cesariana'
  ],
  // Cirurgia
  abdome: [
    'Diagnóstico diferencial de abdome agudo',
    'Flashcards sobre apendicite vs diverticulite',
    'Questões sobre obstrução intestinal',
    'Score de Alvarado - quando operar?'
  ],
  // Genéricos por modo
  questoes: [
    'Gere mais questões sobre o mesmo tema',
    'Questões mais difíceis sobre este assunto',
    'Questões com casos clínicos complexos',
    'Questões estilo REVALIDA'
  ],
  flashcards: [
    'Mais flashcards sobre este tema',
    'Flashcards comparativos do assunto',
    'Flashcards de diagnóstico diferencial',
    'Flashcards sobre tratamento'
  ],
  resumo: [
    'Resuma os pontos mais cobrados em provas',
    'Crie um mapa mental sobre o tema',
    'Quais as pegadinhas comuns deste assunto?',
    'Monte um organograma do assunto'
  ],
  // Recursos visuais genéricos (sempre disponíveis)
  visuais: [
    'Gere um fluxograma sobre o tema',
    'Crie um organograma/classificação',
    'Monte um diagrama visual do assunto',
    'Busque mais imagens médicas sobre isso',
    'Gere flashcards para revisão rápida',
    'Crie questões para eu praticar'
  ],
}

// Sugestões padrão quando não há contexto
const DEFAULT_SUGGESTIONS = [
  'Gere 5 questões sobre um tema da medicina',
  'Crie flashcards para revisar',
  'Explique um conceito médico',
  'Apresente um caso clínico'
]

function detectTopics(text: string): string[] {
  const lower = text.toLowerCase()
  const detected: string[] = []

  const keywords: Record<string, string[]> = {
    cardiologia: ['coração', 'cardíac', 'cardio', 'arritmia', 'eletro', 'ecg'],
    icc: ['insuficiência cardíaca', 'icc', 'ic ', 'nyha', 'congest'],
    iam: ['infarto', 'iam', 'sca', 'síndrome coronariana', 'supra de st'],
    pneumonia: ['pneumonia', 'pac ', 'curb', 'infiltrado pulmonar'],
    dpoc: ['dpoc', 'enfisema', 'bronquite crônica', 'gold '],
    asma: ['asma', 'broncoespasmo', 'gina ', 'crise asmática'],
    avc: ['avc', 'acidente vascular', 'isquêmico', 'hemorrágico', 'nihss'],
    hepatite: ['hepatite', 'hbsag', 'anti-hbs', 'hcv', 'hbv'],
    cirrose: ['cirrose', 'child-pugh', 'meld', 'ascite', 'varizes esofágicas'],
    diabetes: ['diabetes', 'dm2', 'dm1', 'glicemia', 'hemoglobina glicada', 'insulina'],
    tireoide: ['tireoide', 'tsh', 'hipotireoidismo', 'hipertireoidismo', 'nódulo'],
    hiv: ['hiv', 'aids', 'antirretroviral', 'cd4', 'carga viral'],
    tuberculose: ['tuberculose', 'tb ', 'ripe', 'baar', 'ppd'],
    pediatria: ['criança', 'pediátr', 'vacin', 'neonat', 'lactente'],
    gestacao: ['gestação', 'gravidez', 'pré-natal', 'obstétric', 'eclâmpsia'],
    abdome: ['abdome agudo', 'apendicite', 'obstrução', 'abdômen'],
  }

  for (const [topic, words] of Object.entries(keywords)) {
    if (words.some(w => lower.includes(w))) {
      detected.push(topic)
    }
  }

  return detected
}

function SuggestionChips({ lastMessage, chatMode, onSuggestionClick }: SuggestionChipsProps) {
  const suggestions = useMemo(() => {
    if (!lastMessage) return DEFAULT_SUGGESTIONS

    // Detectar tópicos na última mensagem da IA
    const topics = detectTopics(lastMessage)

    // Coletar sugestões dos tópicos detectados
    const collected: string[] = []
    for (const topic of topics) {
      const topicSugs = SUGGESTION_MAP[topic]
      if (topicSugs) {
        collected.push(...topicSugs)
      }
    }

    // Adicionar sugestões do modo de chat
    if (chatMode && SUGGESTION_MAP[chatMode]) {
      collected.push(...SUGGESTION_MAP[chatMode])
    }

    // Sempre adicionar 1-2 sugestões de recursos visuais para variedade
    const visuais = SUGGESTION_MAP.visuais || []
    const visuaisShuffled = [...visuais].sort(() => Math.random() - 0.5)
    collected.push(...visuaisShuffled.slice(0, 2))

    // Se não encontrou nada específico do tema, usar genéricas
    if (collected.length <= 2) {
      // Tentar sugestões genéricas baseadas no conteúdo
      if (lastMessage.includes('```questao')) {
        collected.push(...(SUGGESTION_MAP.questoes || []))
      } else if (lastMessage.includes('```flashcard')) {
        collected.push(...(SUGGESTION_MAP.flashcards || []))
      } else if (lastMessage.includes('```mermaid')) {
        collected.push(...(SUGGESTION_MAP.resumo || []))
      } else {
        collected.push(...DEFAULT_SUGGESTIONS)
      }
    }

    // Dedup e pegar 4 sugestões
    const unique = [...new Set(collected)]
    // Embaralhar e pegar 4
    const shuffled = unique.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 4)
  }, [lastMessage, chatMode])

  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
      {suggestions.map((sug, i) => (
        <button
          key={i}
          onClick={() => onSuggestionClick(sug)}
          className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1.5
                     hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700
                     transition-all duration-200 cursor-pointer
                     shadow-sm hover:shadow"
        >
          {sug}
        </button>
      ))}
    </div>
  )
}

export default memo(SuggestionChips)
