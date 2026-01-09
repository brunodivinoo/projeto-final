-- =============================================
-- PREPARAMED - Dados Iniciais
-- Disciplinas e Assuntos de Medicina
-- =============================================

-- DISCIPLINAS MÉDICAS
INSERT INTO disciplinas_MED (nome, nome_normalizado, icone, cor, ordem) VALUES
('Anatomia', 'anatomia', 'skeleton', '#EF4444', 1),
('Fisiologia', 'fisiologia', 'heart_pulse', '#F97316', 2),
('Histologia', 'histologia', 'microscope', '#F59E0B', 3),
('Embriologia', 'embriologia', 'baby', '#EAB308', 4),
('Bioquímica', 'bioquimica', 'flask', '#84CC16', 5),
('Farmacologia', 'farmacologia', 'pill', '#22C55E', 6),
('Patologia', 'patologia', 'virus', '#10B981', 7),
('Microbiologia', 'microbiologia', 'bacteria', '#14B8A6', 8),
('Imunologia', 'imunologia', 'shield', '#06B6D4', 9),
('Parasitologia', 'parasitologia', 'bug', '#0EA5E9', 10),
('Semiologia', 'semiologia', 'stethoscope', '#3B82F6', 11),
('Clínica Médica', 'clinica_medica', 'hospital', '#6366F1', 12),
('Cirurgia', 'cirurgia', 'scalpel', '#8B5CF6', 13),
('Pediatria', 'pediatria', 'child', '#A855F7', 14),
('Ginecologia e Obstetrícia', 'ginecologia_obstetricia', 'pregnant', '#D946EF', 15),
('Psiquiatria', 'psiquiatria', 'brain', '#EC4899', 16),
('Medicina Preventiva', 'medicina_preventiva', 'shield_check', '#F43F5E', 17),
('Ética Médica', 'etica_medica', 'gavel', '#64748B', 18),
('Ortopedia', 'ortopedia', 'bone', '#78716C', 19),
('Oftalmologia', 'oftalmologia', 'eye', '#0D9488', 20),
('Otorrinolaringologia', 'otorrinolaringologia', 'ear', '#059669', 21),
('Dermatologia', 'dermatologia', 'skin', '#D97706', 22),
('Neurologia', 'neurologia', 'brain', '#7C3AED', 23),
('Cardiologia', 'cardiologia', 'heart', '#DC2626', 24),
('Pneumologia', 'pneumologia', 'lungs', '#2563EB', 25),
('Gastroenterologia', 'gastroenterologia', 'stomach', '#CA8A04', 26),
('Nefrologia', 'nefrologia', 'kidney', '#9333EA', 27),
('Endocrinologia', 'endocrinologia', 'thyroid', '#C026D3', 28),
('Hematologia', 'hematologia', 'blood', '#BE123C', 29),
('Infectologia', 'infectologia', 'virus', '#15803D', 30),
('Reumatologia', 'reumatologia', 'joint', '#1D4ED8', 31),
('Geriatria', 'geriatria', 'elderly', '#6B7280', 32),
('Medicina de Emergência', 'medicina_emergencia', 'ambulance', '#B91C1C', 33),
('Medicina Intensiva', 'medicina_intensiva', 'monitor', '#991B1B', 34),
('Radiologia', 'radiologia', 'xray', '#374151', 35),
('Medicina Legal', 'medicina_legal', 'scale', '#1F2937', 36)
ON CONFLICT DO NOTHING;

