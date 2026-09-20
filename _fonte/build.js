// Gera as páginas do site a partir de _fonte/base.html + _fonte/conteudo/*.html + _fonte/paginas.json.
//
// Uso (na pasta do site):   node _fonte/build.js
//
// O que ele faz:
//   - monta uma página HTML por ferramenta (título, descrição, canonical, Open Graph, JSON-LD, scripts só do que a página usa);
//   - gera sitemap.xml e robots.txt;
//   - carimba os arquivos de js/ com uma versão (?v=...) para o navegador buscar sempre a mais nova;
//   - confere que as listas de páginas do paginas.json e do js/core.js batem e que não sobrou {{marcador}}.
// O CSS e o JS (style.css, js/*.js) são editados direto; só o HTML é gerado.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const raiz = path.resolve(__dirname, '..');
const lerArq = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const config = JSON.parse(lerArq(path.join(__dirname, 'paginas.json')));
const base = lerArq(path.join(__dirname, 'base.html'));
const paginas = config.paginas;
const problemas = [];

// ---------- versão dos arquivos JS (muda quando qualquer um muda) ----------
const jsDir = path.join(raiz, 'js');
const hash = crypto.createHash('md5');
fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).sort().forEach(f => hash.update(fs.readFileSync(path.join(jsDir, f))));
const versao = hash.digest('hex').slice(0, 8);

// ---------- confere o menu do core.js com o paginas.json ----------
const core = lerArq(path.join(jsDir, 'core.js'));
const doCore = {};
for (const m of core.matchAll(/\{ id: '([\w-]+)', nome: '[^']*', color: '[\w]+', pagina: '([^']+)' \}/g)) doCore[m[1]] = m[2];
for (const p of paginas) {
    if (doCore[p.id] !== p.arquivo) problemas.push(`Menu do core.js diverge do paginas.json em "${p.id}": core=${doCore[p.id]} json=${p.arquivo}`);
}
for (const id of Object.keys(doCore)) if (!paginas.some(p => p.id === id)) problemas.push(`core.js tem a aba "${id}" que não está no paginas.json`);

// ---------- ícones das ferramentas: lidos do js/core.js (ICONES_ABAS), os MESMOS do menu do topo ----------
const iconesPorId = {};
{
    const inicio = core.indexOf('const ICONES_ABAS = {');
    const fim = core.indexOf('};', inicio);
    for (const m of core.slice(inicio, fim).matchAll(/'([\w-]+)':\s*'(<[^']*)'/g)) iconesPorId[m[1]] = m[2];
}
const iconeSvg = (id, px) => `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0">${iconesPorId[id] || ''}</svg>`;
for (const p of paginas) if (p.id !== 'home' && !iconesPorId[p.id]) problemas.push(`Sem ícone no core.js (ICONES_ABAS) para "${p.id}"`);
// ---------- peças reutilizáveis ----------
const urlDa = p => `${config.dominio}/${p.arquivo === 'index.html' ? '' : p.arquivo}`;

const linksRodape = `<nav aria-label="Todas as ferramentas" class="mb-4">
                <ul class="flex flex-wrap justify-center gap-x-4 gap-y-1">
${paginas.filter(p => p.id !== 'home').map(p => `                    <li><a href="${p.arquivo}" class="hover:text-emerald-400 underline-offset-2 hover:underline">${esc(p.resumo.replace(/\.$/, ''))}</a></li>`).join('\n')}
                </ul>
            </nav>`;

const cartoesHome = `
<section aria-labelledby="todas-ferramentas" class="mt-2">
    <h2 id="todas-ferramentas" class="text-lg font-bold text-emerald-400 mb-3">Todas as ferramentas</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
${paginas.filter(p => p.id !== 'home').map(p => `        <a href="${p.arquivo}" class="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg">
            <span class="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">${iconeSvg(p.id, 20)}</span>
            <span class="min-w-0">
                <span class="block font-semibold text-gray-100">${esc(p.titulo.replace(/ \| ExCalc$/, ''))}</span>
                <span class="block mt-1 text-xs text-gray-400">${esc(p.resumo)}</span>
            </span>
        </a>`).join('\n')}
    </div>
</section>
`;

function jsonLd(p) {
    const url = urlDa(p);
    const grafo = [];
    if (p.id === 'home') {
        grafo.push({ '@type': 'WebSite', name: config.nomeDoSite, url: config.dominio + '/', inLanguage: 'pt-BR', description: p.descricao });
    } else {
        grafo.push({
            '@type': 'WebApplication', name: p.titulo.replace(/ \| ExCalc$/, ''), url, description: p.descricao,
            applicationCategory: p.categoria, operatingSystem: 'Qualquer', inLanguage: 'pt-BR',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
            isPartOf: { '@type': 'WebSite', name: config.nomeDoSite, url: config.dominio + '/' }
        });
        grafo.push({
            '@type': 'BreadcrumbList', itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Início', item: config.dominio + '/' },
                { '@type': 'ListItem', position: 2, name: p.titulo.replace(/ \| ExCalc$/, ''), item: url }
            ]
        });
    }
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo }).replace(/</g, '\\u003c');
}

