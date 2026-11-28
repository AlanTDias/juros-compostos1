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
    { id: 'conversores', nome: 'Ferramentas de PDF', color: 'green', pagina: 'conversor-de-arquivos.html' },
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
    return !aba || aba.pagina === 'index.html' ? './' : aba.pagina;
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

// Grupos do menu lateral e do drawer (só a ORDEM/rótulos; nomes e páginas vêm do array abas).
// Aba que não estiver em nenhum grupo cai em "Outras" no fim, para nunca sumir do menu.
const GRUPOS_MENU = [
    { titulo: '', ids: ['home'] },
    { titulo: 'Calculadoras financeiras', ids: ['juros-compostos', 'reserva', 'milhao', 'financiamento', 'veiculos', 'amortizacao', 'alugar-comprar', 'comparador', 'investimentos'] },
    { titulo: 'Trabalho', ids: ['salario-liquido', 'fgts', 'rescisao-clt'] },
    { titulo: 'Documentos e arquivos', ids: ['documentos', 'conversores', 'imagens', 'qrcode'] },
    { titulo: 'Utilitários', ids: ['senha', 'porcentagem', 'unidades'] }
];

function gruposDoMenu() {
    const usados = new Set(GRUPOS_MENU.flatMap(g => g.ids));
    const grupos = GRUPOS_MENU.map(g => ({ titulo: g.titulo, abas: g.ids.map(id => abas.find(a => a.id === id)).filter(Boolean) }));
    const resto = abas.filter(a => !usados.has(a.id));
    if (resto.length) grupos.push({ titulo: 'Outras', abas: resto });
    return grupos.filter(g => g.abas.length);
}

// Classes-base dos botões de aba; usadas também em switchTab().
// modo: 'drawer' (menu do celular, linhas altas) ou 'lateral' (menu lateral do desktop, linhas compactas).
function classeBaseAba(cor, modo) {
    return modo === 'lateral'
        ? `tab-btn tab-${cor} px-3 py-2 rounded-lg w-full text-left flex items-center gap-2.5 text-[13px] transition-all duration-200`
        : `tab-btn tab-${cor} p-3 rounded-lg w-full text-left flex items-center gap-2 transition-all duration-200`;
}

// Modo de um botão de aba conforme o menu em que ele está
function modoDoBotaoAba(el) {
    return el.closest('#lateral-nav') ? 'lateral' : 'drawer';
}

// Renderizar abas dinamicamente (menu lateral do desktop + drawer do celular), agrupadas por GRUPOS_MENU
function renderMenuTabs() {
    const lateralNav = document.getElementById('lateral-nav');
    const drawerNav = document.getElementById('drawer-nav');
    const grupos = gruposDoMenu();

    const montar = (prefixo, modo, px) => grupos.map(g => `
        <div class="menu-grupo">
            ${g.titulo ? `<p class="menu-grupo-titulo">${g.titulo}</p>` : ''}
            ${g.abas.map(aba => `
            <a href="${paginaDaAba(aba.id)}" id="${prefixo}${aba.id}"
                class="${classeBaseAba(COR_UNICA_ABAS, modo)}"
                title="${aba.nome}">
                ${iconeAba(aba.id, px)}
                <span class="font-semibold">${aba.nome}</span>
            </a>`).join('')}
        </div>
    `).join('');

    if (lateralNav) lateralNav.innerHTML = montar('btn-', 'lateral', 16);
    if (drawerNav) drawerNav.innerHTML = `<button onclick="closeMobileMenu()" class="self-end text-gray-400 hover:text-gray-100 text-2xl leading-none mb-2" aria-label="Fechar menu">✕</button>` + montar('btn-drawer-', 'drawer', 18);
}

function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    drawer.classList.toggle('hidden');
}

function closeMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    drawer.classList.add('hidden');
}

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
        if (pontos > 1 || /^-?\d{1,3}\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
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

// TEMA CLARO / ESCURO
// ==========================================
// O tema é o atributo data-tema no <html>; as cores vêm das variáveis do style.css.
// Claro/escuro ficam salvos no localStorage. (O tema "vidro" foi removido em 2026-10 a pedido do dono.)
const TEMA_KEY = 'excalc_tema';

function temaAtual() {
    return document.documentElement.getAttribute('data-tema') || 'escuro';
}

function aplicarTema(tema, salvar) {
    const raiz = document.documentElement;
    if (tema === 'escuro') raiz.removeAttribute('data-tema');
    else raiz.setAttribute('data-tema', tema);

    if (salvar) {
        try { localStorage.setItem(TEMA_KEY, tema === 'claro' ? 'claro' : 'escuro'); } catch (e) { /* modo privado: tudo bem */ }
    }
    atualizarBotaoDeTema();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', corDoNavegadorPorTema(tema));
    if (typeof atualizarCoresDoFundo === 'function') atualizarCoresDoFundo();

    // o gráfico depende do tema: refaz
    if (typeof calculateJC === 'function' && document.getElementById('growthChart')) {
        const antes = calculoAutomatico;
        calculoAutomatico = true;
        calculateJC();
        calculoAutomatico = antes;
    }
}

// Ciclo dos temas: escuro -> claro -> escuro
const TEMAS_CICLO = ['escuro', 'claro'];

function proximoTema() {
    const i = TEMAS_CICLO.indexOf(temaAtual());
    return TEMAS_CICLO[(i + 1) % TEMAS_CICLO.length];
}

function alternarTema() {
    aplicarTema(proximoTema(), true);
}

function corDoNavegadorPorTema(tema) {
    if (tema === 'claro') return '#F3F5FB';
    return '#05070D';
}

// Seletor de tema em "vidro líquido" (3 opções): marca a opção certa e move a peça de vidro até ela.
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

// Sem o Chart.js (arquivo não carregou), esconde o canvas e avisa no lugar, em vez de quebrar o cálculo
function semGrafico(canvas) {
    if (typeof Chart !== 'undefined') return false;
    if (canvas && !canvas.dataset.semGrafico) {
        canvas.dataset.semGrafico = '1';
        canvas.style.display = 'none';
        const aviso = document.createElement('p');
        aviso.className = 'text-sm text-gray-400 text-center py-8';
        aviso.textContent = 'Gráfico indisponível no momento.';
        canvas.parentNode.appendChild(aviso);
    }
    return true;
}

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
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
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

    const cores = ['#22D3EE', '#818CF8', '#FBBF24', '#F472B6', '#34D399', '#F87171'];
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
        el.className = classeBaseAba(colorClass.replace('tab-', ''), modoDoBotaoAba(el));
        el.removeAttribute('aria-current');
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
    if (abaInfo) {
        [`btn-${tabId}`, `btn-drawer-${tabId}`].forEach(idBtn => {
            const activeBtn = document.getElementById(idBtn);
            if (!activeBtn) return;
            activeBtn.classList.add('bg-emerald-500', 'text-gray-950', 'font-bold', 'glow-unica');
            activeBtn.setAttribute('aria-current', 'page');
        });
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

// Alíquota de IR regressivo da renda fixa, pelo prazo em dias (usada pelo Comparador de Investimentos e pelo
// painel comparativo da Início, em indicadores.js)
function aliquotaIRRegressivo(dias) {
    if (dias <= 180) return 0.225;
    if (dias <= 360) return 0.20;
    if (dias <= 720) return 0.175;
    return 0.15;
}

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
// INICIALIZAÇÃO DA PÁGINA
// ==========================================

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

// ==========================================
// TEMA TECH (out/2026): fundo de partículas (#fundo-rede) + entrada escalonada (.anim/.ativo)
// ==========================================
// Visual aprovado na maquete "Benefícios RH" do dono. Não toca em cálculo/função nenhuma; só desenho.
// Exposto fora da IIFE: só atualizarCoresDoFundo (chamado por aplicarTema ao trocar de tema).
(function () {
    const canvas = document.getElementById('fundo-rede');
    const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    const semBlur = () => document.documentElement.classList.contains('sem-blur');

    let pontos = [];
    let largura = 0, altura = 0, dpr = 1;
    let larguraCssAnterior = -1;
    let corPonto = 'rgba(56,189,248,.55)', corLinhaBase = '99 102 241';
    let rodando = false;
    let resizeTimer = null;

    function lerCores() {
        const estilo = getComputedStyle(document.documentElement);
        corPonto = (estilo.getPropertyValue('--rede-ponto') || corPonto).trim();
        corLinhaBase = (estilo.getPropertyValue('--rede-linha') || corLinhaBase).trim();
    }

    // Exposta globalmente: aplicarTema() chama isso ao trocar de tema (relê as cores do CSS, já cacheadas aqui).
    window.atualizarCoresDoFundo = function () {
        if (!canvas) return;
        lerCores();
    };

    if (!canvas) return; // página sem o fundo (não deveria acontecer, mas protege)

    function pausado() {
        if (document.hidden) return true;
        return false;
    }

    function redimensiona() {
        dpr = Math.min(devicePixelRatio || 1, 2);
        const larguraMudou = innerWidth !== larguraCssAnterior;
        larguraCssAnterior = innerWidth;
        largura = canvas.width = Math.round(innerWidth * dpr);
        altura = canvas.height = Math.round(innerHeight * dpr);
        canvas.style.width = innerWidth + 'px';
        canvas.style.height = innerHeight + 'px';
        if (larguraMudou || !pontos.length) {
            // largura mudou (ou 1ª vez): sorteia as partículas de novo
            const qtd = Math.min(90, Math.round((innerWidth * innerHeight) / 22000));
            pontos = Array.from({ length: qtd }, () => ({
                x: Math.random() * largura, y: Math.random() * altura,
                vx: (Math.random() - 0.5) * 0.3 * dpr, vy: (Math.random() - 0.5) * 0.3 * dpr
            }));
        } else {
            // só a altura mudou (barra de endereço do celular aparecendo/sumindo): mantém as
            // partículas existentes, só limita à nova área para não ficarem fora do canvas
            for (let i = 0; i < pontos.length; i++) {
                const p = pontos[i];
                if (p.x > largura) p.x = largura;
                if (p.y > altura) p.y = altura;
            }
        }
    }

    function desenhaQuadro() {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, largura, altura);
        const lim = 130 * dpr;
        for (let i = 0; i < pontos.length; i++) {
            const a = pontos[i];
            ctx.fillStyle = corPonto;
            ctx.beginPath(); ctx.arc(a.x, a.y, 1.5 * dpr, 0, Math.PI * 2); ctx.fill();
            for (let j = i + 1; j < pontos.length; j++) {
                const b = pontos[j], d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < lim) {
                    ctx.strokeStyle = 'rgb(' + corLinhaBase + ' / ' + ((1 - d / lim) * 0.25).toFixed(3) + ')';
                    ctx.lineWidth = dpr;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                }
            }
        }
    }

    function laco() {
        if (!rodando) return;
        if (!pausado()) {
            if (!calmo()) {
                for (let i = 0; i < pontos.length; i++) {
                    const p = pontos[i];
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < 0 || p.x > largura) p.vx *= -1;
                    if (p.y < 0 || p.y > altura) p.vy *= -1;
                }
            }
            desenhaQuadro();
        }
        if (calmo()) return; // 1 quadro estático: não agenda o próximo
        requestAnimationFrame(laco);
    }

    function iniciar() {
        if (semBlur()) return; // aparelho fraco/economia de dados: canvas desligado
        lerCores();
        redimensiona();
        desenhaQuadro();
        if (!calmo()) {
            rodando = true;
            requestAnimationFrame(laco);
        }
    }

    addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { redimensiona(); if (!rodando) desenhaQuadro(); }, 150);
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && rodando && calmo()) desenhaQuadro();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();

