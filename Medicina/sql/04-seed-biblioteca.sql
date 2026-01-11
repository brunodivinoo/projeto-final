-- =============================================
-- PREPARAMED - Seed de Conteúdo da Biblioteca
-- Disciplinas, Assuntos, Subassuntos e Teorias
-- =============================================

-- LIMPAR DADOS EXISTENTES (cuidado em produção!)
-- DELETE FROM teorias_MED;
-- DELETE FROM subassuntos_MED;
-- DELETE FROM assuntos_MED;
-- DELETE FROM disciplinas_MED;

-- =============================================
-- 1. DISCIPLINAS
-- =============================================

INSERT INTO disciplinas_MED (id, nome, icone, cor, ordem) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Clínica Médica', 'stethoscope', '#3B82F6', 1),
  ('d1000000-0000-0000-0000-000000000002', 'Cirurgia', 'scalpel', '#EF4444', 2),
  ('d1000000-0000-0000-0000-000000000003', 'Pediatria', 'baby', '#EC4899', 3),
  ('d1000000-0000-0000-0000-000000000004', 'Ginecologia e Obstetrícia', 'venus', '#A855F7', 4),
  ('d1000000-0000-0000-0000-000000000005', 'Medicina Preventiva', 'shield-check', '#22C55E', 5),
  ('d1000000-0000-0000-0000-000000000006', 'Cardiologia', 'heart-pulse', '#F43F5E', 6),
  ('d1000000-0000-0000-0000-000000000007', 'Farmacologia', 'pill', '#F59E0B', 7),
  ('d1000000-0000-0000-0000-000000000008', 'Anatomia', 'bone', '#06B6D4', 8),
  ('d1000000-0000-0000-0000-000000000009', 'Fisiologia', 'activity', '#14B8A6', 9),
  ('d1000000-0000-0000-0000-000000000010', 'Patologia', 'microscope', '#F97316', 10),
  ('d1000000-0000-0000-0000-000000000011', 'Neurologia', 'brain', '#8B5CF6', 11),
  ('d1000000-0000-0000-0000-000000000012', 'Infectologia', 'bug', '#10B981', 12),
  ('d1000000-0000-0000-0000-000000000013', 'Pneumologia', 'wind', '#0EA5E9', 13),
  ('d1000000-0000-0000-0000-000000000014', 'Nefrologia', 'droplets', '#6366F1', 14),
  ('d1000000-0000-0000-0000-000000000015', 'Gastroenterologia', 'utensils', '#84CC16', 15)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, cor = EXCLUDED.cor;

-- =============================================
-- 2. ASSUNTOS - CLÍNICA MÉDICA
-- =============================================

