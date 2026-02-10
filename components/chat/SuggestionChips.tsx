'use client'

import { useMemo, memo, useState, useEffect, useRef } from 'react'

interface Mensagem {
  tipo: 'usuario' | 'ia' | 'system'
  conteudo: string
}

interface SuggestionChipsProps {
  lastMessage: string
  chatMode?: string
  onSuggestionClick: (suggestion: string) => void
  mensagens?: Mensagem[]
}

// ========== MAPA EXPANDIDO: 40+ tópicos médicos ==========
const SUGGESTION_MAP: Record<string, string[]> = {
  // === CARDIOLOGIA ===
  cardiologia: [
    'Gere questões sobre insuficiência cardíaca',
    'Crie flashcards de arritmias cardíacas',
    'Explique o manejo de SCA',
    'Compare betabloqueadores vs BCC',
    'Faça um fluxograma de dor torácica'
  ],
  icc: [
    'Classificação NYHA e tratamento por classe',
    'Flashcards sobre SGLT2 na IC',
    'Questões sobre critérios de Framingham',
    'Quando indicar CDI na IC?'
  ],
  iam: [
    'Conduta no IAM com supra de ST',
    'Flashcards dos critérios eletrocardiográficos',
    'Questões sobre terapia antitrombótica',
    'Complicações mecânicas do IAM'
  ],
  hipertensao: [
    'Classificação e metas da HAS',
    'Flashcards de anti-hipertensivos',
    'Questões sobre crise hipertensiva',
    'Quando associar anti-hipertensivos?'
  ],
  valvulopatias: [
    'Indicações cirúrgicas nas valvulopatias',
    'Flashcards sobre sopros cardíacos',
    'Questões sobre estenose aórtica',
    'Compare insuficiência mitral aguda vs crônica'
  ],

  // === PNEUMOLOGIA ===
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
  tep: [
    'Score de Wells e Geneva para TEP',
    'Flashcards sobre anticoagulação no TEP',
    'Questões sobre diagnóstico de TEP',
    'Quando indicar trombólise no TEP?'
  ],
  tuberculose: [
    'Esquema RIPE - doses e duração',
    'Flashcards sobre TB extrapulmonar',
    'Questões sobre ILTB',
    'Quando suspeitar de TB multidroga?'
  ],
  derrame_pleural: [
    'Critérios de Light para derrame pleural',
    'Flashcards sobre causas de transudato vs exsudato',
    'Questões sobre empiema pleural',
    'Quando drenar derrame pleural?'
  ],

  // === NEUROLOGIA ===
  avc: [
    'Protocolo de trombólise no AVC isquêmico',
    'Flashcards sobre escala NIHSS',
    'Questões sobre AVC hemorrágico',
    'Critérios para trombectomia mecânica'
  ],
  epilepsia: [
    'Classificação das crises epilépticas',
    'Flashcards sobre anticonvulsivantes',
    'Questões sobre status epilepticus',
    'Quando iniciar e suspender tratamento?'
  ],
  cefaleia: [
    'Diagnóstico diferencial de cefaleias',
    'Flashcards sobre enxaqueca vs cefaleia tensional',
    'Questões sobre sinais de alarme na cefaleia',
    'Tratamento profilático das cefaleias'
  ],
  meningite: [
    'Conduta na suspeita de meningite',
    'Flashcards sobre análise do LCR',
    'Questões sobre meningite bacteriana vs viral',
    'Quando fazer TC antes da punção lombar?'
  ],

  // === GASTROENTEROLOGIA ===
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
  pancreatite: [
    'Critérios de Ranson e APACHE II',
    'Flashcards sobre pancreatite aguda vs crônica',
    'Questões sobre complicações da pancreatite',
    'Quando operar na pancreatite?'
  ],
  doenca_inflamatoria: [
    'Compare Crohn vs retocolite ulcerativa',
    'Flashcards sobre manifestações extraintestinais',
    'Questões sobre tratamento escalonado nas DII',
    'Complicações cirúrgicas nas DII'
  ],
  hemorragia_digestiva: [
    'Conduta na hemorragia digestiva alta',
    'Flashcards sobre classificação de Forrest',
    'Questões sobre HDA vs HDB',
    'Quando indicar cirurgia na HDA?'
  ],

  // === ENDOCRINOLOGIA ===
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
  suprarrenal: [
    'Diagnóstico de insuficiência adrenal',
    'Flashcards sobre síndrome de Cushing',
    'Questões sobre feocromocitoma',
    'Incidentaloma adrenal - conduta'
  ],

  // === NEFROLOGIA ===
  insuficiencia_renal: [
    'Classificação KDIGO da DRC',
    'Flashcards sobre IRA pré-renal vs renal vs pós-renal',
    'Questões sobre indicações de diálise',
    'Manejo de distúrbios eletrolíticos na DRC'
  ],
  glomerulonefrite: [
    'Diagnóstico diferencial das glomerulopatias',
    'Flashcards sobre síndrome nefrótica vs nefrítica',
    'Questões sobre biópsia renal',
    'Tratamento das glomerulonefrites'
  ],
  disturbios_eletrolitos: [
    'Conduta na hipercalemia',
    'Flashcards sobre hiponatremia',
    'Questões sobre distúrbios ácido-base',
    'Fluxograma de investigação de hiponatremia'
  ],

  // === INFECTOLOGIA ===
  hiv: [
    'Esquema antirretroviral inicial - Brasil',
    'Flashcards sobre infecções oportunistas',
    'Quando iniciar profilaxia para PCP?',
    'Questões sobre diagnóstico do HIV'
  ],
  sepse: [
    'Critérios de SOFA e qSOFA',
    'Flashcards sobre manejo do choque séptico',
    'Questões sobre antibioticoterapia empírica na sepse',
    'Pacote de 1 hora da sepse'
  ],
  infeccao_urinaria: [
    'Tratamento de ITU complicada vs não complicada',
    'Flashcards sobre pielonefrite',
    'Questões sobre ITU de repetição',
    'Quando internar paciente com ITU?'
  ],
  endocardite: [
    'Critérios de Duke modificados',
    'Flashcards sobre antibioticoterapia na endocardite',
    'Questões sobre indicação cirúrgica na EI',
    'Profilaxia de endocardite infecciosa'
  ],

  // === REUMATOLOGIA ===
  lupus: [
    'Critérios classificatórios do LES',
    'Flashcards sobre nefrite lúpica',
    'Questões sobre autoanticorpos no LES',
    'Tratamento do LES por manifestação'
  ],
  artrite_reumatoide: [
    'Critérios diagnósticos da AR',
    'Flashcards sobre DMARDs',
    'Questões sobre manifestações extra-articulares',
    'Compare AR vs artrite psoriásica'
  ],

  // === HEMATOLOGIA ===
  anemia: [
    'Diagnóstico diferencial das anemias por VCM',
    'Flashcards sobre anemia ferropriva vs megaloblástica',
    'Questões sobre anemias hemolíticas',
    'Quando transfundir hemácias?'
  ],
  leucemia: [
    'Diferença entre LMA e LLA',
    'Flashcards sobre classificação FAB',
    'Questões sobre leucemia mieloide crônica',
    'Urgências oncohematológicas'
  ],
  coagulopatia: [
    'Interpretação do coagulograma',
    'Flashcards sobre CIVD',
    'Questões sobre PTT vs SHU',
    'Quando reverter anticoagulação?'
  ],

  // === PEDIATRIA ===
  pediatria: [
    'Calendário vacinal atualizado - PNI',
    'Marcos do desenvolvimento infantil',
    'Flashcards sobre desidratação pediátrica',
    'Questões sobre infecções na infância'
  ],
  neonatologia: [
    'Reanimação neonatal passo a passo',
    'Flashcards sobre icterícia neonatal',
    'Questões sobre sepse neonatal',
    'Triagem neonatal - teste do pezinho'
  ],

  // === GINECOLOGIA/OBSTETRÍCIA ===
  gestacao: [
    'Pré-natal - exames por trimestre',
    'Flashcards sobre pré-eclâmpsia',
    'Questões sobre diabetes gestacional',
    'Indicações de cesariana'
  ],
  sangramento_gestacional: [
    'Diagnóstico diferencial de sangramento no 1o trimestre',
    'Flashcards sobre placenta prévia vs DPP',
    'Questões sobre gestação ectópica',
    'Conduta no sangramento do 3o trimestre'
  ],
  ginecologia: [
    'Rastreamento de câncer de colo uterino',
    'Flashcards sobre SOP',
    'Questões sobre endometriose',
    'Manejo do sangramento uterino anormal'
  ],

  // === CIRURGIA ===
  abdome: [
    'Diagnóstico diferencial de abdome agudo',
    'Flashcards sobre apendicite vs diverticulite',
    'Questões sobre obstrução intestinal',
    'Score de Alvarado - quando operar?'
  ],
  trauma: [
    'ATLS - ABCDE do trauma',
    'Flashcards sobre FAST e lavado peritoneal',
    'Questões sobre trauma torácico',
    'Quando indicar laparotomia exploradora?'
  ],
  hernia: [
    'Classificação das hérnias inguinais',
    'Flashcards sobre hérnias complicadas',
    'Questões sobre indicação cirúrgica',
    'Compare técnicas de reparo de hérnia'
  ],

  // === PSIQUIATRIA ===
  depressao: [
    'Critérios diagnósticos de depressão maior',
    'Flashcards sobre antidepressivos',
    'Questões sobre risco de suicídio',
    'Compare ISRS vs duais vs tricíclicos'
  ],
  esquizofrenia: [
    'Sintomas positivos vs negativos',
    'Flashcards sobre antipsicóticos',
    'Questões sobre esquizofrenia refratária',
    'Efeitos colaterais dos antipsicóticos'
  ],

  // === DERMATOLOGIA ===
  dermatologia: [
    'Lesões elementares da pele',
    'Flashcards sobre dermatoses infecciosas',
    'Questões sobre câncer de pele',
    'Diagnóstico diferencial de lesões eritematosas'
  ],

  // === ORTOPEDIA ===
  fratura: [
    'Classificação de fraturas - AO/OTA',
    'Flashcards sobre fraturas do fêmur proximal',
    'Questões sobre fraturas expostas',
    'Quando indicar cirurgia vs conservador?'
  ],

  // === OFTALMOLOGIA ===
  olho_vermelho: [
    'Diagnóstico diferencial do olho vermelho',
    'Flashcards sobre glaucoma agudo',
    'Questões sobre conjuntivite vs uveíte',
    'Emergências oftalmológicas'
  ],

  // === OTORRINOLARINGOLOGIA ===
  otorrino: [
    'Diagnóstico diferencial de vertigem',
    'Flashcards sobre otite média',
    'Questões sobre sinusite complicada',
    'Compare VPPB vs Ménière vs neurite'
  ],

  // === MEDICINA DE EMERGÊNCIA ===
  emergencia: [
    'Protocolo ACLS de PCR',
    'Flashcards sobre intubação orotraqueal',
    'Questões sobre choque - tipos e manejo',
    'Manejo de via aérea difícil'
  ],
  intoxicacao: [
    'Principais síndromes toxicológicas',
    'Flashcards sobre antídotos',
    'Questões sobre intoxicação por medicamentos',
    'Quando usar carvão ativado?'
  ],

  // === GENÉRICOS POR MODO ===
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
    'Monte um fluxograma do assunto'
  ],
}

