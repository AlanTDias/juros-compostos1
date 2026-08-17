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

    selicEl.innerText = "14.00% a.a.";
    cdiEl.innerText = "14.71% a.a.";
    ipcaEl.innerText = "4.55% a.a.";
    poupancaEl.innerText = "6.17% a.a.";
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

// 8. Calculadora de Inflação
function calculateInflacao() {
    let valor = getVal('inf-valor');
    let taxa = parseFloat(document.getElementById('inf-taxa').value) / 100 || 0;
    let anos = parseInt(document.getElementById('inf-anos').value) || 0;

    let valorFuturo = valor * Math.pow(1 + taxa, anos);
    document.getElementById('inf-resultado').innerText = valorFuturo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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


// CENTRAL DE CONVERSÃO DE DOCUMENTOS
// Atualiza as opções do <select> dinamicamente com base no arquivo escolhido
function updateTargetFormats() {
    const fileInput = document.getElementById('file-input-universal');
    const selectFormat = document.getElementById('conversion-target-format');
    const statusEl = document.getElementById('status-universal');

    statusEl.innerText = "";
    selectFormat.innerHTML = '<option value="" disabled selected>Escolha o formato final...</option>';

    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    let options = [];

    if (ext === 'docx') {
        options = [
            { value: 'pdf', label: 'PDF (.pdf)' },
            { value: 'txt', label: 'Texto Simples (.txt)' }
        ];
    } else if (['xlsx', 'xls'].includes(ext)) {
        options = [
            { value: 'csv', label: 'Planilha CSV (.csv)' },
            { value: 'json', label: 'Dados JSON (.json)' }
        ];
    } else if (ext === 'pdf') {
        options = [
            { value: 'docx', label: 'Documento Word (.docx)' },
            { value: 'txt', label: 'Texto Extraído (.txt)' },
            { value: 'json', label: 'Estrutura JSON (.json)' }
        ];
    } else if (ext === 'csv') {
        options = [
            { value: 'json', label: 'Dados JSON (.json)' },
            { value: 'txt', label: 'Texto (.txt)' }
        ];
    } else if (['ppt', 'pptx'].includes(ext)) {
        statusEl.innerText = "ℹ️ Arquivos de apresentação (PPT/PPTX) têm limitações para conversão direta via navegador sem servidor.";
        options = [];
    } else {
        statusEl.innerText = "Formato de arquivo não suportado.";
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
    const targetFormat = document.getElementById('conversion-target-format').value;
    const statusEl = document.getElementById('status-universal');

    if (!fileInput.files.length) {
        alert('Por favor, selecione um arquivo.');
        return;
    }

    if (!targetFormat) {
        alert('Por favor, selecione o formato de saída desejado.');
        return;
    }

    const file = fileInput.files[0];
    const extension = file.name.split('.').pop().toLowerCase();
    statusEl.innerText = "⏳ Processando arquivo...";
    statusEl.className = "text-xs text-center text-emerald-400 mt-3 min-h-[1rem] animate-pulse";

    try {
        if (extension === 'docx') {
            if (targetFormat === 'pdf') await convertDocxToPdf(file, statusEl);
            else if (targetFormat === 'txt') await convertDocxToTxt(file, statusEl);
        } else if (['xlsx', 'xls'].includes(extension)) {
            if (targetFormat === 'csv') convertExcelToCsv(file, statusEl);
            else if (targetFormat === 'json') convertExcelToJson(file, statusEl);
        } else if (extension === 'pdf') {
            if (targetFormat === 'docx') await convertPdfToDocx(file, statusEl);
            else if (targetFormat === 'txt') await convertPdfToText(file, statusEl);
            else if (targetFormat === 'json') await convertPdfToJson(file, statusEl);
        } else if (extension === 'csv') {
            if (targetFormat === 'json') convertCsvToJson(file, statusEl);
            else if (targetFormat === 'txt') convertCsvToTxt(file, statusEl);
        } else {
            throw new Error('Formato não suportado ou sem suporte de conversão direto no navegador.');
        }
        statusEl.className = "text-xs text-center text-emerald-400 mt-3 min-h-[1rem]";
    } catch (error) {
        console.error(error);
        statusEl.innerText = "❌ " + (error.message || "Erro ao processar o arquivo.");
        statusEl.className = "text-xs text-center text-red-400 mt-3 min-h-[1rem]";
    }
}

// ------------------------------------------
// FUNÇÕES INDIVIDUAIS DE CONVERSÃO
// ------------------------------------------

// Configura os eventos de arraste ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById('drop-zone');

    if (dropZone) {
        // Previne comportamentos padrão do navegador (abrir a imagem/PDF na aba)
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Destaque visual ao arrastar o arquivo por cima
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('border-emerald-400', 'bg-gray-700', 'scale-[1.01]');
            }, false);
        });

        // Remove o destaque ao sair ou soltar
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('border-emerald-400', 'bg-gray-700', 'scale-[1.01]');
            }, false);
        });

        // Processa o arquivo quando o usuário solta na caixa
        dropZone.addEventListener('drop', handleDrop, false);
    }
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Manipula o evento de soltar o arquivo na caixa
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    const fileInput = document.getElementById('file-input-universal');

    if (files.length) {
        fileInput.files = files; // Atribui os arquivos ao input oculto
        handleFileSelect(); // Atualiza a interface e as opções do select
    }
}

