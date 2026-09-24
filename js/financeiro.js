// CALCULADORAS FINANCEIRAS: juros compostos, reserva, milhão, financiamentos, amortização, alugar x comprar, à vista x parcelado, FGTS, rescisão, salário líquido, investimentos
// (Gerado na divisão do script.js único; agora este arquivo é editado diretamente.)

let myChart = null;


// Ao atualizar em anos futuros, mude só estas constantes.
const INSS_2026 = { teto: 8475.55, faixas: [[1621.00, 0.075], [2902.84, 0.09], [4354.27, 0.12], [8475.55, 0.14]] };
const IRRF_2026 = {
    faixas: [[2428.80, 0, 0], [2826.65, 0.075, 182.16], [3751.05, 0.15, 394.16], [4664.68, 0.225, 675.49], [Infinity, 0.275, 908.73]],
    dependente: 189.59,
    simplificado: 607.20,
    isencaoAte: 5000.00,
    reducaoMaxAteIsencao: 312.89,
    limiteReducao: 7350.00,
    redutorFixo: 978.62,
    redutorFator: 0.133145
};

function calcularINSS(bruto) {
    const base = Math.min(bruto, INSS_2026.teto);
    let anterior = 0;
    let total = 0;
    for (const [limite, aliquota] of INSS_2026.faixas) {
        if (base > anterior) total += (Math.min(base, limite) - anterior) * aliquota;
        anterior = limite;
    }
    return arredonda2(total);
}

function calcularIRRF(bruto, inss, dependentes) {
    const deducaoLegal = inss + dependentes * IRRF_2026.dependente;
    const usaSimplificado = IRRF_2026.simplificado > deducaoLegal;
    const base = Math.max(0, bruto - Math.max(deducaoLegal, IRRF_2026.simplificado));

    let irTabela = 0;
    for (const [limite, aliquota, parcela] of IRRF_2026.faixas) {
        if (base <= limite) { irTabela = Math.max(0, base * aliquota - parcela); break; }
    }

    // Redução da Lei 15.270/2025 (calculada sobre o rendimento tributável bruto)
    let reducao = 0;
    if (bruto <= IRRF_2026.isencaoAte) {
        reducao = Math.min(irTabela, IRRF_2026.reducaoMaxAteIsencao);
    } else if (bruto < IRRF_2026.limiteReducao) {
        reducao = Math.max(0, Math.min(irTabela, IRRF_2026.redutorFixo - IRRF_2026.redutorFator * bruto));
    }
    return { base: arredonda2(base), usaSimplificado, reducao: arredonda2(reducao), ir: arredonda2(Math.max(0, irTabela - reducao)) };
}

function calculateSalarioLiquido(explicito) {
    const bruto = lerNumero('sl-bruto');
    const dependentes = Math.max(0, parseInt(document.getElementById('sl-dependentes').value) || 0);
    const outros = lerNumero('sl-outros');

    const inss = calcularINSS(bruto);
    const ir = calcularIRRF(bruto, inss, dependentes);
    const liquido = arredonda2(bruto - inss - ir.ir - outros);

    document.getElementById('sl-res-bruto').innerText = fmtBRL(bruto);
    document.getElementById('sl-res-inss').innerText = fmtBRL(inss);
    document.getElementById('sl-res-irrf').innerText = fmtBRL(ir.ir);
    document.getElementById('sl-res-outros').innerText = fmtBRL(outros);
    document.getElementById('sl-res-liquido').innerText = fmtBRL(liquido);
    document.getElementById('sl-res-base').innerText = fmtBRL(ir.base);
    document.getElementById('sl-res-metodo').innerText = ir.usaSimplificado ? '(desconto simplificado)' : '(deduções legais)';
    document.getElementById('sl-res-reducao').innerText = fmtBRL(ir.reducao);
    const efetiva = bruto > 0 ? ((inss + ir.ir) / bruto) * 100 : 0;
    document.getElementById('sl-res-efetiva').innerText = efetiva.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '% (só INSS + IR)';

    if (explicito && bruto >= 500000) avisarExagero('Vá com calma! 🤑 Confira o valor: esse salário mensal é bem fora da curva.');
}

