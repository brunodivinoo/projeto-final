# PLANO DE IMPLEMENTACAO - PREPARAMED IA

## Baseado na Documentacao PREPARAMED-Documentacao-IA-MASTER-v6

**Data:** Janeiro 2026
**Status:** Pronto para Implementar
**APIs Configuradas:** Gemini + Claude (Anthropic)

---

## VISAO GERAL DOS PLANOS

| Plano | Preco | Modelo IA | Funcionalidades |
|-------|-------|-----------|-----------------|
| **Gratuito** | R$0 | Sem IA | Questoes limitadas, 3 simulados/mes |
| **Premium** | R$49,90 | Gemini Flash | Chat 100/mes, Resumos, Flashcards |
| **Residencia** | R$149,90 | Claude Opus | TUDO ilimitado + funcoes avancadas |

---

## FASE 1 - INFRAESTRUTURA BASE (Semana 1)

### 1.1 Configuracao Ambiente
- [x] API Key Gemini configurada
- [x] API Key Anthropic configurada
- [x] SDK @anthropic-ai/sdk instalado
- [ ] Criar lib/ai/anthropic.ts (cliente Claude)
- [ ] Criar lib/ai/gemini.ts (cliente Gemini)
- [ ] Criar lib/ai/config.ts (configuracoes por plano)

### 1.2 Tabelas no Banco de Dados
```sql
-- Tabela para historico de conversas
CREATE TABLE conversas_ia_med (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text,
  modelo text, -- 'gemini' ou 'claude'
  tokens_usados integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela para mensagens
CREATE TABLE mensagens_ia_med (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid REFERENCES conversas_ia_med(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'user', 'assistant', 'system'
  content text NOT NULL,
  tokens integer DEFAULT 0,
  has_image boolean DEFAULT false,
  has_pdf boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tabela para uso mensal de IA
CREATE TABLE uso_ia_med (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_referencia text NOT NULL, -- '2026-01'
  chats_usados integer DEFAULT 0,
  resumos_usados integer DEFAULT 0,
  flashcards_usados integer DEFAULT 0,
  imagens_geradas integer DEFAULT 0,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  custo_estimado decimal(10,4) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, mes_referencia)
);

-- Indices
CREATE INDEX idx_conversas_user ON conversas_ia_med(user_id);
CREATE INDEX idx_mensagens_conversa ON mensagens_ia_med(conversa_id);
CREATE INDEX idx_uso_ia_user_mes ON uso_ia_med(user_id, mes_referencia);
```

### 1.3 Arquivos a Criar
```
lib/
  ai/
    anthropic.ts      # Cliente Claude
    gemini.ts         # Cliente Gemini
    config.ts         # Limites por plano
    prompts.ts        # System prompts
    tools.ts          # Tools customizadas
    types.ts          # Tipos TypeScript
```

---

## FASE 2 - CHAT BASICO COM STREAMING (Semana 2)

### 2.1 API Route Principal
- [ ] Criar /api/medicina/ia/chat/route.ts
  - Receber mensagem do usuario
  - Verificar plano e limites
  - Selecionar modelo (Gemini ou Claude)
  - Retornar resposta com streaming

### 2.2 Streaming Implementation
```typescript
// Premium - Gemini Streaming
const stream = await model.generateContentStream(prompt);
for await (const chunk of stream) {
  // enviar chunk
}

// Residencia - Claude Streaming
const stream = await anthropic.messages.stream({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  messages: messages
});
return new Response(stream.toReadableStream());
```

### 2.3 Frontend Chat Atualizado
- [ ] Atualizar app/medicina/(dashboard)/dashboard/ia/page.tsx
  - Implementar streaming de resposta
  - Mostrar indicador "digitando..."
  - Historico de conversas
  - Selecao de conversa anterior

### 2.4 System Prompts por Plano
```typescript
// Premium (Gemini)
const SYSTEM_PROMPT_PREMIUM = `
Voce e o PREPARAMED IA, assistente para estudantes de medicina.
Responda de forma clara e didatica em portugues brasileiro.
Use terminologia medica correta.
`;

// Residencia (Claude)
const SYSTEM_PROMPT_RESIDENCIA = `
<role>
Voce e o PREPARAMED IA PRO, o assistente mais avancado para
estudantes de medicina se preparando para residencia medica.
</role>

