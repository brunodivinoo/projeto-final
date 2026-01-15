// Taxonomia Médica para Classificação de Questões
// Hierarquia: Disciplina > Assunto > Subassunto

export interface TaxonomiaItem {
  nome: string
  subassuntos?: string[]
}

export interface DisciplinaTaxonomia {
  nome: string
  emoji: string
  cor: string
  assuntos: Record<string, TaxonomiaItem>
}

export const TAXONOMIA_MEDICA: Record<string, DisciplinaTaxonomia> = {
  'Cardiologia': {
    nome: 'Cardiologia',
    emoji: '❤️',
    cor: 'red',
    assuntos: {
      'Insuficiência Cardíaca': {
        nome: 'Insuficiência Cardíaca',
        subassuntos: ['IC Sistólica (FEr)', 'IC Diastólica (FEp)', 'IC Aguda', 'IC Crônica', 'IC Descompensada', 'Choque Cardiogênico']
      },
      'Arritmias': {
        nome: 'Arritmias',
        subassuntos: ['Fibrilação Atrial', 'Flutter Atrial', 'Taquicardia Supraventricular', 'Taquicardia Ventricular', 'Fibrilação Ventricular', 'Bradiarritmias', 'BAV 1º/2º/3º Grau', 'Síndrome de Wolff-Parkinson-White']
      },
      'Doença Coronariana': {
        nome: 'Doença Coronariana',
        subassuntos: ['IAM com Supra de ST', 'IAM sem Supra de ST', 'Angina Estável', 'Angina Instável', 'Síndrome Coronariana Aguda']
      },
      'Valvopatias': {
        nome: 'Valvopatias',
        subassuntos: ['Estenose Aórtica', 'Insuficiência Aórtica', 'Estenose Mitral', 'Insuficiência Mitral', 'Prolapso de Válvula Mitral', 'Endocardite Infecciosa']
      },
      'Hipertensão': {
        nome: 'Hipertensão',
        subassuntos: ['HAS Primária', 'HAS Secundária', 'Crise Hipertensiva', 'Urgência Hipertensiva', 'Emergência Hipertensiva', 'HAS Resistente']
      },
      'Cardiomiopatias': {
        nome: 'Cardiomiopatias',
        subassuntos: ['Cardiomiopatia Dilatada', 'Cardiomiopatia Hipertrófica', 'Cardiomiopatia Restritiva', 'Miocardite']
      },
      'Doenças do Pericárdio': {
        nome: 'Doenças do Pericárdio',
        subassuntos: ['Pericardite Aguda', 'Derrame Pericárdico', 'Tamponamento Cardíaco', 'Pericardite Constritiva']
      }
    }
  },
  'Pneumologia': {
    nome: 'Pneumologia',
    emoji: '🫁',
    cor: 'blue',
    assuntos: {
      'DPOC': {
        nome: 'DPOC',
        subassuntos: ['Bronquite Crônica', 'Enfisema Pulmonar', 'Exacerbação de DPOC', 'DPOC GOLD A/B/C/D']
      },
      'Asma': {
        nome: 'Asma',
        subassuntos: ['Asma Leve', 'Asma Moderada', 'Asma Grave', 'Crise Asmática', 'Status Asmático', 'Asma Ocupacional']
      },
      'Pneumonias': {
        nome: 'Pneumonias',
        subassuntos: ['PAC - Pneumonia Adquirida na Comunidade', 'Pneumonia Hospitalar', 'Pneumonia Atípica', 'Pneumonia Aspirativa', 'Pneumonia em Imunossuprimidos']
      },
      'Doenças Intersticiais': {
        nome: 'Doenças Intersticiais',
        subassuntos: ['Fibrose Pulmonar Idiopática', 'Sarcoidose', 'Pneumonite por Hipersensibilidade', 'Asbestose', 'Silicose']
      },
      'Tromboembolismo': {
        nome: 'Tromboembolismo',
        subassuntos: ['TEP - Tromboembolismo Pulmonar', 'TVP - Trombose Venosa Profunda', 'Hipertensão Pulmonar']
      },
      'Derrame Pleural': {
        nome: 'Derrame Pleural',
        subassuntos: ['Transudato', 'Exsudato', 'Empiema', 'Quilotórax', 'Hemotórax']
      },
      'Tuberculose': {
        nome: 'Tuberculose',
        subassuntos: ['TB Pulmonar', 'TB Extrapulmonar', 'TB Latente', 'TB Multirresistente']
      },
      'Câncer de Pulmão': {
        nome: 'Câncer de Pulmão',
        subassuntos: ['Carcinoma de Pequenas Células', 'Carcinoma Não Pequenas Células', 'Nódulo Pulmonar Solitário']
      }
    }
  },
  'Gastroenterologia': {
    nome: 'Gastroenterologia',
    emoji: '🫃',
    cor: 'amber',
    assuntos: {
      'Doenças do Esôfago': {
        nome: 'Doenças do Esôfago',
        subassuntos: ['DRGE', 'Esofagite', 'Esôfago de Barrett', 'Acalasia', 'Câncer de Esôfago', 'Varizes Esofágicas']
      },
      'Doenças Gástricas': {
        nome: 'Doenças Gástricas',
        subassuntos: ['Gastrite', 'Úlcera Péptica', 'H. pylori', 'Câncer Gástrico', 'Hemorragia Digestiva Alta']
      },
      'Doenças Intestinais': {
        nome: 'Doenças Intestinais',
        subassuntos: ['Doença de Crohn', 'Retocolite Ulcerativa', 'Síndrome do Intestino Irritável', 'Doença Celíaca', 'Diverticulite']
      },
      'Doenças do Cólon': {
        nome: 'Doenças do Cólon',
        subassuntos: ['Câncer Colorretal', 'Pólipos Intestinais', 'Colite Pseudomembranosa', 'Hemorragia Digestiva Baixa']
      },
      'Doenças Hepáticas': {
        nome: 'Doenças Hepáticas',
        subassuntos: ['Cirrose Hepática', 'Hepatite Viral', 'Hepatite Autoimune', 'Esteatose Hepática', 'Hepatocarcinoma', 'Encefalopatia Hepática']
      },
      'Doenças Pancreáticas': {
        nome: 'Doenças Pancreáticas',
        subassuntos: ['Pancreatite Aguda', 'Pancreatite Crônica', 'Câncer de Pâncreas']
      },
      'Doenças Biliares': {
        nome: 'Doenças Biliares',
        subassuntos: ['Colelitíase', 'Colecistite', 'Coledocolitíase', 'Colangite', 'Câncer de Vesícula']
      }
    }
  },
  'Nefrologia': {
    nome: 'Nefrologia',
    emoji: '🫘',
    cor: 'purple',
    assuntos: {
      'Lesão Renal Aguda': {
        nome: 'Lesão Renal Aguda',
        subassuntos: ['LRA Pré-renal', 'LRA Renal', 'LRA Pós-renal', 'Necrose Tubular Aguda', 'Nefrite Intersticial']
      },
      'Doença Renal Crônica': {
        nome: 'Doença Renal Crônica',
        subassuntos: ['DRC Estágios 1-5', 'Diálise', 'Transplante Renal']
      },
      'Glomerulopatias': {
        nome: 'Glomerulopatias',
        subassuntos: ['Síndrome Nefrótica', 'Síndrome Nefrítica', 'Glomerulonefrite', 'Nefropatia Diabética', 'Nefropatia por IgA']
      },
      'Distúrbios Hidroeletrolíticos': {
        nome: 'Distúrbios Hidroeletrolíticos',
        subassuntos: ['Hiponatremia', 'Hipernatremia', 'Hipocalemia', 'Hipercalemia', 'Hipocalcemia', 'Hipercalcemia', 'Acidose Metabólica', 'Alcalose Metabólica']
      },
      'Infecções Urinárias': {
        nome: 'Infecções Urinárias',
        subassuntos: ['Cistite', 'Pielonefrite', 'ITU Complicada', 'ITU de Repetição']
      }
    }
  },
  'Endocrinologia': {
    nome: 'Endocrinologia',
    emoji: '🦠',
    cor: 'green',
    assuntos: {
      'Diabetes Mellitus': {
        nome: 'Diabetes Mellitus',
        subassuntos: ['DM Tipo 1', 'DM Tipo 2', 'Cetoacidose Diabética', 'Estado Hiperglicêmico Hiperosmolar', 'Complicações Crônicas', 'Hipoglicemia']
      },
      'Tireoide': {
        nome: 'Tireoide',
        subassuntos: ['Hipotireoidismo', 'Hipertireoidismo', 'Doença de Graves', 'Tireoidite de Hashimoto', 'Nódulo Tireoidiano', 'Câncer de Tireoide', 'Crise Tireotóxica']
      },
      'Suprarrenal': {
        nome: 'Suprarrenal',
        subassuntos: ['Síndrome de Cushing', 'Doença de Addison', 'Insuficiência Adrenal', 'Feocromocitoma', 'Hiperaldosteronismo']
      },
      'Hipófise': {
        nome: 'Hipófise',
        subassuntos: ['Prolactinoma', 'Acromegalia', 'Diabetes Insipidus', 'SIADH', 'Hipopituitarismo']
      },
      'Paratireoide': {
        nome: 'Paratireoide',
        subassuntos: ['Hiperparatireoidismo', 'Hipoparatireoidismo']
      },
      'Obesidade': {
        nome: 'Obesidade',
        subassuntos: ['Obesidade e Síndrome Metabólica', 'Cirurgia Bariátrica']
      },
      'Dislipidemia': {
        nome: 'Dislipidemia',
        subassuntos: ['Hipercolesterolemia', 'Hipertrigliceridemia', 'Dislipidemia Mista']
      }
    }
  },
  'Neurologia': {
    nome: 'Neurologia',
    emoji: '🧠',
    cor: 'pink',
    assuntos: {
      'AVC': {
        nome: 'AVC',
        subassuntos: ['AVC Isquêmico', 'AVC Hemorrágico', 'AIT', 'Trombólise', 'Trombectomia']
      },
      'Epilepsia': {
        nome: 'Epilepsia',
        subassuntos: ['Crises Focais', 'Crises Generalizadas', 'Status Epilepticus', 'Síndromes Epilépticas']
      },
      'Cefaleias': {
        nome: 'Cefaleias',
        subassuntos: ['Migrânea', 'Cefaleia Tensional', 'Cefaleia em Salvas', 'Cefaleias Secundárias']
      },
      'Doenças Neurodegenerativas': {
        nome: 'Doenças Neurodegenerativas',
        subassuntos: ['Doença de Alzheimer', 'Doença de Parkinson', 'Esclerose Lateral Amiotrófica', 'Esclerose Múltipla', 'Demência Vascular']
      },
      'Infecções do SNC': {
        nome: 'Infecções do SNC',
        subassuntos: ['Meningite Bacteriana', 'Meningite Viral', 'Encefalite', 'Abscesso Cerebral', 'Neurossífilis']
      },
      'Neuropatias': {
        nome: 'Neuropatias',
        subassuntos: ['Síndrome de Guillain-Barré', 'Neuropatia Diabética', 'Neuropatias Compressivas']
      },
      'Distúrbios do Movimento': {
        nome: 'Distúrbios do Movimento',
        subassuntos: ['Tremor Essencial', 'Coreia', 'Distonia', 'Parkinsonismo']
      }
    }
  },
  'Infectologia': {
    nome: 'Infectologia',
    emoji: '🦠',
    cor: 'orange',
    assuntos: {
      'HIV/AIDS': {
        nome: 'HIV/AIDS',
        subassuntos: ['Infecção Aguda pelo HIV', 'Doenças Definidoras de AIDS', 'TARV', 'Profilaxia Pós-Exposição', 'Profilaxia Pré-Exposição']
      },
      'Hepatites Virais': {
        nome: 'Hepatites Virais',
        subassuntos: ['Hepatite A', 'Hepatite B', 'Hepatite C', 'Hepatite D', 'Hepatite E']
      },
      'Infecções Respiratórias': {
        nome: 'Infecções Respiratórias',
        subassuntos: ['Gripe', 'COVID-19', 'Pneumonia Viral', 'Bronquiolite']
      },
      'Infecções Tropicais': {
        nome: 'Infecções Tropicais',
        subassuntos: ['Dengue', 'Zika', 'Chikungunya', 'Malária', 'Leishmaniose', 'Doença de Chagas', 'Esquistossomose']
      },
      'ISTs': {
        nome: 'ISTs',
        subassuntos: ['Sífilis', 'Gonorreia', 'Clamídia', 'Herpes Genital', 'HPV']
      },
      'Sepse': {
        nome: 'Sepse',
        subassuntos: ['Sepse', 'Choque Séptico', 'SIRS']
      },
      'Antibioticoterapia': {
        nome: 'Antibioticoterapia',
        subassuntos: ['Princípios de Antibioticoterapia', 'Antibióticos por Classe', 'Resistência Bacteriana']
      }
    }
  },
  'Hematologia': {
    nome: 'Hematologia',
    emoji: '🩸',
    cor: 'red',
    assuntos: {
      'Anemias': {
        nome: 'Anemias',
        subassuntos: ['Anemia Ferropriva', 'Anemia de Doença Crônica', 'Anemia Megaloblástica', 'Anemia Hemolítica', 'Anemia Aplástica', 'Anemia Falciforme', 'Talassemias']
      },
      'Distúrbios da Coagulação': {
        nome: 'Distúrbios da Coagulação',
        subassuntos: ['Hemofilia', 'Doença de von Willebrand', 'CIVD', 'PTT/SHU']
      },
      'Trombocitopenia': {
        nome: 'Trombocitopenia',
        subassuntos: ['PTI', 'Trombocitopenia Induzida por Heparina', 'Microangiopatias Trombóticas']
      },
      'Leucemias': {
        nome: 'Leucemias',
        subassuntos: ['LMA', 'LLA', 'LMC', 'LLC']
      },
      'Linfomas': {
        nome: 'Linfomas',
        subassuntos: ['Linfoma de Hodgkin', 'Linfoma Não-Hodgkin', 'Mieloma Múltiplo']
      },
      'Trombose': {
        nome: 'Trombose',
        subassuntos: ['Trombofilias', 'Anticoagulação', 'TEV']
      }
    }
  },
  'Reumatologia': {
    nome: 'Reumatologia',
    emoji: '🦴',
    cor: 'cyan',
    assuntos: {
      'Artrite Reumatoide': {
        nome: 'Artrite Reumatoide',
        subassuntos: ['Diagnóstico', 'Tratamento', 'Manifestações Extra-articulares']
      },
      'Lúpus Eritematoso Sistêmico': {
        nome: 'Lúpus Eritematoso Sistêmico',
        subassuntos: ['Critérios Diagnósticos', 'Nefrite Lúpica', 'LES e Gravidez']
      },
      'Espondiloartrites': {
        nome: 'Espondiloartrites',
        subassuntos: ['Espondilite Anquilosante', 'Artrite Psoriásica', 'Artrite Reativa']
      },
      'Vasculites': {
        nome: 'Vasculites',
        subassuntos: ['Arterite de Células Gigantes', 'Poliarterite Nodosa', 'Granulomatose com Poliangiite', 'Vasculite por IgA']
      },
      'Osteoartrite': {
        nome: 'Osteoartrite',
        subassuntos: ['OA de Joelho', 'OA de Quadril', 'OA de Mãos']
      },
      'Gota': {
        nome: 'Gota',
        subassuntos: ['Artrite Gotosa Aguda', 'Gota Crônica', 'Hiperuricemia']
      },
      'Fibromialgia': {
        nome: 'Fibromialgia',
        subassuntos: ['Diagnóstico', 'Tratamento']
      },
      'Esclerose Sistêmica': {
        nome: 'Esclerose Sistêmica',
        subassuntos: ['Forma Limitada', 'Forma Difusa']
      }
    }
  },
  'Clínica Médica': {
    nome: 'Clínica Médica',
    emoji: '🩺',
    cor: 'slate',
    assuntos: {
      'Emergências': {
        nome: 'Emergências',
        subassuntos: ['Parada Cardiorrespiratória', 'Choque', 'Anafilaxia', 'Intoxicações', 'Politrauma']
      },
      'Medicina Intensiva': {
        nome: 'Medicina Intensiva',
        subassuntos: ['Ventilação Mecânica', 'Sedação e Analgesia', 'Nutrição em UTI', 'Monitorização Hemodinâmica']
      },
      'Geriatria': {
        nome: 'Geriatria',
        subassuntos: ['Síndromes Geriátricas', 'Fragilidade', 'Polifarmácia', 'Quedas']
      },
      'Medicina Preventiva': {
        nome: 'Medicina Preventiva',
        subassuntos: ['Rastreamento', 'Vacinação do Adulto', 'Prevenção Primária']
      }
    }
  },
  'Cirurgia': {
    nome: 'Cirurgia',
    emoji: '🔪',
    cor: 'emerald',
    assuntos: {
      'Abdome Agudo': {
        nome: 'Abdome Agudo',
        subassuntos: ['Apendicite', 'Colecistite', 'Obstrução Intestinal', 'Úlcera Perfurada', 'Pancreatite Aguda', 'Diverticulite']
      },
      'Hérnias': {
        nome: 'Hérnias',
        subassuntos: ['Hérnia Inguinal', 'Hérnia Femoral', 'Hérnia Incisional', 'Hérnia Umbilical']
      },
      'Trauma': {
        nome: 'Trauma',
        subassuntos: ['ATLS', 'Trauma Torácico', 'Trauma Abdominal', 'TCE', 'Trauma Raquimedular']
      },
      'Pré e Pós-operatório': {
        nome: 'Pré e Pós-operatório',
        subassuntos: ['Avaliação Pré-operatória', 'Complicações Pós-operatórias', 'Profilaxia de TEV']
      },
      'Cirurgia Oncológica': {
        nome: 'Cirurgia Oncológica',
        subassuntos: ['Princípios', 'Estadiamento', 'Margens Cirúrgicas']
      }
    }
  },
  'Ginecologia e Obstetrícia': {
    nome: 'Ginecologia e Obstetrícia',
    emoji: '🤰',
    cor: 'rose',
    assuntos: {
      'Pré-natal': {
        nome: 'Pré-natal',
        subassuntos: ['Pré-natal de Baixo Risco', 'Pré-natal de Alto Risco', 'Exames de Rotina', 'Suplementação']
      },
      'Complicações Gestacionais': {
        nome: 'Complicações Gestacionais',
        subassuntos: ['Pré-eclâmpsia', 'Eclâmpsia', 'Diabetes Gestacional', 'Placenta Prévia', 'DPP']
      },
      'Parto': {
        nome: 'Parto',
        subassuntos: ['Assistência ao Parto', 'Partograma', 'Cesariana', 'Fórcipe']
      },
      'Puerpério': {
        nome: 'Puerpério',
        subassuntos: ['Puerpério Normal', 'Hemorragia Pós-parto', 'Infecção Puerperal']
      },
      'Ginecologia Geral': {
        nome: 'Ginecologia Geral',
        subassuntos: ['Ciclo Menstrual', 'Sangramento Uterino Anormal', 'Amenorreia', 'Dismenorreia']
      },
      'Oncologia Ginecológica': {
        nome: 'Oncologia Ginecológica',
        subassuntos: ['Câncer de Colo Uterino', 'Câncer de Endométrio', 'Câncer de Ovário', 'Câncer de Mama']
      },
      'Climatério': {
        nome: 'Climatério',
        subassuntos: ['Síndrome Climatérica', 'Terapia Hormonal']
      },
      'Infertilidade': {
        nome: 'Infertilidade',
        subassuntos: ['Investigação', 'Tratamento']
      }
    }
  },
  'Pediatria': {
    nome: 'Pediatria',
    emoji: '👶',
    cor: 'sky',
    assuntos: {
      'Neonatologia': {
        nome: 'Neonatologia',
        subassuntos: ['RN a Termo', 'Prematuridade', 'Icterícia Neonatal', 'Sepse Neonatal', 'Reanimação Neonatal']
      },
      'Puericultura': {
        nome: 'Puericultura',
        subassuntos: ['Desenvolvimento', 'Crescimento', 'Aleitamento Materno', 'Introdução Alimentar', 'Vacinação']
      },
      'Infecções Pediátricas': {
        nome: 'Infecções Pediátricas',
        subassuntos: ['IVAS', 'Pneumonia', 'Bronquiolite', 'Meningite', 'ITU']
      },
      'Doenças Exantemáticas': {
        nome: 'Doenças Exantemáticas',
        subassuntos: ['Sarampo', 'Rubéola', 'Varicela', 'Escarlatina', 'Eritema Infeccioso']
      },
      'Emergências Pediátricas': {
        nome: 'Emergências Pediátricas',
        subassuntos: ['Desidratação', 'Convulsão Febril', 'Anafilaxia', 'Parada Cardiorrespiratória']
      }
    }
  },
  'Psiquiatria': {
    nome: 'Psiquiatria',
    emoji: '🧠',
    cor: 'violet',
    assuntos: {
      'Transtornos do Humor': {
        nome: 'Transtornos do Humor',
        subassuntos: ['Depressão Maior', 'Transtorno Bipolar', 'Distimia', 'Ciclotimia']
      },
      'Transtornos de Ansiedade': {
        nome: 'Transtornos de Ansiedade',
        subassuntos: ['TAG', 'Transtorno de Pânico', 'Fobias', 'TOC', 'TEPT']
      },
      'Esquizofrenia': {
        nome: 'Esquizofrenia',
        subassuntos: ['Esquizofrenia', 'Outros Transtornos Psicóticos']
      },
      'Transtornos por Uso de Substâncias': {
        nome: 'Transtornos por Uso de Substâncias',
        subassuntos: ['Álcool', 'Tabaco', 'Cocaína', 'Opioides', 'Cannabis']
      },
      'Emergências Psiquiátricas': {
        nome: 'Emergências Psiquiátricas',
        subassuntos: ['Agitação Psicomotora', 'Risco de Suicídio', 'Síndrome Neuroléptica Maligna']
      },
      'Psicofarmacologia': {
        nome: 'Psicofarmacologia',
        subassuntos: ['Antidepressivos', 'Antipsicóticos', 'Estabilizadores de Humor', 'Benzodiazepínicos']
      }
    }
  },
  'Dermatologia': {
    nome: 'Dermatologia',
    emoji: '🧴',
    cor: 'amber',
    assuntos: {
      'Dermatoses Infecciosas': {
        nome: 'Dermatoses Infecciosas',
        subassuntos: ['Micoses Superficiais', 'Piodermites', 'Herpes', 'Hanseníase']
      },
      'Dermatoses Inflamatórias': {
        nome: 'Dermatoses Inflamatórias',
        subassuntos: ['Psoríase', 'Dermatite Atópica', 'Dermatite de Contato', 'Urticária']
      },
      'Câncer de Pele': {
        nome: 'Câncer de Pele',
        subassuntos: ['Melanoma', 'CBC', 'CEC', 'Lesões Pré-malignas']
      },
      'Doenças Bolhosas': {
        nome: 'Doenças Bolhosas',
        subassuntos: ['Pênfigo', 'Penfigoide', 'Dermatite Herpetiforme']
      }
    }
  },
  'Oftalmologia': {
    nome: 'Oftalmologia',
    emoji: '👁️',
    cor: 'indigo',
    assuntos: {
      'Glaucoma': {
        nome: 'Glaucoma',
        subassuntos: ['Glaucoma de Ângulo Aberto', 'Glaucoma de Ângulo Fechado', 'Glaucoma Agudo']
      },
      'Catarata': {
        nome: 'Catarata',
        subassuntos: ['Catarata Senil', 'Catarata Congênita']
      },
      'Retinopatias': {
        nome: 'Retinopatias',
        subassuntos: ['Retinopatia Diabética', 'DMRI', 'Descolamento de Retina']
      },
      'Olho Vermelho': {
        nome: 'Olho Vermelho',
        subassuntos: ['Conjuntivite', 'Uveíte', 'Ceratite', 'Esclerite']
      }
    }
  },
  'Otorrinolaringologia': {
    nome: 'Otorrinolaringologia',
    emoji: '👂',
    cor: 'teal',
    assuntos: {
      'Ouvido': {
        nome: 'Ouvido',
        subassuntos: ['Otite Externa', 'Otite Média', 'Perda Auditiva', 'Vertigem']
      },
      'Nariz e Seios': {
        nome: 'Nariz e Seios',
        subassuntos: ['Rinite', 'Sinusite', 'Epistaxe', 'Desvio de Septo']
      },
      'Faringe e Laringe': {
        nome: 'Faringe e Laringe',
        subassuntos: ['Faringite', 'Amigdalite', 'Laringite', 'Câncer de Laringe']
      }
    }
  }
}