-- ASSUNTOS DE ANATOMIA
WITH anatomia AS (SELECT id FROM disciplinas_MED WHERE nome_normalizado = 'anatomia')
INSERT INTO assuntos_MED (disciplina_id, nome, nome_normalizado, ordem) VALUES
((SELECT id FROM anatomia), 'Sistema Esquelético', 'sistema_esqueletico', 1),
((SELECT id FROM anatomia), 'Sistema Muscular', 'sistema_muscular', 2),
((SELECT id FROM anatomia), 'Sistema Cardiovascular', 'sistema_cardiovascular', 3),
((SELECT id FROM anatomia), 'Sistema Respiratório', 'sistema_respiratorio', 4),
((SELECT id FROM anatomia), 'Sistema Digestório', 'sistema_digestorio', 5),
((SELECT id FROM anatomia), 'Sistema Nervoso', 'sistema_nervoso', 6),
((SELECT id FROM anatomia), 'Sistema Urinário', 'sistema_urinario', 7),
((SELECT id FROM anatomia), 'Sistema Reprodutor', 'sistema_reprodutor', 8),
((SELECT id FROM anatomia), 'Sistema Endócrino', 'sistema_endocrino', 9),
((SELECT id FROM anatomia), 'Sistema Linfático', 'sistema_linfatico', 10),
((SELECT id FROM anatomia), 'Sistema Tegumentar', 'sistema_tegumentar', 11),
((SELECT id FROM anatomia), 'Anatomia de Cabeça e Pescoço', 'cabeca_pescoco', 12),
((SELECT id FROM anatomia), 'Anatomia do Tórax', 'torax', 13),
((SELECT id FROM anatomia), 'Anatomia do Abdome', 'abdome', 14),
((SELECT id FROM anatomia), 'Anatomia da Pelve', 'pelve', 15),
((SELECT id FROM anatomia), 'Anatomia dos Membros Superiores', 'membros_superiores', 16),
((SELECT id FROM anatomia), 'Anatomia dos Membros Inferiores', 'membros_inferiores', 17)
ON CONFLICT DO NOTHING;

-- ASSUNTOS DE FISIOLOGIA
WITH fisiologia AS (SELECT id FROM disciplinas_MED WHERE nome_normalizado = 'fisiologia')
INSERT INTO assuntos_MED (disciplina_id, nome, nome_normalizado, ordem) VALUES
((SELECT id FROM fisiologia), 'Fisiologia Celular', 'fisiologia_celular', 1),
((SELECT id FROM fisiologia), 'Fisiologia Cardiovascular', 'fisiologia_cardiovascular', 2),
((SELECT id FROM fisiologia), 'Fisiologia Respiratória', 'fisiologia_respiratoria', 3),
((SELECT id FROM fisiologia), 'Fisiologia Renal', 'fisiologia_renal', 4),
((SELECT id FROM fisiologia), 'Fisiologia Gastrointestinal', 'fisiologia_gastrointestinal', 5),
((SELECT id FROM fisiologia), 'Fisiologia Endócrina', 'fisiologia_endocrina', 6),
((SELECT id FROM fisiologia), 'Neurofisiologia', 'neurofisiologia', 7),
((SELECT id FROM fisiologia), 'Fisiologia Muscular', 'fisiologia_muscular', 8),
((SELECT id FROM fisiologia), 'Fisiologia do Exercício', 'fisiologia_exercicio', 9),
((SELECT id FROM fisiologia), 'Equilíbrio Ácido-Base', 'equilibrio_acido_base', 10),
((SELECT id FROM fisiologia), 'Termorregulação', 'termorregulacao', 11)
ON CONFLICT DO NOTHING;

