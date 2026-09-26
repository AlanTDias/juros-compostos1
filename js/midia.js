// IMAGENS E QR CODE: compressão, conversão, editor rápido, imagens em PDF e gerador de QR Code
// (Gerado na divisão do script.js único; agora este arquivo é editado diretamente.)

async function generateQRCode() {
    const input = document.getElementById('qr-input').value;
    const size = parseInt(document.getElementById('qr-size').value, 10);
    const container = document.getElementById('qr-code-container');
    const placeholder = document.getElementById('qr-placeholder');
    const downloadBtn = document.getElementById('qr-download');

    if (!input.trim()) {
        alert('Por favor, insira um texto ou URL.');
        return;
    }

    try {
        await carregarLib('qrcode');
    } catch (error) {
        alert(error.message);
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
}

// ==========================================

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Erro ao carregar a imagem.'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
        reader.readAsDataURL(file);
    });
}

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

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const mimeType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';

        canvas.toBlob((blob) => {
            if (!blob) {
                statusEl.innerText = '❌ Falha ao processar a compressão.';
                statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
                return;
            }

            const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || 'imagem';

            // Recomprimir pode ENTREGAR UM ARQUIVO MAIOR que o original (ex.: imagem já otimizada, ou PNG
            // com transparência virando JPEG com fundo branco preenchido) — nesse caso baixa o original em
            // vez do blob novo, mesma proteção que já existe no compressor de PDF (compressPDF).
            const jaOtimizada = blob.size >= file.size;
            const arquivoFinal = jaOtimizada ? file : blob;
            const newFileName = jaOtimizada ? file.name : `${originalName}_comprimida.${extensaoDoBlob(blob, extension.slice(1))}`;

            downloadFile(arquivoFinal, newFileName);

            const origSize = formatFileSize(file.size);
            const newSize = formatFileSize(blob.size);
            const reduction = (((file.size - blob.size) / file.size) * 100).toFixed(1);

            if (!jaOtimizada) {
                statusEl.innerText = `✅ Concluído! ${origSize} ➔ ${newSize} (${reduction}% menor)`;
                statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';
            } else {
                statusEl.innerText = `ℹ️ Esta imagem já é leve (${origSize}): comprimir aumentaria o arquivo, então o original foi mantido.`;
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

function updateConvertDropZoneUI(file) {
    const textEl = document.getElementById('drop-zone-img-text');
    if (file) {
        convertSelectedFile = file;
        // CORREÇÃO DE SEGURANÇA NA INTERPOLAÇÃO DE NOME DE ARQUIVO
        textEl.innerHTML = `<span class="font-semibold text-emerald-400">${escapeHtml(file.name)}</span> (${formatFileSize(file.size)})`;
    } else {
        convertSelectedFile = null;
        textEl.innerHTML = `<span class="font-semibold text-emerald-400">Clique</span> ou arraste a imagem`;
    }
}

function handleImgConvertSelect() {
    const fileInput = document.getElementById('img-convert-file');
    if (fileInput.files && fileInput.files[0]) {
        updateConvertDropZoneUI(fileInput.files[0]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone-img-convert');
    const fileInput = document.getElementById('img-convert-file');

    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

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

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            fileInput.files = files;
            updateConvertDropZoneUI(files[0]);
        }
    });
});

// Extensão pelo tipo REAL que o navegador gerou: `canvas.toBlob` cai para PNG, sem avisar, quando não sabe gerar
// o formato pedido (ex.: WEBP no Safari) — sem isso o arquivo saía PNG com extensão .webp.
function extensaoDoBlob(blob, pedida) {
    return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[blob.type] || pedida;
}

// Nenhum navegador gera BMP/TIFF/GIF pelo canvas (toBlob devolvia PNG com a extensão trocada); os 3 abaixo montam
// o arquivo byte a byte a partir dos pixels do canvas.

// BMP 24 bits sem compressão: linhas de baixo para cima, cada uma completada até múltiplo de 4 bytes.
function canvasParaBmp(canvas) {
    const w = canvas.width, h = canvas.height;
    const px = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const linha = Math.ceil(w * 3 / 4) * 4;
    const tamDados = linha * h;
    const buf = new ArrayBuffer(54 + tamDados);
    const v = new DataView(buf);
    v.setUint8(0, 0x42); v.setUint8(1, 0x4D);
    v.setUint32(2, 54 + tamDados, true);
    v.setUint32(10, 54, true);
    v.setUint32(14, 40, true);
    v.setInt32(18, w, true);
    v.setInt32(22, h, true);
    v.setUint16(26, 1, true);
    v.setUint16(28, 24, true);
    v.setUint32(34, tamDados, true);
    v.setInt32(38, 2835, true);
    v.setInt32(42, 2835, true);
    const bytes = new Uint8Array(buf);
    for (let y = 0; y < h; y++) {
        let o = 54 + (h - 1 - y) * linha;
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            bytes[o++] = px[i + 2];
            bytes[o++] = px[i + 1];
            bytes[o++] = px[i];
        }
    }
    return new Blob([buf], { type: 'image/bmp' });
}

