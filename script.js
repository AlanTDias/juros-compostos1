let myChart = null;

// ==========================================
// CARREGAMENTO SOB DEMANDA DE BIBLIOTECAS
// ==========================================
// Libs pesadas (PDF, Word, Excel...) só são baixadas quando a função que as usa é acionada.
// Chart.js continua no index.html porque a calculadora inicial depende dele.
// Novas libs: registrar aqui E liberar o domínio na CSP do index.html.
const LIBS_SOB_DEMANDA = {
    pdflib: { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', pronta: () => window.PDFLib },
    pdfjs: {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
        pronta: () => window.pdfjsLib,
        aoCarregar: () => {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    },
    docx: { src: 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js', pronta: () => window.docx },
    xlsx: { src: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', pronta: () => window.XLSX },
    mammoth: { src: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', pronta: () => window.mammoth },
    html2pdf: { src: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', pronta: () => window.html2pdf },
    vantaclouds: { src: 'https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.clouds.min.js', pronta: () => window.VANTA && window.VANTA.CLOUDS },
    qrcode: { src: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', pronta: () => window.QRCode },
    // Fundo animado (Vanta.js "fog"): o Vanta precisa do three.js (r134) já carregado
    three: { src: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js', pronta: () => window.THREE },
    vantafog: { src: 'https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.fog.min.js', pronta: () => window.VANTA && window.VANTA.FOG }
};
const libsEmCarga = {};

function carregarLib(nome) {
    const lib = LIBS_SOB_DEMANDA[nome];
    if (!lib) return Promise.reject(new Error(`Biblioteca desconhecida: ${nome}`));
    if (lib.pronta()) return Promise.resolve();
    if (!libsEmCarga[nome]) {
        libsEmCarga[nome] = new Promise((resolve, reject) => {
            const tag = document.createElement('script');
            tag.src = lib.src;
            tag.crossOrigin = 'anonymous';
            tag.referrerPolicy = 'no-referrer';
            tag.onload = () => {
                if (lib.aoCarregar) lib.aoCarregar();
                resolve();
            };
            tag.onerror = () => {
                delete libsEmCarga[nome]; // permite tentar de novo depois
                reject(new Error('Não foi possível carregar uma biblioteca necessária. Verifique sua conexão e tente novamente.'));
            };
            document.head.appendChild(tag);
        });
    }
    return libsEmCarga[nome];
}

function carregarLibs(...nomes) {
    return Promise.all(nomes.map(carregarLib));
}

// ==========================================
// FUNDO ANIMADO: névoa (Vanta.js "fog") nas cores navy + ciano do site
// ==========================================
// Carrega depois do site já estar utilizável e falha em silêncio (sem WebGL/CDN o site segue
// com o fundo normal). Fica no <div id="fundo-fog"> (fixo, atrás de tudo). O Modo Viagem
// pausa o efeito enquanto está aberto para não gastar GPU à toa.
let fogEfeito = null;

async function iniciarFog() {
    const el = document.getElementById('fundo-fog');
    if (!el || fogEfeito) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // respeita quem pede menos movimento
    try {
        await carregarLib('three');
        await carregarLib('vantafog');
        if (fogEfeito) return; // outra chamada já criou enquanto carregava
        fogEfeito = VANTA.FOG({
            el,
            mouseControls: false,
            touchControls: false,
            gyroControls: false,
            minHeight: 200,
            minWidth: 200,
            highlightColor: 0x0e7490, // ciano escuro (luzes da névoa)
            midtoneColor: 0x123a63,   // azul navy (tons médios)
            lowlightColor: 0x0b1120,  // navy profundo (sombras)
            baseColor: 0x05070e,      // fundo quase preto-azulado
            blurFactor: 0.3,          // "blur em 30%": névoa mais definida que o padrão do Vanta (0.6)
            speed: 1.0,
            zoom: 1.0
        });
    } catch (erro) {
        console.warn('Fundo animado indisponível:', erro && erro.message);
    }
}

function pararFog() {
    if (fogEfeito) {
        fogEfeito.destroy();
        fogEfeito = null;
    }
}

window.addEventListener('load', () => setTimeout(iniciarFog, 400));

// ==========================================
// CONFIGURAÇÃO DE ABAS COM CORES
// ==========================================
const abas = [
    { id: 'home', nome: 'Início', color: 'emerald' },
    { id: 'juros-compostos', nome: 'Juros Compostos', color: 'cyan' },
    { id: 'reserva', nome: 'Reserva', color: 'blue' },
    { id: 'milhao', nome: 'Rumo ao Milhão', color: 'indigo' },
    { id: 'financiamento', nome: 'Imóvel', color: 'purple' },
    { id: 'veiculos', nome: 'Veículos', color: 'rose' },
    { id: 'amortizacao', nome: 'Amortização', color: 'amber' },
    { id: 'alugar-comprar', nome: 'Alugar vs Comp.', color: 'sky' },
    { id: 'comparador', nome: 'À Vista vs Parc.', color: 'violet' },
    { id: 'fgts', nome: 'FGTS', color: 'teal' },
    { id: 'rescisao-clt', nome: 'Rescisão CLT', color: 'fuchsia' },
    { id: 'documentos', nome: 'Gerador Docs', color: 'lime' },
    { id: 'conversores', nome: 'Conversores', color: 'green' },
    { id: 'foto-video', nome: 'Foto & Vídeo', color: 'orange' },
    { id: 'qrcode', nome: 'QR-Code', color: 'red' }
];

// Ícones das abas: SVG inline (traço herdando a cor do texto via currentColor), sem depender de CDN.
const ICONES_ABAS = {
    'home': '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    'juros-compostos': '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    'reserva': '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    'milhao': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    'financiamento': '<path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/>',
    'veiculos': '<path d="M5 16l1.5-5a2 2 0 0 1 2-1.5h7a2 2 0 0 1 2 1.5L19 16"/><rect x="3" y="16" width="18" height="4" rx="1"/><path d="M7 18h.01M17 18h.01"/>',
    'amortizacao': '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    'alugar-comprar': '<path d="M12 3v18"/><path d="M6 21h12"/><path d="M4 7h16"/><path d="M6 7l-3 7a3 3 0 0 0 6 0z"/><path d="M18 7l-3 7a3 3 0 0 0 6 0z"/>',
    'comparador': '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5"/><path d="M12 6v2M12 16v2"/>',
    'fgts': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M3 13h18"/>',
    'rescisao-clt': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    'documentos': '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    'conversores': '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    'foto-video': '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-9 9"/>',
    'qrcode': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v1M14 20h1M18 20h3v-3"/>'
};

function iconeAba(id, px) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0">${ICONES_ABAS[id] || ''}</svg>`;
}

// Classes-base dos botões de aba (menu superior compacto e drawer mobile); usadas também em switchTab().
function classeBaseAba(cor, noDrawer) {
    return noDrawer
        ? `tab-btn tab-${cor} p-3 rounded-lg w-full text-left flex items-center gap-2 transition-all duration-200`
        : `tab-btn tab-${cor} px-2 py-1 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 text-center h-8`;
}

// Renderizar abas dinamicamente
function renderMenuTabs() {
    const menuNav = document.getElementById('menu-nav');
    const drawerNav = document.getElementById('drawer-nav');

    menuNav.innerHTML = abas.map(aba => `
        <button onclick="switchTab('${aba.id}')" id="btn-${aba.id}" 
            class="${classeBaseAba(aba.color, false)}"
            title="${aba.nome}">
            ${iconeAba(aba.id, 14)}
            <span class="text-[11px] font-semibold leading-tight whitespace-nowrap">${aba.nome}</span>
        </button>
    `).join('');

    drawerNav.innerHTML = `<button onclick="closeMobileMenu()" class="self-end text-gray-400 hover:text-gray-100 text-2xl leading-none mb-4">✕</button>` + abas.map(aba => `
        <button onclick="switchTab('${aba.id}'); closeMobileMenu();" 
            class="${classeBaseAba(aba.color, true)}"
            title="${aba.nome}">
            ${iconeAba(aba.id, 18)}
            <span class="font-semibold">${aba.nome}</span>
        </button>
    `).join('');
}

function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    drawer.classList.toggle('hidden');
}

function closeMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    drawer.classList.add('hidden');
}

// Botão flutuante "não clique": a legenda muda a cada passada do mouse (a "trolagem")
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('troll-btn');
    const label = document.getElementById('troll-label');
    if (!btn || !label) return;

    const frases = ['não clique', 'sério, não clique', 'você foi avisado', 'último aviso...', 'ok, você pediu 🌀'];
    let i = 0;
    const proxima = () => { label.innerText = frases[Math.min(i, frases.length - 1)]; i++; };
    btn.addEventListener('mouseenter', proxima);
    btn.addEventListener('focus', proxima);
});

// ==========================================
// MODO VIAGEM: efeitos psicodélicos que reagem ao mouse/toque (caleidoscópio, rede neural e nuvens)
// Tudo dentro de uma IIFE; só abrirViagem() e fecharViagem() ficam globais (usadas pelo HTML).
// ==========================================
(function () {
    const overlay = document.getElementById('viagem');
    const canvas = document.getElementById('viagem-canvas');
    if (!overlay || !canvas) return;
    const ctx = canvas.getContext('2d');
    const bar = document.getElementById('viagem-bar');
    const dica = document.getElementById('viagem-dica');
    const nuvemEl = document.getElementById('viagem-nuvem');
    const DICA_PADRAO = dica.innerText;
    const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const velocidadeGlobal = reduzMovimento ? 0.4 : 1; // quem pede menos movimento recebe tudo mais devagar
    const FUNDO = '#05030f'; // mesmo valor de --viagem-bg no style.css

    let W = 0, H = 0, dpr = 1;
    let modo = 'caleido'; // caleidoscópio é o efeito principal
    let rodando = false;
    let rafId = 0;
    let t = 0;
    let velCores = 1; // multiplicador da troca de cor
    let timerBarra = null;

    // ---------- Ponteiro (mouse/toque) com piloto automático quando parado ----------
    const ponteiro = { x: 0, y: 0, ativo: false, ultimaAtividade: 0 };

    function moverPonteiro(x, y) {
        ponteiro.x = x;
        ponteiro.y = y;
        ponteiro.ativo = true;
        ponteiro.ultimaAtividade = performance.now();
    }

    // Se ninguém mexe no mouse por 3s, um "fantasma" desenha uma figura de Lissajous
    function pilotoAutomatico(agora) {
        if (agora - ponteiro.ultimaAtividade < 3000) return;
        const s = agora / 1000 * 0.6;
        ponteiro.x = W / 2 + Math.sin(s * 1.3) * W * 0.32;
        ponteiro.y = H / 2 + Math.sin(s * 1.9 + 1) * H * 0.3;
        ponteiro.ativo = true;
    }

    // ---------- Ondas de choque (clique/toque) ----------
    const ondas = [];
    function novaOnda(x, y) {
        ondas.push({ x, y, r: 0, vida: 1 });
    }

    // ---------- Efeito 1: rede neural ----------
    let nos = [];
    let pulsos = [];
    const DIST_LIGACAO = 140;
    const DIST_MOUSE = 220;

    function iniciarNeural() {
        const n = Math.max(40, Math.min(150, Math.floor((W * H) / 14000)));
        nos = [];
        pulsos = [];
        for (let i = 0; i < n; i++) {
            nos.push({
                x: Math.random() * W, y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
                hue: Math.random() * 360, r: 1.5 + Math.random() * 2
            });
        }
    }

    function desenharNeural() {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(5, 3, 15, 0.2)';
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';

        for (const n of nos) {
            const dx = ponteiro.x - n.x, dy = ponteiro.y - n.y;
            const d = Math.hypot(dx, dy) || 1;
            if (ponteiro.ativo && d < DIST_MOUSE) {
                const f = (1 - d / DIST_MOUSE) * 0.08;
                n.vx += (dx / d) * f + (-dy / d) * f * 0.8; // atrai e faz girar em volta
                n.vy += (dy / d) * f + (dx / d) * f * 0.8;
            }
            for (const o of ondas) {
                const ox = n.x - o.x, oy = n.y - o.y, od = Math.hypot(ox, oy) || 1;
                if (Math.abs(od - o.r) < 40) { n.vx += (ox / od) * 0.9 * o.vida; n.vy += (oy / od) * 0.9 * o.vida; }
            }
            const v = Math.hypot(n.vx, n.vy), vmax = 2.4;
            if (v > vmax) { n.vx *= vmax / v; n.vy *= vmax / v; }
            n.vx *= 0.995; n.vy *= 0.995;
            n.x += n.vx * velocidadeGlobal; n.y += n.vy * velocidadeGlobal;
            if (n.x < 0 || n.x > W) { n.vx *= -1; n.x = Math.max(0, Math.min(W, n.x)); }
            if (n.y < 0 || n.y > H) { n.vy *= -1; n.y = Math.max(0, Math.min(H, n.y)); }
            n.hue = (n.hue + 0.15 * velCores) % 360;
        }

        const ligacoes = [];
        ctx.lineWidth = 1;
        for (let i = 0; i < nos.length; i++) {
            for (let j = i + 1; j < nos.length; j++) {
                const a = nos[i], b = nos[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < DIST_LIGACAO) {
                    const alpha = 1 - d / DIST_LIGACAO;
                    ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 95%, 60%, ${alpha * 0.55})`;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    ligacoes.push([i, j]);
                }
            }
        }

        // o ponteiro é um "neurônio" que se liga aos nós próximos
        if (ponteiro.ativo) {
            for (const n of nos) {
                const d = Math.hypot(ponteiro.x - n.x, ponteiro.y - n.y);
                if (d < DIST_MOUSE) {
                    ctx.strokeStyle = `hsla(${n.hue}, 100%, 70%, ${(1 - d / DIST_MOUSE) * 0.9})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(ponteiro.x, ponteiro.y); ctx.lineTo(n.x, n.y); ctx.stroke();
                }
            }
            const g = ctx.createRadialGradient(ponteiro.x, ponteiro.y, 0, ponteiro.x, ponteiro.y, 40);
            g.addColorStop(0, `hsla(${t * 40 % 360}, 100%, 70%, 0.9)`);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(ponteiro.x, ponteiro.y, 40, 0, Math.PI * 2); ctx.fill();
        }

        // pulsos de "sinapse" viajando pelas ligações
        if (ligacoes.length && pulsos.length < 90 && Math.random() < 0.5) {
            const [i, j] = ligacoes[(Math.random() * ligacoes.length) | 0];
            pulsos.push({ de: i, para: j, p: 0, vel: 0.02 + Math.random() * 0.03 });
        }
        for (let k = pulsos.length - 1; k >= 0; k--) {
            const s = pulsos[k];
            const a = nos[s.de], b = nos[s.para];
            s.p += s.vel * velocidadeGlobal;
            if (s.p >= 1) {
                const viz = ligacoes.filter(l => l[0] === s.para || l[1] === s.para);
                if (viz.length && Math.random() < 0.85) {
                    const l = viz[(Math.random() * viz.length) | 0];
                    s.de = s.para; s.para = l[0] === s.para ? l[1] : l[0]; s.p = 0;
                } else { pulsos.splice(k, 1); }
                continue;
            }
            const x = a.x + (b.x - a.x) * s.p, y = a.y + (b.y - a.y) * s.p;
            const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
            g.addColorStop(0, `hsla(${a.hue}, 100%, 85%, 1)`);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
        }

        for (const n of nos) {
            ctx.fillStyle = `hsla(${n.hue}, 100%, 65%, 0.95)`;
            ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
        }
    }

    // ---------- Efeito 2: nuvens realistas (Vanta.js "clouds") ----------
    // Não usa o canvas 2D: o Vanta cria o próprio canvas WebGL dentro de #viagem-nuvem.
    let nuvemEfeito = null;

    async function iniciarNuvem() {
        if (nuvemEfeito || !nuvemEl) return;
        dica.innerText = '☁️ Carregando as nuvens...';
        dica.classList.remove('oculta');
        try {
            await carregarLibs('three', 'vantaclouds');
            if (!rodando || modo !== 'nuvem' || nuvemEfeito) return; // o usuário já trocou de efeito
            nuvemEfeito = VANTA.CLOUDS({
                el: nuvemEl,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200,
                minWidth: 200,
                speed: reduzMovimento ? 0.4 : 1.2,
                skyColor: 0x0a2a5e,         // céu azul-navy
                cloudColor: 0xa9c4ee,       // nuvens azuladas claras
                cloudShadowColor: 0x0b1120, // sombras no navy do site
                sunColor: 0x22d3ee,         // "sol" ciano (cor de destaque do site)
                sunGlareColor: 0x0e7490,
                sunlightColor: 0x67e8f9
            });
            dica.innerText = DICA_PADRAO;
        } catch (erro) {
            console.warn('Nuvens indisponíveis:', erro && erro.message);
            dica.innerText = 'Não foi possível carregar as nuvens. Verifique a conexão e tente de novo.';
        }
        setTimeout(() => dica.classList.add('oculta'), 5000);
    }

    function pararNuvem() {
        if (nuvemEfeito) {
            nuvemEfeito.destroy();
            nuvemEfeito = null;
        }
    }

    // ---------- Efeito 3: caleidoscópio (padrão) ----------
    const caleido = { x: 0, y: 0, px: 0, py: 0, ok: false };
    const SEGMENTOS = 8;

    function desenharCaleido() {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(5, 3, 15, 0.07)';
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';

        // o ponto desenhado segue o ponteiro suavemente (relativo ao centro)
        const alvoX = ponteiro.x - W / 2, alvoY = ponteiro.y - H / 2;
        if (!caleido.ok) { caleido.x = caleido.px = alvoX; caleido.y = caleido.py = alvoY; caleido.ok = true; }
        caleido.px = caleido.x; caleido.py = caleido.y;
        caleido.x += (alvoX - caleido.x) * 0.15;
        caleido.y += (alvoY - caleido.y) * 0.15;

        const vel = Math.hypot(caleido.x - caleido.px, caleido.y - caleido.py);
        ctx.lineWidth = 1 + Math.min(6, vel * 0.25);
        ctx.lineCap = 'round';
        const giro = t * 0.05 * velocidadeGlobal;

        for (let k = 0; k < SEGMENTOS; k++) {
            for (let espelho = 0; espelho < 2; espelho++) {
                ctx.save();
                ctx.translate(W / 2, H / 2);
                ctx.rotate(k * (Math.PI * 2 / SEGMENTOS) + giro);
                if (espelho) ctx.scale(1, -1);
                ctx.strokeStyle = `hsla(${(t * 40 * velCores + k * 25 + vel * 3) % 360}, 100%, 62%, 0.7)`;
                ctx.beginPath(); ctx.moveTo(caleido.px, caleido.py); ctx.lineTo(caleido.x, caleido.y); ctx.stroke();
                ctx.fillStyle = `hsla(${(t * 40 * velCores + k * 25 + 180) % 360}, 100%, 75%, 0.5)`;
                ctx.beginPath(); ctx.arc(caleido.x, caleido.y, 1.5 + vel * 0.1, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }
        for (const o of ondas) {
            // no caleidoscópio a onda vira um anel colorido
            ctx.strokeStyle = `hsla(${(o.r * 0.6 + t * 40) % 360}, 100%, 65%, ${o.vida * 0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.stroke();
        }
    }

    // ---------- Loop principal ----------
    function passo(agora) {
        t += 0.016 * velocidadeGlobal;
        pilotoAutomatico(agora);

        if (modo === 'nuvem') return; // o Vanta anima sozinho, num canvas WebGL próprio
        if (modo === 'neural') desenharNeural();
        else desenharCaleido();

        // ondas de choque: expandem e somem (comum aos efeitos 2D)
        for (let i = ondas.length - 1; i >= 0; i--) {
            ondas[i].r += 12; ondas[i].vida -= 0.02;
            if (ondas[i].vida <= 0) ondas.splice(i, 1);
        }
        // cursor personalizado: um anel que acompanha o ponteiro
        ctx.globalCompositeOperation = 'source-over';
        if (ponteiro.ativo) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(ponteiro.x, ponteiro.y, 10, 0, Math.PI * 2); ctx.stroke();
        }
    }

    function quadro(agora) {
        if (!rodando) return;
        passo(agora);
        rafId = requestAnimationFrame(quadro);
    }

    function trocarModo(novo) {
        modo = novo;
        caleido.ok = false;
        const ehNuvem = novo === 'nuvem';
        canvas.style.display = ehNuvem ? 'none' : 'block';
        if (nuvemEl) nuvemEl.style.display = ehNuvem ? 'block' : 'none';
        if (ehNuvem) {
            iniciarNuvem();
        } else {
            pararNuvem();
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = FUNDO;
            ctx.fillRect(0, 0, W, H);
            if (novo === 'neural') iniciarNeural();
        }
        overlay.querySelectorAll('[data-viagem-modo]').forEach(b => b.classList.toggle('ativo', b.dataset.viagemModo === novo));
    }

    function redimensionar() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = FUNDO; ctx.fillRect(0, 0, W, H);
        if (modo === 'neural') iniciarNeural();
    }

    // barra de controles some quando o mouse fica parado
    function mostrarBarra() {
        bar.classList.remove('oculta');
        clearTimeout(timerBarra);
        timerBarra = setTimeout(() => bar.classList.add('oculta'), 3500);
    }

    function alternarCores() { velCores = velCores === 1 ? 6 : (velCores === 6 ? 0 : 1); }

    function alternarTelaCheia() {
        if (!document.fullscreenElement) {
            if (overlay.requestFullscreen) overlay.requestFullscreen().catch(() => {});
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }

    // ---------- Abrir / fechar ----------
    window.abrirViagem = function () {
        if (rodando) return;
        pararFog();
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        rodando = true;
        t = 0;
        ondas.length = 0;
        redimensionar();
        moverPonteiro(W / 2, H / 2);
        ponteiro.ativo = false;
        trocarModo('caleido');
        dica.innerText = DICA_PADRAO;
        dica.classList.remove('oculta');
        setTimeout(() => dica.classList.add('oculta'), 6000);
        mostrarBarra();
        rafId = requestAnimationFrame(quadro);
    };

    window.fecharViagem = function () {
        if (!rodando) return;
        rodando = false;
        cancelAnimationFrame(rafId);
        clearTimeout(timerBarra);
        pararNuvem();
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
        iniciarFog();
    };

    // ---------- Entradas ----------
    canvas.addEventListener('pointermove', e => moverPonteiro(e.clientX, e.clientY));
    canvas.addEventListener('pointerdown', e => { moverPonteiro(e.clientX, e.clientY); novaOnda(e.clientX, e.clientY); });
    overlay.addEventListener('pointermove', mostrarBarra);
    window.addEventListener('resize', () => { if (rodando) redimensionar(); });
    window.addEventListener('keydown', e => {
        if (!rodando) return;
        if (e.key === '1') trocarModo('caleido');
        else if (e.key === '2') trocarModo('neural');
        else if (e.key === '3') trocarModo('nuvem');
        else if (e.key.toLowerCase() === 'f') alternarTelaCheia();
        else if (e.key.toLowerCase() === 'c') alternarCores();
        else if (e.key === 'Escape' && !document.fullscreenElement) window.fecharViagem();
    });
    overlay.querySelectorAll('[data-viagem-modo]').forEach(b => b.addEventListener('click', () => trocarModo(b.dataset.viagemModo)));
    document.getElementById('viagem-cores').addEventListener('click', alternarCores);
    document.getElementById('viagem-tela').addEventListener('click', alternarTelaCheia);
})();

// Função existente adaptada para renderizar com cores

window.addEventListener('load', function() {
    renderMenuTabs();

    // Aplica a máscara de moeda a todos os inputs monetários
    document.querySelectorAll('.input-moeda').forEach(input => {
        if (input.value) {
            let num = input.value.replace(/\D/g, '');
            if (num) input.value = Number(num).toLocaleString('pt-BR');
        }
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (!value) {
                e.target.value = '';
                return;
            }
            e.target.value = Number(value).toLocaleString('pt-BR');
        });
    });

    calculateJC();
    fetchMarketIndicators();
    updateFooterAndCounter();
});

// ==========================================
// POP-UP DE NOVIDADES (exibe só até a data definida abaixo)
// ==========================================

// Data limite: depois dela, o pop-up nunca mais aparece, nem para visitante novo.
// Formato 'AAAA-MM-DDT00:00:00' — ajuste aqui se quiser prorrogar/encerrar antes.
const NOVIDADES_EXPIRA_EM = new Date('2026-10-09T00:00:00');
const NOVIDADES_STORAGE_KEY = 'excalc_novidades_2026_10_vistas';

function fecharNovidades() {
    const overlay = document.getElementById('novidades-overlay');
    if (overlay) overlay.classList.add('hidden');
    try {
        localStorage.setItem(NOVIDADES_STORAGE_KEY, '1');
    } catch (e) {
        // localStorage pode estar bloqueado (modo privado); tudo bem, só não vai lembrar na próxima visita.
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('novidades-overlay');
    if (!overlay) return;

    const dentroDoPrazo = new Date() < NOVIDADES_EXPIRA_EM;

    let jaViu = false;
    try {
        jaViu = localStorage.getItem(NOVIDADES_STORAGE_KEY) === '1';
    } catch (e) {
        jaViu = false;
    }

    if (dentroDoPrazo && !jaViu) {
        overlay.classList.remove('hidden');
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
            fecharNovidades();
        }
    });
});

// ==========================================
// FUNÇÃO DE SEGURANÇA CONTRA XSS (ATUALIZADA)
// ==========================================
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Função auxiliar para ler e limpar valores monetários formatados
function getVal(id) {
    let el = document.getElementById(id);
    if (!el) return 0;
    let limpo = el.value.replace(/\D/g, '');
    return Number(limpo) || 0;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

    // Remove estilos ativos de todas as abas — mantém a classe de cor original
    document.querySelectorAll('.tab-btn').forEach(el => {
        const colorClass = Array.from(el.classList).find(c => c.startsWith('tab-') && c !== 'tab-btn');
        el.className = classeBaseAba(colorClass.replace('tab-', ''), !!el.closest('#drawer-nav'));
        el.classList.remove('glow-emerald', 'glow-cyan', 'glow-blue', 'glow-indigo', 'glow-purple',
            'glow-rose', 'glow-amber', 'glow-sky', 'glow-violet', 'glow-teal',
            'glow-fuchsia', 'glow-lime', 'glow-green', 'glow-orange', 'glow-red',
            'bg-emerald-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500',
            'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-violet-500', 'bg-teal-500',
            'bg-fuchsia-500', 'bg-lime-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500',
            'text-gray-950', 'font-bold');
    });

    // Mostra o conteúdo ativo
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    // Aplica estilo ativo à aba selecionada com a cor correta + glow + borda vibrante
    let abaInfo = abas.find(a => a.id === tabId);
    let activeBtn = document.getElementById(`btn-${tabId}`);
    if (activeBtn && abaInfo) {
        activeBtn.classList.add(`bg-${abaInfo.color}-500`, 'text-gray-950', 'font-bold', `glow-${abaInfo.color}`);
    }

    if (tabId === 'juros-compostos') calculateJC();
    if (tabId === 'reserva') calculateReserva();
    if (tabId === 'milhao') calculateMilhao();
    if (tabId === 'financiamento') calculateFinanciamento();
    if (tabId === 'veiculos') calculateVeiculo();
    if (tabId === 'amortizacao') calculateAmortizacao();
    if (tabId === 'alugar-comprar') calculateAlugarComprar();
    if (tabId === 'comparador') calculateComparador();
    if (tabId === 'fgts') calculateFGTS();
    if (tabId === 'rescisao-clt') calculateRescisaoCLT();
}

// 🌐 Buscar Indicadores em Tempo Real 
async function fetchMarketIndicators() {
    const dateSpan = document.getElementById('indicadores-data');
    const selicEl = document.getElementById('ind-selic');
    const cdiEl = document.getElementById('ind-cdi');
    const ipcaEl = document.getElementById('ind-ipca');
    const dolarEl = document.getElementById('ind-dolar');
    const poupancaEl = document.getElementById('ind-poupanca');

    // Indicadores que conseguiram atualizar; os demais ficam com o valor padrão e recebem aviso "estimado".
    const atualizados = new Set();

    // valores padrão
    selicEl.innerText = "14.00% a.a.";
    cdiEl.innerText = "13.90% a.a.";
    ipcaEl.innerText = "4.44% a.a.";
    poupancaEl.innerText = "8.34% a.a.";
    dolarEl.innerText = "R$ 5,50";

    try {
        let resDolar = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
        let dataDolar = await resDolar.json();
        if (dataDolar && dataDolar.USDBRL) {
            let dolarValue = parseFloat(dataDolar.USDBRL.bid);
            dolarEl.innerText = dolarValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            atualizados.add(dolarEl);
        }
    } catch (error) {
        console.warn("Aviso: Não foi possível atualizar o dólar em tempo real.");
    }

    try {
        let resSelic = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        let dataSelic = await resSelic.json();
        if (dataSelic && dataSelic[0] && dataSelic[0].valor) {
            selicEl.innerText = `${parseFloat(dataSelic[0].valor).toFixed(2)}% a.a.`;
            atualizados.add(selicEl);
        }
    } catch (error) {
        console.warn("Aviso: Não foi possível atualizar a Selic.");
    }

    try {
        let resCdi = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json');
        let dataCdi = await resCdi.json();
        if (dataCdi && dataCdi[0] && dataCdi[0].valor) {
            cdiEl.innerText = `${parseFloat(dataCdi[0].valor).toFixed(2)}% a.a.`;
            atualizados.add(cdiEl);
        }
    } catch (error) {
        console.warn("Aviso: Não foi possível atualizar o CDI.");
    }

    try {
        let resIpca = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json');
        let dataIpca = await resIpca.json();
        if (dataIpca && dataIpca[0] && dataIpca[0].valor) {
            ipcaEl.innerText = `${parseFloat(dataIpca[0].valor).toFixed(2)}% a.a.`;
            atualizados.add(ipcaEl);
        }
    } catch (error) {
        console.warn("Aviso: Não foi possível atualizar o IPCA.");
    }

    try {
        let resPoupanca = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.195/dados/ultimos/1?formato=json');
        let dataPoupanca = await resPoupanca.json();
        if (dataPoupanca && dataPoupanca[0] && dataPoupanca[0].valor) {
            let mensal = parseFloat(dataPoupanca[0].valor) / 100;
            let anual = (Math.pow(1 + mensal, 12) - 1) * 100;
            poupancaEl.innerText = `${anual.toFixed(2)}% a.a.`;
            atualizados.add(poupancaEl);
        }
    } catch (error) {
        console.warn("Aviso: Não foi possível atualizar a poupança.");
    }

    [selicEl, cdiEl, ipcaEl, dolarEl, poupancaEl].forEach(el => {
        if (!atualizados.has(el)) {
            el.innerText += ' ⚠️ estimado';
            el.title = 'Não foi possível buscar o valor em tempo real; exibindo estimativa.';
        }
    });

    let hoje = new Date();
    dateSpan.innerText = `Atualizado em: ${hoje.toLocaleDateString('pt-BR')} às ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// 1. Juros Compostos
let jcCronograma = [];
let jcViewMode = 'monthly';

function setJCView(mode) {
    jcViewMode = mode;
    renderJCTable();
}

// Linha do tempo: só números gerados pelo cálculo entram no innerHTML (nenhum texto do usuário).
function renderJCTable() {
    const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const corpo = document.getElementById('jc-tabela-corpo');
    if (!corpo) return;

    const ativo = 'px-3 py-1.5 rounded-md font-medium transition-all bg-emerald-500 text-gray-950 font-bold';
    const inativo = 'px-3 py-1.5 rounded-md font-medium transition-all text-gray-400 hover:text-white';
    document.getElementById('jc-view-monthly').className = jcViewMode === 'monthly' ? ativo : inativo;
    document.getElementById('jc-view-yearly').className = jcViewMode === 'yearly' ? ativo : inativo;
    document.getElementById('jc-th-periodo').innerText = jcViewMode === 'monthly' ? 'Mês' : 'Ano';

    let linhas = [];
    if (jcViewMode === 'monthly') {
        linhas = jcCronograma.map(r => ({ periodo: `Mês ${r.month}`, aporte: r.aporte, juros: r.juros, r }));
    } else {
        // Anual: soma aportes e juros do ano; saldos vêm do último mês do ano
        const porAno = new Map();
        jcCronograma.forEach(r => {
            const acc = porAno.get(r.year) || { periodo: `Ano ${r.year}`, aporte: 0, juros: 0, r };
            acc.aporte += r.aporte;
            acc.juros += r.juros;
            acc.r = r;
            porAno.set(r.year, acc);
        });
        linhas = Array.from(porAno.values());
    }

    corpo.innerHTML = linhas.map((l, i) => `
        <tr class="${i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900/40'} hover:bg-gray-700/50 transition-colors">
            <td class="p-3 font-semibold text-emerald-400">${l.periodo}</td>
            <td class="p-3">${brl(l.aporte)}</td>
            <td class="p-3 text-emerald-400">+${brl(l.juros)}</td>
            <td class="p-3">${brl(l.r.totalInvestido)}</td>
            <td class="p-3 text-emerald-400">${brl(l.r.totalJuros)}</td>
            <td class="p-3 text-right font-bold text-white">${brl(l.r.saldo)}</td>
        </tr>`).join('');
}

function calculateJC() {
    let p = getVal('jc-initial');
    let pmt = getVal('jc-monthly');
    let rate = parseFloat(document.getElementById('jc-rate').value) / 100 || 0;
    let rateType = document.getElementById('jc-rateType').value;
    let time = parseInt(document.getElementById('jc-time').value) || 0;
    let timeType = document.getElementById('jc-timeType').value;

    let totalMonths = timeType === 'years' ? time * 12 : time;
    let monthlyRate = rateType === 'yearly' ? Math.pow(1 + rate, 1 / 12) - 1 : rate;

    let currentTotal = p;
    let totalInvested = p;
    let labels = ['Início'];
    let dataTotal = [p];
    let dataInvested = [p];
    jcCronograma = [];

    for (let month = 1; month <= totalMonths; month++) {
        let interestEarned = currentTotal * monthlyRate;
        currentTotal += interestEarned + pmt;
        totalInvested += pmt;

        jcCronograma.push({
            month: month,
            year: Math.ceil(month / 12),
            aporte: pmt,
            juros: interestEarned,
            totalInvestido: totalInvested,
            totalJuros: currentTotal - totalInvested,
            saldo: currentTotal
        });

        if (month % 12 === 0 || month === totalMonths) {
            labels.push(`Ano ${Math.ceil(month/12)}`);
            dataTotal.push(currentTotal);
            dataInvested.push(totalInvested);
        }
    }

    let totalJuros = currentTotal - totalInvested;

    renderJCTable();

    document.getElementById('jc-res-investido').innerText = totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('jc-res-juros').innerText = totalJuros.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('jc-res-total').innerText = currentTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const ctx = document.getElementById('growthChart').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Total Acumulado (R$)', data: dataTotal, borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.1)', fill: true, tension: 0.2 },
                { label: 'Valor Investido (R$)', data: dataInvested, borderColor: '#60a5fa', fill: false, tension: 0.2 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e5e7eb' } } } }
    });
}

// 2. Reserva de Emergência
function calculateReserva() {
    let gastos = getVal('res-gastos');
    let meses = parseInt(document.getElementById('res-meses').value) || 6;
    document.getElementById('res-resultado').innerText = (gastos * meses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 3. Rumo ao Milhão
function calculateMilhao() {
    let p = getVal('milhao-inicial');
    let pmt = getVal('milhao-aporte');
    let annualRate = parseFloat(document.getElementById('milhao-taxa').value) / 100 || 0;
    let monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    let target = 1000000;
    let currentTotal = p;
    let months = 0;

    if (currentTotal >= target) {
        document.getElementById('milhao-resultado').innerText = "Já atingido!";
        document.getElementById('milhao-detalhes').innerText = "";
        return;
    }

    while (currentTotal < target && months < 1200) {
        currentTotal += (currentTotal * monthlyRate) + pmt;
        months++;
    }

    document.getElementById('milhao-resultado').innerText = `${Math.floor(months / 12)} anos e ${months % 12} meses`;
    document.getElementById('milhao-detalhes').innerText = `Aproximadamente ${months} meses de aportes.`;
}

// 4. Financiamento Imobiliário (SAC vs Price)
function calculateFinanciamento() {
    let valorImovel = getVal('fin-valor');
    let entrada = getVal('fin-entrada');
    let taxaAnual = parseFloat(document.getElementById('fin-taxa').value) / 100 || 0;
    let anos = parseInt(document.getElementById('fin-anos').value) || 0;

    let pv = valorImovel - entrada;
    let n = anos * 12;
    let i = taxaAnual / 12;

    let amortizacao = pv / (n || 1);
    let p1Sac = amortizacao + (pv * i);
    let pnSac = amortizacao + (amortizacao * i);
    let totalSac = 0;
    let saldoDevedor = pv;
    for (let m = 0; m < n; m++) {
        totalSac += amortizacao + (saldoDevedor * i);
        saldoDevedor -= amortizacao;
    }

    let pPrice = pv * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1 || 1);
    let totalprice = pPrice * n;

    document.getElementById('sac-p1').innerText = p1Sac.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('sac-pn').innerText = pnSac.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('sac-total').innerText = totalSac.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('price-p').innerText = pPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('price-total').innerText = totalprice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 5. Financiamento de Veículos
function calculateVeiculo() {
    let valor = getVal('vei-valor');
    let entrada = getVal('vei-entrada');
    let taxaMensal = parseFloat(document.getElementById('vei-taxa').value) / 100 || 0;
    let meses = parseInt(document.getElementById('vei-meses').value) || 0;

    let pv = valor - entrada;
    let i = taxaMensal;
    let n = meses;

    let parcela = 0;
    if (i === 0) {
        parcela = pv / (n || 1);
    } else {
        parcela = pv * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    }
    let totalPago = parcela * n;

    document.getElementById('vei-res-financiado').innerText = pv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('vei-res-parcela').innerText = parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('vei-res-total').innerText = totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 6. Amortização Extra
function calculateAmortizacao() {
    let saldoDevedor = getVal('amo-saldo');
    let taxa = parseFloat(document.getElementById('amo-taxa').value) / 100 || 0;
    let mesesRestantes = parseInt(document.getElementById('amo-meses').value) || 0;
    let extra = getVal('amo-extra');
    let tipo = document.getElementById('amo-tipo').value;

    let i = taxa;
    let n = mesesRestantes;

    let pmtAntigo = 0;
    if (i === 0) {
        pmtAntigo = saldoDevedor / (n || 1);
    } else {
        pmtAntigo = saldoDevedor * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    }

    let novoSaldo = saldoDevedor - extra;
    if (novoSaldo < 0) novoSaldo = 0;

    let pmtNovo = 0;
    let novoPrazo = n;
    let economiaJurosTexto = "";

    if (tipo === 'prestacao') {
        if (i === 0) {
            pmtNovo = novoSaldo / (n || 1);
        } else {
            pmtNovo = novoSaldo * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
        }
        novoPrazo = n;
        let totalAntigo = pmtAntigo * n;
        let totalNovo = pmtNovo * n + extra;
        let economia = totalAntigo - totalNovo;
        economiaJurosTexto = `Economia aprox. de juros: ${economia > 0 ? economia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}`;
    } else {
        pmtNovo = pmtAntigo;
        if (novoSaldo <= 0) {
            novoPrazo = 0;
        } else if (i === 0) {
            novoPrazo = Math.ceil(novoSaldo / pmtAntigo);
        } else {
            let numerador = -Math.log(1 - (novoSaldo * i) / (pmtAntigo || 1));
            let denominador = Math.log(1 + i);
            novoPrazo = Math.ceil(numerador / denominador);
        }
        let totalAntigo = pmtAntigo * n;
        let totalNovo = (pmtNovo * novoPrazo) + extra;
        let economia = totalAntigo - totalNovo;
        economiaJurosTexto = `Economia de juros: ${economia > 0 ? economia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}`;
    }

    document.getElementById('amo-antiga-parc').innerText = pmtAntigo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('amo-antigo-prazo').innerText = `${n} meses (${(n/12).toFixed(1)} anos)`;

    document.getElementById('amo-nova-parc').innerText = pmtNovo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('amo-novo-prazo').innerText = `${novoPrazo} meses (${(novoPrazo/12).toFixed(1)} anos)`;
    document.getElementById('amo-economia').innerText = economiaJurosTexto;
}

// 7. Alugar vs. Comprar Imóvel
function calculateAlugarComprar() {
    let valorImovel = getVal('ac-imovel');
    let entrada = getVal('ac-entrada');
    let taxaAnual = parseFloat(document.getElementById('ac-juros').value) / 100 || 0;
    let anos = parseInt(document.getElementById('ac-anos').value) || 30;
    let aluguelInicial = getVal('ac-aluguel');
    let rendimentoMes = parseFloat(document.getElementById('ac-rendimento').value) / 100 || 0;
    let valorizacaoAnual = parseFloat(document.getElementById('ac-valorizacao').value) / 100 || 0;

    let n = anos * 12;
    let i = taxaAnual / 12;
    let pv = valorImovel - entrada;

    let pmt = 0;
    if (i === 0) {
        pmt = pv / (n || 1);
    } else {
        pmt = pv * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    }

    let totalGastoImovel = entrada;
    let patrimonioImovel = valorImovel;

    let saldoInvestimento = entrada;
    let totalGastoAluguel = 0;
    let currentAluguel = aluguelInicial;

    for (let m = 1; m <= n; m++) {
        patrimonioImovel *= Math.pow(1 + valorizacaoAnual, 1 / 12);
        totalGastoImovel += pmt;

        if (m > 1 && m % 12 === 1) {
            currentAluguel *= (1 + valorizacaoAnual);
        }

        totalGastoAluguel += currentAluguel;
        saldoInvestimento *= (1 + rendimentoMes);

        let diferenca = pmt - currentAluguel;
        saldoInvestimento += diferenca;
    }

    let conclusaoEl = document.getElementById('ac-conclusao');
    if (patrimonioImovel > saldoInvestimento) {
        conclusaoEl.innerText = "🏡 Vale mais a pena COMPRAR o imóvel!";
        conclusaoEl.className = "text-lg md:text-xl font-extrabold text-emerald-400";
    } else {
        conclusaoEl.innerText = "📈 Vale mais a pena ALUGAR e INVESTIR!";
        conclusaoEl.className = "text-lg md:text-xl font-extrabold text-blue-400";
    }

    document.getElementById('ac-patrimonio-imovel').innerText = patrimonioImovel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('ac-gasto-imovel').innerText = totalGastoImovel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('ac-patrimonio-invest').innerText = saldoInvestimento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('ac-gasto-invest').innerText = totalGastoAluguel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------------- GERADOR DE DOCUMENTOS (ORÇAMENTO, CURRÍCULO, CONTRATO) ----------------

let activeDocType = 'orcamento';

// Alterna o tipo de documento visualizado (Orçamento, Currículo ou Contrato)
function switchDocType(type) {
    activeDocType = type;

    // Atualizar botões seletores
    document.querySelectorAll('.doc-type-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-500', 'text-gray-950', 'shadow');
        btn.classList.add('text-gray-400');
    });

    const activeBtn = document.getElementById(`doc-type-${type}`);
    activeBtn.classList.add('bg-emerald-500', 'text-gray-950', 'shadow');
    activeBtn.classList.remove('text-gray-400');

    // Alternar Formulários
    document.querySelectorAll('.doc-form').forEach(form => form.classList.add('hidden'));
    document.getElementById(`form-doc-${type}`).classList.remove('hidden');

    // Alternar Prévia
    document.querySelectorAll('.doc-preview').forEach(prev => prev.classList.add('hidden'));
    document.getElementById(`preview-doc-${type}`).classList.remove('hidden');

    updateDocumentPreview();
}

// Adiciona uma nova linha de item no Orçamento
function addOrcamentoItem() {
    const container = document.getElementById('orc-itens-container');
    const newItem = document.createElement('div');
    newItem.className = 'orc-item flex items-center gap-2 bg-gray-700/50 p-2 rounded border border-gray-700';
    newItem.innerHTML = `
        <input type="text" placeholder="Descrição do serviço/produto" class="orc-desc w-full bg-gray-700 rounded p-1.5 text-sm outline-none" oninput="updateDocumentPreview()">
        <input type="number" placeholder="Qtd" value="1" min="1" class="orc-qtd w-20 bg-gray-700 rounded p-1.5 text-sm outline-none text-center" oninput="updateDocumentPreview()">
        <input type="text" placeholder="Valor (R$)" value="0,00" class="orc-valor w-28 bg-gray-700 rounded p-1.5 text-sm outline-none text-right" oninput="updateDocumentPreview()">
        <button onclick="removeOrcamentoItem(this)" class="text-red-400 hover:text-red-300 p-1 font-bold text-sm">✕</button>
    `;
    container.appendChild(newItem);
    updateDocumentPreview();
}

// Remove linha do Orçamento
function removeOrcamentoItem(button) {
    const container = document.getElementById('orc-itens-container');
    if (container.children.length > 1) {
        button.closest('.orc-item').remove();
        updateDocumentPreview();
    }
}

// Atualiza a prévia conforme os dados do documento ativo
function updateDocumentPreview() {
    if (activeDocType === 'orcamento') {
        // Correção de segurança: escapeHtml em todos os valores que vão para a tela!
        document.getElementById('preview-orc-emissor').innerHTML = escapeHtml(document.getElementById('orc-emissor').value) || 'Sua Empresa';
        document.getElementById('preview-orc-cliente').innerHTML = escapeHtml(document.getElementById('orc-cliente').value) || 'Cliente Não Informado';
        document.getElementById('preview-orc-data').innerText = `Data: ${new Date().toLocaleDateString('pt-BR')}`;

        const items = document.querySelectorAll('.orc-item');
        const tbody = document.getElementById('preview-orc-itens-body');
        tbody.innerHTML = '';
        let totalGeral = 0;

        items.forEach(item => {
            const desc = item.querySelector('.orc-desc').value || 'Item sem descrição';
            const qtd = parseInt(item.querySelector('.orc-qtd').value) || 0;
            let valorStr = item.querySelector('.orc-valor').value;
            let valorUnitario = parseFloat(valorStr.replace(/\./g, '').replace(',', '.')) || 0;
            let subtotal = qtd * valorUnitario;
            totalGeral += subtotal;

            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-100';
            // Correção de segurança: escapeHtml(desc)
            tr.innerHTML = `
                <td class="py-2 text-gray-800">${escapeHtml(desc)}</td>
                <td class="py-2 text-center text-gray-600">${qtd}</td>
                <td class="py-2 text-right text-gray-600">${valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td class="py-2 text-right font-medium text-gray-800">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('preview-orc-total').innerText = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    } else if (activeDocType === 'curriculo') {
        document.getElementById('preview-cur-nome').innerText = document.getElementById('cur-nome').value || 'Nome Completo';
        document.getElementById('preview-cur-cargo').innerText = document.getElementById('cur-cargo').value || 'Cargo';
        document.getElementById('preview-cur-contato').innerText = document.getElementById('cur-contato').value || '';
        document.getElementById('preview-cur-resumo').innerText = document.getElementById('cur-resumo').value || '';
        document.getElementById('preview-cur-experiencia').innerText = document.getElementById('cur-experiencia').value || '';
        document.getElementById('preview-cur-educacao').innerText = document.getElementById('cur-educacao').value || '';

    } else if (activeDocType === 'contrato') {
        document.getElementById('preview-con-contratante').innerText = document.getElementById('con-contratante').value || 'CONTRATANTE';
        document.getElementById('preview-con-contratado').innerText = document.getElementById('con-contratado').value || 'CONTRATADO';
        document.getElementById('preview-con-objeto').innerText = document.getElementById('con-objeto').value || '';
        document.getElementById('preview-con-valor').innerText = document.getElementById('con-valor').value || '0,00';
        document.getElementById('preview-con-prazo').innerText = document.getElementById('con-prazo').value || '';
        document.getElementById('preview-con-foro').innerText = document.getElementById('con-foro').value || '';
    }
}

// Impressão limpa apenas do documento visualizado
function printDocument() {
    updateDocumentPreview();

    const printContent = document.getElementById('doc-printable-area').outerHTML;
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
        <html>
            <head>
                <title>Documento - ${activeDocType.toUpperCase()}</title>
                <script src="https://cdn.tailwindcss.com"><\/script>
                <style>
                    body { padding: 30px; background-color: #ffffff; color: #111827; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
                <script>
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 500);
                <\/script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Inicializa os dados da prévia na carga da página
document.addEventListener('DOMContentLoaded', () => {
    updateDocumentPreview();
});

// 9. À Vista vs Parcelado
function calculateComparador() {
    let valor = getVal('comp-valor');
    let descontoPct = parseFloat(document.getElementById('comp-desconto').value) / 100 || 0;
    let parcelas = parseInt(document.getElementById('comp-parcelas').value) || 1;
    let rendimentoMes = parseFloat(document.getElementById('comp-rendimento').value) / 100 || 0;

    let precoAVista = valor * (1 - descontoPct);
    let valorParcela = valor / (parcelas || 1);

    let montanteInvestido = precoAVista;
    for (let p = 0; p < parcelas; p++) {
        montanteInvestido = (montanteInvestido * (1 + rendimentoMes)) - valorParcela;
    }

    let resultadoEl = document.getElementById('comp-resultado');
    let detalhesEl = document.getElementById('comp-detalhes');

    if (montanteInvestido > 0) {
        resultadoEl.innerText = "Vale a pena PARCELAR!";
        resultadoEl.className = "text-2xl font-extrabold text-blue-400";
        detalhesEl.innerText = `Sobram cerca de ${montanteInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} investindo o valor à vista.`;
    } else {
        resultadoEl.innerText = "Vale a pena pagar À VISTA!";
        resultadoEl.className = "text-2xl font-extrabold text-emerald-400";
        detalhesEl.innerText = `O desconto à vista compensa mais do que o rendimento do parcelamento.`;
    }
}

// 10. Cálculo Rescisão e FGTS
function calculateFGTS() {
    let salario = getVal('fgts-salario');
    let saldoFgts = getVal('fgts-saldo');

    let multaFgts = saldoFgts * 0.40;
    let avisoPrevio = salario;
    let totalRescisao = saldoFgts + multaFgts + avisoPrevio;

    document.getElementById('fgts-res-saldo').innerText = saldoFgts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('fgts-res-multa').innerText = multaFgts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('fgts-res-aviso').innerText = avisoPrevio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('fgts-res-total').innerText = totalRescisao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 11. Calculadora de Rescisão CLT
function calculateRescisaoCLT() {
    let salario = getVal('clt-salario');
    let motivo = document.getElementById('clt-motivo').value;
    let diasMes = parseInt(document.getElementById('clt-dias-mes').value) || 0;
    let meses13 = parseInt(document.getElementById('clt-meses-13').value) || 0;
    let temFeriasVencidas = parseInt(document.getElementById('clt-ferias-vencidas').value) === 1;
    let mesesFerias = parseInt(document.getElementById('clt-meses-ferias').value) || 0;
    let tipoAviso = document.getElementById('clt-aviso').value;

    let saldoSalario = (salario / 30) * diasMes;
    let decimoTerceiro = (salario / 12) * meses13;

    let feriasVencidas = 0;
    if (temFeriasVencidas) {
        feriasVencidas = salario + (salario / 3);
    }

    let feriasProporcionais = ((salario / 12) * mesesFerias);
    feriasProporcionais += (feriasProporcionais / 3);

    let valorAviso = 0;

    if (motivo === 'pedido') {
        if (tipoAviso === 'descontado') {
            valorAviso = -salario;
        }
    } else if (motivo === 'sem-justa-causa') {
        if (tipoAviso === 'indenizado') {
            valorAviso = salario;
        }
    }

    let totalBruto = saldoSalario + decimoTerceiro + feriasVencidas + feriasProporcionais + valorAviso;
    if (totalBruto < 0) totalBruto = 0;

    const formatBRL = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('clt-res-saldo').innerText = formatBRL(saldoSalario);
    document.getElementById('clt-res-13').innerText = formatBRL(decimoTerceiro);
    document.getElementById('clt-res-ferias-vencidas').innerText = formatBRL(feriasVencidas);
    document.getElementById('clt-res-ferias-prop').innerText = formatBRL(feriasProporcionais);

    let avisoEl = document.getElementById('clt-res-aviso');
    avisoEl.innerText = formatBRL(valorAviso);

    avisoEl.classList.remove('text-red-400', 'text-white');
    if (valorAviso < 0) {
        avisoEl.classList.add('text-red-400');
    } else {
        avisoEl.classList.add('text-white');
    }

    document.getElementById('clt-res-total').innerText = formatBRL(totalBruto);
}

// ==========================================
// CENTRAL DE CONVERSÃO DE DOCUMENTOS
// ==========================================
const CONVERSION_MATRIX = {
    'docx': [
        { value: 'pdf', label: 'PDF (.pdf)' },
        { value: 'txt', label: 'Texto Simples (.txt)' },
        { value: 'json', label: 'Estrutura JSON (.json)' }
    ],
    'pdf': [
        { value: 'docx', label: 'Documento Word (.docx)' },
        { value: 'txt', label: 'Texto Extraído (.txt)' },
        { value: 'json', label: 'Estrutura JSON (.json)' }
    ],
    'xlsx': [
        { value: 'csv', label: 'Planilha CSV (.csv)' },
        { value: 'json', label: 'Dados JSON (.json)' },
        { value: 'txt', label: 'Texto (.txt)' },
        { value: 'pdf', label: 'PDF (.pdf)' }
    ],
    'xls': [
        { value: 'csv', label: 'Planilha CSV (.csv)' },
        { value: 'json', label: 'Dados JSON (.json)' },
        { value: 'txt', label: 'Texto (.txt)' },
        { value: 'pdf', label: 'PDF (.pdf)' }
    ],
    'csv': [
        { value: 'xlsx', label: 'Planilha Excel (.xlsx)' },
        { value: 'json', label: 'Dados JSON (.json)' },
        { value: 'txt', label: 'Texto (.txt)' },
        { value: 'pdf', label: 'PDF (.pdf)' },
        { value: 'docx', label: 'Documento Word (.docx)' }
    ],
    'json': [
        { value: 'csv', label: 'Planilha CSV (.csv)' },
        { value: 'xlsx', label: 'Planilha Excel (.xlsx)' },
        { value: 'txt', label: 'Texto (.txt)' },
        { value: 'pdf', label: 'PDF (.pdf)' },
        { value: 'docx', label: 'Documento Word (.docx)' }
    ],
    'txt': [
        { value: 'docx', label: 'Documento Word (.docx)' },
        { value: 'pdf', label: 'PDF (.pdf)' },
        { value: 'json', label: 'Estrutura JSON (.json)' }
    ]
};

function updateTargetFormats() {
    const fileInput = document.getElementById('file-input-universal');
    const selectFormat = document.getElementById('conversion-target-format');
    const statusEl = document.getElementById('status-universal');

    if (statusEl) statusEl.innerText = "";
    selectFormat.innerHTML = '<option value="" disabled selected>Escolha o formato final...</option>';

    if (!fileInput || !fileInput.files.length) return;

    const file = fileInput.files[0];
    const ext = getFileExtension(file.name);

    if (['ppt', 'pptx'].includes(ext)) {
        if (statusEl) statusEl.innerText = "ℹ️ Arquivos PPT/PPTX exigem processamento em servidor.";
        return;
    }

    const options = CONVERSION_MATRIX[ext];

    if (!options) {
        if (statusEl) statusEl.innerText = "Formato de arquivo não suportado.";
        return;
    }

    options.forEach(opt => {
        const optionEl = document.createElement('option');
        optionEl.value = opt.value;
        optionEl.innerText = opt.label;
        selectFormat.appendChild(optionEl);
    });
}

async function convertFile() {
    const fileInput = document.getElementById('file-input-universal');
    const targetFormatSelect = document.getElementById('conversion-target-format');
    const statusEl = document.getElementById('status-universal');

    if (!fileInput || !fileInput.files.length) {
        alert('Por favor, selecione um arquivo.');
        return;
    }

    const targetFormat = targetFormatSelect.value;
    if (!targetFormat) {
        alert('Por favor, selecione o formato de saída desejado.');
        return;
    }

    const file = fileInput.files[0];
    const ext = getFileExtension(file.name);

    updateStatus(statusEl, "⏳ Processando arquivo...", true);

    try {
        const libsNecessarias = [];
        if (ext === 'docx') libsNecessarias.push('mammoth');
        if (['xlsx', 'xls', 'csv'].includes(ext)) libsNecessarias.push('xlsx');
        if (ext === 'json' && ['csv', 'xlsx'].includes(targetFormat)) libsNecessarias.push('xlsx');
        if (ext === 'pdf') libsNecessarias.push('pdfjs');
        if (targetFormat === 'pdf') libsNecessarias.push('html2pdf');
        if (targetFormat === 'docx') libsNecessarias.push('docx');
        await carregarLibs(...libsNecessarias);

        if (ext === 'docx') {
            if (targetFormat === 'pdf') await convertDocxToPdf(file, statusEl);
            else if (targetFormat === 'txt') await convertDocxToTxt(file, statusEl);
            else if (targetFormat === 'json') await convertDocxToJson(file, statusEl);
        } else if (['xlsx', 'xls'].includes(ext)) {
            if (targetFormat === 'csv') await convertExcelToCsv(file, statusEl);
            else if (targetFormat === 'json') await convertExcelToJson(file, statusEl);
            else if (targetFormat === 'txt') await convertExcelToTxt(file, statusEl);
            else if (targetFormat === 'pdf') await convertExcelToPdf(file, statusEl);
        } else if (ext === 'pdf') {
            if (targetFormat === 'docx') await convertPdfToDocx(file, statusEl);
            else if (targetFormat === 'txt') await convertPdfToText(file, statusEl);
            else if (targetFormat === 'json') await convertPdfToJson(file, statusEl);
        } else if (ext === 'csv') {
            if (targetFormat === 'json') await convertCsvToJson(file, statusEl);
            else if (targetFormat === 'txt') await convertCsvToTxt(file, statusEl);
            else if (targetFormat === 'xlsx') await convertCsvToXlsx(file, statusEl);
            else if (targetFormat === 'pdf') await convertCsvToPdf(file, statusEl);
            else if (targetFormat === 'docx') await convertCsvToDocx(file, statusEl);
        } else if (ext === 'json') {
            if (targetFormat === 'csv') await convertJsonToCsv(file, statusEl);
            else if (targetFormat === 'xlsx') await convertJsonToXlsx(file, statusEl);
            else if (targetFormat === 'txt') await convertJsonToTxt(file, statusEl);
            else if (targetFormat === 'pdf') await convertJsonToPdf(file, statusEl);
            else if (targetFormat === 'docx') await convertJsonToDocx(file, statusEl);
        } else if (ext === 'txt') {
            if (targetFormat === 'docx') await convertTxtToDocx(file, statusEl);
            else if (targetFormat === 'pdf') await convertTxtToPdf(file, statusEl);
            else if (targetFormat === 'json') await convertTxtToJson(file, statusEl);
        } else {
            throw new Error('Formato sem suporte direto no navegador.');
        }
    } catch (error) {
        console.error(error);
        updateStatus(statusEl, "❌ " + (error.message || "Erro ao processar o arquivo."), false, true);
    }
}

// ==========================================
// FUNÇÕES INDIVIDUAIS DE CONVERSÃO
// ==========================================

async function convertDocxToPdf(file, statusEl) {
    const buffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    await exportHtmlToPdf(result.value, file.name, statusEl);
}

async function convertDocxToTxt(file, statusEl) {
    const buffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    downloadBlob(result.value, getBaseFileName(file.name) + ".txt", 'text/plain;charset=utf-8');
    updateStatus(statusEl, "✅ Conversão para TXT concluída!");
}

async function convertDocxToJson(file, statusEl) {
    const buffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const lines = result.value.split('\n').filter(l => l.trim().length > 0);
    const jsonData = { fileName: file.name, content: lines };
    downloadBlob(JSON.stringify(jsonData, null, 2), getBaseFileName(file.name) + ".json", 'application/json;charset=utf-8');
    updateStatus(statusEl, "✅ Conversão para JSON concluída!");
}

async function convertExcelToCsv(file, statusEl) {
    const workbook = await readExcelWorkbook(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    downloadBlob(csvOutput, getBaseFileName(file.name) + ".csv", 'text/csv;charset=utf-8;');
    updateStatus(statusEl, "✅ Conversão para CSV concluída!");
}

async function convertExcelToJson(file, statusEl) {
    const workbook = await readExcelWorkbook(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonOutput = XLSX.utils.sheet_to_json(worksheet);
    downloadBlob(JSON.stringify(jsonOutput, null, 2), getBaseFileName(file.name) + ".json", 'application/json;charset=utf-8;');
    updateStatus(statusEl, "✅ Conversão para JSON concluída!");
}

async function convertExcelToTxt(file, statusEl) {
    const workbook = await readExcelWorkbook(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet, { FS: "\t" });
    downloadBlob(csvOutput, getBaseFileName(file.name) + ".txt", 'text/plain;charset=utf-8;');
    updateStatus(statusEl, "✅ Conversão para TXT concluída!");
}

async function convertExcelToPdf(file, statusEl) {
    const workbook = await readExcelWorkbook(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    // CORREÇÃO DE SEGURANÇA: tabela montada com escape, não sheet_to_html cru
    const htmlTable = sheetToSafeHtmlTable(worksheet);
    await exportHtmlToPdf(htmlTable, file.name, statusEl);
}

async function convertPdfToText(file, statusEl) {
    const pages = await extractPdfPagesText(file);
    const fullText = pages.map(p => `--- Página ${p.pageNumber} ---\n${p.content}`).join('\n\n');
    downloadBlob(fullText, getBaseFileName(file.name) + "_extraido.txt", 'text/plain;charset=utf-8');
    updateStatus(statusEl, "✅ Texto extraído do PDF com sucesso!");
}

async function convertPdfToJson(file, statusEl) {
    const pages = await extractPdfPagesText(file);
    const pdfData = { fileName: file.name, totalPages: pages.length, pages };
    downloadBlob(JSON.stringify(pdfData, null, 2), getBaseFileName(file.name) + ".json", 'application/json;charset=utf-8;');
    updateStatus(statusEl, "✅ PDF convertido para JSON com sucesso!");
}

async function convertPdfToDocx(file, statusEl) {
    const pages = await extractPdfPagesText(file);
    updateStatus(statusEl, "⏳ Reconstruindo parágrafos em DOCX...", true);

    const docParagraphs = [];
    pages.forEach(p => {
        if (pages.length > 1) {
            docParagraphs.push(new docx.Paragraph({
                children: [new docx.TextRun({ text: `--- Página ${p.pageNumber} ---`, bold: true, color: "888888", size: 18 })],
                spacing: { before: 200, after: 100 }
            }));
        }
        p.content.split('\n').forEach(lineText => {
            if (lineText.trim()) {
                docParagraphs.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: lineText, font: "Arial", size: 22 })],
                    spacing: { after: 120 }
                }));
            }
        });
    });

    await exportParagraphsToDocx(docParagraphs, file.name);
    updateStatus(statusEl, "✅ Conversão para Word (.docx) concluída!");
}

async function convertCsvToJson(file, statusEl) {
    const workbook = await readExcelWorkbook(file);
    const jsonOutput = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    downloadBlob(JSON.stringify(jsonOutput, null, 2), getBaseFileName(file.name) + ".json", 'application/json;charset=utf-8;');
    updateStatus(statusEl, "✅ CSV convertido para JSON com sucesso!");
}

async function convertCsvToTxt(file, statusEl) {
    const textContent = await readFileAsText(file);
    downloadBlob(textContent, getBaseFileName(file.name) + ".txt", 'text/plain;charset=utf-8');
    updateStatus(statusEl, "✅ CSV convertido para TXT com sucesso!");
}

async function convertCsvToXlsx(file, statusEl) {
    const workbook = await readExcelWorkbook(file);
    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    downloadBlob(xlsxBuffer, getBaseFileName(file.name) + ".xlsx", 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    updateStatus(statusEl, "✅ CSV convertido para XLSX com sucesso!");
}

async function convertCsvToPdf(file, statusEl) {
    const workbook = await readExcelWorkbook(file);
    // CORREÇÃO DE SEGURANÇA: tabela montada com escape, não sheet_to_html cru
    const htmlTable = sheetToSafeHtmlTable(workbook.Sheets[workbook.SheetNames[0]]);
    await exportHtmlToPdf(htmlTable, file.name, statusEl);
}

async function convertCsvToDocx(file, statusEl) {
    const text = await readFileAsText(file);
    await exportTextToDocx(text, file.name);
    updateStatus(statusEl, "✅ CSV convertido para DOCX com sucesso!");
}

async function convertJsonToCsv(file, statusEl) {
    const jsonData = await parseJsonFile(file);
    const worksheet = XLSX.utils.json_to_sheet(Array.isArray(jsonData) ? jsonData : [jsonData]);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    downloadBlob(csvOutput, getBaseFileName(file.name) + ".csv", 'text/csv;charset=utf-8;');
    updateStatus(statusEl, "✅ JSON convertido para CSV com sucesso!");
}

async function convertJsonToXlsx(file, statusEl) {
    const jsonData = await parseJsonFile(file);
    const worksheet = XLSX.utils.json_to_sheet(Array.isArray(jsonData) ? jsonData : [jsonData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    downloadBlob(xlsxBuffer, getBaseFileName(file.name) + ".xlsx", 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    updateStatus(statusEl, "✅ JSON convertido para XLSX com sucesso!");
}

async function convertJsonToTxt(file, statusEl) {
    const jsonData = await parseJsonFile(file);
    const txtOutput = JSON.stringify(jsonData, null, 2);
    downloadBlob(txtOutput, getBaseFileName(file.name) + ".txt", 'text/plain;charset=utf-8');
    updateStatus(statusEl, "✅ JSON convertido para TXT com sucesso!");
}

// CORREÇÃO DE SEGURANÇA: Aqui o escapeHtml protege a conversão de JSON malicioso para PDF
async function convertJsonToPdf(file, statusEl) {
    const jsonData = await parseJsonFile(file);
    const htmlContent = `<pre style="font-family: monospace; padding: 20px;">${escapeHtml(JSON.stringify(jsonData, null, 2))}</pre>`;
    await exportHtmlToPdf(htmlContent, file.name, statusEl);
}

async function convertJsonToDocx(file, statusEl) {
    const jsonData = await parseJsonFile(file);
    const txtOutput = JSON.stringify(jsonData, null, 2);
    await exportTextToDocx(txtOutput, file.name);
    updateStatus(statusEl, "✅ JSON convertido para DOCX com sucesso!");
}

async function convertTxtToDocx(file, statusEl) {
    const text = await readFileAsText(file);
    await exportTextToDocx(text, file.name);
    updateStatus(statusEl, "✅ TXT convertido para DOCX com sucesso!");
}

async function convertTxtToPdf(file, statusEl) {
    const text = await readFileAsText(file);
    // Correção: Uso de escapeHtml ao renderizar texto
    const htmlContent = `<div style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${escapeHtml(text)}</div>`;
    await exportHtmlToPdf(htmlContent, file.name, statusEl);
}

async function convertTxtToJson(file, statusEl) {
    const text = await readFileAsText(file);
    const lines = text.split('\n').map(line => line.replace('\r', ''));
    const jsonData = { fileName: file.name, lines };
    downloadBlob(JSON.stringify(jsonData, null, 2), getBaseFileName(file.name) + ".json", 'application/json;charset=utf-8');
    updateStatus(statusEl, "✅ TXT convertido para JSON com sucesso!");
}

// ==========================================
// FUNÇÕES AUXILIARES E UTILITÁRIOS
// ==========================================

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function getBaseFileName(filename) {
    return filename.replace(/\.[^/.]+$/, "");
}

function updateStatus(element, message, isAnimating = false, isError = false) {
    if (!element) return;
    element.innerText = message;
    let classes = "text-xs text-center mt-3 min-h-[1rem] ";
    if (isError) classes += "text-red-400";
    else classes += "text-emerald-400";
    if (isAnimating) classes += " animate-pulse";
    element.className = classes;
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file, 'UTF-8');
    });
}

async function parseJsonFile(file) {
    const text = await readFileAsText(file);
    return JSON.parse(text);
}

async function readExcelWorkbook(file) {
    const buffer = await readFileAsArrayBuffer(file);
    return XLSX.read(new Uint8Array(buffer), { type: 'array' });
}

// CORREÇÃO DE SEGURANÇA: monta a tabela HTML célula a célula com escapeHtml,
// em vez de usar XLSX.utils.sheet_to_html diretamente (que não garante escape
// do conteúdo das células e permitiria XSS via planilha/CSV maliciosos
// injetados no innerHTML dentro de exportHtmlToPdf).
function sheetToSafeHtmlTable(worksheet) {
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
    if (!rows.length) {
        return '<table><tbody><tr><td>(planilha vazia)</td></tr></tbody></table>';
    }
    const bodyRows = rows.map(row => {
        const cells = row.map(cell => `<td style="border:1px solid #ccc;padding:4px;">${escapeHtml(cell)}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');
    return `<table style="border-collapse:collapse;width:100%;font-size:12px;"><tbody>${bodyRows}</tbody></table>`;
}

async function extractPdfPagesText(file) {
    const buffer = await readFileAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument(new Uint8Array(buffer)).promise;

    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        let lastY = null;
        let pageLines = [];
        let currentLine = "";

        textContent.items.forEach(item => {
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                pageLines.push(currentLine);
                currentLine = "";
            }
            currentLine += item.str + " ";
            lastY = item.transform[5];
        });
        if (currentLine) pageLines.push(currentLine);

        pages.push({ pageNumber: i, content: pageLines.join('\n') });
    }
    return pages;
}

async function exportHtmlToPdf(htmlMarkup, originalFileName, statusEl) {
    const container = document.createElement('div');
    container.innerHTML = `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.5; color: #111;">${htmlMarkup}</div>`;

    const opt = {
        margin: 0.5,
        filename: getBaseFileName(originalFileName) + ".pdf",
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    updateStatus(statusEl, "⏳ Gerando arquivo PDF...", true);
    await html2pdf().from(container).set(opt).save();
    updateStatus(statusEl, "✅ Conversão para PDF concluída!");
}

async function exportParagraphsToDocx(paragraphs, originalFileName) {
    const doc = new docx.Document({ sections: [{ children: paragraphs }] });
    const blob = await docx.Packer.toBlob(doc);
    downloadBlob(blob, getBaseFileName(originalFileName) + ".docx", 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

async function exportTextToDocx(text, originalFileName) {
    const lines = text.split('\n');
    const paragraphs = lines.map(line => new docx.Paragraph({
        children: [new docx.TextRun({ text: line, font: "Arial", size: 22 })],
        spacing: { after: 120 }
    }));
    await exportParagraphsToDocx(paragraphs, originalFileName);
}

function downloadBlob(content, filename, contentType) {
    let blob = content instanceof Blob ? content : new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

// ==========================================
// DRAG & DROP E EVENTOS DE INTERFACE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById('drop-zone');

    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('border-emerald-400', 'bg-gray-700', 'scale-[1.01]');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('border-emerald-400', 'bg-gray-700', 'scale-[1.01]');
            }, false);
        });

        dropZone.addEventListener('drop', handleDrop, false);
    }
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const files = e.dataTransfer.files;
    const fileInput = document.getElementById('file-input-universal');

    if (files.length) {
        fileInput.files = files;
        handleFileSelect();
    }
}

function handleFileSelect() {
    const fileInput = document.getElementById('file-input-universal');
    const dropZoneText = document.getElementById('drop-zone-text');

    if (fileInput.files.length) {
        const file = fileInput.files[0];
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        // CORREÇÃO: Usando escapeHtml para nome do arquivo proveniente de uplaod do usuário
        dropZoneText.innerHTML = `📄 Arquivo selecionado: <strong class="text-emerald-400">${escapeHtml(file.name)}</strong> (${fileSizeMB} MB)`;
    } else {
        dropZoneText.innerHTML = `<span class="font-semibold text-emerald-400">Clique para selecionar</span> ou arraste e solte o arquivo aqui`;
    }

    if (typeof updateTargetFormats === "function") {
        updateTargetFormats();
    }
}

// Suporte a Drag and Drop para o Compressor
const dropZoneCompress = document.getElementById('drop-zone-compress');

if (dropZoneCompress) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZoneCompress.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZoneCompress.addEventListener(eventName, () => {
            dropZoneCompress.classList.add('border-emerald-500', 'bg-gray-700');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZoneCompress.addEventListener(eventName, () => {
            dropZoneCompress.classList.remove('border-emerald-500', 'bg-gray-700');
        }, false);
    });

    dropZoneCompress.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        const input = document.getElementById('file-input-compress');

        if (files.length > 0 && files[0].type === "application/pdf") {
            input.files = files;
            handleCompressFileSelect();
        } else {
            alert('Por favor, envie apenas arquivos no formato PDF.');
        }
    });
}

function handleCompressFileSelect() {
    const fileInput = document.getElementById('file-input-compress');
    const dropZoneText = document.getElementById('drop-zone-compress-text');

    if (fileInput.files.length) {
        const file = fileInput.files[0];
        // CORREÇÃO: Usando escapeHtml aqui também
        dropZoneText.innerHTML = `📄 Selecionado: <strong class="text-emerald-400">${escapeHtml(file.name)}</strong>`;
    }
}

// Função principal para comprimir o PDF
async function compressPDF() {
    const input = document.getElementById('file-input-compress');
    const quality = parseFloat(document.getElementById('compression-level').value);
    const statusEl = document.getElementById('status-compress');

    if (!input.files.length) {
        alert('Por favor, selecione um arquivo PDF primeiro.');
        return;
    }

    const file = input.files[0];
    const initialSize = file.size;

    statusEl.innerText = "⏳ Comprimindo PDF... Isso pode levar alguns segundos.";
    statusEl.className = "text-xs text-center text-emerald-400 mt-3 min-h-[1rem] animate-pulse";

    try {
        await carregarLibs('pdfjs', 'pdflib');
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const newPdfDoc = await PDFLib.PDFDocument.create();

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            statusEl.innerText = `⏳ Processando página ${i} de ${pdfDoc.numPages}...`;

            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const imgDataUrl = canvas.toDataURL('image/jpeg', quality);

            const jpegImage = await newPdfDoc.embedJpg(imgDataUrl);
            const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
            newPage.drawImage(jpegImage, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height,
            });
        }

        const compressedBytes = await newPdfDoc.save();
        let finalBlob = new Blob([compressedBytes], { type: 'application/pdf' });

        // Reconverter as páginas em imagem pode aumentar PDFs que já eram leves (só texto/vetor).
        // Nesse caso, entrega o original em vez de um arquivo maior.
        const jaOtimizado = finalBlob.size >= initialSize;
        if (jaOtimizado) finalBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const finalSize = finalBlob.size;

        const savedPercent = (((initialSize - finalSize) / initialSize) * 100).toFixed(1);
        const originalMB = (initialSize / (1024 * 1024)).toFixed(2);
        const finalMB = (finalSize / (1024 * 1024)).toFixed(2);

        const downloadUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = file.name.replace(/\.pdf$/i, '_comprimido.pdf');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        statusEl.className = "text-xs text-center text-emerald-400 mt-3 min-h-[1rem]";
        statusEl.innerText = jaOtimizado
            ? `ℹ️ Este PDF já é leve (${originalMB}MB): comprimir aumentaria o arquivo, então o original foi mantido.`
            : `✅ Concluído! De ${originalMB}MB para ${finalMB}MB (${savedPercent}% de redução).`;

    } catch (error) {
        console.error(error);
        statusEl.className = "text-xs text-center text-red-400 mt-3 min-h-[1rem]";
        statusEl.innerText = "❌ Ocorreu um erro ao comprimir o PDF.";
    }
}

function updateFooterAndCounter() {
    const yearEl = document.getElementById('footer-year');
    if (yearEl) {
        yearEl.innerText = new Date().getFullYear();
    }
}

// ==================== 1. GERADOR DE QR CODE ====================

async function generateQRCode() {
    const input = document.getElementById('qr-input').value;
    const size = parseInt(document.getElementById('qr-size').value, 10);
    const container = document.getElementById('qr-code-container');
    const placeholder = document.getElementById('qr-placeholder');
    const downloadBtn = document.getElementById('qr-download');

    if (!input.trim()) {
        alert('Por favor, insira um texto ou URL.');
        return;
    }

    try {
        await carregarLib('qrcode');
    } catch (error) {
        alert(error.message);
        return;
    }

    container.innerHTML = '';
    container.classList.remove('hidden');
    placeholder.classList.add('hidden');

    new QRCode(container, {
        text: input,
        width: size,
        height: size
    });

    setTimeout(() => {
        const img = container.querySelector('img');
        const canvas = container.querySelector('canvas');

        let src = '';
        if (img && img.src) {
            src = img.src;
        } else if (canvas) {
            src = canvas.toDataURL('image/png');
        }

        if (src) {
            downloadBtn.href = src;
            downloadBtn.download = 'qrcode.png';
            downloadBtn.classList.remove('hidden');
        }
    }, 300);
}

// ==========================================
// UTILITÁRIOS E IMAGENS
// ==========================================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadFile(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Erro ao carregar a imagem.'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
        reader.readAsDataURL(file);
    });
}