-- ASSUNTOS DE FARMACOLOGIA
WITH farmacologia AS (SELECT id FROM disciplinas_MED WHERE nome_normalizado = 'farmacologia')
INSERT INTO assuntos_MED (disciplina_id, nome, nome_normalizado, ordem) VALUES
((SELECT id FROM farmacologia), 'Farmacocinética', 'farmacocinetica', 1),
((SELECT id FROM farmacologia), 'Farmacodinâmica', 'farmacodinamica', 2),
((SELECT id FROM farmacologia), 'Sistema Nervoso Autônomo', 'sna', 3),
((SELECT id FROM farmacologia), 'Analgésicos e Anti-inflamatórios', 'analgesicos', 4),
((SELECT id FROM farmacologia), 'Antimicrobianos', 'antimicrobianos', 5),
((SELECT id FROM farmacologia), 'Fármacos Cardiovasculares', 'farmacos_cardiovasculares', 6),
((SELECT id FROM farmacologia), 'Fármacos do SNC', 'farmacos_snc', 7),
((SELECT id FROM farmacologia), 'Fármacos Endócrinos', 'farmacos_endocrinos', 8),
((SELECT id FROM farmacologia), 'Quimioterápicos', 'quimioterapicos', 9),
((SELECT id FROM farmacologia), 'Imunossupressores', 'imunossupressores', 10),
((SELECT id FROM farmacologia), 'Fármacos Gastrointestinais', 'farmacos_gi', 11),
((SELECT id FROM farmacologia), 'Fármacos Respiratórios', 'farmacos_respiratorios', 12)
ON CONFLICT DO NOTHING;

-- ASSUNTOS DE CLÍNICA MÉDICA
WITH clinica AS (SELECT id FROM disciplinas_MED WHERE nome_normalizado = 'clinica_medica')
INSERT INTO assuntos_MED (disciplina_id, nome, nome_normalizado, ordem) VALUES
((SELECT id FROM clinica), 'Hipertensão Arterial', 'hipertensao', 1),
((SELECT id FROM clinica), 'Diabetes Mellitus', 'diabetes', 2),
((SELECT id FROM clinica), 'Dislipidemia', 'dislipidemia', 3),
((SELECT id FROM clinica), 'Insuficiência Cardíaca', 'insuficiencia_cardiaca', 4),
((SELECT id FROM clinica), 'Doença Arterial Coronariana', 'dac', 5),
((SELECT id FROM clinica), 'Arritmias', 'arritmias', 6),
((SELECT id FROM clinica), 'DPOC', 'dpoc', 7),
((SELECT id FROM clinica), 'Asma', 'asma', 8),
((SELECT id FROM clinica), 'Pneumonias', 'pneumonias', 9),
((SELECT id FROM clinica), 'Infecção do Trato Urinário', 'itu', 10),
((SELECT id FROM clinica), 'Doença Renal Crônica', 'drc', 11),
((SELECT id FROM clinica), 'Injúria Renal Aguda', 'ira', 12),
((SELECT id FROM clinica), 'Cirrose e Hepatopatias', 'hepatopatias', 13),
((SELECT id FROM clinica), 'Distúrbios da Tireoide', 'tireoide', 14),
((SELECT id FROM clinica), 'Anemias', 'anemias', 15),
((SELECT id FROM clinica), 'Distúrbios Hidroeletrolíticos', 'hidroeletroliticos', 16),
((SELECT id FROM clinica), 'Sepse', 'sepse', 17),
((SELECT id FROM clinica), 'Doenças Reumatológicas', 'reumatologicas', 18)
ON CONFLICT DO NOTHING;

-- ASSUNTOS DE CIRURGIA
WITH cirurgia AS (SELECT id FROM disciplinas_MED WHERE nome_normalizado = 'cirurgia')
INSERT INTO assuntos_MED (disciplina_id, nome, nome_normalizado, ordem) VALUES
((SELECT id FROM cirurgia), 'Pré e Pós-Operatório', 'pre_pos_operatorio', 1),
((SELECT id FROM cirurgia), 'Trauma', 'trauma', 2),
((SELECT id FROM cirurgia), 'Abdome Agudo', 'abdome_agudo', 3),
((SELECT id FROM cirurgia), 'Hérnias', 'hernias', 4),
((SELECT id FROM cirurgia), 'Cirurgia do Aparelho Digestivo', 'cirurgia_digestivo', 5),
((SELECT id FROM cirurgia), 'Cirurgia Vascular', 'cirurgia_vascular', 6),
((SELECT id FROM cirurgia), 'Cirurgia Torácica', 'cirurgia_toracica', 7),
((SELECT id FROM cirurgia), 'Cirurgia de Cabeça e Pescoço', 'cirurgia_cabeca_pescoco', 8),
((SELECT id FROM cirurgia), 'Cirurgia Plástica', 'cirurgia_plastica', 9),
((SELECT id FROM cirurgia), 'Cicatrização e Feridas', 'cicatrizacao', 10),
((SELECT id FROM cirurgia), 'Queimaduras', 'queimaduras', 11),
((SELECT id FROM cirurgia), 'Choque', 'choque', 12)
ON CONFLICT DO NOTHING;

