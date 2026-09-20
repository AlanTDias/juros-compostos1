// UTILITÁRIOS: gerador de senha, calculadora de porcentagem e conversor de unidades
// (Gerado na divisão do script.js único; agora este arquivo é editado diretamente.)

let senhaJaGerada = false;
let senhaAtual = '';

function inteiroAleatorio(max) {
    // Sorteio sem viés (rejeita valores que distorceriam o módulo)
    const limite = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    let x;
    do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limite);
    return x % max;
}

function gerarSenha() {
    senhaJaGerada = true;
    const tamanho = parseInt(document.getElementById('senha-tamanho').value) || 16;
    const evitar = document.getElementById('senha-ambiguos').checked ? /[0O1lI]/g : null;
    const limpa = txt => (evitar ? txt.replace(evitar, '') : txt);
    const conjuntos = [];
    if (document.getElementById('senha-maiusculas').checked) conjuntos.push(limpa('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
    if (document.getElementById('senha-minusculas').checked) conjuntos.push(limpa('abcdefghijklmnopqrstuvwxyz'));
    if (document.getElementById('senha-numeros').checked) conjuntos.push(limpa('0123456789'));
    if (document.getElementById('senha-simbolos').checked) conjuntos.push('!@#$%^&*()-_=+[]{};:,.<>?/');

    const resultado = document.getElementById('senha-resultado');
    if (!conjuntos.length) {
        senhaAtual = '';
        resultado.textContent = 'Selecione ao menos um tipo de caractere';
        atualizarForcaSenha(0, 0);
        return;
    }

    const todos = conjuntos.join('');
    const chars = conjuntos.map(c => c[inteiroAleatorio(c.length)]); // garante ao menos um de cada tipo escolhido
    while (chars.length < tamanho) chars.push(todos[inteiroAleatorio(todos.length)]);
    for (let i = chars.length - 1; i > 0; i--) { // embaralha (Fisher-Yates)
        const j = inteiroAleatorio(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    senhaAtual = chars.slice(0, Math.max(tamanho, conjuntos.length)).join('');
    resultado.textContent = senhaAtual;
    atualizarForcaSenha(senhaAtual.length, todos.length);
}

function atualizarForcaSenha(tamanho, tamanhoDoConjunto) {
    const bits = tamanho && tamanhoDoConjunto ? tamanho * Math.log2(tamanhoDoConjunto) : 0;
    let texto = '—', classe = 'bg-gray-500';
    if (bits > 0) {
        if (bits < 40) { texto = 'Fraca'; classe = 'bg-red-500'; }
        else if (bits < 60) { texto = 'Média'; classe = 'bg-yellow-500'; }
        else if (bits < 80) { texto = 'Forte'; classe = 'bg-green-500'; }
        else { texto = 'Muito forte'; classe = 'bg-cyan-500'; }
    }
    document.getElementById('senha-forca-texto').textContent = texto;
    const barra = document.getElementById('senha-forca-barra');
    barra.className = 'h-full rounded-full transition-all ' + classe;
    barra.style.width = Math.min(100, (bits / 100) * 100) + '%';
    document.getElementById('senha-entropia').textContent = bits ? `Cerca de ${Math.round(bits)} bits de entropia.` : '';
}

async function copiarSenha() {
    if (!senhaAtual) return;
    try {
        await navigator.clipboard.writeText(senhaAtual);
    } catch (e) {
        const tmp = document.createElement('textarea'); // alternativa para navegadores sem a API de área de transferência
        tmp.value = senhaAtual;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        tmp.remove();
    }
    mostrarToast('📋 Senha copiada!', { duracao: 2500 });
}

// ---------- Calculadora de porcentagem ----------
function calcularPorcentagens() {
    const fmt = v => isFinite(v) ? v.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : '—';
    const pct = v => isFinite(v) ? v.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) + '%' : '—';
    const set = (id, txt) => { document.getElementById(id).innerText = txt; };

    const x1 = lerNumero('pct1-x'), y1 = lerNumero('pct1-y');
    set('pct1-res', fmt(x1 / 100 * y1));

    const x2 = lerNumero('pct2-x'), y2 = lerNumero('pct2-y');
    set('pct2-res', y2 === 0 ? '—' : pct(x2 / y2 * 100));

    const y3 = lerNumero('pct3-y'), x3 = lerNumero('pct3-x');
    set('pct3-mais', fmt(y3 * (1 + x3 / 100)));
    set('pct3-menos', fmt(y3 * (1 - x3 / 100)));

    const a4 = lerNumero('pct4-a'), b4 = lerNumero('pct4-b');
    if (a4 === 0) set('pct4-res', '—');
    else {
        const v = (b4 - a4) / Math.abs(a4) * 100;
        set('pct4-res', (v > 0 ? '+' : '') + pct(v) + (v > 0 ? ' (aumento)' : v < 0 ? ' (queda)' : ''));
    }

    const x5 = lerNumero('pct5-x'), y5 = lerNumero('pct5-y');
    set('pct5-res', y5 === 0 ? '—' : fmt(x5 / (y5 / 100)));
}

// ---------- Conversor de unidades ----------
// Cada categoria: fator para a unidade-base (multiplicar para chegar na base). Temperatura é tratada à parte.
const UNIDADES = {
    'Comprimento': { 'metro (m)': 1, 'quilômetro (km)': 1000, 'centímetro (cm)': 0.01, 'milímetro (mm)': 0.001, 'milha (mi)': 1609.344, 'jarda (yd)': 0.9144, 'pé (ft)': 0.3048, 'polegada (in)': 0.0254 },
    'Massa': { 'quilograma (kg)': 1, 'grama (g)': 0.001, 'miligrama (mg)': 0.000001, 'tonelada (t)': 1000, 'libra (lb)': 0.45359237, 'onça (oz)': 0.028349523125 },
    'Volume': { 'litro (L)': 1, 'mililitro (mL)': 0.001, 'metro cúbico (m³)': 1000, 'galão americano (gal)': 3.785411784, 'xícara (240 mL)': 0.24, 'colher de sopa (15 mL)': 0.015 },
    'Área': { 'metro quadrado (m²)': 1, 'quilômetro quadrado (km²)': 1000000, 'hectare (ha)': 10000, 'acre': 4046.8564224, 'pé quadrado (ft²)': 0.09290304 },
    'Velocidade': { 'metro por segundo (m/s)': 1, 'quilômetro por hora (km/h)': 1 / 3.6, 'milha por hora (mph)': 0.44704, 'nó (kn)': 1852 / 3600 },
    'Tempo': { 'segundo (s)': 1, 'minuto (min)': 60, 'hora (h)': 3600, 'dia': 86400, 'semana': 604800 },
    'Dados digitais': { 'bit (b)': 0.125, 'byte (B)': 1, 'kilobyte (KB)': 1024, 'megabyte (MB)': 1048576, 'gigabyte (GB)': 1073741824, 'terabyte (TB)': 1099511627776 },
    'Temperatura': { 'Celsius (°C)': 'C', 'Fahrenheit (°F)': 'F', 'Kelvin (K)': 'K' }
};
let unidadesIniciadas = false;

function iniciarUnidades() {
    if (unidadesIniciadas) return;
    unidadesIniciadas = true;
    const sel = document.getElementById('un-categoria');
    Object.keys(UNIDADES).forEach(nome => {
        const op = document.createElement('option');
        op.value = nome; op.textContent = nome;
        sel.appendChild(op);
    });
    atualizarUnidades();
}

function atualizarUnidades() {
    const cat = document.getElementById('un-categoria').value;
    const nomes = Object.keys(UNIDADES[cat]);
    ['un-de', 'un-para'].forEach((id, idx) => {
        const sel = document.getElementById(id);
        sel.innerHTML = '';
        nomes.forEach(n => {
            const op = document.createElement('option');
            op.value = n; op.textContent = n;
            sel.appendChild(op);
        });
        sel.selectedIndex = Math.min(idx, nomes.length - 1);
    });
    converterUnidade();
}

function converterTemperatura(v, de, para) {
    const paraK = { C: x => x + 273.15, F: x => (x - 32) * 5 / 9 + 273.15, K: x => x };
    const deK = { C: k => k - 273.15, F: k => (k - 273.15) * 9 / 5 + 32, K: k => k };
    return deK[para](paraK[de](v));
}

function converterUnidade() {
    const cat = document.getElementById('un-categoria').value;
    if (!cat) return;
    const valor = lerNumero('un-valor');
    const de = document.getElementById('un-de').value;
    const para = document.getElementById('un-para').value;
    const tabela = UNIDADES[cat];
    const resultado = cat === 'Temperatura'
        ? converterTemperatura(valor, tabela[de], tabela[para])
        : valor * tabela[de] / tabela[para];
    document.getElementById('un-resultado').value = isFinite(resultado)
        ? resultado.toLocaleString('pt-BR', { maximumSignificantDigits: 14 })
        : '—';
}

function inverterUnidades() {
    const de = document.getElementById('un-de'), para = document.getElementById('un-para');
    [de.value, para.value] = [para.value, de.value];
    converterUnidade();
}
// ==========================================
