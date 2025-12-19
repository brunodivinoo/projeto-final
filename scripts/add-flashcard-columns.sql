-- Script para adicionar colunas de organizacao na tabela flashcards
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna disciplina
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS disciplina TEXT;

-- Adicionar coluna assunto
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS assunto TEXT;

-- Adicionar coluna subassunto
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS subassunto TEXT;

-- Criar indices para melhorar performance dos filtros
CREATE INDEX IF NOT EXISTS idx_flashcards_disciplina ON flashcards(disciplina);
CREATE INDEX IF NOT EXISTS idx_flashcards_assunto ON flashcards(assunto);
CREATE INDEX IF NOT EXISTS idx_flashcards_subassunto ON flashcards(subassunto);

-- Indice composto para filtros combinados
CREATE INDEX IF NOT EXISTS idx_flashcards_hierarquia ON flashcards(user_id, disciplina, assunto, subassunto);

-- Verificar se as colunas foram criadas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'flashcards'
AND column_name IN ('disciplina', 'assunto', 'subassunto');