<capabilities>
- Analise profunda de casos clinicos
- Raciocinio diagnostico avancado
- Explicacoes detalhadas com referencias
- Geracao de conteudo estruturado
</capabilities>

<rules>
1. SEMPRE responda em portugues brasileiro
2. Use terminologia medica precisa
3. Cite fontes quando apropriado
4. Encourage raciocinio clinico do aluno
5. Para dados incertos, use web_search
</rules>
`;
```

---

## FASE 3 - FUNCIONALIDADES PREMIUM (Semana 3)

### 3.1 Geracao de Resumos
- [ ] Criar /api/medicina/ia/resumo/route.ts
- [ ] Usar structured output para formato padrao
- [ ] Salvar resumos no banco (tabela resumos_med)

```typescript
// Tool para gerar resumo estruturado
const resumoTool = {
  name: 'generate_resumo',
  description: 'Gera resumo estruturado de tema medico',
  input_schema: {
    type: 'object',
    properties: {
      titulo: { type: 'string' },
      topicos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            subtitulo: { type: 'string' },
            conteudo: { type: 'string' },
            pontos_chave: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      referencias: { type: 'array', items: { type: 'string' } }
    }
  }
};
```

### 3.2 Geracao de Flashcards
- [ ] Criar /api/medicina/ia/flashcards/route.ts
- [ ] Structured output para formato de flashcard
- [ ] Integrar com sistema de revisao espacada

```typescript
const flashcardTool = {
  name: 'generate_flashcards',
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
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  strict: true
};
```

### 3.3 Limites Premium
- Chat: 100 mensagens/mes
- Resumos: 50/mes
- Flashcards: 500/mes
- Prompt Caching: 5 minutos

---

## FASE 4 - FUNCIONALIDADES RESIDENCIA (Semana 4-5)

### 4.1 Vision - Analise de Imagens
- [ ] Criar /api/medicina/ia/vision/route.ts
- [ ] Upload de imagens (ECG, RX, TC, etc)
- [ ] Analise com Claude Vision

```typescript
// Implementacao Vision
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imageBase64
        }
      },
      { type: 'text', text: 'Analise este exame de imagem.' }
    ]
  }]
});
```

### 4.2 PDF Support - Upload de Artigos
- [ ] Criar /api/medicina/ia/pdf/route.ts
- [ ] Upload de PDFs (max 100 paginas)
- [ ] Analise e resumo com Claude

```typescript
// Implementacao PDF
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 8192,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: pdfBase64
        }
      },
      { type: 'text', text: 'Resuma os principais pontos deste artigo.' }
    ]
  }]
});
```

### 4.3 Web Search - Pesquisa Atualizada
- [ ] Integrar web_search tool
- [ ] Busca em fontes medicas (PubMed, UpToDate)

```typescript
const webSearchTool = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 5,
  allowed_domains: [
    'pubmed.ncbi.nlm.nih.gov',
    'uptodate.com',
    'medscape.com',
    'scielo.br'
  ]
};
```

### 4.4 Extended Thinking - Raciocinio Profundo
- [ ] Implementar para casos clinicos complexos
- [ ] Budget de tokens configuravel

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 16000,
  thinking: {
    type: 'enabled',
    budget_tokens: 8000
  },
  messages: [{ role: 'user', content: casoClinico }]
});