-- ASSUNTOS DE PEDIATRIA
WITH pediatria AS (SELECT id FROM disciplinas_MED WHERE nome_normalizado = 'pediatria')
INSERT INTO assuntos_MED (disciplina_id, nome, nome_normalizado, ordem) VALUES
((SELECT id FROM pediatria), 'Neonatologia', 'neonatologia', 1),
((SELECT id FROM pediatria), 'Crescimento e Desenvolvimento', 'crescimento_desenvolvimento', 2),
((SELECT id FROM pediatria), 'Aleitamento Materno', 'aleitamento', 3),
((SELECT id FROM pediatria), 'Imunizações', 'imunizacoes', 4),
((SELECT id FROM pediatria), 'Infecções Respiratórias', 'infeccoes_respiratorias_ped', 5),
((SELECT id FROM pediatria), 'Doenças Exantemáticas', 'exantematicas', 6),
((SELECT id FROM pediatria), 'Diarreia Aguda', 'diarreia_aguda', 7),
((SELECT id FROM pediatria), 'Desnutrição', 'desnutricao', 8),
((SELECT id FROM pediatria), 'Parasitoses', 'parasitoses_ped', 9),
((SELECT id FROM pediatria), 'Cardiopatias Congênitas', 'cardiopatias_congenitas', 10),
((SELECT id FROM pediatria), 'Emergências Pediátricas', 'emergencias_pediatricas', 11)
ON CONFLICT DO NOTHING;

-- ASSUNTOS DE GINECOLOGIA E OBSTETRÍCIA
WITH go AS (SELECT id FROM disciplinas_MED WHERE nome_normalizado = 'ginecologia_obstetricia')
INSERT INTO assuntos_MED (disciplina_id, nome, nome_normalizado, ordem) VALUES
((SELECT id FROM go), 'Ciclo Menstrual', 'ciclo_menstrual', 1),
((SELECT id FROM go), 'Pré-Natal', 'pre_natal', 2),
((SELECT id FROM go), 'Parto', 'parto', 3),
((SELECT id FROM go), 'Puerpério', 'puerperio', 4),
((SELECT id FROM go), 'Síndromes Hipertensivas na Gestação', 'sindromes_hipertensivas', 5),
((SELECT id FROM go), 'Diabetes Gestacional', 'diabetes_gestacional', 6),
((SELECT id FROM go), 'Sangramento na Gestação', 'sangramento_gestacao', 7),
((SELECT id FROM go), 'Infecções na Gestação', 'infeccoes_gestacao', 8),
((SELECT id FROM go), 'Climatério e Menopausa', 'climaterio', 9),
((SELECT id FROM go), 'Planejamento Familiar', 'planejamento_familiar', 10),
((SELECT id FROM go), 'Doenças Benignas da Mama', 'doencas_mama', 11),
((SELECT id FROM go), 'Câncer de Colo de Útero', 'cancer_colo', 12),
((SELECT id FROM go), 'Câncer de Mama', 'cancer_mama', 13),
((SELECT id FROM go), 'Infecções Ginecológicas', 'infeccoes_gineco', 14)
ON CONFLICT DO NOTHING;