// TIFF baseline little-endian, RGBA 8 bits sem compressão, 1 faixa; ExtraSamples=2 (alfa não associado, que é o
// que o getImageData devolve) mantém a transparência. As tags do IFD precisam estar em ordem crescente.
function canvasParaTiff(canvas) {
    const w = canvas.width, h = canvas.height;
    const px = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const entradas = 14, ifd = 8;
    const offBits = ifd + 2 + entradas * 12 + 4, offXRes = offBits + 8, offYRes = offXRes + 8, offDados = offYRes + 8;
    const buf = new ArrayBuffer(offDados + px.length);
    const v = new DataView(buf);
    v.setUint16(0, 0x4949, true);
    v.setUint16(2, 42, true);
    v.setUint32(4, ifd, true);
    v.setUint16(ifd, entradas, true);
    let p = ifd + 2;
    const tag = (id, tipo, qtd, valor) => {
        v.setUint16(p, id, true);
        v.setUint16(p + 2, tipo, true);
        v.setUint32(p + 4, qtd, true);
        if (tipo === 3 && qtd === 1) v.setUint16(p + 8, valor, true);
        else v.setUint32(p + 8, valor, true);
        p += 12;
    };
    tag(256, 4, 1, w);          // ImageWidth
    tag(257, 4, 1, h);          // ImageLength
    tag(258, 3, 4, offBits);    // BitsPerSample 8,8,8,8
    tag(259, 3, 1, 1);          // Compression: nenhuma
    tag(262, 3, 1, 2);          // Photometric: RGB
    tag(273, 4, 1, offDados);   // StripOffsets
    tag(277, 3, 1, 4);          // SamplesPerPixel
    tag(278, 4, 1, h);          // RowsPerStrip
    tag(279, 4, 1, px.length);  // StripByteCounts
    tag(282, 5, 1, offXRes);    // XResolution
    tag(283, 5, 1, offYRes);    // YResolution
    tag(284, 3, 1, 1);          // PlanarConfiguration
    tag(296, 3, 1, 2);          // ResolutionUnit: polegada
    tag(338, 3, 1, 2);          // ExtraSamples: alfa não associado
    v.setUint32(p, 0, true);
    for (let i = 0; i < 4; i++) v.setUint16(offBits + i * 2, 8, true);
    v.setUint32(offXRes, 72, true); v.setUint32(offXRes + 4, 1, true);
    v.setUint32(offYRes, 72, true); v.setUint32(offYRes + 4, 1, true);
    new Uint8Array(buf, offDados).set(px);
    return new Blob([buf], { type: 'image/tiff' });
}

