let myChart = null;

// Função executada ao carregar a página
window.onload = function() {
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
};

// Função auxiliar para ler e limpar valores monetários formatados
function getVal(id) {
    let el = document.getElementById(id);
    if (!el) return 0;
    let limpo = el.value.replace(/\D/g, '');
    return Number(limpo) || 0;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('bg-emerald-500', 'text-gray-950', 'font-bold');
        el.classList.add('text-gray-300', 'hover:bg-gray-700');
    });

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    let activeBtn = document.getElementById(`btn-${tabId}`);
    activeBtn.classList.remove('text-gray-300', 'hover:bg-gray-700');
    activeBtn.classList.add('bg-emerald-500', 'text-gray-950', 'font-bold');

    if (tabId === 'juros-compostos') calculateJC();
    if (tabId === 'reserva') calculateReserva();
    if (tabId === 'milhao') calculateMilhao();
    if (tabId === 'financiamento') calculateFinanciamento();
    if (tabId === 'veiculos') calculateVeiculo();
    if (tabId === 'amortizacao') calculateAmortizacao();
    if (tabId === 'alugar-comprar') calculateAlugarComprar();
    if (tabId === 'inflacao') calculateInflacao();
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

    // valores padrão (usados só se a busca em tempo real falhar)
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
        }
    } catch (error) {
        console.warn("Aviso: Não foi possível atualizar o dólar em tempo real, mantendo padrão.", error);
    }

    //  Selic — série SGS 432 (Meta Selic definida pelo Copom)
    try {
        let resSelic = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        let dataSelic = await resSelic.json();
        if (dataSelic && dataSelic[0] && dataSelic[0].valor) {
            selicEl.innerText = `${parseFloat(dataSelic[0].valor).toFixed(2)}% a.a.`;
        }
    } catch (error) {
        console.warn("Aviso: Não foi possível atualizar a Selic em tempo real, mantendo padrão.", error);
    }

    //  CDI — série SGS 4389 (CDI anualizada base 252)
    try {
        let resCdi = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json');
        let dataCdi = await resCdi.json();
        if (dataCdi && dataCdi[0] && dataCdi[0].valor) {
            cdiEl.innerText = `${parseFloat(dataCdi[0].valor).toFixed(2)}% a.a.`;
        }
    } catch (error) {
        console.warn("Aviso: Não foi possível atualizar o CDI em tempo real, mantendo padrão.", error);
    }

    //  IPCA — série SGS 13522 (acumulado 12 meses)
    try {
        let resIpca = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json');
        let dataIpca = await resIpca.json();
        if (dataIpca && dataIpca[0] && dataIpca[0].valor) {
            ipcaEl.innerText = `${parseFloat(dataIpca[0].valor).toFixed(2)}% a.a.`;
        }
    } catch (error) {
        console.warn("Aviso: Não foi possível atualizar o IPCA em tempo real, mantendo padrão.", error);
    }

    //  Poupança — série SGS 195 (rentabilidade mensal, já com TR embutida)
    try {
        let resPoupanca = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.195/dados/ultimos/1?formato=json');
        let dataPoupanca = await resPoupanca.json();
        if (dataPoupanca && dataPoupanca[0] && dataPoupanca[0].valor) {
            let mensal = parseFloat(dataPoupanca[0].valor) / 100;
            let anual = (Math.pow(1 + mensal, 12) - 1) * 100;
            poupancaEl.innerText = `${anual.toFixed(2)}% a.a.`;
        }
    } catch (error) {
        console.warn("Aviso: Não foi possível atualizar a poupança em tempo real, mantendo padrão.", error);
    }

    let hoje = new Date();
    dateSpan.innerText = `Atualizado em: ${hoje.toLocaleDateString('pt-BR')} às ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
// 1. Juros Compostos
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

    for (let month = 1; month <= totalMonths; month++) {
        let interestEarned = currentTotal * monthlyRate;
        currentTotal += interestEarned + pmt;
        totalInvested += pmt;

        if (month % 12 === 0 || month === totalMonths) {
            labels.push(`Ano ${Math.ceil(month/12)}`);
            dataTotal.push(currentTotal);
            dataInvested.push(totalInvested);
        }
    }

    let totalJuros = currentTotal - totalInvested;

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
        document.getElementById('preview-orc-emissor').innerText = document.getElementById('orc-emissor').value || 'Sua Empresa';
        document.getElementById('preview-orc-cliente').innerText = document.getElementById('orc-cliente').value || 'Cliente Não Informado';
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
            tr.innerHTML = `
                <td class="py-2 text-gray-800">${desc}</td>
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
// Mapeamento global de conversões permitidas entre formatos
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

