// lib/admin/periodos.ts
// Sistema de níveis de dificuldade por período da faculdade

export interface PeriodoInfo {
  nome: string
  nivel: string
  descricao: string
  disciplinas_tipicas: string[]
  complexidade: number
}

export const PERIODOS_DIFICULDADE: Record<number, PeriodoInfo> = {
  1: {
    nome: '1º Período',
    nivel: 'Muito Básico',
    descricao: 'Conceitos fundamentais, definições básicas',
    disciplinas_tipicas: ['Anatomia Básica', 'Bioquímica', 'Histologia'],
    complexidade: 1
  },
  2: {
    nome: '2º Período',
    nivel: 'Básico',
    descricao: 'Integração inicial de conceitos',
    disciplinas_tipicas: ['Anatomia Sistêmica', 'Fisiologia Básica', 'Embriologia'],
    complexidade: 2
  },
  3: {
    nome: '3º Período',
    nivel: 'Básico-Intermediário',
    descricao: 'Correlações clínicas iniciais',
    disciplinas_tipicas: ['Fisiologia Avançada', 'Imunologia', 'Microbiologia'],
    complexidade: 3
  },
  4: {
    nome: '4º Período',
    nivel: 'Intermediário',
    descricao: 'Patologias básicas e farmacologia inicial',
    disciplinas_tipicas: ['Patologia Geral', 'Farmacologia Básica', 'Parasitologia'],
    complexidade: 4
  },
  5: {
    nome: '5º Período',
    nivel: 'Intermediário',
    descricao: 'Semiologia e início da clínica',
    disciplinas_tipicas: ['Semiologia', 'Patologia Especial', 'Farmacologia Clínica'],
    complexidade: 5
  },
  6: {
    nome: '6º Período',
    nivel: 'Intermediário-Avançado',
    descricao: 'Clínicas básicas',
    disciplinas_tipicas: ['Clínica Médica I', 'Cirurgia I', 'Pediatria I'],
    complexidade: 6
  },
  7: {
    nome: '7º Período',
    nivel: 'Avançado',
    descricao: 'Clínicas especializadas',
    disciplinas_tipicas: ['Clínica Médica II', 'Ginecologia', 'Psiquiatria'],
    complexidade: 7
  },
  8: {
    nome: '8º Período',
    nivel: 'Avançado',
    descricao: 'Emergências e procedimentos',
    disciplinas_tipicas: ['Emergências', 'Cirurgia II', 'Ortopedia'],
    complexidade: 8
  },
  9: {
    nome: '9º Período (Internato)',
    nivel: 'Muito Avançado',
    descricao: 'Casos clínicos complexos',
    disciplinas_tipicas: ['Internato Clínica Médica', 'Internato Cirurgia'],
    complexidade: 9
  },
  10: {
    nome: '10º Período (Internato)',
    nivel: 'Muito Avançado',
    descricao: 'Raciocínio clínico integrado',
    disciplinas_tipicas: ['Internato Pediatria', 'Internato GO'],
    complexidade: 9
  },
  11: {
    nome: '11º Período (Internato)',
    nivel: 'Residência',
    descricao: 'Nível prova de residência',
    disciplinas_tipicas: ['Todas as áreas'],
    complexidade: 10
  },
  12: {
    nome: '12º Período (Internato)',
    nivel: 'Residência',
    descricao: 'Questões complexas integradas',
    disciplinas_tipicas: ['Todas as áreas'],
    complexidade: 10
  }
}

// Mapeamento para exibição no filtro/select
export const PERIODOS_OPCOES = Object.entries(PERIODOS_DIFICULDADE).map(([key, value]) => ({
  value: parseInt(key),
  label: `${value.nome} - ${value.nivel}`,
  descricao: value.descricao,
  complexidade: value.complexidade
}))

// Agrupa períodos por nível
export const PERIODOS_POR_NIVEL = {
  basico: [1, 2],
  intermediario: [3, 4, 5],
  avancado: [6, 7, 8],
  residencia: [9, 10, 11, 12]
}

// Obter info de um período
export function getPeriodoInfo(periodo: number): PeriodoInfo | null {
  return PERIODOS_DIFICULDADE[periodo] || null
}

// Obter cor do badge baseado na complexidade
export function getPeriodoCor(periodo: number): string {
  const info = PERIODOS_DIFICULDADE[periodo]
  if (!info) return 'bg-slate-500'

  if (info.complexidade <= 2) return 'bg-green-500'
  if (info.complexidade <= 4) return 'bg-blue-500'
  if (info.complexidade <= 6) return 'bg-yellow-500'
  if (info.complexidade <= 8) return 'bg-orange-500'
  return 'bg-red-500'
}
