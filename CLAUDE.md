# PREPARA MED - Contexto do Projeto

## Visao Geral
Plataforma de educacao medica para preparacao de residencia medica. App web completo com IA multi-modelo, questoes interativas, simulados, flashcards, diagramas e sistema de gamificacao.

- **Producao**: https://projeto-final-zeta-navy.vercel.app
- **Producao Alt**: https://preparamed-navy.vercel.app
- **GitHub**: https://github.com/brunodivinoo/projeto-final
- **Supabase**: https://supabase.com/dashboard/project/zkcstkbpgwdoiihvfspp
- **Vercel**: https://vercel.com/brunos-projects-5f2d50e2/projeto-final

## Tech Stack
- **Framework**: Next.js 15.1.3 (App Router) + React 19 + TypeScript
- **Database**: Supabase (PostgreSQL) - todas tabelas com sufixo `_med`
- **Deploy**: Vercel (auto-deploy no push para main)
- **IA**: Claude Sonnet 4.5 (Premium), Claude Opus 4 (Residencia), Gemini 2.5 Flash (Gratuito)
- **Smart Router**: Roteamento inteligente entre modelos (o4-mini/gpt-5.2/Claude) por complexidade
- **State**: Zustand stores para artefatos e estado global
- **Editor**: TipTap (rich text)
- **Graficos/Diagramas**: Mermaid.js
- **Cache**: ioredis
- **Pagamento**: Cakto (checkout)

## Arquitetura de IA (lib/ai/)
| Arquivo | Funcao |
|---------|--------|
| prompts.ts | System prompts (Premium + Residencia) - arquivo mais critico (~800+ linhas) |
| smart-router.ts | Roteamento inteligente entre modelos por complexidade |
| anthropic.ts | Cliente Claude: streaming, chat, analise de imagem/PDF |
| gemini.ts | Cliente Gemini: chat, imagem, geracao |
| openai-advanced.ts | Integracao OpenAI |
| multi-provider.ts | Fallback: Claude -> Gemini -> OpenAI |
| questionGenerator.ts | Pipeline de geracao de questoes (49KB) |
| intentClassifier.ts | Classificacao de intencao do usuario |
| complexity-detector.ts | Analise de complexidade |
| persistentMemory.ts | Memoria persistente via user_memory_med |
| adaptiveLearning.ts | Algoritmo de aprendizado adaptativo |
| cache.ts | Camada de cache (prompt + response) |
| tools.ts | Ferramentas Anthropic: buscar_questoes, criar_plano_estudos |

## Rotas Principais
```
app/
  medicina/
    (dashboard)/     -> Dashboard, biblioteca, estatisticas, forum, questoes, simulados
    login/           -> Login
    cadastro/        -> Cadastro
    admin/           -> Painel admin (disciplinas, historico, questoes)
  api/
    medicina/ia/chat/route.ts  -> Rota PRINCIPAL do chat com streaming SSE (~2400 linhas)
    medicina/ia/     -> 12+ rotas de IA (chat, pdf, questoes, resumos, vision, web-search)
    simulados/       -> 12 rotas (criar, analisar, ranking, estatisticas)
    estudos/         -> 6 rotas (ciclos, disciplinas, planos, sessoes)
    admin/           -> 11 rotas administrativas
```

## Componentes Principais
```
components/
  ia/
    ChatIA.tsx              -> Componente principal do chat
    ArtifactRenderer.tsx    -> Deteccao e renderizacao de artefatos (~3685 linhas)
    MedicalImageGallery.tsx -> Galeria de imagens medicas (~640 linhas)
    FlashcardDeck.tsx       -> Deck de flashcards interativo
    MermaidDiagram.tsx      -> Renderizacao de diagramas Mermaid
  chat/
    ChatInput.tsx           -> Input do chat com sugestoes
    QuestaoInterativa.tsx   -> Questao interativa com feedback
    QuestaoDetector.tsx     -> Detecta questoes no streaming
  simulados/               -> 10 componentes de simulado
  mobile/                  -> Componentes mobile responsivos
```

