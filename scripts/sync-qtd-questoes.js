/**
 * Script para sincronizar qtd_questoes em disciplinas, assuntos e subassuntos
 * baseado nas questões reais da tabela questoes
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zkcstkbpgwdoiihvfspp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprY3N0a2JwZ3dkb2lpaHZmc3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkzNDYwNCwiZXhwIjoyMDgxNTEwNjA0fQ.QkG18I254LiSZRsZ8-uvX8seIfJKfaazdciO__fjVOE'
)

async function syncQtdQuestoes() {
  console.log('🔄 Iniciando sincronização de qtd_questoes...\n')

  try {
    // 1. BUSCAR TODAS AS QUESTÕES (em lotes)
    console.log('📊 Buscando todas as questões...')
    const questoes = []
    let offset = 0
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from('questoes')
        .select('disciplina, assunto, subassunto')
        .range(offset, offset + limit - 1)

      if (error) throw error
      if (!data || data.length === 0) {
        hasMore = false
        break
      }

      questoes.push(...data)
      offset += limit
      hasMore = data.length === limit
      process.stdout.write(`\r  Carregadas ${questoes.length} questões...`)
    }
    console.log(`\n  ✅ Total: ${questoes.length} questões\n`)

    // 2. CONTAR POR DISCIPLINA
    console.log('📈 Contando questões por disciplina...')
    const contagemDisciplinas = {}
    questoes.forEach(q => {
      if (q.disciplina) {
        contagemDisciplinas[q.disciplina] = (contagemDisciplinas[q.disciplina] || 0) + 1
      }
    })
    console.log(`  ✅ ${Object.keys(contagemDisciplinas).length} disciplinas com questões\n`)

    // 3. ATUALIZAR DISCIPLINAS
    console.log('📝 Atualizando tabela disciplinas...')

    // Primeiro, zerar todas
    await supabase
      .from('disciplinas')
      .update({ qtd_questoes: 0 })
      .gte('id', '00000000-0000-0000-0000-000000000000')

    // Depois, atualizar cada uma
    let atualizadasDisc = 0
    for (const [nome, qtd] of Object.entries(contagemDisciplinas)) {
      const { error } = await supabase
        .from('disciplinas')
        .update({ qtd_questoes: qtd })
        .eq('nome', nome)

      if (!error) atualizadasDisc++
    }
    console.log(`  ✅ ${atualizadasDisc} disciplinas atualizadas\n`)

    // 4. CONTAR POR ASSUNTO (disciplina + assunto)
    console.log('📈 Contando questões por assunto...')
    const contagemAssuntos = {}
    questoes.forEach(q => {
      if (q.disciplina && q.assunto) {
        const key = `${q.disciplina}|||${q.assunto}`
        contagemAssuntos[key] = (contagemAssuntos[key] || 0) + 1
      }
    })
    console.log(`  ✅ ${Object.keys(contagemAssuntos).length} assuntos com questões\n`)

    // 5. BUSCAR DISCIPLINAS PARA MAPEAR NOMES -> IDS
    console.log('🔗 Mapeando disciplinas...')
    const { data: disciplinas } = await supabase
      .from('disciplinas')
      .select('id, nome')

    const discMap = {}
    disciplinas?.forEach(d => {
      discMap[d.nome] = d.id
    })

    // 6. ATUALIZAR ASSUNTOS
    console.log('📝 Atualizando tabela assuntos...')

    // Primeiro, zerar todos
    await supabase
      .from('assuntos')
      .update({ qtd_questoes: 0 })
      .gte('id', '00000000-0000-0000-0000-000000000000')

    let atualizadosAss = 0
    let naoEncontradosAss = []

    for (const [key, qtd] of Object.entries(contagemAssuntos)) {
      const [discNome, assNome] = key.split('|||')
      const discId = discMap[discNome]

      if (discId) {
        const { error, count } = await supabase
          .from('assuntos')
          .update({ qtd_questoes: qtd })
          .eq('disciplina_id', discId)
          .eq('nome', assNome)

        if (!error) atualizadosAss++
        else naoEncontradosAss.push(`${discNome} > ${assNome}`)
      }
    }
    console.log(`  ✅ ${atualizadosAss} assuntos atualizados`)
    if (naoEncontradosAss.length > 0) {
      console.log(`  ⚠️ ${naoEncontradosAss.length} assuntos não encontrados na tabela assuntos`)
    }
    console.log('')

    // 7. CONTAR POR SUBASSUNTO
    console.log('📈 Contando questões por subassunto...')
    const contagemSubassuntos = {}
    questoes.forEach(q => {
      if (q.disciplina && q.assunto && q.subassunto) {
        const key = `${q.disciplina}|||${q.assunto}|||${q.subassunto}`
        contagemSubassuntos[key] = (contagemSubassuntos[key] || 0) + 1
      }
    })
    console.log(`  ✅ ${Object.keys(contagemSubassuntos).length} subassuntos com questões\n`)

    // 8. BUSCAR ASSUNTOS PARA MAPEAR
    console.log('🔗 Mapeando assuntos...')
    const { data: assuntos } = await supabase
      .from('assuntos')
      .select('id, nome, disciplina_id')

    const assMap = {}
    assuntos?.forEach(a => {
      const key = `${a.disciplina_id}|||${a.nome}`
      assMap[key] = a.id
    })

    // 9. ATUALIZAR SUBASSUNTOS
    console.log('📝 Atualizando tabela subassuntos...')

    // Primeiro, zerar todos
    await supabase
      .from('subassuntos')
      .update({ qtd_questoes: 0 })
      .gte('id', '00000000-0000-0000-0000-000000000000')

    let atualizadosSub = 0

    for (const [key, qtd] of Object.entries(contagemSubassuntos)) {
      const [discNome, assNome, subNome] = key.split('|||')
      const discId = discMap[discNome]

      if (discId) {
        const assKey = `${discId}|||${assNome}`
        const assId = assMap[assKey]

        if (assId) {
          const { error } = await supabase
            .from('subassuntos')
            .update({ qtd_questoes: qtd })
            .eq('assunto_id', assId)
            .eq('nome', subNome)

          if (!error) atualizadosSub++
        }
      }
    }
    console.log(`  ✅ ${atualizadosSub} subassuntos atualizados\n`)

    // 10. RESUMO FINAL
    console.log('═══════════════════════════════════════')
    console.log('✅ SINCRONIZAÇÃO CONCLUÍDA!')
    console.log('═══════════════════════════════════════')
    console.log(`📚 ${questoes.length} questões processadas`)
    console.log(`📖 ${atualizadasDisc} disciplinas atualizadas`)
    console.log(`📑 ${atualizadosAss} assuntos atualizados`)
    console.log(`📄 ${atualizadosSub} subassuntos atualizados`)
    console.log('═══════════════════════════════════════\n')

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

syncQtdQuestoes()
