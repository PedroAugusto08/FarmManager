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