// Sugestões padrão quando não há contexto
const DEFAULT_SUGGESTIONS = [
  'Gere 5 questões sobre um tema da medicina',
  'Crie flashcards para revisar',
  'Explique um conceito médico',
  'Apresente um caso clínico'
]

// ========== KEYWORDS EXPANDIDAS ==========
const KEYWORDS: Record<string, string[]> = {
  cardiologia: ['coração', 'cardíac', 'cardio', 'arritmia', 'eletro', 'ecg', 'ecocardiograma', 'marca-passo', 'fibrilação'],
  icc: ['insuficiência cardíaca', 'icc', 'ic ', 'nyha', 'congest', 'fração de ejeção', 'bnp'],
  iam: ['infarto', 'iam', 'sca', 'síndrome coronariana', 'supra de st', 'troponina', 'cateterismo', 'stent'],
  hipertensao: ['hipertensão', 'has ', 'pressão arterial', 'anti-hipertensivo', 'losartan', 'enalapril', 'crise hipertensiva'],
  valvulopatias: ['valvulopatia', 'estenose aórtica', 'insuficiência mitral', 'prolapso', 'sopro', 'prótese valvar'],
  pneumonia: ['pneumonia', 'pac ', 'curb', 'infiltrado pulmonar', 'consolidação'],
  dpoc: ['dpoc', 'enfisema', 'bronquite crônica', 'gold ', 'espirometria'],
  asma: ['asma', 'broncoespasmo', 'gina ', 'crise asmática', 'peak flow', 'broncodilatador'],
  tep: ['tromboembolismo pulmonar', 'tep ', 'embolia pulmonar', 'wells', 'd-dímero', 'angiotomografia'],
  tuberculose: ['tuberculose', 'tb ', 'ripe', 'baar', 'ppd', 'bacilo', 'koch'],
  derrame_pleural: ['derrame pleural', 'toracocentese', 'critérios de light', 'empiema', 'pleurite'],
  avc: ['avc', 'acidente vascular', 'isquêmico', 'hemorrágico', 'nihss', 'trombólise', 'alteplase'],
  epilepsia: ['epilepsia', 'convulsão', 'crise epiléptica', 'anticonvulsivante', 'status epilepticus', 'carbamazepina', 'valproato'],
  cefaleia: ['cefaleia', 'enxaqueca', 'migrânea', 'cefaleia tensional', 'cluster', 'dor de cabeça'],
  meningite: ['meningite', 'meningococ', 'líquor', 'lcr', 'rigidez de nuca', 'kernig', 'brudzinski'],
  hepatite: ['hepatite', 'hbsag', 'anti-hbs', 'hcv', 'hbv', 'anti-hbc', 'hepatotropismo'],
  cirrose: ['cirrose', 'child-pugh', 'meld', 'ascite', 'varizes esofágicas', 'encefalopatia hepática'],
  pancreatite: ['pancreatite', 'pâncreas', 'amilase', 'lipase', 'ranson', 'necrose pancreática'],
  doenca_inflamatoria: ['crohn', 'retocolite', 'colite ulcerativa', 'doença inflamatória intestinal', 'dii ', 'mesalazina'],
  hemorragia_digestiva: ['hemorragia digestiva', 'hda', 'hdb', 'hematêmese', 'melena', 'enterorragia', 'forrest'],
  diabetes: ['diabetes', 'dm2', 'dm1', 'glicemia', 'hemoglobina glicada', 'insulina', 'metformina', 'cetoacidose'],
  tireoide: ['tireoide', 'tsh', 'hipotireoidismo', 'hipertireoidismo', 'nódulo tireoidiano', 'graves', 'hashimoto'],
  suprarrenal: ['adrenal', 'suprarrenal', 'cushing', 'addison', 'feocromocitoma', 'cortisol', 'aldosterona'],
  insuficiencia_renal: ['insuficiência renal', 'drc', 'ira ', 'creatinina', 'clearance', 'diálise', 'hemodiálise', 'tfg'],
  glomerulonefrite: ['glomerulonefrite', 'síndrome nefrótica', 'síndrome nefrítica', 'proteinúria', 'biópsia renal', 'complemento'],
  disturbios_eletrolitos: ['hipercalemia', 'hipocalemia', 'hiponatremia', 'hipernatremia', 'cálcio', 'potássio', 'sódio', 'ácido-base', 'gasometria'],
  hiv: ['hiv', 'aids', 'antirretroviral', 'cd4', 'carga viral', 'tarv'],
  sepse: ['sepse', 'séptic', 'sofa', 'qsofa', 'choque séptico', 'lactato', 'hemocultura'],
  infeccao_urinaria: ['infecção urinária', 'itu ', 'pielonefrite', 'cistite', 'urocultura'],
  endocardite: ['endocardite', 'duke', 'vegetação', 'hemocultura positiva', 'febre prolongada'],
  lupus: ['lúpus', 'les ', 'fator antinuclear', 'fan ', 'anti-dna', 'complemento baixo', 'nefrite lúpica'],
  artrite_reumatoide: ['artrite reumatoide', 'reumatoide', 'fator reumatoide', 'anti-ccp', 'dmard', 'metotrexato'],
  anemia: ['anemia', 'hemoglobina', 'ferritina', 'ferro sérico', 'reticulócito', 'vitamina b12', 'folato'],
  leucemia: ['leucemia', 'lma', 'lla', 'lmc', 'llc', 'blast', 'mielograma'],
  coagulopatia: ['coagulopatia', 'coagulograma', 'civd', 'ptt ', 'shu', 'trombocitopenia', 'heparina', 'warfarina'],
  pediatria: ['criança', 'pediátr', 'vacin', 'neonat', 'lactente', 'crescimento', 'desenvolvimento'],
  neonatologia: ['recém-nascido', 'neonato', 'apgar', 'icterícia neonatal', 'prematuro', 'surfactante'],
  gestacao: ['gestação', 'gravidez', 'pré-natal', 'obstétric', 'eclâmpsia', 'pré-eclâmpsia', 'parto'],
  sangramento_gestacional: ['sangramento gestacional', 'placenta prévia', 'descolamento', 'dpp ', 'ectópica', 'mola'],
  ginecologia: ['ginecolog', 'útero', 'ovário', 'endometriose', 'sop', 'papanicolau', 'colposcopia', 'mioma'],
  abdome: ['abdome agudo', 'apendicite', 'obstrução intestinal', 'abdômen', 'peritonite', 'diverticulite'],
  trauma: ['trauma', 'atls', 'politrauma', 'fast', 'glasgow', 'traumatismo', 'choque hipovolêmico'],
  hernia: ['hérnia', 'inguinal', 'incarcerad', 'estrangulad'],
  depressao: ['depressão', 'antidepressivo', 'isrs', 'sertralina', 'fluoxetina', 'ideação suicida', 'humor'],
  esquizofrenia: ['esquizofrenia', 'psicose', 'antipsicótico', 'delírio', 'alucinação', 'clozapina', 'haloperidol'],
  dermatologia: ['pele', 'dermat', 'lesão cutânea', 'erupção', 'prurido', 'melanoma', 'psoríase', 'eczema'],
  fratura: ['fratura', 'ortoped', 'imobilização', 'osteossíntese', 'luxação', 'entorse'],
  olho_vermelho: ['olho vermelho', 'conjuntivite', 'glaucoma', 'uveíte', 'oftalmolog'],
  otorrino: ['vertigem', 'otite', 'sinusite', 'tonsilite', 'vppb', 'ménière', 'surdez'],
  emergencia: ['pcr', 'parada cardíaca', 'acls', 'bls', 'intubação', 'via aérea', 'choque', 'reanimação'],
  intoxicacao: ['intoxicação', 'envenenamento', 'toxicologia', 'antídoto', 'overdose', 'carvão ativado'],
}