async function compressImage() {
    const fileInput = document.getElementById('img-compress-file');
    const rangeInput = document.getElementById('img-compress-range');
    const statusEl = document.getElementById('compress-status');

    const file = fileInput.files[0];

    if (!file) {
        statusEl.innerText = '❌ Por favor, selecione uma imagem primeiro.';
        statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
        return;
    }

    try {
        statusEl.innerText = '⏳ Comprimindo imagem...';
        statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';

        const quality = parseFloat(rangeInput.value) / 100;
        const img = await loadImageFromFile(file);

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const mimeType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';

        canvas.toBlob((blob) => {
            if (!blob) {
                statusEl.innerText = '❌ Falha ao processar a compressão.';
                statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
                return;
            }

            const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || 'imagem';
            const newFileName = `${originalName}_comprimida${extension}`;

            downloadFile(blob, newFileName);

            const origSize = formatFileSize(file.size);
            const newSize = formatFileSize(blob.size);
            const reduction = (((file.size - blob.size) / file.size) * 100).toFixed(1);

            if (blob.size < file.size) {
                statusEl.innerText = `✅ Concluído! ${origSize} ➔ ${newSize} (${reduction}% menor)`;
                statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';
            } else {
                statusEl.innerText = `✅ Concluído! (${newSize}). Imagem já estava otimizada.`;
                statusEl.className = 'text-xs text-center text-yellow-400 mt-3 min-h-[1rem]';
            }
        }, mimeType, quality);

    } catch (err) {
        statusEl.innerText = `❌ ${err.message}`;
        statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
    }
}

