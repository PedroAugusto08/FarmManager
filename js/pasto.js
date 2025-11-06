/* Módulo de Gerenciamento de Pastos - Controla adição, edição, remoção e visualização de pastos */

import { CHAVES_STORAGE, adicionarItem, carregarDados, atualizarItem, removerItem } from './storage.js';

/* Inicializa o módulo de pastos */
export function inicializar() {
    renderizarListaPastos();
    configurarEventos();
}

/* Configura os eventos dos botões */
function configurarEventos() {
    /* Botão de adicionar pasto */
    const btnAdicionar = document.querySelector('[data-action="adicionar-pasto"]');
    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', mostrarFormularioAdicionar);
    }
}

/* Renderiza a lista de pastos na tela */
export function renderizarListaPastos() {
    const container = document.querySelector('.lista-pastos');
    const pastos = carregarDados(CHAVES_STORAGE.PASTOS);
    
    if (pastos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhum pasto cadastrado ainda</p>
                <p class="hint">Clique em "+ Adicionar Pasto" para começar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pastos.map(pasto => criarCardPasto(pasto)).join('');
    
    /* Adiciona eventos aos botões dos cards */
    adicionarEventosCards();
}

/* Cria o HTML de um card de pasto */
function criarCardPasto(pasto) {
    const quantidadeAnimais = pasto.quantidadeAnimais || 0;
    const area = pasto.area || 'Não informada';
    
    return `
        <div class="card" data-id="${pasto.id}">
            <div class="card-header">
                <h3 class="card-title">${pasto.nome}</h3>
                <span class="card-badge">${quantidadeAnimais} animais</span>
            </div>
            <div class="card-body">
                <div class="card-info">
                    <div class="card-info-item">
                        <strong>Área:</strong> ${area} hectares
                    </div>
                    ${pasto.observacoes ? `
                        <div class="card-info-item">
                            <strong>Obs:</strong> ${pasto.observacoes}
                        </div>
                    ` : ''}
                    <div class="card-info-item">
                        <strong>Cadastrado em:</strong> ${formatarData(pasto.dataCriacao)}
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-secondary btn-editar" data-id="${pasto.id}">
                    Editar
                </button>
                <button class="btn-secondary btn-danger btn-remover" data-id="${pasto.id}">
                    Remover
                </button>
            </div>
        </div>
    `;
}

/* Adiciona eventos de clique aos botões dos cards */
function adicionarEventosCards() {
    /* Botões de editar */
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            mostrarFormularioEditar(id);
        });
    });
    
    /* Botões de remover */
    document.querySelectorAll('.btn-remover').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            removerPasto(id);
        });
    });
}

/* Mostra o formulário para adicionar novo pasto */
function mostrarFormularioAdicionar() {
    const formularioHTML = `
        <form id="form-pasto">
            <div class="form-group">
                <label class="form-label" for="nome-pasto">Nome do Pasto *</label>
                <input 
                    type="text" 
                    id="nome-pasto" 
                    class="form-input" 
                    placeholder="Ex: Pasto 1, Invernada, etc."
                    required
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="area-pasto">Área (hectares)</label>
                <input 
                    type="number" 
                    id="area-pasto" 
                    class="form-input" 
                    placeholder="Ex: 10"
                    step="0.1"
                    min="0"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="qtd-animais">Quantidade de Animais</label>
                <input 
                    type="number" 
                    id="qtd-animais" 
                    class="form-input" 
                    placeholder="Ex: 50"
                    min="0"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="observacoes-pasto">Observações</label>
                <textarea 
                    id="observacoes-pasto" 
                    class="form-textarea" 
                    placeholder="Anotações adicionais sobre o pasto..."
                ></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn-primary btn-submit">
                    Salvar Pasto
                </button>
                <button type="button" class="btn-secondary btn-cancel" id="cancelar-form">
                    Cancelar
                </button>
            </div>
        </form>
    `;
    
    mostrarModal('Adicionar Novo Pasto', formularioHTML);
    
    /* Configura eventos do formulário */
    document.getElementById('form-pasto').addEventListener('submit', salvarNovoPasto);
    document.getElementById('cancelar-form').addEventListener('click', fecharModal);
}

