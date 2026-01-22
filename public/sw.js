// ============================================================
// NutriVida PWA Service Worker - Versao de Producao
// ============================================================
// Este service worker implementa estrategias avancadas de cache
// para garantir funcionamento offline e performance otimizada.
// ============================================================

// Versao do cache - incremente ao fazer deploy para forcar atualizacao
const CACHE_VERSION = 'v2.0.0';

// Nomes dos caches separados por tipo de conteudo
const CACHE_NAMES = {
  static: `nutrivida-static-${CACHE_VERSION}`,      // HTML, CSS, JS
  images: `nutrivida-images-${CACHE_VERSION}`,      // Imagens e icones
  fonts: `nutrivida-fonts-${CACHE_VERSION}`,        // Fontes
  api: `nutrivida-api-${CACHE_VERSION}`,            // Respostas de API cacheáveis
  pages: `nutrivida-pages-${CACHE_VERSION}`,        // Paginas navegadas
};

// URL da pagina offline
const OFFLINE_URL = '/nutrivida/offline';

// ============================================================
// ASSETS PARA PRE-CACHE (carregados imediatamente na instalacao)
// ============================================================
const PRECACHE_ASSETS = [
  // Paginas principais do NutriVida
  '/nutrivida',
  '/nutrivida/login',
  '/nutrivida/cadastro',
  '/nutrivida/offline',

  // Manifest e configuracoes
  '/manifest.json',

  // Icones principais (se existirem)
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ============================================================
// CONFIGURACOES DE ESTRATEGIA DE CACHE
// ============================================================
const CACHE_CONFIG = {
  // Tempo maximo de cache para cada tipo (em segundos)
  maxAge: {
    static: 60 * 60 * 24 * 30,    // 30 dias para arquivos estaticos
    images: 60 * 60 * 24 * 7,     // 7 dias para imagens
    fonts: 60 * 60 * 24 * 365,    // 1 ano para fontes
    api: 60 * 5,                   // 5 minutos para API
    pages: 60 * 60 * 24,          // 1 dia para paginas
  },
  // Numero maximo de itens em cada cache
  maxItems: {
    static: 100,
    images: 50,
    fonts: 20,
    api: 30,
    pages: 25,
  }
};

// ============================================================
// EVENTO DE INSTALACAO
// ============================================================
// Executado quando o service worker e instalado pela primeira vez
// ou quando uma nova versao e detectada
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker versao:', CACHE_VERSION);

  event.waitUntil(
    (async () => {
      try {
        // Abre o cache estatico
        const staticCache = await caches.open(CACHE_NAMES.static);

        // Pre-cacheia assets essenciais
        // Usamos addAll com tratamento de erro individual
        const cachePromises = PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok) {
              await staticCache.put(url, response);
              console.log('[SW] Pre-cached:', url);
            }
          } catch (err) {
            console.warn('[SW] Falha ao pre-cachear:', url, err.message);
          }
        });

        await Promise.all(cachePromises);
        console.log('[SW] Pre-cache concluido');

      } catch (error) {
        console.error('[SW] Erro na instalacao:', error);
      }

      // Forca ativacao imediata (nao espera abas fecharem)
      await self.skipWaiting();
    })()
  );
});

// ============================================================
// EVENTO DE ATIVACAO
// ============================================================
// Executado quando o service worker assume o controle
// Limpa caches antigos de versoes anteriores
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker versao:', CACHE_VERSION);

  event.waitUntil(
    (async () => {
      try {
        // Obtem todos os nomes de cache existentes
        const cacheNames = await caches.keys();

        // Lista de caches validos da versao atual
        const validCaches = Object.values(CACHE_NAMES);

        // Remove caches antigos
        const deletePromises = cacheNames
          .filter(name => !validCaches.includes(name))
          .map(name => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          });

        await Promise.all(deletePromises);

        // Assume controle de todas as abas imediatamente
        await self.clients.claim();

        console.log('[SW] Ativacao concluida');

      } catch (error) {
        console.error('[SW] Erro na ativacao:', error);
      }
    })()
  );
});

// ============================================================
// FUNCOES AUXILIARES
// ============================================================