// Entrada escalonada (.anim/.ativo): só nos cartões visíveis da página (caixas .shadow-lg). Não toca em
// main, abas (.tab-content) nem nos overlays de tela cheia — só nos próprios cartões internos.
// O .hero-panel da Início fica de fora desse sistema de propósito (dono, 2026-10-11): ele nunca recebia
// .ativo de forma confiável e corria risco de ficar invisível (opacity:0 preso); sem .anim ele sempre
// aparece normal (opacity:1 por padrão em .hero-panel), só sem a animação de entrada escalonada.
document.addEventListener('DOMContentLoaded', function () {
    const raiz = document.documentElement;
    if (!raiz.classList.contains('entrada')) return;
    const conteudo = document.getElementById('conteudo');
    if (!conteudo) return;

    const candidatos = Array.from(conteudo.querySelectorAll('.shadow-lg'))
        .filter(el => el.offsetParent !== null);

    candidatos.forEach((el, i) => {
        el.classList.add('anim');
        if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', String(i % 8));
    });

    if (!candidatos.length) return;

    const limpa = (el) => {
        el.classList.remove('anim');
        el.classList.remove('ativo');
    };

    if (typeof IntersectionObserver === 'function') {
        const obs = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('ativo');
                    obs.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.1 });
        candidatos.forEach(el => obs.observe(el));
    } else {
        candidatos.forEach(el => el.classList.add('ativo'));
    }

    candidatos.forEach(el => {
        el.addEventListener('animationend', () => limpa(el), { once: true });
    });

    // Segurança: se algo impedir a animação de rodar (reduced-motion mudou depois, etc.), libera transform/filter.
    setTimeout(() => candidatos.forEach(limpa), 4500);
});

