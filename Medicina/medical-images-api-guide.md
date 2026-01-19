# Guia Técnico Completo: APIs de Imagens Médicas para App Educacional

## Sumário Executivo

Este documento fornece especificações técnicas detalhadas para integração de bancos de imagens médicas em um aplicativo educacional para estudantes de medicina, com foco em escalabilidade, performance e experiência profissional.

---

## 1. OpenI (NIH) - API Principal Recomendada

### 1.1 Autenticação e Rate Limits

| Aspecto | Especificação |
|---------|---------------|
| **Autenticação** | ❌ NÃO REQUER - Chamadas diretas sem API Key |
| **Rate Limit Base** | 3 requisições/segundo (sem chave) |
| **Rate Limit com Chave NCBI** | 10 requisições/segundo |
| **Recomendação NLM** | Cache de 12-24 horas |

### 1.2 Endpoint e Parâmetros

\`\`\`
GET https://openi.nlm.nih.gov/api/search
\`\`\`

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| \`query\` | Termo de busca (inglês) | \`pneumonia+chest+xray\` |
| \`m\` | Índice inicial (paginação) | \`1\` |
| \`n\` | Quantidade de resultados | \`10\` (max ~100) |
| \`coll\` | Coleção | \`pmc\` (PubMed Central) |
| \`it\` | Tipo de imagem | \`x,u,ph,p,mc,m,g,c\` |

**Tipos de imagem (it):**
- \`x\` = X-ray
- \`u\` = Ultrasound  
- \`ph\` = Photograph
- \`p\` = PET
- \`mc\` = Microscopy
- \`m\` = MRI
- \`g\` = Graphics
- \`c\` = CT

### 1.3 Formato da Resposta JSON

\`\`\`json
{
  "min": 1,
  "max": 10,
  "count": 10,
  "total": 4814,
  "approximage": "false",
  "list": [
    {
      "uid": "PMC4911020",
      "pmcid": "4911020",
      "pmid": "26849394",
      "docSource": "PMC",
      "articleType": "ra",
      "pmc_url": "http://www.ncbi.nlm.nih.gov/pmc/articles/PMC4911020",
      "pubMed_url": "http://www.ncbi.nlm.nih.gov/pubmed/26849394",
      "title": "Community-acquired pneumonia in primary care...",
      "journal_title": "Scandinavian journal of primary health care",
      "journal_abbr": "Scand J Prim Health Care",
      "journal_date": {
        "day": "05",
        "month": "02", 
        "year": "2016"
      },
      "authors": "Moberg AB, Taléus U, Garvin P...",
      "affiliate": "Kärna Vårdcentral, Linköping, Sweden",
      "MeSH": {
        "minor": [],
        "major": []
      },
      "Problems": "pneumonia",
      "image": {
        "id": "F1",
        "caption": "CRP in relation to outcome of <b>chest X-ray</b>..."
      },
      "imgThumb": "/imgs/100/374/4911020/PMC4911020_ipri-34-21.01.png",
      "imgLarge": "/imgs/512/374/4911020/PMC4911020_ipri-34-21.01.png",
      "imgThumbLarge": "/imgs/137/374/4911020/PMC4911020_ipri-34-21.01.png",
      "imgGrid150": "/imgs/150/374/4911020/PMC4911020_ipri-34-21.01.png"
    }
  ]
}
\`\`\`

### 1.4 URLs de Imagens

| Campo | Tamanho | Uso |
|-------|---------|-----|
| \`imgThumb\` | 100px | Lista/grid de resultados |
| \`imgGrid150\` | 150px | Grid expandido |
| \`imgThumbLarge\` | 137px | Preview |
| \`imgLarge\` | 512px | Visualização detalhada |

**Base URL para imagens:** \`https://openi.nlm.nih.gov\`

**Exemplo completo:** \`https://openi.nlm.nih.gov/imgs/512/374/4911020/PMC4911020_ipri-34-21.01.png\`

---

## 2. Radiopaedia - API Secundária (Radiologia)

### 2.1 Autenticação

| Aspecto | Especificação |
|---------|---------------|
| **Autenticação** | ✅ REQUER OAuth 2.0 |
| **Registro** | https://radiopaedia.org/oauth/applications |
| **Escopo necessário** | \`cases\` |

### 2.2 Fluxo de Autenticação OAuth 2.0

\`\`\`bash
# 1. Registrar aplicação em radiopaedia.org/oauth/applications
# 2. Obter Authorization Code
# 3. Trocar por Access Token:

curl --data 'client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&code=<AUTH_CODE>&grant_type=authorization_code&redirect_uri=<REDIRECT_URI>' \\
  https://radiopaedia.org/oauth/token

# 4. Refresh Token quando expirar:
curl --data 'client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&refresh_token=<REFRESH_TOKEN>&grant_type=refresh_token' \\
  https://production.radiopaedia.org/oauth/token
\`\`\`

### 2.3 Resposta de Token

\`\`\`json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 7200,
  "refresh_token": "abc123...",
  "scope": "cases",
  "created_at": 1706522419
}
\`\`\`

### 2.4 Limitações

- **API focada em UPLOAD de casos**, não busca pública
- **Não há endpoint de busca público** - ideal para deep linking
- **Alternativa:** Usar URLs diretas para casos conhecidos

---

## 3. WebPath (Utah) - Histopatologia

### 3.1 Acesso

| Aspecto | Especificação |
|---------|---------------|
| **Autenticação** | ❌ NÃO REQUER |
| **API** | ❌ NÃO TEM API |
| **Acesso** | URLs diretas para imagens |
| **Licença** | Educacional (não-comercial) |

### 3.2 Estrutura de URLs

\`\`\`
Base: https://webpath.med.utah.edu/

Estrutura de diretórios:
/TUTORIAL/        - Mini-tutoriais
/EXAMS/           - Questões de exame
/INFLHTML/        - Inflamação
/NEOHTML/         - Neoplasias
/CARDHTML/        - Cardiovascular
/PULHTML/         - Pulmonar
/GIHTML/          - Gastrointestinal
/RENALHTML/       - Renal
/ENDOHTML/        - Endócrino
/CNSHTML/         - Sistema Nervoso
/HEMEPATH/        - Hematopatologia
\`\`\`

### 3.3 Estratégia de Integração

Sem API, usar mapeamento estático:

\`\`\`typescript
const webpathTopics = {
  "infarto_miocardio": "https://webpath.med.utah.edu/CARDHTML/CARD001.html",
  "pneumonia_lobar": "https://webpath.med.utah.edu/PULHTML/PUL001.html",
  "adenocarcinoma_colon": "https://webpath.med.utah.edu/GIHTML/GI001.html",
  // ... mapear ~200 tópicos principais
}
\`\`\`

---

## 4. PathologyOutlines - Histopatologia

### 4.1 Acesso

| Aspecto | Especificação |
|---------|---------------|
| **Autenticação** | ❌ NÃO REQUER |
| **API** | ❌ NÃO TEM API |
| **Acesso** | Deep linking |
| **Contribuição** | Via Flickr Group |

### 4.2 Estrutura de URLs

\`\`\`
Base: https://www.pathologyoutlines.com/

Estrutura:
/topic/[categoria][topico].html

Exemplos:
/topic/colontumorsadenocarcinoma.html
/topic/breasttumorsadenocarcinoma.html
/topic/lungtumorssquamous.html
\`\`\`

---

## 5. Wikimedia Commons - Anatomia/Geral

### 5.1 API MediaWiki

| Aspecto | Especificação |
|---------|---------------|
| **Autenticação** | ❌ NÃO REQUER |
| **Rate Limit** | ~200 req/s (sem User-Agent) |
| **Licença** | Creative Commons (varia) |

### 5.2 Endpoint de Busca

\`\`\`
GET https://commons.wikimedia.org/w/api.php
?action=query
&list=search
&srsearch=[termo]
&srnamespace=6
&format=json
&srlimit=20
\`\`\`

### 5.3 Formato da Resposta

\`\`\`json
{
  "query": {
    "search": [
      {
        "ns": 6,
        "title": "File:Heart anatomy.png",
        "pageid": 12345,
        "snippet": "Anatomy of the human <span class=\"searchmatch\">heart</span>..."
      }
    ]
  }
}
\`\`\`

### 5.4 Obter URL da Imagem

\`\`\`
GET https://commons.wikimedia.org/w/api.php
?action=query
&titles=File:Heart_anatomy.png
&prop=imageinfo
&iiprop=url|size|mime
&format=json
\`\`\`

---

## 6. Arquitetura Recomendada para Escalabilidade

### 6.1 Sistema de Cache Multi-Camada

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                  │
│                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │ Chat com IA │   │   Galeria   │   │   Modal     │       │
│  │             │ → │  de Imagens │ → │  Detalhes   │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Next.js API Routes)              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CACHE LAYER (Redis/Vercel KV)            │   │
│  │  ┌────────────────┐  ┌────────────────┐              │   │
│  │  │ Query Cache    │  │ Image URL Cache│              │   │
│  │  │ TTL: 24 horas  │  │ TTL: 7 dias    │              │   │
│  │  └────────────────┘  └────────────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
│                              │                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              RATE LIMITER (por usuário)               │   │
│  │  - 10 buscas de imagem/minuto por usuário            │   │
│  │  - 50 buscas totais/minuto para sistema              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL APIs                             │
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │  OpenI    │  │ Wikimedia │  │  Fallback │               │
│  │  (NIH)    │  │  Commons  │  │  (Static) │               │
│  │ 3 req/s   │  │ 200 req/s │  │     ∞     │               │
│  └───────────┘  └───────────┘  └───────────┘               │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### 6.2 Implementação do Serviço de Imagens

\`\`\`typescript
// lib/medical-images/service.ts

import { kv } from '@vercel/kv' // ou Redis

interface MedicalImage {
  id: string
  url: string
  thumbUrl: string
  title: string
  caption: string
  source: 'openi' | 'wikimedia' | 'static'
  sourceUrl: string
  modality?: string
  license: string
}

interface SearchResult {
  images: MedicalImage[]
  total: number
  cached: boolean
  source: string
}

// Cache key generator
function getCacheKey(query: string, source: string): string {
  return \`med-img:\${source}:\${query.toLowerCase().replace(/\\s+/g, '_')}\`
}

// OpenI Search
async function searchOpenI(query: string, limit: number = 10): Promise<MedicalImage[]> {
  const response = await fetch(
    \`https://openi.nlm.nih.gov/api/search?query=\${encodeURIComponent(query)}&m=1&n=\${limit}\`
  )
  
  if (!response.ok) {
    throw new Error(\`OpenI API error: \${response.status}\`)
  }
  
  const data = await response.json()
  
  return data.list.map((item: any) => ({
    id: item.uid,
    url: \`https://openi.nlm.nih.gov\${item.imgLarge}\`,
    thumbUrl: \`https://openi.nlm.nih.gov\${item.imgThumb}\`,
    title: item.title,
    caption: item.image?.caption || '',
    source: 'openi',
    sourceUrl: item.pmc_url,
    modality: detectModality(item),
    license: 'Open Access (PubMed Central)'
  }))
}

// Wikimedia Commons Search
async function searchWikimedia(query: string, limit: number = 10): Promise<MedicalImage[]> {
  const searchResponse = await fetch(
    \`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=\${encodeURIComponent(query + ' medical')}&srnamespace=6&format=json&srlimit=\${limit}&origin=*\`
  )
  
  const searchData = await searchResponse.json()
  const titles = searchData.query.search.map((item: any) => item.title)
  
  if (titles.length === 0) return []
  
  // Get image URLs
  const infoResponse = await fetch(
    \`https://commons.wikimedia.org/w/api.php?action=query&titles=\${titles.join('|')}&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json&origin=*\`
  )
  
  const infoData = await infoResponse.json()
  const pages = Object.values(infoData.query.pages) as any[]
  
  return pages
    .filter(page => page.imageinfo?.[0])
    .map(page => ({
      id: \`wiki-\${page.pageid}\`,
      url: page.imageinfo[0].url,
      thumbUrl: page.imageinfo[0].url.replace(/\\/commons\\//, '/commons/thumb/') + '/300px-' + page.title.replace('File:', ''),
      title: page.title.replace('File:', '').replace(/_/g, ' '),
      caption: page.imageinfo[0].extmetadata?.ImageDescription?.value || '',
      source: 'wikimedia',
      sourceUrl: \`https://commons.wikimedia.org/wiki/\${page.title}\`,
      license: page.imageinfo[0].extmetadata?.License?.value || 'CC'
    }))
}

// Main search function with cache and fallback
export async function searchMedicalImages(
  query: string, 
  options: { limit?: number; useCache?: boolean } = {}
): Promise<SearchResult> {
  const { limit = 10, useCache = true } = options
  const cacheKey = getCacheKey(query, 'all')
  
  // Check cache first
  if (useCache) {
    const cached = await kv.get<MedicalImage[]>(cacheKey)
    if (cached) {
      return { images: cached, total: cached.length, cached: true, source: 'cache' }
    }
  }
  
  // Try OpenI first (best medical content)
  try {
    const images = await searchOpenI(query, limit)
    if (images.length > 0) {
      await kv.set(cacheKey, images, { ex: 86400 }) // 24h cache
      return { images, total: images.length, cached: false, source: 'openi' }
    }
  } catch (error) {
    console.error('OpenI search failed:', error)
  }
  
  // Fallback to Wikimedia
  try {
    const images = await searchWikimedia(query, limit)
    if (images.length > 0) {
      await kv.set(cacheKey, images, { ex: 86400 })
      return { images, total: images.length, cached: false, source: 'wikimedia' }
    }
  } catch (error) {
    console.error('Wikimedia search failed:', error)
  }
  
  // Return empty if all fail
  return { images: [], total: 0, cached: false, source: 'none' }
}

function detectModality(item: any): string {
  const caption = (item.image?.caption || '').toLowerCase()
  if (caption.includes('x-ray') || caption.includes('radiograph')) return 'X-Ray'
  if (caption.includes('ct') || caption.includes('tomograph')) return 'CT'
  if (caption.includes('mri') || caption.includes('magnetic')) return 'MRI'
  if (caption.includes('ultrasound') || caption.includes('echo')) return 'Ultrasound'
  if (caption.includes('histolog') || caption.includes('microscop')) return 'Histology'
  return 'Other'
}
\`\`\`

### 6.3 API Route (Next.js)

\`\`\`typescript
// app/api/medicina/imagens/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { searchMedicalImages } from '@/lib/medical-images/service'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

// Rate limiter: 10 requests per minute per user
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
})

export async function GET(request: NextRequest) {
  // Get user identifier (session, IP, etc)
  const userId = request.headers.get('x-user-id') || 
                 request.ip || 
                 'anonymous'
  
  // Check rate limit
  const { success, limit, reset, remaining } = await ratelimit.limit(userId)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', reset },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    )
  }
  
  // Get search params
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '10')
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }
  
  try {
    const result = await searchMedicalImages(query, { limit })
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
      }
    })
  } catch (error) {
    console.error('Medical image search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
\`\`\`

---

## 7. Integração com IA - Sistema de Prompts

### 7.1 Prompt para Detecção de Termos Visuais

\`\`\`typescript
const MEDICAL_IMAGE_PROMPT = \`
Você é um assistente educacional para estudantes de medicina.

Quando explicar conceitos que se beneficiariam de visualização, inclua marcadores especiais no formato:

[IMAGE_SEARCH: termo de busca em inglês]

REGRAS:
1. Use termos em INGLÊS para a busca (melhor cobertura)
2. Seja específico com modalidade quando relevante
3. NÃO use para conceitos abstratos ou fisiológicos puros
4. Máximo de 3 marcadores por resposta

QUANDO USAR:
✓ Achados radiológicos: [IMAGE_SEARCH: chest xray pneumonia lobar]
✓ Histopatologia: [IMAGE_SEARCH: histology adenocarcinoma colon HE stain]
✓ Anatomia: [IMAGE_SEARCH: heart anatomy cross section]
✓ Dermatologia: [IMAGE_SEARCH: psoriasis plaque skin lesion]
✓ Lesões macroscópicas: [IMAGE_SEARCH: gross pathology myocardial infarction]

QUANDO NÃO USAR:
✗ Fisiologia pura (ciclo de Krebs sem contexto visual)
✗ Farmacologia (mecanismo de ação sem estrutura)
✗ Conceitos teóricos

EXEMPLOS:

Pergunta: "Como identificar pneumonia lobar no raio-X?"
Resposta: 
A pneumonia lobar apresenta características radiológicas típicas...
[IMAGE_SEARCH: lobar pneumonia chest xray consolidation]

Pergunta: "O que é o ciclo de Krebs?"
Resposta: (sem marcador - conceito abstrato)

Pergunta: "Como é a histologia do adenocarcinoma de cólon?"
Resposta:
O adenocarcinoma colorretal apresenta...
[IMAGE_SEARCH: colon adenocarcinoma histology HE microscopy]
\`
\`\`\`

### 7.2 Parser de Resposta da IA

\`\`\`typescript
// lib/ai/response-parser.ts

interface ParsedResponse {
  text: string
  imageSearches: string[]
}

export function parseAIResponse(response: string): ParsedResponse {
  const imageRegex = /\\[IMAGE_SEARCH:\\s*([^\\]]+)\\]/g
  const imageSearches: string[] = []
  
  let match
  while ((match = imageRegex.exec(response)) !== null) {
    imageSearches.push(match[1].trim())
  }
  
  // Remove markers from text
  const text = response.replace(imageRegex, '').trim()
  
  return { text, imageSearches }
}
\`\`\`

### 7.3 Hook React para Busca de Imagens

\`\`\`typescript
// hooks/useMedicalImages.ts

import { useState, useCallback } from 'react'
import { MedicalImage } from '@/lib/medical-images/service'

interface UseMedicalImagesResult {
  images: MedicalImage[]
  loading: boolean
  error: string | null
  search: (queries: string[]) => Promise<void>
}

export function useMedicalImages(): UseMedicalImagesResult {
  const [images, setImages] = useState<MedicalImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const search = useCallback(async (queries: string[]) => {
    if (queries.length === 0) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Search all queries in parallel
      const results = await Promise.all(
        queries.map(q => 
          fetch(\`/api/medicina/imagens?q=\${encodeURIComponent(q)}&limit=3\`)
            .then(r => r.json())
        )
      )
      
      // Combine and deduplicate
      const allImages = results.flatMap(r => r.images || [])
      const uniqueImages = allImages.filter((img, index, self) =>
        index === self.findIndex(i => i.id === img.id)
      )
      
      setImages(uniqueImages)
    } catch (err) {
      setError('Erro ao buscar imagens')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { images, loading, error, search }
}
\`\`\`

---

## 8. Componentes React

### 8.1 Galeria de Imagens Médicas

\`\`\`tsx
// components/medicina/MedicalImageGallery.tsx

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MedicalImage } from '@/lib/medical-images/service'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ExternalLink, ZoomIn, Info } from 'lucide-react'

interface Props {
  images: MedicalImage[]
  loading?: boolean
}

export function MedicalImageGallery({ images, loading }: Props) {
  const [selectedImage, setSelectedImage] = useState<MedicalImage | null>(null)
  
  if (loading) {
    return (
      <div className="flex gap-2 mt-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-24 h-24 bg-slate-200 rounded" />
        ))}
      </div>
    )
  }
  
  if (images.length === 0) return null
  
  return (
    <>
      <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">
            Imagens de Referência
          </span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className="group relative flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
            >
              <Image
                src={img.thumbUrl}
                alt={img.title}
                fill
                className="object-cover"
                sizes="112px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {img.modality && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                  {img.modality}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <p className="text-xs text-slate-500 mt-2">
          Clique para ampliar • Fonte: OpenI/NIH
        </p>
      </div>
      
      {/* Modal de visualização */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 896px) 100vw, 896px"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{selectedImage.title}</h3>
                
                {selectedImage.caption && (
                  <p 
                    className="text-sm text-slate-600"
                    dangerouslySetInnerHTML={{ __html: selectedImage.caption }}
                  />
                )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-slate-500">
                    {selectedImage.license}
                  </span>
                  <a
                    href={selectedImage.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    Ver no PubMed
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
\`\`\`

---

## 9. Diferenciais para App Profissional

### 9.1 Features que Justificam Pagamento

| Feature | Descrição | Implementação |
|---------|-----------|---------------|
| **Imagens Contextuais** | IA detecta automaticamente quando mostrar imagens | Prompt engineering |
| **Atlas Integrado** | Navegação por sistemas/patologias | Mapeamento estático |
| **Modo Estudo** | Flashcards com imagens | Componente interativo |
| **Comparação** | Lado a lado normal vs patológico | UI comparativa |
| **Anotações** | Marcar estruturas na imagem | Canvas overlay |
| **Quiz Visual** | "Identifique a patologia" | Gamificação |
| **Offline** | Cache local de imagens frequentes | Service Worker |
| **Multi-idioma** | Legendas em português | Tradução automática |

### 9.2 Roadmap de Implementação

**Fase 1 (MVP):**
- [ ] Integração OpenI básica
- [ ] Galeria de imagens
- [ ] Detecção via prompt

**Fase 2 (Diferenciação):**
- [ ] Cache inteligente
- [ ] Atlas navegável
- [ ] Modo estudo com flashcards

**Fase 3 (Premium):**
- [ ] Quiz visual
- [ ] Anotações
- [ ] Comparação lado a lado

---

## 10. Estimativas de Custo e Performance

### 10.1 Rate Limits vs Usuários Simultâneos

| Usuários Simultâneos | Req/min Estimadas | Viabilidade OpenI |
|---------------------|-------------------|-------------------|
| 10 | ~30 | ✅ Tranquilo |
| 50 | ~150 | ✅ OK com cache |
| 100 | ~300 | ⚠️ Precisa cache agressivo |
| 500+ | ~1500 | ❌ Precisa cache + fallback |

### 10.2 Estratégia de Cache

\`\`\`typescript
// Cache TTLs recomendados
const CACHE_CONFIG = {
  // Queries frequentes (anatomia, patologias comuns)
  HOT_QUERIES_TTL: 7 * 24 * 60 * 60, // 7 dias
  
  // Queries normais
  NORMAL_TTL: 24 * 60 * 60, // 24 horas
  
  // URLs de imagem (raramente mudam)
  IMAGE_URL_TTL: 30 * 24 * 60 * 60, // 30 dias
}

// Pre-warm cache com queries mais comuns
const HOT_QUERIES = [
  'chest xray pneumonia',
  'heart anatomy',
  'liver histology',
  'brain MRI stroke',
  'skin melanoma dermoscopy',
  // ... top 100 queries
]
\`\`\`

### 10.3 Custos Vercel KV (Redis)

| Plano | Comandos/mês | Custo | Para seu App |
|-------|-------------|-------|--------------|
| Hobby | 30K | Grátis | MVP |
| Pro | 300K | $15/mês | 100-500 users |
| Enterprise | Ilimitado | Custom | 500+ users |

---

## Conclusão

A arquitetura recomendada usa **OpenI (NIH)** como fonte principal por ser:
- ✅ Gratuita e sem autenticação
- ✅ Alto conteúdo médico de qualidade
- ✅ Licença permissiva (Open Access)

Com cache adequado e rate limiting por usuário, é possível escalar para centenas de usuários simultâneos sem problemas.
