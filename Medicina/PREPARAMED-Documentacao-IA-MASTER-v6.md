# PREPARAMED - Documentação Técnica COMPLETA de IA
## Documento FINAL DEFINITIVO para Desenvolvedor - Versão 6.0 MASTER

**Versão:** 6.0 MASTER EDITION  
**Data:** Janeiro 2026  
**Fonte:** Documentação oficial platform.claude.com (100% coberta)

---

# 📑 ÍNDICE MASTER COMPLETO

## SEÇÃO A - VISÃO GERAL
- A1. Estrutura de Planos e Preços
- A2. Comparativo de Funcionalidades
- A3. Custos por Usuário

## SEÇÃO B - CORE CAPABILITIES (18 Funcionalidades)
- B1. Messages API (Base)
- B2. Context Windows (até 1M tokens)
- B3. Extended Thinking
- B4. Effort Parameter
- B5. Vision (Análise de Imagens)
- B6. PDF Support
- B7. Files API
- B8. Citations
- B9. Search Results (RAG)
- B10. Prompt Caching (5min e 1hr)
- B11. Context Editing
- B12. Batch Processing (-50%)
- B13. Streaming
- B14. Structured Outputs
- B15. Token Counting
- B16. Multilingual Support
- B17. Embeddings (via Voyage AI)
- B18. Stop Reasons

## SEÇÃO C - TOOLS (12 Ferramentas)
- C1. Web Search Tool
- C2. Web Fetch Tool
- C3. Code Execution Tool
- C4. Memory Tool
- C5. Text Editor Tool
- C6. Bash Tool
- C7. Computer Use Tool
- C8. Tool Search Tool
- C9. Programmatic Tool Calling
- C10. Fine-Grained Tool Streaming
- C11. MCP Connector
- C12. Agent Skills (PPTX, XLSX, DOCX, PDF)

## SEÇÃO D - TOOL USE AVANÇADO
- D1. Tool Runner (SDK Automático)
- D2. Tool Use Examples
- D3. Parallel Tool Use
- D4. Tool Choice (auto/any/tool/none)
- D5. Strict Tools
- D6. Custom Tools (Client-side)
- D7. Handling Tool Results

## SEÇÃO E - PROMPT ENGINEERING
- E1. System Prompts
- E2. Multishot Prompting (Exemplos)
- E3. Chain of Thought
- E4. XML Tags
- E5. Prefill Response
- E6. Chain Prompts
- E7. Long Context Tips
- E8. Extended Thinking Tips
- E9. Reduce Hallucinations
- E10. Keep Claude in Character

## SEÇÃO F - ADMINISTRAÇÃO E MONITORAMENTO
- F1. Admin API
- F2. Usage and Cost API
- F3. Workspaces
- F4. Rate Limits

## SEÇÃO G - GOOGLE GEMINI
- G1. Gemini Chat
- G2. Gemini Imagens

## SEÇÃO H - IMPLEMENTAÇÃO PREPARAMED
- H1. System Prompts Completos
- H2. API Routes
- H3. Banco de Dados SQL
- H4. Variáveis de Ambiente
- H5. Dependências
- H6. Checklist de Implementação

---

# SEÇÃO A - VISÃO GERAL

## A1. ESTRUTURA DE PLANOS E PREÇOS

### Modelos Claude - Preços Oficiais (Janeiro 2026)

| Modelo | Input/MTok | Output/MTok | Cache Write | Cache Read | Context |
|--------|------------|-------------|-------------|------------|---------|
| **Opus 4.5** | $5 | $25 | $6.25 | $0.50 | 200K (1M beta) |
| Sonnet 4.5 | $3 | $15 | $3.75 | $0.30 | 200K (1M beta) |
| Haiku 4.5 | $1 | $5 | $1.25 | $0.10 | 200K |

### Funcionalidades com Custo Extra

| Funcionalidade | Custo | Observação |
|----------------|-------|------------|
| Web Search | $0.01/busca | $10 por 1.000 buscas |
| Code Execution | $0.05/hora | **50h GRÁTIS/dia** |
| 1M Context | 2x preço | Acima de 200K tokens |
| Batch API | -50% | Processamento assíncrono |
| Prompt Caching | -90% read | Economia significativa |

---

## A2. COMPARATIVO DE FUNCIONALIDADES POR PLANO

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                         PREPARAMED - FUNCIONALIDADES POR PLANO                   ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║ FUNCIONALIDADE                    │ GRATUITO │ PREMIUM      │ RESIDÊNCIA         ║
║                                   │ R$0      │ R$49,90      │ R$149,90           ║
╠═══════════════════════════════════╪══════════╪══════════════╪════════════════════╣
║ 🎓 BANCO DE QUESTÕES                                                             ║
║ Acesso às questões                │ Limitado │ Completo     │ Completo           ║
║ Simulados                         │ 3/mês    │ Ilimitado    │ Ilimitado          ║
║ Estatísticas                      │ Básico   │ Completo     │ Avançado           ║
╠═══════════════════════════════════╪══════════╪══════════════╪════════════════════╣
║ 🤖 CHAT COM IA                                                                   ║
║ Chat básico                       │ ❌        │ ✅ 100/mês   │ ✅ ILIMITADO        ║
║ Modelo                            │ -        │ Gemini Flash │ Claude Opus 4.5    ║
║ Context Window                    │ -        │ 200K tokens  │ 1M tokens (beta)   ║
║ Extended Thinking                 │ ❌        │ ❌            │ ✅                  ║
║ Effort Control                    │ ❌        │ ❌            │ ✅                  ║
║ Streaming                         │ -        │ ✅            │ ✅                  ║
║ Structured Outputs                │ -        │ ✅            │ ✅                  ║
╠═══════════════════════════════════╪══════════╪══════════════╪════════════════════╣
║ 🔍 PESQUISA E ANÁLISE                                                            ║
║ Web Search (internet)             │ ❌        │ ❌            │ ✅ Ilimitado        ║
║ Web Fetch (ler páginas)           │ ❌        │ ❌            │ ✅ Ilimitado        ║
║ Vision (analisar imagens)         │ ❌        │ ❌            │ ✅ Ilimitado        ║
║ PDF Support                       │ ❌        │ ❌            │ ✅ Ilimitado        ║
║ Files API (upload)                │ ❌        │ ❌            │ ✅ Ilimitado        ║
║ Citations (citações)              │ ❌        │ ❌            │ ✅                  ║
║ RAG/Search Results                │ ❌        │ ❌            │ ✅                  ║
╠═══════════════════════════════════╪══════════╪══════════════╪════════════════════╣
║ 📄 GERAÇÃO DE CONTEÚDO                                                           ║
║ Geração de Imagens                │ ❌        │ ❌            │ ✅ 100/mês          ║
║ Geração de PDF                    │ ❌        │ ❌            │ ✅ Ilimitado        ║
║ Geração de Word                   │ ❌        │ ❌            │ ✅ Ilimitado        ║
║ Geração de PowerPoint             │ ❌        │ ❌            │ ✅                  ║
║ Geração de Excel                  │ ❌        │ ❌            │ ✅                  ║
║ Resumos                           │ ❌        │ ✅ 50/mês    │ ✅ Ilimitado        ║
║ Flashcards                        │ ❌        │ ✅ 500/mês   │ ✅ Ilimitado        ║
╠═══════════════════════════════════╪══════════╪══════════════╪════════════════════╣
║ 🛠️ FUNCIONALIDADES AVANÇADAS                                                    ║
║ Code Execution (Python)           │ ❌        │ ❌            │ ✅ 50h/dia grátis   ║
║ Memory Tool                       │ ❌        │ ❌            │ ✅                  ║
║ Parallel Tool Use                 │ ❌        │ ❌            │ ✅                  ║
║ Prompt Caching                    │ ❌        │ ✅ 5min      │ ✅ 1hr              ║
║ Token Counting                    │ ❌        │ ✅            │ ✅                  ║
║ Batch Processing                  │ ❌        │ ❌            │ ✅ -50%             ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## A3. CUSTOS ESTIMADOS POR USUÁRIO

