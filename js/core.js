// NÚCLEO: carregado em TODAS as páginas (menu, tema, avisos/confete, compartilhar simulação, easter egg, utilitários comuns)
// (Gerado na divisão do script.js único; agora este arquivo é editado diretamente.)

// ==========================================
// CARREGAMENTO SOB DEMANDA DE BIBLIOTECAS
// ==========================================
// Libs pesadas (PDF, Word, Excel...) só são baixadas quando a função que as usa é acionada.
// (O Chart.js é a exceção: a página de Juros Compostos o carrega direto, porque o gráfico aparece de imediato.)
// Novas libs: registrar aqui E liberar o domínio na CSP do _fonte/base.html.
// O número ?v=... dos <script> locais (colocado pelo build.js) serve para o navegador buscar arquivos novos.
const VERSAO_JS = (() => {
    const tag = document.querySelector('script[src*="core.js"]');
    return tag ? (new URL(tag.src, location.href).searchParams.get('v') || '') : '';
})();

const LIBS_SOB_DEMANDA = {
    // Modo Viagem: arquivo local carregado só quando a pessoa clica no botão flutuante
    viagem: { src: `js/viagem.js?v=${VERSAO_JS}`, pronta: () => window.__viagemCarregada },
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
    qrcode: { src: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', pronta: () => window.QRCode },
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

// (O fundo da página é uma aurora boreal ESTÁTICA feita só em CSS — ver o body no style.css. A antiga névoa animada
// do Vanta.js foi removida: deixava as páginas mais pesadas e não é mais usada.)


// ==========================================

// CONFIGURAÇÃO DE ABAS COM CORES
// ==========================================
const abas = [
    { id: 'home', nome: 'Início', color: 'emerald', pagina: 'index.html' },
    { id: 'juros-compostos', nome: 'Juros Compostos', color: 'cyan', pagina: 'juros-compostos.html' },
    { id: 'reserva', nome: 'Reserva', color: 'blue', pagina: 'reserva-de-emergencia.html' },
    { id: 'milhao', nome: 'Rumo ao Milhão', color: 'indigo', pagina: 'rumo-ao-milhao.html' },
    { id: 'financiamento', nome: 'Imóvel', color: 'purple', pagina: 'financiamento-imobiliario.html' },
    { id: 'veiculos', nome: 'Veículos', color: 'rose', pagina: 'financiamento-de-veiculos.html' },
    { id: 'amortizacao', nome: 'Amortização', color: 'amber', pagina: 'amortizacao-extra.html' },
    { id: 'alugar-comprar', nome: 'Alugar vs Comp.', color: 'sky', pagina: 'alugar-ou-comprar.html' },
    { id: 'comparador', nome: 'À Vista vs Parc.', color: 'violet', pagina: 'a-vista-ou-parcelado.html' },
    { id: 'investimentos', nome: 'Investimentos', color: 'lime', pagina: 'comparador-de-investimentos.html' },
    { id: 'fgts', nome: 'FGTS', color: 'teal', pagina: 'calculadora-fgts.html' },
    { id: 'rescisao-clt', nome: 'Rescisão CLT', color: 'fuchsia', pagina: 'rescisao-clt.html' },
    { id: 'salario-liquido', nome: 'Salário Líquido', color: 'teal', pagina: 'salario-liquido.html' },
    { id: 'documentos', nome: 'Gerador Docs', color: 'lime', pagina: 'gerador-de-documentos.html' },
    { id: 'conversores', nome: 'Conversores', color: 'green', pagina: 'conversor-de-arquivos.html' },
    { id: 'imagens', nome: 'Imagens', color: 'orange', pagina: 'ferramentas-de-imagem.html' },
    { id: 'qrcode', nome: 'QR-Code', color: 'red', pagina: 'gerador-de-qr-code.html' },
    { id: 'senha', nome: 'Gerador de Senha', color: 'rose', pagina: 'gerador-de-senha.html' },
    { id: 'porcentagem', nome: 'Porcentagem', color: 'sky', pagina: 'calculadora-de-porcentagem.html' },
    { id: 'unidades', nome: 'Unidades', color: 'violet', pagina: 'conversor-de-unidades.html' }
];

// Endereço (arquivo) da página de cada ferramenta. A fonte oficial dessa lista é o _fonte/paginas.json:
// se mudar um endereço lá, mude aqui também (o build.js confere se as duas listas batem).
function paginaDaAba(id) {
    const aba = abas.find(a => a.id === id);
    return aba ? aba.pagina : 'index.html';
}

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
    'imagens': '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-9 9"/>',
    'investimentos': '<path d="M3 21h18"/><path d="M6 21v-7M11 21V8M16 21v-4M21 21V3"/>',
    'salario-liquido': '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v.01M18 14v.01"/>',
    'senha': '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    'porcentagem': '<path d="M19 5L5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    'unidades': '<path d="M3 17L17 3l4 4L7 21z"/><path d="M8 12l2 2M11 9l2 2M14 6l2 2"/>',
    'qrcode': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v1M14 20h1M18 20h3v-3"/>'
};

function iconeAba(id, px) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0">${ICONES_ABAS[id] || ''}</svg>`;
}

