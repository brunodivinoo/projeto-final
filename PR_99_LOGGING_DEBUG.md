# 🚀 PR #99 - LOGGING ULTRA-DETALHADO PARA DEBUG

## ⚡ LINK DIRETO DO PR

### CLIQUE AQUI:
**https://github.com/brunodivinoo/projeto-final/compare/main...brunodivinoo:projeto-final:claude/continue-prepara-med-1rz2a?expand=1&title=debug(auth)%3A%20Logging%20ultra-detalhado%20para%20identificar%20causa%20raiz&body=Ver%20descri%C3%A7%C3%A3o%20completa%20abaixo**

---

## 📋 INSTRUÇÕES PASSO A PASSO

### Passo 1: Criar o PR
1. Clique no link acima
2. GitHub vai abrir a página de criação do PR
3. **Copie e cole o TÍTULO abaixo** no campo "Title"
4. **Copie e cole a DESCRIÇÃO abaixo** no campo "Description"
5. Clique em **"Create pull request"** (botão verde)

### Passo 2: Fazer Merge
1. Após criar o PR, clique em **"Merge pull request"** (botão verde)
2. Clique em **"Confirm merge"**
3. Aguarde **~2 minutos** para o Vercel fazer deploy

### Passo 3: Testar
1. Acesse: https://projeto-final-zeta-navy.vercel.app
2. Abra DevTools (F12) → Console
3. Limpe o console (ícone 🚫)
4. Faça login
5. **Me envie print do console completo**

---

## 📝 TÍTULO DO PR

```
debug(auth): Logging ultra-detalhado + fallback para identificar causa raiz do travamento
```

---

## 📝 DESCRIÇÃO COMPLETA DO PR

```markdown
## 🔴 DEBUG FORENSE - 4ª Tentativa de Correção

### Problema Persistente
Após **3 correções arquiteturais**, o problema ainda persiste:
- ✅ Autenticação detecta usuário (SIGNED_IN)
- ✅ fetchProfile INICIA
- ❌ fetchProfile NUNCA COMPLETA
- ❌ App fica com tela cinza/branca (não renderiza)

Console atual mostra:
```
[Auth] onAuthStateChange: SIGNED_IN ✅
[Auth] Iniciando fetchProfile para userId: ... ✅
[Auth] Queries completadas com sucesso ❌ NUNCA APARECE
```

### Hipóteses
1. Queries do Supabase **travando** (bloqueadas por RLS ou timeout de rede)
2. Promise.race() não funcionando como esperado
3. Timeout não disparando
4. Finally não executando (profileLoading nunca vira false)

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. LOGGING ULTRA-DETALHADO (15+ logs)

#### Logging de 5 STEPs Críticos
```
🚀 STEP 1: Iniciando queries do Supabase
🚀 STEP 2: Criando Promise.allSettled com 3 queries
🚀 STEP 3: Aguardando Promise.race (queries vs timeout)
✅ STEP 4: Queries completadas! Processando resultados
✅ STEP 5: fetchProfile completado com SUCESSO
```

#### Logging de Cada Query Individual
```
✅ Query 1/3 (profile) completou
✅ Query 2/3 (limites) completou
✅ Query 3/3 (assinatura) completou
```

Permite identificar **qual query específica está travando**.

#### Timeout com Timestamp
```
🕐 Timeout de 8s configurado (timer id: 123)
⏱️ TIMEOUT DISPARADO após 8s!
✅ Promise.race RESOLVEU via queriesPromise (245ms)
❌ Promise.race REJEITOU (timeout) após 8001ms
```

Mostra **tempo exato de execução** e qual promise ganhou a corrida.

#### Erro Detalhado com Stack Trace
```
❌ ERRO CAPTURADO em fetchProfile
📍 Tipo do erro: Error: Timeout de 8s nas queries do Supabase
📍 Stack: Error: Timeout...
    at fetchProfile (MedAuthContext.tsx:347)
    at ...
