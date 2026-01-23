// ============================================================
// StudyHub PWA Service Worker - Versao de Producao v3.0.0
// ============================================================
// Este service worker implementa estrategias avancadas de cache
// para garantir funcionamento offline e performance otimizada
// para todo o app: StudyHub, PREPARA MED e NutriVida.
// ============================================================

// ======================
// CONFIGURACAO DE VERSAO
// ======================
// Incremente esta versao ao fazer deploy para forcar atualizacao do cache
const CACHE_VERSION = 'v3.1.0';

// Nomes dos caches separados por tipo de conteudo
// Isso permite gerenciar diferentes estrategias e tempos de expiracao
const CACHE_NAMES = {
  // Cache para arquivos estaticos (HTML, CSS, JS compilados)
  static: `studyhub-static-${CACHE_VERSION}`,

  // Cache para imagens e icones
  images: `studyhub-images-${CACHE_VERSION}`,

  // Cache para fontes (Google Fonts, etc)
  fonts: `studyhub-fonts-${CACHE_VERSION}`,

  // Cache para respostas de API (apenas GET cacheavel)
  api: `studyhub-api-${CACHE_VERSION}`,

  // Cache para paginas navegadas pelo usuario
  pages: `studyhub-pages-${CACHE_VERSION}`,

  // Cache para assets do Next.js
  nextjs: `studyhub-nextjs-${CACHE_VERSION}`,
};

// URL da pagina offline (fallback quando sem conexao)
const OFFLINE_URL = '/offline';

// ============================================================
// ASSETS PARA PRE-CACHE
// ============================================================
// Estes arquivos sao baixados imediatamente na instalacao do SW
// para garantir que o app funcione offline desde o primeiro acesso
const PRECACHE_ASSETS = [
  // === PAGINAS PRINCIPAIS ===
  '/',
  '/offline',

  // === PREPARA MED ===
  '/medicina',
  '/medicina/login',
  '/medicina/cadastro',

  // === NUTRIVIDA ===
  '/nutrivida',
  '/nutrivida/login',
  '/nutrivida/cadastro',

  // === MANIFEST E CONFIGURACOES ===
  '/manifest.json',
  '/favicon.ico',

  // === ICONES PRINCIPAIS ===
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
    fonts: 60 * 60 * 24 * 365,    // 1 ano para fontes (raramente mudam)
    api: 60 * 5,                   // 5 minutos para respostas de API
    pages: 60 * 60 * 24,          // 1 dia para paginas HTML
    nextjs: 60 * 60 * 24 * 7,     // 7 dias para assets do Next.js
  },

  // Numero maximo de itens em cada cache (evita crescimento infinito)
  maxItems: {
    static: 100,
    images: 80,
    fonts: 30,
    api: 50,
    pages: 40,
    nextjs: 150,
  }
};

// ============================================================
// URLs QUE NUNCA DEVEM SER CACHEADAS
// ============================================================
// Estas rotas sempre vao direto para a rede
const NEVER_CACHE_URLS = [
  '/api/auth/',           // Autenticacao
  '/api/webhook',         // Webhooks
  '/api/stripe',          // Pagamentos
  '/api/cakto',           // Pagamentos Cakto
  '/api/medicina/ia/chat',// Chat IA (streaming)
  '/api/nutrivida/ia',    // Chat IA NutriVida
  '/_next/webpack-hmr',   // Hot Module Replacement (dev)
  '/supabase/',           // Supabase realtime
  '/auth/callback',       // Callback de autenticacao
  '/login',               // Paginas de login
  '/cadastro',            // Paginas de cadastro
  '/esqueci-senha',       // Paginas de recuperacao
  '/redefinir-senha',     // Paginas de redefinicao
];