// Todas as abas do menu usam UMA cor só (a cor de destaque do tema atual): 'unica' -> classes .tab-unica / .glow-unica.
// (O campo color do array abas ficou só por compatibilidade e não é mais usado para pintar o menu.)
const COR_UNICA_ABAS = 'unica';

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
        <a href="${aba.pagina}" id="btn-${aba.id}"
            class="${classeBaseAba(COR_UNICA_ABAS, false)}"
            title="${aba.nome}">
            ${iconeAba(aba.id, 14)}
            <span class="text-[11px] font-semibold leading-tight whitespace-nowrap">${aba.nome}</span>
        </a>
    `).join('');

    drawerNav.innerHTML = `<button onclick="closeMobileMenu()" class="self-end text-gray-400 hover:text-gray-100 text-2xl leading-none mb-4">✕</button>` + abas.map(aba => `
        <a href="${aba.pagina}" id="btn-drawer-${aba.id}"
            class="${classeBaseAba(COR_UNICA_ABAS, true)}"
            title="${aba.nome}">
            ${iconeAba(aba.id, 18)}
            <span class="font-semibold">${aba.nome}</span>
        </a>
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

// Botão flutuante "não clique": a legenda só muda ao CLICAR (5 frases); o 6º clique abre o Modo Viagem
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('troll-btn');
    const label = document.getElementById('troll-label');
    if (!btn || !label) return;

    const inicial = label.innerText;
    const frases = ['não clique', 'sério, não clique', 'você foi avisado', 'último aviso...', 'ok, você pediu 🌀'];
    let i = 0;
    let timerLegenda = null;
    const voltar = () => { label.classList.remove('mostrar'); label.innerText = inicial; i = 0; };
    // Já baixa o js/viagem.js quando o mouse chega no botão e 3s após abrir a página (arquivo pequeno): o 6º clique abre na hora
    const preparar = () => { carregarLib('viagem').catch(() => {}); };
    setTimeout(preparar, 3000);
    btn.addEventListener('pointerenter', preparar, { once: true });
    btn.addEventListener('pointerdown', preparar, { once: true });
    // Cada clique mostra a próxima frase (5 no total); o clique seguinte à última leva ao Modo Viagem (6º clique)
    btn.addEventListener('click', () => {
        clearTimeout(timerLegenda);
        if (i < frases.length) {
            label.innerText = frases[i];
            label.classList.add('mostrar');
            i++;
            timerLegenda = setTimeout(voltar, 8000); // 8s para dar o próximo clique antes de recomeçar
        } else {
            voltar();
            abrirViagem();
        }
    });
    // Botão iridescente: o brilho, o filme colorido e o ícone acompanham o ponteiro (ou a inclinação do celular).
    // --px e --py vão de -1 a 1 e o CSS (.troll-btn) faz o resto. Sem "reduzir movimento", o botão fica parado.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let alvoX = 0, alvoY = 0, atualX = 0, atualY = 0, agendado = false;
    const limitar = v => Math.max(-1, Math.min(1, v));

    const animar = () => {
        agendado = false;
        atualX += (alvoX - atualX) * 0.18; // suaviza: o movimento "escorrega" até o alvo
        atualY += (alvoY - atualY) * 0.18;
        btn.style.setProperty('--px', atualX.toFixed(3));
        btn.style.setProperty('--py', atualY.toFixed(3));
        if (Math.abs(alvoX - atualX) > 0.002 || Math.abs(alvoY - atualY) > 0.002) pedirQuadro();
    };
    const pedirQuadro = () => { if (!agendado) { agendado = true; requestAnimationFrame(animar); } };

    window.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        alvoX = limitar((e.clientX - (r.left + r.width / 2)) / 260);
        alvoY = limitar((e.clientY - (r.top + r.height / 2)) / 260);
        pedirQuadro();
    }, { passive: true });

    // Celulares Android/desktop com sensor: a inclinação do aparelho move o brilho (iOS exige permissão, então fica de fora)
    if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
        window.addEventListener('deviceorientation', e => {
            if (e.gamma == null || e.beta == null) return;
            alvoX = limitar(e.gamma / 30);
            alvoY = limitar((e.beta - 45) / 30);
            pedirQuadro();
        }, { passive: true });
    }
});

