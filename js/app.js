/* Arquivo principal que inicializa e coordena todos os módulos */

import * as Pasto from './pasto.js';
import * as Prenhez from './prenhez.js';
import * as Doenca from './doenca.js';
import * as Historico from './historico.js';

/* Inicializa o aplicativo quando o DOM estiver pronto */
document.addEventListener('DOMContentLoaded', inicializarApp);

/* Função principal de inicialização */
function inicializarApp() {
    console.log('Iniciando Controle de Gado...');
    
    /* Configura navegação entre seções */
    configurarNavegacao();
    
    /* Configura botão de fechar modal */
    configurarModal();
    
    /* Inicializa todos os módulos */
    inicializarModulos();
    
    console.log('Aplicativo inicializado com sucesso!');
}

/* Inicializa todos os módulos do aplicativo */
function inicializarModulos() {
    Pasto.inicializar();
    Prenhez.inicializar();
    Doenca.inicializar();
    Historico.inicializar();
}

/* Configura a navegação entre seções */
function configurarNavegacao() {
    const botoesNav = document.querySelectorAll('.nav-btn');
    
    botoesNav.forEach(botao => {
        botao.addEventListener('click', (e) => {
            const secaoId = e.currentTarget.dataset.section;
            mudarSecao(secaoId);
        });
    });

    /* Gesto de swipe lateral para trocar de aba */
    configurarSwipeSeções();
}

/* Muda para uma seção específica - @param secaoId: ID da seção a ser exibida */
function mudarSecao(secaoId) {
    /* Remove classe 'active' de todos os botões e seções */
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.section').forEach(secao => {
        secao.classList.remove('active');
    });
    
    /* Adiciona classe 'active' ao botão e seção selecionados */
    const botaoAtivo = document.querySelector(`[data-section="${secaoId}"]`);
    const secaoAtiva = document.getElementById(secaoId);
    
    if (botaoAtivo) {
        botaoAtivo.classList.add('active');
    }
    
    if (secaoAtiva) {
        secaoAtiva.classList.add('active');
    }
    
    /* Atualiza o conteúdo da seção se for histórico */
    if (secaoId === 'historico') {
        Historico.renderizarHistorico();
    }
}

/* Configura eventos do modal */
function configurarModal() {
    const btnFechar = document.getElementById('modal-close');
    const modalOverlay = document.getElementById('modal-overlay');
    
    if (btnFechar) {
        btnFechar.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });
    }
    
    /* Fecha modal ao pressionar ESC */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            modalOverlay.classList.remove('active');
        }
    });
}

/* Exporta função de mudança de seção para uso em outros módulos */
export { mudarSecao };

/* =============================
   Swipe lateral entre seções
   ============================= */
function configurarSwipeSeções() {
    const secoes = ['pasto', 'prenhez', 'doenca', 'historico'];
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const threshold = 50; /* px mínimos em X */
    const restraintY = 40; /* tolerância vertical */
    let bloqueado = false;

    /* Evita swipe quando o modal estiver aberto */
    const modalOverlay = document.getElementById('modal-overlay');

    function indiceAtual() {
        const ativo = document.querySelector('.section.active');
        const id = ativo ? ativo.id : 'pasto';
        return Math.max(0, secoes.indexOf(id));
    }

    function onTouchStart(e) {
        if (modalOverlay && modalOverlay.classList.contains('active')) return;
        const t = e.changedTouches ? e.changedTouches[0] : e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        bloqueado = false;
    }

    function onTouchMove(e) {
        /* Se houver rolagem vertical dominante, não tratar como swipe horizontal */
        if (bloqueado) return;
        const t = e.changedTouches ? e.changedTouches[0] : e.touches[0];
        const dx = Math.abs(t.clientX - touchStartX);
        const dy = Math.abs(t.clientY - touchStartY);
        if (dy > restraintY && dy > dx) {
            bloqueado = true;
        }
    }

    function onTouchEnd(e) {
        if (modalOverlay && modalOverlay.classList.contains('active')) return;
        if (bloqueado) return;
        const t = e.changedTouches ? e.changedTouches[0] : e;
        touchEndX = t.clientX;
        touchEndY = t.clientY;
        const dx = touchEndX - touchStartX;
        const dy = Math.abs(touchEndY - touchStartY);
        if (Math.abs(dx) > threshold && dy <= restraintY) {
            const idx = indiceAtual();
            if (dx < 0 && idx < secoes.length - 1) {
                /* swipe esquerda -> próxima aba */
                mudarSecao(secoes[idx + 1]);
            } else if (dx > 0 && idx > 0) {
                /* swipe direita -> aba anterior */
                mudarSecao(secoes[idx - 1]);
            }
        }
    }

    /* Ouvir eventos no conteúdo principal para capturar gesto em listas longas */
    const area = document.querySelector('.app-content') || document.body;
    area.addEventListener('touchstart', onTouchStart, { passive: true });
    area.addEventListener('touchmove', onTouchMove, { passive: true });
    area.addEventListener('touchend', onTouchEnd, { passive: true });
}