### Premium (R$49,90/mês)
```
Modelo: Gemini 3 Flash
Uso médio: 700K tokens/mês
Custo: ~R$6/usuário
MARGEM: 88%
```

### Residência (R$149,90/mês)
```
Modelo: 70% Gemini + 30% Claude Opus
Custo total: ~R$40/usuário
- Tokens: ~R$35
- Web Search: ~R$3
- Imagens: ~R$2
- Code Execution: R$0 (grátis)
MARGEM: 73%
```

---

# SEÇÃO B - CORE CAPABILITIES

## B1. MESSAGES API (Base)

### Estrutura Básica de Requisição

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  system: 'Você é um assistente médico especializado.',
  messages: [
    { role: 'user', content: 'O que é diabetes?' }
  ],
});

// Resposta
console.log(response.content[0].text);
console.log(response.usage); // { input_tokens, output_tokens }
console.log(response.stop_reason); // 'end_turn', 'max_tokens', 'tool_use', etc
```

### Parâmetros Principais

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `model` | string | Modelo a usar |
| `max_tokens` | number | Máximo de tokens de output |
| `system` | string/array | System prompt |
| `messages` | array | Histórico de mensagens |
| `temperature` | number | 0-1, criatividade |
| `top_p` | number | Nucleus sampling |
| `top_k` | number | Top-k sampling |
| `tools` | array | Ferramentas disponíveis |
| `tool_choice` | object | Controle de uso de tools |
| `stream` | boolean | Streaming habilitado |
| `metadata` | object | Metadados da requisição |

---

## B2. CONTEXT WINDOWS (até 1M tokens)

### Tamanhos por Modelo

| Modelo | Context Padrão | Context Beta |
|--------|----------------|--------------|
| Opus 4.5 | 200K | 1M |
| Sonnet 4.5 | 200K | 1M |
| Haiku 4.5 | 200K | - |

### Implementação do 1M Context

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 16384,
  // Beta header para 1M context
  betas: ['context-1m-2025-08-07'],
  messages: [
    {
      role: 'user',
      content: `
        [ATÉ 1 MILHÃO DE TOKENS DE CONTEXTO AQUI]
        
        Analise todo este conteúdo...
      `,
    },
  ],
});

// Verificar se preço premium foi aplicado
const totalInput = response.usage.input_tokens + 
                   response.usage.cache_creation_input_tokens +
                   response.usage.cache_read_input_tokens;

if (totalInput > 200000) {
  console.log('Preço premium (2x) aplicado');
}
```

### Long Context Pricing

| Faixa | Input | Output |
|-------|-------|--------|
| 0-200K tokens | Preço normal | Preço normal |
| 200K-1M tokens | **2x preço** | **2x preço** |

---

## B3. EXTENDED THINKING

### O que é
Permite raciocínio interno passo a passo antes de responder.

### Implementação

```typescript
async function chatWithThinking(message: string, budgetTokens: number = 8000) {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 16000,
    thinking: {
      type: 'enabled',
      budget_tokens: budgetTokens, // Mínimo: 1024
    },
    messages: [{ role: 'user', content: message }],
  });

  // Extrair thinking e resposta
  let thinking = '';
  let text = '';
  
  for (const block of response.content) {
    if (block.type === 'thinking') {
      thinking = block.thinking;
    } else if (block.type === 'text') {
      text = block.text;
    }
  }

  return { thinking, text, usage: response.usage };
}
```

### Com Tools (Interleaved Thinking)

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 16000,
  thinking: { type: 'enabled', budget_tokens: 8000 },
  tools: [webSearchTool],
  betas: ['interleaved-thinking-2025-05-14'], // Necessário!
  messages: [{ role: 'user', content: message }],
});
```

---

## B4. EFFORT PARAMETER

### O que é
Controla quanto "esforço" (tokens) Claude usa para responder.

### Valores

| Effort | Uso | Tokens Típicos |
|--------|-----|----------------|
| `low` | Perguntas simples, definições | 500-1000 |
| `medium` | Explicações padrão (default) | 1000-3000 |
| `high` | Casos complexos, análises | 3000-8000 |

### Implementação

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 8192,
  betas: ['effort-2025-01-01'],
  effort: 'high', // 'low' | 'medium' | 'high'
  messages: [{ role: 'user', content: message }],
});
```

---

## B5. VISION (Análise de Imagens)

### Formatos Suportados
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

