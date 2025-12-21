import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface ConfigGeracao {
  disciplinas: Array<{ nome: string; peso: number }>
  assuntos: Array<{ nome: string; disciplina: string; peso: number }>
  subassuntos: Array<{ nome: string; assunto: string; disciplina: string; peso: number }>
  bancas: string[]
  dificuldades: string[]
  modalidade: 'multipla_escolha' | 'certo_errado' | 'mista'
  quantidade: number
}

// Função para normalizar texto (remover acentos, lowercase)
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Função para usar IA para padronizar disciplina/assunto/banca
async function padronizarComIA(tipo: 'disciplina' | 'assunto' | 'subassunto' | 'banca', texto: string, contexto?: string): Promise<string> {
  const prompts = {
    disciplina: `Você é um especialista em concursos públicos brasileiros.
Dado o texto "${texto}", retorne APENAS o nome padronizado da disciplina em formato de concurso.
Exemplos: "dir const" -> "Direito Constitucional", "port" -> "Língua Portuguesa", "rlm" -> "Raciocínio Lógico"
Retorne APENAS o nome, sem explicações.`,

    assunto: `Você é um especialista em concursos públicos brasileiros.
Disciplina: ${contexto}
Dado o texto "${texto}", retorne APENAS o nome padronizado do assunto dessa disciplina.
Exemplos para Direito Constitucional: "princ fund" -> "Princípios Fundamentais", "dir indiv" -> "Direitos e Garantias Individuais"
Retorne APENAS o nome, sem explicações.`,

    subassunto: `Você é um especialista em concursos públicos brasileiros.
Contexto: ${contexto}
Dado o texto "${texto}", retorne APENAS o nome padronizado do subassunto.
Retorne APENAS o nome, sem explicações.`,

    banca: `Você é um especialista em concursos públicos brasileiros.
Dado o texto "${texto}", retorne APENAS o nome padronizado da banca examinadora.
Exemplos: "cespe" -> "CESPE/CEBRASPE", "fcc" -> "FCC", "fgv" -> "FGV", "vunesp" -> "VUNESP"
Se não reconhecer, retorne o texto capitalizado.
Retorne APENAS o nome, sem explicações.`
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompts[tipo] }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
        })
      }
    )

    if (!response.ok) return texto
    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || texto
  } catch {
    return texto
  }
}

// Função para salvar/buscar disciplina padronizada
async function getOrCreateDisciplina(nome: string): Promise<{ id: string; nome: string }> {
  const nomeNormalizado = normalizarTexto(nome)

  // Buscar existente
  const { data: existing } = await supabase
    .from('disciplinas')
    .select('id, nome')
    .eq('nome_normalizado', nomeNormalizado)
    .single()

  if (existing) return existing

  // Padronizar com IA
  const nomePadronizado = await padronizarComIA('disciplina', nome)
  const nomePadronizadoNorm = normalizarTexto(nomePadronizado)

  // Verificar se o nome padronizado já existe
  const { data: existingPad } = await supabase
    .from('disciplinas')
    .select('id, nome')
    .eq('nome_normalizado', nomePadronizadoNorm)
    .single()

  if (existingPad) return existingPad

  // Criar nova
  const { data: created } = await supabase
    .from('disciplinas')
    .insert({ nome: nomePadronizado, nome_normalizado: nomePadronizadoNorm })
    .select('id, nome')
    .single()

  return created || { id: '', nome: nomePadronizado }
}

// Função para salvar/buscar assunto padronizado
async function getOrCreateAssunto(nome: string, disciplinaId: string, disciplinaNome: string): Promise<{ id: string; nome: string }> {
  const nomeNormalizado = normalizarTexto(nome)

  // Buscar existente na mesma disciplina
  const { data: existing } = await supabase
    .from('assuntos')
    .select('id, nome')
    .eq('nome_normalizado', nomeNormalizado)
    .eq('disciplina_id', disciplinaId)
    .single()

  if (existing) return existing

  // Padronizar com IA
  const nomePadronizado = await padronizarComIA('assunto', nome, disciplinaNome)
  const nomePadronizadoNorm = normalizarTexto(nomePadronizado)

  // Verificar se já existe
  const { data: existingPad } = await supabase
    .from('assuntos')
    .select('id, nome')
    .eq('nome_normalizado', nomePadronizadoNorm)
    .eq('disciplina_id', disciplinaId)
    .single()

  if (existingPad) return existingPad

  // Criar novo
  const { data: created } = await supabase
    .from('assuntos')
    .insert({ nome: nomePadronizado, nome_normalizado: nomePadronizadoNorm, disciplina_id: disciplinaId })
    .select('id, nome')
    .single()

  return created || { id: '', nome: nomePadronizado }
}

