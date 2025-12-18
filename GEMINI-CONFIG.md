# 🤖 CONFIGURAÇÃO DO GEMINI API

Para usar o Gemini no projeto, siga os passos:

## 1️⃣ Obter API Key do Gemini:

1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em "Create API Key"
3. Copie a chave gerada

## 2️⃣ Adicionar no projeto:

Adicione no arquivo `.env.local`:

```env
GEMINI_API_KEY=sua_chave_aqui
```

## 3️⃣ Instalar SDK (se necessário):

```bash
npm install @google/generative-ai
```

## 4️⃣ Configurar no Vercel:

No Vercel Dashboard:
1. Vá em: Settings > Environment Variables
2. Adicione: `GEMINI_API_KEY` com sua chave
3. Salve

## 5️⃣ Usar no código:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
```

## ⚠️ IMPORTANTE:

- ✅ Nunca exponha a chave no código frontend
- ✅ Use apenas em API Routes (server-side)
- ✅ Não commite o `.env.local` (já está no .gitignore)