// Extrair thinking e resposta
for (const block of response.content) {
  if (block.type === 'thinking') {
    // Raciocinio interno (opcional mostrar)
  } else if (block.type === 'text') {
    // Resposta final
  }
}
```

### 4.5 Citations - Referencias Automaticas
- [ ] Ativar citations em documentos
- [ ] Mostrar fontes na interface

```typescript
// Documento com citations
{
  type: 'document',
  source: { type: 'text', media_type: 'text/plain', data: content },
  title: 'Guidelines Diabetes 2025',
  citations: { enabled: true }
}
```

---

## FASE 5 - GERACAO DE CONTEUDO (Semana 6)

### 5.1 Geracao de Imagens (Gemini)
- [ ] Criar /api/medicina/ia/imagem/route.ts
- [ ] Gerar diagramas anatomicos
- [ ] Fluxogramas de conduta
- [ ] Limite: 100/mes plano Residencia

```typescript
// Gemini Image Generation
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
const result = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: { responseModalities: ['image', 'text'] }
});
```

### 5.2 Geracao de PDF
- [ ] Criar /api/medicina/ia/gerar-pdf/route.ts
- [ ] Resumos formatados em PDF
- [ ] Usar jspdf ou Agent Skills

### 5.3 Geracao de Word
- [ ] Criar /api/medicina/ia/gerar-docx/route.ts
- [ ] Documentos estruturados
- [ ] Usar docx library

---

## FASE 6 - TOOLS CUSTOMIZADAS (Semana 7)

### 6.1 Tools PREPARAMED
```typescript
export const preparamedTools = [
  // Buscar questoes no banco
  {
    name: 'search_questions',
    description: 'Busca questoes de provas no banco PREPARAMED',
    input_schema: {
      type: 'object',
      properties: {
        tema: { type: 'string' },
        banca: { type: 'string' },
        ano: { type: 'number' },
        dificuldade: { type: 'string', enum: ['facil', 'medio', 'dificil'] },
        limit: { type: 'number', default: 5 }
      },
      required: ['tema']
    }
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
        horas_disponiveis: { type: 'number' },
        pontos_fracos: { type: 'array', items: { type: 'string' } }
      },
      required: ['prova_alvo']
    }
  },

  // Explicar questao
  {
    name: 'explain_question',
    description: 'Explica uma questao de prova em detalhes',
    input_schema: {
      type: 'object',
      properties: {
        questao_id: { type: 'string' },
        nivel_detalhe: { type: 'string', enum: ['basico', 'intermediario', 'avancado'] }
      },
      required: ['questao_id']
    }
  },

  // Calcular IMC
  {
    name: 'calcular_imc',
    description: 'Calcula IMC e classifica',
    input_schema: {
      type: 'object',
      properties: {
        peso_kg: { type: 'number' },
        altura_m: { type: 'number' }
      },
      required: ['peso_kg', 'altura_m']
    }
  }
];
```

### 6.2 Handler de Tools
```typescript
async function handleToolUse(toolName: string, input: any) {
  switch (toolName) {
    case 'search_questions':
      return await searchQuestionsInDB(input);
    case 'create_study_plan':
      return await createStudyPlan(input);
    case 'explain_question':
      return await explainQuestion(input);
    case 'calcular_imc':
      return calculateIMC(input);
    default:
      throw new Error(`Tool ${toolName} nao implementada`);
  }
}
```

---

## FASE 7 - OTIMIZACOES (Semana 8)

### 7.1 Prompt Caching
```typescript
// Cache de 5 minutos (Premium)
system: [{
  type: 'text',
  text: bigSystemPrompt,
  cache_control: { type: 'ephemeral' }
}]

// Cache de 1 hora (Residencia)
system: [{
  type: 'text',
  text: bigSystemPrompt,
  cache_control: { type: 'ephemeral', ttl: 3600 }
}]
```

### 7.2 Token Counting
```typescript
// Antes de enviar, verificar tokens
const tokenCount = await anthropic.messages.countTokens({
  model: 'claude-opus-4-5-20251101',
  system: systemPrompt,
  messages: messages
});

