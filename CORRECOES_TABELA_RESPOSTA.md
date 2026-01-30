# 🔧 CORREÇÕES - Tabela Markdown e Resposta Incompleta

**Data:** 28/01/2026
**Problemas:** Tabela aparece como texto bruto + Resposta da IA cortada

---

## CORREÇÃO 1: Tabela Markdown Não Renderiza

### Problema
Tabelas markdown aparecem como texto bruto (com | visíveis) em vez de renderizar como tabela HTML.

### Causa
O padrão `asciiBlockPattern` inclui o caractere `|` que é usado em tabelas markdown, fazendo com que tabelas sejam detectadas incorretamente como ASCII art.

### Arquivo
`components/ia/ArtifactRenderer.tsx`

### Localizar (aproximadamente linha 1390-1401)
```typescript
  // Se detectou ASCII significativo fora de blocos de código
  if (asciiInTextDetection.isAscii && asciiInTextDetection.confidence >= 0.4) {
    // Encontrar o bloco de ASCII no texto original
    const asciiBlockPattern = /(?:^|\n)((?:[\s]*[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬|+].*\n?){3,})/gm
    let asciiMatch
    while ((asciiMatch = asciiBlockPattern.exec(processedContent)) !== null) {
      // Verificar se não está dentro de um bloco de código
      const beforeMatch = processedContent.substring(0, asciiMatch.index)
      const codeBlocksBeforeCount = (beforeMatch.match(/```/g) || []).length
      if (codeBlocksBeforeCount % 2 === 0) {
        // Não está dentro de um bloco de código
        const asciiContent = asciiMatch[1]
        const detection = detectAsciiArt(asciiContent)
```

### Substituir por
```typescript
  // Se detectou ASCII significativo fora de blocos de código
  if (asciiInTextDetection.isAscii && asciiInTextDetection.confidence >= 0.4) {
    // Encontrar o bloco de ASCII no texto original
    // IMPORTANTE: Não incluir | simples para não confundir com tabelas markdown
    const asciiBlockPattern = /(?:^|\n)((?:[\s]*[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬+].*\n?){3,})/gm
    let asciiMatch
    while ((asciiMatch = asciiBlockPattern.exec(processedContent)) !== null) {
      // Verificar se não está dentro de um bloco de código
      const beforeMatch = processedContent.substring(0, asciiMatch.index)
      const codeBlocksBeforeCount = (beforeMatch.match(/```/g) || []).length
      if (codeBlocksBeforeCount % 2 === 0) {
        // Não está dentro de um bloco de código
        const asciiContent = asciiMatch[1]
        
        // Verificar se é uma tabela markdown (tem linha de separação |---|)
        const isMarkdownTable = /\|[\s-:]+\|/.test(asciiContent) || /^\s*\|[^┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]+\|/m.test(asciiContent)
        if (isMarkdownTable) {
          // É uma tabela markdown, ignorar e deixar o ReactMarkdown renderizar
          continue
        }
        
        const detection = detectAsciiArt(asciiContent)
```

### Mudanças Resumidas
1. **Linha do padrão:** Remover `|` do conjunto de caracteres
   - DE: `[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬|+]`
   - PARA: `[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬+]`

2. **Adicionar verificação:** Após `const asciiContent = asciiMatch[1]`, adicionar:
```typescript
        // Verificar se é uma tabela markdown (tem linha de separação |---|)
        const isMarkdownTable = /\|[\s-:]+\|/.test(asciiContent) || /^\s*\|[^┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]+\|/m.test(asciiContent)
        if (isMarkdownTable) {
          // É uma tabela markdown, ignorar e deixar o ReactMarkdown renderizar
          continue
        }
```

---

## CORREÇÃO 2: Resposta da IA Incompleta (Cortada)

### Problema
A resposta da IA é cortada no final, aparecendo incompleta (ex: "ou g" no final).

### Causa
A lógica de detecção de resposta incompleta não está funcionando corretamente para detectar cortes no meio de frases.

### Arquivo
`app/api/medicina/ia/chat/route.ts`

### Localizar (aproximadamente linha 953-965)
```typescript
          // Verificar se a resposta parece incompleta mesmo com end_turn
          const pareceIncompleta = (
            // Termina abruptamente
            fullResponse.endsWith('...') ||
            fullResponse.endsWith('-') ||
            fullResponse.endsWith(',') ||
            /[a-z]$/i.test(fullResponse.trim()) || // Termina com letra
            // Falta seção de fontes quando deveria ter
            (!fullResponse.includes('📚 **Fontes') &&
             !fullResponse.includes('**Fontes:**') &&
             !fullResponse.includes('Referências') &&
             fullResponse.length > 500 && // Resposta substancial
             continuationCount < MAX_CONTINUATIONS)
          )
```

### Substituir por
```typescript
          // Verificar se a resposta parece incompleta mesmo com end_turn
          const textoLimpo = fullResponse.replace(/\s+$/g, '') // Remove whitespace do final
          const ultimoChar = textoLimpo.slice(-1)
          const ultimaPalavra = textoLimpo.split(/\s+/).pop() || ''
          
          const pareceIncompleta = (
            // Termina abruptamente
            fullResponse.endsWith('...') ||
            fullResponse.endsWith('-') ||
            fullResponse.endsWith(',') ||
            // Termina com letra minúscula (indica corte no meio de frase)
            /[a-z]$/.test(ultimoChar) ||
            // Termina com palavra curta comum (indica corte no meio)
            ['ou', 'e', 'de', 'da', 'do', 'que', 'com', 'por', 'para', 'uma', 'um', 'o', 'a', 'os', 'as'].includes(ultimaPalavra.toLowerCase()) ||
            // Falta seção de fontes quando deveria ter
            (!fullResponse.includes('📚 **Fontes') &&
             !fullResponse.includes('**Fontes:**') &&
             !fullResponse.includes('Referências') &&
             !fullResponse.includes('📖') &&
             fullResponse.length > 500 && // Resposta substancial
             continuationCount < MAX_CONTINUATIONS)
          )
          
          console.log(`[Chat API] Verificação completude: último char="${ultimoChar}" última palavra="${ultimaPalavra}" pareceIncompleta=${pareceIncompleta}`)
```

### Mudanças Resumidas
1. Adicionar variáveis auxiliares antes da verificação:
```typescript
const textoLimpo = fullResponse.replace(/\s+$/g, '')
const ultimoChar = textoLimpo.slice(-1)
const ultimaPalavra = textoLimpo.split(/\s+/).pop() || ''
```

2. Melhorar as condições de detecção:
   - Usar `ultimoChar` em vez de `fullResponse.trim()`
   - Adicionar verificação de palavras comuns que indicam corte
   - Adicionar `!fullResponse.includes('📖')` na verificação de fontes

3. Adicionar log de debug no final

---

## DEPLOY

```bash
cd "C:\Users\PC\OneDrive\Área de Trabalho\Projeto Final"
git add .
git commit -m "fix: tabela markdown renderiza corretamente, melhora detecção de resposta incompleta"
git push
```

---

## TESTE

Comando: `"Crie 5 flashcards sobre anatomia cardíaca"`

### Resultado Esperado
- ✅ Tabela markdown renderiza como tabela HTML (linhas e colunas formatadas)
- ✅ Resposta completa (não cortada no final)
- ✅ Flashcards aparecem na sidebar de Artefatos
- ✅ Sem "undefined" na tela

### Debug (Vercel Logs)
Se a resposta ainda estiver incompleta, procure no log:
```
[Chat API] Verificação completude: último char="X" última palavra="XXX" pareceIncompleta=true/false
```

---

## RESUMO DAS MUDANÇAS

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| ArtifactRenderer.tsx | ~1393 | Remover `\|` do padrão regex |
| ArtifactRenderer.tsx | ~1403 | Adicionar verificação `isMarkdownTable` |
| route.ts | ~953 | Adicionar variáveis `textoLimpo`, `ultimoChar`, `ultimaPalavra` |
| route.ts | ~958 | Melhorar condições de `pareceIncompleta` |
| route.ts | ~971 | Adicionar log de debug |
