// lib/admin/livrosFonte.ts
// Lista de livros-fonte para geração de questões médicas

export interface LivroReferencia {
  titulo: string
  autor: string
  edicao: string
  ano: number
  editora: string
  areas: string[]
  abreviacao: string
}

export const LIVROS_FONTE = {
  // PRIORIDADE 1 - Livros Clássicos Mais Usados
  prioridade1: [
    {
      titulo: 'Guyton e Hall - Tratado de Fisiologia Médica',
      autor: 'John E. Hall',
      edicao: '14ª edição',
      ano: 2021,
      editora: 'Elsevier',
      areas: ['Fisiologia', 'Todas as áreas'],
      abreviacao: 'Guyton'
    },
    {
      titulo: 'Sobotta - Atlas de Anatomia Humana',
      autor: 'Friedrich Paulsen, Jens Waschke',
      edicao: '24ª edição',
      ano: 2018,
      editora: 'Guanabara Koogan',
      areas: ['Anatomia'],
      abreviacao: 'Sobotta'
    },
    {
      titulo: 'Imunologia Celular e Molecular',
      autor: 'Abul K. Abbas, Andrew H. Lichtman',
      edicao: '10ª edição',
      ano: 2022,
      editora: 'Elsevier',
      areas: ['Imunologia'],
      abreviacao: 'Abbas'
    },
    {
      titulo: 'Robbins - Patologia Básica',
      autor: 'Vinay Kumar, Abul K. Abbas, Jon C. Aster',
      edicao: '10ª edição',
      ano: 2018,
      editora: 'Elsevier',
      areas: ['Patologia'],
      abreviacao: 'Robbins'
    },
    {
      titulo: 'Netter - Atlas de Anatomia Humana',
      autor: 'Frank H. Netter',
      edicao: '7ª edição',
      ano: 2019,
      editora: 'Elsevier',
      areas: ['Anatomia'],
      abreviacao: 'Netter'
    },
    {
      titulo: 'Moore - Anatomia Orientada para a Clínica',
      autor: 'Keith L. Moore, Arthur F. Dalley',
      edicao: '8ª edição',
      ano: 2019,
      editora: 'Guanabara Koogan',
      areas: ['Anatomia'],
      abreviacao: 'Moore'
    },
    {
      titulo: 'Rang & Dale - Farmacologia',
      autor: 'Humphrey P. Rang',
      edicao: '9ª edição',
      ano: 2020,
      editora: 'Elsevier',
      areas: ['Farmacologia'],
      abreviacao: 'Rang'
    },
    {
      titulo: 'Microbiologia Médica de Jawetz',
      autor: 'Karen C. Carroll',
      edicao: '27ª edição',
      ano: 2017,
      editora: 'McGraw-Hill',
      areas: ['Microbiologia'],
      abreviacao: 'Jawetz'
    },
    {
      titulo: 'Histologia Básica - Junqueira e Carneiro',
      autor: 'Luiz Carlos Junqueira, José Carneiro',
      edicao: '13ª edição',
      ano: 2017,
      editora: 'Guanabara Koogan',
      areas: ['Histologia'],
      abreviacao: 'Junqueira'
    },
    {
      titulo: 'Embriologia Clínica - Moore',
      autor: 'Keith L. Moore, T.V.N. Persaud',
      edicao: '10ª edição',
      ano: 2016,
      editora: 'Elsevier',
      areas: ['Embriologia'],
      abreviacao: 'Moore-Embrio'
    },
    {
      titulo: 'Lehninger - Princípios de Bioquímica',
      autor: 'David L. Nelson, Michael M. Cox',
      edicao: '7ª edição',
      ano: 2019,
      editora: 'Artmed',
      areas: ['Bioquímica'],
      abreviacao: 'Lehninger'
    },
    {
      titulo: 'Goodman & Gilman - As Bases Farmacológicas da Terapêutica',
      autor: 'Laurence L. Brunton',
      edicao: '13ª edição',
      ano: 2018,
      editora: 'McGraw-Hill',
      areas: ['Farmacologia'],
      abreviacao: 'Goodman'
    },
    {
      titulo: 'Harrison - Medicina Interna',
      autor: 'J. Larry Jameson et al.',
      edicao: '20ª edição',
      ano: 2020,
      editora: 'McGraw-Hill',
      areas: ['Clínica Médica', 'Todas'],
      abreviacao: 'Harrison'
    },
    {
      titulo: 'Semiologia Médica - Porto',
      autor: 'Celmo Celeno Porto',
      edicao: '9ª edição',
      ano: 2024,
      editora: 'Guanabara Koogan',
      areas: ['Semiologia'],
      abreviacao: 'Porto'
    },
    {
      titulo: 'Bioquímica Ilustrada',
      autor: 'Denise R. Ferrier',
      edicao: '8ª edição',
      ano: 2022,
      editora: 'Artmed',
      areas: ['Bioquímica'],
      abreviacao: 'Ferrier'
    },
    {
      titulo: 'Epidemiologia Clínica',
      autor: 'Robert H. Fletcher, Suzanne W. Fletcher',
      edicao: '5ª edição',
      ano: 2014,
      editora: 'Artmed',
      areas: ['Epidemiologia', 'Medicina Preventiva'],
      abreviacao: 'Fletcher'
    },
    {
      titulo: 'Medicina Tropical - Abordagem Atual das Doenças Infecciosas e Parasitárias',
      autor: 'Sergio Cimerman, Benjamin Cimerman',
      edicao: '2ª edição',
      ano: 2010,
      editora: 'Atheneu',
      areas: ['Medicina Tropical', 'Doenças Infecciosas'],
      abreviacao: 'Cimerman'
    },
    {
      titulo: 'Medicina Ambulatorial - Condutas de Atenção Primária',
      autor: 'Bruce B. Duncan et al.',
      edicao: '5ª edição',
      ano: 2022,
      editora: 'Artmed',
      areas: ['Medicina de Família', 'Atenção Primária', 'Clínica Médica'],
      abreviacao: 'Duncan'
    },
    {
      titulo: 'Fisiologia Humana - Uma Abordagem Integrada',
      autor: 'Dee Unglaub Silverthorn',
      edicao: '7ª edição',
      ano: 2017,
      editora: 'Artmed',
      areas: ['Fisiologia'],
      abreviacao: 'Silverthorn'
    },
    {
      titulo: 'Bioquímica',
      autor: 'Donald Voet, Judith G. Voet',
      edicao: '4ª edição',
      ano: 2013,
      editora: 'Artmed',
      areas: ['Bioquímica'],
      abreviacao: 'Voet'
    },
    {
      titulo: 'Atlas Fotográfico de Anatomia Sistêmica e Regional',
      autor: 'Johannes W. Rohen, Chihiro Yokochi',
      edicao: '8ª edição',
      ano: 2016,
      editora: 'Manole',
      areas: ['Anatomia'],
      abreviacao: 'Yokochi'
    }
  ] as LivroReferencia[],

  // PRIORIDADE 2 - Livros Complementares
  prioridade2: [
    {
      titulo: 'Gray - Anatomia para Estudantes',
      autor: 'Richard L. Drake',
      edicao: '4ª edição',
      ano: 2021,
      editora: 'Elsevier',
      areas: ['Anatomia'],
      abreviacao: 'Gray'
    },
    {
      titulo: 'Bogliolo - Patologia',
      autor: 'Geraldo Brasileiro Filho',
      edicao: '10ª edição',
      ano: 2021,
      editora: 'Guanabara Koogan',
      areas: ['Patologia'],
      abreviacao: 'Bogliolo'
    },
    {
      titulo: 'Fisiologia - Berne & Levy',
      autor: 'Bruce M. Koeppen, Bruce A. Stanton',
      edicao: '7ª edição',
      ano: 2018,
      editora: 'Elsevier',
      areas: ['Fisiologia'],
      abreviacao: 'Berne'
    },
    {
      titulo: 'Microbiologia - Tortora',
      autor: 'Gerard J. Tortora',
      edicao: '12ª edição',
      ano: 2017,
      editora: 'Artmed',
      areas: ['Microbiologia'],
      abreviacao: 'Tortora'
    },
    {
      titulo: 'Parasitologia Humana - Neves',
      autor: 'David Pereira Neves',
      edicao: '13ª edição',
      ano: 2016,
      editora: 'Atheneu',
      areas: ['Parasitologia'],
      abreviacao: 'Neves'
    },
    {
      titulo: 'Nelson Tratado de Pediatria',
      autor: 'Robert M. Kliegman et al.',
      edicao: '21ª edição',
      ano: 2020,
      editora: 'Elsevier',
      areas: ['Pediatria'],
      abreviacao: 'Nelson'
    },
    {
      titulo: 'Williams Obstetrícia',
      autor: 'F. Gary Cunningham et al.',
      edicao: '26ª edição',
      ano: 2022,
      editora: 'McGraw-Hill',
      areas: ['Obstetrícia', 'Ginecologia'],
      abreviacao: 'Williams'
    },
    {
      titulo: 'Sabiston Tratado de Cirurgia',
      autor: 'Courtney M. Townsend Jr.',
      edicao: '21ª edição',
      ano: 2022,
      editora: 'Elsevier',
      areas: ['Cirurgia'],
      abreviacao: 'Sabiston'
    },
    {
      titulo: 'Kaplan & Sadock Compêndio de Psiquiatria',
      autor: 'Benjamin J. Sadock',
      edicao: '11ª edição',
      ano: 2017,
      editora: 'Artmed',
      areas: ['Psiquiatria'],
      abreviacao: 'Kaplan'
    },
    {
      titulo: 'Machado - Neuroanatomia Funcional',
      autor: 'Angelo B. M. Machado',
      edicao: '3ª edição',
      ano: 2014,
      editora: 'Atheneu',
      areas: ['Neuroanatomia', 'Neurologia'],
      abreviacao: 'Machado'
    }
  ] as LivroReferencia[],

  // PRIORIDADE 3 - Fontes online (usar apenas se necessário)
  fontesOnline: [
    'PubMed',
    'SciELO',
    'UpToDate',
    'Diretrizes SBC (Sociedade Brasileira de Cardiologia)',
    'Diretrizes SBD (Sociedade Brasileira de Diabetes)',
    'Diretrizes SBEM (Sociedade Brasileira de Endocrinologia)'
  ]
}