// Compressão LZW do GIF (tamanho de código variável até 12 bits, com código de limpeza quando a tabela enche).
function lzwGif(indices, minCode) {
    const limpar = 1 << minCode, fim = limpar + 1;
    let tamCodigo = minCode + 1, proximo = fim + 1;
    let tabela = new Map();
    const saida = [];
    let acum = 0, bits = 0;
    const emitir = c => {
        acum |= c << bits;
        bits += tamCodigo;
        while (bits >= 8) { saida.push(acum & 255); acum >>>= 8; bits -= 8; }
    };
    emitir(limpar);
    let atual = indices[0];
    for (let i = 1; i < indices.length; i++) {
        const k = indices[i];
        const chave = (atual << 8) | k;
        const existente = tabela.get(chave);
        if (existente !== undefined) { atual = existente; continue; }
        emitir(atual);
        if (proximo === 4096) {
            emitir(limpar);
            tabela = new Map();
            tamCodigo = minCode + 1;
            proximo = fim + 1;
        } else {
            if (proximo >= (1 << tamCodigo)) tamCodigo++;
            tabela.set(chave, proximo++);
        }
        atual = k;
    }
    emitir(atual);
    emitir(fim);
    if (bits > 0) saida.push(acum & 255);
    return saida;
}

// GIF89a: cores exatas se a imagem tiver poucas cores; senão paleta fixa 6x7x6 (cor mais próxima por canal).
// Pixel com alfa < 128 vira transparente (índice 0 reservado + Graphic Control Extension).
function canvasParaGif(canvas) {
    const w = canvas.width, h = canvas.height;
    const px = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const total = w * h;
    let temTransparente = false;
    for (let i = 3; i < px.length; i += 4) if (px[i] < 128) { temTransparente = true; break; }
    const base = temTransparente ? 1 : 0;

    const cores = new Map();
    let exata = true;
    for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < 128) continue;
        const c = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
        if (!cores.has(c)) {
            if (cores.size + base >= 256) { exata = false; break; }
            cores.set(c, cores.size + base);
        }
    }

    const paleta = [];
    if (temTransparente) paleta.push(0, 0, 0);
    if (exata) cores.forEach((_, c) => paleta.push(c >> 16, (c >> 8) & 255, c & 255));
    else for (let r = 0; r < 6; r++) for (let g = 0; g < 7; g++) for (let b = 0; b < 6; b++) paleta.push(r * 51, Math.round(g * 255 / 6), b * 51);

    const indices = new Uint8Array(total);
    for (let q = 0, i = 0; q < total; q++, i += 4) {
        if (px[i + 3] < 128) { indices[q] = 0; continue; }
        indices[q] = exata
            ? cores.get((px[i] << 16) | (px[i + 1] << 8) | px[i + 2])
            : base + Math.round(px[i] / 51) * 42 + Math.round(px[i + 1] * 6 / 255) * 6 + Math.round(px[i + 2] / 51);
    }

    const n = Math.max(1, Math.ceil(Math.log2(Math.max(2, paleta.length / 3))));
    while (paleta.length < (1 << n) * 3) paleta.push(0);

    const bytes = [];
    const u16 = x => bytes.push(x & 255, (x >> 8) & 255);
    for (const ch of 'GIF89a') bytes.push(ch.charCodeAt(0));
    u16(w); u16(h);
    bytes.push(0x80 | ((n - 1) << 4) | (n - 1), 0, 0);
    for (const x of paleta) bytes.push(x);
    if (temTransparente) bytes.push(0x21, 0xF9, 4, 1, 0, 0, 0, 0);
    bytes.push(0x2C); u16(0); u16(0); u16(w); u16(h); bytes.push(0);
    const minCode = Math.max(2, n);
    bytes.push(minCode);
    const dados = lzwGif(indices, minCode);
    for (let i = 0; i < dados.length; i += 255) {
        const bloco = dados.slice(i, i + 255);
        bytes.push(bloco.length);
        for (const x of bloco) bytes.push(x);
    }
    bytes.push(0, 0x3B);
    return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
}