```

#### Finally com Estado Final
```
🏁 FINALLY: fetchProfile finalizado (profileLoading=false)
🏁 Estado final: user=SET, profile=NULL
```

Garante que sempre sabemos se finally executou.

---

### 2. TIMEOUT REDUZIDO (12s → 8s)

**Por quê?**
- Debug mais rápido (não esperar 12s toda vez)
- Ainda suficiente para queries lentas mas não travadas

---

### 3. FALLBACK DE EMERGÊNCIA

Se timeout disparar, **cria perfil mínimo** para permitir uso do app:

```typescript
if (error.message.includes('Timeout')) {
  console.warn('[Auth] 💊 FALLBACK: Criando perfil mínimo por timeout')
  setProfile({
    id: userId,
    nome: userEmail?.split('@')[0] || 'Estudante',
    email: userEmail,
    plano: 'gratuito',
    // ... campos mínimos
  })
}
```

**Benefício**: App funciona **mesmo com Supabase lento/travado** (graceful degradation).

---

### 4. TRY/CATCH ROBUSTO

```typescript
try {
  // Queries com timeout
} catch (error) {
  console.error('[Auth] ❌ ERRO:', error)
  console.error('[Auth] 📍 Tipo:', error.message)
  console.error('[Auth] 📍 Stack:', error.stack)

  // Fallback para não deixar usuário preso
  if (timeout) criarPerfilMinimo()
} finally {
  // SEMPRE executa
  fetchingRef.current = false
  setProfileLoading(false) // SEMPRE libera loading
  console.log('[Auth] 🏁 FINALLY executado')
}
```

---

## 🎯 O QUE VAMOS DESCOBRIR

Com os logs detalhados, vamos identificar **exatamente**:

### Cenário 1: Queries Funcionam (Problema Resolvido)
```
[Auth] 🚀 STEP 1-3...
[Auth] ✅ Query 1/3, 2/3, 3/3 completou
[Auth] ✅ Promise.race RESOLVEU (245ms)
[Auth] ✅ STEP 4-5 completado
[Auth] 🏁 FINALLY executado
→ APP RENDERIZA ✅
```

### Cenário 2: Timeout Dispara (Queries Lentas/Travadas)
```
[Auth] 🚀 STEP 1-3...
← Espera 8s sem nenhum log
[Auth] ⏱️ TIMEOUT DISPARADO após 8s!
[Auth] ❌ Promise.race REJEITOU (timeout)
[Auth] 💊 FALLBACK: Criando perfil mínimo
[Auth] 🏁 FINALLY executado
→ APP RENDERIZA COM PERFIL MÍNIMO ✅
```

### Cenário 3: Query Específica Trava (Identificamos qual)
```
[Auth] 🚀 STEP 3...
[Auth] ✅ Query 1/3 (profile) completou
[Auth] ✅ Query 2/3 (limites) completou
← Query 3/3 (assinatura) NUNCA completa
[Auth] ⏱️ TIMEOUT após 8s
→ CAUSA: Query de assinatura está travando (RLS ou índice?)
```

### Cenário 4: Promise.race Trava (Bug Estrutural)
```
[Auth] 🚀 STEP 1-2 completado
[Auth] 🚀 STEP 3: Aguardando Promise.race...
← TRAVA AQUI (nem timeout dispara)
→ CAUSA: Bug no Promise.race ou event loop travado
```

### Cenário 5: Finally Não Executa (Bug Crítico)
```
[Auth] 🚀 STEP 1-5 completado
← NEVER logs "FINALLY executado"
→ CAUSA: profileLoading nunca vira false (bug no React/Context)
```

---

## 📁 ARQUIVOS MODIFICADOS

```
contexts/MedAuthContext.tsx    # +77 linhas, -16 linhas
```

### Mudanças Principais:
1. **15+ logs adicionados** em pontos críticos
2. **Timeout reduzido** de 12s → 8s
3. **Fallback** que cria perfil mínimo em caso de timeout
4. **Error handling** com stack trace completo
5. **Finally** com log garantido de execução

---

## 🔄 COMMITS INCLUÍDOS

| Hash | Descrição |
|------|-----------|
| `52507ec` | debug(auth): Logging ultra-detalhado + fallback |
| `74c1052` | docs: Documentação das 3 tentativas anteriores |
| `9722204` | chore: Trigger deploy |
| `c672296` | fix(auth): Desacoplamento arquitetural (tentativa 3) |

**Total**: 4 commits, 1 arquivo modificado

---

## 🧪 COMO TESTAR (APÓS MERGE + DEPLOY)

### Passo 1: Abrir DevTools
1. Acesse: https://projeto-final-zeta-navy.vercel.app
2. Pressione **F12** (abrir DevTools)
3. Vá na aba **Console**
4. Clique no ícone **🚫** (clear console)

### Passo 2: Fazer Login
1. Digite suas credenciais
2. Clique em "Entrar"
3. **OBSERVE OS LOGS** aparecendo no console

### Passo 3: Analisar Logs
Procure por:
- ✅ STEPs 1-5 aparecendo em ordem
- ✅ Queries 1/3, 2/3, 3/3 completando
- ⏱️ Timeout disparando (se queries travarem)
- 🏁 FINALLY executando
- 💊 FALLBACK criando perfil (se timeout)

### Passo 4: Reportar Resultado
**Me envie screenshot do console completo** para análise.

---

## 🔍 PRÓXIMAS AÇÕES (DEPENDENDO DO RESULTADO)

### Se Logs Mostrarem Query de Profile Travando:
```bash
# Verificar RLS policy de profiles_med
SELECT * FROM profiles_med WHERE id = auth.uid()
```
Provável solução: Ajustar policy ou adicionar índice.

### Se Logs Mostrarem Query de Limites Travando:
```bash
# Verificar RLS policy de limites_uso_med
SELECT * FROM limites_uso_med WHERE user_id = auth.uid()
```
Provável solução: Índice composto em (user_id, mes_referencia).

### Se Logs Mostrarem Query de Assinatura Travando:
```bash
# Verificar RLS policy de assinaturas_med
SELECT * FROM assinaturas_med WHERE user_id = auth.uid() AND status = 'ativa'
```
Provável solução: Índice em (user_id, status).

### Se Promise.race Travar Completamente:
- Refactor para usar AbortController
- Cancelamento real das requisições HTTP
- Implementar fetch com timeout nativo

### Se Finally Não Executar:
- Bug crítico no React Context
- Possível memory leak
- Refactor completo do Context

---

## 📊 IMPACTO ESPERADO

### Melhor Caso (Problema Resolvido)
- ✅ Login funciona em 100% dos casos
- ✅ Dashboard carrega em < 3s
- ✅ Sem spinner infinito

### Pior Caso (Ainda Trava MAS Temos Fallback)
- ⚠️ Timeout dispara após 8s
- ✅ Perfil mínimo criado automaticamente
- ✅ **APP RENDERIZA mesmo com Supabase lento**
- ✅ Usuário pode usar o app (graceful degradation)
- 📊 **Temos logs para identificar causa raiz exata**

---

## 🎓 LIÇÕES DESTA ITERAÇÃO

1. **Logging é essencial**: Sem logs, impossível debugar em produção
2. **Graceful degradation**: App deve funcionar mesmo com falhas parciais
3. **Timeouts explícitos**: Nunca confiar que promises completam
4. **Finally sempre executa**: Garantir que loading sempre libera
5. **Debug incremental**: Adicionar logs antes de adicionar fixes

---

## 🔗 SESSÃO

https://claude.ai/code/session_01F6x8ZCM5UR5C2aLudeZGPE

---

**Esta é a 4ª tentativa de correção com abordagem de DEBUG FORENSE.**
**Com os logs detalhados, vamos identificar a causa raiz DEFINITIVA desta vez!** 🎯
```

---

## ⚠️ IMPORTANTE - APÓS MERGE

1. ✅ **Aguarde 2 minutos** (Vercel deploy)
2. ✅ **Limpe cache** (Ctrl+Shift+R ou aba anônima)
3. ✅ **Abra console** (F12)
4. ✅ **Faça login**
5. ✅ **Me envie print COMPLETO do console**

---

## 🔗 LINKS RÁPIDOS

- **PR direto**: https://github.com/brunodivinoo/projeto-final/compare/main...claude/continue-prepara-med-1rz2a?expand=1
- **GitHub**: https://github.com/brunodivinoo/projeto-final
- **Produção**: https://projeto-final-zeta-navy.vercel.app

---

**Branch**: `claude/continue-prepara-med-1rz2a`
**Commits**: 4 (52507ec, 74c1052, 9722204, c672296)
**Status**: ✅ Pronto para merge
