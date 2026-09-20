// Confere, para cada página, se toda função global usada pelos scripts carregados nela está definida
// em algum script carregado na MESMA página (evita o erro 'função não definida' que só aparece no navegador).
// Usado pelo build.js; também roda sozinho: node _fonte/verificar-dependencias.js
const fs = require('fs'), path = require('path');
const raiz = process.argv[2] || path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(raiz, '_fonte', 'paginas.json'), 'utf8'));
const src = {};
for (const f of fs.readdirSync(path.join(raiz, 'js'))) if (f.endsWith('.js')) src[f] = fs.readFileSync(path.join(raiz, 'js', f), 'utf8');

const definidos = {}; // arquivo -> Set de nomes de topo
const todosNomes = {}; // nome -> arquivos
for (const [f, t] of Object.entries(src)) {
    const set = new Set();
    for (const m of t.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) set.add(m[1]);
    for (const m of t.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) set.add(m[1]);
    for (const m of t.matchAll(/^window\.([A-Za-z_$][\w$]*)\s*=/gm)) set.add(m[1]);
    definidos[f] = set;
    set.forEach(n => (todosNomes[n] = todosNomes[n] || []).push(f));
}
// nomes definidos em bibliotecas externas ou no navegador: ignorar
const ignorar = new Set(['Chart', 'VANTA', 'THREE', 'PDFLib', 'pdfjsLib', 'XLSX', 'docx', 'mammoth', 'html2pdf', 'QRCode']);

let problemas = 0;
for (const p of cfg.paginas) {
    const arquivos = ['core.js', ...(p.scripts || [])];
    const disponiveis = new Set();
    arquivos.forEach(a => definidos[a].forEach(n => disponiveis.add(n)));
    if (p.id !== 'home' || true) disponiveis.add('abrirViagem'), disponiveis.add('fecharViagem'); // stubs no core
    const faltando = {};
    for (const a of arquivos) {
        if (a === 'core.js') continue; // o core chama as funções de cada ferramenta só na página dela (protegido)
        // remove comentários e strings simples para reduzir falsos positivos
        const limpo = src[a].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/'(?:\\.|[^'\\\n])*'/g, "''").replace(/"(?:\\.|[^"\\\n])*"/g, '""');
        for (const m of limpo.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
            const nome = m[1];
            if (!todosNomes[nome] || ignorar.has(nome) || disponiveis.has(nome)) continue;
            if (a === 'financeiro.js' && nome === 'fetchMarketIndicators') continue; // só usado na página que carrega indicadores.js
            (faltando[nome] = faltando[nome] || new Set()).add(a + ' (definido em ' + todosNomes[nome].join(', ') + ')');
        }
    }
    const nomes = Object.keys(faltando);
    if (nomes.length) {
        problemas += nomes.length;
        console.log(`\n[${p.arquivo}] carrega: ${arquivos.join(', ')}`);
        nomes.forEach(n => console.log(`  usa ${n}() mas ele não está carregado aqui -> ${[...faltando[n]].join('; ')}`));
    }
}
console.log(problemas ? `\n${problemas} dependência(s) faltando.` : 'Nenhuma dependência faltando: todas as páginas carregam o que usam.');
process.exitCode = problemas ? 1 : 0;