// ==========================================

// FERRAMENTAS NOVAS: salário líquido, investimentos, senha, porcentagem e unidades
// ==========================================

// Lê números digitados em pt-BR ("1.234,56", "12,5") ou com ponto decimal ("12.5"); vazio/inválido = 0
function parseNumeroBR(texto) {
    let s = String(texto).trim().replace(/[R$%\s]/g, '');
    if (!s) return 0;
    if (s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.');
    } else {
        const pontos = (s.match(/\./g) || []).length;
        // "1.234" ou "1.234.567" = milhares (pt-BR); "12.5" = decimal
        if (pontos > 1 || /^\d{1,3}\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
    }
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
}

function lerNumero(id) {
    const el = document.getElementById(id);
    return el ? parseNumeroBR(el.value) : 0;
}

const fmtBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
// Meio para cima com tolerância: 121,575 vira 121,58 (a soma em ponto flutuante daria 121,57499999...)
const arredonda2 = v => Math.round((v + 1e-9) * 100) / 100;

// ---------- Salário líquido (tabelas 2026: INSS e IRRF) ----------
// Fontes: Portaria Interministerial MPS/MF nº 13/2026 (INSS) e Receita Federal / Lei 15.270/2025 (IRRF).

// TEMA CLARO / ESCURO (botão flutuante) + tema secreto "neon"
// ==========================================
// O tema é o atributo data-tema no <html>; as cores vêm das variáveis do style.css.
// Claro/escuro ficam salvos no localStorage; o tema secreto (neon) vale só até recarregar.
const TEMA_KEY = 'excalc_tema';

function temaAtual() {
    return document.documentElement.getAttribute('data-tema') || 'escuro';
}

function aplicarTema(tema, salvar) {
    const raiz = document.documentElement;
    if (tema === 'escuro') raiz.removeAttribute('data-tema');
    else raiz.setAttribute('data-tema', tema);

    if (salvar) {
        try { localStorage.setItem(TEMA_KEY, tema === 'claro' || tema === 'vidro' ? tema : 'escuro'); } catch (e) { /* modo privado: tudo bem */ }
    }
    atualizarBotaoDeTema();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', corDoNavegadorPorTema(tema));

    // o gráfico depende do tema: refaz
    if (typeof calculateJC === 'function' && document.getElementById('growthChart')) {
        const antes = calculoAutomatico;
        calculoAutomatico = true;
        calculateJC();
        calculoAutomatico = antes;
    }
}

// Ciclo do botão flutuante: escuro -> claro -> vidro -> escuro (o tema secreto "neon" volta para o escuro)
const TEMAS_CICLO = ['escuro', 'claro', 'vidro'];

function proximoTema() {
    const i = TEMAS_CICLO.indexOf(temaAtual());
    return TEMAS_CICLO[(i + 1) % TEMAS_CICLO.length];
}

function alternarTema() {
    aplicarTema(proximoTema(), true);
}

function corDoNavegadorPorTema(tema) {
    if (tema === 'claro') return '#F0F0F4';
    if (tema === 'neon') return '#0D0221';
    if (tema === 'vidro') return '#1B123A';
    return '#060607';
}

// Seletor de tema em "vidro líquido" (3 opções): marca a opção certa e move a peça de vidro até ela.
// No tema secreto (neon) nenhuma opção fica marcada e a peça some.
function atualizarBotaoDeTema() {
    const seletor = document.getElementById('tema-switch');
    if (!seletor) return;
    const atual = temaAtual();
    const ativo = TEMAS_CICLO.includes(atual) ? atual : '';
    const mudou = seletor.getAttribute('data-ativo') !== ativo;
    seletor.setAttribute('data-ativo', ativo);
    seletor.querySelectorAll('input[name="tema"]').forEach(op => { op.checked = op.value === ativo; });
    if (mudou) { // efeito "líquido": a peça estica e volta ao chegar
        seletor.classList.remove('esticando');
        void seletor.offsetWidth;
        seletor.classList.add('esticando');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const seletor = document.getElementById('tema-switch');
    if (!seletor) return;
    seletor.addEventListener('change', e => {
        if (e.target && e.target.name === 'tema') aplicarTema(e.target.value, true);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    atualizarBotaoDeTema();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', corDoNavegadorPorTema(temaAtual()));
});

// Cores do Chart.js seguem o tema (lidas das variáveis CSS)
function coresDoGrafico() {
    const estilo = getComputedStyle(document.documentElement);
    return {
        texto: estilo.getPropertyValue('--texto-grafico').trim() || '#E5E7EB',
        grade: estilo.getPropertyValue('--grade-grafico').trim() || 'rgba(148,163,184,0.15)'
    };
}
// ==========================================
// COMPARTILHAR SIMULAÇÃO: link com os valores preenchidos na parte # do endereço
// ==========================================
// Ex.: index.html#aba=juros-compostos&jc-initial=1.000&jc-rate=1 ...  Quem abre o link vê a simulação pronta.
// Só as calculadoras abaixo participam; os campos são os inputs/selects (com id) dentro da própria aba.
const ABAS_COMPARTILHAVEIS = ['juros-compostos', 'reserva', 'milhao', 'financiamento', 'veiculos', 'amortizacao',
    'alugar-comprar', 'comparador', 'investimentos', 'fgts', 'rescisao-clt', 'salario-liquido', 'porcentagem', 'unidades'];

function camposDaAba(tabId) {
    return Array.from(document.querySelectorAll(`#tab-${tabId} input[id], #tab-${tabId} select[id], #tab-${tabId} textarea[id]`))
        .filter(el => el.type !== 'file' && el.type !== 'button' && el.type !== 'checkbox' && !el.readOnly);
}

function montarLinkSimulacao(tabId) {
    const params = new URLSearchParams();
    params.set('aba', tabId);
    camposDaAba(tabId).forEach(el => { if (el.value !== '') params.set(el.id, el.value); });
    return `${location.origin === 'null' ? '' : location.origin}${location.pathname}#${params.toString()}`;
}

async function compartilharSimulacao(tabId) {
    const link = montarLinkSimulacao(tabId);
    try {
        await navigator.clipboard.writeText(link);
    } catch (e) {
        const tmp = document.createElement('textarea');
        tmp.value = link;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        tmp.remove();
    }
    mostrarToast('🔗 Link da simulação copiado! Cole onde quiser compartilhar.', { duracao: 3500 });
}

// Lê o # da URL e, se for um link de simulação válido, preenche os campos e abre a aba
function aplicarLinkCompartilhado() {
    if (!location.hash || location.hash.length < 6 || location.hash.length > 4000) return false;
    const params = new URLSearchParams(location.hash.slice(1));
    const tabId = params.get('aba');
    if (!tabId || !ABAS_COMPARTILHAVEIS.includes(tabId)) return false;
    if (!document.getElementById(`tab-${tabId}`)) {
        // link de uma ferramenta que mora em outra página: vai até ela levando os valores
        location.replace(paginaDaAba(tabId) + location.hash);
        return true;
    }

    if (tabId === 'unidades') {
        iniciarUnidades();
        if (params.has('un-categoria')) {
            document.getElementById('un-categoria').value = params.get('un-categoria');
            atualizarUnidades();
        }
    }
    camposDaAba(tabId).forEach(el => {
        if (!params.has(el.id)) return;
        const valor = params.get(el.id).slice(0, 200);
        if (el.tagName === 'SELECT') {
            if (Array.from(el.options).some(o => o.value === valor)) el.value = valor; // só aceita opções que existem
        } else {
            el.value = valor;
        }
    });
    switchTab(tabId);
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    // botão "Compartilhar simulação" ao lado do título de cada calculadora
    ABAS_COMPARTILHAVEIS.forEach(tabId => {
        const titulo = document.querySelector(`#tab-${tabId} > h1`);
        if (!titulo || titulo.dataset.compartilhavel) return;
        titulo.dataset.compartilhavel = '1';
        const linha = document.createElement('div');
        linha.className = 'flex flex-wrap items-center justify-between gap-2';
        titulo.parentNode.insertBefore(linha, titulo);
        linha.appendChild(titulo);
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'inline-flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-100 px-3 py-1.5 rounded-lg transition';
        botao.setAttribute('aria-label', 'Copiar link desta simulação');
        botao.textContent = '🔗 Compartilhar simulação';
        botao.addEventListener('click', () => compartilharSimulacao(tabId));
        linha.appendChild(botao);
    });
});
// ==========================================
// EASTER EGG: 7 cliques na marca do rodapé (às vezes a Sala Secreta, às vezes o tema neon)
// ==========================================
const FRASES_SECRETAS = [
    'Juros compostos: a oitava maravilha do mundo, segundo alguém que provavelmente não disse isso. 😄',
    'Você achou! Dica de ouro: quem começa cedo, agradece tarde. 💰',
    'Segredo financeiro nº 1: o melhor momento para investir foi ontem. O segundo melhor é hoje.',
    'Parabéns, você clicou 7 vezes numa logo. Isso é dedicação de investidor de longo prazo. 🧘',
    'Se dinheiro desse em árvore, o IPCA seria o jardineiro. 🌳',
    'Aviso: nenhum rendimento de 10.000% ao mês foi maltratado na criação deste site.'
];

function abrirSalaSecreta() {
    const sala = document.getElementById('sala-secreta');
    if (!sala) return;
    document.getElementById('sala-secreta-frase').textContent = FRASES_SECRETAS[(Math.random() * FRASES_SECRETAS.length) | 0];
    sala.classList.remove('hidden');
    lancarConfete();
}

function fecharSalaSecreta() {
    const sala = document.getElementById('sala-secreta');
    if (sala) sala.classList.add('hidden');
}

function ativarTemaSecreto() {
    aplicarTema('neon', false); // nunca é salvo: recarregar a página volta ao normal
    celebrar('🌈 Tema secreto ativado! Recarregue a página para voltar ao normal.');
}

function dispararSegredo() {
    // Sorteia entre os dois segredos (se o neon já está ativo, sempre abre a sala)
    if (temaAtual() !== 'neon' && Math.random() < 0.5) ativarTemaSecreto();
    else abrirSalaSecreta();
}

document.addEventListener('DOMContentLoaded', () => {
    const marca = document.getElementById('marca-secreta');
    if (!marca) return;
    let cliques = 0;
    let timer = null;
    marca.addEventListener('click', () => {
        cliques++;
        marca.classList.remove('balanca');
        void marca.offsetWidth; // reinicia a animação
        marca.classList.add('balanca');
        clearTimeout(timer);
        timer = setTimeout(() => { cliques = 0; }, 2500); // precisa ser em sequência (<2,5s entre cliques)
        if (cliques >= 7) {
            cliques = 0;
            dispararSegredo();
        }
    });
});

// TOASTY!! (Mortal Kombat): digitar um código famoso, fora de campos de texto, faz o personagem surgir no canto
const CODIGOS_TOASTY = ['abacabb', 'toasty']; // "ABACABB" = código do sangue no Mega Drive
let teclasDigitadas = '';
let toastyOcupado = false;

// Som: se existir toasty.mp3 na raiz do site ele toca; senão o navegador "fala" TOASTY com voz grave (sem arquivo)
function falarToasty() {
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return;
    const fala = new SpeechSynthesisUtterance('Toasty!');
    fala.lang = 'en-US';
    fala.pitch = 0.1;
    fala.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(fala);
}

function tocarToasty() {
    try {
        const som = new Audio('toasty.mp3');
        som.addEventListener('error', falarToasty, { once: true });
        const p = som.play();
        if (p && p.catch) p.catch(() => {});
    } catch (e) { falarToasty(); }
}

function mostrarToasty() {
    if (toastyOcupado) return;
    toastyOcupado = true;
    const img = document.createElement('img');
    img.src = 'toasty.png';
    img.alt = 'Toasty!';
    img.className = 'toasty';
    img.setAttribute('aria-hidden', 'true');
    document.body.appendChild(img);
    tocarToasty();
    requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add('toasty-in')));
    setTimeout(() => img.classList.remove('toasty-in'), 1600);
    setTimeout(() => { img.remove(); toastyOcupado = false; }, 2300);
}