INSERT INTO assuntos_MED (id, disciplina_id, nome, ordem) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Hipertensão Arterial', 1),
  ('a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Diabetes Mellitus', 2),
  ('a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'Doenças da Tireoide', 3),
  ('a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', 'Insuficiência Cardíaca', 4),
  ('a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000001', 'Doença Arterial Coronariana', 5)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- ASSUNTOS - CARDIOLOGIA
INSERT INTO assuntos_MED (id, disciplina_id, nome, ordem) VALUES
  ('a2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000006', 'Eletrocardiograma', 1),
  ('a2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000006', 'Arritmias Cardíacas', 2),
  ('a2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000006', 'Valvopatias', 3),
  ('a2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000006', 'Infarto Agudo do Miocárdio', 4),
  ('a2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000006', 'Emergências Hipertensivas', 5)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- ASSUNTOS - PEDIATRIA
INSERT INTO assuntos_MED (id, disciplina_id, nome, ordem) VALUES
  ('a3000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 'Crescimento e Desenvolvimento', 1),
  ('a3000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'Aleitamento Materno', 2),
  ('a3000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'Infecções Respiratórias', 3),
  ('a3000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000003', 'Doenças Exantemáticas', 4),
  ('a3000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003', 'Vacinas', 5)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- ASSUNTOS - CIRURGIA
INSERT INTO assuntos_MED (id, disciplina_id, nome, ordem) VALUES
  ('a4000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'Abdome Agudo', 1),
  ('a4000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'Trauma', 2),
  ('a4000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'Hérnias', 3),
  ('a4000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'Cirurgia Vascular', 4),
  ('a4000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'Pré e Pós-Operatório', 5)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- ASSUNTOS - GINECOLOGIA E OBSTETRÍCIA
INSERT INTO assuntos_MED (id, disciplina_id, nome, ordem) VALUES
  ('a5000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', 'Pré-Natal', 1),
  ('a5000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000004', 'Trabalho de Parto', 2),
  ('a5000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000004', 'Síndromes Hipertensivas', 3),
  ('a5000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004', 'Sangramento na Gestação', 4),
  ('a5000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000004', 'Anticoncepção', 5)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- ASSUNTOS - INFECTOLOGIA
INSERT INTO assuntos_MED (id, disciplina_id, nome, ordem) VALUES
  ('a6000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000012', 'HIV/AIDS', 1),
  ('a6000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000012', 'Tuberculose', 2),
  ('a6000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000012', 'Sepse', 3),
  ('a6000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000012', 'Meningites', 4),
  ('a6000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000012', 'Arboviroses', 5)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- ASSUNTOS - NEUROLOGIA
INSERT INTO assuntos_MED (id, disciplina_id, nome, ordem) VALUES
  ('a7000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000011', 'AVC', 1),
  ('a7000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000011', 'Cefaleias', 2),
  ('a7000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000011', 'Epilepsia', 3),
  ('a7000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000011', 'Demências', 4),
  ('a7000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000011', 'Neuropatias Periféricas', 5)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- =============================================
-- 3. SUBASSUNTOS
-- =============================================

-- Subassuntos de Hipertensão
INSERT INTO subassuntos_MED (id, assunto_id, nome) VALUES
  ('s1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Classificação e Diagnóstico'),
  ('s1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Tratamento Não-Farmacológico'),
  ('s1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Anti-hipertensivos'),
  ('s1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Hipertensão Secundária')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- Subassuntos de Diabetes
INSERT INTO subassuntos_MED (id, assunto_id, nome) VALUES
  ('s2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'DM Tipo 1'),
  ('s2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'DM Tipo 2'),
  ('s2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Complicações Agudas'),
  ('s2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Complicações Crônicas')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- Subassuntos de ECG
INSERT INTO subassuntos_MED (id, assunto_id, nome) VALUES
  ('s3000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'ECG Normal'),
  ('s3000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', 'Sobrecargas'),
  ('s3000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000001', 'Bloqueios de Ramo'),
  ('s3000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000001', 'Isquemia e Infarto')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- Subassuntos de Arritmias
INSERT INTO subassuntos_MED (id, assunto_id, nome) VALUES
  ('s4000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Taquiarritmias Supraventriculares'),
  ('s4000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Fibrilação Atrial'),
  ('s4000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'Taquiarritmias Ventriculares'),
  ('s4000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 'Bradiarritmias')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- =============================================
-- 4. TEORIAS (CONTEÚDO PRINCIPAL)
-- =============================================

-- TEORIA 1: Hipertensão Arterial - Classificação e Diagnóstico
INSERT INTO teorias_MED (
  id, disciplina_id, assunto_id, subassunto_id,
  titulo, subtitulo,
  conteudo_basico, conteudo_avancado, conteudo_expert,
  pontos_chave, macetes, pegadinhas, correlacao_clinica,
  tempo_leitura_minutos, nivel_dificuldade
) VALUES (
  't1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  's1000000-0000-0000-0000-000000000001',
  'Hipertensão Arterial Sistêmica - Classificação e Diagnóstico',
  'Critérios diagnósticos, classificação e estratificação de risco cardiovascular',
  '{"secoes": [
    {
      "titulo": "Definição",
      "conteudo": "A Hipertensão Arterial Sistêmica (HAS) é uma condição clínica multifatorial caracterizada por níveis elevados e sustentados de pressão arterial (PA). Considera-se hipertensão quando a PA sistólica é ≥ 140 mmHg e/ou PA diastólica ≥ 90 mmHg em medidas de consultório."
    },
    {
      "titulo": "Classificação",
      "conteudo": "Segundo a Diretriz Brasileira de Hipertensão (2020):\n\n• Normal: PAS < 120 e PAD < 80 mmHg\n• Pré-hipertensão: PAS 120-139 ou PAD 80-89 mmHg\n• HAS Estágio 1: PAS 140-159 ou PAD 90-99 mmHg\n• HAS Estágio 2: PAS 160-179 ou PAD 100-109 mmHg\n• HAS Estágio 3: PAS ≥ 180 ou PAD ≥ 110 mmHg"
    },
    {
      "titulo": "Diagnóstico",
      "conteudo": "O diagnóstico de HAS deve ser baseado em múltiplas medidas de PA em diferentes ocasiões. São necessárias pelo menos duas medidas em cada consulta, em pelo menos duas consultas diferentes. A MAPA (Monitorização Ambulatorial da PA) e MRPA (Medida Residencial da PA) auxiliam no diagnóstico."
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Estratificação de Risco Cardiovascular",
      "conteudo": "A estratificação considera:\n\n1. Fatores de Risco:\n- Idade (H > 55a, M > 65a)\n- Tabagismo\n- Dislipidemia (LDL ≥ 130 ou HDL < 40)\n- DM\n- História familiar de DCV precoce\n- Obesidade (IMC ≥ 30)\n\n2. Lesão de Órgão-Alvo (LOA):\n- HVE (ECG ou Eco)\n- ITB < 0,9\n- TFG 30-60 mL/min\n- Microalbuminúria\n- Retinopatia\n\n3. Doença Cardiovascular Estabelecida:\n- AVC, AIT\n- DAC, IC\n- DAP\n- DRC estágio 4-5"
    },
    {
      "titulo": "MAPA vs MRPA",
      "conteudo": "MAPA:\n- Monitorização por 24h\n- Avalia PA durante sono\n- Detecta hipertensão mascarada\n- Valores normais: Vigília < 135/85, Sono < 120/70, 24h < 130/80\n\nMRPA:\n- Medidas em casa por 5-7 dias\n- Maior reprodutibilidade\n- Valores normais: < 135/85 mmHg"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Hipertensão Mascarada e do Jaleco Branco",
      "conteudo": "Hipertensão do Jaleco Branco:\n- PA elevada no consultório, normal fora dele\n- Prevalência: 15-30% dos hipertensos\n- Solicitar MAPA/MRPA para confirmar\n- Maior risco CV que normotensos verdadeiros\n\nHipertensão Mascarada:\n- PA normal no consultório, elevada fora dele\n- Prevalência: 10-15%\n- Maior risco CV que HAS do jaleco branco\n- Comum em: jovens, tabagistas, usuários de café/álcool"
    },
    {
      "titulo": "Fenótipo de PA",
      "conteudo": "Classificação baseada em consultório + MAPA/MRPA:\n\n1. Normotensão verdadeira: Ambos normais\n2. HAS sustentada: Ambos elevados\n3. HAS do jaleco branco: Só consultório elevado\n4. HAS mascarada: Só MAPA/MRPA elevado"
    }
  ]}',
  ARRAY['PA ≥ 140/90 mmHg define HAS', 'MAPA e MRPA confirmam diagnóstico', 'Estratificação considera FR + LOA + DCV', 'Hipertensão mascarada tem alto risco CV'],
  ARRAY['140/90 - HAS (lembrar: 14 de setembro = dia do HAS)', 'MAPA = Monitorização Ambulatorial 24h', 'ECA = Estratificação Cardiovascular Adequada'],
  ARRAY['HAS do jaleco branco não é benigna - acompanhar!', 'Não diagnosticar HAS com medida única', 'Considerar HAS secundária em jovens e resistentes'],
  'Paciente de 45 anos, assintomático, em check-up de rotina apresenta PA de 152/96 mmHg em duas medidas. Conduta: repetir em nova consulta e solicitar exames de estratificação (glicemia, lipídeos, creatinina, ECG, EAS).',
  15, 3
) ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo;

-- TEORIA 2: Anti-hipertensivos
INSERT INTO teorias_MED (
  id, disciplina_id, assunto_id, subassunto_id,
  titulo, subtitulo,
  conteudo_basico, conteudo_avancado, conteudo_expert,
  pontos_chave, macetes, pegadinhas, correlacao_clinica,
  tempo_leitura_minutos, nivel_dificuldade
) VALUES (
  't1000000-0000-0000-0000-000000000002',
  'd1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  's1000000-0000-0000-0000-000000000003',
  'Classes de Anti-hipertensivos',
  'Mecanismos de ação, indicações e contraindicações das principais classes',
  '{"secoes": [
    {
      "titulo": "Classes Principais",
      "conteudo": "As principais classes de anti-hipertensivos são:\n\n1. IECA (Inibidores da ECA): Captopril, Enalapril, Ramipril\n2. BRA (Bloqueadores dos Receptores de Angiotensina): Losartana, Valsartana\n3. Diuréticos: Tiazídicos (HCTZ), de Alça (Furosemida), Poupadores de K (Espironolactona)\n4. Bloqueadores dos Canais de Cálcio: Di-hidropiridínicos (Anlodipino) e Não-di-hidropiridínicos (Verapamil, Diltiazem)\n5. Betabloqueadores: Propranolol, Atenolol, Carvedilol, Metoprolol"
    },
    {
      "titulo": "Escolha Inicial",
      "conteudo": "Para HAS não complicada, as classes de primeira linha são:\n• IECA ou BRA\n• BCC (di-hidropiridínicos)\n• Diuréticos tiazídicos\n\nBetabloqueadores são primeira linha apenas se houver indicação específica (IC, DAC, arritmias)."
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "IECA vs BRA",
      "conteudo": "IECA:\n- Inibem conversão de Ang I → Ang II\n- Aumentam bradicinina → tosse seca (5-20%)\n- Contraindicados na gestação\n- Podem causar angioedema\n\nBRA:\n- Bloqueiam receptor AT1\n- Menor incidência de tosse\n- Mesma contraindicação na gestação\n- Angioedema mais raro\n\nNÃO associar IECA + BRA (maior risco de IRA e hipercalemia)"
    },
    {
      "titulo": "Indicações Específicas",
      "conteudo": "• DM com proteinúria: IECA ou BRA (nefroproteção)\n• IC com FE reduzida: IECA/BRA + BB + Espironolactona\n• FA permanente: BB ou BCC não-DHP para controle de FC\n• Pós-IAM: BB + IECA\n• Negros: BCC ou Tiazídico (IECA menos eficaz isolado)\n• Gestação: Metildopa, Nifedipino, Hidralazina"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "HAS Resistente",
      "conteudo": "Definição: PA não controlada com 3 anti-hipertensivos em doses otimizadas, incluindo diurético.\n\nAbordagem:\n1. Confirmar adesão ao tratamento\n2. Confirmar com MAPA (excluir jaleco branco)\n3. Investigar HAS secundária\n4. 4ª droga de escolha: Espironolactona 25-50mg\n\nCausas secundárias a investigar:\n- Apneia do sono (mais comum)\n- Hiperaldosteronismo primário\n- Estenose de artéria renal\n- Feocromocitoma\n- Cushing"
    },
    {
      "titulo": "Combinações Preferenciais",
      "conteudo": "Combinações sinérgicas:\n• IECA/BRA + Tiazídico\n• IECA/BRA + BCC\n• BCC + Tiazídico\n\nCombinações a evitar:\n• IECA + BRA (↑IRA)\n• BB + Verapamil/Diltiazem (bloqueio AV)\n• BB + Clonidina (efeito rebote)"
    }
  ]}',
  ARRAY['IECA/BRA são nefroprotetores no DM', 'Tosse por IECA → trocar para BRA', 'Espironolactona é 4ª droga na HAS resistente', 'Não associar IECA + BRA'],
  ARRAY['CAP-TOpril inibe ECA, Los-ARtan bloqueia AT1', 'Tosse = IECA = I de Incômodo', 'ABCD das 1as linhas: AIECA/BRA, BCC, Diurético'],
  ARRAY['IECA na gestação é teratogênico!', 'BB não é primeira linha na HAS sem comorbidade', 'Cuidado com IECA/BRA + poupador de K = hipercalemia'],
  'Mulher de 58 anos, diabética tipo 2 com proteinúria (300mg/24h) e PA 148/92. Melhor escolha: IECA ou BRA pela nefroproteção. Se PA não controlar, associar BCC ou tiazídico.',
  20, 3
) ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo;

-- TEORIA 3: Diabetes Mellitus Tipo 2
INSERT INTO teorias_MED (
  id, disciplina_id, assunto_id, subassunto_id,
  titulo, subtitulo,
  conteudo_basico, conteudo_avancado, conteudo_expert,
  pontos_chave, macetes, pegadinhas, correlacao_clinica,
  tempo_leitura_minutos, nivel_dificuldade
) VALUES (
  't1000000-0000-0000-0000-000000000003',
  'd1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000002',
  's2000000-0000-0000-0000-000000000002',
  'Diabetes Mellitus Tipo 2 - Diagnóstico e Tratamento',
  'Critérios diagnósticos, metas terapêuticas e algoritmo de tratamento',
  '{"secoes": [
    {
      "titulo": "Critérios Diagnósticos",
      "conteudo": "O diagnóstico de DM é feito por qualquer um dos seguintes critérios:\n\n• Glicemia de jejum ≥ 126 mg/dL (confirmada em 2 ocasiões)\n• Glicemia 2h após TOTG 75g ≥ 200 mg/dL\n• HbA1c ≥ 6,5% (confirmada em 2 ocasiões)\n• Glicemia aleatória ≥ 200 mg/dL + sintomas clássicos (poliúria, polidipsia, perda ponderal)\n\nPré-diabetes:\n• Glicemia de jejum: 100-125 mg/dL\n• TOTG 2h: 140-199 mg/dL\n• HbA1c: 5,7-6,4%"
    },
    {
      "titulo": "Metas de Controle",
      "conteudo": "Metas gerais:\n• HbA1c < 7%\n• Glicemia de jejum: 80-130 mg/dL\n• Glicemia pós-prandial: < 180 mg/dL\n\nMetas individualizadas:\n• Idosos frágeis, comorbidades, hipoglicemia: HbA1c < 8%\n• Pacientes jovens, início recente: HbA1c < 6,5%"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Tratamento Farmacológico",
      "conteudo": "1ª linha: Metformina\n- Dose: 500-2550mg/dia\n- Contraindicações: TFG < 30, IC descompensada, insuficiência hepática\n- Efeitos: reduz gliconeogênese hepática\n\n2ª linha (adicionar se HbA1c > meta após 3 meses):\n- Se DCV ou alto risco CV: iSGLT2 (Empagliflozina, Dapagliflozina) ou aGLP-1 (Liraglutida, Semaglutida)\n- Se necessidade de perda de peso: aGLP-1 > iSGLT2\n- Se custo for limitante: Sulfonilureia (Gliclazida) ou iDPP-4\n\n3ª linha: Insulina basal se HbA1c persistir alta"
    },
    {
      "titulo": "Classes de Antidiabéticos",
      "conteudo": "iSGLT2 (Gliflozinas):\n- Bloqueiam reabsorção renal de glicose\n- Benefício CV e renal comprovado\n- EA: ITU, candidíase, cetoacidose euglicêmica\n\naGLP-1 (Glutidas/Semaglutida):\n- Estimulam secreção de insulina, reduzem glucagon\n- Retardam esvaziamento gástrico\n- Benefício CV, perda de peso\n- EA: náusea, vômito\n\niDPP-4 (Gliptinas):\n- Prolongam ação do GLP-1 endógeno\n- Neutros em peso e CV\n- Bem tolerados"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Algoritmo Atual (SBD 2023)",
      "conteudo": "DM2 recém-diagnosticado:\n\n1. Se HbA1c < 7,5%:\n   Metformina + MEV\n\n2. Se HbA1c 7,5-9%:\n   Metformina + 2º agente\n\n3. Se HbA1c > 9% com sintomas:\n   Considerar insulina desde o início\n\n4. Se DCV estabelecida ou IC:\n   Priorizar iSGLT2 ou aGLP-1 (independente da HbA1c)\n\n5. Se DRC (TFG 25-60):\n   iSGLT2 com benefício comprovado (Dapa, Empa)"
    },
    {
      "titulo": "Insulinização",
      "conteudo": "Indicações:\n- HbA1c > 9% com sintomas\n- Falha de 3 antidiabéticos orais\n- Gestação\n- Intercorrências graves (IAM, AVC, cirurgias)\n\nEsquema Basal:\n- Iniciar NPH noturna 0,1-0,2 UI/kg ou Glargina\n- Ajustar 2-4 UI a cada 3 dias conforme glicemia de jejum\n\nEsquema Basal-Bolus:\n- Se pós-prandiais altas: adicionar insulina rápida"
    }
  ]}',
  ARRAY['HbA1c ≥ 6,5% ou GJ ≥ 126 = DM', 'Metformina é 1ª linha sempre', 'DCV ou IC: priorizar iSGLT2 ou aGLP-1', 'iSGLT2 tem benefício cardiorrenal'],
  ARRAY['126 = DM (1-2-6 = D-M-Dois)', 'SGLT2 = Sugar Goes Low To Two (urina)', 'GLP-1 = Glutida = Emagrece'],
  ARRAY['Metformina contraindicada se TFG < 30!', 'iSGLT2 pode causar cetoacidose euglicêmica', 'Não usar GLP-1 + iDPP4 (mesmo mecanismo)'],
  'Paciente de 52 anos, obeso, DM2 há 2 anos, HbA1c 8,2%, já em uso de Metformina 2g/dia. Teve IAM há 6 meses. Conduta: adicionar iSGLT2 (benefício CV) ou aGLP-1.',
  25, 3
) ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo;

-- TEORIA 4: Eletrocardiograma Normal
INSERT INTO teorias_MED (
  id, disciplina_id, assunto_id, subassunto_id,
  titulo, subtitulo,
  conteudo_basico, conteudo_avancado, conteudo_expert,
  pontos_chave, macetes, pegadinhas, correlacao_clinica,
  tempo_leitura_minutos, nivel_dificuldade
) VALUES (
  't1000000-0000-0000-0000-000000000004',
  'd1000000-0000-0000-0000-000000000006',
  'a2000000-0000-0000-0000-000000000001',
  's3000000-0000-0000-0000-000000000001',
  'Eletrocardiograma Normal - Interpretação Sistemática',
  'Ondas, intervalos, segmentos e análise sistemática do ECG',
  '{"secoes": [
    {
      "titulo": "Componentes do ECG",
      "conteudo": "Onda P: Despolarização atrial\n• Duração: < 120ms\n• Amplitude: < 2,5mm\n• Morfologia: positiva em DI, DII, aVF\n\nIntervalo PR: Condução AV\n• Normal: 120-200ms\n\nComplexo QRS: Despolarização ventricular\n• Duração: < 120ms\n• Ondas Q patológicas: > 40ms ou > 25% da onda R\n\nSegmento ST: Repolarização ventricular inicial\n• Deve ser isoelétrico\n\nOnda T: Repolarização ventricular\n• Positiva em DI, DII, V4-V6\n• Negativa em aVR\n\nIntervalo QT: Despolarização + Repolarização\n• QTc (corrigido): < 450ms"
    },
    {
      "titulo": "Análise Sistemática",
      "conteudo": "Roteiro de interpretação:\n\n1. Frequência cardíaca: 60-100 bpm (300/nº de quadrados grandes entre R-R)\n2. Ritmo: Sinusal se onda P+ em DII antes de cada QRS\n3. Eixo elétrico: Normal entre -30° e +90°\n4. Onda P: Morfologia e duração\n5. Intervalo PR: Bloqueios AV\n6. Complexo QRS: Largura, morfologia, ondas Q\n7. Segmento ST: Supra ou infradesnível\n8. Onda T: Inversões\n9. Intervalo QT: Prolongamento"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Determinação do Eixo",
      "conteudo": "Método rápido:\n\n1. Olhe DI e aVF:\n   • DI+ e aVF+ = Eixo normal (0 a +90°)\n   • DI+ e aVF- = Desvio à esquerda (-30 a -90°)\n   • DI- e aVF+ = Desvio à direita (+90 a +180°)\n\n2. Causas de desvio à esquerda:\n   - BDAS (Bloqueio Divisional Anterior Superior)\n   - HVE\n   - IAM inferior\n\n3. Causas de desvio à direita:\n   - BDPI\n   - HVD\n   - TEP\n   - DPOC"
    },
    {
      "titulo": "Derivações e Paredes",
      "conteudo": "Derivações frontais:\n• DI, aVL = Parede lateral alta\n• DII, DIII, aVF = Parede inferior\n• aVR = Cavidade\n\nDerivações precordiais:\n• V1-V2 = Septo\n• V3-V4 = Parede anterior\n• V5-V6 = Parede lateral baixa\n\nDerivações adicionais:\n• V3R-V4R = Ventrículo direito\n• V7-V9 = Parede posterior"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Variantes do Normal",
      "conteudo": "Achados que podem ser normais:\n\n1. Repolarização precoce:\n   - Supra de ST côncavo em V2-V4 em jovens\n   - Ponto J elevado\n\n2. Padrão juvenil de onda T:\n   - T negativas de V1-V3 em jovens\n\n3. Ondas Q septais:\n   - Q pequenas em DI, aVL, V5-V6 (< 40ms)\n\n4. Bradicardia sinusal:\n   - FC 50-60 em atletas\n\n5. Onda U:\n   - Pequena onda após T (repolarização de Purkinje)"
    },
    {
      "titulo": "Critérios de Sobrecargas",
      "conteudo": "Sobrecarga Atrial Esquerda:\n• P > 120ms (P mitrale)\n• Componente negativo em V1 > 1mm² (índice de Morris)\n\nSobrecarga Atrial Direita:\n• P > 2,5mm em DII (P pulmonale)\n\nHVE (critérios de voltagem):\n• Sokolow-Lyon: SV1 + RV5 ou RV6 > 35mm\n• Cornell: RaVL + SV3 > 28mm (H) ou > 20mm (M)\n\nHVD:\n• R > S em V1\n• Desvio do eixo à direita\n• Padrão de strain em V1-V3"
    }
  ]}',
  ARRAY['Ritmo sinusal = P+ em DII antes de QRS', 'PR normal: 120-200ms', 'QRS normal: < 120ms', 'DI+ aVF+ = eixo normal'],
  ARRAY['300-150-100-75-60-50 para FC', 'PR = Pequeno Retardo (120-200ms)', 'SokoLOV = S V1 + R V5/V6 > 35'],
  ARRAY['Supra de ST côncavo em jovens pode ser normal!', 'T negativa em V1-V3 pode ser padrão juvenil', 'Q em V1-V2 pode indicar IAM septal antigo'],
  'Paciente de 25 anos faz ECG de rotina. Mostra FC 58bpm, ritmo sinusal, eixo normal, supra de ST côncavo 1mm em V2-V3 com ondas T amplas. Interpretação: repolarização precoce (variante do normal).',
  20, 3
) ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo;

-- TEORIA 5: Infarto Agudo do Miocárdio
INSERT INTO teorias_MED (
  id, disciplina_id, assunto_id, subassunto_id,
  titulo, subtitulo,
  conteudo_basico, conteudo_avancado, conteudo_expert,
  pontos_chave, macetes, pegadinhas, correlacao_clinica,
  tempo_leitura_minutos, nivel_dificuldade
) VALUES (
  't1000000-0000-0000-0000-000000000005',
  'd1000000-0000-0000-0000-000000000006',
  'a2000000-0000-0000-0000-000000000004',
  NULL,
  'Infarto Agudo do Miocárdio - IAMCSST',
  'Diagnóstico, estratificação e tratamento do IAM com supra de ST',
  '{"secoes": [
    {
      "titulo": "Definição e Tipos",
      "conteudo": "O IAM é definido pela elevação de troponina + evidência de isquemia (sintomas, ECG ou imagem).\n\nTipos de IAM:\n• Tipo 1: Ruptura/erosão de placa aterosclerótica\n• Tipo 2: Desbalanço oferta/demanda (anemia, taquiarritmia)\n• Tipo 3: Morte súbita antes da coleta de troponina\n• Tipo 4: Relacionado à ICP\n• Tipo 5: Relacionado à cirurgia de RM\n\nSíndromes Coronarianas Agudas (SCA):\n• IAMCSST: Supra de ST no ECG\n• IAMSSST: Troponina elevada sem supra\n• Angina instável: Sintomas sem elevação de troponina"
    },
    {
      "titulo": "Critérios de Supra de ST",
      "conteudo": "Supra de ST significativo (ponto J):\n\n• ≥ 1mm em 2 derivações contíguas\n• Em V2-V3:\n  - ≥ 2mm em homens > 40 anos\n  - ≥ 2,5mm em homens < 40 anos\n  - ≥ 1,5mm em mulheres\n\nEquivalentes de IAMCSST:\n• Bloqueio de ramo esquerdo novo\n• Padrão de Wellens (T bifásica/invertida em V2-V3)\n• Supra em aVR com infra difuso"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Localização do IAM",
      "conteudo": "• Anterior: V1-V4 (DA)\n• Lateral: DI, aVL, V5-V6 (Cx ou DA)\n• Inferior: DII, DIII, aVF (CD ou Cx)\n• Posterior: Infra V1-V3 (imagem espelho), supra V7-V9\n• VD: Supra V1 e V4R (CD proximal)\n\nArtéria culpada:\n• DA: Anterior, anterosseptal\n• Cx: Lateral, posterolateral\n• CD: Inferior, VD, posterior (se dominante)"
    },
    {
      "titulo": "Tratamento Inicial",
      "conteudo": "MONABCH:\n• Morfina: Apenas se dor refratária (pode mascarar reinfarto)\n• Oxigênio: Apenas se SatO2 < 90%\n• Nitrato: SL ou IV (não se hipotensão, IAM de VD, uso de sildenafil)\n• AAS: 300mg VO macerado\n• Betabloqueador: Se estável, FC > 60, PAS > 100\n• Clopidogrel/Ticagrelor: Dose de ataque\n• Heparina: HNF ou Enoxaparina\n\nReperfusão:\n• ICP primária: Ideal em até 90min (tempo porta-balão)\n• Fibrinolítico: Se não houver ICP disponível em 120min"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Escolha do P2Y12",
      "conteudo": "Ticagrelor (preferencial se ICP):\n• Dose: 180mg ataque + 90mg 12/12h\n• Mais potente, início mais rápido\n• Reversível\n• Contraindicação: AVC hemorrágico prévio, uso de anticoagulante oral\n\nClopidogrel:\n• Dose ICP: 600mg ataque + 75mg/dia\n• Dose fibrinólise: 300mg ataque + 75mg/dia\n• Se > 75 anos com fibrinólise: sem ataque\n• Mais usado se necessidade de cirurgia precoce\n\nPrasugrel:\n• Dose: 60mg ataque + 10mg/dia\n• Contraindicado se AVC/AIT prévio ou > 75 anos ou < 60kg"
    },
    {
      "titulo": "Complicações Agudas",
      "conteudo": "• Choque cardiogênico: IAM extenso ou complicação mecânica\n• Arritmias: FV (primeiras horas), BAV (IAM inferior)\n• Complicações mecânicas:\n  - Rotura de parede livre (tamponamento)\n  - CIV (comunicação interventricular)\n  - Rotura de músculo papilar (insuficiência mitral aguda)\n• IAM de VD: Tríade (hipotensão + jugular ingurgitada + pulmão limpo)\n  - Tratamento: Expansão volêmica (não diurético!)"
    }
  ]}',
  ARRAY['Supra ≥ 1mm em 2 derivações contíguas = IAMCSST', 'ICP primária < 90min (porta-balão)', 'AAS 300mg para todos', 'IAM de VD: expandir volume, evitar nitrato'],
  ARRAY['MONABCH = tratamento inicial', 'DA = Descendente Anterior = Anterior', 'CD = Coronária Direita = Inferior + VD'],
  ARRAY['BRE novo pode ser IAMCSST!', 'Nitrato contraindicado no IAM de VD', 'Morfina não é rotina - pode mascarar dor'],
  'Homem de 62 anos com dor precordial típica há 2h. ECG: supra de 3mm em V1-V4. Conduta: AAS 300mg + Ticagrelor 180mg + Heparina + encaminhar para ICP primária (meta: porta-balão < 90min).',
  25, 4
) ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo;

-- TEORIA 6: Fibrilação Atrial
INSERT INTO teorias_MED (
  id, disciplina_id, assunto_id, subassunto_id,
  titulo, subtitulo,
  conteudo_basico, conteudo_avancado, conteudo_expert,
  pontos_chave, macetes, pegadinhas, correlacao_clinica,
  tempo_leitura_minutos, nivel_dificuldade
) VALUES (
  't1000000-0000-0000-0000-000000000006',
  'd1000000-0000-0000-0000-000000000006',
  'a2000000-0000-0000-0000-000000000002',
  's4000000-0000-0000-0000-000000000002',
  'Fibrilação Atrial - Manejo Completo',
  'Classificação, controle de FC/ritmo e anticoagulação',
  '{"secoes": [
    {
      "titulo": "Definição e ECG",
      "conteudo": "A FA é a arritmia sustentada mais comum. Caracteriza-se por atividade elétrica atrial desorganizada.\n\nECG:\n• Ausência de ondas P (substituídas por ondas f)\n• RR irregularmente irregular\n• Linha de base com ondulações finas\n• QRS geralmente estreito (largo se condução aberrante ou WPW)\n\nClassificação temporal:\n• Paroxística: Termina espontaneamente em < 7 dias\n• Persistente: Duração > 7 dias ou necessita cardioversão\n• Persistente de longa duração: > 12 meses\n• Permanente: Aceita (sem tentativa de reversão)"
    },
    {
      "titulo": "Etiologias",
      "conteudo": "Cardíacas:\n• HAS (mais comum)\n• Valvopatia mitral\n• IC\n• DAC\n• Cardiomiopatias\n\nNão cardíacas:\n• Hipertireoidismo\n• Apneia do sono\n• Álcool (holiday heart)\n• Pós-operatório\n• DPOC\n• TEP"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Controle de FC vs Ritmo",
      "conteudo": "Controle de FC (objetivo: FC < 110 em repouso):\n• BB: Metoprolol, Bisoprolol\n• BCC não-DHP: Diltiazem, Verapamil\n• Digoxina: Se IC ou idoso sedentário\n\nControle de Ritmo (cardioversão):\n• Elétrica: Sincronizada, 200J bifásico\n• Química: Amiodarona, Propafenona\n\nIndicações para controle de ritmo:\n• FA sintomática apesar do controle de FC\n• Dificuldade em controlar FC\n• Preferência do paciente\n• FA em paciente jovem"
    },
    {
      "titulo": "Anticoagulação - CHA2DS2-VASc",
      "conteudo": "Score CHA2DS2-VASc:\n• C: IC ou FEVE < 40% (1 ponto)\n• H: HAS (1 ponto)\n• A2: Idade ≥ 75 anos (2 pontos)\n• D: DM (1 ponto)\n• S2: AVC/AIT/tromboembolismo prévio (2 pontos)\n• V: Doença vascular (IAM, DAP, placa aórtica) (1 ponto)\n• A: Idade 65-74 anos (1 ponto)\n• Sc: Sexo feminino (1 ponto)\n\nIndicação de anticoagulação:\n• Homens ≥ 2 pontos: Anticoagular\n• Mulheres ≥ 3 pontos: Anticoagular\n• 1 ponto (exceto sexo feminino): Considerar"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "DOACs vs Varfarina",
      "conteudo": "DOACs (preferidos na FA não valvar):\n• Rivaroxabana: 20mg 1x/dia\n• Apixabana: 5mg 12/12h\n• Edoxabana: 60mg 1x/dia\n• Dabigatrana: 150mg 12/12h\n\nVantagens dos DOACs:\n• Não necessitam monitorização\n• Menos interações medicamentosas\n• Menor risco de sangramento intracraniano\n\nIndicações de Varfarina:\n• FA valvar (estenose mitral moderada/grave, prótese mecânica)\n• DRC com TFG < 15\n• SAF\n\nMeta de INR: 2-3"
    },
    {
      "titulo": "Cardioversão e ETE",
      "conteudo": "Antes da cardioversão:\n\nSe FA < 48h (ou anticoagulado ≥ 3 semanas):\n• Cardioverter direto\n• Anticoagular por 4 semanas após\n\nSe FA ≥ 48h ou duração desconhecida:\n• Opção 1: Anticoagular 3 semanas antes + 4 semanas após\n• Opção 2: ETE para excluir trombo → cardioverter → anticoagular 4 semanas\n\nAnticoagulação prolongada:\n• Manter indefinidamente se CHA2DS2-VASc indicar, mesmo que volte a ritmo sinusal"
    }
  ]}',
  ARRAY['FA = RR irregularmente irregular sem ondas P', 'CHA2DS2-VASc guia anticoagulação', 'DOACs preferidos na FA não valvar', 'FA < 48h pode cardioverter direto'],
  ARRAY['CHA2DS2-VASc = Chronic Heart failure, HAS, Age, DM, Stroke, Vascular, Age, Sex category', 'DOACs = Diretos (não precisam de INR)'],
  ARRAY['FA valvar = Varfarina, não DOAC', 'Sexo feminino só conta se outro fator de risco', 'BB + Verapamil/Diltiazem = bloqueio AV'],
  'Mulher de 72 anos com FA persistente, HAS e DM. CHA2DS2-VASc = 5 (HAS + DM + idade + sexo). Conduta: anticoagulação com DOAC (ex: Apixabana 5mg 12/12h) + controle de FC com BB ou BCC.',
  20, 4
) ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo;

-- TEORIA 7: Abdome Agudo
INSERT INTO teorias_MED (
  id, disciplina_id, assunto_id,
  titulo, subtitulo,
  conteudo_basico, conteudo_avancado, conteudo_expert,
  pontos_chave, macetes, pegadinhas, correlacao_clinica,
  tempo_leitura_minutos, nivel_dificuldade
) VALUES (
  't1000000-0000-0000-0000-000000000007',
  'd1000000-0000-0000-0000-000000000002',
  'a4000000-0000-0000-0000-000000000001',
  'Abdome Agudo - Classificação e Abordagem',
  'Síndromes de abdome agudo e indicações cirúrgicas',
  '{"secoes": [
    {
      "titulo": "Definição e Classificação",
      "conteudo": "Abdome agudo é uma síndrome caracterizada por dor abdominal intensa de início súbito que necessita de diagnóstico e tratamento rápidos.\n\nClassificação sindromática:\n\n1. Inflamatório: Apendicite, colecistite, diverticulite, pancreatite\n2. Obstrutivo: Bridas, hérnias encarceradas, tumores\n3. Perfurativo: Úlcera perfurada, diverticulite perfurada\n4. Vascular: Isquemia mesentérica, aneurisma roto\n5. Hemorrágico: Gravidez ectópica, rotura de aneurisma"
    },
    {
      "titulo": "Sinais de Alarme",
      "conteudo": "Indicadores de gravidade:\n• Defesa abdominal involuntária\n• Rigidez em tábua\n• Sinais de irritação peritoneal difusa\n• Instabilidade hemodinâmica\n• Distensão abdominal progressiva\n• Ausência de ruídos hidroaéreos"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Diagnóstico por Quadrante",
      "conteudo": "QSD (Quadrante Superior Direito):\n• Colecistite aguda (sinal de Murphy)\n• Colangite\n• Hepatite aguda\n• Úlcera duodenal perfurada\n\nQSE:\n• Pancreatite\n• Úlcera gástrica perfurada\n• Infarto esplênico\n\nQID (Quadrante Inferior Direito):\n• Apendicite (mais comum)\n• Diverticulite de Meckel\n• Doença inflamatória pélvica\n• Gravidez ectópica\n\nQIE:\n• Diverticulite\n• Doença inflamatória intestinal"
    },
    {
      "titulo": "Exames Complementares",
      "conteudo": "Laboratoriais:\n• Hemograma: Leucocitose com desvio\n• Amilase/Lipase: Pancreatite\n• Bilirrubinas e FA: Colestase\n• Lactato: Isquemia intestinal\n• Beta-HCG: Mulheres em idade fértil\n\nImagem:\n• RX de abdome: Perfuração (pneumoperitônio), obstrução (níveis)\n• USG: Colecistite, apendicite, ginecológicas\n• TC de abdome: Padrão-ouro para maioria das causas"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Indicações Cirúrgicas de Urgência",
      "conteudo": "Cirurgia imediata:\n• Perfuração de víscera oca (pneumoperitônio)\n• Peritonite difusa\n• Isquemia mesentérica\n• Aneurisma de aorta abdominal roto\n• Obstrução intestinal com sinais de estrangulamento\n\nSinais de estrangulamento intestinal:\n• Dor contínua (não em cólica)\n• Febre\n• Taquicardia\n• Leucocitose\n• Acidose metabólica\n• Alça fixa ao RX"
    },
    {
      "titulo": "Apendicite Aguda",
      "conteudo": "Fisiopatologia: Obstrução do lúmen → distensão → isquemia → perfuração\n\nQuadro clínico (sequência de Murphy):\n1. Dor periumbilical vaga\n2. Náuseas e anorexia\n3. Dor migra para FID\n4. Febre baixa\n\nSinais semiológicos:\n• McBurney: Dor à palpação do ponto\n• Blumberg: Dor à descompressão brusca\n• Rovsing: Dor em FID ao palpar FIE\n• Psoas: Dor à extensão da coxa (apêndice retrocecal)\n• Obturador: Dor à rotação interna da coxa\n\nScore de Alvarado (≥ 7 = cirurgia):\n• Dor migratória (1)\n• Anorexia (1)\n• Náuseas/vômitos (1)\n• Dor em FID (2)\n• Blumberg (1)\n• Febre (1)\n• Leucocitose (2)\n• Desvio à esquerda (1)"
    }
  ]}',
  ARRAY['Abdome em tábua = peritonite = cirurgia', 'Pneumoperitônio = perfuração = cirurgia', 'Apendicite: dor migra de periumbilical para FID', 'Alvarado ≥ 7 indica cirurgia'],
  ARRAY['Murphy = colecistite, McBurney = apendicite', 'Sequência de Murphy: Dor → Náusea → Migração → Febre', 'MANTRELS = Alvarado (Migration, Anorexia, Nausea, Tenderness RLQ, Rebound, Elevation temp, Leukocytosis, Shift)'],
  ARRAY['Idoso pode ter apendicite sem febre!', 'Gestante: apêndice desloca cranialmente', 'Obstrução com dor contínua = estrangulamento'],
  'Homem de 28 anos com dor periumbilical há 12h, agora localizada em FID, febre 38°C, anorexia. Leucócitos 14.000. Alvarado = 8. Conduta: apendicectomia (via laparoscópica preferencial).',
  20, 3
) ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo;

