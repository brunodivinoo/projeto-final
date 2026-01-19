// =============================================
// PREPARAMED - Disciplinas que OBRIGATORIAMENTE precisam de imagens
// Na medicina, imagens são de EXTREMA IMPORTÂNCIA para o aprendizado
// =============================================

// Disciplinas que SEMPRE precisam de imagens nas questões e biblioteca
export const DISCIPLINAS_COM_IMAGENS_OBRIGATORIAS = {
  // === CIÊNCIAS BÁSICAS ===
  'anatomia': {
    nome: 'Anatomia',
    descricao: 'Estruturas do corpo humano',
    tiposImagens: ['peças anatômicas', 'cortes histológicos', 'radiografias', 'atlas anatômicos'],
    prioridade: 'CRITICA',
    exemploAssuntos: ['Sistema esquelético', 'Sistema muscular', 'Sistema nervoso', 'Sistema cardiovascular']
  },
  'histologia': {
    nome: 'Histologia',
    descricao: 'Estudo dos tecidos',
    tiposImagens: ['lâminas histológicas', 'cortes microscópicos', 'colorações especiais'],
    prioridade: 'CRITICA',
    exemploAssuntos: ['Tecido epitelial', 'Tecido conjuntivo', 'Tecido muscular', 'Tecido nervoso']
  },
  'embriologia': {
    nome: 'Embriologia',
    descricao: 'Desenvolvimento embrionário',
    tiposImagens: ['estágios embrionários', 'organogênese', 'malformações congênitas'],
    prioridade: 'ALTA',
    exemploAssuntos: ['Gametogênese', 'Desenvolvimento do SNC', 'Desenvolvimento cardíaco']
  },
  'patologia': {
    nome: 'Patologia',
    descricao: 'Processos patológicos',
    tiposImagens: ['macroscopia', 'microscopia', 'colorações especiais', 'imunohistoquímica'],
    prioridade: 'CRITICA',
    exemploAssuntos: ['Neoplasias', 'Inflamação', 'Distúrbios hemodinâmicos']
  },
  'microbiologia': {
    nome: 'Microbiologia',
    descricao: 'Microrganismos',
    tiposImagens: ['culturas bacterianas', 'colorações de Gram', 'microscopia eletrônica'],
    prioridade: 'ALTA',
    exemploAssuntos: ['Bactérias', 'Vírus', 'Fungos', 'Parasitas']
  },
  'parasitologia': {
    nome: 'Parasitologia',
    descricao: 'Parasitas humanos',
    tiposImagens: ['ovos de parasitas', 'formas larvais', 'ciclos de vida'],
    prioridade: 'CRITICA',
    exemploAssuntos: ['Protozoários', 'Helmintos', 'Artrópodes vetores']
  },
  'farmacologia': {
    nome: 'Farmacologia',
    descricao: 'Ação de medicamentos',
    tiposImagens: ['mecanismos de ação', 'curvas dose-resposta', 'estruturas químicas'],
    prioridade: 'MEDIA',
    exemploAssuntos: ['Farmacocinética', 'Farmacodinâmica', 'Interações medicamentosas']
  },

  // === DIAGNÓSTICO POR IMAGEM ===
  'radiologia': {
    nome: 'Radiologia',
    descricao: 'Diagnóstico por imagem',
    tiposImagens: ['radiografias', 'tomografias', 'ressonâncias', 'ultrassonografias'],
    prioridade: 'CRITICA',
    exemploAssuntos: ['Radiografia de tórax', 'TC de abdome', 'RM de crânio']
  },

  // === ESPECIALIDADES CLÍNICAS COM IMAGENS ===
  'dermatologia': {
    nome: 'Dermatologia',
    descricao: 'Doenças de pele',
    tiposImagens: ['lesões cutâneas', 'dermatoscopia', 'histopatologia de pele'],
    prioridade: 'CRITICA',
    exemploAssuntos: ['Lesões elementares', 'Dermatoses infecciosas', 'Neoplasias cutâneas', 'Dermatites']
  },
  'oftalmologia': {
    nome: 'Oftalmologia',
    descricao: 'Doenças dos olhos',
    tiposImagens: ['fundoscopia', 'biomicroscopia', 'angiografia', 'OCT'],
    prioridade: 'CRITICA',
    exemploAssuntos: ['Retinopatia diabética', 'Glaucoma', 'Catarata', 'Uveítes']
  },
  'cardiologia': {
    nome: 'Cardiologia',
    descricao: 'Doenças do coração',
    tiposImagens: ['eletrocardiogramas', 'ecocardiogramas', 'angiografias coronarianas'],
    prioridade: 'CRITICA',
    exemploAssuntos: ['IAM', 'Arritmias', 'Valvopatias', 'Insuficiência cardíaca']
  },
  'pneumologia': {
    nome: 'Pneumologia',
    descricao: 'Doenças respiratórias',
    tiposImagens: ['radiografias de tórax', 'TC de tórax', 'broncoscopia'],
    prioridade: 'ALTA',
    exemploAssuntos: ['Pneumonias', 'DPOC', 'Asma', 'Tuberculose']
  },
  'neurologia': {
    nome: 'Neurologia',
    descricao: 'Doenças do sistema nervoso',
    tiposImagens: ['TC de crânio', 'RM de encéfalo', 'arteriografias cerebrais'],
    prioridade: 'CRITICA',
    exemploAssuntos: ['AVC', 'Epilepsia', 'Tumores cerebrais', 'Doenças desmielinizantes']
  },
  'gastroenterologia': {
    nome: 'Gastroenterologia',
    descricao: 'Doenças digestivas',
    tiposImagens: ['endoscopias', 'colonoscopias', 'TC de abdome'],
    prioridade: 'ALTA',
    exemploAssuntos: ['DRGE', 'Úlcera péptica', 'Hepatites', 'DII']
  },
  'ortopedia': {
    nome: 'Ortopedia',
    descricao: 'Sistema musculoesquelético',
    tiposImagens: ['radiografias ósseas', 'RM articular', 'TC de coluna'],
    prioridade: 'CRITICA',
    exemploAssuntos: ['Fraturas', 'Luxações', 'Artrose', 'Doenças da coluna']
  },
  'reumatologia': {
    nome: 'Reumatologia',
    descricao: 'Doenças reumatológicas',
    tiposImagens: ['radiografias articulares', 'capilaroscopia', 'ultrassom articular'],
    prioridade: 'ALTA',
    exemploAssuntos: ['Artrite reumatoide', 'Lúpus', 'Espondiloartrites']
  },
  'hematologia': {
    nome: 'Hematologia',
    descricao: 'Doenças do sangue',
    tiposImagens: ['esfregaços de sangue', 'mielograma', 'imunofenotipagem'],
    prioridade: 'CRITICA',
    exemploAssuntos: ['Anemias', 'Leucemias', 'Linfomas', 'Coagulopatias']
  },
  'nefrologia': {
    nome: 'Nefrologia',
    descricao: 'Doenças renais',
    tiposImagens: ['ultrassom renal', 'biópsia renal', 'exame de urina'],
    prioridade: 'MEDIA',
    exemploAssuntos: ['Glomerulopatias', 'DRC', 'IRA', 'Litíase renal']
  },
  'endocrinologia': {
    nome: 'Endocrinologia',
    descricao: 'Doenças endócrinas',
    tiposImagens: ['ultrassom de tireoide', 'cintilografia', 'curvas hormonais'],
    prioridade: 'MEDIA',
    exemploAssuntos: ['Diabetes', 'Tireoide', 'Hipófise', 'Adrenal']
  },

  // === CIRURGIAS ===
  'cirurgia_geral': {
    nome: 'Cirurgia Geral',
    descricao: 'Cirurgias abdominais',
    tiposImagens: ['TC de abdome agudo', 'laparoscopias', 'feridas operatórias'],
    prioridade: 'ALTA',
    exemploAssuntos: ['Abdome agudo', 'Hérnias', 'Apendicite', 'Colecistite']
  },

  // === PEDIATRIA E GINECOLOGIA ===
  'pediatria': {
    nome: 'Pediatria',
    descricao: 'Doenças infantis',
    tiposImagens: ['curvas de crescimento', 'exantemas', 'radiografias pediátricas'],
    prioridade: 'ALTA',
    exemploAssuntos: ['Infecções exantemáticas', 'Desnutrição', 'Doenças respiratórias']
  },
  'ginecologia': {
    nome: 'Ginecologia',
    descricao: 'Saúde da mulher',
    tiposImagens: ['ultrassom pélvico', 'colposcopia', 'histeroscopia'],
    prioridade: 'ALTA',
    exemploAssuntos: ['Patologias cervicais', 'Endometriose', 'Miomas']
  },
  'obstetricia': {
    nome: 'Obstetrícia',
    descricao: 'Gestação e parto',
    tiposImagens: ['ultrassom obstétrico', 'cardiotocografia', 'partograma'],
    prioridade: 'ALTA',
    exemploAssuntos: ['Pré-natal', 'Complicações gestacionais', 'Parto']
  },

  // === INFECTOLOGIA ===
  'infectologia': {
    nome: 'Infectologia',
    descricao: 'Doenças infecciosas',
    tiposImagens: ['exames de cultura', 'sorologia', 'lesões infecciosas'],
    prioridade: 'ALTA',
    exemploAssuntos: ['HIV/AIDS', 'Tuberculose', 'Hepatites virais', 'Sepse']
  },

  // === OTORRINOLARINGOLOGIA ===
  'otorrinolaringologia': {
    nome: 'Otorrinolaringologia',
    descricao: 'Ouvido, nariz e garganta',
    tiposImagens: ['otoscopia', 'videolaringoscopia', 'audiometria'],
    prioridade: 'ALTA',
    exemploAssuntos: ['Otites', 'Sinusites', 'Laringites', 'Surdez']
  }
}

