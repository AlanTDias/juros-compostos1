// CONVERSORES DE ARQUIVOS E FERRAMENTAS DE PDF: converter, comprimir, unir, dividir, escrever, assinar e extrair texto
// (Gerado na divisão do script.js único; agora este arquivo é editado diretamente.)

// CENTRAL DE CONVERSÃO DE DOCUMENTOS
// ==========================================
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
        const libsNecessarias = [];
        if (ext === 'docx') libsNecessarias.push('mammoth');
        if (['xlsx', 'xls', 'csv'].includes(ext)) libsNecessarias.push('xlsx');
        if (ext === 'json' && ['csv', 'xlsx'].includes(targetFormat)) libsNecessarias.push('xlsx');
        if (ext === 'pdf') libsNecessarias.push('pdfjs');
        if (targetFormat === 'pdf') libsNecessarias.push('html2pdf');
        if (targetFormat === 'docx') libsNecessarias.push('docx');
        await carregarLibs(...libsNecessarias);

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
    // CORREÇÃO DE SEGURANÇA: tabela montada com escape, não sheet_to_html cru
    const htmlTable = sheetToSafeHtmlTable(worksheet);
    await exportHtmlToPdf(htmlTable, file.name, statusEl);
}

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
    // CORREÇÃO DE SEGURANÇA: tabela montada com escape, não sheet_to_html cru
    const htmlTable = sheetToSafeHtmlTable(workbook.Sheets[workbook.SheetNames[0]]);
    await exportHtmlToPdf(htmlTable, file.name, statusEl);
}

async function convertCsvToDocx(file, statusEl) {
    const text = await readFileAsText(file);
    await exportTextToDocx(text, file.name);
    updateStatus(statusEl, "✅ CSV convertido para DOCX com sucesso!");
}

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

// CORREÇÃO DE SEGURANÇA: Aqui o escapeHtml protege a conversão de JSON malicioso para PDF
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

async function convertTxtToDocx(file, statusEl) {
    const text = await readFileAsText(file);
    await exportTextToDocx(text, file.name);
    updateStatus(statusEl, "✅ TXT convertido para DOCX com sucesso!");
}