document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    const alvo = e.target;
    if (alvo && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName))) return;
    teclasDigitadas = (teclasDigitadas + e.key.toLowerCase()).slice(-12);
    if (CODIGOS_TOASTY.some(c => teclasDigitadas.endsWith(c))) {
        teclasDigitadas = '';
        mostrarToasty();
    }
});

// No celular não há teclado: 5 toques seguidos no título da página (<h1>) também chamam o Toasty
document.addEventListener('DOMContentLoaded', () => {
    const titulo = document.querySelector('h1');
    if (!titulo) return;
    let toques = 0, timerToques = null;
    titulo.addEventListener('click', () => {
        toques++;
        clearTimeout(timerToques);
        timerToques = setTimeout(() => { toques = 0; }, 2000);
        if (toques >= 5) { toques = 0; mostrarToasty(); }
    });
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        fecharSalaSecreta();
        fecharSugestao();
        if (typeof fecharAssinatura === 'function') fecharAssinatura();
    }
});
// ==========================================
// FESTA: avisos (toast), confete e mensagens de humor
// ==========================================
// `calculoAutomatico` fica true quando o cálculo roda sozinho (abrir aba, carregar a página):
// confete e avisos só disparam quando a pessoa clica em "Calcular".
let calculoAutomatico = false;