async function convertImage() {
    const targetFormat = document.getElementById('img-target-format').value;
    const statusEl = document.getElementById('img-convert-status');

    if (!convertSelectedFile) {
        statusEl.innerText = '❌ Selecione ou arraste uma imagem primeiro.';
        statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
        return;
    }

    try {
        statusEl.innerText = '⏳ Convertendo imagem...';
        statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';

        const img = await loadImageFromFile(convertSelectedFile);
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

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');

        if (['jpg', 'bmp'].includes(targetFormat)) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const codificadores = { bmp: canvasParaBmp, tiff: canvasParaTiff, gif: canvasParaGif };
        if (codificadores[targetFormat]) {
            const blob = codificadores[targetFormat](canvas);
            const nomeBase = convertSelectedFile.name.substring(0, convertSelectedFile.name.lastIndexOf('.')) || 'imagem';
            downloadFile(blob, `${nomeBase}.${targetFormat}`);
            statusEl.innerText = `✅ Convertida para ${targetFormat.toUpperCase()} (${formatFileSize(blob.size)})!`;
            statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';
            return;
        }

        canvas.toBlob((blob) => {
            if (!blob) {
                statusEl.innerText = `❌ Navegador não suporta exportar para .${targetFormat.toUpperCase()}.`;
                statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
                return;
            }

            const originalName = convertSelectedFile.name.substring(0, convertSelectedFile.name.lastIndexOf('.')) || 'imagem';
            const ext = extensaoDoBlob(blob, targetFormat);
            const newFileName = `${originalName}.${ext}`;

            downloadFile(blob, newFileName);

            if (ext !== targetFormat) {
                statusEl.innerText = `ℹ️ Seu navegador não gera ${targetFormat.toUpperCase()}; a imagem foi salva como ${ext.toUpperCase()} (${formatFileSize(blob.size)}).`;
                statusEl.className = 'text-xs text-center text-yellow-400 mt-3 min-h-[1rem]';
                return;
            }
            statusEl.innerText = `✅ Convertida para ${targetFormat.toUpperCase()} (${formatFileSize(blob.size)})!`;
            statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';
        }, targetMime, 0.92);

    } catch (err) {
        statusEl.innerText = `❌ ${err.message}`;
        statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
    }
}

// ==========================================
// EDITOR RÁPIDO DE IMAGEM: redimensionar, girar, espelhar e marca d'água
// ==========================================
// Tudo acontece num <canvas> no navegador. Como a imagem é redesenhada, os dados escondidos da foto
// (EXIF: localização GPS, modelo da câmera...) NÃO vão para o arquivo exportado.
const ED_MAX_LADO = 8000; // limite para não travar o navegador
const ed = { img: null, nome: 'imagem', rot: 0, flipH: false, flipV: false };

function edDimensoesOriginais() {
    // largura x altura da imagem já considerando a rotação atual
    const girada = ed.rot % 180 !== 0;
    const iw = ed.img.naturalWidth || ed.img.width, ih = ed.img.naturalHeight || ed.img.height;
    return girada ? { w: ih, h: iw } : { w: iw, h: ih };
}

function edLimitar(v) {
    return Math.max(1, Math.min(ED_MAX_LADO, Math.round(Number(v) || 1)));
}

async function handleEditImgSelect() {
    const input = document.getElementById('edit-img-file');
    const status = document.getElementById('edit-img-status');
    if (!input.files.length) return;
    try {
        ed.img = await loadImageFromFile(input.files[0]);
        ed.nome = getBaseFileName(input.files[0].name) || 'imagem';
        ed.rot = 0; ed.flipH = false; ed.flipV = false;
        const d = edDimensoesOriginais();
        document.getElementById('edit-w').value = d.w;
        document.getElementById('edit-h').value = d.h;
        document.getElementById('edit-img-painel').classList.remove('hidden');
        status.textContent = '';
        edAtualizarPreview();
    } catch (erro) {
        status.textContent = '❌ Não foi possível abrir esta imagem.';
    }
}

function edMudouLargura() {
    if (!ed.img) return;
    if (document.getElementById('edit-prop').checked) {
        const d = edDimensoesOriginais();
        document.getElementById('edit-h').value = edLimitar(document.getElementById('edit-w').value * d.h / d.w);
    }
    edAtualizarPreview();
}