// ---------- Comparador de investimentos ----------
let invPreenchido = false;

async function usarIndicadoresNoComparador() {
    // fetchMarketIndicators() vem do indicadores.js (busca uma vez por página e guarda em indicadoresMercado)
    const dados = await fetchMarketIndicators();
    if (dados.ok.cdi) document.getElementById('inv-cdi').value = dados.cdi;
    if (dados.ok.selic) document.getElementById('inv-selic').value = dados.selic;
    calculateInvestimentos();
}

function preencherIndicadoresInvestimentos() {
    if (invPreenchido) return;
    invPreenchido = true;
    usarIndicadoresNoComparador(); // dispara a busca e preenche CDI/Selic quando chegarem (se falhar, ficam os valores padrão)
}
// aliquotaIRRegressivo(dias) foi para o core.js: também é usada pelo painel comparativo da Início (indicadores.js)

function calculateInvestimentos() {
    const valor = lerNumero('inv-valor');
    const meses = Math.max(1, parseInt(document.getElementById('inv-meses').value) || 1);
    const cdi = parseFloat(document.getElementById('inv-cdi').value) || 0;
    const selic = parseFloat(document.getElementById('inv-selic').value) || 0;
    const cdbPct = parseFloat(document.getElementById('inv-cdb-pct').value) || 0;
    const lciPct = parseFloat(document.getElementById('inv-lci-pct').value) || 0;
    const aliqIR = aliquotaIRRegressivo(meses * 30);
    // Poupança: 0,5% ao mês (TR zerada) se a Selic > 8,5% a.a.; senão 70% da Selic
    const poupancaAnual = selic > 8.5 ? (Math.pow(1.005, 12) - 1) * 100 : selic * 0.7;

    const opcoes = [
        { nome: 'CDB', taxa: cdi * cdbPct / 100, ir: true },
        { nome: 'LCI / LCA', taxa: cdi * lciPct / 100, ir: false },
        { nome: 'Tesouro Selic', taxa: selic, ir: true },
        { nome: 'Poupança', taxa: poupancaAnual, ir: false }
    ].map(o => {
        const bruto = valor * Math.pow(1 + o.taxa / 100, meses / 12);
        const rendimento = bruto - valor;
        const imposto = o.ir ? rendimento * aliqIR : 0;
        const liquido = bruto - imposto;
        const rentAnual = valor > 0 ? (Math.pow(liquido / valor, 12 / meses) - 1) * 100 : 0;
        return { ...o, bruto, imposto, liquido, rentAnual };
    });

    const melhor = opcoes.reduce((a, b) => (b.liquido > a.liquido ? b : a));
    const corpo = document.getElementById('inv-tabela');
    corpo.innerHTML = '';
    opcoes.forEach((o, i) => {
        const tr = document.createElement('tr');
        tr.className = (o === melhor ? 'bg-emerald-500/10 ' : i % 2 ? 'bg-gray-900/40 ' : '') + 'transition-colors';
        const celulas = [
            (o === melhor ? '🏆 ' : '') + o.nome,
            fmtBRL(o.bruto),
            o.ir ? fmtBRL(o.imposto) + ' (' + (aliqIR * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%)' : 'Isento',
            fmtBRL(o.liquido),
            o.rentAnual.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%'
        ];
        celulas.forEach((texto, c) => {
            const td = document.createElement('td');
            td.className = 'p-3' + (c === 0 ? ' font-semibold text-emerald-400' : '') + (c === 3 ? ' font-bold text-white' : '') + (c === 4 ? ' text-right font-bold' : '');
            td.textContent = texto;
            tr.appendChild(td);
        });
        corpo.appendChild(tr);
    });
    document.getElementById('inv-melhor').textContent = valor > 0
        ? `Melhor opção neste cenário: ${melhor.nome}, com ${fmtBRL(melhor.liquido)} líquidos em ${meses} ${meses === 1 ? 'mês' : 'meses'}.`
        : '';
}