// Mapeamento disciplina -> livros recomendados
export const LIVROS_POR_DISCIPLINA: Record<string, string[]> = {
  'Anatomia': ['Sobotta', 'Netter', 'Moore', 'Gray'],
  'Fisiologia': ['Guyton', 'Berne'],
  'Histologia': ['Junqueira'],
  'Embriologia': ['Moore-Embrio'],
  'Bioquímica': ['Lehninger'],
  'Imunologia': ['Abbas'],
  'Microbiologia': ['Jawetz', 'Tortora'],
  'Parasitologia': ['Neves'],
  'Patologia': ['Robbins', 'Bogliolo'],
  'Farmacologia': ['Rang', 'Goodman'],
  'Semiologia': ['Porto'],
  'Clínica Médica': ['Harrison'],
  'Cirurgia': ['Sabiston'],
  'Pediatria': ['Nelson'],
  'Obstetrícia': ['Williams'],
  'Ginecologia': ['Williams'],
  'Psiquiatria': ['Kaplan'],
  'Neurologia': ['Machado']
}

// Obter livros recomendados para uma disciplina
export function getLivrosParaDisciplina(disciplina: string): LivroReferencia[] {
  const abreviacoes = LIVROS_POR_DISCIPLINA[disciplina] || ['Harrison', 'Guyton']
  const todosLivros = [...LIVROS_FONTE.prioridade1, ...LIVROS_FONTE.prioridade2]

  return todosLivros.filter(livro =>
    abreviacoes.includes(livro.abreviacao)
  )
}

// Formatar referência ABNT
export function formatarReferenciaABNT(livro: LivroReferencia, capitulo?: string, paginas?: string): string {
  const autores = livro.autor.toUpperCase().split(',')[0]
  const resto = livro.autor.split(',').slice(1).join(',')

  let referencia = `${autores}${resto ? ',' + resto : ''}. **${livro.titulo}**. ${livro.edicao}. ${livro.editora}, ${livro.ano}.`

  if (capitulo) {
    referencia += ` Cap. ${capitulo}`
  }
  if (paginas) {
    referencia += `, p. ${paginas}`
  }

  return referencia
}

// Obter todos os livros
export function getTodosLivros(): LivroReferencia[] {
  return [...LIVROS_FONTE.prioridade1, ...LIVROS_FONTE.prioridade2]
}