/**
 * Determina o tipo de cache baseado na URL/tipo de requisicao
 */
function getCacheType(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Fontes
  if (pathname.match(/\.(woff2?|ttf|otf|eot)$/i) ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    return 'fonts';
  }

  // Imagens
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
    return 'images';
  }

  // APIs cacheáveis (apenas GET)
  if (pathname.includes('/api/') && request.method === 'GET') {
    return 'api';
  }

  // Arquivos estaticos (JS, CSS)
  if (pathname.match(/\.(js|css)$/i) || pathname.includes('/_next/static/')) {
    return 'static';
  }

  // Paginas HTML (navegacao)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    return 'pages';
  }

  return 'static';
}

/**
 * Estrategia: Cache First
 * Tenta cache primeiro, depois rede. Ideal para assets estaticos.
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Atualiza cache em background (stale-while-revalidate)
    updateCacheInBackground(request, cacheName);
    return cachedResponse;
  }

  return fetchAndCache(request, cacheName);
}

/**
 * Estrategia: Network First
 * Tenta rede primeiro, fallback para cache. Ideal para conteudo dinamico.
 */
async function networkFirst(request, cacheName, timeout = 3000) {
  try {
    // Cria uma promessa de timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeout);
    });

    // Corrida entre fetch e timeout
    const response = await Promise.race([
      fetch(request),
      timeoutPromise
    ]);

    // Se sucesso, cacheia e retorna
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      return response;
    }

    throw new Error('Resposta nao OK');

  } catch (error) {
    // Fallback para cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Estrategia: Stale While Revalidate
 * Retorna cache imediatamente e atualiza em background.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);

  // Inicia fetch em background
  const fetchPromise = fetchAndCache(request, cacheName);

  // Retorna cache se disponivel, senao espera fetch
  return cachedResponse || fetchPromise;
}

/**
 * Busca da rede e armazena no cache
 */
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);

    // Apenas cacheia respostas bem-sucedidas
    if (response.ok && response.status !== 206) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.warn('[SW] Fetch falhou:', request.url, error.message);
    throw error;
  }
}

/**
 * Atualiza cache em background sem bloquear resposta
 */
function updateCacheInBackground(request, cacheName) {
  fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(cacheName);
        await cache.put(request, response);
      }
    })
    .catch(() => {
      // Ignora erros de atualizacao em background
    });
}

