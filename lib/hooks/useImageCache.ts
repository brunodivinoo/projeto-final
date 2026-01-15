'use client'

// Hook para cache persistente de imagens usando IndexedDB
// Permite que imagens médicas carreguem instantaneamente em chats revisitados

const DB_NAME = 'preparamed-image-cache'
const DB_VERSION = 1
const STORE_NAME = 'images'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 dias

interface CachedImage {
  url: string
  blob: Blob
  timestamp: number
}

// Singleton da conexão do banco
let dbPromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não disponível'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Criar store de imagens se não existir
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })

  return dbPromise
}

// Salvar imagem no cache
export async function cacheImage(url: string, blob: Blob): Promise<void> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const cachedImage: CachedImage = {
      url,
      blob,
      timestamp: Date.now()
    }

    return new Promise((resolve, reject) => {
      const request = store.put(cachedImage)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('Erro ao salvar imagem no cache:', error)
  }
}

// Buscar imagem do cache
export async function getCachedImage(url: string): Promise<string | null> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.get(url)

      request.onsuccess = () => {
        const result = request.result as CachedImage | undefined

        if (!result) {
          resolve(null)
          return
        }

        // Verificar se expirou
        if (Date.now() - result.timestamp > CACHE_TTL) {
          // Cache expirado, deletar em background
          deleteFromCache(url).catch(() => {})
          resolve(null)
          return
        }

        // Converter blob para object URL
        const objectUrl = URL.createObjectURL(result.blob)
        resolve(objectUrl)
      }

      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('Erro ao buscar imagem do cache:', error)
    return null
  }
}

// Deletar imagem do cache
export async function deleteFromCache(url: string): Promise<void> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.delete(url)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('Erro ao deletar imagem do cache:', error)
  }
}

// Limpar cache antigo (executar periodicamente)
export async function cleanOldCache(): Promise<void> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('timestamp')
    const cutoffTime = Date.now() - CACHE_TTL

    return new Promise((resolve) => {
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => resolve()
    })
  } catch (error) {
    console.warn('Erro ao limpar cache antigo:', error)
  }
}

// Baixar e cachear imagem
export async function fetchAndCacheImage(url: string): Promise<string> {
  // Primeiro verificar cache
  const cached = await getCachedImage(url)
  if (cached) {
    return cached
  }

  // Não está no cache, baixar
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Erro ao baixar imagem: ${response.status}`)
  }

  const blob = await response.blob()

  // Verificar se é uma imagem válida
  if (!blob.type.startsWith('image/') && blob.size < 100) {
    throw new Error('Conteúdo não é uma imagem válida')
  }

  // Salvar no cache em background
  cacheImage(url, blob).catch(() => {})

  // Retornar object URL
  return URL.createObjectURL(blob)
}

// Hook para usar em componentes React
export function useImageCache() {
  return {
    getCachedImage,
    cacheImage,
    fetchAndCacheImage,
    cleanOldCache,
    deleteFromCache
  }
}
