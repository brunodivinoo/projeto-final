# ULTIMO STATUS - PREPARA MED
## Atualizado em: 06/02/2026 - Streaming + Mermaid Cleanup + Otimizacoes

---

## O QUE FOI FEITO NESTA SESSAO (06/02/2026)

### 1. FIX: STREAMING MULTI-AGENTES (EFEITO "ESCREVENDO")

**Problema**: Respostas dos multi-agentes apareciam de uma vez só, sem efeito de streaming gradual.

**Causa raiz**: `streamMultiAgentResponse` esperava toda a geração terminar e enviava chunks de 100 chars com 10ms delay. O chunking cortava code blocks (artefatos) no meio, quebrando a renderização.

**Solução**:
- Nova função `splitTextAndArtifacts()` separa texto de code blocks antes do chunking
- Artefatos (```mermaid, ```flashcards, etc.) são enviados INTEIROS (nunca fragmentados)
- Texto é enviado em chunks de 30 chars com 15ms delay (efeito gradual natural)
- Delay maior (50ms) entre artefatos para dar tempo ao frontend processar

### 2. FIX: CÓDIGO MERMAID CRU NO CHAT

**Problema**: Código Mermaid bruto (nós e setas como `A --> B["texto"]`) aparecia no final das respostas.

**Causa raiz**: `cleanRenderedTextForChat()` só detectava código Mermaid com header `graph TD`/`flowchart TD`. Quando a IA gerava sem header, o código passava pelo filtro.

**Solução**:
- Regex aprimorada para detectar código Mermaid SEM header (3+ linhas com `-->`)
- Limpeza de linhas individuais com padrão `A --> B["texto"]`
- Melhor matching de `classDef` e `class` lines
- `generateMermaidWithAI()` agora detecta e adiciona header `graph TD` quando IA omite

### 3. FEAT: OTIMIZAÇÕES DE VELOCIDADE (sessão anterior)

- Pipeline paralelo: análises independentes executam em paralelo
- `Promise.allSettled` para memória + HF agent context
- Tom natural adicionado aos system prompts
- Correção de acentuação nos crews

---

### SESSÃO ANTERIOR: MEMORIA PERSISTENTE NO PROMPT

**Problema**: `getContextForPrompt()` estava importado mas nao era chamado. A IA nao usava o historico do usuario para personalizar respostas.

**Solucao**: Integrado `getContextForPrompt(user_id)` em 2 caminhos:
- **streamClaude** (principal) - antes do system prompt, busca entidades, topicos e resumos
- **streamComSmartRouter** (fallback) - idem para quando usa OpenAI/Gemini

**Resultado**: A IA agora sabe o que o usuario estudou, suas preferencias e entidades mencionadas anteriormente.

### 2. FEAT: DIAGRAMAS COM IA REAL (Gemini Flash)

**Problema**: Diagramas Mermaid eram templates hardcoded genericos ("Grupo 1", "Subgrupo 1.1", "Definicao e Conceitos").

**Solucao**: Criada funcao `generateMermaidWithAI()` que:
- Usa Gemini Flash (rapido e economico) para gerar Mermaid especifico do tema
- Prompt com regras medicas rigorosas (terminologia correta, 10-20 nos)
- 3 tipos: diagrama (mapa conceitual), fluxograma (clinico), organograma (hierarquia)
- Geracao em paralelo (Promise.all) para multiplos visuais
- Fallback robusto se a IA falhar (templates melhorados com conteudo medico)

### 3. FEAT: QUALIDADE VISUAL DOS DIAGRAMAS

**Problema**: Diagramas tinham apenas 2 classes de estilo basicas.

**Solucao**: 7 classDefs profissionais:
- `root` (roxo) - no raiz principal
- `highlight` (verde) - nos importantes
- `decision` (amarelo/marrom) - nos de decisao
- `danger` (vermelho) - alertas
- `success` (verde) - resultados positivos
- `info` (azul) - informacoes
- `default` (azul escuro) - todos os outros

### 4. FIX: SIDEBAR NAO TROCA DECK

**Problema**: Com a sidebar aberta mostrando Q1, clicar em Q2 ou flashcard nao mudava o conteudo.

**Causa raiz**: `selectArtifact()` era chamado mas o `useEffect` no ArtifactsSidebar nao re-renderizava porque o `selectedArtifactId` ja estava definido (ou o valor era o mesmo).

**Solucao**:
- `openArtifactInSidebar` agora SEMPRE faz deselect+reselect via `requestAnimationFrame`
- Novo `useEffect` que sincroniza quando sidebar abre com selecao pendente
- `useRef` para rastrear mudancas de selecao

### 5. FIX: TITULOS GARBLED NOS ARTEFATOS

**Problema**: Titulos mostravam "cards, oes, a e e o sistema reprodutor feminino" em vez do tema real.

**Causa raiz**: Regex `\d+\s*(quest|...)` removia "2 quest" de "2 questoes", deixando "oes". Alem disso, "cards" nao era removido pela regex de tipos.

**Solucao**: Nova extracao de tema com 3 estrategias:
1. **Prioridade**: buscar topico apos "sobre" (mais confiavel)
2. **Fallback**: buscar topico apos "de/do/da" no final da frase
3. **Ultimo recurso**: remover keywords com regex corrigida + limpar residuos

### 6. FIX: DECKS NAO ABRINDO NA SIDEBAR