// ==========================================
// 2. CONVERSOR DE IMAGENS & DRAG AND DROP
// ==========================================

let convertSelectedFile = null;

function updateConvertDropZoneUI(file) {
    const textEl = document.getElementById('drop-zone-img-text');
    if (file) {
        convertSelectedFile = file;
        // CORREÇÃO DE SEGURANÇA NA INTERPOLAÇÃO DE NOME DE ARQUIVO
        textEl.innerHTML = `<span class="font-semibold text-emerald-400">${escapeHtml(file.name)}</span> (${formatFileSize(file.size)})`;
    } else {
        convertSelectedFile = null;
        textEl.innerHTML = `<span class="font-semibold text-emerald-400">Clique</span> ou arraste a imagem`;
    }
}

function handleImgConvertSelect() {
    const fileInput = document.getElementById('img-convert-file');
    if (fileInput.files && fileInput.files[0]) {
        updateConvertDropZoneUI(fileInput.files[0]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone-img-convert');
    const fileInput = document.getElementById('img-convert-file');

    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('border-emerald-500', 'bg-gray-700');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('border-emerald-500', 'bg-gray-700');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            fileInput.files = files;
            updateConvertDropZoneUI(files[0]);
        }
    });
});

async function convertImage() {
    const targetFormat = document.getElementById('img-target-format').value;
    const statusEl = document.getElementById('img-convert-status');

    if (!convertSelectedFile) {
        statusEl.innerText = '❌ Selecione ou arraste uma imagem primeiro.';
        statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
        return;
    }

    try {
        statusEl.innerText = '⏳ Convertendo imagem...';
        statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';

        const img = await loadImageFromFile(convertSelectedFile);
        const mimeTypes = {
            jpg: 'image/jpeg',
            png: 'image/png',
            webp: 'image/webp',
            gif: 'image/gif',
            bmp: 'image/bmp',
            tiff: 'image/tiff',
            svg: 'image/svg+xml'
        };

        const targetMime = mimeTypes[targetFormat] || 'image/jpeg';

        if (targetFormat === 'svg') {
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            const dataUrl = img.src;

            const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <image href="${dataUrl}" width="${width}" height="${height}" />
</svg>`;

            const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
            const originalName = convertSelectedFile.name.substring(0, convertSelectedFile.name.lastIndexOf('.')) || 'imagem';
            downloadFile(blob, `${originalName}.svg`);

            statusEl.innerText = '✅ Convertido para SVG com sucesso!';
            statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');

        if (['jpg', 'bmp'].includes(targetFormat)) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
            if (!blob) {
                statusEl.innerText = `❌ Navegador não suporta exportar para .${targetFormat.toUpperCase()}.`;
                statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
                return;
            }

            const originalName = convertSelectedFile.name.substring(0, convertSelectedFile.name.lastIndexOf('.')) || 'imagem';
            const newFileName = `${originalName}.${targetFormat}`;

            downloadFile(blob, newFileName);

            statusEl.innerText = `✅ Convertida para ${targetFormat.toUpperCase()} (${formatFileSize(blob.size)})!`;
            statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';
        }, targetMime, 0.92);

    } catch (err) {
        statusEl.innerText = `❌ ${err.message}`;
        statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
    }
}

// ==========================================
// ESCREVER LIVREMENTE SOBRE O PDF (ANOTAÇÃO LIVRE)
// ==========================================

let pdfEditOriginalBytes = null; // bytes originais do PDF (para salvar depois)
let pdfEditDoc = null; // documento carregado pelo pdf.js (para renderizar)
let pdfEditCurrentPage = 1;
let pdfEditTotalPages = 1;
let pdfEditCurrentViewport = null; // viewport da página atualmente renderizada
const pdfEditRenderScale = 1.5;
let pdfEditAnnotations = {}; // { numeroDaPagina: [ {xRatio, yRatio, text, fontSize, color} ] }

function handlePdfEditFileSelect() {
    const fileInput = document.getElementById('file-input-pdfedit');
    const dropZoneText = document.getElementById('drop-zone-pdfedit-text');
    const workspace = document.getElementById('pdfedit-workspace');
    const downloadBtn = document.getElementById('btn-pdfedit-download');
    const statusEl = document.getElementById('status-pdfedit');

    workspace.classList.add('hidden');
    downloadBtn.classList.add('hidden');
    statusEl.innerText = '';
    pdfEditAnnotations = {};

    if (!fileInput.files.length) {
        dropZoneText.innerHTML = `<span class="font-semibold text-emerald-400">Clique para selecionar</span> ou arraste o PDF aqui`;
        return;
    }

    const file = fileInput.files[0];
    dropZoneText.innerHTML = `📄 Selecionado: <strong class="text-emerald-400">${escapeHtml(file.name)}</strong>`;
    loadPdfForEditing(file);
}

async function loadPdfForEditing(file) {
    const statusEl = document.getElementById('status-pdfedit');
    updateStatus(statusEl, "⏳ Carregando PDF...", true);

    try {
        await carregarLibs('pdfjs', 'pdflib');
        pdfEditOriginalBytes = await file.arrayBuffer();
        // pdfjsLib consome o buffer; usamos uma cópia para não afetar os bytes originais salvos
        pdfEditDoc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfEditOriginalBytes.slice(0)) }).promise;
        pdfEditTotalPages = pdfEditDoc.numPages;
        pdfEditCurrentPage = 1;

        document.getElementById('pdfedit-workspace').classList.remove('hidden');
        document.getElementById('btn-pdfedit-download').classList.remove('hidden');
        document.getElementById('pdfedit-page-total').innerText = pdfEditTotalPages;

        await renderPdfEditPage(pdfEditCurrentPage);
        updateStatus(statusEl, "✅ PDF carregado. Clique na página para escrever.");
    } catch (error) {
        console.error(error);
        updateStatus(statusEl, "❌ Não foi possível abrir este PDF.", false, true);
    }
}

// Evita "Cannot use the same canvas during multiple render() operations" ao trocar de página
// rápido: cada chamada ganha um número, a anterior é cancelada e chamadas antigas são descartadas.
let pdfEditRenderSeq = 0;
let pdfEditRenderTask = null;

async function renderPdfEditPage(pageNum) {
    const seq = ++pdfEditRenderSeq;

    if (pdfEditRenderTask) {
        pdfEditRenderTask.cancel();
        try { await pdfEditRenderTask.promise; } catch (e) { /* cancelamento esperado */ }
        pdfEditRenderTask = null;
    }

    const page = await pdfEditDoc.getPage(pageNum);
    if (seq !== pdfEditRenderSeq) return; // uma chamada mais nova já assumiu

    const viewport = page.getViewport({ scale: pdfEditRenderScale });
    pdfEditCurrentViewport = viewport;

    const canvas = document.getElementById('pdfedit-canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    const task = page.render({ canvasContext: ctx, viewport });
    pdfEditRenderTask = task;
    try {
        await task.promise;
    } catch (e) {
        if (e && e.name === 'RenderingCancelledException') return;
        throw e;
    }
    if (pdfEditRenderTask === task) pdfEditRenderTask = null;
    if (seq !== pdfEditRenderSeq) return;

    canvas.onclick = onPdfEditCanvasClick;

    document.getElementById('pdfedit-page-num').innerText = pageNum;
    renderPdfEditOverlays();
}

function pdfEditPrevPage() {
    if (pdfEditCurrentPage > 1) {
        pdfEditCurrentPage--;
        renderPdfEditPage(pdfEditCurrentPage);
    }
}

function pdfEditNextPage() {
    if (pdfEditCurrentPage < pdfEditTotalPages) {
        pdfEditCurrentPage++;
        renderPdfEditPage(pdfEditCurrentPage);
    }
}

function pdfEditClearPage() {
    const statusEl = document.getElementById('status-pdfedit');
    const wrapper = document.getElementById('pdfedit-canvas-wrapper');

    // Descarta uma caixa de digitação ainda aberta (esvazia antes: remover dispara o blur, que confirmaria o texto)
    wrapper.querySelectorAll('.pdfedit-temp-input').forEach(box => {
        const campo = box.querySelector('textarea');
        if (campo) campo.value = '';
        box.remove();
    });

    const quantidade = (pdfEditAnnotations[pdfEditCurrentPage] || []).length;
    pdfEditAnnotations[pdfEditCurrentPage] = [];
    renderPdfEditOverlays();

    statusEl.innerText = quantidade
        ? `🗑️ ${quantidade} anotação(ões) removida(s) desta página.`
        : 'Não há anotações nesta página para limpar.';
}

function onPdfEditCanvasClick(event) {
    const canvas = document.getElementById('pdfedit-canvas');
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    openPdfEditInlineInput(clickX, clickY);
}

function openPdfEditInlineInput(clickX, clickY) {
    const wrapper = document.getElementById('pdfedit-canvas-wrapper');

    // Remove qualquer caixa de digitação pendente antes de abrir outra
    const existingInput = wrapper.querySelector('.pdfedit-temp-input');
    if (existingInput) existingInput.remove();

    const fontSize = parseInt(document.getElementById('pdfedit-fontsize').value) || 12;
    const color = document.getElementById('pdfedit-color').value;

    // Caixa móvel: uma alça "✥ mover" em cima e o textarea embaixo
    const box = document.createElement('div');
    box.className = 'pdfedit-temp-input absolute z-10';
    box.style.left = `${clickX}px`;
    box.style.top = `${clickY}px`;

    const handle = document.createElement('div');
    handle.textContent = '✥ mover';
    handle.className = 'bg-emerald-500 text-gray-950 text-[10px] font-bold px-1.5 py-0.5 rounded-t select-none w-max';

    const input = document.createElement('textarea');
    input.className = 'block bg-white/90 border-2 border-emerald-500 rounded-b rounded-tr px-1 py-0.5 outline-none resize';
    input.style.fontSize = `${fontSize}px`;
    input.style.color = color;
    input.style.minWidth = '120px';
    input.rows = 1;

    box.appendChild(handle);
    box.appendChild(input);
    wrapper.appendChild(box);
    makePdfEditDraggable(box, handle);
    input.focus();

    let finalizado = false;
    const commit = () => {
        if (finalizado) return;
        finalizado = true;
        const text = input.value;
        // Posição final = onde a caixa foi parar (o texto fica no topo do textarea)
        const finalX = parseFloat(box.style.left) || 0;
        const finalY = (parseFloat(box.style.top) || 0) + input.offsetTop;
        box.remove();
        if (!text || !text.trim()) return;

        const canvas = document.getElementById('pdfedit-canvas');
        const annotation = {
            xRatio: finalX / canvas.width,
            yRatio: finalY / canvas.height,
            text: text,
            fontSize: fontSize,
            color: color
        };

        if (!pdfEditAnnotations[pdfEditCurrentPage]) pdfEditAnnotations[pdfEditCurrentPage] = [];
        pdfEditAnnotations[pdfEditCurrentPage].push(annotation);
        renderPdfEditOverlays();
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commit();
        } else if (e.key === 'Escape') {
            input.value = '';
            commit();
        }
    });
    input.addEventListener('blur', commit);
}

// Arrasta `el` (posicionado com left/top em px dentro do wrapper) segurando `handle`.
function makePdfEditDraggable(el, handle, onDrop) {
    handle.style.cursor = 'move';
    handle.style.touchAction = 'none';
    // Impede que clicar na alça tire o foco do textarea (o blur confirmaria/cancelaria o texto)
    handle.addEventListener('mousedown', e => e.preventDefault());

    handle.addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();
        const canvas = document.getElementById('pdfedit-canvas');
        const startX = e.clientX;
        const startY = e.clientY;
        const origLeft = parseFloat(el.style.left) || 0;
        const origTop = parseFloat(el.style.top) || 0;
        handle.setPointerCapture(e.pointerId);

        const move = ev => {
            el.style.left = `${Math.min(Math.max(0, origLeft + ev.clientX - startX), canvas.width - 20)}px`;
            el.style.top = `${Math.min(Math.max(0, origTop + ev.clientY - startY), canvas.height - 20)}px`;
        };
        const up = () => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', up);
            handle.removeEventListener('pointercancel', up);
            if (onDrop) onDrop(parseFloat(el.style.left) || 0, parseFloat(el.style.top) || 0);
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
        handle.addEventListener('pointercancel', up);
    });
}

// Modo tela cheia: o workspace vai para o <body> (fora do card, cujo hover usa transform e
// quebraria o position:fixed) e ocupa a janela inteira; ao fechar, volta ao lugar original.
let pdfEditFsPlaceholder = null;

function togglePdfEditFullscreen() {
    const workspace = document.getElementById('pdfedit-workspace');
    const wrapper = document.getElementById('pdfedit-canvas-wrapper');
    const btn = document.getElementById('pdfedit-fs-btn');
    const dlBtn = document.getElementById('pdfedit-fs-download');
    const abrindo = !pdfEditFsPlaceholder;

    if (abrindo) {
        pdfEditFsPlaceholder = document.createComment('pdfedit-workspace');
        workspace.parentNode.insertBefore(pdfEditFsPlaceholder, workspace);
        document.body.appendChild(workspace);
        workspace.classList.add('fixed', 'inset-0', 'bg-gray-900', 'p-4', 'overflow-auto');
        workspace.style.zIndex = '100';
        wrapper.style.maxHeight = 'calc(100vh - 150px)';
        // Centraliza o documento na janela
        wrapper.style.display = 'block';
        wrapper.style.width = 'fit-content';
        wrapper.style.maxWidth = '100%';
        wrapper.style.margin = '0 auto';
        document.body.style.overflow = 'hidden';
    } else {
        pdfEditFsPlaceholder.parentNode.insertBefore(workspace, pdfEditFsPlaceholder);
        pdfEditFsPlaceholder.remove();
        pdfEditFsPlaceholder = null;
        workspace.classList.remove('fixed', 'inset-0', 'bg-gray-900', 'p-4', 'overflow-auto');
        workspace.style.zIndex = '';
        wrapper.style.maxHeight = '';
        wrapper.style.display = '';
        wrapper.style.width = '';
        wrapper.style.maxWidth = '';
        wrapper.style.margin = '';
        document.body.style.overflow = '';
    }
    btn.innerText = abrindo ? '✕ Sair da tela cheia' : '⛶ Tela cheia';
    dlBtn.classList.toggle('hidden', !abrindo);
}

document.addEventListener('keydown', e => {
    // Esc sai da tela cheia (se estiver digitando numa caixa, o Esc só cancela o texto)
    if (e.key === 'Escape' && pdfEditFsPlaceholder && !document.querySelector('.pdfedit-temp-input')) {
        togglePdfEditFullscreen();
    }
});

function renderPdfEditOverlays() {
    const wrapper = document.getElementById('pdfedit-canvas-wrapper');
    wrapper.querySelectorAll('.pdfedit-overlay-text').forEach(el => el.remove());

    const canvas = document.getElementById('pdfedit-canvas');
    const list = pdfEditAnnotations[pdfEditCurrentPage] || [];

    list.forEach((ann, index) => {
        const box = document.createElement('div');
        box.className = 'pdfedit-overlay-text absolute group';
        box.style.left = `${ann.xRatio * canvas.width}px`;
        box.style.top = `${ann.yRatio * canvas.height}px`;

        const textSpan = document.createElement('span');
        textSpan.style.fontSize = `${ann.fontSize}px`;
        textSpan.style.color = ann.color;
        textSpan.style.whiteSpace = 'pre-wrap';
        textSpan.textContent = ann.text; // textContent: seguro contra XSS por definição

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '✕';
        removeBtn.className = 'align-top ml-1 text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            pdfEditAnnotations[pdfEditCurrentPage].splice(index, 1);
            renderPdfEditOverlays();
        };

        // Alça para reposicionar o texto já colocado
        const moveHandle = document.createElement('span');
        moveHandle.textContent = '✥';
        moveHandle.title = 'Arraste para mover';
        moveHandle.className = 'align-top mr-1 text-emerald-500 text-xs opacity-40 group-hover:opacity-100 transition select-none';
        makePdfEditDraggable(box, moveHandle, (x, y) => {
            ann.xRatio = x / canvas.width;
            ann.yRatio = y / canvas.height;
            renderPdfEditOverlays();
        });

        box.appendChild(moveHandle);
        box.appendChild(textSpan);
        box.appendChild(removeBtn);
        wrapper.appendChild(box);
    });
}

function pdfEditHexToRgb01(hex) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return { r, g, b };
}

async function downloadEditedPdf() {
    const statusEl = document.getElementById('status-pdfedit');
    const fileInput = document.getElementById('file-input-pdfedit');

    if (!pdfEditOriginalBytes) {
        alert('Selecione um PDF primeiro.');
        return;
    }

    const hasAnyAnnotation = Object.values(pdfEditAnnotations).some(list => list && list.length);
    if (!hasAnyAnnotation) {
        alert('Clique na página e escreva ao menos um texto antes de baixar.');
        return;
    }

    updateStatus(statusEl, "⏳ Gerando PDF com as anotações...", true);

    try {
        await carregarLib('pdflib');
        const pdfDoc = await PDFLib.PDFDocument.load(pdfEditOriginalBytes);
        const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();

        Object.keys(pdfEditAnnotations).forEach(pageNumStr => {
            const pageIndex = parseInt(pageNumStr) - 1;
            const list = pdfEditAnnotations[pageNumStr];
            if (!list || !list.length || !pages[pageIndex]) return;

            const page = pages[pageIndex];
            const { width, height } = page.getSize();

            list.forEach(ann => {
                const { r, g, b } = pdfEditHexToRgb01(ann.color);
                const x = ann.xRatio * width;
                // Canvas tem origem no topo; PDF tem origem embaixo — por isso a inversão do Y.
                const y = height - (ann.yRatio * height) - ann.fontSize;

                page.drawText(ann.text, {
                    x,
                    y,
                    size: ann.fontSize,
                    font: helvetica,
                    color: PDFLib.rgb(r, g, b),
                    lineHeight: ann.fontSize * 1.2
                });
            });
        });

        const editedBytes = await pdfDoc.save();
        const blob = new Blob([editedBytes], { type: 'application/pdf' });
        const originalName = fileInput.files[0] ? getBaseFileName(fileInput.files[0].name) : 'documento';

        downloadFile(blob, `${originalName}_anotado.pdf`);
        updateStatus(statusEl, "✅ PDF com as anotações gerado com sucesso!");
    } catch (error) {
        console.error(error);
        updateStatus(statusEl, "❌ Erro ao gerar o PDF anotado.", false, true);
    }
}

// ==========================================
// UNIFICADOR DE PDF (MERGE)
// ==========================================

function handleMergeFileSelect() {
    const fileInput = document.getElementById('file-input-merge');
    const dropZoneText = document.getElementById('drop-zone-merge-text');

    if (fileInput.files.length > 0) {
        dropZoneText.innerHTML = `📄 <strong class="text-emerald-400">${fileInput.files.length} arquivos PDF selecionados</strong>`;
    } else {
        dropZoneText.innerHTML = `<span class="font-semibold text-emerald-400">Clique para selecionar</span> ou arraste os PDFs aqui`;
    }
}

async function mergePDFs() {
    const fileInput = document.getElementById('file-input-merge');
    const statusEl = document.getElementById('status-merge');

    if (!fileInput.files || fileInput.files.length < 2) {
        alert('Por favor, selecione pelo menos 2 arquivos PDF para unir.');
        return;
    }

    updateStatus(statusEl, "⏳ Unindo arquivos PDF...", true);

    try {
        await carregarLib('pdflib');
        const mergedPdf = await PDFLib.PDFDocument.create();

        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

        downloadFile(blob, 'documento_unido.pdf');
        updateStatus(statusEl, "✅ PDFs unidos com sucesso!");
    } catch (error) {
        console.error(error);
        updateStatus(statusEl, "❌ Erro ao unir os PDFs.", false, true);
    }
}

// ==========================================
// DIVISOR DE PDF (SPLIT)
// ==========================================

function handleSplitFileSelect() {
    const fileInput = document.getElementById('file-input-split');
    const dropZoneText = document.getElementById('drop-zone-split-text');

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        dropZoneText.innerHTML = `📄 Selecionado: <strong class="text-emerald-400">${escapeHtml(file.name)}</strong>`;
    }
}

async function splitPDF() {
    const fileInput = document.getElementById('file-input-split');
    const rangeInput = document.getElementById('split-range').value.trim();
    const statusEl = document.getElementById('status-split');

    if (!fileInput.files.length) {
        alert('Por favor, selecione um arquivo PDF primeiro.');
        return;
    }

    if (!rangeInput) {
        alert('Informe as páginas que deseja extrair (ex: 1-3, 5).');
        return;
    }

    updateStatus(statusEl, "⏳ Dividindo e extraindo páginas...", true);

    try {
        await carregarLib('pdflib');
        const file = fileInput.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const subPdf = await PDFLib.PDFDocument.create();

        let pagesToExtract = [];
        const totalPages = pdf.getPageCount();

        // Interpretador de intervalos (ex: "1-3, 5, 7-9")
        rangeInput.split(',').forEach(part => {
            part = part.trim();
            if (part.includes('-')) {
                let [start, end] = part.split('-').map(n => parseInt(n.trim()) - 1);
                for (let i = start; i <= end; i++) {
                    if (i >= 0 && i < totalPages) pagesToExtract.push(i);
                }
            } else {
                let p = parseInt(part) - 1;
                if (p >= 0 && p < totalPages) pagesToExtract.push(p);
            }
        });

        if (pagesToExtract.length === 0) {
            throw new Error("Nenhuma página válida foi informada.");
        }

        const copiedPages = await subPdf.copyPages(pdf, pagesToExtract);
        copiedPages.forEach(page => subPdf.addPage(page));

        const subPdfBytes = await subPdf.save();
        const blob = new Blob([subPdfBytes], { type: 'application/pdf' });

        const originalName = getBaseFileName(file.name);
        downloadFile(blob, `${originalName}_dividido.pdf`);

        updateStatus(statusEl, "✅ Páginas extraídas e salvas com sucesso!");
    } catch (error) {
        console.error(error);
        updateStatus(statusEl, "❌ Erro ao dividir PDF: " + (error.message || "Verifique as páginas informadas."), false, true);
    }
}

// ==========================================
// ⬇️ BAIXADOR DE VÍDEOS (Cobalt + CORS Proxy)
// ==========================================

async function processVideoRequest() {
    const urlInput = document.getElementById('video-url').value.trim();
    const format = document.getElementById('video-format').value; // mp4 ou mp3

    const placeholder = document.getElementById('video-placeholder');
    const loading = document.getElementById('video-loading');
    const resultPanel = document.getElementById('video-result');

    // Validação básica
    if (!urlInput) {
        alert("Por favor, cole a URL do vídeo.");
        return;
    }

    if (!urlInput.includes('http')) {
        alert("URL inválida. Certifique-se de copiar o link completo (começando com http:// ou https://).");
        return;
    }

    // Alternar interface para "Carregando"
    placeholder.classList.add('hidden');
    resultPanel.classList.add('hidden');
    loading.classList.remove('hidden');

    try {
        const isAudio = format === 'mp3';

        // ⚠️ ADICIONADO CORS PROXY: Ele atua como uma ponte para evitar o erro "Failed to fetch"
        const targetUrl = 'https://api.cobalt.tools/api/json';
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: urlInput,
                isAudioOnly: isAudio,
                aFormat: "mp3",
                vQuality: "720"
            })
        });

        // Se o proxy falhar ou a API bloquear, cairá aqui
        if (!response.ok) {
            throw new Error(`Erro na comunicação com o servidor (Status: ${response.status}). O serviço pode estar temporariamente indisponível.`);
        }

        const data = await response.json();

        if (data.status === 'error' || !data.url) {
            throw new Error(data.text || "Não foi possível processar este vídeo. Verifique se o link é público ou tente outro.");
        }

        // Populando a tela
        document.getElementById('video-thumbnail').src = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
        document.getElementById('video-title').innerText = "✅ Arquivo processado com sucesso!";

        const downloadBtn = document.getElementById('video-download-btn');
        downloadBtn.href = data.url;
        downloadBtn.onclick = null;

        downloadBtn.innerHTML = isAudio ? "<span>🎵</span> Baixar Áudio (MP3)" : "<span>⬇️</span> Baixar Vídeo (MP4)";

        loading.classList.add('hidden');
        resultPanel.classList.remove('hidden');

    } catch (error) {
        console.error("Detalhes do erro:", error);

        // Mensagem de erro mais amigável
        if (error.message.includes("Failed to fetch")) {
            alert("Bloqueio de rede ou CORS. O servidor de download está bloqueando a requisição no momento.");
        } else {
            alert(error.message);
        }

        loading.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }
}