-- TEORIA 8: Pré-Natal
INSERT INTO teorias_MED (
  id, disciplina_id, assunto_id,
  titulo, subtitulo,
  conteudo_basico, conteudo_avancado, conteudo_expert,
  pontos_chave, macetes, pegadinhas, correlacao_clinica,
  tempo_leitura_minutos, nivel_dificuldade
) VALUES (
  't1000000-0000-0000-0000-000000000008',
  'd1000000-0000-0000-0000-000000000004',
  'a5000000-0000-0000-0000-000000000001',
  'Pré-Natal - Rotina de Consultas e Exames',
  'Calendário de consultas, exames obrigatórios e suplementação',
  '{"secoes": [
    {
      "titulo": "Calendário de Consultas",
      "conteudo": "Número mínimo de consultas (MS): 6\n\nFrequência recomendada:\n• Até 28 semanas: Mensal\n• 28-36 semanas: Quinzenal\n• 36-41 semanas: Semanal\n\nPrimeira consulta:\n• Idealmente até 12 semanas\n• Anamnese completa\n• Cálculo da idade gestacional\n• Exame físico completo\n• Solicitação de exames de rotina"
    },
    {
      "titulo": "Exames do 1º Trimestre",
      "conteudo": "Exames obrigatórios:\n• Hemograma\n• Tipagem sanguínea e fator Rh\n• Coombs indireto (se Rh negativo)\n• Glicemia de jejum\n• EAS e urocultura\n• Sorologias: HIV, Sífilis (VDRL), Hepatite B (HBsAg), Toxoplasmose\n• Citopatológico de colo se > 1 ano sem\n\nUSG:\n• 11-14 semanas: Datação, translucência nucal, malformações grosseiras"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Exames do 2º e 3º Trimestres",
      "conteudo": "24-28 semanas:\n• TOTG 75g (rastreio de DMG)\n  - Jejum ≥ 92: DMG\n  - 1h ≥ 180: DMG\n  - 2h ≥ 153: DMG\n• Hemograma (rastreio anemia)\n• Coombs indireto (se Rh-)\n\n3º trimestre (após 28 semanas):\n• Repetir sorologias: HIV, VDRL, Hepatite B\n• Cultura de estreptococo do grupo B (35-37 semanas)\n• EAS e urocultura\n\nUSG morfológico:\n• 20-24 semanas: Avaliação detalhada da anatomia fetal"
    },
    {
      "titulo": "Suplementação",
      "conteudo": "Ácido Fólico:\n• 0,4mg/dia (começar antes da gestação se possível)\n• 4-5mg/dia se: DM, epilepsia em uso de anticonvulsivante, história de DTN\n• Período crítico: Pré-concepção até 12 semanas\n\nSulfato Ferroso:\n• 40mg de ferro elementar/dia a partir de 20 semanas\n• Se anemia: dose de tratamento (120-240mg/dia)\n\nPolivitamínico:\n• Não é obrigatório, mas geralmente prescrito"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Estratificação de Risco",
      "conteudo": "Alto risco (encaminhar pré-natal especializado):\n• HAS crônica ou pré-eclâmpsia prévia\n• DM prévio ou DMG atual\n• Doença cardíaca, renal, autoimune\n• HIV positivo\n• Isoimunização Rh\n• Gemelaridade\n• Malformação fetal\n• Obesidade mórbida (IMC > 40)\n• Idade materna > 35 anos (rastreio cromossomopatias)"
    },
    {
      "titulo": "Vacinação na Gestação",
      "conteudo": "Recomendadas:\n• dTpa: 20-36 semanas (idealmente 27-32)\n  - Protege RN contra coqueluche\n• Influenza: Qualquer trimestre\n• Hepatite B: Completar esquema se incompleto\n• COVID-19: Recomendada\n\nContraindicadas:\n• Vacinas de vírus vivo: Tríplice viral (SCR), Varicela, Febre amarela\n• Exceção: Febre amarela em áreas de risco (avaliar risco-benefício)"
    }
  ]}',
  ARRAY['Mínimo 6 consultas de pré-natal', 'TOTG 75g entre 24-28 semanas', 'Ácido fólico: iniciar antes da gestação', 'Cultura de GBS: 35-37 semanas'],
  ARRAY['VDRL = Venereal Disease Research Lab = Sífilis', 'DMG = Diabetes Mellitus Gestacional (TOTG 75g)', 'dTpa na Gestação = 27-32 semanas'],
  ARRAY['Glicemia de jejum ≥ 126 = DM prévio, não DMG', 'Rh negativo com Coombs positivo = já sensibilizada', 'Febre amarela: evitar, mas avaliar em área endêmica'],
  'Gestante de 24 semanas em pré-natal de rotina. Exames: TOTG 75g com glicemia jejum 95mg/dL, 1h 188mg/dL, 2h 160mg/dL. Diagnóstico: DMG (1h ≥ 180 e 2h ≥ 153). Conduta: dieta, atividade física, monitorização glicêmica.',
  15, 2
) ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo;