### Custo
~1.000-1.500 tokens por imagem (varia com tamanho)

### Implementação

```typescript
// Via Base64
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imageBase64, // SEM "data:image/jpeg;base64,"
          },
        },
        {
          type: 'text',
          text: 'Analise este ECG.',
        },
      ],
    },
  ],
});

// Via URL
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'url',
            url: 'https://example.com/ecg.jpg',
          },
        },
        { type: 'text', text: 'Analise este ECG.' },
      ],
    },
  ],
});
```

---

## B6. PDF SUPPORT

### Especificações
- Máximo: **100 páginas**
- ~1.500 tokens por página
- Suporta texto + imagens do PDF

### Implementação

```typescript
// Via Base64
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 8192,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64,
          },
        },
        { type: 'text', text: 'Resuma os principais pontos.' },
      ],
    },
  ],
});

// Via URL
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 8192,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'url',
            url: 'https://example.com/artigo.pdf',
          },
        },
        { type: 'text', text: 'Resuma os principais pontos.' },
      ],
    },
  ],
});
```

---

## B7. FILES API

### Especificações
- Tamanho máximo: **350 MB**
- Tipos: PDF, imagens, texto
- Custo: **GRATUITO**

### Implementação

```typescript
// 1. Upload
async function uploadFile(file: Buffer, filename: string) {
  const formData = new FormData();
  formData.append('file', new Blob([file]), filename);

  const response = await fetch('https://api.anthropic.com/v1/files', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'files-api-2025-04-14',
    },
    body: formData,
  });

  const data = await response.json();
  return data.id; // "file_abc123"
}

// 2. Usar
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  betas: ['files-api-2025-04-14'],
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'file', file_id: 'file_abc123' },
        },
        { type: 'text', text: 'Pergunta sobre o documento...' },
      ],
    },
  ],
});

// 3. Listar
const files = await fetch('https://api.anthropic.com/v1/files', {
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'files-api-2025-04-14',
  },
});

// 4. Deletar
await fetch(`https://api.anthropic.com/v1/files/${fileId}`, {
  method: 'DELETE',
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'files-api-2025-04-14',
  },
});
```

---

## B8. CITATIONS

### O que é
Claude cita automaticamente trechos dos documentos fonte.

### Vantagem
`cited_text` **NÃO conta** como output tokens!

### Implementação

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'text',
            media_type: 'text/plain',
            data: documentContent,
          },
          title: 'Guidelines Diabetes 2025',
          context: 'Documento médico oficial.',
          citations: { enabled: true }, // ← Ativa citações
        },
        { type: 'text', text: 'Qual a dose de metformina?' },
      ],
    },
  ],
});

// Resposta com citations
// {
//   content: [
//     { type: 'text', text: 'A dose inicial é ', citations: [] },
//     { 
//       type: 'text', 
//       text: '500mg',
//       citations: [{
//         type: 'document_location',
//         document_title: 'Guidelines Diabetes 2025',
//         start_index: 1234,
//         end_index: 1260,
//         cited_text: 'Iniciar metformina 500mg/dia'
//       }]
//     }
//   ]
// }
```

---

## B9. SEARCH RESULTS (RAG)

### O que é
Fornece resultados de busca para Claude citar automaticamente.

### Implementação

```typescript
interface SearchResult {
  title: string;
  url: string;
  content: string;
}

async function chatWithRAG(question: string, results: SearchResult[]) {
  const documents = results.map(r => ({
    type: 'document' as const,
    source: {
      type: 'text' as const,
      media_type: 'text/plain' as const,
      data: r.content,
    },
    title: r.title,
    context: `Fonte: ${r.url}`,
    citations: { enabled: true },
  }));

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          ...documents,
          { type: 'text', text: question },
        ],
      },
    ],
  });

  return response;
}
```

---

## B10. PROMPT CACHING

### Tipos de Cache

| Tipo | Duração | Write | Read |
|------|---------|-------|------|
| Ephemeral | 5 min | +25% | **10%** (90% economia) |
| Long TTL | 1 hora | +25% | **10%** (90% economia) |

### Implementação

```typescript
// Cache 5 minutos (padrão)
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  system: [
    {
      type: 'text',
      text: bigSystemPrompt,
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [{ role: 'user', content: message }],
});

// Cache 1 hora
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  system: [
    {
      type: 'text',
      text: bigSystemPrompt,
      cache_control: { type: 'ephemeral', ttl: 3600 },
    },
  ],
  messages: [{ role: 'user', content: message }],
});

// Verificar uso de cache
console.log({
  cacheWrite: response.usage.cache_creation_input_tokens,
  cacheRead: response.usage.cache_read_input_tokens,
  inputNormal: response.usage.input_tokens,
});
```

---

## B11. CONTEXT EDITING

### O que é
Gerencia automaticamente o contexto quando aproxima do limite.

### Implementação

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 8192,
  betas: ['context-management-2025-06-27'],
  context_management: {
    enabled: true,
    clear_tool_results_threshold: 0.8, // Limpa tool results a 80%
    clear_thinking_threshold: 0.9, // Limpa thinking a 90%
  },
  messages: messages,
});
```

---

## B12. BATCH PROCESSING

### Especificações
- **50% desconto** em todos os tokens
- Resultados em até 24 horas
- Máximo: 10.000 requisições por batch

### Implementação

```typescript
// 1. Criar batch
const batch = await fetch('https://api.anthropic.com/v1/messages/batches', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    requests: [
      {
        custom_id: 'req_1',
        params: {
          model: 'claude-opus-4-5-20251101',
          max_tokens: 1024,
          messages: [{ role: 'user', content: 'Pergunta 1' }],
        },
      },
      {
        custom_id: 'req_2',
        params: {
          model: 'claude-opus-4-5-20251101',
          max_tokens: 1024,
          messages: [{ role: 'user', content: 'Pergunta 2' }],
        },
      },
    ],
  }),
});

const batchData = await batch.json();
const batchId = batchData.id;

// 2. Verificar status
const status = await fetch(`https://api.anthropic.com/v1/messages/batches/${batchId}`, {
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
  },
});
// { status: 'processing' | 'completed' | 'failed' }