// ============================================================
// EVENTO DE INSTALACAO
// ============================================================
// Executado quando o SW e instalado pela primeira vez
// ou quando uma nova versao e detectada
self.addEventListener('install', (event) => {
  console.log('[SW] ==========================================');
  console.log('[SW] Instalando Service Worker versao:', CACHE_VERSION);
  console.log('[SW] ==========================================');

  event.waitUntil(
    (async () => {
      try {
        // Abre o cache estatico para pre-cachear assets
        const staticCache = await caches.open(CACHE_NAMES.static);

        // Pre-cacheia cada asset individualmente para nao falhar se um der erro
        // (diferente de addAll que falha tudo se um falhar)
        const cacheResults = await Promise.allSettled(
          PRECACHE_ASSETS.map(async (url) => {
            try {
              // Busca com cache: 'reload' para garantir versao mais recente
              const response = await fetch(url, {
                cache: 'reload',
                credentials: 'same-origin'
              });

              if (response.ok) {
                await staticCache.put(url, response);
                return { url, status: 'cached' };
              }
              return { url, status: 'failed', reason: `HTTP ${response.status}` };
            } catch (err) {
              return { url, status: 'failed', reason: err.message };
            }
          })
        );

        // Log dos resultados
        const cached = cacheResults.filter(r => r.value?.status === 'cached').length;
        const failed = cacheResults.filter(r => r.value?.status === 'failed').length;
        console.log(`[SW] Pre-cache concluido: ${cached} sucesso, ${failed} falhas`);

        // Forca ativacao imediata (skipWaiting nao espera abas fecharem)
        await self.skipWaiting();
        console.log('[SW] skipWaiting executado');

      } catch (error) {
        console.error('[SW] Erro critico na instalacao:', error);
      }
    })()
  );
});

// ============================================================
// EVENTO DE ATIVACAO
// ============================================================
// Executado quando o SW assume o controle da pagina
// Momento ideal para limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] ==========================================');
  console.log('[SW] Ativando Service Worker versao:', CACHE_VERSION);
  console.log('[SW] ==========================================');

  event.waitUntil(
    (async () => {
      try {
        // Lista todos os caches existentes
        const existingCaches = await caches.keys();

        // Lista de caches validos da versao atual
        const validCaches = Object.values(CACHE_NAMES);

        // Remove caches de versoes antigas
        const deletionResults = await Promise.allSettled(
          existingCaches
            .filter(name => !validCaches.includes(name))
            .map(async (name) => {
              console.log('[SW] Removendo cache antigo:', name);
              await caches.delete(name);
              return name;
            })
        );

        const deleted = deletionResults.filter(r => r.status === 'fulfilled').length;
        console.log(`[SW] ${deleted} caches antigos removidos`);

        // Assume controle de todas as abas imediatamente
        // Isso garante que o novo SW controle paginas ja abertas
        await self.clients.claim();
        console.log('[SW] clients.claim() executado');

        // Notifica todas as paginas sobre a atualizacao
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION
          });
        });

        console.log('[SW] Ativacao concluida com sucesso');

      } catch (error) {
        console.error('[SW] Erro na ativacao:', error);
      }
    })()
  );
});

// ============================================================
// FUNCOES AUXILIARES DE CACHE
// ============================================================

/**
 * Determina o tipo de cache baseado na URL e headers da requisicao
 * @param {Request} request - Objeto Request do fetch
 * @returns {string} - Tipo de cache ('static', 'images', etc)
 */
function getCacheType(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const hostname = url.hostname;

  // === FONTES ===
  // Google Fonts e arquivos de fonte locais
  if (pathname.match(/\.(woff2?|ttf|otf|eot)$/i) ||
      hostname.includes('fonts.googleapis.com') ||
      hostname.includes('fonts.gstatic.com')) {
    return 'fonts';
  }

  // === IMAGENS ===
  // Todos os formatos de imagem comuns
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|avif)$/i)) {
    return 'images';
  }

  // === NEXT.JS ASSETS ===
  // Arquivos compilados pelo Next.js
  if (pathname.includes('/_next/static/')) {
    return 'nextjs';
  }

  // === ARQUIVOS ESTATICOS ===
  // JavaScript, CSS e outros assets
  if (pathname.match(/\.(js|css|json)$/i)) {
    return 'static';
  }

  // === APIs ===
  // Rotas de API (apenas GET)
  if (pathname.includes('/api/') && request.method === 'GET') {
    return 'api';
  }

  // === PAGINAS ===
  // Navegacao HTML
  if (request.mode === 'navigate' ||
      request.headers.get('accept')?.includes('text/html')) {
    return 'pages';
  }

  // Fallback para estatico
  return 'static';
}