// ==========================================
// PWA: service worker (só em produção) e convite de instalação no celular
// ==========================================
(function () {
    const PRODUCAO = location.hostname === 'www.excalc.com.br';
    const CHAVE_ADIADO = 'excalc_pwa_adiado';
    const CHAVE_INSTALADO = 'excalc_pwa_instalado';
    const TRINTA_DIAS = 30 * 24 * 60 * 60 * 1000;
    const ler = chave => { try { return localStorage.getItem(chave); } catch (e) { return null; } };
    const gravar = (chave, valor) => { try { localStorage.setItem(chave, valor); } catch (e) { } };

    const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const celular = () => matchMedia('(pointer: coarse)').matches && Math.min(window.innerWidth, screen.width) <= 820;
    const ios = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    function precacheCalculadoras() {
        if (!('serviceWorker' in navigator) || (navigator.connection && navigator.connection.saveData)) return;
        navigator.serviceWorker.ready.then(reg => { if (reg.active) reg.active.postMessage('precache-calculadoras'); });
    }

    if (instalado()) gravar(CHAVE_INSTALADO, '1');

    if (PRODUCAO && 'serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const visitaAnterior = !!navigator.serviceWorker.controller;
            navigator.serviceWorker.register('/sw.js').catch(() => { });
            if (instalado()) precacheCalculadoras();
            else if (visitaAnterior) {
                const ocioso = 'requestIdleCallback' in window ? cb => requestIdleCallback(cb, { timeout: 10000 }) : cb => setTimeout(cb, 1000);
                setTimeout(() => ocioso(precacheCalculadoras), 5000);
            }
        });
    }

    let convite = null;
    let querMostrar = false;
    let banner = null;
    let timerPosicao = null;

    function podeMostrar() {
        if (instalado() || ler(CHAVE_INSTALADO) === '1' || !celular()) return false;
        return Date.now() - (Number(ler(CHAVE_ADIADO)) || 0) > TRINTA_DIAS;
    }

    function anuncioFixoEmbaixo() {
        const anuncio = document.querySelector('ins.adsbygoogle[data-anchor-status="displayed"], ins.adsbygoogle[data-anchor-shown="true"]');
        if (!anuncio) return 0;
        const r = anuncio.getBoundingClientRect();
        return r.height > 0 && r.top > window.innerHeight / 2 ? Math.ceil(window.innerHeight - r.top) : 0;
    }

    function posicionar() {
        if (!banner) return;
        const folga = anuncioFixoEmbaixo();
        banner.style.bottom = folga ? `calc(${folga + 12}px + env(safe-area-inset-bottom))` : '';
        document.body.style.paddingBottom = (banner.offsetHeight + folga + 24) + 'px';
    }

    function fechar() {
        if (!banner) return;
        banner.remove();
        banner = null;
        clearInterval(timerPosicao);
        window.removeEventListener('resize', posicionar);
        document.body.style.paddingBottom = '';
    }

    function adiar() {
        gravar(CHAVE_ADIADO, String(Date.now()));
        fechar();
    }

    function botao(texto, classe, acao) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = classe;
        b.textContent = texto;
        b.addEventListener('click', acao);
        return b;
    }

    function mostrar() {
        if (banner || !podeMostrar()) return;
        const modoIos = !convite && ios();
        if (!convite && !modoIos) return;

        banner = document.createElement('div');
        banner.className = 'pwa-convite';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Instalar o ExCalc');

        const icone = document.createElement('img');
        icone.src = 'icones/icone-192.png';
        icone.alt = '';
        icone.width = 40;
        icone.height = 40;

        const texto = document.createElement('p');
        texto.className = 'pwa-texto';
        texto.textContent = modoIos
            ? 'Instale o ExCalc: toque em Compartilhar e depois em Adicionar à Tela de Início.'
            : 'Instale o ExCalc: abre mais rápido e funciona sem internet.';

        const fecharBtn = botao('×', 'pwa-fechar', adiar);
        fecharBtn.setAttribute('aria-label', 'Fechar o convite de instalação');

        const acoes = document.createElement('div');
        acoes.className = 'pwa-acoes';
        acoes.appendChild(botao('Agora não', 'pwa-adiar', adiar));
        if (!modoIos) {
            acoes.appendChild(botao('Instalar', 'pwa-instalar', () => {
                const pedido = convite;
                convite = null;
                fechar();
                if (!pedido) return;
                pedido.prompt();
                pedido.userChoice.then(escolha => {
                    if (escolha.outcome === 'accepted') gravar(CHAVE_INSTALADO, '1');
                    else gravar(CHAVE_ADIADO, String(Date.now()));
                }).catch(() => { });
            }));
        }

        banner.append(icone, texto, fecharBtn, acoes);
        document.body.appendChild(banner);
        posicionar();
        window.addEventListener('resize', posicionar);
        timerPosicao = setInterval(posicionar, 1500);
    }

    function gatilho() {
        if (querMostrar) return;
        querMostrar = true;
        document.removeEventListener('input', aoUsar, true);
        document.removeEventListener('click', aoUsar, true);
        mostrar();
    }

    function aoUsar(e) {
        if (!e.isTrusted || !e.target.closest) return;
        if (e.type === 'input' ? e.target.closest('#conteudo') : e.target.closest('#conteudo button')) gatilho();
    }

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        convite = e;
        if (querMostrar) mostrar();
    });

    window.addEventListener('appinstalled', () => {
        gravar(CHAVE_INSTALADO, '1');
        convite = null;
        fechar();
        precacheCalculadoras();
    });

    if (!instalado() && ler(CHAVE_INSTALADO) !== '1') {
        document.addEventListener('input', aoUsar, true);
        document.addEventListener('click', aoUsar, true);
        setTimeout(gatilho, 30000);
    }
})();