// Detectar tópicos em TODAS as mensagens (não só a última)
function detectTopicsFromHistory(mensagens: Mensagem[]): string[] {
  // Pegar as últimas 6 mensagens para análise
  const recent = mensagens.slice(-6)
  const fullText = recent.map(m => m.conteudo).join(' ').toLowerCase()
  const detected: string[] = []

  for (const [topic, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => fullText.includes(w))) {
      detected.push(topic)
    }
  }

  return detected
}

// Gerar sugestões estáticas baseadas no histórico
function getStaticSuggestions(mensagens: Mensagem[], chatMode?: string): string[] {
  const topics = detectTopicsFromHistory(mensagens)

  const collected: string[] = []
  for (const topic of topics) {
    const topicSugs = SUGGESTION_MAP[topic]
    if (topicSugs) {
      collected.push(...topicSugs)
    }
  }

  if (chatMode && SUGGESTION_MAP[chatMode]) {
    collected.push(...SUGGESTION_MAP[chatMode])
  }

  if (collected.length === 0) {
    const lastMsg = mensagens[mensagens.length - 1]?.conteudo || ''
    if (lastMsg.includes('```questao')) {
      collected.push(...(SUGGESTION_MAP.questoes || []))
    } else if (lastMsg.includes('```flashcard')) {
      collected.push(...(SUGGESTION_MAP.flashcards || []))
    } else if (lastMsg.includes('```mermaid')) {
      collected.push(...(SUGGESTION_MAP.resumo || []))
    } else {
      return DEFAULT_SUGGESTIONS
    }
  }

  const unique = [...new Set(collected)]
  const shuffled = unique.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 4)
}

