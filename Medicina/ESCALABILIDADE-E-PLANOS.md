# PREPARAMED - Escalabilidade e Estratégia de Planos

## Status Atual: MVP com Cache em Memória

**Data:** Janeiro 2026
**Implementação:** Cache em memória (sem Vercel KV)

---

## 1. LIMITAÇÕES ATUAIS - AÇÃO NECESSÁRIA

### Imagens Médicas Reais (OpenI/NIH)

| Métrica | Limite Atual | Quando Escalar |
|---------|--------------|----------------|
| Usuários simultâneos | ~20-50 | Ativar Vercel KV |
| Cache | Em memória (perde no deploy) | Vercel KV = persistente |
| Rate Limit OpenI | 3 req/s | OK para MVP |

### ⚠️ ALERTA: Quando atingir ~20 usuários ativos

1. **Ativar Vercel KV** no dashboard Vercel
   - Plano gratuito: 30K comandos/mês
   - Plano Pro ($15/mês): 300K comandos/mês

2. **Descomentar código de cache** em:
   - `lib/medical-images/service.ts`
   - `app/api/medicina/imagens/route.ts`

3. **Adicionar variáveis de ambiente:**
   ```
   KV_REST_API_URL=xxx
   KV_REST_API_TOKEN=xxx
   ```

---

## 2. ESTRUTURA DE PLANOS RECOMENDADA

### Plano GRATUITO (Atual)
- ✅ 10 chats/mês com IA
- ✅ Questões básicas
- ❌ SEM imagens médicas reais
- ❌ SEM diagramas Mermaid avançados
- ❌ SEM geração de imagens

### Plano PREMIUM (R$ 29,90/mês)
- ✅ 100 chats/mês com IA (Gemini)
- ✅ Questões ilimitadas
- ✅ Diagramas Mermaid
- ⚠️ Imagens médicas reais (limite: 50/mês)
- ❌ SEM geração de imagens IA
- ❌ SEM Extended Thinking

### Plano RESIDÊNCIA (R$ 79,90/mês) - COMPLETO
- ✅ Chats ILIMITADOS com IA (Claude Opus)
- ✅ Questões ilimitadas
- ✅ Diagramas Mermaid ilimitados
- ✅ Imagens médicas reais ILIMITADAS
- ✅ Geração de imagens com IA (50/mês)
- ✅ Extended Thinking
- ✅ Web Search
- ✅ Análise de PDFs
- ✅ Vision (análise de imagens)

---

## 3. PSICOLOGIA DE CONVERSÃO

### Gatilhos para Upgrade GRATUITO → PREMIUM

1. **Limite de chats atingido**
   > "Você usou seus 10 chats gratuitos! 🎯 Com o Premium, tenha 100 chats/mês + imagens médicas reais de atlas como Radiopaedia e PubMed."

2. **Tentativa de usar recurso bloqueado**
   > "📸 Imagens médicas reais estão disponíveis no plano Premium! Estude com raio-X, TC e histologia de casos reais."

3. **Após resposta da IA sobre tema visual**
   > "💡 Quer ver imagens reais deste caso? Faça upgrade para Premium e acesse nosso atlas integrado."

### Gatilhos para Upgrade PREMIUM → RESIDÊNCIA

1. **Limite de imagens atingido**
   > "Você usou suas 50 imagens do mês! No plano Residência, imagens são ILIMITADAS + IA mais avançada (Claude Opus)."

2. **Tema complexo que precisa de Extended Thinking**
   > "🧠 Esta questão é complexa! Com Extended Thinking do plano Residência, a IA raciocina mais profundamente antes de responder."

3. **Tentativa de anexar PDF**
   > "📄 Análise de PDFs e artigos está disponível no plano Residência. Ideal para revisar guidelines e protocolos."

4. **Busca por informação recente**
   > "🌐 Web Search permite buscar informações atualizadas em fontes médicas confiáveis. Disponível no plano Residência."

---

## 4. FEATURES POR PLANO - DETALHADO

### Imagens Médicas Reais

