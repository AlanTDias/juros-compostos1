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
            const newFileName = `${originalName}_comprimida${extension}`;

            downloadFile(blob, newFileName);

            const origSize = formatFileSize(file.size);
            const newSize = formatFileSize(blob.size);
            const reduction = (((file.size - blob.size) / file.size) * 100).toFixed(1);

            if (blob.size < file.size) {
                statusEl.innerText = `✅ Concluído! ${origSize} ➔ ${newSize} (${reduction}% menor)`;
                statusEl.className = 'text-xs text-center text-emerald-400 mt-3 min-h-[1rem]';
            } else {
                statusEl.innerText = `✅ Concluído! (${newSize}). Imagem já estava otimizada.`;
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

        canvas.toBlob((blob) => {
            if (!blob) {
                statusEl.innerText = `❌ Navegador não suporta exportar para .${targetFormat.toUpperCase()}.`;
                statusEl.className = 'text-xs text-center text-red-400 mt-3 min-h-[1rem]';
                return;
            }

            const originalName = convertSelectedFile.name.substring(0, convertSelectedFile.name.lastIndexOf('.')) || 'imagem';
            const newFileName = `${originalName}.${targetFormat}`;

            downloadFile(blob, newFileName);

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
        downloadFile(blob, `${ed.nome}_editada.${formato}`);
        status.textContent = `✅ Imagem salva (${w} × ${h} px, ${formatFileSize(blob.size)}).`;
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
