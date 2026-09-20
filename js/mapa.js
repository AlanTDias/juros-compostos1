// MAPA DE SISTEMAS (easter egg do ícone do rodapé): mapa mental livre para desenhar como departamentos e sistemas se
// conectam. Caixas com texto de várias linhas (edição direto na caixa) e departamento (pontinho colorido), ligações entre
// quaisquer caixas, desfazer/refazer e exportar/importar em arquivo .json. NADA é enviado nem guardado no navegador: o mapa só
// existe na página aberta e no arquivo exportado.
// Tudo dentro de uma IIFE; só abrirMapa() e fecharMapa() ficam globais (usadas pelo core.js).
(function () {
    const overlay = document.getElementById('mapa');
    const svg = document.getElementById('mapa-svg');
    if (!overlay || !svg) return;

    const NS = 'http://www.w3.org/2000/svg';
    const LARGURA = 190;
    const MAX_NOS = 2000, MAX_LIGACOES = 6000, MAX_DEPS = 50;
    const MAX_TITULO = 400, MAX_LINHAS = 6, COLUNAS = 22;
    const MAX_ARQUIVO = 5 * 1024 * 1024;
    const PALETA = ['#F59E0B', '#8FA3FB', '#34D399', '#F472B6', '#22D3EE', '#A78BFA', '#FB7185', '#FBBF24'];
    const COR_SEM_DEP = '#7F8CB0';
    const $ = id => document.getElementById(id);
    const aviso = texto => { if (typeof mostrarToast === 'function') mostrarToast(texto); };

    const gRaiz = $('mapa-raiz'), gLig = $('mapa-ligacoes'), gNos = $('mapa-caixas'), gTemp = $('mapa-temp');
    const listaDeps = $('mapa-deps'), popDeps = $('mapa-deps-pop'), dica = $('mapa-dica');
    const campoTituloMapa = $('mapa-titulo');
    const selDep = $('mapa-sel-dep'), btnExcluir = overlay.querySelector('[data-mapa-acao="excluir"]');
    const btnInverter = overlay.querySelector('[data-mapa-acao="inverter"]');
    const editor = $('mapa-editor');
    const entradaArquivo = $('mapa-arquivo');

    // ---------- Estado ----------
    let estado = mapaExemplo();
    let sel = null;                       // { tipo: 'no' | 'lig', id }
    const vista = { x: 0, y: 0, k: 1 };
    let sujo = false;                     // há alterações que ainda não foram salvas em arquivo
    let aberto = false, jaAjustou = false;
    let modoLigar = false, origemLigar = null;
    let desfazerPilha = [], refazerPilha = [];
    let campoAtivo = null;                // agrupa a digitação de um campo em UM passo de desfazer
    let pendente = false;
    let editando = null;                  // { tipo, id, antes, multi } enquanto o editor de texto está aberto
    let temaMapa = document.documentElement.getAttribute('data-tema') === 'claro' ? 'claro' : 'escuro';
    overlay.setAttribute('data-tema-mapa', temaMapa);

    // ---------- Modelo ----------
    function mapaExemplo() {
        return {
            titulo: 'Sistema integrado (exemplo)',
            departamentos: [
                { id: 'd1', nome: 'Comercial', cor: '#F59E0B' },
                { id: 'd2', nome: 'Financeiro', cor: '#8FA3FB' },
                { id: 'd3', nome: 'TI', cor: '#34D399' },
                { id: 'd4', nome: 'Operações', cor: '#F472B6' },
                { id: 'd5', nome: 'RH', cor: '#22D3EE' }
            ],
            nos: [
                { id: 'n1', x: -95, y: -30, titulo: 'Sistema integrado\n(objetivo, usuários, regras)', dep: '', nota: '' },
                { id: 'n2', x: -420, y: -190, titulo: 'Pedidos e propostas', dep: 'd1', nota: '' },
                { id: 'n3', x: 230, y: -190, titulo: 'Faturamento e cobrança', dep: 'd2', nota: '' },
                { id: 'n4', x: -420, y: 130, titulo: 'Estoque e logística', dep: 'd4', nota: '' },
                { id: 'n5', x: 230, y: 130, titulo: 'Folha e acessos', dep: 'd5', nota: '' },
                { id: 'n6', x: -95, y: 230, titulo: 'API e banco de dados', dep: 'd3', nota: '' }
            ],
            ligacoes: [
                { id: 'l1', de: 'n1', para: 'n2', rotulo: 'cadastro de clientes' },
                { id: 'l2', de: 'n1', para: 'n3', rotulo: '' },
                { id: 'l3', de: 'n1', para: 'n4', rotulo: '' },
                { id: 'l4', de: 'n1', para: 'n5', rotulo: '' },
                { id: 'l5', de: 'n1', para: 'n6', rotulo: '' },
                { id: 'l6', de: 'n2', para: 'n3', rotulo: 'gera fatura' },
                { id: 'l7', de: 'n4', para: 'n3', rotulo: 'custos' },
                { id: 'l8', de: 'n5', para: 'n6', rotulo: 'permissões' }
            ]
        };
    }

    function mapaNovo() {
        const e = mapaExemplo();
        e.titulo = '';
        e.nos = [{ id: 'n1', x: -95, y: -30, titulo: 'Ideia central', dep: '', nota: '' }];
        e.ligacoes = [];
        return e;
    }

    function gerarId(prefixo, lista) {
        let n = lista.length + 1;
        while (lista.some(x => x.id === prefixo + n)) n++;
        return prefixo + n;
    }

    const departamento = id => estado.departamentos.find(d => d.id === id) || null;
    const corDoDep = id => { const d = id ? departamento(id) : null; return d ? d.cor : COR_SEM_DEP; };
    const no = id => estado.nos.find(n => n.id === id) || null;
    const ligacao = id => estado.ligacoes.find(l => l.id === id) || null;
    const noSel = () => (sel && sel.tipo === 'no' ? no(sel.id) : null);
    const ligSel = () => (sel && sel.tipo === 'lig' ? ligacao(sel.id) : null);

    // ---------- Texto e geometria ----------
    // O texto da caixa pode ter várias linhas (Enter na edição): cada parágrafo é quebrado por palavras.
    function quebrar(texto, max, maxLinhas) {
        const linhas = [];
        String(texto || '').split('\n').forEach(par => {
            const palavras = par.replace(/[ \t]+/g, ' ').trim().split(' ').filter(Boolean);
            if (!palavras.length) { linhas.push(''); return; }
            let atual = '';
            for (let p of palavras) {
                while (p.length > max) {
                    if (atual) { linhas.push(atual); atual = ''; }
                    linhas.push(p.slice(0, max));
                    p = p.slice(max);
                }
                if (!atual) atual = p;
                else if ((atual + ' ' + p).length <= max) atual += ' ' + p;
                else { linhas.push(atual); atual = p; }
            }
            if (atual) linhas.push(atual);
        });
        while (linhas.length && linhas[linhas.length - 1] === '') linhas.pop();
        if (!linhas.length) return ['(sem título)'];
        if (linhas.length > maxLinhas) {
            linhas.length = maxLinhas;
            linhas[maxLinhas - 1] = linhas[maxLinhas - 1].slice(0, max - 1) + '…';
        }
        return linhas;
    }

    const linhasDoNo = n => quebrar(n.titulo, COLUNAS, MAX_LINHAS);
    const alturaNo = n => 20 + linhasDoNo(n).length * 18 + (n.dep ? 20 : 4);

    function ancoras(a, b) {
        const ha = alturaNo(a), hb = alturaNo(b);
        const ca = { x: a.x + LARGURA / 2, y: a.y + ha / 2 };
        const cb = { x: b.x + LARGURA / 2, y: b.y + hb / 2 };
        const dx = cb.x - ca.x, dy = cb.y - ca.y;
        let p0, p1, d0, d1;
        if (Math.abs(dx) / LARGURA >= Math.abs(dy) / ((ha + hb) / 2)) {
            if (dx >= 0) { p0 = { x: a.x + LARGURA, y: ca.y }; d0 = { x: 1, y: 0 }; p1 = { x: b.x, y: cb.y }; d1 = { x: -1, y: 0 }; }
            else { p0 = { x: a.x, y: ca.y }; d0 = { x: -1, y: 0 }; p1 = { x: b.x + LARGURA, y: cb.y }; d1 = { x: 1, y: 0 }; }
        } else if (dy >= 0) {
            p0 = { x: ca.x, y: a.y + ha }; d0 = { x: 0, y: 1 }; p1 = { x: cb.x, y: b.y }; d1 = { x: 0, y: -1 };
        } else {
            p0 = { x: ca.x, y: a.y }; d0 = { x: 0, y: -1 }; p1 = { x: cb.x, y: b.y + hb }; d1 = { x: 0, y: 1 };
        }
        const f = Math.max(40, Math.hypot(p1.x - p0.x, p1.y - p0.y) * 0.4);
        return { p0, p1, c1: { x: p0.x + d0.x * f, y: p0.y + d0.y * f }, c2: { x: p1.x + d1.x * f, y: p1.y + d1.y * f } };
    }

    const meioDaLigacao = g => ({ x: (g.p0.x + 3 * g.c1.x + 3 * g.c2.x + g.p1.x) / 8, y: (g.p0.y + 3 * g.c1.y + 3 * g.c2.y + g.p1.y) / 8 });

    // ---------- Desenho (SVG; todo texto entra por textContent, nunca innerHTML) ----------
    function el(nome, attrs, pai) {
        const e = document.createElementNS(NS, nome);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (pai) pai.appendChild(e);
        return e;
    }

    function desenharLigacao(l) {
        const a = no(l.de), b = no(l.para);
        if (!a || !b) return;
        const g = el('g', { class: 'mapa-lig' + (sel && sel.tipo === 'lig' && sel.id === l.id ? ' sel' : ''), 'data-lig': l.id }, gLig);
        const geo = ancoras(a, b), { p0, p1, c1, c2 } = geo;
        const d = `M${p0.x},${p0.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p1.x},${p1.y}`;
        el('path', { d, class: 'hit' }, g);
        el('path', { d, class: 'linha' }, g);
        const ang = Math.atan2(p1.y - c2.y, p1.x - c2.x), ux = Math.cos(ang), uy = Math.sin(ang);
        const bx = p1.x - ux * 11, by = p1.y - uy * 11;
        el('polygon', { class: 'seta', points: `${p1.x},${p1.y} ${bx - uy * 5},${by + ux * 5} ${bx + uy * 5},${by - ux * 5}` }, g);
        if (l.rotulo) {
            const m = meioDaLigacao(geo);
            el('text', { x: m.x, y: m.y - 6, 'text-anchor': 'middle', class: 'rotulo' }, g).textContent = l.rotulo;
        }
    }

    function desenharNo(n) {
        const linhas = linhasDoNo(n), h = alturaNo(n), cor = corDoDep(n.dep);
        const escolhido = sel && sel.tipo === 'no' && sel.id === n.id;
        const g = el('g', {
            class: 'mapa-no' + (escolhido ? ' sel' : '') + (origemLigar === n.id ? ' origem' : ''),
            'data-no': n.id, transform: `translate(${n.x},${n.y})`
        }, gNos);
        el('rect', { class: 'corpo', width: LARGURA, height: h, rx: 14 }, g);
        linhas.forEach((t, i) => { if (t) el('text', { x: 18, y: 27 + i * 18, class: 'titulo' }, g).textContent = t; });
        if (n.dep) {
            const dep = departamento(n.dep), yDep = 29 + linhas.length * 18;
            el('circle', { class: 'ponto-dep', cx: 21, cy: yDep - 4, r: 4, fill: cor }, g);
            el('text', { x: 31, y: yDep, class: 'dep' }, g).textContent = dep ? dep.nome : '';
        }
        el('circle', { class: 'alca', 'data-alca': n.id, cx: LARGURA, cy: h / 2, r: 8 }, g);
    }

    function desenhar() {
        gLig.replaceChildren();
        gNos.replaceChildren();
        estado.ligacoes.forEach(desenharLigacao);
        estado.nos.forEach(desenharNo);
    }

    function agendar() {
        if (pendente) return;
        pendente = true;
        const f = () => { if (!pendente) return; pendente = false; desenhar(); };
        requestAnimationFrame(f);
        setTimeout(f, 60); // garantia caso o navegador não dispare o quadro (aba em segundo plano)
    }

    function aplicarVista() {
        gRaiz.setAttribute('transform', `translate(${vista.x},${vista.y}) scale(${vista.k})`);
        svg.style.backgroundSize = `${24 * vista.k}px ${24 * vista.k}px`;
        svg.style.backgroundPosition = `${vista.x}px ${vista.y}px`;
    }

    // ---------- Vista: zoom, pan, ajustar ----------
    const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

    function zoomEm(fator, sx, sy) {
        const k = limitar(vista.k * fator, 0.2, 3);
        const wx = (sx - vista.x) / vista.k, wy = (sy - vista.y) / vista.k;
        vista.k = k;
        vista.x = sx - wx * k;
        vista.y = sy - wy * k;
        aplicarVista();
    }

    function ajustar() {
        const r = svg.getBoundingClientRect(), w = Math.max(200, r.width), h = r.height;
        if (!estado.nos.length) { vista.k = 1; vista.x = w / 2; vista.y = h / 2; aplicarVista(); return; }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        estado.nos.forEach(n => {
            minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x + LARGURA);
            minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y + alturaNo(n));
        });
        const pad = w < 500 ? 20 : 70;
        const k = limitar(Math.min((w - 2 * pad) / (maxX - minX), (h - 2 * pad) / (maxY - minY)), 0.2, 1.2);
        vista.k = k;
        vista.x = w / 2 - ((minX + maxX) / 2) * k;
        vista.y = h / 2 - ((minY + maxY) / 2) * k;
        aplicarVista();
    }

    const paraMundo = (cx, cy) => {
        const r = svg.getBoundingClientRect();
        return { x: (cx - r.left - vista.x) / vista.k, y: (cy - r.top - vista.y) / vista.k };
    };

    // ---------- Desfazer / refazer ----------
    function registrarUndo() {
        desfazerPilha.push(JSON.stringify(estado));
        if (desfazerPilha.length > 100) desfazerPilha.shift();
        refazerPilha = [];
        sujo = true;
        atualizarBotoes();
    }

    function coalescer(campo) {
        if (campoAtivo !== campo) { registrarUndo(); campoAtivo = campo; }
    }

    function restaurar(json) {
        cancelarEditor();
        estado = JSON.parse(json);
        if (sel && !(sel.tipo === 'no' ? no(sel.id) : ligSel())) sel = null;
        if (origemLigar && !no(origemLigar)) sairModoLigar();
        sujo = true;
        campoTituloMapa.value = estado.titulo;
        montarDeps();
        atualizarContexto();
        desenhar();
        atualizarBotoes();
    }

    function desfazer() {
        if (!desfazerPilha.length) return;
        refazerPilha.push(JSON.stringify(estado));
        restaurar(desfazerPilha.pop());
    }

    function refazer() {
        if (!refazerPilha.length) return;
        desfazerPilha.push(JSON.stringify(estado));
        restaurar(refazerPilha.pop());
    }

    function atualizarBotoes() {
        overlay.querySelector('[data-mapa-acao="desfazer"]').disabled = !desfazerPilha.length;
        overlay.querySelector('[data-mapa-acao="refazer"]').disabled = !refazerPilha.length;
        overlay.querySelector('[data-mapa-acao="ligar"]').classList.toggle('ativo', modoLigar);
    }

    // ---------- Seleção e controles da barra (departamento, excluir, inverter) ----------
    function selecionar(tipo, id) {
        sel = tipo ? { tipo, id } : null;
        atualizarContexto();
        desenhar();
    }

    function atualizarSelectDep() {
        const atual = selDep.value;
        selDep.replaceChildren();
        const vazio = document.createElement('option');
        vazio.value = '';
        vazio.textContent = 'Departamento';
        selDep.appendChild(vazio);
        estado.departamentos.forEach(d => {
            const o = document.createElement('option');
            o.value = d.id;
            o.textContent = d.nome || '(sem nome)';
            selDep.appendChild(o);
        });
        selDep.value = atual;
    }

    function atualizarContexto() {
        const n = noSel(), l = ligSel();
        atualizarSelectDep();
        selDep.disabled = !n;
        selDep.value = n ? (n.dep || '') : '';
        btnExcluir.disabled = !(n || l);
        btnInverter.hidden = !l;
    }

    function montarDeps() {
        listaDeps.replaceChildren();
        estado.departamentos.forEach(d => {
            const linha = document.createElement('div');
            linha.className = 'mapa-dep';
            const cor = document.createElement('input');
            cor.type = 'color';
            cor.value = d.cor.toLowerCase();
            cor.setAttribute('aria-label', 'Cor do departamento');
            const nome = document.createElement('input');
            nome.type = 'text';
            nome.maxLength = 40;
            nome.value = d.nome;
            nome.setAttribute('aria-label', 'Nome do departamento');
            const rem = document.createElement('button');
            rem.type = 'button';
            rem.className = 'mapa-btn mapa-mini';
            rem.textContent = '✕';
            rem.setAttribute('aria-label', 'Remover departamento');
            cor.addEventListener('input', () => { coalescer(cor); d.cor = cor.value.toUpperCase(); agendar(); });
            nome.addEventListener('input', () => { coalescer(nome); d.nome = nome.value.slice(0, 40); atualizarSelectDep(); const n = noSel(); if (n) selDep.value = n.dep || ''; agendar(); });
            rem.addEventListener('click', () => {
                registrarUndo();
                estado.departamentos = estado.departamentos.filter(x => x !== d);
                estado.nos.forEach(n => { if (n.dep === d.id) n.dep = ''; });
                montarDeps();
                atualizarContexto();
                desenhar();
            });
            linha.append(cor, nome, rem);
            listaDeps.appendChild(linha);
        });
    }

    // ---------- Editor de texto direto na caixa (Enter pula linha; Ctrl+Enter, clique fora ou Esc fecham) ----------
    function abrirEditor(tipo, id) {
        fecharEditor(true);
        let x, y, w, h, valor, multi;
        if (tipo === 'no') {
            const n = no(id);
            if (!n) return;
            x = n.x; y = n.y; w = LARGURA; h = alturaNo(n); valor = n.titulo; multi = true;
        } else {
            const l = ligacao(id), a = l ? no(l.de) : null, b = l ? no(l.para) : null;
            if (!a || !b) return;
            const m = meioDaLigacao(ancoras(a, b));
            w = 170; h = 28; x = m.x - w / 2; y = m.y - h / 2 - 6; valor = l.rotulo; multi = false;
        }
        const k = vista.k;
        editor.hidden = false;
        editor.dataset.multi = multi ? '1' : '';
        editor.style.left = (x * k + vista.x) + 'px';
        editor.style.top = (y * k + vista.y) + 'px';
        editor.style.width = (w * k) + 'px';
        editor.style.height = (h * k) + 'px';
        editor.style.fontSize = (14 * k) + 'px';
        editor.style.lineHeight = (18 * k) + 'px';
        editor.style.borderRadius = ((multi ? 14 : 8) * k) + 'px';
        editor.style.padding = multi ? `${11 * k}px ${14 * k}px` : `${4 * k}px ${8 * k}px`;
        editor.maxLength = multi ? MAX_TITULO : 80;
        editor.placeholder = multi ? 'Escreva aqui (Enter pula linha)' : 'Rótulo da ligação';
        editor.value = valor;
        editando = { tipo, id, antes: valor, multi, altura: h * k };
        editor.focus();
        editor.select();
    }

    function ajustarAlturaEditor() {
        if (!editando || !editando.multi) return;
        editor.style.height = 'auto';
        editor.style.height = Math.max(editando.altura, editor.scrollHeight) + 'px';
    }

    function fecharEditor(confirmar) {
        if (!editando) return;
        const e = editando;
        editando = null;
        const novo = editor.value;
        editor.hidden = true;
        if (confirmar && novo !== e.antes) {
            const alvo = e.tipo === 'no' ? no(e.id) : ligacao(e.id);
            if (alvo) {
                registrarUndo();
                if (e.tipo === 'no') alvo.titulo = novo.slice(0, MAX_TITULO);
                else alvo.rotulo = novo.slice(0, 80);
            }
        }
        desenhar();
    }

    const cancelarEditor = () => fecharEditor(false);

    editor.addEventListener('input', ajustarAlturaEditor);
    editor.addEventListener('blur', () => fecharEditor(true));
    editor.addEventListener('keydown', e => {
        e.stopPropagation(); // atalhos do mapa (Delete, N, L, setas...) não valem enquanto se escreve
        if (e.key === 'Escape') { e.preventDefault(); fecharEditor(false); return; }
        if (e.key === 'Enter') {
            if (!editando || !editando.multi || e.ctrlKey || e.metaKey) { e.preventDefault(); fecharEditor(true); }
            // caixa: Enter comum insere uma quebra de linha (comportamento padrão do textarea)
        }
    });

    // ---------- Edição ----------
    function novaCaixa(x, y, aPartirDe) {
        registrarUndo();
        const origem = aPartirDe ? no(aPartirDe) : null;
        const n = {
            id: gerarId('n', estado.nos), x: Math.round(x - LARGURA / 2), y: Math.round(y - 30),
            titulo: 'Nova caixa', dep: origem ? origem.dep : '', nota: ''
        };
        if (origem) { n.x = Math.round(origem.x + LARGURA + 70); n.y = Math.round(origem.y + (estado.ligacoes.filter(l => l.de === origem.id).length % 4) * 70 - 40); }
        estado.nos.push(n);
        if (origem) estado.ligacoes.push({ id: gerarId('l', estado.ligacoes), de: origem.id, para: n.id, rotulo: '' });
        selecionar('no', n.id);
        // o pequeno atraso evita que os eventos de mouse "de compatibilidade" do toque tirem o foco do editor recém-aberto
        setTimeout(() => abrirEditor('no', n.id), 120);
    }

    function nosLimiteAtingido() {
        if (estado.nos.length >= MAX_NOS) { aviso('Limite de ' + MAX_NOS + ' caixas atingido.'); return true; }
        return false;
    }

    function excluirSelecao() {
        const n = noSel(), l = ligSel();
        if (n) {
            registrarUndo();
            estado.nos = estado.nos.filter(x => x !== n);
            estado.ligacoes = estado.ligacoes.filter(x => x.de !== n.id && x.para !== n.id);
        } else if (l) {
            registrarUndo();
            estado.ligacoes = estado.ligacoes.filter(x => x !== l);
        } else return;
        sel = null;
        atualizarContexto();
        desenhar();
    }

    function criarLigacao(de, para) {
        if (!de || !para || de === para) return;
        if (estado.ligacoes.length >= MAX_LIGACOES) { aviso('Limite de ligações atingido.'); return; }
        if (estado.ligacoes.some(l => l.de === de && l.para === para)) { aviso('Essas duas caixas já estão ligadas nesse sentido.'); return; }
        registrarUndo();
        const l = { id: gerarId('l', estado.ligacoes), de, para, rotulo: '' };
        estado.ligacoes.push(l);
        selecionar('lig', l.id);
    }

    function entrarModoLigar(origem) {
        modoLigar = true;
        origemLigar = origem || null;
        atualizarBotoes();
        desenhar();
        aviso(origem ? 'Agora clique na caixa de destino.' : 'Modo ligar: clique na caixa de origem e depois na de destino.');
    }

    function sairModoLigar() {
        modoLigar = false;
        origemLigar = null;
        atualizarBotoes();
        desenhar();
    }

    // ---------- Arquivo: exportar e importar ----------
    function nomeDeArquivo(titulo) {
        const base = String(titulo || 'mapa').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return (base || 'mapa') + '.excalc-mapa.json';
    }

    function exportar() {
        fecharEditor(true);
        const dados = { formato: 'excalc-mapa', versao: 1, titulo: estado.titulo, departamentos: estado.departamentos, nos: estado.nos, ligacoes: estado.ligacoes };
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        downloadFile(blob, nomeDeArquivo(estado.titulo));
        sujo = false;
        aviso('Mapa salvo em arquivo. Guarde-o: é a única cópia.');
    }

    // O arquivo importado é entrada NÃO confiável: só campos conhecidos, com tipos e tamanhos verificados.
    function validar(o) {
        const erro = motivo => ({ ok: false, erro: motivo });
        if (!o || typeof o !== 'object' || Array.isArray(o)) return erro('formato desconhecido.');
        if (o.formato !== 'excalc-mapa') return erro('não é um arquivo de mapa do ExCalc.');
        if (typeof o.versao !== 'number' || o.versao > 1) return erro('versão do arquivo não suportada.');
        if (!Array.isArray(o.departamentos) || o.departamentos.length > MAX_DEPS) return erro('lista de departamentos inválida.');
        if (!Array.isArray(o.nos) || o.nos.length > MAX_NOS) return erro('lista de caixas inválida ou grande demais.');
        if (!Array.isArray(o.ligacoes) || o.ligacoes.length > MAX_LIGACOES) return erro('lista de ligações inválida ou grande demais.');
        const txt = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
        const idOk = v => typeof v === 'string' && /^[\w-]{1,40}$/.test(v);
        const numOk = v => typeof v === 'number' && isFinite(v) && Math.abs(v) <= 1e6;

        const deps = [], idsDep = new Set();
        for (const d of o.departamentos) {
            if (!d || typeof d !== 'object' || !idOk(d.id) || idsDep.has(d.id)) return erro('departamento inválido.');
            if (typeof d.cor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(d.cor)) return erro('cor de departamento inválida.');
            idsDep.add(d.id);
            deps.push({ id: d.id, nome: txt(d.nome, 40), cor: d.cor.toUpperCase() });
        }
        const nos = [], idsNo = new Set();
        for (const n of o.nos) {
            if (!n || typeof n !== 'object' || !idOk(n.id) || idsNo.has(n.id)) return erro('caixa inválida.');
            if (!numOk(n.x) || !numOk(n.y)) return erro('posição de caixa inválida.');
            idsNo.add(n.id);
            nos.push({ id: n.id, x: n.x, y: n.y, titulo: txt(n.titulo, MAX_TITULO), dep: idsDep.has(n.dep) ? n.dep : '', nota: txt(n.nota, 5000) });
        }
        const ligs = [], idsLig = new Set();
        for (const l of o.ligacoes) {
            if (!l || typeof l !== 'object' || !idOk(l.id) || idsLig.has(l.id)) return erro('ligação inválida.');
            if (!idsNo.has(l.de) || !idsNo.has(l.para) || l.de === l.para) return erro('ligação aponta para caixa inexistente.');
            idsLig.add(l.id);
            ligs.push({ id: l.id, de: l.de, para: l.para, rotulo: txt(l.rotulo, 80) });
        }
        return { ok: true, dados: { titulo: txt(o.titulo, 80), departamentos: deps, nos, ligacoes: ligs } };
    }

    function confirmarPerda() {
        if (!sujo) return true;
        return window.confirm('Há alterações que ainda não foram salvas em arquivo. Continuar mesmo assim?');
    }

    function trocarMapa(novo, mensagem) {
        cancelarEditor();
        estado = novo;
        sel = null;
        sairModoLigar();
        desfazerPilha = [];
        refazerPilha = [];
        sujo = false;
        campoTituloMapa.value = estado.titulo;
        montarDeps();
        atualizarContexto();
        atualizarBotoes();
        ajustar();
        desenhar();
        if (mensagem) aviso(mensagem);
    }

    async function importarArquivo(arquivo) {
        if (!arquivo) return;
        if (arquivo.size > MAX_ARQUIVO) { aviso('Arquivo grande demais (máximo 5 MB).'); return; }
        if (!confirmarPerda()) return;
        let obj;
        try { obj = JSON.parse(await arquivo.text()); } catch (e) { aviso('Este arquivo não é um JSON válido.'); return; }
        const r = validar(obj);
        if (!r.ok) { aviso('Arquivo de mapa inválido: ' + r.erro); return; }
        trocarMapa(r.dados, 'Mapa aberto: ' + arquivo.name);
    }

    // ---------- Ações da barra ----------
    const acoes = {
        novo() { if (confirmarPerda()) trocarMapa(mapaNovo(), 'Mapa novo.'); },
        abrir() { entradaArquivo.click(); },
        salvar: exportar,
        desfazer,
        refazer,
        caixa() {
            if (nosLimiteAtingido()) return;
            const n = noSel();
            if (n) { novaCaixa(n.x + LARGURA / 2, n.y, n.id); return; }
            const r = svg.getBoundingClientRect();
            const c = paraMundo(r.left + r.width / 2, r.top + r.height / 2);
            novaCaixa(c.x, c.y);
        },
        ligar() { if (modoLigar) sairModoLigar(); else entrarModoLigar(noSel() ? noSel().id : null); },
        inverter() {
            const l = ligSel();
            if (!l) return;
            registrarUndo();
            const t = l.de; l.de = l.para; l.para = t;
            desenhar();
        },
        excluir: excluirSelecao,
        deps() { popDeps.hidden = !popDeps.hidden; },
        'dep-novo'() {
            if (estado.departamentos.length >= MAX_DEPS) { aviso('Limite de departamentos atingido.'); return; }
            registrarUndo();
            estado.departamentos.push({ id: gerarId('d', estado.departamentos), nome: 'Novo departamento', cor: PALETA[estado.departamentos.length % PALETA.length] });
            montarDeps();
            atualizarSelectDep();
            const n = noSel();
            if (n) selDep.value = n.dep || '';
        },
        tema() { temaMapa = temaMapa === 'claro' ? 'escuro' : 'claro'; overlay.setAttribute('data-tema-mapa', temaMapa); },
        'zoom-mais'() { const r = svg.getBoundingClientRect(); zoomEm(1.25, r.width / 2, r.height / 2); },
        'zoom-menos'() { const r = svg.getBoundingClientRect(); zoomEm(0.8, r.width / 2, r.height / 2); },
        ajustar,
        sair() { fechar(); }
    };

    overlay.querySelectorAll('[data-mapa-acao]').forEach(b => {
        b.addEventListener('click', () => { const f = acoes[b.dataset.mapaAcao]; if (f) f(); });
    });
    entradaArquivo.addEventListener('change', () => { const f = entradaArquivo.files[0]; entradaArquivo.value = ''; importarArquivo(f); });

    campoTituloMapa.addEventListener('input', () => { coalescer(campoTituloMapa); estado.titulo = campoTituloMapa.value.slice(0, 80); });
    selDep.addEventListener('change', () => {
        const n = noSel();
        if (!n) return;
        registrarUndo();
        n.dep = selDep.value;
        desenhar();
    });
    overlay.addEventListener('focusout', () => { campoAtivo = null; });

    // ---------- Ponteiro (mouse e toque) ----------
    const ponteiros = new Map();
    let gesto = null;
    let pinca = null;
    let ultimoToque = null;

    function ehDuploToque(tipo, id, e) {
        const agora = performance.now();
        const u = ultimoToque;
        ultimoToque = { t: agora, x: e.clientX, y: e.clientY, tipo, id };
        if (u && agora - u.t < 380 && Math.hypot(e.clientX - u.x, e.clientY - u.y) < 24 && u.tipo === tipo && u.id === id) {
            ultimoToque = null;
            return true;
        }
        return false;
    }

    svg.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        fecharEditor(true);
        try { svg.setPointerCapture(e.pointerId); } catch (x) { /* tudo bem */ }
        ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (ponteiros.size === 2) {
            const [a, b] = [...ponteiros.values()];
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, r = svg.getBoundingClientRect();
            pinca = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, k0: vista.k, wx: (mx - r.left - vista.x) / vista.k, wy: (my - r.top - vista.y) / vista.k };
            gesto = null;
            return;
        }
        const alvo = e.target.closest ? e.target.closest('[data-alca],[data-no],[data-lig]') : null;
        if (alvo && alvo.hasAttribute('data-alca')) {
            gesto = { tipo: 'ligar', de: alvo.getAttribute('data-alca') };
            selecionar('no', gesto.de);
            return;
        }
        if (alvo && alvo.hasAttribute('data-no')) {
            const id = alvo.getAttribute('data-no'), n = no(id);
            gesto = { tipo: 'no', id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, moveu: false, undo: false };
            if (!modoLigar) selecionar('no', id);
            return;
        }
        if (alvo && alvo.hasAttribute('data-lig')) {
            gesto = { tipo: 'toque-lig', id: alvo.getAttribute('data-lig') };
            selecionar('lig', gesto.id);
            return;
        }
        gesto = { tipo: 'pan', sx: e.clientX, sy: e.clientY, vx: vista.x, vy: vista.y, moveu: false };
    });

    svg.addEventListener('pointermove', e => {
        if (ponteiros.has(e.pointerId)) ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinca && ponteiros.size >= 2) {
            const [a, b] = [...ponteiros.values()];
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, r = svg.getBoundingClientRect();
            const k = limitar(pinca.k0 * (Math.hypot(a.x - b.x, a.y - b.y) / pinca.d0), 0.2, 3);
            vista.k = k;
            vista.x = mx - r.left - pinca.wx * k;
            vista.y = my - r.top - pinca.wy * k;
            aplicarVista();
            return;
        }
        if (!gesto) return;
        if (gesto.tipo === 'pan') {
            const dx = e.clientX - gesto.sx, dy = e.clientY - gesto.sy;
            if (!gesto.moveu && Math.hypot(dx, dy) < 4) return;
            gesto.moveu = true;
            vista.x = gesto.vx + dx;
            vista.y = gesto.vy + dy;
            aplicarVista();
        } else if (gesto.tipo === 'no') {
            const dx = e.clientX - gesto.sx, dy = e.clientY - gesto.sy;
            if (!gesto.moveu && Math.hypot(dx, dy) < 4) return;
            const n = no(gesto.id);
            if (!n) return;
            if (!gesto.undo) { registrarUndo(); gesto.undo = true; }
            gesto.moveu = true;
            n.x = Math.round(gesto.ox + dx / vista.k);
            n.y = Math.round(gesto.oy + dy / vista.k);
            agendar();
        } else if (gesto.tipo === 'ligar') {
            const a = no(gesto.de);
            if (!a) return;
            const p = paraMundo(e.clientX, e.clientY);
            gTemp.replaceChildren();
            const h = alturaNo(a);
            el('path', { d: `M${a.x + LARGURA},${a.y + h / 2} L${p.x},${p.y}`, class: 'temp' }, gTemp);
        }
    });

    function terminarGesto(e) {
        ponteiros.delete(e.pointerId);
        if (pinca) { if (ponteiros.size < 2) pinca = null; gesto = null; return; }
        const g = gesto;
        gesto = null;
        gTemp.replaceChildren();
        if (!g) return;
        if (g.tipo === 'ligar') {
            const sob = document.elementFromPoint(e.clientX, e.clientY);
            const alvo = sob && sob.closest ? sob.closest('[data-no]') : null;
            if (alvo) criarLigacao(g.de, alvo.getAttribute('data-no'));
            return;
        }
        if (g.tipo === 'no' && !g.moveu) {
            if (modoLigar) {
                if (!origemLigar) { origemLigar = g.id; desenhar(); aviso('Agora clique na caixa de destino.'); }
                else { const de = origemLigar; sairModoLigar(); criarLigacao(de, g.id); }
                return;
            }
            if (ehDuploToque('no', g.id, e)) setTimeout(() => abrirEditor('no', g.id), 120);
            return;
        }
        if (g.tipo === 'toque-lig') {
            if (ehDuploToque('lig', g.id, e)) setTimeout(() => abrirEditor('lig', g.id), 120);
            return;
        }
        if (g.tipo === 'pan' && !g.moveu) {
            selecionar(null);
            if (modoLigar) return;
            if (ehDuploToque('vazio', '', e)) {
                if (nosLimiteAtingido()) return;
                const p = paraMundo(e.clientX, e.clientY);
                novaCaixa(p.x, p.y);
            }
        }
    }

    svg.addEventListener('pointerup', terminarGesto);
    svg.addEventListener('pointercancel', e => { gesto = null; pinca = null; ponteiros.delete(e.pointerId); gTemp.replaceChildren(); });
    svg.addEventListener('wheel', e => {
        e.preventDefault();
        fecharEditor(true);
        const r = svg.getBoundingClientRect();
        zoomEm(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    // ---------- Teclado ----------
    const digitando = alvo => alvo && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName));

    document.addEventListener('keydown', e => {
        if (!aberto) return;
        const escrevendo = digitando(e.target);
        const ctrl = e.ctrlKey || e.metaKey;
        if (e.key === 'Escape') {
            if (!popDeps.hidden) popDeps.hidden = true;
            else if (modoLigar) sairModoLigar();
            else if (escrevendo) e.target.blur();
            else fechar();
            return;
        }
        if (ctrl && !escrevendo) {
            const k = e.key.toLowerCase();
            if (k === 'z' && !e.shiftKey) { e.preventDefault(); desfazer(); return; }
            if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); refazer(); return; }
        }
        if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); exportar(); return; }
        if (ctrl && e.key.toLowerCase() === 'o') { e.preventDefault(); acoes.abrir(); return; }
        if (escrevendo || ctrl || e.altKey) return;
        const emBotao = e.target && e.target.tagName === 'BUTTON';
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); excluirSelecao(); }
        else if ((e.key === 'Enter' || e.key === 'F2') && !(emBotao && e.key === 'Enter') && sel) {
            e.preventDefault();
            abrirEditor(sel.tipo, sel.id);
        }
        else if (e.key.toLowerCase() === 'f') ajustar();
        else if (e.key.toLowerCase() === 'n') { if (!nosLimiteAtingido()) acoes.caixa(); }
        else if (e.key.toLowerCase() === 'l') acoes.ligar();
        else if (e.key.startsWith('Arrow') && noSel()) {
            e.preventDefault();
            const passo = e.shiftKey ? 40 : 10, n = noSel();
            registrarUndo();
            if (e.key === 'ArrowLeft') n.x -= passo;
            else if (e.key === 'ArrowRight') n.x += passo;
            else if (e.key === 'ArrowUp') n.y -= passo;
            else n.y += passo;
            desenhar();
        }
    });

    window.addEventListener('beforeunload', e => {
        if (sujo) { e.preventDefault(); e.returnValue = ''; }
    });
    window.addEventListener('resize', () => { if (aberto) aplicarVista(); });

    // ---------- Abrir / fechar ----------
    function abrir() {
        if (aberto) return;
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        aberto = true;
        campoTituloMapa.value = estado.titulo;
        montarDeps();
        atualizarContexto();
        atualizarBotoes();
        if (!jaAjustou) { ajustar(); jaAjustou = true; } else aplicarVista();
        desenhar();
        dica.classList.remove('oculta');
        setTimeout(() => dica.classList.add('oculta'), 9000);
        overlay.focus();
    }

    function fechar() {
        if (!aberto) return;
        fecharEditor(true);
        aberto = false;
        sairModoLigar();
        popDeps.hidden = true;
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    window.abrirMapa = abrir;
    window.fecharMapa = fechar;
})();

// Avisa o núcleo (core.js) que o Mapa terminou de carregar
window.__mapaCarregada = true;