function mostrarToast(texto, opcoes = {}) {
    let area = document.getElementById('toast-area');
    if (!area) {
        area = document.createElement('div');
        area.id = 'toast-area';
        area.className = 'toast-area';
        area.setAttribute('role', 'status');
        area.setAttribute('aria-live', 'polite');
        document.body.appendChild(area);
    }
    const toast = document.createElement('div');
    toast.className = 'toast' + (opcoes.tipo === 'humor' ? ' toast-humor' : '');
    toast.textContent = texto; // textContent: nunca interpreta HTML
    area.appendChild(toast);
    setTimeout(() => toast.remove(), opcoes.duracao || 4500);
}

let confeteAtivo = false;

function lancarConfete(duracaoMs = 3800) {
    if (confeteAtivo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    confeteAtivo = true;

    const canvas = document.createElement('canvas');
    canvas.className = 'confete-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cores = ['#8FA3FB', '#818CF8', '#FBBF24', '#F472B6', '#34D399', '#F87171'];
    const pecas = Array.from({ length: 170 }, () => ({
        x: Math.random() * W, y: -20 - Math.random() * H * 0.5,
        vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 4,
        larg: 6 + Math.random() * 6, alt: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2, vrot: (Math.random() - 0.5) * 0.3,
        cor: cores[(Math.random() * cores.length) | 0]
    }));

    const inicio = performance.now();
    (function quadro(agora) {
        const decorrido = agora - inicio;
        ctx.clearRect(0, 0, W, H);
        const opacidade = decorrido > duracaoMs - 800 ? Math.max(0, (duracaoMs - decorrido) / 800) : 1;
        ctx.globalAlpha = opacidade;
        for (const p of pecas) {
            p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.vx *= 0.995; p.rot += p.vrot;
            ctx.save();
            ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillStyle = p.cor;
            ctx.fillRect(-p.larg / 2, -p.alt / 2, p.larg, p.alt);
            ctx.restore();
        }
        if (decorrido < duracaoMs) {
            requestAnimationFrame(quadro);
        } else {
            canvas.remove();
            confeteAtivo = false;
        }
    })(inicio);
}

function celebrar(mensagem) {
    lancarConfete();
    mostrarToast(mensagem, { duracao: 5000 });
}

function avisarExagero(mensagem) {
    mostrarToast(mensagem, { tipo: 'humor', duracao: 6000 });
}
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
            'glow-fuchsia', 'glow-lime', 'glow-green', 'glow-orange', 'glow-red', 'glow-unica',
            'bg-emerald-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500',
            'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-violet-500', 'bg-teal-500',
            'bg-fuchsia-500', 'bg-lime-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500',
            'text-gray-950', 'font-bold');
    });

    // Mostra o conteúdo ativo (se essa ferramenta é de outra página, navega até ela)
    const secao = document.getElementById(`tab-${tabId}`);
    if (!secao) {
        location.href = paginaDaAba(tabId);
        return;
    }
    secao.classList.remove('hidden');

    // Aplica estilo ativo à aba selecionada com a cor correta + glow + borda vibrante
    let abaInfo = abas.find(a => a.id === tabId);
    let activeBtn = document.getElementById(`btn-${tabId}`);
    if (activeBtn && abaInfo) {
        activeBtn.classList.add('bg-emerald-500', 'text-gray-950', 'font-bold', 'glow-unica');
    }

    calculoAutomatico = true;
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
    if (tabId === 'salario-liquido') calculateSalarioLiquido();
    if (tabId === 'investimentos') { preencherIndicadoresInvestimentos(); calculateInvestimentos(); }
    if (tabId === 'senha' && !senhaJaGerada) gerarSenha();
    if (tabId === 'porcentagem') calcularPorcentagens();
    if (tabId === 'unidades') { iniciarUnidades(); converterUnidade(); }
    calculoAutomatico = false;
}

