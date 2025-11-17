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
    const prenhezes = carregarDados(CHAVES_STORAGE.PRENHEZ);
    const doencas = carregarDados(CHAVES_STORAGE.DOENCAS);

    /* Monta mapas de contagem por pastoId */
    const mapaPrenhez = prenhezes.reduce((acc, reg) => {
        if (reg.pastoId) acc[reg.pastoId] = (acc[reg.pastoId] || 0) + 1;
        return acc;
    }, {});
    const mapaDoencas = doencas.reduce((acc, reg) => {
        if (reg.pastoId) acc[reg.pastoId] = (acc[reg.pastoId] || 0) + 1;
        return acc;
    }, {});

    if (pastos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhum pasto cadastrado ainda</p>
                <p class="hint">Clique em "+ Adicionar Pasto" para começar</p>
            </div>
        `;
        return;
    }

    container.innerHTML = pastos.map(pasto => {
        const qtdPrenhez = mapaPrenhez[pasto.id] || 0;
        const qtdDoenca = mapaDoencas[pasto.id] || 0;
        return criarCardPasto(pasto, { qtdPrenhez, qtdDoenca });
    }).join('');

    adicionarEventosCards();
}

/* Cria o HTML de um card de pasto */
function criarCardPasto(pasto, relacionados = { qtdPrenhez: 0, qtdDoenca: 0 }) {
    const grandes = pasto.animaisGrandes || 0;
    const pequenos = pasto.animaisPequenos || 0;
    const total = grandes + pequenos;
    const { qtdPrenhez, qtdDoenca } = relacionados;
    const temRelacionados = qtdPrenhez > 0 || qtdDoenca > 0;
    const linhaRelacionados = temRelacionados ? `
        <div class="card-info-item">
            <strong>Registros:</strong>
            ${qtdPrenhez > 0 ? `${qtdPrenhez} prenhez` : ''}
            ${qtdPrenhez > 0 && qtdDoenca > 0 ? ' | ' : ''}
            ${qtdDoenca > 0 ? `${qtdDoenca} doença` : ''}
        </div>
    ` : '';
    
    return `
        <div class="card" data-id="${pasto.id}">
            <div class="card-header">
                <h3 class="card-title">${pasto.nome}</h3>
                <span class="card-badge">${total} animais</span>
            </div>
            <div class="card-body">
                <div class="card-info">
                    <div class="card-info-item">
                        <strong>Grandes (Vacas):</strong> ${grandes}
                    </div>
                    <div class="card-info-item">
                        <strong>Pequenos (Bezerros):</strong> ${pequenos}
                    </div>
                    <div class="card-info-item">
                        <strong>Total:</strong> ${total} animais
                    </div>
                    ${pasto.observacoes ? `
                        <div class="card-info-item">
                            <strong>Obs:</strong> ${pasto.observacoes}
                        </div>
                    ` : ''}
                    ${linhaRelacionados}
                    <div class="card-info-item">
                        <strong>Última atualização:</strong> ${formatarData(pasto.dataAtualizacao || pasto.dataCriacao)}
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
                <label class="form-label" for="qtd-grandes">Animais Grandes (Vacas)</label>
                <input 
                    type="number" 
                    id="qtd-grandes" 
                    class="form-input" 
                    placeholder="Ex: 30"
                    min="0"
                    value="0"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="qtd-pequenos">Animais Pequenos (Bezerros)</label>
                <input 
                    type="number" 
                    id="qtd-pequenos" 
                    class="form-input" 
                    placeholder="Ex: 20"
                    min="0"
                    value="0"
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
    /* Garante que o ID seja string para comparação consistente */
    const pasto = pastos.find(p => String(p.id) === String(id));
    
    if (!pasto) {
        console.error('Pasto não encontrado. ID buscado:', id, 'IDs disponíveis:', pastos.map(p => p.id));
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
                <label class="form-label" for="qtd-grandes">Animais Grandes (Vacas)</label>
                <input 
                    type="number" 
                    id="qtd-grandes" 
                    class="form-input" 
                    value="${pasto.animaisGrandes || 0}"
                    min="0"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="qtd-pequenos">Animais Pequenos (Bezerros)</label>
                <input 
                    type="number" 
                    id="qtd-pequenos" 
                    class="form-input" 
                    value="${pasto.animaisPequenos || 0}"
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
        animaisGrandes: parseInt(document.getElementById('qtd-grandes').value) || 0,
        animaisPequenos: parseInt(document.getElementById('qtd-pequenos').value) || 0,
        observacoes: document.getElementById('observacoes-pasto').value.trim()
    };
    
    const total = dadosPasto.animaisGrandes + dadosPasto.animaisPequenos;
    
    if (adicionarItem(CHAVES_STORAGE.PASTOS, dadosPasto)) {
        fecharModal();
        renderizarListaPastos();
        
        /* Adiciona ao histórico */
        registrarNoHistorico('pasto', `Pasto "${dadosPasto.nome}" cadastrado (${dadosPasto.animaisGrandes} grandes, ${dadosPasto.animaisPequenos} pequenos)`);
    } else {
        alert('Erro ao salvar pasto. Tente novamente.');
    }
}

/* Atualiza um pasto existente */
function atualizarPasto(e) {
    e.preventDefault();
    
    const form = e.target;
    const id = form.dataset.id;
    
    /* Busca os dados atuais do pasto */
    const pastos = carregarDados(CHAVES_STORAGE.PASTOS);
    const pastoAtual = pastos.find(p => p.id === id);
    
    const animaisGrandes = parseInt(document.getElementById('qtd-grandes').value) || 0;
    const animaisPequenos = parseInt(document.getElementById('qtd-pequenos').value) || 0;
    
    /* Verifica se houve mudança na quantidade de animais */
    const mudouAnimais = pastoAtual && (
        pastoAtual.animaisGrandes !== animaisGrandes ||
        pastoAtual.animaisPequenos !== animaisPequenos
    );
    
    const dadosAtualizados = {
        nome: document.getElementById('nome-pasto').value.trim(),
        animaisGrandes: animaisGrandes,
        animaisPequenos: animaisPequenos,
        observacoes: document.getElementById('observacoes-pasto').value.trim()
    };
    
    /* Só atualiza a data se mudou o número de animais */
    if (mudouAnimais) {
        dadosAtualizados.dataAtualizacao = new Date().toISOString();
    }
    
    if (atualizarItem(CHAVES_STORAGE.PASTOS, id, dadosAtualizados)) {
        fecharModal();
        renderizarListaPastos();
        
        /* Adiciona ao histórico */
        registrarNoHistorico('pasto', `Pasto "${dadosAtualizados.nome}" atualizado (${dadosAtualizados.animaisGrandes} grandes, ${dadosAtualizados.animaisPequenos} pequenos)`);
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
