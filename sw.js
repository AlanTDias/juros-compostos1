const VERSAO = 'ad580a549a';
const CACHE_ESTATICO = 'excalc-estatico-' + VERSAO;
const CACHE_PAGINAS = 'excalc-paginas-' + VERSAO;
const PRECACHE = [
    "/offline.html",
    "/tailwind.min.css?v=3276c4e2",
    "/style.min.css?v=73ec2d14",
    "/js/arquivos.js?v=6492a6ef",
    "/js/core.js?v=6492a6ef",
    "/js/documentos.js?v=6492a6ef",
    "/js/financeiro.js?v=6492a6ef",
    "/js/indicadores.js?v=6492a6ef",
    "/js/mercado.js?v=6492a6ef",
    "/js/midia.js?v=6492a6ef",
    "/js/utilitarios.js?v=6492a6ef",
    "/js/lib/chart-4.6.2.umd.min.js",
    "/fontes/inter-latin.woff2",
    "/fontes/jetbrains-mono-latin.woff2",
    "/fontes/space-grotesk-latin.woff2",
    "/icones/icone-192.png",
    "/icones/icone-512.png",
    "/icones/icone-maskable-192.png",
    "/icones/icone-maskable-512.png",
    "/favicon.png?v=3",
    "/apple-touch-icon.png?v=4",
    "/manifest.webmanifest"
];
const CALCULADORAS = [
    "/",
    "/juros-compostos.html",
    "/reserva-de-emergencia.html",
    "/rumo-ao-milhao.html",
    "/financiamento-imobiliario.html",
    "/financiamento-de-veiculos.html",
    "/amortizacao-extra.html",
    "/alugar-ou-comprar.html",
    "/a-vista-ou-parcelado.html",
    "/comparador-de-investimentos.html",
    "/calculadora-fgts.html",
    "/rescisao-clt.html",
    "/salario-liquido.html",
    "/calculadora-de-porcentagem.html"
];
const PAGINA_OFFLINE = '/offline.html';
const HOSTS_IGNORADOS = /(^|\.)(google\.com|googlesyndication\.com|doubleclick\.net|gstatic\.com|googletagservices\.com|adtrafficquality\.google|bcb\.gov\.br|awesomeapi\.com\.br|cdnjs\.cloudflare\.com|jsdelivr\.net)$/;

self.addEventListener('install', evento => {
    evento.waitUntil(
        caches.open(CACHE_ESTATICO)
            .then(cache => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', evento => {
    evento.waitUntil(
        caches.keys()
            .then(nomes => Promise.all(nomes
                .filter(nome => nome.startsWith('excalc-') && nome !== CACHE_ESTATICO && nome !== CACHE_PAGINAS)
                .map(nome => caches.delete(nome))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', evento => {
    if (evento.data === 'precache-calculadoras') {
        evento.waitUntil(precacheCalculadoras());
    }
});

async function precacheCalculadoras() {
    const cache = await caches.open(CACHE_PAGINAS);
    for (const url of CALCULADORAS) {
        if (await cache.match(url)) continue;
        try {
            const resposta = await fetch(url, { credentials: 'same-origin' });
            if (resposta.ok) await cache.put(url, resposta);
        } catch (e) {
            return;
        }
    }
}

self.addEventListener('fetch', evento => {
    const req = evento.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin || HOSTS_IGNORADOS.test(url.hostname)) return;

    if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
        evento.respondWith(redePrimeiro(req));
        return;
    }
    evento.respondWith(cacheEAtualiza(evento, req));
});

async function redePrimeiro(req) {
    const cache = await caches.open(CACHE_PAGINAS);
    try {
        const resposta = await fetch(req);
        if (resposta.ok && resposta.type === 'basic') cache.put(req, resposta.clone());
        return resposta;
    } catch (e) {
        return (await cache.match(req, { ignoreSearch: true }))
            || (await caches.match(req, { ignoreSearch: true }))
            || (await caches.match(PAGINA_OFFLINE))
            || Response.error();
    }
}

async function cacheEAtualiza(evento, req) {
    const cache = await caches.open(CACHE_ESTATICO);
    const guardada = await cache.match(req);
    const daRede = fetch(req)
        .then(resposta => {
            if (resposta.ok && resposta.type === 'basic') cache.put(req, resposta.clone());
            return resposta;
        })
        .catch(() => null);
    if (guardada) {
        evento.waitUntil(daRede);
        return guardada;
    }
    return (await daRede) || Response.error();
}