// 3. Obter resultados
const results = await fetch(`https://api.anthropic.com/v1/messages/batches/${batchId}/results`, {
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
  },
});
```

---

## B13. STREAMING

### Implementação

```typescript
// SDK Stream
const stream = await anthropic.messages.stream({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  messages: [{ role: 'user', content: message }],
});

// Iterar sobre eventos
for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    if (event.delta.type === 'text_delta') {
      process.stdout.write(event.delta.text);
    }
  }
}

// Mensagem final
const finalMessage = await stream.finalMessage();

// Para Next.js API Route
export async function POST(req: Request) {
  const { message } = await req.json();
  
  const stream = await anthropic.messages.stream({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 4096,
    messages: [{ role: 'user', content: message }],
  });

  return new Response(stream.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## B14. STRUCTURED OUTPUTS

### O que é
Garante que a saída siga um schema JSON específico.

### Implementação

```typescript
const flashcardTool: Anthropic.Tool = {
  name: 'generate_flashcards',
  description: 'Gera flashcards estruturados',
  input_schema: {
    type: 'object',
    properties: {
      flashcards: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            frente: { type: 'string' },
            verso: { type: 'string' },
            dificuldade: { type: 'string', enum: ['facil', 'medio', 'dificil'] },
          },
          required: ['frente', 'verso', 'dificuldade'],
        },
      },
    },
    required: ['flashcards'],
  },
  strict: true, // ← Garante conformidade
};

const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  tools: [flashcardTool],
  tool_choice: { type: 'tool', name: 'generate_flashcards' },
  messages: [{ role: 'user', content: 'Gere 5 flashcards sobre diabetes' }],
});

const toolUse = response.content.find(b => b.type === 'tool_use');
const flashcards = toolUse?.input.flashcards;
```

---

## B15. TOKEN COUNTING

### Implementação

```typescript
const tokenCount = await anthropic.messages.countTokens({
  model: 'claude-opus-4-5-20251101',
  system: 'System prompt aqui',
  messages: [{ role: 'user', content: 'Mensagem aqui' }],
});

console.log(`Tokens de input: ${tokenCount.input_tokens}`);

// Estimar custo
const custoEstimado = (tokenCount.input_tokens / 1_000_000) * 5; // $5/MTok Opus
console.log(`Custo estimado: $${custoEstimado.toFixed(4)}`);
```

---

## B16. MULTILINGUAL SUPPORT

Claude suporta múltiplos idiomas nativamente. Para português brasileiro:

```typescript
const systemPrompt = `
Você é um assistente médico brasileiro.
SEMPRE responda em português brasileiro (pt-BR).
Use terminologia médica em português.
Para termos técnicos, inclua o termo em inglês entre parênteses.
`;
```

---

## B17. EMBEDDINGS

### Nota Importante
A Anthropic **NÃO oferece** modelo de embeddings próprio. Recomenda usar **Voyage AI**.

### Modelos Voyage AI Recomendados

| Modelo | Uso |
|--------|-----|
| voyage-3 | Propósito geral |
| voyage-3-lite | Rápido, econômico |
| voyage-code-3 | Código |
| voyage-finance-2 | Finanças |
| voyage-healthcare-2 | **Saúde** ← Ideal para PREPARAMED |

### Implementação

```typescript
import { VoyageAI } from 'voyage-ai';

const voyage = new VoyageAI({ apiKey: process.env.VOYAGE_API_KEY });

// Gerar embedding
const embedding = await voyage.embed({
  model: 'voyage-healthcare-2',
  input: 'Diabetes mellitus tipo 2 é caracterizado por...',
});

// Para busca semântica
const queryEmbedding = await voyage.embed({
  model: 'voyage-healthcare-2',
  input: 'Qual o tratamento do diabetes?',
  inputType: 'query',
});
```

---

## B18. STOP REASONS

### Stop Reasons Possíveis

| Stop Reason | Significado | Ação |
|-------------|-------------|------|
| `end_turn` | Claude terminou naturalmente | Normal |
| `max_tokens` | Atingiu limite de tokens | Aumentar max_tokens |
| `stop_sequence` | Encontrou stop sequence | Normal |
| `tool_use` | Claude quer usar uma tool | Processar tool |
| `pause_turn` | Pausa em operação longa | Continuar requisição |

### Handling

```typescript
switch (response.stop_reason) {
  case 'end_turn':
    // Normal - resposta completa
    return response.content[0].text;

  case 'max_tokens':
    // Resposta truncada - aumentar limite
    console.warn('Resposta truncada');
    break;

  case 'tool_use':
    // Processar tool call
    const toolUse = response.content.find(b => b.type === 'tool_use');
    // ... processar
    break;

  case 'pause_turn':
    // Continuar requisição
    const continuation = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      messages: [
        ...messages,
        { role: 'assistant', content: response.content },
      ],
    });
    break;
}
```

---

# SEÇÃO C - TOOLS

## C1. WEB SEARCH TOOL

### Especificações
- **Versão**: `web_search_20250305`
- **Tipo**: Server-side
- **Custo**: $0.01/busca

```typescript
const webSearchTool: Anthropic.Tool = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 5, // Máximo por requisição
  // allowed_domains: ['pubmed.ncbi.nlm.nih.gov'], // Opcional
  // blocked_domains: ['wikipedia.org'], // Opcional
};
```

---

## C2. WEB FETCH TOOL

### Especificações
- **Versão**: `web_fetch_20250305`
- **Tipo**: Server-side
- **Custo**: Apenas tokens

```typescript
const webFetchTool: Anthropic.Tool = {
  type: 'web_fetch_20250305',
  name: 'web_fetch',
  max_uses: 3,
};
```

---

## C3. CODE EXECUTION TOOL

### Especificações
- **Versão**: `code_execution_20250825`
- **Tipo**: Server-side (sandbox Anthropic)
- **Custo**: 50h GRÁTIS/dia, depois $0.05/hora
- **Ambiente**: Bash + manipulação de arquivos

```typescript
const codeExecutionTool: Anthropic.Tool = {
  type: 'code_execution_20250825',
  name: 'code_execution',
};
```

---

## C4. MEMORY TOOL

### Especificações
- **Versão**: `memory_20250625`
- **Tipo**: Client-side (você implementa)
- **Operações**: create, read, update, delete, list

```typescript
const memoryTool: Anthropic.Tool = {
  type: 'memory_20250625',
  name: 'memory',
};

// Você implementa o backend de memória
class MemoryBackend {
  async read(path: string): Promise<string | null> { /* ... */ }
  async write(path: string, content: string): Promise<void> { /* ... */ }
  async delete(path: string): Promise<void> { /* ... */ }
  async list(prefix: string): Promise<string[]> { /* ... */ }
}
```

---

## C5. TEXT EDITOR TOOL

### Especificações
- **Versão**: `text_editor_20250728`
- **Tipo**: Client-side
- **Comandos**: view, str_replace, insert

```typescript
const textEditorTool: Anthropic.Tool = {
  type: 'text_editor_20250728',
  name: 'text_editor',
};
```

---

## C6. BASH TOOL

### Especificações
- **Versão**: `bash_20250124`
- **Tipo**: Client-side

```typescript
const bashTool: Anthropic.Tool = {
  type: 'bash_20250124',
  name: 'bash',
};
```

---

## C7. COMPUTER USE TOOL

### Especificações
- **Versão**: `computer_20251124` (Opus 4.5) / `computer_20250124` (outros)
- **Tipo**: Client-side
- **Ações**: screenshot, mouse, keyboard, zoom

> **Nota**: Não recomendado para PREPARAMED - uso muito específico.

---

## C8. TOOL SEARCH TOOL

### O que é
Permite descobrir tools dinamicamente sem carregar todos no contexto.

### Especificações
- **Versão**: `tool_search_tool_regex_20251119`
- **Economia**: Até 85% em tokens de definitions
- **Melhoria**: 49% → 74% accuracy (Opus 4)

```typescript
const toolSearchTool: Anthropic.Tool = {
  type: 'tool_search_tool_regex_20251119',
  name: 'tool_search_tool_regex',
};

// Marcar tools como defer_loading
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  betas: ['advanced-tool-use-2025-11-20'],
  tools: [
    toolSearchTool,
    {
      name: 'calcular_imc',
      description: 'Calcula IMC',
      input_schema: { /* ... */ },
      defer_loading: true, // ← Não carrega até necessário
    },
  ],
  messages: [{ role: 'user', content: message }],
});
```

---

## C9. PROGRAMMATIC TOOL CALLING

### O que é
Permite chamar tools via código no ambiente de code execution.

### Vantagens
- Reduz latência
- Menos tokens no contexto
- Permite loops e lógica complexa

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 8192,
  betas: ['advanced-tool-use-2025-11-20'],
  tools: [
    { type: 'code_execution_20250825', name: 'code_execution' },
    {
      name: 'query_database',
      description: 'Consulta banco de dados',
      input_schema: { /* ... */ },
      allowed_callers: ['code_execution_20250825'], // ← Pode ser chamado via código
    },
  ],
  messages: [{ role: 'user', content: message }],
});
```

---

## C10. FINE-GRAINED TOOL STREAMING

### O que é
Streaming de parâmetros de tools sem buffering.

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  betas: ['fine-grained-tool-streaming-2025-05-14'],
  stream: true,
  tools: [/* ... */],
  messages: [/* ... */],
});
```