// 🌐 Buscar Indicadores em Tempo Real 

function updateFooterAndCounter() {
    const yearEl = document.getElementById('footer-year');
    if (yearEl) {
        yearEl.innerText = new Date().getFullYear();
    }
}

// ==================== 1. GERADOR DE QR CODE ====================


// UTILITÁRIOS E IMAGENS
// ==========================================

// Nomes de arquivo (usados por conversores, editor de PDF, imagens...)
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function getBaseFileName(filename) {
    return filename.replace(/\.[^/.]+$/, '');
}

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

// ==========================================
// CAIXA DE SUGESTÕES (Web3Forms: a sugestão chega por e-mail; nenhum dado fica guardado no site)
// ==========================================
// A chave pública do Web3Forms fica em _fonte/paginas.json ("sugestoes.accessKey") e o build a coloca numa <meta>.
// Sem chave configurada, o formulário avisa que ainda não está ativo. Proteções: campo-isca (honeypot),
// limite de 1 envio por minuto por navegador e tamanho máximo do texto. O aviso de privacidade está no próprio formulário.
const SUGESTAO_INTERVALO_MS = 60000;
const SUGESTAO_CHAVE_TS = 'excalc_sugestao_ts';

function chaveDeSugestoes() {
    const meta = document.querySelector('meta[name="sugestoes-key"]');
    return meta ? (meta.getAttribute('content') || '').trim() : '';
}