-- TEORIA 9: AVC Isquêmico
INSERT INTO teorias_MED (
  id, disciplina_id, assunto_id,
  titulo, subtitulo,
  conteudo_basico, conteudo_avancado, conteudo_expert,
  pontos_chave, macetes, pegadinhas, correlacao_clinica,
  tempo_leitura_minutos, nivel_dificuldade
) VALUES (
  't1000000-0000-0000-0000-000000000009',
  'd1000000-0000-0000-0000-000000000011',
  'a7000000-0000-0000-0000-000000000001',
  'AVC Isquêmico - Diagnóstico e Tratamento Agudo',
  'Janela terapêutica, trombólise e trombectomia mecânica',
  '{"secoes": [
    {
      "titulo": "Definição e Epidemiologia",
      "conteudo": "O AVC isquêmico corresponde a ~85% dos AVCs. Ocorre por oclusão arterial (trombose ou embolia) com isquemia do território cerebral afetado.\n\nFatores de risco:\n• HAS (principal)\n• FA (principal causa de AVC cardioembólico)\n• DM\n• Dislipidemia\n• Tabagismo\n• Estenose carotídea"
    },
    {
      "titulo": "Quadro Clínico - Territórios",
      "conteudo": "Artéria Cerebral Média (ACM) - mais comum:\n• Hemiparesia contralateral (predomínio braquiofacial)\n• Hemianestesia\n• Afasia (se hemisfério dominante)\n• Negligência (se hemisfério não dominante)\n\nArtéria Cerebral Anterior (ACA):\n• Hemiparesia contralateral (predomínio crural)\n• Alterações comportamentais\n\nArtéria Cerebral Posterior (ACP):\n• Hemianopsia homônima\n• Alexia sem agrafia (se dominante)\n\nCirculação Posterior (vertebrobasilar):\n• Ataxia, vertigem, disartria, disfagia\n• Síndromes alternadas (cruzadas)"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Trombólise Intravenosa",
      "conteudo": "Alteplase (rt-PA) IV:\n• Janela: Até 4,5 horas do início dos sintomas\n• Dose: 0,9mg/kg (máx 90mg)\n  - 10% em bolus\n  - 90% em 60min\n\nCritérios de inclusão:\n• Déficit neurológico mensurável\n• TC de crânio sem hemorragia\n• Tempo < 4,5h (ou < 4,5h do wake-up se mismatch na imagem)\n\nContraindicações absolutas:\n• Hemorragia intracraniana prévia\n• Neoplasia intracraniana\n• AVC ou TCE grave nos últimos 3 meses\n• Cirurgia intracraniana/espinhal recente\n• Sangramento ativo\n• PA > 185/110 (não controlada)\n• Uso de anticoagulantes (INR > 1,7, TTPA > 40s)"
    },
    {
      "titulo": "Trombectomia Mecânica",
      "conteudo": "Indicações:\n• Oclusão de grande vaso (ACI ou M1 da ACM)\n• NIHSS ≥ 6\n• ASPECTS ≥ 6 (área de isquemia pequena na TC)\n• Janela até 24h (se core isquêmico pequeno na perfusão)\n\nJanela tradicional: Até 6h\nJanela estendida: Até 24h com seleção por imagem (mismatch perfusão)\n\nPode ser feita após trombólise IV (bridging) ou isoladamente."
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Escala NIHSS",
      "conteudo": "National Institutes of Health Stroke Scale:\n• 0 = sem déficit\n• 1-4 = AVC leve\n• 5-15 = AVC moderado\n• 16-20 = AVC moderado a grave\n• > 20 = AVC grave\n\nItens avaliados (11 itens, 0-42 pontos):\n• Nível de consciência (0-3)\n• Olhar conjugado (0-2)\n• Campo visual (0-3)\n• Paresia facial (0-3)\n• Força MS e MI (0-4 cada)\n• Ataxia (0-2)\n• Sensibilidade (0-2)\n• Linguagem (0-3)\n• Disartria (0-2)\n• Extinção/negligência (0-2)"
    },
    {
      "titulo": "Prevenção Secundária",
      "conteudo": "Anti-agregação:\n• AVC aterotrombótico ou lacunar: AAS 100-300mg + Estatina\n• Dupla antiagregação (AAS + Clopidogrel): Primeiros 21 dias se NIHSS ≤ 3\n\nAnticoagulação:\n• AVC cardioembólico (FA): Anticoagulação após 1-2 semanas\n• Quanto maior o AVC, maior o intervalo antes de anticoagular\n\nEstatinas:\n• Alvo LDL < 70mg/dL\n• Atorvastatina 40-80mg\n\nControle de PA:\n• Não reduzir na fase aguda (exceto se trombólise)\n• Após fase aguda: Alvo < 130/80"
    }
  ]}',
  ARRAY['Trombólise IV: até 4,5h', 'Trombectomia: até 24h com imagem', 'ACM: hemiparesia braquiofacial', 'FA é principal causa cardioembólica'],
  ARRAY['FAST = Face, Arm, Speech, Time', 'ACM = Artéria do Cara com Meia boca', 'NIHSS > 20 = grave'],
  ARRAY['Não reduzir PA na fase aguda (exceto trombólise)', 'AVC de wake-up pode ter trombólise com mismatch', 'Anticoagulação imediata na FA aumenta transformação hemorrágica'],
  'Mulher de 68 anos com FA conhecida, encontrada com hemiparesia direita e afasia há 2h. TC crânio: sem sangramento. NIHSS = 14. PA 170/95. Conduta: Trombólise IV (após PA < 185/110) + considerar trombectomia se oclusão de grande vaso.',
  25, 4
) ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo;