// Atualiza o texto da caixa de arraste e chama o atualizador de formatos
function handleFileSelect() {
    const fileInput = document.getElementById('file-input-universal');
    const dropZoneText = document.getElementById('drop-zone-text');

    if (fileInput.files.length) {
        const file = fileInput.files[0];
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);

        // Exibe o nome e tamanho do arquivo selecionado
        dropZoneText.innerHTML = `📄 Arquivo selecionado: <strong class="text-emerald-400">${file.name}</strong> (${fileSizeMB} MB)`;
    } else {
        dropZoneText.innerHTML = `<span class="font-semibold text-emerald-400">Clique para selecionar</span> ou arraste e solte o arquivo aqui`;
    }

    // Chama a função existente que atualiza os formatos do <select>
    if (typeof updateTargetFormats === "function") {
        updateTargetFormats();
    }
}

// 1. DOCX para PDF
function convertDocxToPdf(file, statusEl) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const result = await mammoth.convertToHtml({ arrayBuffer: event.target.result });
                const element = document.createElement('div');
                element.innerHTML = `<div style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6; color: #111;">${result.value}</div>`;

                const opt = {
                    margin: 0.5,
                    filename: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                };

                statusEl.innerText = "⏳ Gerando arquivo PDF...";
                await html2pdf().from(element).set(opt).save();
                statusEl.innerText = "✅ Conversão para PDF concluída!";
                resolve();
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
    });
}

// 2. DOCX para TXT
function convertDocxToTxt(file, statusEl) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const result = await mammoth.extractRawText({ arrayBuffer: event.target.result });
                downloadBlob(result.value, file.name.replace(/\.[^/.]+$/, "") + ".txt", 'text/plain;charset=utf-8');
                statusEl.innerText = "✅ Conversão para TXT concluída!";
                resolve();
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
    });
}

// 3. Excel para CSV
function convertExcelToCsv(file, statusEl) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

            downloadBlob(csvOutput, file.name.replace(/\.[^/.]+$/, "") + ".csv", 'text/csv;charset=utf-8;');
            statusEl.innerText = "✅ Conversão para CSV concluída!";
        } catch (err) { statusEl.innerText = "❌ Erro ao processar planilha Excel."; }
    };
    reader.readAsArrayBuffer(file);
}

// 4. Excel para JSON
function convertExcelToJson(file, statusEl) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonOutput = XLSX.utils.sheet_to_json(worksheet);

            downloadBlob(JSON.stringify(jsonOutput, null, 2), file.name.replace(/\.[^/.]+$/, "") + ".json", 'application/json;charset=utf-8;');
            statusEl.innerText = "✅ Conversão para JSON concluída!";
        } catch (err) { statusEl.innerText = "❌ Erro ao converter planilha para JSON."; }
    };
    reader.readAsArrayBuffer(file);
}

// 5. PDF para TXT
function convertPdfToText(file, statusEl) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const typedarray = new Uint8Array(event.target.result);
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += `--- Página ${i} ---\n${pageText}\n\n`;
                }

                downloadBlob(fullText, file.name.replace(/\.[^/.]+$/, "") + "_extraido.txt", 'text/plain;charset=utf-8');
                statusEl.innerText = "✅ Texto extraído do PDF com sucesso!";
                resolve();
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
    });
}

// 6. PDF para JSON
function convertPdfToJson(file, statusEl) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const typedarray = new Uint8Array(event.target.result);
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                const pdfData = { fileName: file.name, totalPages: pdf.numPages, pages: [] };

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    pdfData.pages.push({ pageNumber: i, content: pageText });
                }

                downloadBlob(JSON.stringify(pdfData, null, 2), file.name.replace(/\.[^/.]+$/, "") + ".json", 'application/json;charset=utf-8;');
                statusEl.innerText = "✅ PDF convertido para JSON com sucesso!";
                resolve();
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
    });
}
// 7. PDF para Word (.docx)
function convertPdfToDocx(file, statusEl) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const typedarray = new Uint8Array(event.target.result);
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                const pdf = await pdfjsLib.getDocument(typedarray).promise;

                statusEl.innerText = "⏳ Extraindo páginas e reconstruindo parágrafos...";

                const docParagraphs = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();

                    // Agrupa elementos de texto que estão na mesma linha
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

                    // Adiciona cabeçalho de página se houver mais de 1 página
                    if (pdf.numPages > 1) {
                        docParagraphs.push(
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({
                                        text: `--- Página ${i} ---`,
                                        bold: true,
                                        color: "888888",
                                        size: 18
                                    })
                                ],
                                spacing: { before: 200, after: 100 }
                            })
                        );
                    }

                    // Transforma cada linha/parágrafo do PDF em parágrafo do Word
                    pageLines.forEach(lineText => {
                        if (lineText.trim().length > 0) {
                            docParagraphs.push(
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: lineText,
                                            font: "Arial",
                                            size: 22 // 11pt
                                        })
                                    ],
                                    spacing: { after: 120 }
                                })
                            );
                        }
                    });
                }

                statusEl.innerText = "⏳ Gerando arquivo .docx...";

                // Cria a estrutura interna do arquivo DOCX
                const doc = new docx.Document({
                    sections: [{
                        properties: {},
                        children: docParagraphs
                    }]
                });

                // Empacota o arquivo e dispara o download
                const blob = await docx.Packer.toBlob(doc);
                downloadBlob(blob, file.name.replace(/\.[^/.]+$/, "") + ".docx", 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

                statusEl.innerText = "✅ Conversão para Word (.docx) concluída com sucesso!";
                resolve();
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
    });
}

