// MERCADO EM TEMPO REAL (só a página Início): 3 "osciladores" (mini-gráficos) de câmbio — Dólar/Real, Bitcoin/Real,
// Euro/Dólar —, o texto do IPCA acumulado no ano e 3 gráficos de pizza (regra 50/30/20, líquido x Imposto de Renda
// de um CDB e para onde vai um salário de R$5.000). Cada um busca os próprios dados (AwesomeAPI e Banco Central, os
// mesmos domínios já usados pelos indicadores) e falha "grácil": se uma cotação não vier, aquele cartão mostra
// "indisponível" sem travar os outros. Só roda se os elementos existirem na página (`#mercado-painel`).
// Precisa do Chart.js (script externo só nesta página) e de coresDoGrafico()/aliquotaIRRegressivo() (core.js).

const PARES_CAMBIO = [
    { par: 'USD-BRL', id: 'usdbrl', formatar: v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
    { par: 'BTC-BRL', id: 'btc', formatar: v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) },
    { par: 'EUR-USD', id: 'eurusd', formatar: v => v.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + ' USD' }
];

// Três pizzas 2D, cada uma sobre um assunto diferente (nenhuma sobre o IPCA — esse fica só como texto, abaixo dos
// osciladores). 1) Regra 50/30/20 (referência de planejamento pessoal, sem busca). 2) Líquido x Imposto de Renda de
// um CDB 100% do CDI em 12 meses (com o CDI de agora). 3) Para onde vai um salário de R$ 5.000 (regras de 2026).
const PIZZA_503020 = [
    { nome: 'Necessidades (50%)', valor: 50, cor: '#8FA3FB' },
    { nome: 'Desejos (30%)', valor: 30, cor: '#22D3EE' },
    { nome: 'Poupança/investimentos (20%)', valor: 20, cor: '#34D399' }
];
// Exemplo de salário de R$ 5.000/mês pelas regras de 2026 (INSS_2026/IRRF_2026 em js/financeiro.js): INSS R$501,51,
// IRRF R$0,00 (zerado pela redução da Lei 15.270/2025) e líquido R$4.498,49. Não é calculado aqui de novo (evita
// duplicar a fórmula em dois arquivos); se as tabelas de 2026 mudarem, atualizar os dois lugares juntos.
const PIZZA_SALARIO = [
    { nome: 'Líquido (R$ 4.498,49)', valor: 4498.49, cor: '#34D399' },
    { nome: 'INSS (R$ 501,51)', valor: 501.51, cor: '#F59E0B' },
    { nome: 'IRRF (R$ 0,00)', valor: 0.01, cor: '#F87171' } // 0,01 só pra fatia mínima aparecer na legenda/tooltip
];

let graficosMercado = []; // guarda as instâncias do Chart.js para não recriar em cima (evita "canvas já em uso")

function montarMercado() {
    if (!document.getElementById('mercado-painel')) return;
    graficosMercado.forEach(g => g.destroy());
    graficosMercado = [];
    PARES_CAMBIO.forEach(carregarOscilador);
    carregarIpcaAcumulado();
    montarPizza('merc-pizza-503020', PIZZA_503020);
    montarPizza('merc-pizza-salario', PIZZA_SALARIO);
    montarPizzaIR();
}

// Clareia uma cor hex (mistura com branco) — usada no degradê "gloss" de cada fatia
function clarearHex(hex, fator) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const mix = c => Math.round(c + (255 - c) * fator);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Plugin do Chart.js: desenha um brilho ovalado (reflexo de luz) por cima da pizza, como vidro fosco — efeito 2D,
// sem simular profundidade/3D.
const BRILHO_PIZZA = {
    id: 'brilhoPizza',
    afterDraw(chart) {
        const { ctx, chartArea: a } = chart;
        if (!a) return;
        const cx = (a.left + a.right) / 2, cy = (a.top + a.bottom) / 2;
        const r = Math.min(a.right - a.left, a.bottom - a.top) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        const brilho = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.05, cx - r * 0.1, cy - r * 0.1, r * 1.15);
        brilho.addColorStop(0, 'rgba(255,255,255,0.55)');
        brilho.addColorStop(0.45, 'rgba(255,255,255,0.08)');
        brilho.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = brilho;
        ctx.fillRect(a.left, a.top, a.right - a.left, a.bottom - a.top);
        ctx.restore();
    }
};

// Monta uma pizza 2D genérica (usada pelas 3 do painel): `itens` = [{nome, valor, cor}, ...]. Preenche o canvas
// "merc-<id>" e a legenda "merc-<id>-legenda". Devolve o gráfico criado (ou null se os elementos não existirem).
function montarPizza(id, itens) {
    const canvas = document.getElementById(id);
    const legenda = document.getElementById(id + '-legenda');
    if (!canvas || !legenda) return null;

    const soma = itens.reduce((s, it) => s + it.valor, 0);
    const cores = coresDoGrafico();

    const grafico = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        plugins: [BRILHO_PIZZA],
        data: {
            labels: itens.map(it => it.nome),
            datasets: [{
                data: itens.map(it => it.valor),
                // cada fatia ganha um degradê claro -> cor (efeito "gloss", como vidro/esfera)
                backgroundColor: context => {
                    const area = context.chart.chartArea;
                    const cor = itens[context.dataIndex] ? itens[context.dataIndex].cor : '#8FA3FB';
                    if (!area) return cor; // 1ª passada, antes do layout calculado
                    const ctx2 = context.chart.ctx;
                    const grad = ctx2.createLinearGradient(0, area.top, 0, area.bottom);
                    grad.addColorStop(0, clarearHex(cor, 0.5));
                    grad.addColorStop(1, cor);
                    return grad;
                },
                borderColor: 'rgba(255,255,255,0.12)',
                borderWidth: 1.5,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 400 },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { title: () => '', label: c => c.label + ': ' + (c.parsed / soma * 100).toFixed(1) + '%' }, bodyColor: cores.texto, titleColor: cores.texto }
            }
        }
    });
    graficosMercado.push(grafico);

    legenda.replaceChildren();
    itens.forEach(it => {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-1.5';
        const bola = document.createElement('span');
        bola.className = 'inline-block w-2.5 h-2.5 rounded-full shrink-0';
        bola.style.backgroundColor = it.cor;
        const texto = document.createElement('span');
        texto.textContent = it.nome;
        li.append(bola, texto);
        legenda.appendChild(li);
    });

    return grafico;
}