// Função para salvar/buscar banca padronizada
async function getOrCreateBanca(nome: string): Promise<{ id: string; nome: string }> {
  const nomeNormalizado = normalizarTexto(nome)

  // Buscar existente
  const { data: existing } = await supabase
    .from('bancas')
    .select('id, nome')
    .eq('nome_normalizado', nomeNormalizado)
    .single()

  if (existing) return existing

  // Padronizar com IA
  const nomePadronizado = await padronizarComIA('banca', nome)
  const nomePadronizadoNorm = normalizarTexto(nomePadronizado)

  // Verificar se já existe
  const { data: existingPad } = await supabase
    .from('bancas')
    .select('id, nome')
    .eq('nome_normalizado', nomePadronizadoNorm)
    .single()

  if (existingPad) return existingPad

  // Criar nova
  const { data: created } = await supabase
    .from('bancas')
    .insert({ nome: nomePadronizado, nome_normalizado: nomePadronizadoNorm })
    .select('id, nome')
    .single()

  return created || { id: '', nome: nomePadronizado }
}

// Função para distribuir questões entre disciplinas/assuntos
function distribuirQuestoes(config: ConfigGeracao): Array<{
  disciplina: string
  assunto: string
  subassunto: string
  banca: string
  dificuldade: string
  modalidade: string
}> {
  const distribuicao: Array<{
    disciplina: string
    assunto: string
    subassunto: string
    banca: string
    dificuldade: string
    modalidade: string
  }> = []

  const { quantidade, disciplinas, assuntos, subassuntos, bancas, dificuldades, modalidade } = config

  // Calcular total de pesos
  const totalPesoDisc = disciplinas.reduce((acc, d) => acc + d.peso, 0) || 1

  // Distribuir por disciplina
  let questoesRestantes = quantidade

  for (let i = 0; i < disciplinas.length; i++) {
    const disc = disciplinas[i]
    const isUltima = i === disciplinas.length - 1
    const qtdDisc = isUltima
      ? questoesRestantes
      : Math.round((disc.peso / totalPesoDisc) * quantidade)

    questoesRestantes -= qtdDisc

    // Assuntos desta disciplina
    const assuntosDisc = assuntos.filter(a => a.disciplina === disc.nome)
    const totalPesoAss = assuntosDisc.reduce((acc, a) => acc + a.peso, 0) || 1

    let questoesDiscRestantes = qtdDisc

    for (let j = 0; j < assuntosDisc.length || j === 0; j++) {
      const ass = assuntosDisc[j]
      const isUltimaAss = j === assuntosDisc.length - 1 || assuntosDisc.length === 0
      const qtdAss = isUltimaAss
        ? questoesDiscRestantes
        : Math.round((ass?.peso || 1) / totalPesoAss * qtdDisc)

      questoesDiscRestantes -= qtdAss

      // Subassuntos deste assunto
      const subassuntosAss = subassuntos.filter(s => s.assunto === ass?.nome && s.disciplina === disc.nome)

      for (let k = 0; k < qtdAss; k++) {
        const sub = subassuntosAss[k % (subassuntosAss.length || 1)]
        const banca = bancas[k % (bancas.length || 1)] || 'CESPE/CEBRASPE'
        const dificuldade = dificuldades[k % (dificuldades.length || 1)] || 'media'
        const mod = modalidade === 'mista'
          ? (k % 2 === 0 ? 'multipla_escolha' : 'certo_errado')
          : modalidade

        distribuicao.push({
          disciplina: disc.nome,
          assunto: ass?.nome || '',
          subassunto: sub?.nome || '',
          banca,
          dificuldade,
          modalidade: mod
        })
      }
    }
  }

  return distribuicao.slice(0, quantidade)
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, config } = await req.json() as { user_id: string; config: ConfigGeracao }

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
    }

    // Validar quantidade (max 20)
    const quantidade = Math.min(Math.max(1, config.quantidade || 5), 20)
    config.quantidade = quantidade

    // Verificar limites do usuário
    const hoje = new Date().toISOString().split('T')[0]

    // Buscar plano do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', user_id)
      .single()

    const planoNome = profile?.plano?.toUpperCase() === 'ESTUDA_PRO' ? 'ESTUDA_PRO' : 'FREE'

    // Buscar limites
    const { data: plano } = await supabase
      .from('planos')
      .select('limite_questoes_ia_dia')
      .eq('nome', planoNome)
      .single()

    const limiteQuestoes = plano?.limite_questoes_ia_dia || 5

    // Verificar uso de hoje
    const { data: usoHoje } = await supabase
      .from('uso_diario')
      .select('quantidade')
      .eq('user_id', user_id)
      .eq('data', hoje)
      .eq('tipo', 'questoes_ia')
      .maybeSingle()

    const usadoHoje = usoHoje?.quantidade || 0

    if (limiteQuestoes !== -1 && usadoHoje + quantidade > limiteQuestoes) {
      return NextResponse.json({
        error: 'Limite diário de questões IA atingido',
        limite: limiteQuestoes,
        usado: usadoHoje,
        disponivel: Math.max(0, limiteQuestoes - usadoHoje)
      }, { status: 429 })
    }

    // Padronizar disciplinas, assuntos e bancas
    const disciplinasPadronizadas = await Promise.all(
      config.disciplinas.map(async d => {
        const pad = await getOrCreateDisciplina(d.nome)
        return { ...d, nome: pad.nome, id: pad.id }
      })
    )

    const assuntosPadronizados = await Promise.all(
      config.assuntos.map(async a => {
        const disc = disciplinasPadronizadas.find(d =>
          normalizarTexto(d.nome) === normalizarTexto(a.disciplina)
        )
        if (!disc) return { ...a }
        const pad = await getOrCreateAssunto(a.nome, disc.id, disc.nome)
        return { ...a, nome: pad.nome, disciplina: disc.nome }
      })
    )

    const bancasPadronizadas = await Promise.all(
      config.bancas.map(async b => {
        const pad = await getOrCreateBanca(b)
        return pad.nome
      })
    )

    // Atualizar config com nomes padronizados
    config.disciplinas = disciplinasPadronizadas
    config.assuntos = assuntosPadronizados
    config.bancas = bancasPadronizadas

    // Distribuir questões
    const distribuicao = distribuirQuestoes(config)

    // Função auxiliar para gerar uma questão com retry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function gerarUmaQuestao(item: typeof distribuicao[0], tentativa = 1): Promise<any | null> {
      const MAX_TENTATIVAS = 3

      const promptMultipla = `Você é um especialista em elaborar questões de concursos públicos brasileiros.

CONFIGURAÇÃO:
- Disciplina: ${item.disciplina}
- Assunto: ${item.assunto || 'Geral'}
- Subassunto: ${item.subassunto || 'Geral'}
- Estilo da Banca: ${item.banca}
- Dificuldade: ${item.dificuldade}
- Modalidade: Múltipla Escolha (5 alternativas: A, B, C, D, E)

INSTRUÇÕES:
1. Crie UMA questão no estilo da banca ${item.banca}
2. A questão deve ser de dificuldade ${item.dificuldade}
3. Inclua 5 alternativas (A a E), sendo apenas UMA correta
4. Elabore um comentário explicando o gabarito

FORMATO DE RESPOSTA (JSON):
{
  "enunciado": "texto do enunciado",
  "alternativa_a": "texto da alternativa A",
  "alternativa_b": "texto da alternativa B",
  "alternativa_c": "texto da alternativa C",
  "alternativa_d": "texto da alternativa D",
  "alternativa_e": "texto da alternativa E",
  "gabarito": "A",
  "comentario": "explicação detalhada do gabarito"
}

Retorne APENAS o JSON, sem markdown ou explicações.`

      const promptCertoErrado = `Você é um especialista em elaborar questões de concursos públicos brasileiros.

CONFIGURAÇÃO:
- Disciplina: ${item.disciplina}
- Assunto: ${item.assunto || 'Geral'}
- Subassunto: ${item.subassunto || 'Geral'}
- Estilo da Banca: ${item.banca}
- Dificuldade: ${item.dificuldade}
- Modalidade: Certo ou Errado

INSTRUÇÕES:
1. Crie UMA questão no estilo CESPE/CEBRASPE (Certo ou Errado)
2. A questão deve ser uma afirmação que pode ser julgada como CERTA ou ERRADA
3. Elabore um comentário explicando o gabarito

FORMATO DE RESPOSTA (JSON):
{
  "enunciado": "afirmação para julgar",
  "gabarito": "C" ou "E",
  "comentario": "explicação detalhada do gabarito"
}

Retorne APENAS o JSON, sem markdown ou explicações.`

      const prompt = item.modalidade === 'certo_errado' ? promptCertoErrado : promptMultipla

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
            })
          }
        )

        if (!response.ok) {
          console.error(`Erro na API Gemini (tentativa ${tentativa}): ${response.status}`)
          if (tentativa < MAX_TENTATIVAS) {
            await new Promise(resolve => setTimeout(resolve, 1000 * tentativa)) // Espera progressiva
            return gerarUmaQuestao(item, tentativa + 1)
          }
          return null
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

        // Parse JSON
        let questao
        try {
          questao = JSON.parse(text.trim())
        } catch {
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            questao = JSON.parse(jsonMatch[0])
          }
        }

        if (questao && questao.enunciado && questao.gabarito) {
          return {
            ...item,
            ...questao
          }
        }

        // JSON inválido, tentar novamente
        if (tentativa < MAX_TENTATIVAS) {
          console.log(`JSON inválido (tentativa ${tentativa}), tentando novamente...`)
          await new Promise(resolve => setTimeout(resolve, 500))
          return gerarUmaQuestao(item, tentativa + 1)
        }

        return null
      } catch (err) {
        console.error(`Erro ao gerar questão (tentativa ${tentativa}):`, err)
        if (tentativa < MAX_TENTATIVAS) {
          await new Promise(resolve => setTimeout(resolve, 1000 * tentativa))
          return gerarUmaQuestao(item, tentativa + 1)
        }
        return null
      }
    }

    // Gerar questões com IA (em paralelo para ser mais rápido)
    console.log(`Gerando ${distribuicao.length} questões...`)
    const resultados = await Promise.all(
      distribuicao.map(item => gerarUmaQuestao(item))
    )

    // Filtrar resultados válidos e adicionar configs
    const questoesGeradas = resultados
      .filter((q): q is NonNullable<typeof q> => q !== null)
      .map(q => ({
        ...q,
        config_disciplinas: config.disciplinas,
        config_assuntos: config.assuntos,
        config_subassuntos: config.subassuntos,
        config_bancas: config.bancas,
        config_dificuldades: config.dificuldades,
        config_modalidade: config.modalidade
      }))

    console.log(`${questoesGeradas.length} questões geradas com sucesso`)

    if (questoesGeradas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma questão gerada' }, { status: 500 })
    }

    // Salvar questões no banco
    const questoesParaInserir = questoesGeradas.map(q => ({
      user_id,
      disciplina: q.disciplina,
      assunto: q.assunto || null,
      subassunto: q.subassunto || null,
      banca: q.banca,
      dificuldade: q.dificuldade,
      modalidade: q.modalidade,
      enunciado: q.enunciado,
      alternativa_a: q.alternativa_a || null,
      alternativa_b: q.alternativa_b || null,
      alternativa_c: q.alternativa_c || null,
      alternativa_d: q.alternativa_d || null,
      alternativa_e: q.alternativa_e || null,
      gabarito: q.gabarito,
      comentario: q.comentario || null,
      config_disciplinas: q.config_disciplinas,
      config_assuntos: q.config_assuntos,
      config_subassuntos: q.config_subassuntos,
      config_bancas: q.config_bancas,
      config_dificuldades: q.config_dificuldades,
      config_modalidade: q.config_modalidade
    }))

    const { data: insertedQuestoes, error: insertError } = await supabase
      .from('questoes_ia_geradas')
      .insert(questoesParaInserir)
      .select()

    if (insertError) {
      console.error('Erro ao salvar questões:', insertError)
      return NextResponse.json({ error: 'Erro ao salvar questões' }, { status: 500 })
    }

    // Registrar uso diário
    if (usoHoje) {
      await supabase
        .from('uso_diario')
        .update({ quantidade: usadoHoje + questoesGeradas.length })
        .eq('user_id', user_id)
        .eq('data', hoje)
        .eq('tipo', 'questoes_ia')
    } else {
      await supabase
        .from('uso_diario')
        .insert({
          user_id,
          data: hoje,
          tipo: 'questoes_ia',
          quantidade: questoesGeradas.length
        })
    }

    // Registrar atividade
    await supabase
      .from('historico_atividades')
      .insert({
        user_id,
        tipo: 'questao_ia_gerada',
        descricao: `Gerou ${questoesGeradas.length} questões com IA`,
        detalhes: { quantidade: questoesGeradas.length, disciplinas: config.disciplinas.map(d => d.nome) }
      })

    return NextResponse.json({
      success: true,
      questoes: insertedQuestoes,
      quantidade: insertedQuestoes?.length || 0,
      restante: limiteQuestoes === -1 ? -1 : limiteQuestoes - usadoHoje - questoesGeradas.length
    })

  } catch (error) {
    console.error('Erro ao gerar questões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