// ---------- Gerador de senhas ----------

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
    let exageroJC = false;
    if (!calculoAutomatico) {
        if (monthlyRate >= 0.5) {
            exageroJC = true;
            avisarExagero(`Vá com calma! 🐎 Um rendimento equivalente a ${(monthlyRate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}% ao mês não existe no mundo real. Confira a taxa.`);
        } else if (timeType === 'years' && time > 100) {
            exageroJC = true;
            avisarExagero('Vá com calma! 🧓 Mais de 100 anos investindo? Revise o prazo.');
        }
    }

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

    if (!calculoAutomatico && !exageroJC && totalInvested > 0 && totalJuros > totalInvested) {
        celebrar('Os juros já superam tudo o que você investiu! 🎉');
    }

    renderJCTable();

    document.getElementById('jc-res-investido').innerText = totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('jc-res-juros').innerText = totalJuros.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('jc-res-total').innerText = currentTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const ctx = document.getElementById('growthChart').getContext('2d');
    if (myChart) myChart.destroy();

    const coresGraf = coresDoGrafico();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Total Acumulado (R$)', data: dataTotal, borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.1)', fill: true, tension: 0.2 },
                { label: 'Valor Investido (R$)', data: dataInvested, borderColor: '#60a5fa', fill: false, tension: 0.2 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: coresGraf.texto } } },
            scales: {
                x: { ticks: { color: coresGraf.texto }, grid: { color: coresGraf.grade } },
                y: { ticks: { color: coresGraf.texto }, grid: { color: coresGraf.grade } }
            }
        }
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
    const exageroMilhao = !calculoAutomatico && annualRate >= 10;
    if (exageroMilhao) avisarExagero(`Vá com calma! 🐎 ${(annualRate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}% ao ano? Nenhum investimento real rende isso.`);
    let monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    let target = 1000000;
    let currentTotal = p;
    let months = 0;

    if (currentTotal >= target) {
        document.getElementById('milhao-resultado').innerText = "Já atingido!";
        document.getElementById('milhao-detalhes').innerText = "";
        if (!calculoAutomatico && !exageroMilhao) celebrar('Você já tem R$ 1.000.000 (ou mais)! 🎉');
        return;
    }

    while (currentTotal < target && months < 1200) {
        currentTotal += (currentTotal * monthlyRate) + pmt;
        months++;
    }

    document.getElementById('milhao-resultado').innerText = `${Math.floor(months / 12)} anos e ${months % 12} meses`;
    document.getElementById('milhao-detalhes').innerText = `Aproximadamente ${months} meses de aportes.`;
    if (!calculoAutomatico && !exageroMilhao && currentTotal >= target) celebrar('Meta de R$ 1.000.000 alcançada na simulação! 🎉');
}

// 4. Financiamento Imobiliário (SAC vs Price)
function calculateFinanciamento() {
    let valorImovel = getVal('fin-valor');
    let entrada = getVal('fin-entrada');
    let taxaAnual = parseFloat(document.getElementById('fin-taxa').value) / 100 || 0;
    if (!calculoAutomatico && taxaAnual >= 1) avisarExagero('Vá com calma! 🐎 Juros de mais de 100% ao ano num financiamento? Confira a taxa.');
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
    if (!calculoAutomatico && taxaMensal >= 0.2) avisarExagero('Vá com calma! 🐎 Juros de 20% ao mês ou mais? Isso já é agiotagem. Confira a taxa.');
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
    if (!calculoAutomatico && taxa >= 0.2) avisarExagero('Vá com calma! 🐎 Uma taxa dessas não existe. Confira o valor.');
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
    if (!calculoAutomatico && taxaAnual >= 1) avisarExagero('Vá com calma! 🐎 Juros de mais de 100% ao ano? Confira a taxa.');
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


function calculateComparador() {
    let valor = getVal('comp-valor');
    let descontoPct = parseFloat(document.getElementById('comp-desconto').value) / 100 || 0;
    let parcelas = parseInt(document.getElementById('comp-parcelas').value) || 1;
    let rendimentoMes = parseFloat(document.getElementById('comp-rendimento').value) / 100 || 0;
    if (!calculoAutomatico && rendimentoMes >= 0.2) avisarExagero('Vá com calma! 🐎 Rendimento de 20% ao mês ou mais? Confira o valor.');

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