async function convertTxtToPdf(file, statusEl) {
    const text = await readFileAsText(file);
    // Correção: Uso de escapeHtml ao renderizar texto
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

// CORREÇÃO DE SEGURANÇA: monta a tabela HTML célula a célula com escapeHtml,
// em vez de usar XLSX.utils.sheet_to_html diretamente (que não garante escape
// do conteúdo das células e permitiria XSS via planilha/CSV maliciosos
// injetados no innerHTML dentro de exportHtmlToPdf).
function sheetToSafeHtmlTable(worksheet) {
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
    if (!rows.length) {
        return '<table><tbody><tr><td>(planilha vazia)</td></tr></tbody></table>';
    }
    const bodyRows = rows.map(row => {
        const cells = row.map(cell => `<td style="border:1px solid #ccc;padding:4px;">${escapeHtml(cell)}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');
    return `<table style="border-collapse:collapse;width:100%;font-size:12px;"><tbody>${bodyRows}</tbody></table>`;
}

async function extractPdfPagesText(file) {
    const buffer = await readFileAsArrayBuffer(file);
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
        // CORREÇÃO: Usando escapeHtml para nome do arquivo proveniente de uplaod do usuário
        dropZoneText.innerHTML = `📄 Arquivo selecionado: <strong class="text-emerald-400">${escapeHtml(file.name)}</strong> (${fileSizeMB} MB)`;
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

function handleCompressFileSelect() {
    const fileInput = document.getElementById('file-input-compress');
    const dropZoneText = document.getElementById('drop-zone-compress-text');

    if (fileInput.files.length) {
        const file = fileInput.files[0];
        // CORREÇÃO: Usando escapeHtml aqui também
        dropZoneText.innerHTML = `📄 Selecionado: <strong class="text-emerald-400">${escapeHtml(file.name)}</strong>`;
    }
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
        await carregarLibs('pdfjs', 'pdflib');
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const newPdfDoc = await PDFLib.PDFDocument.create();

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            statusEl.innerText = `⏳ Processando página ${i} de ${pdfDoc.numPages}...`;

            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const imgDataUrl = canvas.toDataURL('image/jpeg', quality);

            const jpegImage = await newPdfDoc.embedJpg(imgDataUrl);
            const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
            newPage.drawImage(jpegImage, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height,
            });
        }

        const compressedBytes = await newPdfDoc.save();
        let finalBlob = new Blob([compressedBytes], { type: 'application/pdf' });

        // Reconverter as páginas em imagem pode aumentar PDFs que já eram leves (só texto/vetor).
        // Nesse caso, entrega o original em vez de um arquivo maior.
        const jaOtimizado = finalBlob.size >= initialSize;
        if (jaOtimizado) finalBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const finalSize = finalBlob.size;

        const savedPercent = (((initialSize - finalSize) / initialSize) * 100).toFixed(1);
        const originalMB = (initialSize / (1024 * 1024)).toFixed(2);
        const finalMB = (finalSize / (1024 * 1024)).toFixed(2);

        const downloadUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = file.name.replace(/\.pdf$/i, '_comprimido.pdf');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        statusEl.className = "text-xs text-center text-emerald-400 mt-3 min-h-[1rem]";
        statusEl.innerText = jaOtimizado
            ? `ℹ️ Este PDF já é leve (${originalMB}MB): comprimir aumentaria o arquivo, então o original foi mantido.`
            : `✅ Concluído! De ${originalMB}MB para ${finalMB}MB (${savedPercent}% de redução).`;

    } catch (error) {
        console.error(error);
        statusEl.className = "text-xs text-center text-red-400 mt-3 min-h-[1rem]";
        statusEl.innerText = "❌ Ocorreu um erro ao comprimir o PDF.";
    }
}


// ESCREVER LIVREMENTE SOBRE O PDF (ANOTAÇÃO LIVRE)
// ==========================================

let pdfEditOriginalBytes = null; // bytes originais do PDF (para salvar depois)
let pdfEditDoc = null; // documento carregado pelo pdf.js (para renderizar)
let pdfEditCurrentPage = 1;
let pdfEditTotalPages = 1;
let pdfEditCurrentViewport = null; // viewport da página atualmente renderizada
const pdfEditRenderScale = 1.5;
let pdfEditAnnotations = {}; // { numeroDaPagina: [ {xRatio, yRatio, text, fontSize, color} ] }

function handlePdfEditFileSelect() {
    const fileInput = document.getElementById('file-input-pdfedit');
    const dropZoneText = document.getElementById('drop-zone-pdfedit-text');
    const workspace = document.getElementById('pdfedit-workspace');
    const downloadBtn = document.getElementById('btn-pdfedit-download');
    const statusEl = document.getElementById('status-pdfedit');

    workspace.classList.add('hidden');
    downloadBtn.classList.add('hidden');
    statusEl.innerText = '';
    pdfEditAnnotations = {};

    if (!fileInput.files.length) {
        dropZoneText.innerHTML = `<span class="font-semibold text-emerald-400">Clique para selecionar</span> ou arraste o PDF aqui`;
        return;
    }

    const file = fileInput.files[0];
    dropZoneText.innerHTML = `📄 Selecionado: <strong class="text-emerald-400">${escapeHtml(file.name)}</strong>`;
    loadPdfForEditing(file);
}

async function loadPdfForEditing(file) {
    const statusEl = document.getElementById('status-pdfedit');
    updateStatus(statusEl, "⏳ Carregando PDF...", true);

    try {
        await carregarLibs('pdfjs', 'pdflib');
        pdfEditOriginalBytes = await file.arrayBuffer();
        // pdfjsLib consome o buffer; usamos uma cópia para não afetar os bytes originais salvos
        pdfEditDoc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfEditOriginalBytes.slice(0)) }).promise;
        pdfEditTotalPages = pdfEditDoc.numPages;
        pdfEditCurrentPage = 1;

        document.getElementById('pdfedit-workspace').classList.remove('hidden');
        document.getElementById('btn-pdfedit-download').classList.remove('hidden');
        document.getElementById('pdfedit-page-total').innerText = pdfEditTotalPages;

        await renderPdfEditPage(pdfEditCurrentPage);
        updateStatus(statusEl, "✅ PDF carregado. Clique na página para escrever.");
    } catch (error) {
        console.error(error);
        updateStatus(statusEl, "❌ Não foi possível abrir este PDF.", false, true);
    }
}

// Evita "Cannot use the same canvas during multiple render() operations" ao trocar de página
// rápido: cada chamada ganha um número, a anterior é cancelada e chamadas antigas são descartadas.
let pdfEditRenderSeq = 0;
let pdfEditRenderTask = null;

async function renderPdfEditPage(pageNum) {
    const seq = ++pdfEditRenderSeq;

    if (pdfEditRenderTask) {
        pdfEditRenderTask.cancel();
        try { await pdfEditRenderTask.promise; } catch (e) { /* cancelamento esperado */ }
        pdfEditRenderTask = null;
    }

    const page = await pdfEditDoc.getPage(pageNum);
    if (seq !== pdfEditRenderSeq) return; // uma chamada mais nova já assumiu

    const viewport = page.getViewport({ scale: pdfEditRenderScale });
    pdfEditCurrentViewport = viewport;

    const canvas = document.getElementById('pdfedit-canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    const task = page.render({ canvasContext: ctx, viewport });
    pdfEditRenderTask = task;
    try {
        await task.promise;
    } catch (e) {
        if (e && e.name === 'RenderingCancelledException') return;
        throw e;
    }
    if (pdfEditRenderTask === task) pdfEditRenderTask = null;
    if (seq !== pdfEditRenderSeq) return;

    canvas.onclick = onPdfEditCanvasClick;

    document.getElementById('pdfedit-page-num').innerText = pageNum;
    renderPdfEditOverlays();
}

function pdfEditPrevPage() {
    if (pdfEditCurrentPage > 1) {
        pdfEditCurrentPage--;
        renderPdfEditPage(pdfEditCurrentPage);
    }
}

function pdfEditNextPage() {
    if (pdfEditCurrentPage < pdfEditTotalPages) {
        pdfEditCurrentPage++;
        renderPdfEditPage(pdfEditCurrentPage);
    }
}

function pdfEditClearPage() {
    const statusEl = document.getElementById('status-pdfedit');
    const wrapper = document.getElementById('pdfedit-canvas-wrapper');

    // Descarta uma caixa de digitação ainda aberta (esvazia antes: remover dispara o blur, que confirmaria o texto)
    wrapper.querySelectorAll('.pdfedit-temp-input').forEach(box => {
        const campo = box.querySelector('textarea');
        if (campo) campo.value = '';
        box.remove();
    });

    const quantidade = (pdfEditAnnotations[pdfEditCurrentPage] || []).length;
    pdfEditAnnotations[pdfEditCurrentPage] = [];
    renderPdfEditOverlays();

    statusEl.innerText = quantidade
        ? `🗑️ ${quantidade} anotação(ões) removida(s) desta página.`
        : 'Não há anotações nesta página para limpar.';
}

function onPdfEditCanvasClick(event) {
    const canvas = document.getElementById('pdfedit-canvas');
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    if (pdfEditPosicionando && pdfEditAssinatura) {
        colocarAssinatura(clickX, clickY);
        return;
    }
    openPdfEditInlineInput(clickX, clickY);
}

function openPdfEditInlineInput(clickX, clickY) {
    const wrapper = document.getElementById('pdfedit-canvas-wrapper');

    // Remove qualquer caixa de digitação pendente antes de abrir outra
    const existingInput = wrapper.querySelector('.pdfedit-temp-input');
    if (existingInput) existingInput.remove();

    const fontSize = parseInt(document.getElementById('pdfedit-fontsize').value) || 12;
    const color = document.getElementById('pdfedit-color').value;

    // Caixa móvel: uma alça "✥ mover" em cima e o textarea embaixo
    const box = document.createElement('div');
    box.className = 'pdfedit-temp-input absolute z-10';
    box.style.left = `${clickX}px`;
    box.style.top = `${clickY}px`;

    const handle = document.createElement('div');
    handle.textContent = '✥ mover';
    handle.className = 'bg-emerald-500 text-gray-950 text-[10px] font-bold px-1.5 py-0.5 rounded-t select-none w-max';

    const input = document.createElement('textarea');
    input.className = 'block bg-white/90 border-2 border-emerald-500 rounded-b rounded-tr px-1 py-0.5 outline-none resize';
    input.style.fontSize = `${fontSize * pdfEditRenderScale}px`;
    input.style.color = color;
    input.style.minWidth = '120px';
    input.rows = 1;

    box.appendChild(handle);
    box.appendChild(input);
    wrapper.appendChild(box);
    makePdfEditDraggable(box, handle);
    input.focus();

    let finalizado = false;
    const commit = () => {
        if (finalizado) return;
        finalizado = true;
        const text = input.value;
        // Posição final = onde a caixa foi parar (o texto fica no topo do textarea)
        const finalX = parseFloat(box.style.left) || 0;
        const finalY = (parseFloat(box.style.top) || 0) + input.offsetTop;
        box.remove();
        if (!text || !text.trim()) return;

        const canvas = document.getElementById('pdfedit-canvas');
        const annotation = {
            xRatio: finalX / canvas.width,
            yRatio: finalY / canvas.height,
            text: text,
            fontSize: fontSize,
            color: color
        };

        if (!pdfEditAnnotations[pdfEditCurrentPage]) pdfEditAnnotations[pdfEditCurrentPage] = [];
        pdfEditAnnotations[pdfEditCurrentPage].push(annotation);
        renderPdfEditOverlays();
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commit();
        } else if (e.key === 'Escape') {
            input.value = '';
            commit();
        }
    });
    input.addEventListener('blur', commit);
}

// Arrasta `el` (posicionado com left/top em px dentro do wrapper) segurando `handle`.
function makePdfEditDraggable(el, handle, onDrop) {
    handle.style.cursor = 'move';
    handle.style.touchAction = 'none';
    // Impede que clicar na alça tire o foco do textarea (o blur confirmaria/cancelaria o texto)
    handle.addEventListener('mousedown', e => e.preventDefault());

    handle.addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();
        const canvas = document.getElementById('pdfedit-canvas');
        const startX = e.clientX;
        const startY = e.clientY;
        const origLeft = parseFloat(el.style.left) || 0;
        const origTop = parseFloat(el.style.top) || 0;
        try { handle.setPointerCapture(e.pointerId); } catch (erro) { /* sem captura, o arrastar ainda funciona enquanto o ponteiro fica sobre a alça */ }

        const move = ev => {
            el.style.left = `${Math.min(Math.max(0, origLeft + ev.clientX - startX), canvas.width - 20)}px`;
            el.style.top = `${Math.min(Math.max(0, origTop + ev.clientY - startY), canvas.height - 20)}px`;
        };
        const up = () => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', up);
            handle.removeEventListener('pointercancel', up);
            if (onDrop) onDrop(parseFloat(el.style.left) || 0, parseFloat(el.style.top) || 0);
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
        handle.addEventListener('pointercancel', up);
    });
}

// Modo tela cheia: o workspace vai para o <body> (fora do card, cujo hover usa transform e
// quebraria o position:fixed) e ocupa a janela inteira; ao fechar, volta ao lugar original.
let pdfEditFsPlaceholder = null;

function togglePdfEditFullscreen() {
    const workspace = document.getElementById('pdfedit-workspace');
    const wrapper = document.getElementById('pdfedit-canvas-wrapper');
    const btn = document.getElementById('pdfedit-fs-btn');
    const dlBtn = document.getElementById('pdfedit-fs-download');
    const abrindo = !pdfEditFsPlaceholder;

    if (abrindo) {
        pdfEditFsPlaceholder = document.createComment('pdfedit-workspace');
        workspace.parentNode.insertBefore(pdfEditFsPlaceholder, workspace);
        document.body.appendChild(workspace);
        workspace.classList.add('fixed', 'inset-0', 'bg-gray-900', 'p-4', 'overflow-auto');
        workspace.style.zIndex = '100';
        wrapper.style.maxHeight = 'calc(100vh - 150px)';
        // Centraliza o documento na janela
        wrapper.style.display = 'block';
        wrapper.style.width = 'fit-content';
        wrapper.style.maxWidth = '100%';
        wrapper.style.margin = '0 auto';
        document.body.style.overflow = 'hidden';
    } else {
        pdfEditFsPlaceholder.parentNode.insertBefore(workspace, pdfEditFsPlaceholder);
        pdfEditFsPlaceholder.remove();
        pdfEditFsPlaceholder = null;
        workspace.classList.remove('fixed', 'inset-0', 'bg-gray-900', 'p-4', 'overflow-auto');
        workspace.style.zIndex = '';
        wrapper.style.maxHeight = '';
        wrapper.style.display = '';
        wrapper.style.width = '';
        wrapper.style.maxWidth = '';
        wrapper.style.margin = '';
        document.body.style.overflow = '';
    }
    btn.innerText = abrindo ? '✕ Sair da tela cheia' : '⛶ Tela cheia';
    dlBtn.classList.toggle('hidden', !abrindo);
}

document.addEventListener('keydown', e => {
    // Esc sai da tela cheia (se estiver digitando numa caixa, o Esc só cancela o texto)
    if (e.key === 'Escape' && pdfEditFsPlaceholder && !document.querySelector('.pdfedit-temp-input')) {
        togglePdfEditFullscreen();
    }
});

function renderPdfEditOverlays() {
    const wrapper = document.getElementById('pdfedit-canvas-wrapper');
    wrapper.querySelectorAll('.pdfedit-overlay-text').forEach(el => el.remove());

    const canvas = document.getElementById('pdfedit-canvas');
    const list = pdfEditAnnotations[pdfEditCurrentPage] || [];

    list.forEach((ann, index) => {
        const box = document.createElement('div');
        box.className = 'pdfedit-overlay-text absolute group';
        box.style.left = `${ann.xRatio * canvas.width}px`;
        box.style.top = `${ann.yRatio * canvas.height}px`;

        if (ann.tipo === 'assinatura') {
            montarOverlayAssinatura(box, ann, index, canvas, wrapper);
            return;
        }

        const textSpan = document.createElement('span');
        textSpan.style.fontSize = `${ann.fontSize * pdfEditRenderScale}px`; // a página é exibida a 1,5x: o texto acompanha, para sair igual no PDF
        textSpan.style.color = ann.color;
        textSpan.style.whiteSpace = 'pre-wrap';
        textSpan.textContent = ann.text; // textContent: seguro contra XSS por definição

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '✕';
        removeBtn.className = 'align-top ml-1 text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            pdfEditAnnotations[pdfEditCurrentPage].splice(index, 1);
            renderPdfEditOverlays();
        };

        // Alça para reposicionar o texto já colocado
        const moveHandle = document.createElement('span');
        moveHandle.textContent = '✥';
        moveHandle.title = 'Arraste para mover';
        moveHandle.className = 'align-top mr-1 text-emerald-500 text-xs opacity-40 group-hover:opacity-100 transition select-none';
        makePdfEditDraggable(box, moveHandle, (x, y) => {
            ann.xRatio = x / canvas.width;
            ann.yRatio = y / canvas.height;
            renderPdfEditOverlays();
        });

        box.appendChild(moveHandle);
        box.appendChild(textSpan);
        box.appendChild(removeBtn);
        wrapper.appendChild(box);
    });
}

function pdfEditHexToRgb01(hex) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return { r, g, b };
}

async function downloadEditedPdf() {
    const statusEl = document.getElementById('status-pdfedit');
    const fileInput = document.getElementById('file-input-pdfedit');

    if (!pdfEditOriginalBytes) {
        alert('Selecione um PDF primeiro.');
        return;
    }

    const hasAnyAnnotation = Object.values(pdfEditAnnotations).some(list => list && list.length);
    if (!hasAnyAnnotation) {
        alert('Clique na página e escreva um texto (ou coloque uma assinatura) antes de baixar.');
        return;
    }

    updateStatus(statusEl, "⏳ Gerando PDF com as anotações...", true);

    try {
        await carregarLib('pdflib');
        const pdfDoc = await PDFLib.PDFDocument.load(pdfEditOriginalBytes);
        const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();

        const imagensEmbutidas = {}; // cada assinatura é embutida uma só vez no PDF

        for (const pageNumStr of Object.keys(pdfEditAnnotations)) {
            const pageIndex = parseInt(pageNumStr) - 1;
            const list = pdfEditAnnotations[pageNumStr];
            if (!list || !list.length || !pages[pageIndex]) continue;

            const page = pages[pageIndex];
            const { width, height } = page.getSize();

            for (const ann of list) {
                if (ann.tipo === 'assinatura') {
                    if (!imagensEmbutidas[ann.dataUrl]) imagensEmbutidas[ann.dataUrl] = await pdfDoc.embedPng(ann.dataUrl);
                    const larguraPdf = ann.larguraRatio * width;
                    const alturaPdf = larguraPdf * ann.proporcao;
                    page.drawImage(imagensEmbutidas[ann.dataUrl], {
                        x: ann.xRatio * width,
                        y: height - ann.yRatio * height - alturaPdf,
                        width: larguraPdf,
                        height: alturaPdf
                    });
                    continue;
                }
                const { r, g, b } = pdfEditHexToRgb01(ann.color);
                const x = ann.xRatio * width;
                // Canvas tem origem no topo; PDF tem origem embaixo — por isso a inversão do Y.
                const y = height - (ann.yRatio * height) - ann.fontSize;

                page.drawText(ann.text, {
                    x,
                    y,
                    size: ann.fontSize,
                    font: helvetica,
                    color: PDFLib.rgb(r, g, b),
                    lineHeight: ann.fontSize * 1.2
                });
            }
        }

        const editedBytes = await pdfDoc.save();
        const blob = new Blob([editedBytes], { type: 'application/pdf' });
        const originalName = fileInput.files[0] ? getBaseFileName(fileInput.files[0].name) : 'documento';

        downloadFile(blob, `${originalName}_anotado.pdf`);
        updateStatus(statusEl, "✅ PDF com as anotações gerado com sucesso!");
    } catch (error) {
        console.error(error);
        updateStatus(statusEl, "❌ Erro ao gerar o PDF anotado.", false, true);
    }
}

// ==========================================
// ASSINATURA NO PDF (reaproveita o editor de anotação livre) e EXTRAIR TEXTO DE PDF
// ==========================================
let pdfEditAssinatura = null;     // { dataUrl, proporcao (altura/largura) } da última assinatura desenhada
let pdfEditPosicionando = false;  // true entre "Usar assinatura" e o clique na página
let assinaturaDesenhando = false;
let assinaturaTemTraco = false;

function iniciarPadAssinatura() {
    const cv = document.getElementById('assinatura-canvas');
    if (cv.dataset.pronto) return;
    cv.dataset.pronto = '1';
    const ctx = cv.getContext('2d');
    let ultimo = null;
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) }; };
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0B1E5B';

    cv.addEventListener('pointerdown', e => {
        assinaturaDesenhando = true;
        ultimo = pos(e);
        try { cv.setPointerCapture(e.pointerId); } catch (erro) { /* alguns navegadores recusam; o desenho segue funcionando */ }
    });
    cv.addEventListener('pointermove', e => {
        if (!assinaturaDesenhando) return;
        const p = pos(e);
        ctx.beginPath(); ctx.moveTo(ultimo.x, ultimo.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ultimo = p; assinaturaTemTraco = true;
    });
    const fim = () => { assinaturaDesenhando = false; };
    cv.addEventListener('pointerup', fim);
    cv.addEventListener('pointercancel', fim);
}

function limparPadAssinatura() {
    const cv = document.getElementById('assinatura-canvas');
    cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
    assinaturaTemTraco = false;
}

function abrirAssinatura() {
    if (!pdfEditOriginalBytes) { mostrarToast('Abra um PDF no editor primeiro.', { tipo: 'humor' }); return; }
    document.getElementById('assinatura-modal').classList.remove('hidden');
    iniciarPadAssinatura();
    limparPadAssinatura();
    document.getElementById('assinatura-anterior').classList.toggle('hidden', !pdfEditAssinatura);
}

function fecharAssinatura() {
    document.getElementById('assinatura-modal').classList.add('hidden');
}

// Recorta a assinatura no menor retângulo que contém o traço e devolve um PNG transparente
function exportarAssinatura() {
    const cv = document.getElementById('assinatura-canvas');
    const ctx = cv.getContext('2d');
    const dados = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let minx = cv.width, miny = cv.height, maxx = 0, maxy = 0;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
        if (dados[(y * cv.width + x) * 4 + 3] > 10) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
    }
    if (maxx <= minx || maxy <= miny) return null;
    const m = 6;
    minx = Math.max(0, minx - m); miny = Math.max(0, miny - m); maxx = Math.min(cv.width, maxx + m); maxy = Math.min(cv.height, maxy + m);
    const w = maxx - minx, h = maxy - miny;
    const saida = document.createElement('canvas');
    saida.width = w; saida.height = h;
    saida.getContext('2d').drawImage(cv, minx, miny, w, h, 0, 0, w, h);
    return { dataUrl: saida.toDataURL('image/png'), proporcao: h / w };
}

function usarAssinatura(usarAnterior) {
    if (!usarAnterior) {
        const nova = assinaturaTemTraco ? exportarAssinatura() : null;
        if (!nova) { mostrarToast('Desenhe sua assinatura na caixa primeiro.', { tipo: 'humor' }); return; }
        pdfEditAssinatura = nova;
    }
    fecharAssinatura();
    pdfEditPosicionando = true;
    document.getElementById('pdfedit-canvas').style.cursor = 'crosshair';
    mostrarToast('🖋️ Agora clique na página onde a assinatura deve ficar.', { duracao: 5000 });
}

function colocarAssinatura(x, y) {
    const canvas = document.getElementById('pdfedit-canvas');
    const larguraRatio = 0.28;
    const larguraPx = larguraRatio * canvas.width;
    const alturaPx = larguraPx * pdfEditAssinatura.proporcao;
    if (!pdfEditAnnotations[pdfEditCurrentPage]) pdfEditAnnotations[pdfEditCurrentPage] = [];
    pdfEditAnnotations[pdfEditCurrentPage].push({
        tipo: 'assinatura',
        dataUrl: pdfEditAssinatura.dataUrl,
        proporcao: pdfEditAssinatura.proporcao,
        larguraRatio,
        // centraliza a assinatura no ponto clicado, sem sair da página
        xRatio: Math.max(0, Math.min(1 - larguraRatio, (x - larguraPx / 2) / canvas.width)),
        yRatio: Math.max(0, Math.min(1 - alturaPx / canvas.height, (y - alturaPx / 2) / canvas.height))
    });
    pdfEditPosicionando = false;
    canvas.style.cursor = '';
    renderPdfEditOverlays();
}

function montarOverlayAssinatura(box, ann, index, canvas, wrapper) {
    const img = document.createElement('img');
    img.src = ann.dataUrl; // gerada pelo nosso próprio canvas (data URL de PNG)
    img.alt = 'Assinatura';
    img.draggable = false;
    img.style.width = `${ann.larguraRatio * canvas.width}px`;
    img.style.display = 'block';

    const barra = document.createElement('div');
    barra.className = 'flex items-center gap-1 text-xs opacity-60 group-hover:opacity-100 transition';

    const alca = document.createElement('span');
    alca.textContent = '✥';
    alca.title = 'Arraste para mover';
    alca.className = 'text-emerald-500 select-none';
    makePdfEditDraggable(box, alca, (x, y) => {
        ann.xRatio = x / canvas.width;
        ann.yRatio = y / canvas.height;
        renderPdfEditOverlays();
    });

    const botao = (texto, titulo, acao, cor) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = texto;
        b.title = titulo;
        b.className = cor + ' px-1 font-bold';
        b.onclick = e => { e.stopPropagation(); acao(); };
        return b;
    };
    const redimensionar = delta => {
        ann.larguraRatio = Math.max(0.08, Math.min(0.8, ann.larguraRatio + delta));
        renderPdfEditOverlays();
    };

    barra.appendChild(alca);
    barra.appendChild(botao('−', 'Diminuir', () => redimensionar(-0.03), 'text-emerald-500'));
    barra.appendChild(botao('+', 'Aumentar', () => redimensionar(0.03), 'text-emerald-500'));
    barra.appendChild(botao('✕', 'Remover', () => { pdfEditAnnotations[pdfEditCurrentPage].splice(index, 1); renderPdfEditOverlays(); }, 'text-red-500'));

    box.appendChild(barra);
    box.appendChild(img);
    wrapper.appendChild(box);
}

// ---------- Extrair texto de PDF (mostra na tela, copia e baixa .txt) ----------
let pdfTextoExtraido = '';

async function extrairTextoPdf() {
    const input = document.getElementById('file-input-pdftexto');
    const statusEl = document.getElementById('status-pdftexto');
    const saida = document.getElementById('pdftexto-saida');
    if (!input.files.length) { alert('Selecione um arquivo PDF primeiro.'); return; }

    updateStatus(statusEl, '⏳ Extraindo o texto...', true);
    try {
        await carregarLib('pdfjs');
        const paginas = await extractPdfPagesText(input.files[0]);
        const texto = paginas.map(p => `--- Página ${p.pageNumber} ---\n${p.content}`).join('\n\n');
        const semTexto = paginas.every(p => !p.content.replace(/\s/g, ''));
        pdfTextoExtraido = semTexto ? '' : texto;
        saida.value = pdfTextoExtraido;
        document.getElementById('pdftexto-acoes').classList.toggle('hidden', semTexto);
        if (semTexto) {
            updateStatus(statusEl, 'ℹ️ Não encontrei texto neste PDF. Ele deve ser digitalizado (só imagem); o site não faz OCR.', false, true);
        } else {
            const palavras = pdfTextoExtraido.split(/\s+/).filter(Boolean).length;
            updateStatus(statusEl, `✅ ${paginas.length} página(s) e cerca de ${palavras.toLocaleString('pt-BR')} palavras extraídas.`);
        }
    } catch (erro) {
        console.error(erro);
        updateStatus(statusEl, '❌ Não foi possível ler este PDF.', false, true);
    }
}

async function copiarTextoPdf() {
    if (!pdfTextoExtraido) return;
    try { await navigator.clipboard.writeText(pdfTextoExtraido); }
    catch (e) { const s = document.getElementById('pdftexto-saida'); s.select(); document.execCommand('copy'); }
    mostrarToast('📋 Texto copiado!', { duracao: 2500 });
}

function baixarTextoPdf() {
    if (!pdfTextoExtraido) return;
    const input = document.getElementById('file-input-pdftexto');
    const nome = input.files[0] ? getBaseFileName(input.files[0].name) : 'documento';
    downloadBlob(pdfTextoExtraido, `${nome}.txt`, 'text/plain;charset=utf-8');
}

function handlePdfTextoSelect() {
    const input = document.getElementById('file-input-pdftexto');
    const rotulo = document.getElementById('drop-zone-pdftexto-text');
    if (input.files.length) {
        rotulo.innerHTML = `📄 Selecionado: <strong class="text-emerald-400">${escapeHtml(input.files[0].name)}</strong>`;
        extrairTextoPdf();
    }
}
// ==========================================
// UNIFICADOR DE PDF (MERGE)
// ==========================================

function handleMergeFileSelect() {
    const fileInput = document.getElementById('file-input-merge');
    const dropZoneText = document.getElementById('drop-zone-merge-text');

    if (fileInput.files.length > 0) {
        dropZoneText.innerHTML = `📄 <strong class="text-emerald-400">${fileInput.files.length} arquivos PDF selecionados</strong>`;
    } else {
        dropZoneText.innerHTML = `<span class="font-semibold text-emerald-400">Clique para selecionar</span> ou arraste os PDFs aqui`;
    }
}

async function mergePDFs() {
    const fileInput = document.getElementById('file-input-merge');
    const statusEl = document.getElementById('status-merge');

    if (!fileInput.files || fileInput.files.length < 2) {
        alert('Por favor, selecione pelo menos 2 arquivos PDF para unir.');
        return;
    }

    updateStatus(statusEl, "⏳ Unindo arquivos PDF...", true);

    try {
        await carregarLib('pdflib');
        const mergedPdf = await PDFLib.PDFDocument.create();

        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

        downloadFile(blob, 'documento_unido.pdf');
        updateStatus(statusEl, "✅ PDFs unidos com sucesso!");
    } catch (error) {
        console.error(error);
        updateStatus(statusEl, "❌ Erro ao unir os PDFs.", false, true);
    }
}

// ==========================================
// DIVISOR DE PDF (SPLIT)
// ==========================================

function handleSplitFileSelect() {
    const fileInput = document.getElementById('file-input-split');
    const dropZoneText = document.getElementById('drop-zone-split-text');

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        dropZoneText.innerHTML = `📄 Selecionado: <strong class="text-emerald-400">${escapeHtml(file.name)}</strong>`;
    }
}

async function splitPDF() {
    const fileInput = document.getElementById('file-input-split');
    const rangeInput = document.getElementById('split-range').value.trim();
    const statusEl = document.getElementById('status-split');

    if (!fileInput.files.length) {
        alert('Por favor, selecione um arquivo PDF primeiro.');
        return;
    }

    if (!rangeInput) {
        alert('Informe as páginas que deseja extrair (ex: 1-3, 5).');
        return;
    }

    updateStatus(statusEl, "⏳ Dividindo e extraindo páginas...", true);

    try {
        await carregarLib('pdflib');
        const file = fileInput.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const subPdf = await PDFLib.PDFDocument.create();

        let pagesToExtract = [];
        const totalPages = pdf.getPageCount();

        // Interpretador de intervalos (ex: "1-3, 5, 7-9")
        rangeInput.split(',').forEach(part => {
            part = part.trim();
            if (part.includes('-')) {
                let [start, end] = part.split('-').map(n => parseInt(n.trim()) - 1);
                for (let i = start; i <= end; i++) {
                    if (i >= 0 && i < totalPages) pagesToExtract.push(i);
                }
            } else {
                let p = parseInt(part) - 1;
                if (p >= 0 && p < totalPages) pagesToExtract.push(p);
            }
        });

        if (pagesToExtract.length === 0) {
            throw new Error("Nenhuma página válida foi informada.");
        }

        const copiedPages = await subPdf.copyPages(pdf, pagesToExtract);
        copiedPages.forEach(page => subPdf.addPage(page));

        const subPdfBytes = await subPdf.save();
        const blob = new Blob([subPdfBytes], { type: 'application/pdf' });

        const originalName = getBaseFileName(file.name);
        downloadFile(blob, `${originalName}_dividido.pdf`);

        updateStatus(statusEl, "✅ Páginas extraídas e salvas com sucesso!");
    } catch (error) {
        console.error(error);
        updateStatus(statusEl, "❌ Erro ao dividir PDF: " + (error.message || "Verifique as páginas informadas."), false, true);
    }
}

// ==========================================