**Problema**: Alguns cards no chat nao abriam na sidebar ao clicar.

**Causa raiz**: Matching de artefatos era limitado (so por tipo+messageId). Artefatos de multi-agentes podem nao ter messageId, e o matching por titulo exato falhava.

**Solucao**: 5 niveis de fallback no matching:
1. Tipo + messageId + conteudo (mais preciso)
2. Tipo + messageId + titulo exato
3. Tipo + messageId + titulo parcial (contains)
4. Tipo + messageId (qualquer)
5. Tipo + titulo (sem messageId - para multi-agentes)

---

## ARQUIVOS MODIFICADOS

```
app/api/medicina/ia/chat/route.ts         # getContextForPrompt em 2 caminhos
lib/ai/multiAgentIntegration.ts           # generateMermaidWithAI + fix extracao tema
components/ia/ArtifactRenderer.tsx         # fix openArtifactInSidebar (5 fallbacks)
components/ia/ArtifactsSidebar.tsx         # fix useEffect sincronizacao + useRef
```

---

## COMMITS REALIZADOS NESTA SESSAO

| Hash | Descricao |
|------|-----------|
| `dad3694` | fix: streaming multi-agentes e limpeza de código Mermaid cru no chat |
| `f88b7b4` | feat: otimizar velocidade IA, corrigir acentuação e tom natural |

---

## PR PENDENTE

| Branch | Titulo | Status |
|--------|--------|--------|
| `claude/continue-prepara-med-NYHog` | fix: streaming multi-agentes e limpeza de Mermaid cru | **PUSHED** (criar PR no GitHub) |

---

## STATUS ATUAL DO PROJETO

| Item | Status |
|------|--------|
| Site em producao | https://projeto-final-zeta-navy.vercel.app |
| Memoria Persistente no Prompt | **ATIVO** (getContextForPrompt) |
| Diagramas com IA Real | **ATIVO** (Gemini Flash) |
| Qualidade Visual Diagramas | **7 classDefs profissionais** |
| Sidebar Troca de Deck | **CORRIGIDO** |
| Titulos de Artefatos | **CORRIGIDO** (3 estrategias) |
| Abertura de Decks | **CORRIGIDO** (5 fallbacks) |
| Multi-Agentes na API /chat | **INTEGRADO + CORRIGIDO** |
| Tipos visuais (diagrama/fluxograma/organograma) | **ATIVO** |
| Gabarito Comentado | **ATIVO** |
| TTS Kokoro | **ATIVO** |
| Sugestoes Contextuais | **ATIVO** |
| Fallback Multi-Provider | **ATIVO** |
| Smart Router | **ATIVO** |

---

## PROXIMOS PASSOS SUGERIDOS

1. **Dashboard de agentes** - Pagina admin para visualizar execucoes dos multi-agentes
2. **Testes E2E** - Testar fluxo completo de multi-agentes em producao
3. **Melhorar persistencia de memoria** - Usar memoria para adaptar nivel de dificuldade
4. **Cache de diagramas** - Cachear diagramas gerados para evitar re-geracao
5. **Modo offline** - Service worker para funcionar sem internet

---

## SESSOES ANTERIORES

### Sessao Streaming + Mermaid Cleanup (06/02/2026)
- Fix streaming multi-agentes (efeito "escrevendo")
- Fix código Mermaid cru no chat
- splitTextAndArtifacts() para chunking seguro
- generateMermaidWithAI() com header fix
- Pipeline paralelo + Promise.allSettled
- Tom natural nos prompts
- Correção de acentuação

### Sessao Memoria + Diagramas + Sidebar (06/02/2026)
- Memoria persistente no prompt
- Diagramas com IA real (Gemini Flash)
- Qualidade visual melhorada (7 classDefs)
- Fix sidebar troca de deck
- Fix titulos garbled
- Fix decks nao abrindo
- PR #83 merged

### Sessao Gabarito + TTS + Sugestoes (06/02/2026)
- Gabarito comentado completo
- Sugestoes contextuais pos-resposta
- Botoes de acao (copiar, refazer, ouvir)
- TTS Kokoro via HuggingFace
- Otimizacao de custos (Opus->Sonnet)
- PRs #80-#82 merged

### Sessao Multi-Agentes Fix (06/02/2026)
- Fix renderizacao details/summary
- Titulo inteligente
- Tipos visuais nos multi-agentes
- Feedback visual
- Extracao de entidades expandida
- Memoria persistente integrada
- PR #78 merged

### Sessao Prompts + Auth (03-05/02/2026)
- PRs #55-#77 merged
- Melhorias em prompts, imagens, login, UI, Smart Router
- Suporte a colar imagens + editor
- Otimizacao de custos com Sonnet 4.5

### Sessao Integracao Multi-Agentes (03/02/2026)
- LangChain Orchestrator completo
- Multi-Agentes (StudyPlanCrew, ContentCrew)
- Sistema de memoria persistente (schema)
- PR #55 merged

### Sessao Fallback (03/02/2026)
- Sistema fallback multi-provider (Claude -> Gemini -> OpenAI)
- PR #49 merged

---

## LINKS UTEIS

- Producao: https://projeto-final-zeta-navy.vercel.app
- Chat IA: https://projeto-final-zeta-navy.vercel.app/medicina/dashboard/ia
- GitHub: https://github.com/brunodivinoo/projeto-final
- PR #83: https://github.com/brunodivinoo/projeto-final/pull/83
