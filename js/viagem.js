// MODO VIAGEM: efeitos psicodélicos (carregado só quando a pessoa clica no botão flutuante)
// (Gerado na divisão do script.js único; agora este arquivo é editado diretamente.)

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
    // Nas nuvens o clique não gera onda de choque (o Vanta cuida do mouse), então a dica muda
    const DICA_NUVEM = 'Mova o mouse para mudar o céu · teclas 1, 2, 3 trocam o efeito · Esc sai';
    const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const velocidadeGlobal = reduzMovimento ? 0.4 : 1; // quem pede menos movimento recebe tudo mais devagar
    const FUNDO = '#05030f'; // mesmo valor de --viagem-bg no style.css

    let W = 0, H = 0, dpr = 1;
    let modo = 'caleido'; // caleidoscópio é o efeito principal
    let rodando = false;
    let rafId = 0;
    let t = 0;
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
            n.hue = (n.hue + 0.15) % 360;
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
                skyColor: 0x0c3271,         // céu azul-navy (20% mais claro que o original 0x0a2a5e)
                cloudColor: 0x92aedb,       // nuvens 15% mais translúcidas: 15% da cor do céu misturado em 0xa9c4ee
                cloudShadowColor: 0x0b162c, // sombras no navy do site (mesma mistura de 15% com o céu)
                sunColor: 0x22d3ee,         // "sol" ciano (cor de destaque do site)
                sunGlareColor: 0x0e7490,
                sunlightColor: 0x67e8f9
            });
            dica.innerText = DICA_NUVEM;
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
                ctx.strokeStyle = `hsla(${(t * 40 + k * 25 + vel * 3) % 360}, 100%, 62%, 0.7)`;
                ctx.beginPath(); ctx.moveTo(caleido.px, caleido.py); ctx.lineTo(caleido.x, caleido.y); ctx.stroke();
                ctx.fillStyle = `hsla(${(t * 40 + k * 25 + 180) % 360}, 100%, 75%, 0.5)`;
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
        dica.innerText = ehNuvem ? DICA_NUVEM : DICA_PADRAO;
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
        else if (e.key === 'Escape' && !document.fullscreenElement) window.fecharViagem();
    });
    overlay.querySelectorAll('[data-viagem-modo]').forEach(b => b.addEventListener('click', () => trocarModo(b.dataset.viagemModo)));
    document.getElementById('viagem-tela').addEventListener('click', alternarTelaCheia);
})();

// Avisa o núcleo (core.js) que o Modo Viagem terminou de carregar
window.__viagemCarregada = true;
