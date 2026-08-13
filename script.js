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

// ==========================================
// 12. FUNÇÕES DE CONVERSÃO DE ARQUIVOS (Unificado)
// ==========================================

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
    statusEl.innerText = "Processando arquivo...";

    try {
        if (extension === 'docx') {
            if (targetFormat === 'pdf') await convertDocxToPdf(file, statusEl);
            else if (targetFormat === 'txt') await convertDocxToTxt(file, statusEl);
            else throw new Error('Formato de destino incompatível para arquivos Word (.docx).');
        } else if (['xlsx', 'xls'].includes(extension)) {
            if (targetFormat === 'csv') convertExcelToCsv(file, statusEl);
            else if (targetFormat === 'json') convertExcelToJson(file, statusEl);
            else throw new Error('Formato de destino incompatível para planilhas Excel.');
        } else if (extension === 'pdf') {
            if (targetFormat === 'txt') await convertPdfToText(file, statusEl);
            else if (targetFormat === 'json') await convertPdfToJson(file, statusEl);
            else throw new Error('Formato de destino incompatível para arquivos PDF.');
        } else if (['ppt', 'pptx'].includes(extension)) {
            statusEl.innerText = `Apresentação "${file.name}" carregada (${(file.size / 1024).toFixed(1)} KB). Pronta para compartilhamento.`;
        } else {
            throw new Error('Formato de arquivo não suportado.');
        }
    } catch (error) {
        console.error(error);
        statusEl.innerText = error.message || "Erro ao processar o arquivo.";
    }
}

// Word (.docx) para PDF
function convertDocxToPdf(file, statusEl) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = async function(event) {
            try {
                let result = await mammoth.convertToHtml({ arrayBuffer: event.target.result });
                let element = document.createElement('div');
                element.innerHTML = `<div style="font-family: Arial; padding: 20px;">${result.value}</div>`;

                let opt = {
                    margin: 1,
                    filename: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                };

                statusEl.innerText = "Gerando arquivo PDF...";
                await html2pdf().from(element).set(opt).save();
                statusEl.innerText = "Conversão para PDF concluída com sucesso!";
                resolve();
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
    });
}

// Word (.docx) para TXT
function convertDocxToTxt(file, statusEl) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = async function(event) {
            try {
                let result = await mammoth.extractRawText({ arrayBuffer: event.target.result });
                downloadBlob(result.value, file.name.replace(/\.[^/.]+$/, "") + ".txt", 'text/plain;charset=utf-8');
                statusEl.innerText = "Conversão para TXT concluída com sucesso!";
                resolve();
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
    });
}

// Excel (.xlsx, .xls) para CSV
function convertExcelToCsv(file, statusEl) {
    let reader = new FileReader();
    reader.onload = function(e) {
        try {
            let data = new Uint8Array(e.target.result);
            let workbook = XLSX.read(data, { type: 'array' });
            let firstSheetName = workbook.SheetNames[0];
            let worksheet = workbook.Sheets[firstSheetName];
            let csvOutput = XLSX.utils.sheet_to_csv(worksheet);

            downloadBlob(csvOutput, file.name.replace(/\.[^/.]+$/, "") + ".csv", 'text/csv;charset=utf-8;');
            statusEl.innerText = "Conversão para CSV concluída com sucesso!";
        } catch (err) { statusEl.innerText = "Erro ao processar planilha Excel."; }
    };
    reader.readAsArrayBuffer(file);
}

// Excel (.xlsx, .xls) para JSON
function convertExcelToJson(file, statusEl) {
    let reader = new FileReader();
    reader.onload = function(e) {
        try {
            let data = new Uint8Array(e.target.result);
            let workbook = XLSX.read(data, { type: 'array' });
            let firstSheetName = workbook.SheetNames[0];
            let worksheet = workbook.Sheets[firstSheetName];
            let jsonOutput = XLSX.utils.sheet_to_json(worksheet);

            downloadBlob(JSON.stringify(jsonOutput, null, 2), file.name.replace(/\.[^/.]+$/, "") + ".json", 'application/json;charset=utf-8;');
            statusEl.innerText = "Conversão para JSON concluída com sucesso!";
        } catch (err) { statusEl.innerText = "Erro ao converter planilha para JSON."; }
    };
    reader.readAsArrayBuffer(file);
}

// PDF para Texto (.txt)
function convertPdfToText(file, statusEl) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = async function(event) {
            try {
                let typedarray = new Uint8Array(event.target.result);
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                let pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    let page = await pdf.getPage(i);
                    let textContent = await page.getTextContent();
                    let pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += `--- Página ${i} ---\n${pageText}\n\n`;
                }

                downloadBlob(fullText, file.name.replace(/\.[^/.]+$/, "") + "_extraido.txt", 'text/plain;charset=utf-8');
                statusEl.innerText = "Texto extraído do PDF com sucesso!";
                resolve();
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
    });
}

// PDF para JSON (Texto Estruturado)
function convertPdfToJson(file, statusEl) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = async function(event) {
            try {
                let typedarray = new Uint8Array(event.target.result);
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                let pdf = await pdfjsLib.getDocument(typedarray).promise;
                let pdfData = { fileName: file.name, totalPages: pdf.numPages, pages: [] };

                for (let i = 1; i <= pdf.numPages; i++) {
                    let page = await pdf.getPage(i);
                    let textContent = await page.getTextContent();
                    let pageText = textContent.items.map(item => item.str).join(' ');
                    pdfData.pages.push({ pageNumber: i, content: pageText });
                }

                downloadBlob(JSON.stringify(pdfData, null, 2), file.name.replace(/\.[^/.]+$/, "") + ".json", 'application/json;charset=utf-8;');
                statusEl.innerText = "Dados do PDF convertidos para JSON com sucesso!";
                resolve();
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
    });
}

// Função utilitária para download automático de arquivos
function downloadBlob(content, filename, contentType) {
    let blob = new Blob([content], { type: contentType });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
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