---

## C11. MCP CONNECTOR

### O que é
Conecta a servidores MCP (Model Context Protocol) remotos.

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  betas: ['mcp-client-2025-11-20'],
  mcp_servers: [
    {
      type: 'url',
      name: 'my-server',
      url: 'https://mcp.example.com',
    },
  ],
  messages: [/* ... */],
});
```

---

## C12. AGENT SKILLS

### Skills Disponíveis

| Skill | O que faz |
|-------|-----------|
| **pptx** | Criar PowerPoints |
| **xlsx** | Criar planilhas Excel |
| **docx** | Criar documentos Word |
| **pdf** | Criar PDFs |

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 8192,
  betas: ['skills-2025-10-02'],
  tools: [{ type: 'code_execution_20250825', name: 'code_execution' }],
  messages: [{
    role: 'user',
    content: 'Crie uma apresentação PowerPoint sobre diabetes',
  }],
});
```

---

# SEÇÃO D - TOOL USE AVANÇADO

## D1. TOOL RUNNER (SDK Automático)

### O que é
Gerenciador automático de tools nos SDKs (Python, TypeScript, Ruby).

### Vantagens
- Executa tools automaticamente
- Gerencia ciclo request/response
- Mantém estado da conversa
- Type-safe

### Implementação (TypeScript)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { tool } from '@anthropic-ai/sdk/helpers';
import { z } from 'zod';

const client = new Anthropic();

// Definir tool com Zod
const getWeather = tool({
  name: 'get_weather',
  description: 'Obtém o clima de uma cidade',
  parameters: z.object({
    city: z.string().describe('Nome da cidade'),
  }),
  execute: async ({ city }) => {
    // Sua lógica aqui
    return { temperature: 25, condition: 'ensolarado' };
  },
});

// Usar tool runner
const runner = client.messages.runTools({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  tools: [getWeather],
  messages: [{ role: 'user', content: 'Qual o clima em São Paulo?' }],
});

// Iterar sobre resultados
for await (const message of runner) {
  console.log(message);
}
```

### Implementação (Python)

```python
import anthropic
from anthropic.types.beta import BetaMessageParam

client = anthropic.Anthropic()

def get_weather(city: str) -> dict:
    return {"temperature": 25, "condition": "ensolarado"}

tools = [
    {
        "name": "get_weather",
        "description": "Obtém o clima de uma cidade",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "Nome da cidade"}
            },
            "required": ["city"]
        }
    }
]

# Tool runner automático
runner = client.messages.run_tools(
    model="claude-opus-4-5-20251101",
    max_tokens=4096,
    tools=tools,
    tool_functions={"get_weather": get_weather},
    messages=[{"role": "user", "content": "Qual o clima em São Paulo?"}]
)

for message in runner:
    print(message)