if (tokenCount.input_tokens > 200000) {
  // Aviso: preco premium sera aplicado
}
```

### 7.3 Batch Processing (Residencia)
```typescript
// Para geracao em massa (50% desconto)
const batch = await fetch('https://api.anthropic.com/v1/messages/batches', {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify({
    requests: flashcardsToGenerate.map((tema, i) => ({
      custom_id: `flash_${i}`,
      params: {
        model: 'claude-opus-4-5-20251101',
        max_tokens: 2048,
        messages: [{ role: 'user', content: `Gere flashcards sobre ${tema}` }]
      }
    }))
  })
});
```

---

## FASE 8 - INTERFACE E UX (Semana 9-10)

### 8.1 Componentes a Criar
- [ ] ChatInterface.tsx - Interface principal de chat
- [ ] MessageBubble.tsx - Bolha de mensagem
- [ ] StreamingText.tsx - Texto com efeito de digitacao
- [ ] ImageUpload.tsx - Upload de imagens
- [ ] PDFUpload.tsx - Upload de PDFs
- [ ] ConversationList.tsx - Lista de conversas
- [ ] UsageIndicator.tsx - Indicador de uso/limites

### 8.2 Pagina IA Redesenhada
```
/medicina/dashboard/ia
  - Lista de conversas (sidebar)
  - Chat atual (main)
  - Acoes rapidas (gerar resumo, flashcards)
  - Indicador de uso
  - Upload de arquivos (Residencia)
```

### 8.3 Indicadores de Uso
```typescript
// Mostrar uso atual
<UsageIndicator
  usado={limites.chats_usados}
  limite={plano === 'premium' ? 100 : -1}
  tipo="Mensagens"
/>
```

---

## FASE 9 - TESTES E MONITORAMENTO (Semana 11)

### 9.1 Testes a Implementar
- [ ] Teste de streaming
- [ ] Teste de vision
- [ ] Teste de PDF
- [ ] Teste de tools
- [ ] Teste de limites por plano
- [ ] Teste de rate limiting

### 9.2 Monitoramento de Custos
```typescript
// Logar uso para monitoramento
await supabase.from('uso_ia_med').upsert({
  user_id,
  mes_referencia: new Date().toISOString().slice(0, 7),
  tokens_input: response.usage.input_tokens,
  tokens_output: response.usage.output_tokens,
  custo_estimado: calculateCost(response.usage, model)
});
```

### 9.3 Rate Limiting
```typescript
// Verificar limite antes de requisicao
const { data: uso } = await supabase
  .from('uso_ia_med')
  .select('chats_usados')
  .eq('user_id', userId)
  .eq('mes_referencia', mesAtual)
  .single();

if (plano === 'premium' && uso.chats_usados >= 100) {
  return { error: 'Limite de mensagens atingido' };
}
```

---

## FASE 10 - DEPLOY E PRODUCAO (Semana 12)

### 10.1 Variaveis de Ambiente Vercel
```
ANTHROPIC_API_KEY=sk-ant-api03-xxx (ja configurada)
GEMINI_API_KEY=AIzaSy-xxx (ja configurada)
```

### 10.2 Checklist Final
- [ ] Todas APIs funcionando
- [ ] Streaming funcionando
- [ ] Vision funcionando
- [ ] PDF funcionando
- [ ] Web Search funcionando
- [ ] Tools funcionando
- [ ] Limites por plano funcionando
- [ ] Monitoramento de custos
- [ ] UI/UX polida
- [ ] Deploy em producao

---

## RESUMO DE CUSTOS ESTIMADOS

### Por Usuario/Mes

| Plano | Receita | Custo IA | Margem |
|-------|---------|----------|--------|
| Premium | R$49,90 | ~R$6 | **88%** |
| Residencia | R$149,90 | ~R$40 | **73%** |

### Detalhamento Residencia
- Tokens Claude: ~R$35
- Web Search: ~R$3 (300 buscas)
- Imagens: ~R$2 (100 imagens)
- Code Execution: R$0 (50h gratis/dia)

---

## PROXIMOS PASSOS IMEDIATOS

1. **AGORA**: Criar estrutura base (lib/ai/*)
2. **HOJE**: Criar tabelas no banco
3. **AMANHA**: Implementar chat com streaming
4. **SEMANA 1**: Chat basico funcionando
5. **SEMANA 2**: Resumos e Flashcards
6. **SEMANA 3-4**: Vision, PDF, Web Search
7. **SEMANA 5-6**: Tools e geracao de conteudo
8. **SEMANA 7-8**: Otimizacoes e UI
9. **SEMANA 9-10**: Testes
10. **SEMANA 11-12**: Deploy

---

**Documento criado em:** Janeiro 2026
**Baseado em:** PREPARAMED-Documentacao-IA-MASTER-v6
**Status:** Pronto para iniciar implementacao