// Tipo para disciplinas com imagens
export type DisciplinaComImagem = keyof typeof DISCIPLINAS_COM_IMAGENS_OBRIGATORIAS

// Verificar se disciplina precisa de imagens
export function precisaDeImagem(nomeDisciplina: string): boolean {
  const nomeNormalizado = nomeDisciplina
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')

  // Verificar correspondência exata ou parcial
  for (const key of Object.keys(DISCIPLINAS_COM_IMAGENS_OBRIGATORIAS)) {
    if (nomeNormalizado.includes(key) || key.includes(nomeNormalizado)) {
      return true
    }
  }

  // Palavras-chave que indicam necessidade de imagem
  const palavrasChave = [
    'anatomia', 'histologia', 'patologia', 'radiologia', 'imagem',
    'dermato', 'oftalmo', 'cardio', 'ecg', 'neuro', 'hemato',
    'microscopia', 'exame fisico', 'lesao', 'tumor', 'cancer',
    'fratura', 'luxacao', 'ferida', 'ulcera', 'eritema', 'exantema'
  ]

  return palavrasChave.some(palavra => nomeNormalizado.includes(palavra))
}

// Obter prioridade de imagem para uma disciplina
export function getPrioridadeImagem(nomeDisciplina: string): 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' {
  const nomeNormalizado = nomeDisciplina
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')

  for (const [key, config] of Object.entries(DISCIPLINAS_COM_IMAGENS_OBRIGATORIAS)) {
    if (nomeNormalizado.includes(key) || key.includes(nomeNormalizado)) {
      return config.prioridade as 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'
    }
  }

  return 'BAIXA'
}

