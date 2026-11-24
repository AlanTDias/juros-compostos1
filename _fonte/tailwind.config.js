// Tailwind compilado no build (substitui o Tailwind via CDN). Usado por _fonte/build.js.
// "content": onde o Tailwind procura nomes de classe. Inclui o JS porque várias telas montam HTML por template
// (menu, resultados, cartões). Classe montada por concatenação ('bg-' + cor) NÃO é encontrada: escreva o nome inteiro.
const path = require('path');
const raiz = path.resolve(__dirname, '..');

// Paleta: cinza vira "navy" técnico e emerald vira a cor de destaque do tema. As cores vêm de variáveis CSS
// (definidas no style.css para o tema escuro e o claro), no formato "R G B", para as classes com transparência
// (bg-gray-700/40, border-gray-700/60...) continuarem funcionando.
const tons = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const escala = nome => Object.fromEntries(tons.map(t => [t, `rgb(var(--${nome}-${t}) / <alpha-value>)`]));

module.exports = {
    content: [
        path.join(raiz, '_fonte/base.html'),
        path.join(raiz, '_fonte/conteudo/*.html'),
        path.join(raiz, '_fonte/build.js'),
        path.join(raiz, 'js/*.js')
    ],
    theme: {
        extend: {
            colors: {
                gray: escala('gray'),
                emerald: escala('emerald')
            }
        }
    }
};