/**
 * Limpa itens antigos do cache baseado no limite configurado
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    // Remove os mais antigos (primeiros da lista)
    const deleteCount = keys.length - maxItems;
    const deletePromises = keys.slice(0, deleteCount).map(key => cache.delete(key));
    await Promise.all(deletePromises);
  }
}

// ============================================================
// EVENTO DE FETCH (intercepta todas as requisicoes)
// ============================================================
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignora requisicoes que nao sao GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignora requisicoes externas (exceto fontes do Google)
  if (!url.origin.includes(self.location.origin) &&
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // Ignora APIs que nao devem ser cacheadas
  if (url.pathname.includes('/api/') &&
      (url.pathname.includes('/auth/') ||
       url.pathname.includes('/webhook') ||
       request.method !== 'GET')) {
    return;
  }

  // Ignora extensoes do navegador
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }

  const cacheType = getCacheType(request);
  const cacheName = CACHE_NAMES[cacheType];

  event.respondWith(
    (async () => {
      try {
        // Escolhe estrategia baseada no tipo de conteudo
        switch (cacheType) {
          case 'fonts':
            // Fontes: Cache First (raramente mudam)
            return await cacheFirst(request, cacheName);

          case 'images':
            // Imagens: Cache First com revalidacao
            return await cacheFirst(request, cacheName);

          case 'static':
            // JS/CSS: Stale While Revalidate
            return await staleWhileRevalidate(request, cacheName);

          case 'api':
            // APIs: Network First com timeout curto
            return await networkFirst(request, cacheName, 5000);

          case 'pages':
          default:
            // Paginas: Network First para garantir conteudo atualizado
            return await networkFirst(request, cacheName, 3000);
        }

      } catch (error) {
        console.warn('[SW] Erro ao processar:', request.url, error.message);

        // Se for navegacao, mostra pagina offline
        if (request.mode === 'navigate') {
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }

          // Fallback HTML inline
          return new Response(
            `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>NutriVida - Offline</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 20px;
                }
                .container {
                  text-align: center;
                  max-width: 400px;
                }
                .icon {
                  font-size: 64px;
                  margin-bottom: 20px;
                }
                h1 {
                  color: #be185d;
                  font-size: 24px;
                  margin-bottom: 12px;
                }
                p {
                  color: #6b7280;
                  margin-bottom: 24px;
                  line-height: 1.6;
                }
                button {
                  background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
                  color: white;
                  border: none;
                  padding: 14px 32px;
                  border-radius: 12px;
                  font-size: 16px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: transform 0.2s, box-shadow 0.2s;
                }
                button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 10px 20px rgba(236, 72, 153, 0.3);
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">📡</div>
                <h1>Voce esta offline</h1>
                <p>Nao foi possivel conectar ao NutriVida. Verifique sua conexao com a internet e tente novamente.</p>
                <button onclick="location.reload()">Tentar novamente</button>
              </div>
            </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
              status: 503
            }
          );
        }

        // Para outros recursos, retorna erro generico
        return new Response('Recurso indisponivel offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});

// ============================================================
// EVENTO DE MESSAGE (comunicacao com a pagina)
// ============================================================
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      // Forca atualizacao imediata do SW
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      // Limpa todos os caches
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
      break;

    case 'CACHE_URLS':
      // Cacheia URLs especificas enviadas pela pagina
      if (payload?.urls && Array.isArray(payload.urls)) {
        caches.open(CACHE_NAMES.pages).then(cache => {
          payload.urls.forEach(url => {
            fetch(url).then(response => {
              if (response.ok) cache.put(url, response);
            }).catch(() => {});
          });
        });
      }
      break;

    case 'GET_VERSION':
      // Retorna versao atual do SW
      event.ports[0]?.postMessage({ version: CACHE_VERSION });
      break;
  }
});

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || 'Voce tem uma nova notificacao!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      tag: data.tag || 'nutrivida-notification',
      renotify: true,
      requireInteraction: data.requireInteraction || false,
      data: {
        url: data.url || '/nutrivida/dashboard',
        timestamp: Date.now()
      },
      actions: data.actions || [
        { action: 'open', title: 'Abrir' },
        { action: 'dismiss', title: 'Fechar' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'NutriVida',
        options
      )
    );

  } catch (error) {
    console.error('[SW] Erro ao processar push:', error);
  }
});

// ============================================================
// NOTIFICATION CLICK
// ============================================================
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const url = notification.data?.url || '/nutrivida/dashboard';

  notification.close();

  if (action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Procura uma aba existente do app
        for (const client of clientList) {
          if (client.url.includes('/nutrivida') && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Se nao encontrar, abre nova aba
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// ============================================================
// BACKGROUND SYNC (para envio de dados offline)
// ============================================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Processa dados pendentes armazenados no IndexedDB
      syncPendingData()
    );
  }
});

async function syncPendingData() {
  // Implementacao futura para sincronizar dados offline
  // Por exemplo: enviar refeicoes registradas, treinos concluidos, etc.
  console.log('[SW] Sincronizando dados pendentes...');
}

// ============================================================
// PERIODIC BACKGROUND SYNC (atualizacao periodica)
// ============================================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(
      updateCachedContent()
    );
  }
});

async function updateCachedContent() {
  console.log('[SW] Atualizando conteudo em background...');

  try {
    // Atualiza paginas principais
    const pagesToUpdate = [
      '/nutrivida/dashboard',
      '/nutrivida/dashboard/refeicoes',
      '/nutrivida/dashboard/treinos',
    ];

    const cache = await caches.open(CACHE_NAMES.pages);

    for (const url of pagesToUpdate) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (err) {
        // Ignora erros individuais
      }
    }

  } catch (error) {
    console.error('[SW] Erro ao atualizar conteudo:', error);
  }
}

// ============================================================
// LOG INICIAL
// ============================================================
console.log('[SW] NutriVida Service Worker carregado - Versao:', CACHE_VERSION);
