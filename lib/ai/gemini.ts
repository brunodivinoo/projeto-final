// Cliente Google Gemini para PREPARAMED

import { GoogleGenerativeAI, GenerativeModel, Content } from '@google/generative-ai'
import { MODELOS } from './config'
import { MensagemIA, ChatResponse } from './types'
import { SYSTEM_PROMPT_PREMIUM } from './prompts'

// Inicializar cliente
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ==========================================
// CHAT COM STREAMING
// ==========================================

export async function chatComGeminiStream(
  mensagens: MensagemIA[],
  systemPrompt?: string
) {
  const model = genAI.getGenerativeModel({
    model: MODELOS.gemini.flash,
    systemInstruction: systemPrompt || SYSTEM_PROMPT_PREMIUM,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 4096
    }
  })

  // Converter mensagens para formato Gemini
  const history: Content[] = []

  for (let i = 0; i < mensagens.length - 1; i++) {
    const msg = mensagens[i]
    if (msg.role === 'system') continue

    history.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })
  }

  // Última mensagem (atual do usuário)
  const ultimaMensagem = mensagens[mensagens.length - 1]

  // Criar chat
  const chat = model.startChat({ history })

  // Enviar com streaming
  const result = await chat.sendMessageStream(ultimaMensagem.content)

  return result.stream
}

// ==========================================
// CHAT SEM STREAMING
// ==========================================

export async function chatComGemini(
  mensagens: MensagemIA[],
  systemPrompt?: string
): Promise<ChatResponse> {
  const model = genAI.getGenerativeModel({
    model: MODELOS.gemini.flash,
    systemInstruction: systemPrompt || SYSTEM_PROMPT_PREMIUM,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 4096
    }
  })

  // Converter mensagens
  const history: Content[] = []

  for (let i = 0; i < mensagens.length - 1; i++) {
    const msg = mensagens[i]
    if (msg.role === 'system') continue

    history.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })
  }

  const ultimaMensagem = mensagens[mensagens.length - 1]
  const chat = model.startChat({ history })

  const result = await chat.sendMessage(ultimaMensagem.content)
  const response = result.response

  // Estimar tokens (Gemini não retorna contagem exata)
  const textoTotal = mensagens.map(m => m.content).join(' ')
  const tokensEstimados = Math.ceil(textoTotal.length / 4)

  return {
    resposta: response.text(),
    conversa_id: '',
    tokens_usados: {
      input: tokensEstimados,
      output: Math.ceil(response.text().length / 4)
    }
  }
}

// ==========================================
// GERAÇÃO DE IMAGENS
// ==========================================

export async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp' // modelo com capacidade de geração de imagem
    })

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Gere uma imagem médica educativa: ${prompt}.
                 A imagem deve ser clara, profissional e adequada para fins educacionais.
                 Estilo: diagrama médico/anatômico de alta qualidade.`
        }]
      }],
      generationConfig: {
        // @ts-expect-error - propriedade para geração de imagem
        responseModalities: ['image', 'text']
      }
    })

    // Extrair imagem da resposta
    const response = result.response
    const parts = response.candidates?.[0]?.content?.parts

    if (parts) {
      for (const part of parts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = part as any
        if (p.inlineData) {
          return p.inlineData.data
        }
      }
    }

    return null
  } catch (error) {
    console.error('Erro ao gerar imagem:', error)
    return null
  }
}

// ==========================================
// ANÁLISE DE IMAGEM (Vision)
// ==========================================

export async function analisarImagemComGemini(
  imageBase64: string,
  mimeType: string,
  pergunta: string
): Promise<ChatResponse> {
  const model = genAI.getGenerativeModel({
    model: MODELOS.gemini.flash,
    systemInstruction: SYSTEM_PROMPT_PREMIUM
  })

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64
      }
    },
    { text: pergunta }
  ])

  const response = result.response

  return {
    resposta: response.text(),
    conversa_id: '',
    tokens_usados: {
      input: Math.ceil(pergunta.length / 4) + 1000, // +1000 para imagem
      output: Math.ceil(response.text().length / 4)
    }
  }
}

// ==========================================
// GERAÇÃO DE CONTEÚDO ESTRUTURADO
// ==========================================

export async function gerarConteudoComGemini(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODELOS.gemini.flash,
    systemInstruction: systemPrompt || SYSTEM_PROMPT_PREMIUM,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  })

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ==========================================
// CONTAR TOKENS (ESTIMATIVA)
// ==========================================

export function estimarTokensGemini(texto: string): number {
  // Estimativa: ~4 caracteres por token
  return Math.ceil(texto.length / 4)
}

// Export do cliente
export { genAI }