-- TEORIA 10: HIV/AIDS
INSERT INTO teorias_MED (
  id, disciplina_id, assunto_id,
  titulo, subtitulo,
  conteudo_basico, conteudo_avancado, conteudo_expert,
  pontos_chave, macetes, pegadinhas, correlacao_clinica,
  tempo_leitura_minutos, nivel_dificuldade
) VALUES (
  't1000000-0000-0000-0000-000000000010',
  'd1000000-0000-0000-0000-000000000012',
  'a6000000-0000-0000-0000-000000000001',
  'HIV/AIDS - Diagnóstico, Estadiamento e TARV',
  'Testes diagnósticos, contagem de CD4 e esquemas antirretrovirais',
  '{"secoes": [
    {
      "titulo": "Diagnóstico",
      "conteudo": "Fluxograma diagnóstico (MS 2024):\n\n1. Teste rápido (TR1) positivo:\n   → Realizar segundo teste (TR2 de fabricante diferente)\n   → Se TR2 positivo: HIV confirmado\n   → Se TR2 negativo: coletar amostra para laboratório\n\n2. Imunoensaio (ELISA) positivo:\n   → Realizar teste molecular (carga viral)\n   → Se CV detectável: HIV confirmado\n   → Se CV indetectável: Western Blot\n\nJanela imunológica:\n• Teste rápido: ~30 dias\n• ELISA 4ª geração: ~15-20 dias\n• Carga viral: ~10 dias"
    },
    {
      "titulo": "Estadiamento - Definição de AIDS",
      "conteudo": "AIDS é definida por:\n\n1. CD4 < 200 células/mm³ OU\n\n2. Doenças definidoras de AIDS:\n• Candidíase esofágica, traqueal ou pulmonar\n• Criptococose extrapulmonar\n• Neurotoxoplasmose\n• Pneumocistose (PCP)\n• Citomegalovirose (retinite ou outros órgãos)\n• Tuberculose disseminada ou extrapulmonar\n• MAC disseminada\n• Sarcoma de Kaposi\n• Linfoma não-Hodgkin\n• Leucoencefalopatia multifocal progressiva (LEMP)\n• Câncer cervical invasivo"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "TARV - Esquema Inicial",
      "conteudo": "Esquema preferencial (Brasil 2024):\nTLD = Tenofovir + Lamivudina + Dolutegravir\n(TDF/3TC/DTG) - 1 comprimido 1x/dia\n\nAlternativas:\n• Se TB: TDF/3TC + Efavirenz 600mg (interação com DTG)\n  Ou: TDF/3TC + DTG 50mg 12/12h\n• Se gestante: TDF/3TC/DTG (seguro em qualquer trimestre)\n• Se DRC (TFG < 30): TAF ou Abacavir no lugar de TDF\n\nClasses dos ARV:\n• ITRN: Tenofovir (TDF), Lamivudina (3TC), Abacavir (ABC)\n• ITRNN: Efavirenz (EFV)\n• INI: Dolutegravir (DTG), Raltegravir (RAL)\n• IP: Atazanavir/r, Darunavir/r"
    },
    {
      "titulo": "Quando Iniciar TARV",
      "conteudo": "Recomendação atual: TARV para TODOS com HIV, independente do CD4.\n\nPrioridades (iniciar imediatamente):\n• Sintomáticos\n• CD4 < 350\n• Gestantes\n• TB ativa\n• Hepatite B ou C\n• Risco CV elevado\n• Parceiro sorodiscordante\n\nI=I (Indetectável = Intransmissível):\n• CV indetectável por ≥ 6 meses = não transmite o vírus"
    }
  ]}',
  '{"secoes": [
    {
      "titulo": "Profilaxias de Infecções Oportunistas",
      "conteudo": "Pneumocistose (PCP):\n• Indicação: CD4 < 200 ou candidíase oral ou febre > 2 semanas\n• Droga: Sulfametoxazol/Trimetoprima (SMX/TMP) 800/160mg 1x/dia\n• Suspender: CD4 > 200 por 3 meses\n\nToxoplasmose:\n• Indicação: CD4 < 100 + IgG positivo\n• Droga: SMX/TMP 800/160mg 1x/dia (mesma dose da PCP)\n\nMAC:\n• Indicação: CD4 < 50\n• Droga: Azitromicina 1200mg/semana\n\nTuberculose (ILTB):\n• Indicação: PPD ≥ 5mm ou IGRA+ ou contato de TB\n• Droga: Isoniazida 270mg + Rifapentina 900mg - 12 doses semanais (3HP)"
    },
    {
      "titulo": "Síndrome de Reconstituição Imune (SRI)",
      "conteudo": "Definição: Piora clínica paradoxal após início da TARV, por resposta imune a patógeno latente.\n\nQuando suspeitar:\n• Início de TARV com CD4 muito baixo\n• Piora 2-8 semanas após TARV\n• Melhora de CV e aumento de CD4\n\nExemplos:\n• TB: Linfonodomegalia, febre, piora radiológica\n• Criptococose: Meningite\n• CMV: Uveíte\n\nConduta:\n• Manter TARV\n• Tratar infecção oportunista\n• Corticoide se grave"
    }
  ]}',
  ARRAY['TLD é esquema preferencial (TDF/3TC/DTG)', 'CD4 < 200 = AIDS', 'Profilaxia PCP: SMX/TMP se CD4 < 200', 'I=I: Indetectável = Intransmissível'],
  ARRAY['TLD = Tenofovir, Lamivudina, Dolutegravir', 'PCP = Pneumocistose = CD4 < 200 = SMX/TMP', 'MAC = Mycobacterium Avium Complex = CD4 < 50'],
  ARRAY['TB + HIV: iniciar TARV 2-8 semanas após TB', 'Criptococose: TARV só após 4-6 semanas', 'Efavirenz interage com DTG'],
  'Homem de 35 anos, HIV+ recém-diagnosticado, assintomático, CD4 = 180, CV = 85.000. Conduta: Iniciar TLD + profilaxia com SMX/TMP para PCP (CD4 < 200). Retorno em 4 semanas para avaliar adesão e toxicidade.',
  25, 4
) ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo;

-- Verificar número de registros inseridos
DO $$
BEGIN
  RAISE NOTICE 'Disciplinas inseridas: %', (SELECT COUNT(*) FROM disciplinas_MED);
  RAISE NOTICE 'Assuntos inseridos: %', (SELECT COUNT(*) FROM assuntos_MED);
  RAISE NOTICE 'Subassuntos inseridos: %', (SELECT COUNT(*) FROM subassuntos_MED);
  RAISE NOTICE 'Teorias inseridas: %', (SELECT COUNT(*) FROM teorias_MED);
END $$;