function metaDa(p) {
    const url = urlDa(p);
    const imagem = `${config.dominio}/og-image.png`;
    return [
        `<meta name="description" content="${esc(p.descricao)}">`,
        `<link rel="canonical" href="${url}">`,
        `<meta name="robots" content="index, follow, max-image-preview:large">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:locale" content="pt_BR">`,
        `<meta property="og:site_name" content="${config.nomeDoSite}">`,
        `<meta property="og:title" content="${esc(p.titulo)}">`,
        `<meta property="og:description" content="${esc(p.descricao)}">`,
        `<meta property="og:url" content="${url}">`,
        `<meta property="og:image" content="${imagem}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${esc(p.titulo)}">`,
        `<meta name="twitter:description" content="${esc(p.descricao)}">`,
        `<meta name="twitter:image" content="${imagem}">`,
        `<script type="application/ld+json">${jsonLd(p)}</script>`
    ].join('\n    ');
}

function scriptsDa(p) {
    const linhas = ['<!-- Scripts: só o que esta página usa. O núcleo (core.js) vem primeiro. -->'];
    (p.externos || []).forEach(u => linhas.push(`    <script src="${u}" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`));
    ['core.js', ...(p.scripts || [])].forEach(f => {
        if (!fs.existsSync(path.join(jsDir, f))) problemas.push(`${p.id}: js/${f} não existe`);
        linhas.push(`    <script src="js/${f}?v=${versao}"></script>`);
    });
    return linhas.join('\n');
}

// ---------- gera cada página ----------
const hoje = new Date().toISOString().slice(0, 10);
const nomes = new Set();
for (const p of paginas) {
    const arqConteudo = path.join(__dirname, 'conteudo', p.id + '.html');
    if (!fs.existsSync(arqConteudo)) { problemas.push(`Falta _fonte/conteudo/${p.id}.html`); continue; }
    let conteudo = lerArq(arqConteudo).trimEnd();

    // texto de apresentação logo abaixo do <h1> (ajuda quem chega pelo Google), se a página ainda não tiver
    if (p.intro && !/<\/h1>\s*<p class="text-sm text-gray-400 -mt-3">/.test(conteudo)) {
        conteudo = conteudo.replace(/(<\/h1>)/, `$1\n            <p class="text-sm text-gray-400 -mt-3">${esc(p.intro)}</p>`);
    }
    if (p.id === 'home') conteudo = conteudo.replace(/\s*<\/section>\s*$/, `\n${cartoesHome}</section>`);

    if (p.titulo.length > 70) problemas.push(`${p.id}: título com ${p.titulo.length} caracteres (ideal até ~60-70)`);
    if (p.descricao.length > 165) problemas.push(`${p.id}: descrição com ${p.descricao.length} caracteres (ideal até ~160)`);
    if (nomes.has(p.arquivo)) problemas.push(`arquivo repetido: ${p.arquivo}`);
    nomes.add(p.arquivo);

    const pagina = base
        .replace('{{TITLE}}', esc(p.titulo))
        .replace('{{META}}', metaDa(p))
        .replace('{{ABA}}', p.id)
        .replace('{{SUGESTOES_KEY}}', esc((config.sugestoes && config.sugestoes.accessKey) || ''))
        .replace('{{RODAPE_LINKS}}', linksRodape)
        .replace('{{SCRIPTS}}', scriptsDa(p))
        .replace('{{CONTEUDO}}', () => conteudo);

    const sobra = pagina.match(/\{\{[A-Z_]+\}\}/);
    if (sobra) problemas.push(`${p.id}: marcador sem substituir ${sobra[0]}`);
    if ((conteudo.match(/<h1\b/g) || []).length !== 1) problemas.push(`${p.id}: deveria ter exatamente um <h1>`);

    fs.writeFileSync(path.join(raiz, p.arquivo), pagina.replace(/\n/g, '\r\n'), 'utf8');
}

// ---------- sitemap.xml e robots.txt ----------
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paginas.map(p => `  <url>
    <loc>${urlDa(p)}</loc>
    <lastmod>${hoje}</lastmod>
    <priority>${p.prioridade || '0.5'}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(raiz, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(raiz, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${config.dominio}/sitemap.xml\n`, 'utf8');

// confere se cada página carrega os scripts das funções que usa (roda como script separado, imprime só se achar problema)
const dep = require('child_process').spawnSync(process.execPath, [path.join(__dirname, 'verificar-dependencias.js'), raiz], { encoding: 'utf8' });
if (dep.status !== 0) problemas.push('Dependências de script:\n' + dep.stdout.trim());

console.log(`Páginas geradas: ${paginas.length} | versão dos scripts: ${versao} | sitemap.xml e robots.txt atualizados`);
if (problemas.length) {
    console.log('\nATENÇÃO:\n - ' + problemas.join('\n - '));
    process.exitCode = 1;
}
