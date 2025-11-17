/* Módulo de Controle de Doenças - Gerencia registros de doenças e tratamentos do gado */

import { CHAVES_STORAGE, adicionarItem, carregarDados, atualizarItem, removerItem } from './storage.js';
import { obterFazendaAtiva } from './fazenda.js';

/* Obtém o nome do pasto a partir do id */
function obterNomePasto(pastoId) {
    if (!pastoId) return null;
    const pastos = carregarDados(CHAVES_STORAGE.PASTOS);
    const p = pastos.find(x => x.id === pastoId);
    return p ? p.nome : null;
}

/* Inicializa o módulo de doenças */
export function inicializar() {
    renderizarListaDoencas();
    configurarEventos();
    
    /* Recarrega quando a fazenda mudar */
    window.addEventListener('fazendaAlterada', renderizarListaDoencas);
}

/* Configura os eventos dos botões */
function configurarEventos() {
    const btnAdicionar = document.querySelector('[data-action="adicionar-doenca"]');
    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', mostrarFormularioAdicionar);
    }
}

/* Renderiza a lista de doenças na tela */
export function renderizarListaDoencas() {
    const container = document.querySelector('.lista-doencas');
    const fazendaAtiva = obterFazendaAtiva();
    
    if (!fazendaAtiva) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Selecione uma fazenda para visualizar doenças</p>
                <p class="hint">Use o seletor no topo da página</p>
            </div>
        `;
        return;
    }
    
    const todosRegistros = carregarDados(CHAVES_STORAGE.DOENCAS);
    const registros = todosRegistros.filter(r => r.fazendaId === fazendaAtiva);
    
    if (registros.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma doença registrada</p>
                <p class="hint">Clique em "+ Registrar Doença" para começar</p>
            </div>
        `;
        return;
    }
    
    /* Ordena por data (mais recente primeiro) */
    const registrosOrdenados = registros.sort((a, b) => {
        return new Date(b.dataRegistro) - new Date(a.dataRegistro);
    });
    
    container.innerHTML = registrosOrdenados.map(registro => criarCardDoenca(registro)).join('');
    adicionarEventosCards();
}

