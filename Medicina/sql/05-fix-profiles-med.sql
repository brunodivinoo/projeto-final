-- =============================================
-- PREPARAMED - FIX para profiles_med
-- Execute este script no Supabase SQL Editor
-- =============================================

-- 1. Adicionar campo periodo_curso se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_med' AND column_name = 'periodo_curso'
    ) THEN
        ALTER TABLE profiles_med ADD COLUMN periodo_curso INTEGER DEFAULT NULL;
    END IF;
END $$;

-- 2. Adicionar campos de trial se não existirem
DO $$
BEGIN
    -- trial_started_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_med' AND column_name = 'trial_started_at'
    ) THEN
        ALTER TABLE profiles_med ADD COLUMN trial_started_at TIMESTAMPTZ DEFAULT NULL;
    END IF;

    -- trial_used
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_med' AND column_name = 'trial_used'
    ) THEN
        ALTER TABLE profiles_med ADD COLUMN trial_used BOOLEAN DEFAULT FALSE;
    END IF;

    -- trial_tempo_usado_segundos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_med' AND column_name = 'trial_tempo_usado_segundos'
    ) THEN
        ALTER TABLE profiles_med ADD COLUMN trial_tempo_usado_segundos INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Verificar e corrigir RLS policies para profiles_med
ALTER TABLE profiles_med ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can view own profile" ON profiles_med;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles_med;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles_med;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles_med;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles_med;
DROP POLICY IF EXISTS "Enable read for users based on id" ON profiles_med;

-- Criar policies corretas
CREATE POLICY "Users can view own profile" ON profiles_med
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles_med
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles_med
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Verificar e corrigir RLS para limites_uso_med
ALTER TABLE limites_uso_med ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own limits" ON limites_uso_med;
DROP POLICY IF EXISTS "Users can update own limits" ON limites_uso_med;
DROP POLICY IF EXISTS "Users can insert own limits" ON limites_uso_med;

CREATE POLICY "Users can view own limits" ON limites_uso_med
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own limits" ON limites_uso_med
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own limits" ON limites_uso_med
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Verificar e corrigir RLS para assinaturas_med
ALTER TABLE assinaturas_med ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON assinaturas_med;

CREATE POLICY "Users can view own subscriptions" ON assinaturas_med
    FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- VERIFICACAO
-- =============================================
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles_med'
ORDER BY ordinal_position;