function edMudouAltura() {
    if (!ed.img) return;
    if (document.getElementById('edit-prop').checked) {
        const d = edDimensoesOriginais();
        document.getElementById('edit-w').value = edLimitar(document.getElementById('edit-h').value * d.w / d.h);
    }
    edAtualizarPreview();
}

function edGirar(graus) {
    if (!ed.img) return;
    ed.rot = (ed.rot + graus + 360) % 360;
    // girar 90° troca largura e altura
    const w = document.getElementById('edit-w'), h = document.getElementById('edit-h');
    [w.value, h.value] = [h.value, w.value];
    edAtualizarPreview();
}

function edEspelhar(eixo) {
    if (!ed.img) return;
    if (eixo === 'h') ed.flipH = !ed.flipH; else ed.flipV = !ed.flipV;
    edAtualizarPreview();
}

// Desenha a imagem editada em `cv` com o tamanho w x h (a marca d'água acompanha a escala)
function edDesenhar(cv, w, h, fundoBranco) {
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    if (fundoBranco) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h); }
    const girada = ed.rot % 180 !== 0;
    const dw = girada ? h : w, dh = girada ? w : h; // tamanho do desenho antes de girar
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(ed.flipH ? -1 : 1, ed.flipV ? -1 : 1); // espelhar visualmente (antes de girar)
    ctx.rotate(ed.rot * Math.PI / 180);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(ed.img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    const texto = document.getElementById('edit-marca').value.trim();
    if (texto) {
        const tam = Math.max(12, Math.round(w * 0.045));
        const margem = Math.round(tam * 0.7);
        const pos = document.getElementById('edit-marca-pos').value;
        ctx.font = `600 ${tam}px Inter, Arial, sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = document.getElementById('edit-marca-op').value / 100;
        const larg = ctx.measureText(texto).width;
        const x = pos.endsWith('l') ? margem : pos === 'c' ? (w - larg) / 2 : w - larg - margem;
        const y = pos.startsWith('t') ? margem + tam : pos === 'c' ? (h + tam) / 2 : h - margem;
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = tam * 0.15;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(texto, x, y);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
}

function edAtualizarPreview() {
    if (!ed.img) return;
    const w = edLimitar(document.getElementById('edit-w').value);
    const h = edLimitar(document.getElementById('edit-h').value);
    const escala = Math.min(1, 640 / w); // a prévia é menor, mas proporcional
    edDesenhar(document.getElementById('edit-img-canvas'), Math.max(1, Math.round(w * escala)), Math.max(1, Math.round(h * escala)), false);
    document.getElementById('edit-info').textContent = `(saída: ${w} × ${h} px)`;
}

function edBaixar() {
    if (!ed.img) return;
    const status = document.getElementById('edit-img-status');
    const w = edLimitar(document.getElementById('edit-w').value);
    const h = edLimitar(document.getElementById('edit-h').value);
    const formato = document.getElementById('edit-formato').value;
    const mime = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[formato];
    const qualidade = document.getElementById('edit-qualidade').value / 100;

    const cv = document.createElement('canvas');
    edDesenhar(cv, w, h, formato === 'jpg'); // JPG não tem transparência: fundo branco
    cv.toBlob(blob => {
        if (!blob) { status.textContent = '❌ Não foi possível gerar a imagem (tente um tamanho menor).'; return; }
        const ext = extensaoDoBlob(blob, formato);
        downloadFile(blob, `${ed.nome}_editada.${ext}`);
        status.textContent = ext === formato
            ? `✅ Imagem salva (${w} × ${h} px, ${formatFileSize(blob.size)}).`
            : `ℹ️ Seu navegador não gera ${formato.toUpperCase()}; a imagem foi salva como ${ext.toUpperCase()} (${w} × ${h} px, ${formatFileSize(blob.size)}).`;
    }, mime, qualidade);
}

// ==========================================
// IMAGENS EM PDF
// ==========================================
let img2pdfArquivos = []; // File[] na ordem do PDF

function handleImg2PdfSelect() {
    const input = document.getElementById('img2pdf-arquivos');
    img2pdfArquivos = img2pdfArquivos.concat(Array.from(input.files).filter(f => f.type.startsWith('image/')));
    input.value = ''; // permite escolher o mesmo arquivo de novo depois
    renderListaImg2Pdf();
}

function renderListaImg2Pdf() {
    const lista = document.getElementById('img2pdf-lista');
    lista.innerHTML = '';
    img2pdfArquivos.forEach((arq, i) => {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-2 bg-gray-700/40 rounded px-2 py-1';
        const nome = document.createElement('span');
        nome.className = 'flex-1 truncate';
        nome.textContent = `${i + 1}. ${arq.name} (${formatFileSize(arq.size)})`; // textContent: nome de arquivo nunca vira HTML
        li.appendChild(nome);
        const botao = (txt, titulo, acao) => {
            const b = document.createElement('button');
            b.type = 'button'; b.textContent = txt; b.title = titulo;
            b.className = 'px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-100';
            b.onclick = acao;
            return b;
        };
        li.appendChild(botao('↑', 'Mover para cima', () => { if (i > 0) { [img2pdfArquivos[i - 1], img2pdfArquivos[i]] = [img2pdfArquivos[i], img2pdfArquivos[i - 1]]; renderListaImg2Pdf(); } }));
        li.appendChild(botao('↓', 'Mover para baixo', () => { if (i < img2pdfArquivos.length - 1) { [img2pdfArquivos[i + 1], img2pdfArquivos[i]] = [img2pdfArquivos[i], img2pdfArquivos[i + 1]]; renderListaImg2Pdf(); } }));
        li.appendChild(botao('✕', 'Remover', () => { img2pdfArquivos.splice(i, 1); renderListaImg2Pdf(); }));
        lista.appendChild(li);
    });
}

async function gerarPdfDeImagens() {
    const status = document.getElementById('img2pdf-status');
    if (!img2pdfArquivos.length) { status.textContent = 'Escolha ao menos uma imagem.'; return; }
    status.textContent = '⏳ Criando o PDF...';
    try {
        await carregarLib('pdflib');
        const doc = await PDFLib.PDFDocument.create();
        const modo = document.getElementById('img2pdf-pagina').value;
        const A4 = { w: 595.28, h: 841.89, margem: 28 };

        for (let i = 0; i < img2pdfArquivos.length; i++) {
            status.textContent = `⏳ Imagem ${i + 1} de ${img2pdfArquivos.length}...`;
            // passa pelo canvas: aplica a rotação correta das fotos de celular e aceita qualquer formato
            const img = await loadImageFromFile(img2pdfArquivos[i]);
            const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
            const cv = document.createElement('canvas');
            cv.width = iw; cv.height = ih;
            const ctx = cv.getContext('2d');
            ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, iw, ih);
            ctx.drawImage(img, 0, 0);
            const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
            const embutida = await doc.embedJpg(await blob.arrayBuffer());

            if (modo === 'a4') {
                const pagina = doc.addPage([A4.w, A4.h]);
                const area = { w: A4.w - 2 * A4.margem, h: A4.h - 2 * A4.margem };
                const escala = Math.min(area.w / iw, area.h / ih);
                const w = iw * escala, h = ih * escala;
                pagina.drawImage(embutida, { x: (A4.w - w) / 2, y: (A4.h - h) / 2, width: w, height: h });
            } else {
                const pagina = doc.addPage([iw, ih]);
                pagina.drawImage(embutida, { x: 0, y: 0, width: iw, height: ih });
            }
        }
        const bytes = await doc.save();
        downloadFile(new Blob([bytes], { type: 'application/pdf' }), 'imagens.pdf');
        status.textContent = `✅ PDF criado com ${img2pdfArquivos.length} página(s).`;
    } catch (erro) {
        console.error(erro);
        status.textContent = '❌ Não foi possível criar o PDF. Tente com menos imagens ou imagens menores.';
    }
}