function abrirSugestao() {
    const modal = document.getElementById('sugestao-modal');
    if (!modal) return;
    document.getElementById('sugestao-status').textContent = '';
    modal.classList.remove('hidden');
    document.getElementById('sugestao-mensagem').focus();
}

function fecharSugestao() {
    const modal = document.getElementById('sugestao-modal');
    if (modal) modal.classList.add('hidden');
}

function statusSugestao(texto, erro) {
    const el = document.getElementById('sugestao-status');
    el.textContent = texto;
    el.className = 'mt-2 text-xs min-h-[1rem] ' + (erro ? 'text-red-400' : 'text-emerald-400');
}

async function enviarSugestao(evento) {
    evento.preventDefault();
    const botao = document.getElementById('sugestao-enviar');
    const nome = document.getElementById('sugestao-nome').value.trim().slice(0, 80);
    const email = document.getElementById('sugestao-email').value.trim().slice(0, 120);
    const mensagem = document.getElementById('sugestao-mensagem').value.trim().slice(0, 1500);

    if (document.getElementById('sugestao-botcheck').checked) { fecharSugestao(); return; } // robô: finge que deu certo
    if (mensagem.length < 5) { statusSugestao('Escreva ao menos algumas palavras na sugestão.', true); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { statusSugestao('Esse e-mail parece inválido. Corrija ou deixe em branco.', true); return; }

    const chave = chaveDeSugestoes();
    if (!chave) { statusSugestao('O envio de sugestões ainda não foi ativado neste site.', true); return; }

    try {
        const ultimo = Number(localStorage.getItem(SUGESTAO_CHAVE_TS)) || 0;
        if (Date.now() - ultimo < SUGESTAO_INTERVALO_MS) { statusSugestao('Aguarde um minutinho antes de enviar outra sugestão.', true); return; }
    } catch (e) { /* sem localStorage: segue */ }

    botao.disabled = true;
    statusSugestao('Enviando...', false);
    try {
        const resposta = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                access_key: chave,
                subject: 'Sugestão do site ExCalc',
                from_name: 'ExCalc',
                name: nome,
                email: email,
                message: mensagem,
                pagina: location.href,
                botcheck: ''
            })
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok || dados.success === false) throw new Error(dados.message || ('HTTP ' + resposta.status));
        try { localStorage.setItem(SUGESTAO_CHAVE_TS, String(Date.now())); } catch (e) { /* tudo bem */ }
        document.getElementById('sugestao-form').reset();
        fecharSugestao();
        mostrarToast('💬 Sugestão enviada. Obrigado!', { duracao: 4000 });
    } catch (erro) {
        console.warn('Falha ao enviar sugestão:', erro && erro.message);
        statusSugestao('Não foi possível enviar agora. Tente de novo em instantes.', true);
    } finally {
        botao.disabled = false;
    }
}
// ==========================================
// MODO VIAGEM (carregamento sob demanda) e INICIALIZAÇÃO DA PÁGINA
// ==========================================
// O botão flutuante chama abrirViagem(); na primeira vez baixa js/viagem.js, que assume o nome
// window.abrirViagem / window.fecharViagem e abre os efeitos. Assim as demais páginas ficam mais leves.
const abrirViagemInicial = function () {
    carregarLib('viagem')
        .then(() => { if (window.abrirViagem !== abrirViagemInicial) window.abrirViagem(); })
        .catch(() => mostrarToast('Não foi possível carregar o Modo Viagem. Verifique a conexão.', { tipo: 'humor' }));
};
window.abrirViagem = abrirViagemInicial;
window.fecharViagem = function () { /* nada aberto ainda */ };

document.addEventListener('DOMContentLoaded', function () {
    renderMenuTabs();

    // Aplica a máscara de moeda a todos os inputs monetários
    document.querySelectorAll('.input-moeda').forEach(input => {
        if (input.value) {
            let num = input.value.replace(/\D/g, '');
            if (num) input.value = Number(num).toLocaleString('pt-BR');
        }
        input.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (!value) {
                e.target.value = '';
                return;
            }
            e.target.value = Number(value).toLocaleString('pt-BR');
        });
    });

    // Cada página tem uma única ferramenta (<body data-aba="...">): mostra, destaca no menu e faz o 1º cálculo
    calculoAutomatico = true;
    switchTab(document.body.dataset.aba || 'home');
    aplicarLinkCompartilhado();
    calculoAutomatico = false;

    // Só a página Início mostra os cartões de indicadores (o Comparador busca os seus por conta própria)
    if (typeof fetchMarketIndicators === 'function' && document.getElementById('indicadores-data')) fetchMarketIndicators();
    updateFooterAndCounter();
});