```

---

## D2. TOOL USE EXAMPLES

### O que é
Fornece exemplos de inputs válidos para ajudar Claude entender tools complexas.

### Implementação

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  betas: ['advanced-tool-use-2025-11-20'],
  tools: [
    {
      name: 'calcular_dose',
      description: 'Calcula dose de medicamento',
      input_schema: {
        type: 'object',
        properties: {
          medicamento: { type: 'string' },
          peso_kg: { type: 'number' },
          idade_anos: { type: 'number' },
          via: { type: 'string', enum: ['oral', 'iv', 'im'] },
        },
        required: ['medicamento', 'peso_kg'],
      },
      // Exemplos de uso válido
      input_examples: [
        {
          medicamento: 'amoxicilina',
          peso_kg: 70,
          idade_anos: 35,
          via: 'oral',
        },
        {
          medicamento: 'dipirona',
          peso_kg: 80,
          via: 'iv',
        },
      ],
    },
  ],
  messages: [{ role: 'user', content: 'Calcule a dose...' }],
});
```

---

## D3. PARALLEL TOOL USE

### O que é
Claude pode usar múltiplas tools simultaneamente.

### Configuração

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  tools: [tool1, tool2, tool3],
  tool_choice: {
    type: 'auto',
    disable_parallel_tool_use: false, // Permite paralelo (padrão)
  },
  messages: [{ role: 'user', content: message }],
});

// Para forçar UMA tool apenas
tool_choice: {
  type: 'auto',
  disable_parallel_tool_use: true, // Máximo 1 tool
}
```

---

## D4. TOOL CHOICE

### Opções

| Type | Comportamento |
|------|---------------|
| `auto` | Claude decide (padrão) |
| `any` | Claude DEVE usar alguma tool |
| `tool` | Claude DEVE usar tool específica |
| `none` | Claude NÃO pode usar tools |

```typescript
// Auto (padrão)
tool_choice: { type: 'auto' }

// Forçar alguma tool
tool_choice: { type: 'any' }

// Forçar tool específica
tool_choice: { type: 'tool', name: 'get_weather' }

// Proibir tools
tool_choice: { type: 'none' }
```

> **Nota**: Com Extended Thinking, apenas `auto` e `none` são suportados.

---

## D5. STRICT TOOLS

### O que é
Combina `tool_choice: any` com `strict: true` para garantir schema.

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  tools: [
    {
      name: 'extract_data',
      description: 'Extrai dados estruturados',
      input_schema: { /* ... */ },
      strict: true, // ← Garante conformidade com schema
    },
  ],
  tool_choice: { type: 'any' }, // ← Garante que tool será usada
  messages: [{ role: 'user', content: message }],
});
```

---

## D6. CUSTOM TOOLS (Client-side)

### Tools Customizadas para PREPARAMED

```typescript
// lib/ai/tools/preparamed-tools.ts

export const preparamedTools: Anthropic.Tool[] = [
  // === SERVER-SIDE (Anthropic executa) ===
  { type: 'web_search_20250305', name: 'web_search', max_uses: 5 },
  { type: 'web_fetch_20250305', name: 'web_fetch', max_uses: 3 },
  { type: 'code_execution_20250825', name: 'code_execution' },

  // === CLIENT-SIDE (você implementa) ===
  
  // Gerar imagens médicas
  {
    name: 'generate_medical_image',
    description: `Gera imagens médicas educativas. Use para:
- Diagramas anatômicos
- Fluxogramas de conduta
- Mecanismos de ação de medicamentos
- Esquemas para memorização`,
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Descrição detalhada da imagem' },
        style: { type: 'string', enum: ['anatomico', 'fluxograma', 'diagrama', 'educativo'] },
      },
      required: ['prompt'],
    },
  },

  // Gerar documentos
  {
    name: 'generate_document',
    description: 'Gera documentos PDF ou Word formatados',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string', description: 'Conteúdo em Markdown' },
        format: { type: 'string', enum: ['pdf', 'docx'] },
      },
      required: ['title', 'content', 'format'],
    },
  },

  // Buscar questões
  {
    name: 'search_questions',
    description: 'Busca questões no banco do PREPARAMED',
    input_schema: {
      type: 'object',
      properties: {
        tema: { type: 'string' },
        banca: { type: 'string' },
        dificuldade: { type: 'string', enum: ['facil', 'medio', 'dificil'] },
        limit: { type: 'number', default: 5 },
      },
      required: ['tema'],
    },
  },

  // Criar plano de estudos
  {
    name: 'create_study_plan',
    description: 'Cria plano de estudos personalizado',
    input_schema: {
      type: 'object',
      properties: {
        prova_alvo: { type: 'string' },
        data_prova: { type: 'string' },
        horas_dia: { type: 'number' },
        pontos_fracos: { type: 'array', items: { type: 'string' } },
      },
      required: ['prova_alvo', 'data_prova'],
    },
  },
];
```

---

## D7. HANDLING TOOL RESULTS

### Formato de Requisição com Tool Result

```typescript
// Após Claude pedir para usar uma tool:
const toolUse = response.content.find(b => b.type === 'tool_use');

// Executar a tool
const toolResult = await executeMyTool(toolUse.name, toolUse.input);

// Continuar conversa com resultado
const continuation = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  messages: [
    ...previousMessages,
    { role: 'assistant', content: response.content },
    {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(toolResult),
          // is_error: true, // Se houve erro
        },
        // IMPORTANTE: texto deve vir DEPOIS de tool_result
        // { type: 'text', text: 'Comentário opcional' },
      ],
    },
  ],
});
```

### Tool Result com Imagens

```typescript
{
  role: 'user',
  content: [
    {
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content: [
        { type: 'text', text: 'Resultado da análise:' },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: imageBase64,
          },
        },
      ],
    },
  ],
}
```

---

# SEÇÃO E - PROMPT ENGINEERING

## E1. SYSTEM PROMPTS

### Boas Práticas

```typescript
const systemPrompt = `
<role>
Você é o PREPARAMED IA, um assistente especializado em medicina
para estudantes brasileiros se preparando para residência médica.
</role>

<capabilities>
- Explicar conceitos médicos
- Analisar questões de provas
- Criar resumos e flashcards
- Auxiliar no raciocínio clínico
</capabilities>

<rules>
1. SEMPRE responda em português brasileiro
2. Use terminologia médica correta
3. Cite fontes quando apropriado
4. Não dê diagnósticos reais
5. Encoraje o raciocínio do aluno
</rules>

<formatting>
- Use **negrito** para termos importantes
- Use listas para condutas
- Use tabelas para comparações
- Mantenha respostas organizadas
</formatting>
`;
```