/* Cria o HTML de um card de doença */
function criarCardDoenca(registro) {
    const statusClass = registro.status === 'curado' ? 'badge-sucesso' : 
                       registro.status === 'tratamento' ? 'badge-alerta' : '';
    
    const statusTexto = registro.status === 'curado' ? 'Curado' :
                       registro.status === 'tratamento' ? 'Em Tratamento' :
                       'Ativo';
    const nomePasto = obterNomePasto(registro.pastoId);
    
    return `
        <div class="card" data-id="${registro.id}">
            <div class="card-header">
                <h3 class="card-title">${registro.identificacaoAnimal}</h3>
                <span class="card-badge ${statusClass}">${statusTexto}</span>
            </div>
            <div class="card-body">
                <div class="card-info">
                    <div class="card-info-item">
                        <strong>Doença:</strong> ${registro.nomeDoenca}
                    </div>
                    <div class="card-info-item">
                        <strong>Data:</strong> ${formatarData(registro.dataRegistro)}
                    </div>
                    ${nomePasto ? `
                        <div class="card-info-item">
                            <strong>Pasto:</strong> ${nomePasto}
                        </div>
                    ` : ''}
                    ${registro.tratamento ? `
                        <div class="card-info-item">
                            <strong>Tratamento:</strong> ${registro.tratamento}
                        </div>
                    ` : ''}
                    ${registro.veterinario ? `
                        <div class="card-info-item">
                            <strong>Veterinário:</strong> ${registro.veterinario}
                        </div>
                    ` : ''}
                    ${registro.observacoes ? `
                        <div class="card-info-item">
                            <strong>Obs:</strong> ${registro.observacoes}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-secondary btn-editar" data-id="${registro.id}">
                    Editar
                </button>
                <button class="btn-secondary btn-danger btn-remover" data-id="${registro.id}">
                    Remover
                </button>
            </div>
        </div>
    `;
}

/* Adiciona eventos de clique aos botões dos cards */
function adicionarEventosCards() {
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            mostrarFormularioEditar(id);
        });
    });
    
    document.querySelectorAll('.btn-remover').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            removerDoenca(id);
        });
    });
}

/* Mostra o formulário para adicionar nova doença */
function mostrarFormularioAdicionar() {
    const pastos = carregarDados(CHAVES_STORAGE.PASTOS);
    const options = pastos.length
        ? pastos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')
        : '<option value="">Nenhum pasto cadastrado</option>';
    const formularioHTML = `
        <form id="form-doenca">
            <div class="form-group">
                <label class="form-label" for="id-animal">Identificação do Animal *</label>
                <input 
                    type="text" 
                    id="id-animal" 
                    class="form-input" 
                    placeholder="Ex: Nº 123, Nome, Brinco, etc."
                    required
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="pasto-id">Pasto</label>
                <select id="pasto-id" class="select-filtro" ${pastos.length ? '' : 'disabled'}>
                    <option value="">Selecione um pasto</option>
                    ${options}
                </select>
                ${pastos.length ? '' : '<p class="hint">Cadastre um pasto para vincular</p>'}
            </div>
            
            <div class="form-group">
                <label class="form-label" for="nome-doenca">Nome da Doença *</label>
                <input 
                    type="text" 
                    id="nome-doenca" 
                    class="form-input" 
                    placeholder="Ex: Mastite, Verminose, etc."
                    required
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="data-registro">Data do Registro *</label>
                <input 
                    type="date" 
                    id="data-registro" 
                    class="form-input"
                    required
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="status-doenca">Status *</label>
                <select id="status-doenca" class="select-filtro" required>
                    <option value="ativo">Ativo</option>
                    <option value="tratamento">Em Tratamento</option>
                    <option value="curado">Curado</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="tratamento">Tratamento</label>
                <input 
                    type="text" 
                    id="tratamento" 
                    class="form-input" 
                    placeholder="Ex: Antibiótico, Vermífugo, etc."
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="observacoes-doenca">Observações</label>
                <textarea 
                    id="observacoes-doenca" 
                    class="form-textarea" 
                    placeholder="Sintomas, evolução, etc..."
                ></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn-primary btn-submit">
                    Salvar Registro
                </button>
                <button type="button" class="btn-secondary btn-cancel" id="cancelar-form">
                    Cancelar
                </button>
            </div>
        </form>
    `;
    
    mostrarModal('Registrar Nova Doença', formularioHTML);
    
    /* Define data atual como padrão */
    document.getElementById('data-registro').valueAsDate = new Date();
    
    document.getElementById('form-doenca').addEventListener('submit', salvarNovaDoenca);
    document.getElementById('cancelar-form').addEventListener('click', fecharModal);
}

/* Mostra o formulário para editar uma doença existente */
function mostrarFormularioEditar(id) {
    const registros = carregarDados(CHAVES_STORAGE.DOENCAS);
    const registro = registros.find(r => r.id === id);
    
    if (!registro) {
        alert('Registro não encontrado');
        return;
    }
    
    const pastos = carregarDados(CHAVES_STORAGE.PASTOS);
    const options = pastos.length
        ? pastos.map(p => `<option value="${p.id}" ${registro.pastoId === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')
        : '<option value="">Nenhum pasto cadastrado</option>';
    const formularioHTML = `
        <form id="form-doenca" data-id="${id}">
            <div class="form-group">
                <label class="form-label" for="id-animal">Identificação do Animal *</label>
                <input 
                    type="text" 
                    id="id-animal" 
                    class="form-input" 
                    value="${registro.identificacaoAnimal}"
                    required
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="pasto-id">Pasto</label>
                <select id="pasto-id" class="select-filtro" ${pastos.length ? '' : 'disabled'}>
                    <option value="">Selecione um pasto</option>
                    ${options}
                </select>
                ${pastos.length ? '' : '<p class="hint">Cadastre um pasto para vincular</p>'}
            </div>
            
            <div class="form-group">
                <label class="form-label" for="nome-doenca">Nome da Doença *</label>
                <input 
                    type="text" 
                    id="nome-doenca" 
                    class="form-input" 
                    value="${registro.nomeDoenca}"
                    required
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="data-registro">Data do Registro *</label>
                <input 
                    type="date" 
                    id="data-registro" 
                    class="form-input"
                    value="${registro.dataRegistro}"
                    required
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="status-doenca">Status *</label>
                <select id="status-doenca" class="select-filtro" required>
                    <option value="ativo" ${registro.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                    <option value="tratamento" ${registro.status === 'tratamento' ? 'selected' : ''}>Em Tratamento</option>
                    <option value="curado" ${registro.status === 'curado' ? 'selected' : ''}>Curado</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="tratamento">Tratamento</label>
                <input 
                    type="text" 
                    id="tratamento" 
                    class="form-input" 
                    value="${registro.tratamento || ''}"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="observacoes-doenca">Observações</label>
                <textarea 
                    id="observacoes-doenca" 
                    class="form-textarea"
                >${registro.observacoes || ''}</textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn-primary btn-submit">
                    Atualizar Registro
                </button>
                <button type="button" class="btn-secondary btn-cancel" id="cancelar-form">
                    Cancelar
                </button>
            </div>
        </form>
    `;
    
    mostrarModal('Editar Registro de Doença', formularioHTML);
    
    document.getElementById('form-doenca').addEventListener('submit', atualizarDoenca);
    document.getElementById('cancelar-form').addEventListener('click', fecharModal);
}

/* Salva uma nova doença */
function salvarNovaDoenca(e) {
    e.preventDefault();
    
    const fazendaAtiva = obterFazendaAtiva();
    
    if (!fazendaAtiva) {
        alert('Selecione uma fazenda antes de registrar uma doença');
        return;
    }
    
    const dadosDoenca = {
        fazendaId: fazendaAtiva,
        identificacaoAnimal: document.getElementById('id-animal').value.trim(),
        nomeDoenca: document.getElementById('nome-doenca').value.trim(),
        dataRegistro: document.getElementById('data-registro').value,
        status: document.getElementById('status-doenca').value,
        tratamento: document.getElementById('tratamento').value.trim(),
        observacoes: document.getElementById('observacoes-doenca').value.trim(),
        pastoId: (document.getElementById('pasto-id') && document.getElementById('pasto-id').value) || null
    };
    
    if (adicionarItem(CHAVES_STORAGE.DOENCAS, dadosDoenca)) {
        fecharModal();
        renderizarListaDoencas();
        registrarNoHistorico('doenca', `Doença registrada - Animal: ${dadosDoenca.identificacaoAnimal} - ${dadosDoenca.nomeDoenca}`);
    } else {
        alert('Erro ao salvar registro. Tente novamente.');
    }
}

/* Atualiza uma doença existente */
function atualizarDoenca(e) {
    e.preventDefault();
    
    const form = e.target;
    const id = form.dataset.id;
    
    const dadosAtualizados = {
        identificacaoAnimal: document.getElementById('id-animal').value.trim(),
        nomeDoenca: document.getElementById('nome-doenca').value.trim(),
        dataRegistro: document.getElementById('data-registro').value,
        status: document.getElementById('status-doenca').value,
        tratamento: document.getElementById('tratamento').value.trim(),
        observacoes: document.getElementById('observacoes-doenca').value.trim(),
        pastoId: (document.getElementById('pasto-id') && document.getElementById('pasto-id').value) || null
    };
    
    if (atualizarItem(CHAVES_STORAGE.DOENCAS, id, dadosAtualizados)) {
        fecharModal();
        renderizarListaDoencas();
        registrarNoHistorico('doenca', `Doença atualizada - Animal: ${dadosAtualizados.identificacaoAnimal} - ${dadosAtualizados.nomeDoenca}`);
    } else {
        alert('Erro ao atualizar registro. Tente novamente.');
    }
}

/* Remove uma doença */
function removerDoenca(id) {
    const registros = carregarDados(CHAVES_STORAGE.DOENCAS);
    const registro = registros.find(r => r.id === id);
    
    if (!registro) return;
    
    if (confirm(`Deseja realmente remover o registro de "${registro.nomeDoenca}" do animal "${registro.identificacaoAnimal}"?`)) {
        if (removerItem(CHAVES_STORAGE.DOENCAS, id)) {
            renderizarListaDoencas();
            registrarNoHistorico('doenca', `Doença removida - Animal: ${registro.identificacaoAnimal} - ${registro.nomeDoenca}`);
        } else {
            alert('Erro ao remover registro. Tente novamente.');
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

/* Formata uma data para formato brasileiro */
function formatarData(dataISO) {
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
}

/* Registra uma ação no histórico */
function registrarNoHistorico(tipo, descricao) {
    const fazendaAtiva = obterFazendaAtiva();
    
    adicionarItem(CHAVES_STORAGE.HISTORICO, {
        fazendaId: fazendaAtiva,
        tipo,
        descricao
    });
}