// Atualiza as opções do <select> dinamicamente
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

// Executa a conversão baseada nas escolhas do usuário
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
        // Roteamento de conversão
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

// --- DOCX CONVERSIONS ---
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

// --- EXCEL (XLSX/XLS) CONVERSIONS ---
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
    const htmlTable = XLSX.utils.sheet_to_html(worksheet);
    await exportHtmlToPdf(htmlTable, file.name, statusEl);
}

// --- PDF CONVERSIONS ---
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

// --- CSV CONVERSIONS ---
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
    const htmlTable = XLSX.utils.sheet_to_html(workbook.Sheets[workbook.SheetNames[0]]);
    await exportHtmlToPdf(htmlTable, file.name, statusEl);
}

async function convertCsvToDocx(file, statusEl) {
    const text = await readFileAsText(file);
    await exportTextToDocx(text, file.name);
    updateStatus(statusEl, "✅ CSV convertido para DOCX com sucesso!");
}

// --- JSON CONVERSIONS ---
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

// --- TXT CONVERSIONS ---
async function convertTxtToDocx(file, statusEl) {
    const text = await readFileAsText(file);
    await exportTextToDocx(text, file.name);
    updateStatus(statusEl, "✅ TXT convertido para DOCX com sucesso!");
}

async function convertTxtToPdf(file, statusEl) {
    const text = await readFileAsText(file);
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

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

async function extractPdfPagesText(file) {
    const buffer = await readFileAsArrayBuffer(file);
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
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

// ÚNICA FUNÇÃO GLOBAL DE DOWNLOAD DE BLOB
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
        dropZoneText.innerHTML = `📄 Arquivo selecionado: <strong class="text-emerald-400">${file.name}</strong> (${fileSizeMB} MB)`;
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
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const newPdfDoc = await PDFLib.PDFDocument.create();

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            statusEl.innerText = `⏳ Processando página ${i} de ${pdfDoc.numPages}...`;

            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 }); // Escala balanceada de resolução

            // Renderiza a página em um canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            // Converte o canvas para imagem JPEG com a qualidade escolhida
            const imgDataUrl = canvas.toDataURL('image/jpeg', quality);

            // Incorpora a imagem no novo PDF
            const jpegImage = await newPdfDoc.embedJpg(imgDataUrl);
            const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
            newPage.drawImage(jpegImage, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height,
            });
        }

        // Salva o novo arquivo PDF comprimido
        const compressedBytes = await newPdfDoc.save();
        const finalBlob = new Blob([compressedBytes], { type: 'application/pdf' });
        const finalSize = finalBlob.size;

        // Calcula redução de tamanho
        const savedPercent = (((initialSize - finalSize) / initialSize) * 100).toFixed(1);
        const originalMB = (initialSize / (1024 * 1024)).toFixed(2);
        const finalMB = (finalSize / (1024 * 1024)).toFixed(2);

        // Download do arquivo
        const downloadUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = file.name.replace(/\.pdf$/i, '_comprimido.pdf');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        statusEl.className = "text-xs text-center text-emerald-400 mt-3 min-h-[1rem]";
        statusEl.innerText = `✅ Concluído! De ${originalMB}MB para ${finalMB}MB (${savedPercent}% de redução).`;

    } catch (error) {
        console.error(error);
        statusEl.className = "text-xs text-center text-red-400 mt-3 min-h-[1rem]";
        statusEl.innerText = "❌ Ocorreu um erro ao comprimir o PDF.";
    }
}



// Atualiza o ano dinamicamente no Rodapé
function updateFooterAndCounter() {
    // Atualiza o ano dinamicamente no Rodapé
    const yearEl = document.getElementById('footer-year');
    if (yearEl) {
        yearEl.innerText = new Date().getFullYear();
    }
}

// ==================== 1. GERADOR DE QR CODE ====================