-- ASSUNTOS DE PSIQUIATRIA
WITH psiquiatria AS (SELECT id FROM disciplinas_MED WHERE nome_normalizado = 'psiquiatria')
INSERT INTO assuntos_MED (disciplina_id, nome, nome_normalizado, ordem) VALUES
((SELECT id FROM psiquiatria), 'Transtornos de Ansiedade', 'transtornos_ansiedade', 1),
((SELECT id FROM psiquiatria), 'Transtornos Depressivos', 'transtornos_depressivos', 2),
((SELECT id FROM psiquiatria), 'Transtorno Bipolar', 'transtorno_bipolar', 3),
((SELECT id FROM psiquiatria), 'Esquizofrenia', 'esquizofrenia', 4),
((SELECT id FROM psiquiatria), 'Transtornos de Personalidade', 'transtornos_personalidade', 5),
((SELECT id FROM psiquiatria), 'Transtornos Alimentares', 'transtornos_alimentares', 6),
((SELECT id FROM psiquiatria), 'Dependência Química', 'dependencia_quimica', 7),
((SELECT id FROM psiquiatria), 'Emergências Psiquiátricas', 'emergencias_psiquiatricas', 8),
((SELECT id FROM psiquiatria), 'Psicofarmacologia', 'psicofarmacologia', 9),
((SELECT id FROM psiquiatria), 'Psiquiatria Infantil', 'psiquiatria_infantil', 10)
ON CONFLICT DO NOTHING;

-- ASSUNTOS DE MEDICINA PREVENTIVA
WITH preventiva AS (SELECT id FROM disciplinas_MED WHERE nome_normalizado = 'medicina_preventiva')
INSERT INTO assuntos_MED (disciplina_id, nome, nome_normalizado, ordem) VALUES
((SELECT id FROM preventiva), 'Epidemiologia', 'epidemiologia', 1),
((SELECT id FROM preventiva), 'Indicadores de Saúde', 'indicadores_saude', 2),
((SELECT id FROM preventiva), 'Vigilância em Saúde', 'vigilancia_saude', 3),
((SELECT id FROM preventiva), 'Sistema Único de Saúde (SUS)', 'sus', 4),
((SELECT id FROM preventiva), 'Atenção Primária à Saúde', 'atencao_primaria', 5),
((SELECT id FROM preventiva), 'Saúde do Trabalhador', 'saude_trabalhador', 6),
((SELECT id FROM preventiva), 'Doenças de Notificação Compulsória', 'notificacao_compulsoria', 7),
((SELECT id FROM preventiva), 'Bioestatística', 'bioestatistica', 8),
((SELECT id FROM preventiva), 'Estudos Epidemiológicos', 'estudos_epidemiologicos', 9),
((SELECT id FROM preventiva), 'Medicina Baseada em Evidências', 'mbe', 10)
ON CONFLICT DO NOTHING;

-- ASSUNTOS DE ÉTICA MÉDICA
WITH etica AS (SELECT id FROM disciplinas_MED WHERE nome_normalizado = 'etica_medica')
INSERT INTO assuntos_MED (disciplina_id, nome, nome_normalizado, ordem) VALUES
((SELECT id FROM etica), 'Código de Ética Médica', 'codigo_etica', 1),
((SELECT id FROM etica), 'Relação Médico-Paciente', 'relacao_medico_paciente', 2),
((SELECT id FROM etica), 'Sigilo Médico', 'sigilo_medico', 3),
((SELECT id FROM etica), 'Consentimento Informado', 'consentimento_informado', 4),
((SELECT id FROM etica), 'Bioética', 'bioetica', 5),
((SELECT id FROM etica), 'Atestado e Prontuário Médico', 'atestado_prontuario', 6),
((SELECT id FROM etica), 'Responsabilidade Civil e Penal', 'responsabilidade', 7),
((SELECT id FROM etica), 'Direitos do Paciente', 'direitos_paciente', 8)
ON CONFLICT DO NOTHING;
