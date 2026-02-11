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
- **Mobile**: Capacitor 8 (iOS + Android nativo via WebView)
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

## Tokens para Automacao (pedir ao usuario no inicio da sessao)

Claude precisa destes tokens para executar o pipeline completo. Pedir ao usuario quando necessario.

| Token | Para que serve |
|-------|----------------|
| **GITHUB_TOKEN** | Criar PRs, fazer merge via API REST (api.github.com) |
| **VERCEL_TOKEN** | Verificar deploy, ler logs de build (api.vercel.com) |
| **SUPABASE_SERVICE_ROLE_KEY** | Verificacao de saude do banco pos-deploy (opcional) |

- Tokens NAO sao salvos em arquivos - usados apenas em memoria durante a sessao
- GitHub: `curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/repos/brunodivinoo/projeto-final/...`
- Vercel: `curl -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/...`

## Regras de Desenvolvimento

### NUNCA fazer sem permissao explicita:
1. **Alterar schema do Supabase** - Nao criar/deletar/modificar tabelas ou colunas
2. **Alterar RPC functions** - exec_sql_custom, list_tables_custom sao criticas
3. **Push direto para main** - Sempre usar branch `claude/` e PR
4. **Remover funcionalidades existentes** - Apenas corrigir/melhorar
5. **Merge PR sem aprovacao** - Claude NUNCA faz merge para main sem o usuario dizer "pode mergear"
6. **Redeploy/rollback** - Apenas apos confirmacao do usuario

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
10. Ao final de cada sessao de desenvolvimento, Claude DEVE pedir os tokens: "Me passe GITHUB_TOKEN e VERCEL_TOKEN para eu criar o PR e acompanhar o deploy"
11. Claude sempre reporta: link do PR criado + status final do deploy

### Workflow de deploy (pipeline completo - Claude executa):

**Fase 1 - Desenvolvimento:**
1. Desenvolver na branch `claude/setup-prepara-med-*`
2. Commitar com mensagens claras
3. Push para a branch

**Fase 2 - PR e Merge (Claude executa via GitHub API):**
4. Claude pede GITHUB_TOKEN ao usuario (se ainda nao tem)
5. Claude cria PR via API REST do GitHub
6. Claude envia o link do PR para o usuario
7. Usuario aprova -> Claude faz merge via API
8. Se houver conflitos, Claude avisa e propoe resolucao

**Fase 3 - Monitoramento de Deploy (Claude executa via Vercel API):**
9. Claude pede VERCEL_TOKEN ao usuario (se ainda nao tem)
10. Claude monitora status do deploy (BUILDING -> READY ou ERROR)
11. Se ERROR: Claude le os logs do build, diagnostica e propoe fix
12. Se READY: Claude confirma que o site esta live

**Fase 4 - Validacao Pos-Deploy:**
13. Claude verifica que a URL de producao responde
14. Se houver erro, Claude propoe fix imediato (nova branch -> novo PR -> novo ciclo)
15. Claude reporta resultado final ao usuario

## Historico de Sessoes

### Sessao 10/02/2026 - Animacoes Chat + Setup Capacitor Mobile (PR #145)
- Indicador "Pensando..." com 3 bolinhas pulsantes (animacao dot-pulse CSS)
- Cursor de digitacao durante streaming (typing-cursor emerald)
- Consistencia entre ChatIA, StreamingMessage e MobileChatMessage
- Setup completo Capacitor 8: config, plugins nativos, hooks, provider
- Plataformas iOS e Android inicializadas
- CapacitorProvider integrado no layout.tsx (safe areas, keyboard, status bar)
- Documentacao completa no CLAUDE.md para proximas sessoes
- Arquivos: capacitor.config.ts, useCapacitor.ts, CapacitorProvider.tsx, globals.css, ChatIA.tsx, StreamingMessage.tsx, MobileChatMessage.tsx

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

## App Mobile (Capacitor) - Configuracao Inicial

### Arquitetura
O app mobile usa **Capacitor 8** como wrapper nativo do site Vercel:
- Em producao, o WebView aponta para `https://projeto-final-zeta-navy.vercel.app`
- Plugins nativos (push, haptics, statusbar, keyboard, splash) integrados
- iOS e Android a partir de um unico codebase
- **App ID**: `com.preparamed.app`
- **Scheme (deep link)**: `preparamed://`

### Arquivos Criados
| Arquivo | Funcao |
|---------|--------|
| `capacitor.config.ts` | Config principal: appId, plugins, server URL, iOS/Android |
| `hooks/useCapacitor.ts` | Hooks: useCapacitor, usePushNotifications, useHaptics, useNativeShare |
| `components/native/CapacitorProvider.tsx` | Provider global: safe areas, status bar, keyboard, back button, deep links |

### Plugins Instalados
| Plugin | Funcao |
|--------|--------|
| `@capacitor/app` | Lifecycle, back button, deep links |
| `@capacitor/status-bar` | Cor/estilo da barra de status |
| `@capacitor/splash-screen` | Tela de splash nativa |
| `@capacitor/keyboard` | Gerenciamento de teclado virtual |
| `@capacitor/push-notifications` | Push notifications nativas |
| `@capacitor/local-notifications` | Notificacoes locais |
| `@capacitor/haptics` | Vibracoes/feedback tatil |
| `@capacitor/share` | Compartilhamento nativo |
| `@capacitor/browser` | Abrir URLs externas |
| `@capacitor/network` | Status de conectividade |

### Scripts npm
```bash
npm run cap:sync      # Sincronizar web -> nativo
npm run cap:android   # Abrir projeto no Android Studio
npm run cap:ios       # Abrir projeto no Xcode
npm run cap:run:android  # Rodar no emulador/device Android
npm run cap:run:ios      # Rodar no simulador/device iOS
npm run cap:build:android  # Build release Android (.apk)
npm run cap:build:ios      # Sync iOS (build via Xcode)
```

### Proximos Passos (futuras sessoes)
1. **Icones e Splash nativos** - Gerar com @capacitor/assets (1024x1024 icon + 2732x2732 splash)
2. **Push Notifications backend** - Endpoint API para enviar push via Firebase/APNs
3. **Biometria** - Login com Face ID / fingerprint (@capacitor/biometrics)
4. **Build de producao Android** - Gerar .aab, assinar com keystore, upload Google Play Console
5. **Build de producao iOS** - Certificados Apple Developer, provisioning profiles, upload App Store Connect
6. **Deep links** - Configurar Associated Domains (iOS) e App Links (Android)
7. **Offline mode** - Cache local de questoes/flashcards para estudo offline

### Requisitos para publicacao nas lojas
| Loja | Requisito | Status |
|------|-----------|--------|
| Google Play | Conta Developer ($25 unica vez) | Pendente |
| Google Play | Keystore assinado | Pendente |
| Google Play | Icone 512x512, screenshots, descricao | Pendente |
| App Store | Apple Developer Program ($99/ano) | Pendente |
| App Store | Certificados + Provisioning | Pendente |
| App Store | App Review (pode rejeitar wrapper puro) | Mitigado com plugins nativos |

## Funcoes RPC Supabase
- `exec_sql_custom(sql_query text)` - Executa SQL customizado (ADMIN)
- `list_tables_custom()` - Lista tabelas do schema public