function generateQRCode() {
    const input = document.getElementById('qr-input').value;
    const size = parseInt(document.getElementById('qr-size').value, 10);
    const container = document.getElementById('qr-code-container');
    const placeholder = document.getElementById('qr-placeholder');
    const downloadBtn = document.getElementById('qr-download');

    if (!input.trim()) {
        alert('Por favor, insira um texto ou URL.');
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
} // ==========================================
// UTILITÁRIOS
// ==========================================

// Formata tamanhos em bytes para KB ou MB
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Dispara o download automático do arquivo gerado
function downloadFile(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// Carrega um arquivo de imagem em um elemento <img> nativo do JS
function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Erro ao carregar a imagem. O arquivo pode estar corrompido ou o formato não é suportado pelo navegador.'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
        reader.readAsDataURL(file);
    });
}


// ==========================================
// 1. COMPRESSOR DE IMAGEM
// ==========================================

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

        // Cria o canvas com as dimensões originais da imagem
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');

        // Define fundo branco caso a imagem original possua transparência (PNG/WEBP)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Para compressão com qualidade ajustável, usamos JPEG ou WEBP
        const mimeType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';

        canvas.toBlob((blob) => {
            if (!blob) {
                statusEl.innerText = '❌ Falha ao processar a compressão da imagem.';
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
                statusEl.innerText = `✅ Concluído! (${newSize}). A imagem já estava bastante otimizada.`;
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

// Atualiza a interface quando um arquivo é selecionado ou solto
function updateConvertDropZoneUI(file) {
    const textEl = document.getElementById('drop-zone-img-text');
    if (file) {
        convertSelectedFile = file;
        textEl.innerHTML = `<span class="font-semibold text-emerald-400">${file.name}</span> (${formatFileSize(file.size)})`;
    } else {
        convertSelectedFile = null;
        textEl.innerHTML = `<span class="font-semibold text-emerald-400">Clique</span> ou arraste a imagem`;
    }
}

// Disparado ao selecionar o arquivo via <input type="file">
function handleImgConvertSelect() {
    const fileInput = document.getElementById('img-convert-file');
    if (fileInput.files && fileInput.files[0]) {
        updateConvertDropZoneUI(fileInput.files[0]);
    }
}

// Configuração dos Eventos de Drag & Drop
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone-img-convert');
    const fileInput = document.getElementById('img-convert-file');

    if (!dropZone) return;

    // Impede comportamentos padrão do navegador (ex: abrir a imagem diretamente na aba)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    // Efeitos visuais ao arrastar sobre a zona
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

    // Quando o arquivo é solto na área
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files && files.length > 0) {
            fileInput.files = files; // Sincroniza com o input
            updateConvertDropZoneUI(files[0]);
        }
    });
});

// Executa a conversão do formato
async function convertImage() {
    const targetFormat = document.getElementById('img-target-format').value;
    const statusEl = document.getElementById('img-convert-status');

    if (!convertSelectedFile) {
        statusEl.innerText = '❌ Por favor, selecione ou arraste uma imagem primeiro.';
        statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
        return;
    }

    try {
        statusEl.innerText = '⏳ Convertendo imagem...';
        statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';

        const img = await loadImageFromFile(convertSelectedFile);

        // Mapeamento de formatos para MIME Types do navegador
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

        // --- Caso Especial: Conversão para SVG Vetorial Básica ---
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

        // --- Processamento padrão em Canvas para Formatos Raster ---
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');

        // Se o formato de saída não suporta transparência (ex: JPG, BMP), preenche com fundo branco
        if (['jpg', 'bmp'].includes(targetFormat)) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
            if (!blob) {
                statusEl.innerText = `❌ O navegador não suporta a exportação direta para o formato .${targetFormat.toUpperCase()}.`;
                statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
                return;
            }

            const originalName = convertSelectedFile.name.substring(0, convertSelectedFile.name.lastIndexOf('.')) || 'imagem';
            const newFileName = `${originalName}.${targetFormat}`;

            downloadFile(blob, newFileName);

            statusEl.innerText = `✅ Imagem convertida para ${targetFormat.toUpperCase()} (${formatFileSize(blob.size)})!`;
            statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';
        }, targetMime, 0.92);

    } catch (err) {
        statusEl.innerText = `❌ ${err.message}`;
        statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
    }
}