## Tipos de Artefatos Suportados
O ArtifactRenderer detecta e renderiza estes formatos no streaming:
- ` ```questao ` - Questoes interativas (JSON estruturado com pergunta, alternativas, resposta, explicacao)
- ` ```flashcard ` - Flashcards
- ` ```mermaid ` - Diagramas Mermaid (fluxogramas, organogramas)
- ` ```fluxograma ` - Fluxogramas dedicados
- ` ```arvore ` - Diagramas de arvore
- ` ```camadas ` - Diagramas em camadas
- ` ```estadiamento ` - Tabelas de estadiamento
- ` ```simulado ` - Simulados completos
- ` ```estudo_unificado ` - Estudo unificado

## Tabelas Supabase (46 tabelas com sufixo _med)
Principais:
- `profiles_med` - Perfis de usuario
- `conversas_ia_med` - Conversas do chat IA
- `mensagens_ia_med` - Mensagens individuais (colunas: id, conversa_id, role, content, tokens, has_image, has_pdf, image_url, pdf_url, created_at, sessao_id)
- `chat_ia_med` - Chat IA legado
- `questoes_med` - Banco de questoes
- `simulados_med` / `simulado_respostas_med` - Simulados
- `flashcards_med` / `flashcards_ia_med` - Flashcards
- `disciplinas_med` / `assuntos_med` / `subassuntos_med` - Taxonomia
- `limites_uso_med` / `uso_ia_med` - Controle de uso/limites
- `assinaturas_med` - Assinaturas/planos
- `artefatos_med` - Artefatos gerados
- `user_memory_med` - Memoria persistente do usuario
- `ranking_med` / `badges_med` / `badges_usuario_med` - Gamificacao
- `forum_topicos_med` / `forum_respostas_med` - Forum
- `teorias_med` / `teoria_artigos_med` - Conteudo teorico
- `error_logs_med` - Log de erros

## Variaveis de Ambiente (nomes apenas)
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_ID, ANTHROPIC_API_KEY, GEMINI_API_KEY, GEMINI_MODEL
OPENAI_API_KEY, HUGGINGFACE_API_KEY, SERPER_API_KEY
NEXT_PUBLIC_CAKTO_CHECKOUT_URL, NEXT_PUBLIC_CAKTO_CHECKOUT_PREMIUM
NEXT_PUBLIC_CAKTO_CHECKOUT_RESIDENCIA, CAKTO_CLIENT_ID, CAKTO_CLIENT_SECRET
NEXT_PUBLIC_APP_URL, NODE_ENV, CRON_SECRET, ADMIN_SECRET_KEY
ENABLE_MEDICAL_EMBEDDINGS, ENABLE_MEDICAL_RAG, ENABLE_SMART_AGENTS
```

## Regras de Desenvolvimento

### NUNCA fazer sem permissao explicita:
1. **Alterar schema do Supabase** - Nao criar/deletar/modificar tabelas ou colunas
2. **Alterar RPC functions** - exec_sql_custom, list_tables_custom sao criticas
3. **Push direto para main** - Sempre usar branch `claude/` e PR
4. **Remover funcionalidades existentes** - Apenas corrigir/melhorar

### Padroes do projeto:
1. Streaming SSE para respostas de IA (nao REST simples)
2. Debounce de 300 chars no ArtifactRenderer para evitar flickering
3. React.memo com comparadores customizados em 32+ componentes
4. Questoes SEMPRE no formato ` ```questao ` com JSON (nunca texto markdown puro)
5. Imagens: max 2 por resposta, sem duplicacao entre inline e galeria
6. Primeira mensagem de chat novo: resposta rica automatica (texto + fluxograma + questoes)
7. Mensagens seguintes: artefatos apenas se usuario pedir, mas IA sempre oferece
8. Todas tabelas usam sufixo `_med`
9. Colunas reais da mensagens_ia_med: id, conversa_id, role, content, tokens, has_image, has_pdf, image_url, pdf_url, created_at, sessao_id

### Workflow de deploy:
1. Desenvolver na branch `claude/setup-prepara-med-*`
2. Commitar com mensagens claras
3. Push para a branch
4. Criar PR no GitHub para main
5. Merge -> Vercel auto-deploy

## Historico de Sessoes

### Sessao 09/02/2026 - Fixes IA Chat (PR #115)
- Fix imagens duplicadas (inline + galeria) via excludeUrls
- Fix questoes nao renderizando como deck (reforco no prompt)
- Fix flickering (debounce 100->300, debouncedContent em imageSearchTerms)
- Feature: primeira mensagem auto-gera conteudo rico
- Feature: mensagens seguintes so geram artefatos se pedido
- Arquivos: prompts.ts, ArtifactRenderer.tsx, MedicalImageGallery.tsx, route.ts, smart-router.ts

### Sessao 09/02/2026 - Performance j-m + Bug Fix (commits 0df4d44, 23ab00b)
- React.memo em 32 componentes
- Acessibilidade (aria-labels, roles)
- useMemo em 3 contexts
- next/font Inter
- Fix bug: conversa nao carregava (colunas invalidas na query)
- 38 arquivos modificados

### Sessao 09/02/2026 - Performance a-i
- 9 otimizacoes: next.config, next/image, cache, select, hooks, lazy loading, Promise.all, Server Components
- 21 arquivos, +430/-220 linhas

### Sessao 09/02/2026 - Reconstrucao Auth
- 5 defeitos estruturais identificados e corrigidos
- Auth 100% funcional

### Sessoes 06-08/02/2026
- Streaming multi-agentes, Mermaid, memoria persistente
- Diagramas com IA real, gabarito, TTS Kokoro
- Correcoes arquiteturais de auth

## Planos de Usuario
| Plano | Modelo IA | Limite |
|-------|-----------|--------|
| Gratuito | Gemini 2.5 Flash | Limitado |
| Premium | Claude Sonnet 4.5 | Amplo |
| Residencia | Claude Opus 4 | Maximo |

## Funcoes RPC Supabase
- `exec_sql_custom(sql_query text)` - Executa SQL customizado (ADMIN)
- `list_tables_custom()` - Lista tabelas do schema public