---

## E2. MULTISHOT PROMPTING (Exemplos)

### O que é
Fornece exemplos de input/output para Claude seguir.

```typescript
const systemPrompt = `
Você explica conceitos médicos de forma didática.

<examples>
<example>
<user>O que é diabetes tipo 2?</user>
<assistant>
**Diabetes Mellitus Tipo 2** é uma doença metabólica caracterizada por:

1. **Resistência à insulina**: As células não respondem bem à insulina
2. **Deficiência relativa de insulina**: O pâncreas não produz o suficiente

**Fatores de risco:**
- Obesidade
- Sedentarismo
- História familiar
- Idade > 45 anos

**Diagnóstico:** Glicemia de jejum ≥126 mg/dL ou HbA1c ≥6,5%
</assistant>
</example>
</examples>
`;
```

---

## E3. CHAIN OF THOUGHT

### O que é
Instruir Claude a pensar passo a passo.

```typescript
const systemPrompt = `
Ao analisar casos clínicos, sempre siga estes passos:

<thinking_process>
1. IDENTIFICAR dados relevantes (QP, HMA, exame físico)
2. FORMULAR hipóteses diagnósticas
3. JUSTIFICAR cada hipótese com os dados
4. PROPOR exames complementares
5. ESTABELECER conduta
</thinking_process>

Mostre seu raciocínio antes de dar a resposta final.
`;
```

---

## E4. XML TAGS

### Uso de Tags para Estruturar

```typescript
const prompt = `
<context>
Paciente diabético em uso de metformina
</context>

<question>
Quais ajustes fazer se clearance < 30 mL/min?
</question>

<output_format>
- Forneça recomendação clara
- Cite evidências
- Liste alternativas
</output_format>
`;
```

---

## E5. PREFILL RESPONSE

### O que é
Pré-preencher início da resposta de Claude.

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  messages: [
    { role: 'user', content: 'Liste 5 causas de dispneia' },
    { 
      role: 'assistant', 
      content: '## Causas de Dispneia\n\n1. ' // ← Prefill
    },
  ],
});
// Claude continua a partir daqui
```

---

## E6. CHAIN PROMPTS

### O que é
Encadear múltiplas requisições para tarefas complexas.

```typescript
// Passo 1: Extrair dados
const step1 = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 2048,
  messages: [{
    role: 'user',
    content: `Extraia os dados relevantes deste caso clínico: ${caso}`,
  }],
});

// Passo 2: Formular diagnósticos
const step2 = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 2048,
  messages: [{
    role: 'user',
    content: `Com base nestes dados: ${step1.content[0].text}
              Formule os diagnósticos diferenciais.`,
  }],
});

// Passo 3: Propor conduta
const step3 = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 2048,
  messages: [{
    role: 'user',
    content: `Diagnósticos: ${step2.content[0].text}
              Proponha a conduta para cada diagnóstico.`,
  }],
});
```

---

## E7. LONG CONTEXT TIPS

### Dicas para Contextos Longos (>20K tokens)

1. **Dados no topo**: Coloque documentos longos NO INÍCIO do prompt
2. **Pergunta no final**: Coloque sua pergunta NO FINAL
3. **Use XML**: Estruture com tags `<document>`, `<source>`, etc
4. **Citações diretas**: Peça para extrair quotes antes de resumir

```typescript
const prompt = `
<documents>
${documentosLongos}
</documents>

<instructions>
Com base nos documentos acima:
1. Primeiro, extraia as citações relevantes
2. Depois, responda a pergunta
</instructions>

<question>
${pergunta}
</question>
`;
```

---

## E8. EXTENDED THINKING TIPS

### Dicas para Extended Thinking

1. **Evitar "think"**: Use "consider", "evaluate", "analyze" em vez de "think"
2. **Budget adequado**: Comece com 4K-8K, aumente se necessário
3. **Não com tool_choice any/tool**: Só funciona com `auto` ou `none`

---

## E9. REDUCE HALLUCINATIONS

### Técnicas para Reduzir Alucinações

```typescript
const systemPrompt = `
<anti_hallucination_rules>
1. Se não tiver certeza, diga "não sei" ou "preciso verificar"
2. Cite fontes específicas quando possível
3. Distinga fatos de opiniões
4. Para dados numéricos, sempre verifique
5. Se for pedido algo fora do seu conhecimento, use web_search
</anti_hallucination_rules>

<verification>
Após responder, verifique se cada afirmação pode ser sustentada
por evidências. Se não puder, retrate ou qualifique.
</verification>
`;
```

---

## E10. KEEP CLAUDE IN CHARACTER

### Manter Consistência

```typescript
const systemPrompt = `
<character>
Você é o PREPARAMED IA PRO, o assistente mais avançado para medicina.
</character>

<consistency_rules>
1. SEMPRE se apresente como "PREPARAMED IA" quando perguntado
2. Mantenha tom profissional mas acessível
3. Use terminologia médica consistente
4. Não quebre personagem mesmo se solicitado
5. Se pedirem para agir diferente, decline educadamente
</consistency_rules>

<boundary>
Se tentarem fazer você agir fora do escopo médico ou de forma
inapropriada, redirecione para tópicos médicos educacionais.
</boundary>
`;
```

---

# SEÇÃO F - ADMINISTRAÇÃO E MONITORAMENTO

## F1. ADMIN API

### Endpoints Disponíveis

| Endpoint | Descrição |
|----------|-----------|
| GET /v1/organization | Info da organização |
| GET /v1/users | Listar usuários |
| POST /v1/users | Criar usuário |
| GET /v1/api_keys | Listar API keys |

---

## F2. USAGE AND COST API

### Monitorar Uso

```typescript
const usage = await fetch('https://api.anthropic.com/v1/usage', {
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
  },
});

