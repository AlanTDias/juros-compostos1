// INDICADORES DE MERCADO em tempo real (Selic, CDI, IPCA, dólar, poupança): páginas Início e Comparador de Investimentos
//
// fetchMarketIndicators() busca as APIs públicas (BCB e AwesomeAPI) uma única vez por página, atualiza os
// elementos da tela SE eles existirem (a página Início os tem) e guarda o resultado em `indicadoresMercado`
// para outras ferramentas usarem (o Comparador de Investimentos lê CDI e Selic daqui).
// Cada indicador que falhar mantém um valor padrão marcado como "⚠️ estimado" (ok[nome] = false).

const INDICADORES_PADRAO = { selic: 14.00, cdi: 13.90, ipca: 4.44, poupanca: 8.34, dolar: 5.50 };
let indicadoresMercado = null;      // { selic, cdi, ipca, poupanca, dolar, ok: { selic: true/false, ... } }
let indicadoresEmBusca = null;      // promessa em andamento (evita buscar duas vezes)

async function buscarJson(url) {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
    return resposta.json();
}

async function fetchMarketIndicators() {
    if (indicadoresEmBusca) return indicadoresEmBusca;
    indicadoresEmBusca = (async () => {
        const valores = { ...INDICADORES_PADRAO };
        const ok = { selic: false, cdi: false, ipca: false, poupanca: false, dolar: false };

        const tentar = async (nome, fn) => {
            try {
                const numero = await fn();
                if (isFinite(numero)) { valores[nome] = numero; ok[nome] = true; }
            } catch (erro) {
                console.warn(`Aviso: Não foi possível atualizar ${nome} em tempo real.`);
            }
        };
        const bcb = serie => async () => {
            const dados = await buscarJson(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados/ultimos/1?formato=json`);
            return dados && dados[0] && dados[0].valor ? parseFloat(dados[0].valor) : NaN;
        };

        await Promise.all([
            tentar('dolar', async () => {
                const dados = await buscarJson('https://economia.awesomeapi.com.br/json/last/USD-BRL');
                return dados && dados.USDBRL ? parseFloat(dados.USDBRL.bid) : NaN;
            }),
            tentar('selic', bcb(432)),
            tentar('cdi', bcb(4389)),
            tentar('ipca', bcb(13522)),
            tentar('poupanca', async () => {
                const mensal = (await bcb(195)()) / 100; // a série 195 é mensal: converte para ano
                return (Math.pow(1 + mensal, 12) - 1) * 100;
            })
        ]);

        indicadoresMercado = { ...valores, ok, atualizadoEm: new Date() };
        mostrarIndicadoresNaTela();
        return indicadoresMercado;
    })();
    return indicadoresEmBusca;
}

// Só faz algo na página que tem os cartões de indicadores (Início)
function mostrarIndicadoresNaTela() {
    const dados = indicadoresMercado;
    const dateSpan = document.getElementById('indicadores-data');
    if (!dados || !dateSpan) return;

    const pct = v => `${v.toFixed(2)}% a.a.`;
    const linhas = [
        ['ind-selic', pct(dados.selic), dados.ok.selic],
        ['ind-cdi', pct(dados.cdi), dados.ok.cdi],
        ['ind-ipca', pct(dados.ipca), dados.ok.ipca],
        ['ind-dolar', dados.dolar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), dados.ok.dolar],
        ['ind-poupanca', pct(dados.poupanca), dados.ok.poupanca]
    ];
    linhas.forEach(([id, texto, ok]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = ok ? texto : texto + ' ⚠️ estimado';
        el.title = ok ? '' : 'Não foi possível buscar o valor em tempo real; exibindo estimativa.';
    });

    const hoje = dados.atualizadoEm;
    dateSpan.innerText = `Atualizado em: ${hoje.toLocaleDateString('pt-BR')} às ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
