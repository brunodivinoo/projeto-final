-- Adicionar coluna opcoes_avancadas à tabela simulados
-- Execute este SQL no Supabase SQL Editor

-- A coluna opcoes_avancadas armazenará um objeto JSON com:
-- - distratos: string (temas a não abordar)
-- - incluirJurisprudencia: boolean
-- - incluirSumulas: boolean
-- - incluirSumulasVinculantes: boolean
-- - incluirDoutrina: boolean

ALTER TABLE public.simulados
ADD COLUMN IF NOT EXISTS opcoes_avancadas JSONB DEFAULT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.simulados.opcoes_avancadas IS 'Opções avançadas para geração de questões IA: distratos, jurisprudência, súmulas, doutrina';