// Tipos de imagens recomendados para uma disciplina
export function getTiposImagensRecomendados(nomeDisciplina: string): string[] {
  const nomeNormalizado = nomeDisciplina
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')

  for (const [key, config] of Object.entries(DISCIPLINAS_COM_IMAGENS_OBRIGATORIAS)) {
    if (nomeNormalizado.includes(key) || key.includes(nomeNormalizado)) {
      return config.tiposImagens
    }
  }

  return ['imagem ilustrativa', 'diagrama', 'esquema']
}

// Prompt adicional para geração de questões com imagens
export function getPromptImagemParaQuestao(nomeDisciplina: string, assunto: string): string {
  const precisaImg = precisaDeImagem(nomeDisciplina)
  const prioridade = getPrioridadeImagem(nomeDisciplina)
  const tiposImagem = getTiposImagensRecomendados(nomeDisciplina)

  if (!precisaImg) {
    return ''
  }

  return `
ATENÇÃO - IMAGEM OBRIGATÓRIA:
Esta disciplina (${nomeDisciplina}) tem prioridade ${prioridade} para imagens.
A questão DEVE incluir uma imagem relevante.

Tipos de imagens recomendados para ${nomeDisciplina}:
${tiposImagem.map(t => `- ${t}`).join('\n')}

Para o assunto "${assunto}", a questão deve:
1. OBRIGATORIAMENTE incluir uma imagem ou solicitar geração de uma
2. A imagem deve ser clinicamente relevante e educativa
3. Se possível, usar imagens de atlas médicos ou casos clínicos reais
4. Descrever detalhadamente o que a imagem deve conter para posterior geração

FORMATO DA IMAGEM NA QUESTÃO:
Use a tag especial: [IMAGEM: descrição detalhada da imagem necessária]
Exemplo: [IMAGEM: Radiografia de tórax em PA mostrando consolidação em lobo inferior direito com broncograma aéreo, sugestivo de pneumonia lobar]
`
}

// Lista de disciplinas críticas para validação
export const DISCIPLINAS_CRITICAS_IMAGEM = Object.entries(DISCIPLINAS_COM_IMAGENS_OBRIGATORIAS)
  .filter(([_, config]) => config.prioridade === 'CRITICA')
  .map(([key, config]) => ({
    key,
    nome: config.nome,
    tiposImagens: config.tiposImagens
  }))

// Exportar para uso na geração de questões
export const INSTRUCOES_IMAGEM_MEDICINA = `
INSTRUÇÕES CRÍTICAS SOBRE IMAGENS EM MEDICINA:

Na medicina, imagens são de EXTREMA IMPORTÂNCIA para o aprendizado e avaliação.
Muitas disciplinas NÃO PODEM ter questões sem imagens, pois não refletem a realidade clínica.

DISCIPLINAS QUE SEMPRE PRECISAM DE IMAGENS:
${DISCIPLINAS_CRITICAS_IMAGEM.map(d => `- ${d.nome}: ${d.tiposImagens.join(', ')}`).join('\n')}

REGRAS:
1. Se a questão é sobre uma dessas disciplinas, INCLUA uma imagem
2. Use a tag [IMAGEM: descrição] para indicar qual imagem é necessária
3. A descrição deve ser detalhada o suficiente para gerar ou buscar a imagem
4. Prefira imagens de casos clínicos reais quando possível
5. Inclua achados relevantes que o aluno deve identificar na imagem
`