/* Mostra o formulário para editar um pasto existente */
function mostrarFormularioEditar(id) {
    const pastos = carregarDados(CHAVES_STORAGE.PASTOS);
    const pasto = pastos.find(p => p.id === id);
    
    if (!pasto) {
        alert('Pasto não encontrado');
        return;
    }
    
    const formularioHTML = `
        <form id="form-pasto" data-id="${id}">
            <div class="form-group">
                <label class="form-label" for="nome-pasto">Nome do Pasto *</label>
                <input 
                    type="text" 
                    id="nome-pasto" 
                    class="form-input" 
                    value="${pasto.nome}"
                    required
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="area-pasto">Área (hectares)</label>
                <input 
                    type="number" 
                    id="area-pasto" 
                    class="form-input" 
                    value="${pasto.area || ''}"
                    step="0.1"
                    min="0"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="qtd-animais">Quantidade de Animais</label>
                <input 
                    type="number" 
                    id="qtd-animais" 
                    class="form-input" 
                    value="${pasto.quantidadeAnimais || ''}"
                    min="0"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="observacoes-pasto">Observações</label>
                <textarea 
                    id="observacoes-pasto" 
                    class="form-textarea"
                >${pasto.observacoes || ''}</textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn-primary btn-submit">
                    Atualizar Pasto
                </button>
                <button type="button" class="btn-secondary btn-cancel" id="cancelar-form">
                    Cancelar
                </button>
            </div>
        </form>
    `;
    
    mostrarModal('Editar Pasto', formularioHTML);
    
    /* Configura eventos do formulário */
    document.getElementById('form-pasto').addEventListener('submit', atualizarPasto);
    document.getElementById('cancelar-form').addEventListener('click', fecharModal);
}

/* Salva um novo pasto */
function salvarNovoPasto(e) {
    e.preventDefault();
    
    const dadosPasto = {
        nome: document.getElementById('nome-pasto').value.trim(),
        area: parseFloat(document.getElementById('area-pasto').value) || null,
        quantidadeAnimais: parseInt(document.getElementById('qtd-animais').value) || 0,
        observacoes: document.getElementById('observacoes-pasto').value.trim()
    };
    
    if (adicionarItem(CHAVES_STORAGE.PASTOS, dadosPasto)) {
        fecharModal();
        renderizarListaPastos();
        
        /* Adiciona ao histórico */
        registrarNoHistorico('pasto', `Pasto "${dadosPasto.nome}" cadastrado`);
    } else {
        alert('Erro ao salvar pasto. Tente novamente.');
    }
}

/* Atualiza um pasto existente */
function atualizarPasto(e) {
    e.preventDefault();
    
    const form = e.target;
    const id = form.dataset.id;
    
    const dadosAtualizados = {
        nome: document.getElementById('nome-pasto').value.trim(),
        area: parseFloat(document.getElementById('area-pasto').value) || null,
        quantidadeAnimais: parseInt(document.getElementById('qtd-animais').value) || 0,
        observacoes: document.getElementById('observacoes-pasto').value.trim()
    };
    
    if (atualizarItem(CHAVES_STORAGE.PASTOS, id, dadosAtualizados)) {
        fecharModal();
        renderizarListaPastos();
        
        /* Adiciona ao histórico */
        registrarNoHistorico('pasto', `Pasto "${dadosAtualizados.nome}" atualizado`);
    } else {
        alert('Erro ao atualizar pasto. Tente novamente.');
    }
}

/* Remove um pasto */
function removerPasto(id) {
    const pastos = carregarDados(CHAVES_STORAGE.PASTOS);
    const pasto = pastos.find(p => p.id === id);
    
    if (!pasto) return;
    
    if (confirm(`Deseja realmente remover o pasto "${pasto.nome}"?`)) {
        if (removerItem(CHAVES_STORAGE.PASTOS, id)) {
            renderizarListaPastos();
            
            /* Adiciona ao histórico */
            registrarNoHistorico('pasto', `Pasto "${pasto.nome}" removido`);
        } else {
            alert('Erro ao remover pasto. Tente novamente.');
        }
    }
}

/* Mostra o modal com conteúdo personalizado */
function mostrarModal(titulo, conteudo) {
    const modal = document.getElementById('modal-overlay');
    const modalTitulo = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitulo.textContent = titulo;
    modalBody.innerHTML = conteudo;
    modal.classList.add('active');
    
    /* Fecha modal ao clicar no overlay */
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });
}

/* Fecha o modal */
function fecharModal() {
    const modal = document.getElementById('modal-overlay');
    modal.classList.remove('active');
}

/* Formata uma data ISO para formato brasileiro */
function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
}

/* Registra uma ação no histórico */
function registrarNoHistorico(tipo, descricao) {
    adicionarItem(CHAVES_STORAGE.HISTORICO, {
        tipo,
        descricao
    });
}