function SuggestionChips({ lastMessage, chatMode, onSuggestionClick, mensagens }: SuggestionChipsProps) {
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null)
  const fetchedRef = useRef<string>('')

  // Sugestões estáticas (imediatas) baseadas no histórico completo
  const staticSuggestions = useMemo(() => {
    if (mensagens && mensagens.length > 0) {
      return getStaticSuggestions(mensagens, chatMode)
    }
    if (!lastMessage) return DEFAULT_SUGGESTIONS
    return getStaticSuggestions([{ tipo: 'ia', conteudo: lastMessage }], chatMode)
  }, [lastMessage, chatMode, mensagens])

  // Buscar sugestões da IA em background
  useEffect(() => {
    if (!mensagens || mensagens.length < 2) return

    // Evitar refetch se a última mensagem não mudou
    const lastContent = mensagens[mensagens.length - 1]?.conteudo || ''
    const key = lastContent.substring(0, 100)
    if (fetchedRef.current === key) return
    fetchedRef.current = key

    const controller = new AbortController()

    const fetchAiSuggestions = async () => {
      try {
        const payload = mensagens.slice(-6).map(m => ({
          role: m.tipo === 'usuario' ? 'user' : 'assistant',
          content: m.conteudo
        }))

        const res = await fetch('/api/medicina/ia/sugestoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mensagens: payload }),
          signal: controller.signal
        })

        if (!res.ok) return

        const data = await res.json()
        if (data.suggestions && data.suggestions.length > 0) {
          setAiSuggestions(data.suggestions)
        }
      } catch {
        // Silenciar - sugestões estáticas continuam funcionando
      }
    }

    fetchAiSuggestions()

    return () => controller.abort()
  }, [mensagens])

  const suggestions = aiSuggestions || staticSuggestions

  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
      {suggestions.map((sug, i) => (
        <button
          key={`${sug}-${i}`}
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