// 8. CSV para JSON
function convertCsvToJson(file, statusEl) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonOutput = XLSX.utils.sheet_to_json(worksheet);

            downloadBlob(JSON.stringify(jsonOutput, null, 2), file.name.replace(/\.[^/.]+$/, "") + ".json", 'application/json;charset=utf-8;');
            statusEl.innerText = "✅ CSV convertido para JSON com sucesso!";
        } catch (err) {
            statusEl.innerText = "❌ Erro ao converter CSV para JSON.";
        }
    };
    reader.readAsArrayBuffer(file);
}

// 9. CSV para TXT (Texto simples)
function convertCsvToTxt(file, statusEl) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const textContent = e.target.result;
            downloadBlob(textContent, file.name.replace(/\.[^/.]+$/, "") + ".txt", 'text/plain;charset=utf-8');
            statusEl.innerText = "✅ CSV convertido para TXT com sucesso!";
        } catch (err) {
            statusEl.innerText = "❌ Erro ao converter CSV para TXT.";
        }
    };
    reader.readAsText(file, 'UTF-8');
}

// Utilitário global para download de arquivos
function downloadBlob(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
// Exibe o nome do arquivo selecionado no card do compressor
function handleCompressFileSelect() {
    const input = document.getElementById('file-input-compress');
    const dropText = document.getElementById('drop-zone-compress-text');

    if (input.files.length > 0) {
        const file = input.files[0];
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        dropText.innerHTML = `<span class="font-semibold text-emerald-400">${file.name}</span> (${sizeMB} MB)`;
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


//  FUNÇÕES DE IMAGEM: Compressor e IA Fundo

// Função para Comprimir Imagens
async function compressImage() {
    const fileInput = document.getElementById('img-compress-file');
    const qualityValue = document.getElementById('img-compress-range').value;
    const statusEl = document.getElementById('compress-status');

    if (!fileInput.files.length) {
        alert('Por favor, selecione uma imagem para comprimir.');
        return;
    }

    const file = fileInput.files[0];
    const originalSize = (file.size / 1024 / 1024).toFixed(2);
    statusEl.innerText = "Comprimindo a imagem, aguarde...";
    statusEl.className = "text-xs text-center text-emerald-400 mt-3 min-h-[1rem]";

    const options = {
        maxSizeMB: qualityValue < 50 ? 0.5 : 2, // Ajusta o limite dependendo da qualidade
        initialQuality: qualityValue / 100, // Converte 80% para 0.8
        useWebWorker: true
    };

    try {
        // Usa a biblioteca browser-image-compression
        const compressedFile = await imageCompression(file, options);
        const newSize = (compressedFile.size / 1024 / 1024).toFixed(2);

        downloadBlob(compressedFile, "comprimida_" + file.name, compressedFile.type);

        statusEl.innerText = `Sucesso! Tamanho reduzido de ${originalSize}MB para ${newSize}MB.`;
    } catch (error) {
        console.error(error);
        statusEl.innerText = "Erro ao comprimir a imagem.";
        statusEl.className = "text-xs text-center text-red-400 mt-3 min-h-[1rem]";
    }
}

// Função para Remover Fundo (IA)
async function removeBackground() {
    const fileInput = document.getElementById('img-bg-file');
    const statusEl = document.getElementById('bg-status');

    if (!fileInput.files.length) {
        alert('Por favor, selecione uma imagem para remover o fundo.');
        return;
    }

    const file = fileInput.files[0];
    statusEl.innerText = "Iniciando Inteligência Artificial... (Pode demorar na primeira vez)";
    statusEl.className = "text-xs text-center text-emerald-400 mt-3 min-h-[1rem] animate-pulse";

    try {
        // Usa a biblioteca @imgly/background-removal
        const blob = await imglyRemoveBackground(file);

        // Mantém a extensão como PNG já que terá fundo transparente
        const fileName = "sem_fundo_" + file.name.split('.')[0] + ".png";
        downloadBlob(blob, fileName, "image/png");

        statusEl.className = "text-xs text-center text-emerald-400 mt-3 min-h-[1rem]";
        statusEl.innerText = "Fundo removido e download concluído com sucesso!";
    } catch (error) {
        console.error(error);
        statusEl.innerText = "Erro ao remover o fundo da imagem. Tente outra imagem mais leve.";
        statusEl.className = "text-xs text-center text-red-400 mt-3 min-h-[1rem]";
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