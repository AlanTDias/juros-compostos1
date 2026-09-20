// GERADOR DE DOCUMENTOS: currículo, contrato e orçamento
// (Gerado na divisão do script.js único; agora este arquivo é editado diretamente.)

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
        // Correção de segurança: escapeHtml em todos os valores que vão para a tela!
        document.getElementById('preview-orc-emissor').innerHTML = escapeHtml(document.getElementById('orc-emissor').value) || 'Sua Empresa';
        document.getElementById('preview-orc-cliente').innerHTML = escapeHtml(document.getElementById('orc-cliente').value) || 'Cliente Não Informado';
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
            // Correção de segurança: escapeHtml(desc)
            tr.innerHTML = `
                <td class="py-2 text-gray-800">${escapeHtml(desc)}</td>
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