/**
 * Verifica se a URL nunca deve ser cacheada
 * @param {string} pathname - Caminho da URL
 * @returns {boolean}
 */
function shouldNeverCache(pathname) {
  return NEVER_CACHE_URLS.some(pattern => pathname.includes(pattern));
}

/**
 * Estrategia: Cache First (Stale-While-Revalidate)
 * Retorna cache imediatamente e atualiza em background
 * Ideal para: fontes, imagens, assets estaticos
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Atualiza cache em background (nao bloqueia resposta)
    updateCacheInBackground(request, cacheName);
    return cachedResponse;
  }

  // Se nao tem cache, busca da rede e cacheia
  return fetchAndCache(request, cacheName);
}

/**
 * Estrategia: Network First com Timeout
 * Tenta rede primeiro, fallback para cache se falhar ou timeout
 * Ideal para: paginas HTML, APIs
 */
async function networkFirst(request, cacheName, timeout = 3000) {
  // Controller para abortar fetch se demorar demais
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(request, {
      signal: controller.signal,
      credentials: 'same-origin',
      redirect: 'follow'
    });
    clearTimeout(timeoutId);

    // NAO cachear redirecionamentos (podem ser temporarios de auth)
    if (response.redirected || response.type === 'opaqueredirect') {
      console.log('[SW] Resposta redirecionada, nao cacheando:', request.url);
      return response;
    }

    if (response.ok && response.status === 200) {
      // Cacheia apenas respostas 200 OK (nao redirecionadas)
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      return response;
    }

    // Para outros status (3xx, 4xx), retorna sem cachear
    return response;

  } catch (error) {
    clearTimeout(timeoutId);

    // Fallback para cache apenas se nao for pagina de auth
    const url = new URL(request.url);
    if (url.pathname.includes('/login') ||
        url.pathname.includes('/cadastro') ||
        url.pathname.includes('/auth')) {
      throw error; // Nao usar cache para paginas de auth
    }

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Network falhou, usando cache:', request.url);
      return cachedResponse;
    }

    // Sem cache disponivel
    throw error;
  }
}

/**
 * Estrategia: Stale While Revalidate
 * Retorna cache imediatamente, atualiza em background
 * Ideal para: assets que mudam pouco mas precisam estar atualizados
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch em background (sempre, independente do cache)
  const fetchPromise = fetch(request, { credentials: 'same-origin' })
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Retorna cache se disponivel, senao espera fetch
  return cachedResponse || fetchPromise;
}

/**
 * Busca da rede e armazena no cache
 */
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request, {
      credentials: 'same-origin',
      redirect: 'follow'
    });

    // NAO cacheia redirecionamentos
    if (response.redirected || response.type === 'opaqueredirect') {
      console.log('[SW] Resposta redirecionada, nao cacheando:', request.url);
      return response;
    }

    // So cacheia respostas bem-sucedidas e completas (200 OK)
    if (response.ok && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.warn('[SW] Fetch falhou:', request.url);
    throw error;
  }
}

/**
 * Atualiza cache em background sem bloquear
 */
function updateCacheInBackground(request, cacheName) {
  fetch(request, { credentials: 'same-origin' })
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
 * Limita tamanho do cache removendo itens antigos
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    const deleteCount = keys.length - maxItems;
    const deletePromises = keys.slice(0, deleteCount).map(key => cache.delete(key));
    await Promise.all(deletePromises);
    console.log(`[SW] Cache ${cacheName} trimado: ${deleteCount} itens removidos`);
  }
}

