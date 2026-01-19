const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zkcstkbpgwdoiihvfspp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprY3N0a2JwZ3dkb2lpaHZmc3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkzNDYwNCwiZXhwIjoyMDgxNTEwNjA0fQ.QkG18I254LiSZRsZ8-uvX8seIfJKfaazdciO__fjVOE'
)

async function verificarTabela() {
  console.log('🔧 Verificando tabela respostas_questoes_ia_med...\n')
  
  // Verificar se a tabela existe
  const { data, error } = await supabase
    .from('respostas_questoes_ia_med')
    .select('id')
    .limit(1)
  
  if (error && error.code === '42P01') {
    console.log('❌ Tabela NÃO existe ainda.')
    console.log('\n📋 Execute o SQL manualmente:')
    console.log('   https://supabase.com/dashboard/project/zkcstkbpgwdoiihvfspp/sql/new\n')
  } else if (error) {
    console.log('⚠️ Erro:', error.message, '- Código:', error.code)
  } else {
    console.log('✅ Tabela respostas_questoes_ia_med EXISTE!')
    console.log('   Registros encontrados:', data?.length || 0)
  }
}

verificarTabela()