// Função para buscar disciplinas
export function getDisciplinas(): string[] {
  return Object.keys(TAXONOMIA_MEDICA)
}

// Função para buscar assuntos de uma disciplina
export function getAssuntos(disciplina: string): string[] {
  const disc = TAXONOMIA_MEDICA[disciplina]
  if (!disc) return []
  return Object.keys(disc.assuntos)
}

// Função para buscar subassuntos
export function getSubassuntos(disciplina: string, assunto: string): string[] {
  const disc = TAXONOMIA_MEDICA[disciplina]
  if (!disc) return []
  const ass = disc.assuntos[assunto]
  if (!ass) return []
  return ass.subassuntos || []
}

// Função para validar classificação
export function validarClassificacao(disciplina: string, assunto: string, subassunto?: string): boolean {
  const disc = TAXONOMIA_MEDICA[disciplina]
  if (!disc) return false

  const ass = disc.assuntos[assunto]
  if (!ass) return false

  if (subassunto && ass.subassuntos) {
    return ass.subassuntos.includes(subassunto)
  }

  return true
}

// Função para obter info da disciplina
export function getDisciplinaInfo(disciplina: string): DisciplinaTaxonomia | null {
  return TAXONOMIA_MEDICA[disciplina] || null
}

// Função para buscar todas as disciplinas com seus assuntos (para dropdown hierárquico)
export function getTaxonomiaCompleta(): Array<{
  disciplina: string
  emoji: string
  cor: string
  assuntos: Array<{
    nome: string
    subassuntos: string[]
  }>
}> {
  return Object.entries(TAXONOMIA_MEDICA).map(([key, value]) => ({
    disciplina: key,
    emoji: value.emoji,
    cor: value.cor,
    assuntos: Object.entries(value.assuntos).map(([assuntoKey, assuntoValue]) => ({
      nome: assuntoKey,
      subassuntos: assuntoValue.subassuntos || []
    }))
  }))
}
