// Script para atualizar questões existentes com dados de imagem
// Execute com: node scripts/atualizar-questoes-com-imagens.js

const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk').default
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anthropicKey = process.env.ANTHROPIC_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const anthropic = new Anthropic({ apiKey: anthropicKey })

// Disciplinas que OBRIGATORIAMENTE precisam de imagens
const DISCIPLINAS_IMAGEM_OBRIGATORIA = [
  'anatomia', 'histologia', 'embriologia', 'patologia',
  'radiologia', 'dermatologia', 'oftalmologia', 'cardiologia',
  'hematologia', 'parasitologia', 'microbiologia', 'neurologia'
]

function precisaImagem(nomeDisciplina) {
  const nome = nomeDisciplina?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || ''
  return DISCIPLINAS_IMAGEM_OBRIGATORIA.some(d => nome.includes(d))
}

async function gerarDadosImagem(questao, nomeDisciplina, nomeAssunto) {
  const prompt = `Você é um professor de medicina especialista em criar questões com imagens.

QUESTÃO EXISTENTE:
- Disciplina: ${nomeDisciplina}
- Assunto: ${nomeAssunto}
- Enunciado: ${questao.enunciado}
- Gabarito: ${questao.gabarito}
- Explicação: ${questao.explicacao?.substring(0, 500) || 'N/A'}

TAREFA: Defina qual imagem DEVE acompanhar esta questão para que ela seja adequada para uma prova de medicina.

Considerando que ${nomeDisciplina} é uma disciplina VISUAL onde imagens são ESSENCIAIS, gere:

1. Uma descrição MUITO DETALHADA da imagem necessária
2. Qual estrutura deve ter uma SETA apontando (a estrutura que a questão pergunta)
3. Qual atlas/livro deve ser a fonte da imagem (Sobotta, Netter, Robbins, etc.)
4. O que o aluno precisa identificar na imagem

Responda APENAS em JSON:
\`\`\`json
{
  "descricao_detalhada": "Descrição completa da imagem, como aparece no atlas",
  "estrutura_apontada": "Nome da estrutura + onde a seta deve apontar",
  "tipo_imagem": "atlas anatomico/histologia/radiografia/etc",
  "fonte_imagem": "Nome do atlas ou livro de referência",
  "legenda": "Legenda que apareceria na imagem",
  "achados_principais": ["estrutura1", "estrutura2", "estrutura3"],
  "enunciado_atualizado": "O novo enunciado da questão mencionando a imagem e a seta (ex: 'Na imagem abaixo, a seta aponta para qual estrutura?')"
}
\`\`\``

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0]
    if (content.type !== 'text') return null

    // Extrair JSON
    const jsonMatch = content.text.match(/```json\n?([\s\S]*?)\n?```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1])
    }

    return null
  } catch (error) {
    console.error('Erro ao gerar dados de imagem:', error.message)
    return null
  }
}

async function atualizarQuestoes() {
  console.log('🔍 Buscando questões que precisam de imagens...\n')

  // Buscar todas as questões geradas por IA com suas disciplinas
  const { data: questoes, error } = await supabase
    .from('questoes_med')
    .select(`
      id,
      enunciado,
      gabarito,
      explicacao,
      imagem_dados,
      disciplina_id,
      assunto_id,
      disciplinas_med(nome),
      assuntos_med(nome)
    `)
    .eq('gerado_por_ia', true)
    .is('imagem_dados', null)
    .limit(50)

  if (error) {
    console.error('Erro ao buscar questões:', error)
    return
  }

  console.log(`📊 Total de questões encontradas: ${questoes?.length || 0}\n`)

  // Filtrar apenas as que precisam de imagem
  const questoesParaAtualizar = (questoes || []).filter(q => {
    const nomeDisciplina = q.disciplinas_med?.nome || ''
    return precisaImagem(nomeDisciplina)
  })

  console.log(`🖼️ Questões que precisam de imagem: ${questoesParaAtualizar.length}\n`)

  if (questoesParaAtualizar.length === 0) {
    console.log('✅ Nenhuma questão pendente para atualizar!')
    return
  }

  let atualizadas = 0
  let erros = 0

  for (const questao of questoesParaAtualizar) {
    const nomeDisciplina = questao.disciplinas_med?.nome || 'Desconhecida'
    const nomeAssunto = questao.assuntos_med?.nome || 'Desconhecido'

    console.log(`\n📝 Processando questão ${atualizadas + 1}/${questoesParaAtualizar.length}`)
    console.log(`   Disciplina: ${nomeDisciplina}`)
    console.log(`   Assunto: ${nomeAssunto}`)
    console.log(`   Enunciado: ${questao.enunciado.substring(0, 80)}...`)

    // Aguardar 2 segundos entre requisições
    if (atualizadas > 0) {
      await new Promise(r => setTimeout(r, 2000))
    }

    const dadosImagem = await gerarDadosImagem(questao, nomeDisciplina, nomeAssunto)

    if (dadosImagem) {
      // Atualizar questão no banco
      const { error: updateError } = await supabase
        .from('questoes_med')
        .update({
          imagem_dados: dadosImagem,
          enunciado: dadosImagem.enunciado_atualizado || questao.enunciado
        })
        .eq('id', questao.id)

      if (updateError) {
        console.log(`   ❌ Erro ao atualizar: ${updateError.message}`)
        erros++
      } else {
        console.log(`   ✅ Atualizada com sucesso!`)
        console.log(`   📸 Estrutura apontada: ${dadosImagem.estrutura_apontada}`)
        atualizadas++
      }
    } else {
      console.log(`   ❌ Não foi possível gerar dados de imagem`)
      erros++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Atualizadas: ${atualizadas}`)
  console.log(`❌ Erros: ${erros}`)
  console.log('='.repeat(50))
}

atualizarQuestoes()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro fatal:', err)
    process.exit(1)
  })