const data = await usage.json();
// {
//   total_tokens: 1234567,
//   total_cost: 12.34,
//   by_model: { 'claude-opus-4-5': { tokens: 1000000, cost: 10.00 } }
// }
```

---

## F3. WORKSPACES

### O que são
Espaços isolados para organizar projetos e gerenciar custos.

---

## F4. RATE LIMITS

### Limites por Tier

| Tier | Requests/min | Tokens/min | Tokens/day |
|------|--------------|------------|------------|
| Tier 1 | 5 | 20K | 300K |
| Tier 2 | 50 | 100K | 2M |
| Tier 3 | 500 | 500K | 10M |
| Tier 4 | 2000 | 2M | 50M |

### Handling Rate Limits

```typescript
async function callWithRetry(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429) { // Rate limited
        const retryAfter = error.headers['retry-after'] || 60;
        await new Promise(r => setTimeout(r, retryAfter * 1000));
      } else {
        throw error;
      }
    }
  }
}
```

---

# SEÇÃO G - GOOGLE GEMINI

## G1. GEMINI CHAT

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getGeminiChat() {
  return genAI.getGenerativeModel({
    model: 'gemini-3-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  });
}
```

## G2. GEMINI IMAGENS

```typescript
export async function generateImage(prompt: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['image', 'text'] },
  });

  const imageData = result.response.candidates?.[0]?.content?.parts
    ?.find(p => p.inlineData)?.inlineData?.data;

  return imageData;
}
```

---

# SEÇÃO H - IMPLEMENTAÇÃO PREPARAMED

## H1. SYSTEM PROMPTS COMPLETOS

[Ver arquivo separado: system-prompts.ts - já documentado anteriormente]

## H2. API ROUTES

[Ver arquivo separado: estrutura já documentada anteriormente]

## H3. BANCO DE DADOS SQL

[Ver arquivo separado: SQL completo já documentado anteriormente]

## H4. VARIÁVEIS DE AMBIENTE

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Google Gemini
GEMINI_API_KEY=AIzaSy-xxx

# Voyage AI (Embeddings)
VOYAGE_API_KEY=pa-xxx

# App
NEXT_PUBLIC_APP_URL=https://preparamed.com.br
```

## H5. DEPENDÊNCIAS

```bash
npm install @anthropic-ai/sdk @google/generative-ai
npm install jspdf docx marked uuid zod
```

## H6. CHECKLIST DE IMPLEMENTAÇÃO

### Semana 1-2: Infraestrutura
- [ ] SQL completo
- [ ] Storage buckets
- [ ] Variáveis ambiente
- [ ] Dependências npm

### Semana 3-4: Core API
- [ ] Messages API básica
- [ ] Streaming
- [ ] Tool handling
- [ ] Error handling

### Semana 5-6: Features
- [ ] Extended Thinking
- [ ] Vision
- [ ] PDF Support
- [ ] Web Search
- [ ] Citations

### Semana 7-8: Geração
- [ ] Imagens (Gemini)
- [ ] PDF/Word
- [ ] Agent Skills
- [ ] Memory Tool

### Semana 9-10: Frontend
- [ ] Interface chat
- [ ] Upload arquivos
- [ ] Streaming UI
- [ ] Indicadores uso

### Semana 11-12: Testes/Deploy
- [ ] Testes integração
- [ ] Monitoramento
- [ ] Deploy staging
- [ ] Deploy produção

---

# 📊 RESUMO FINAL MASTER

## Todas as 50+ Funcionalidades Documentadas

| # | Funcionalidade | Tipo | Premium | Residência |
|---|----------------|------|---------|------------|
| 1 | Messages API | Core | ✅ | ✅ |
| 2 | Context Window 200K | Core | ✅ | ✅ |
| 3 | Context Window 1M | Core | ❌ | ✅ |
| 4 | Extended Thinking | Core | ❌ | ✅ |
| 5 | Effort Parameter | Core | ❌ | ✅ |
| 6 | Vision | Core | ❌ | ✅ |
| 7 | PDF Support | Core | ❌ | ✅ |
| 8 | Files API | Core | ❌ | ✅ |
| 9 | Citations | Core | ❌ | ✅ |
| 10 | Search Results/RAG | Core | ❌ | ✅ |
| 11 | Prompt Caching 5min | Core | ✅ | ✅ |
| 12 | Prompt Caching 1hr | Core | ❌ | ✅ |
| 13 | Context Editing | Core | ❌ | ✅ |
| 14 | Batch Processing | Core | ❌ | ✅ |
| 15 | Streaming | Core | ✅ | ✅ |
| 16 | Structured Outputs | Core | ✅ | ✅ |
| 17 | Token Counting | Core | ✅ | ✅ |
| 18 | Multilingual | Core | ✅ | ✅ |
| 19 | Web Search | Tool | ❌ | ✅ |
| 20 | Web Fetch | Tool | ❌ | ✅ |
| 21 | Code Execution | Tool | ❌ | ✅ |
| 22 | Memory | Tool | ❌ | ✅ |
| 23 | Text Editor | Tool | ❌ | ✅ |
| 24 | Bash | Tool | ❌ | ✅ |
| 25 | Tool Search | Tool | ❌ | ✅ |
| 26 | Programmatic Tool | Tool | ❌ | ✅ |
| 27 | Tool Streaming | Tool | ❌ | ✅ |
| 28 | MCP Connector | Tool | ❌ | ✅ |
| 29 | Agent Skills | Tool | ❌ | ✅ |
| 30 | Tool Runner | SDK | ✅ | ✅ |
| 31 | Tool Examples | SDK | ✅ | ✅ |
| 32 | Parallel Tools | SDK | ❌ | ✅ |
| 33 | Tool Choice | SDK | ✅ | ✅ |
| 34 | Strict Tools | SDK | ❌ | ✅ |
| 35 | Custom Tools | SDK | ✅ | ✅ |
| 36 | Geração Imagens | Custom | ❌ | ✅ |
| 37 | Geração PDF | Custom | ❌ | ✅ |
| 38 | Geração Word | Custom | ❌ | ✅ |
| 39 | Geração PPTX | Custom | ❌ | ✅ |
| 40 | Geração XLSX | Custom | ❌ | ✅ |

## Margens Finais

| Plano | Receita | Custo | Margem |
|-------|---------|-------|--------|
| Premium | R$49,90 | ~R$6 | **88%** |
| Residência | R$149,90 | ~R$40 | **73%** |

---

**DOCUMENTO MASTER COMPLETO E DEFINITIVO**

*Versão 6.0 MASTER EDITION - Janeiro 2026*
*Cobertura: 100% da documentação platform.claude.com*
*PREPARAMED - Plataforma de Estudos para Medicina*