// Pizza do CDB 100% do CDI (12 meses): precisa do CDI de agora, então espera fetchMarketIndicators() (já em
// andamento/cacheado pelo core.js — não dispara uma busca nova) e de aliquotaIRRegressivo() (core.js).
async function montarPizzaIR() {
    const statusEl = document.getElementById('merc-pizza-ir-status');
    try {
        const dados = await fetchMarketIndicators();
        if (!dados || !isFinite(dados.cdi)) throw new Error('CDI indisponível');
        const aliq = aliquotaIRRegressivo(360);
        const liquido = dados.cdi * (1 - aliq);
        const imposto = dados.cdi * aliq;
        montarPizza('merc-pizza-ir', [
            { nome: `Líquido (${liquido.toFixed(2)}% a.a.)`, valor: liquido, cor: '#34D399' },
            { nome: `Imposto de Renda (${imposto.toFixed(2)}% a.a.)`, valor: imposto, cor: '#F87171' }
        ]);
        if (statusEl) statusEl.classList.add('hidden');
    } catch (erro) {
        console.warn('Aviso: Não foi possível montar a pizza de líquido x Imposto de Renda.');
        if (statusEl) statusEl.classList.remove('hidden');
    }
}

// Um "oscilador": mini-gráfico de linha dos últimos dias + valor atual + variação do dia, tudo a partir do
// histórico diário da AwesomeAPI (não precisa de uma chamada separada para o "valor de agora").
async function carregarOscilador(cfg) {
    const valorEl = document.getElementById('merc-' + cfg.id + '-valor');
    const badgeEl = document.getElementById('merc-' + cfg.id + '-badge');
    const canvas = document.getElementById('merc-' + cfg.id + '-chart');
    if (!valorEl || !canvas) return;
    try {
        const dados = await buscarJson(`https://economia.awesomeapi.com.br/json/daily/${cfg.par}/30`);
        if (!Array.isArray(dados) || dados.length < 2) throw new Error('sem dados suficientes');

        const pontos = dados
            .map(d => ({ t: parseInt(d.timestamp, 10) * 1000, bid: parseFloat(d.bid) }))
            .filter(p => isFinite(p.t) && isFinite(p.bid))
            .sort((a, b) => a.t - b.t); // do mais antigo para o mais recente (esquerda -> direita no gráfico)
        if (pontos.length < 2) throw new Error('sem dados suficientes');

        const atual = pontos[pontos.length - 1].bid;
        const anterior = pontos[pontos.length - 2].bid;
        const variacao = ((atual - anterior) / anterior) * 100;
        const subiu = variacao >= 0;

        valorEl.innerText = cfg.formatar(atual);
        if (badgeEl) {
            badgeEl.innerText = (subiu ? '▲ +' : '▼ ') + variacao.toFixed(2) + '%';
            badgeEl.className = 'text-[10px] font-semibold px-1.5 py-0.5 rounded-full ' +
                (subiu ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400');
        }

        const corLinha = subiu ? (getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22D3EE') : '#F87171';
        const corArea = subiu ? 'rgba(34,211,238,0.12)' : 'rgba(248,113,113,0.12)';
        const grafico = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: pontos.map(p => new Date(p.t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
                datasets: [{ data: pontos.map(p => p.bid), borderColor: corLinha, backgroundColor: corArea, fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
        graficosMercado.push(grafico);
    } catch (erro) {
        console.warn(`Aviso: Não foi possível atualizar o oscilador ${cfg.par}.`);
        valorEl.innerText = 'Indisponível agora';
        if (badgeEl) badgeEl.classList.add('hidden');
    }
}

// IPCA acumulado no ano: soma composta (não é só somar %) dos índices mensais do BCB (série 433) do ano corrente.
async function carregarIpcaAcumulado() {
    const totalEl = document.getElementById('merc-ipca-total');
    const statusEl = document.getElementById('merc-ipca-status');
    if (!totalEl) return;
    try {
        const dados = await buscarJson('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json');
        if (!Array.isArray(dados) || !dados.length) throw new Error('sem dados');

        const anoAtual = new Date().getFullYear();
        const meses = dados
            .map(d => {
                const [dia, mes, ano] = String(d.data).split('/').map(Number);
                return { data: new Date(ano, (mes || 1) - 1, dia || 1), ano, mes, valor: parseFloat(d.valor) };
            })
            .filter(m => m.ano === anoAtual && isFinite(m.valor))
            .sort((a, b) => a.data - b.data);
        if (!meses.length) throw new Error('sem meses do ano corrente ainda');

        const acumulado = (meses.reduce((prod, m) => prod * (1 + m.valor / 100), 1) - 1) * 100;
        totalEl.innerText = 'IPCA no ano: ' + (acumulado >= 0 ? '+' : '') + acumulado.toFixed(2) + '%';
        if (statusEl) statusEl.classList.add('hidden');
    } catch (erro) {
        console.warn('Aviso: Não foi possível atualizar o IPCA acumulado no ano.');
        totalEl.innerText = 'IPCA no ano: indisponível';
        if (statusEl) statusEl.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', montarMercado);
