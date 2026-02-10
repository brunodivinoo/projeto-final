// Pipeline de Compressão de Contexto para PREPARAMED
// Usa Gemini Flash (modelo ultra-barato) para comprimir resultados de busca
// antes de enviar ao modelo principal (que só monta a resposta)

import { GoogleGenerativeAI } from '@google/generative-ai'
import { MODELOS } from './config'

interface FonteComprimida {
  titulo: string
  url: string
  ehDiretriz: boolean
}

export interface ContextoComprimido {
  resumo: string
  fontes: FonteComprimida[]
  tokensOriginais: number
  tokensComprimidos: number
  taxaCompressao: number
}

interface ResultadoParaCompressao {
  titulo: string
  url: string
  snippet: string
  ehDiretriz: boolean
}

/**
 * Comprime resultados de busca web usando Gemini Flash (ultra-barato)
 * Input: 5-8 snippets (~2000-4000 tokens)
 * Output: resumo de 300-600 tokens com fatos essenciais preservados
 */
export async function comprimirContexto(
  resultados: ResultadoParaCompressao[],
  temaPergunta: string
): Promise<ContextoComprimido> {
  if (resultados.length === 0) {
    return {
      resumo: '',
      fontes: [],
      tokensOriginais: 0,
      tokensComprimidos: 0,
      taxaCompressao: 1,
    }
  }

  // Montar texto bruto dos resultados
  const textoBruto = resultados.map((r, i) => {
    const tag = r.ehDiretriz ? '[DIRETRIZ BRASILEIRA]' : '[FONTE MÉDICA]'
    return `${tag} ${r.titulo}:\n${r.snippet}`
  }).join('\n\n')

  const tokensOriginais = Math.ceil(textoBruto.length / 4)

  // Se o texto já é curto, não precisa comprimir
  if (tokensOriginais <= 600) {
    return {
      resumo: textoBruto,
      fontes: resultados.map(r => ({
        titulo: r.titulo,
        url: r.url,
        ehDiretriz: r.ehDiretriz,
      })),
      tokensOriginais,
      tokensComprimidos: tokensOriginais,
      taxaCompressao: 1,
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: MODELOS.gemini.flash,
      generationConfig: {
        temperature: 0.1, // Baixa para ser fiel aos fatos
        maxOutputTokens: 1500, // Mais espaço para síntese detalhada
      },
    })

    const promptCompressao = `Você é um sintetizador de informações. Sua tarefa é ORGANIZAR e RESUMIR os trechos de pesquisa abaixo em um texto conciso de 300-600 palavras.

REGRAS OBRIGATÓRIAS:
1. PRIORIZE informações de fontes marcadas como [DIRETRIZ BRASILEIRA]
2. Mantenha FATOS ESSENCIAIS: definições, dados, classificações, tratamentos, comparações
3. Preserve TODOS os dados numéricos (doses, percentuais, valores, preços, critérios)
4. NÃO invente informações - use SOMENTE o que está nos trechos
5. Se os trechos NÃO contêm informação específica sobre algo, escreva: "DADOS NÃO ENCONTRADOS: [o que falta]"
6. ORGANIZE logicamente: agrupe informações relacionadas juntas
7. Para COMPARAÇÕES: liste claramente as diferenças ponto a ponto
8. Para PRODUTOS/MARCAS: inclua nomes exatos, características específicas, diferenças

TEMA DA PERGUNTA DO USUÁRIO: ${temaPergunta}

TRECHOS DA PESQUISA WEB:
${textoBruto}

SÍNTESE ORGANIZADA:`

    const result = await model.generateContent(promptCompressao)
    const resumo = result.response.text().trim()
    const tokensComprimidos = Math.ceil(resumo.length / 4)

    console.log(`[Compressor] ${tokensOriginais} → ${tokensComprimidos} tokens (${Math.round((1 - tokensComprimidos / tokensOriginais) * 100)}% redução)`)

    return {
      resumo,
      fontes: resultados.map(r => ({
        titulo: r.titulo,
        url: r.url,
        ehDiretriz: r.ehDiretriz,
      })),
      tokensOriginais,
      tokensComprimidos,
      taxaCompressao: tokensComprimidos / tokensOriginais,
    }
  } catch (error) {
    console.error('[Compressor] Erro na compressão, retornando texto truncado:', error)

    // Fallback: truncar manualmente
    const resumoTruncado = resultados
      .slice(0, 4)
      .map(r => `${r.titulo}: ${r.snippet.slice(0, 200)}`)
      .join('\n\n')

    return {
      resumo: resumoTruncado,
      fontes: resultados.map(r => ({
        titulo: r.titulo,
        url: r.url,
        ehDiretriz: r.ehDiretriz,
      })),
      tokensOriginais,
      tokensComprimidos: Math.ceil(resumoTruncado.length / 4),
      taxaCompressao: 0.5,
    }
  }
}

/**
 * Pipeline completo: busca + compressão
 * Retorna contexto pronto para injetar no prompt do modelo principal
 */
export function formatarContextoComprimido(contexto: ContextoComprimido): string {
  if (!contexto.resumo) return ''

  const dataAtual = new Date().toLocaleDateString('pt-BR')

  let texto = '<contexto_pesquisa>\n'
  texto += 'Baseie sua resposta nestas informações de fontes confiáveis:\n\n'
  texto += contexto.resumo
  texto += '\n\n--- Referências (formato ABNT) ---\n'

  contexto.fontes.forEach((fonte, i) => {
    const tag = fonte.ehDiretriz ? ' [Diretriz Brasileira]' : ''
    texto += `[${i + 1}] ${fonte.titulo}${tag}. Disponível em: ${fonte.url}. Acesso em: ${dataAtual}.\n`
  })

  texto += '</contexto_pesquisa>'

  return texto
}