| Feature | Gratuito | Premium | Residência |
|---------|----------|---------|------------|
| Ver imagens na resposta | ❌ | ✅ 50/mês | ✅ Ilimitado |
| Galeria de referência | ❌ | ✅ | ✅ |
| Modal ampliado | ❌ | ✅ | ✅ |
| Link para fonte (PubMed) | ❌ | ✅ | ✅ |
| Download de imagem | ❌ | ❌ | ✅ |

### Diagramas e Artefatos

| Feature | Gratuito | Premium | Residência |
|---------|----------|---------|------------|
| Texto formatado | ✅ | ✅ | ✅ |
| Tabelas markdown | ✅ | ✅ | ✅ |
| Diagramas Mermaid | ❌ | ✅ | ✅ |
| Fluxogramas clínicos | ❌ | ✅ | ✅ |
| Download SVG | ❌ | ❌ | ✅ |

### IA Avançada

| Feature | Gratuito | Premium | Residência |
|---------|----------|---------|------------|
| Modelo | Gemini Flash | Gemini Flash | Claude Opus |
| Extended Thinking | ❌ | ❌ | ✅ |
| Web Search | ❌ | ❌ | ✅ |
| Vision (imagens) | ❌ | ❌ | ✅ |
| PDFs | ❌ | ❌ | ✅ |

---

## 5. IMPLEMENTAÇÃO TÉCNICA

### Verificação de Plano para Imagens

```typescript
// Em qualquer lugar que precise verificar
const podeVerImagens = plano === 'premium' || plano === 'residencia'
const imagensIlimitadas = plano === 'residencia'

// Verificar limite mensal (Premium = 50)
if (plano === 'premium') {
  const { usado, limite } = await verificarLimiteIA(userId, plano, 'imagens_reais')
  if (usado >= limite) {
    // Mostrar modal de upgrade
  }
}
```

### Novo campo no banco (quando implementar limites)

```sql
ALTER TABLE uso_ia_med ADD COLUMN imagens_reais_mes INT DEFAULT 0;
```

---

## 6. ROADMAP DE ESCALABILIDADE

### Fase 1 - MVP (Atual)
- [x] Cache em memória
- [x] OpenI sem autenticação
- [x] Imagens apenas para Residência
- [ ] Implementar verificação de plano

### Fase 2 - Crescimento (20+ usuários)
- [ ] Ativar Vercel KV
- [ ] Implementar rate limiting por usuário
- [ ] Liberar para Premium com limite
- [ ] Métricas de uso

### Fase 3 - Escala (100+ usuários)
- [ ] Cache agressivo (7 dias para queries comuns)
- [ ] Pre-warm cache com top 100 queries médicas
- [ ] Fallback para Wikimedia Commons
- [ ] CDN para imagens

### Fase 4 - Enterprise (500+ usuários)
- [ ] Redis dedicado
- [ ] Múltiplas fontes de imagem
- [ ] API key do NCBI (10 req/s)
- [ ] Imagens offline (Service Worker)

---

## 7. MÉTRICAS PARA MONITORAR

### Quando escalar?

1. **Vercel Analytics** - Ver tempo de resposta da API de imagens
2. **Logs** - Erros de rate limit do OpenI
3. **Supabase** - Número de usuários ativos/mês
4. **Feedback** - Reclamações de lentidão

### KPIs de Conversão

- Taxa de conversão Gratuito → Premium
- Taxa de conversão Premium → Residência
- Churn rate por plano
- Feature mais usada por plano

---

## 8. CONTATOS E RECURSOS

### OpenI (NIH)
- Documentação: https://openi.nlm.nih.gov/services
- Suporte: info@ncbi.nlm.nih.gov
- Para aumentar rate limit: solicitar API key NCBI

### Vercel KV
- Docs: https://vercel.com/docs/storage/vercel-kv
- Dashboard: https://vercel.com/dashboard/stores

### Alternativas futuras
- Upstash Redis (mais barato para alto volume)
- Cloudflare KV (se migrar de Vercel)

---

**Última atualização:** Janeiro 2026
**Responsável:** Bruno / Claude Code