// ============================================================
// EVENTO DE FETCH (intercepta todas as requisicoes)
// ============================================================
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // === FILTROS: Requisicoes que nao devem ser interceptadas ===

  // Ignora metodos que nao sao GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignora extensoes do navegador
  if (url.protocol === 'chrome-extension:' ||
      url.protocol === 'moz-extension:' ||
      url.protocol === 'safari-extension:') {
    return;
  }

  // Ignora URLs que nunca devem ser cacheadas
  if (shouldNeverCache(url.pathname)) {
    return;
  }

  // Ignora requisicoes externas (exceto fontes do Google)
  const isGoogleFonts = url.hostname.includes('fonts.googleapis.com') ||
                        url.hostname.includes('fonts.gstatic.com');
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin && !isGoogleFonts) {
    return;
  }

  // === PROCESSAMENTO DA REQUISICAO ===
  const cacheType = getCacheType(request);
  const cacheName = CACHE_NAMES[cacheType];

  event.respondWith(
    (async () => {
      try {
        // Seleciona estrategia baseada no tipo de conteudo
        switch (cacheType) {
          case 'fonts':
            // Fontes: Cache First (quase nunca mudam)
            return await cacheFirst(request, cacheName);

          case 'images':
            // Imagens: Cache First com revalidacao em background
            return await cacheFirst(request, cacheName);

          case 'nextjs':
            // Next.js assets: Stale While Revalidate
            // (hash no nome garante que mudou se o arquivo mudou)
            return await staleWhileRevalidate(request, cacheName);

          case 'static':
            // JS/CSS: Stale While Revalidate
            return await staleWhileRevalidate(request, cacheName);

          case 'api':
            // APIs: Network First com timeout curto
            return await networkFirst(request, cacheName, 5000);

          case 'pages':
          default:
            // Paginas HTML: Network First para garantir conteudo atualizado
            return await networkFirst(request, cacheName, 4000);
        }

      } catch (error) {
        console.warn('[SW] Erro ao processar requisicao:', request.url);

        // === FALLBACK PARA NAVEGACAO (pagina offline) ===
        if (request.mode === 'navigate') {
          // Tenta retornar pagina offline do cache
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }

          // Fallback HTML inline (ultimo recurso)
          return new Response(
            generateOfflineHTML(),
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
              status: 503
            }
          );
        }

        // Para outros recursos, retorna erro
        return new Response('Recurso indisponivel offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});

/**
 * Gera HTML da pagina offline inline (fallback final)
 */
function generateOfflineHTML() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#6366f1">
  <title>StudyHub - Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #f6f7f8 0%, #e5e7eb 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 420px;
      background: white;
      padding: 48px 32px;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
    }
    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 36px;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .btn {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
    }
    .btn:active {
      transform: translateY(0);
    }
    .status {
      margin-top: 24px;
      padding: 12px 16px;
      background: #fef3c7;
      border-radius: 8px;
      color: #92400e;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>Voce esta offline</h1>
    <p>Nao foi possivel conectar ao StudyHub. Verifique sua conexao com a internet e tente novamente.</p>
    <button class="btn" onclick="location.reload()">
      <span>🔄</span> Tentar novamente
    </button>
    <div class="status" id="status">
      Verificando conexao...
    </div>
  </div>
  <script>
    // Verifica conexao periodicamente
    function checkConnection() {
      const status = document.getElementById('status');
      if (navigator.onLine) {
        status.textContent = '✅ Conexao detectada! Recarregando...';
        status.style.background = '#d1fae5';
        status.style.color = '#065f46';
        setTimeout(() => location.reload(), 1000);
      } else {
        status.textContent = '⚠️ Sem conexao com a internet';
      }
    }

    // Verifica ao carregar
    checkConnection();

    // Escuta mudancas de conexao
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', () => {
      document.getElementById('status').textContent = '⚠️ Sem conexao com a internet';
    });

    // Verifica periodicamente
    setInterval(checkConnection, 5000);
  </script>
</body>
</html>`;
}

// ============================================================
// EVENTO DE MESSAGE (comunicacao com a pagina)
// ============================================================
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  console.log('[SW] Mensagem recebida:', type);

  switch (type) {
    case 'SKIP_WAITING':
      // Forca atualizacao imediata do SW
      self.skipWaiting();
      break;

    case 'CLEAR_ALL_CACHES':
      // Limpa todos os caches (para debug ou reset)
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name)))
          .then(() => {
            console.log('[SW] Todos os caches limpos');
            event.ports[0]?.postMessage({ success: true });
          });
      });
      break;

    case 'CACHE_URLS':
      // Cacheia URLs especificas enviadas pela pagina
      if (payload?.urls && Array.isArray(payload.urls)) {
        const cacheName = CACHE_NAMES.pages;
        caches.open(cacheName).then(cache => {
          payload.urls.forEach(url => {
            fetch(url, { credentials: 'same-origin' })
              .then(response => {
                if (response.ok) cache.put(url, response);
              })
              .catch(() => {});
          });
        });
      }
      break;

    case 'GET_VERSION':
      // Retorna versao atual do SW
      event.ports[0]?.postMessage({
        version: CACHE_VERSION,
        caches: Object.keys(CACHE_NAMES)
      });
      break;

    case 'TRIM_CACHES':
      // Limpa itens antigos de todos os caches
      Object.entries(CACHE_NAMES).forEach(([type, name]) => {
        trimCache(name, CACHE_CONFIG.maxItems[type]);
      });
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
      tag: data.tag || 'studyhub-notification',
      renotify: true,
      requireInteraction: data.requireInteraction || false,
      data: {
        url: data.url || '/',
        timestamp: Date.now()
      },
      actions: data.actions || [
        { action: 'open', title: 'Abrir' },
        { action: 'dismiss', title: 'Fechar' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'StudyHub',
        options
      )
    );

  } catch (error) {
    console.error('[SW] Erro ao processar push notification:', error);
  }
});

// ============================================================
// NOTIFICATION CLICK
// ============================================================
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const url = notification.data?.url || '/';

  notification.close();

  if (action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Procura uma aba existente do app
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
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
// BACKGROUND SYNC
// ============================================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);

  switch (event.tag) {
    case 'sync-pending-data':
      event.waitUntil(syncPendingData());
      break;
    case 'sync-analytics':
      event.waitUntil(syncAnalytics());
      break;
  }
});

async function syncPendingData() {
  console.log('[SW] Sincronizando dados pendentes...');
  // Implementacao futura: sincronizar dados armazenados offline
  // Ex: questoes respondidas, refeicoes registradas, etc.
}

async function syncAnalytics() {
  console.log('[SW] Sincronizando analytics...');
  // Implementacao futura: enviar eventos de analytics armazenados offline
}

// ============================================================
// PERIODIC BACKGROUND SYNC (Chrome 80+)
// ============================================================
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic Sync:', event.tag);

  if (event.tag === 'update-content') {
    event.waitUntil(updateCachedContent());
  }
});

async function updateCachedContent() {
  console.log('[SW] Atualizando conteudo em background...');

  const pagesToUpdate = [
    '/',
    '/medicina/dashboard',
    '/nutrivida/dashboard',
  ];

  const cache = await caches.open(CACHE_NAMES.pages);

  for (const url of pagesToUpdate) {
    try {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (err) {
      // Ignora erros individuais
    }
  }
}

// ============================================================
// LOG INICIAL
// ============================================================
console.log('[SW] ==========================================');
console.log('[SW] StudyHub Service Worker carregado');
console.log('[SW] Versao:', CACHE_VERSION);
console.log('[SW] Escopo:', self.registration.scope);
console.log('[SW] ==========================================');
