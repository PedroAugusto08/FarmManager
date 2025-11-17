/* Módulo de Controle de Prenhez - Gerencia registros de prenhez do gado */

import { CHAVES_STORAGE, adicionarItem, carregarDados, atualizarItem, removerItem } from './storage.js';
import { obterFazendaAtiva } from './fazenda.js';

/* Obtém o nome do pasto a partir do id */
function obterNomePasto(pastoId) {
    if (!pastoId) return null;
    const pastos = carregarDados(CHAVES_STORAGE.PASTOS);
    const p = pastos.find(x => x.id === pastoId);
    return p ? p.nome : null;
}

/* Inicializa o módulo de prenhez */
export function inicializar() {
    renderizarListaPrenhez();
    configurarEventos();
    
    /* Recarrega quando a fazenda mudar */
    window.addEventListener('fazendaAlterada', renderizarListaPrenhez);
}

/* Configura os eventos dos botões */
function configurarEventos() {
    const btnAdicionar = document.querySelector('[data-action="adicionar-prenhez"]');
    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', mostrarFormularioAdicionar);
    }
}

/* Renderiza a lista de prenhez na tela */
export function renderizarListaPrenhez() {
    const container = document.querySelector('.lista-prenhez');
    const fazendaAtiva = obterFazendaAtiva();
    
    if (!fazendaAtiva) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Selecione uma fazenda para visualizar prenhez</p>
                <p class="hint">Use o seletor no topo da página</p>
            </div>
        `;
        return;
    }
    
    const todosRegistros = carregarDados(CHAVES_STORAGE.PRENHEZ);
    const registros = todosRegistros.filter(r => r.fazendaId === fazendaAtiva);
    
    if (registros.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma prenhez registrada</p>
                <p class="hint">Clique em "+ Registrar Prenhez" para começar</p>
            </div>
        `;
        return;
    }
    
    /* Ordena por data prevista de parto (mais próxima primeiro) */
    const registrosOrdenados = registros.sort((a, b) => {
        return new Date(a.dataPrevisaoParto) - new Date(b.dataPrevisaoParto);
    });
    
    container.innerHTML = registrosOrdenados.map(registro => criarCardPrenhez(registro)).join('');
    adicionarEventosCards();
}

/* Cria o HTML de um card de prenhez */
function criarCardPrenhez(registro) {
    const diasRestantes = calcularDiasRestantes(registro.dataPrevisaoParto);
    const statusClass = diasRestantes <= 30 ? 'badge-urgente' : '';
    const nomePasto = obterNomePasto(registro.pastoId);
    
    return `
        <div class="card" data-id="${registro.id}">
            <div class="card-header">
                <h3 class="card-title">Vaca: ${registro.identificacaoVaca}</h3>
                <span class="card-badge ${statusClass}">
                    ${diasRestantes > 0 ? `${diasRestantes} dias` : 'Vencido'}
                </span>
            </div>
            <div class="card-body">
                <div class="card-info">
                    <div class="card-info-item">
                        <strong>Touro:</strong> ${registro.identificacaoTouro || 'Não informado'}
                    </div>
                    <div class="card-info-item">
                        <strong>Data da Cobertura:</strong> ${formatarData(registro.dataCobertura)}
                    </div>
                    <div class="card-info-item">
                        <strong>Previsão de Parto:</strong> ${formatarData(registro.dataPrevisaoParto)}
                    </div>
                    ${nomePasto ? `
                        <div class="card-info-item">
                            <strong>Pasto:</strong> ${nomePasto}
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
            removerPrenhez(id);
        });
    });
}

/* Mostra o formulário para adicionar nova prenhez */
function mostrarFormularioAdicionar() {
    const pastos = carregarDados(CHAVES_STORAGE.PASTOS);
    const options = pastos.length
        ? pastos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')
        : '<option value="">Nenhum pasto cadastrado</option>';
    const formularioHTML = `
        <form id="form-prenhez">
            <div class="form-group">
                <label class="form-label" for="id-vaca">Identificação da Vaca *</label>
                <input 
                    type="text" 
                    id="id-vaca" 
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
                <label class="form-label" for="id-touro">Identificação do Touro</label>
                <input 
                    type="text" 
                    id="id-touro" 
                    class="form-input" 
                    placeholder="Ex: Nº 456, Nome, etc."
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="data-cobertura">Data da Cobertura</label>
                <input 
                    type="date" 
                    id="data-cobertura" 
                    class="form-input"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="data-parto">Previsão de Parto</label>
                <input 
                    type="date" 
                    id="data-parto" 
                    class="form-input"
                >
                <p class="hint">Gestação média: 283 dias (9 meses e 10 dias)</p>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="observacoes-prenhez">Observações</label>
                <textarea 
                    id="observacoes-prenhez" 
                    class="form-textarea" 
                    placeholder="Anotações sobre a prenhez..."
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
    
    mostrarModal('Registrar Nova Prenhez', formularioHTML);
    
    /* Adiciona listener para calcular automaticamente a previsão de parto */
    document.getElementById('data-cobertura').addEventListener('change', calcularPrevisaoParto);
    
    document.getElementById('form-prenhez').addEventListener('submit', salvarNovaPrenhez);
    document.getElementById('cancelar-form').addEventListener('click', fecharModal);
}

/* Mostra o formulário para editar uma prenhez existente */
function mostrarFormularioEditar(id) {
    const registros = carregarDados(CHAVES_STORAGE.PRENHEZ);
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
        <form id="form-prenhez" data-id="${id}">
            <div class="form-group">
                <label class="form-label" for="id-vaca">Identificação da Vaca *</label>
                <input 
                    type="text" 
                    id="id-vaca" 
                    class="form-input" 
                    value="${registro.identificacaoVaca}"
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
                <label class="form-label" for="id-touro">Identificação do Touro</label>
                <input 
                    type="text" 
                    id="id-touro" 
                    class="form-input" 
                    value="${registro.identificacaoTouro || ''}"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="data-cobertura">Data da Cobertura</label>
                <input 
                    type="date" 
                    id="data-cobertura" 
                    class="form-input"
                    value="${registro.dataCobertura}"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="data-parto">Previsão de Parto</label>
                <input 
                    type="date" 
                    id="data-parto" 
                    class="form-input"
                    value="${registro.dataPrevisaoParto}"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="observacoes-prenhez">Observações</label>
                <textarea 
                    id="observacoes-prenhez" 
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
    
    mostrarModal('Editar Prenhez', formularioHTML);
    
    document.getElementById('data-cobertura').addEventListener('change', calcularPrevisaoParto);
    document.getElementById('form-prenhez').addEventListener('submit', atualizarPrenhez);
    document.getElementById('cancelar-form').addEventListener('click', fecharModal);
}

/* Calcula automaticamente a previsão de parto baseada na data de cobertura */
function calcularPrevisaoParto() {
    const dataCobertura = document.getElementById('data-cobertura').value;
    if (!dataCobertura) return;
    
    const data = new Date(dataCobertura);
    /* Adiciona 283 dias (período médio de gestação bovina) */
    data.setDate(data.getDate() + 283);
    
    const dataFormatada = data.toISOString().split('T')[0];
    document.getElementById('data-parto').value = dataFormatada;
}

/* Salva uma nova prenhez */
function salvarNovaPrenhez(e) {
    e.preventDefault();
    
    const fazendaAtiva = obterFazendaAtiva();
    
    if (!fazendaAtiva) {
        alert('Selecione uma fazenda antes de registrar uma prenhez');
        return;
    }
    
    const dadosPrenhez = {
        fazendaId: fazendaAtiva,
        identificacaoVaca: document.getElementById('id-vaca').value.trim(),
        identificacaoTouro: document.getElementById('id-touro').value.trim(),
        dataCobertura: document.getElementById('data-cobertura').value,
        dataPrevisaoParto: document.getElementById('data-parto').value,
        observacoes: document.getElementById('observacoes-prenhez').value.trim(),
        pastoId: (document.getElementById('pasto-id') && document.getElementById('pasto-id').value) || null
    };
    
    if (adicionarItem(CHAVES_STORAGE.PRENHEZ, dadosPrenhez)) {
        fecharModal();
        renderizarListaPrenhez();
        registrarNoHistorico('prenhez', `Prenhez registrada - Vaca: ${dadosPrenhez.identificacaoVaca}`);
    } else {
        alert('Erro ao salvar registro. Tente novamente.');
    }
}

/* Atualiza uma prenhez existente */
function atualizarPrenhez(e) {
    e.preventDefault();
    
    const form = e.target;
    const id = form.dataset.id;
    
    const dadosAtualizados = {
        identificacaoVaca: document.getElementById('id-vaca').value.trim(),
        identificacaoTouro: document.getElementById('id-touro').value.trim(),
        dataCobertura: document.getElementById('data-cobertura').value,
        dataPrevisaoParto: document.getElementById('data-parto').value,
        observacoes: document.getElementById('observacoes-prenhez').value.trim(),
        pastoId: (document.getElementById('pasto-id') && document.getElementById('pasto-id').value) || null
    };
    
    if (atualizarItem(CHAVES_STORAGE.PRENHEZ, id, dadosAtualizados)) {
        fecharModal();
        renderizarListaPrenhez();
        registrarNoHistorico('prenhez', `Prenhez atualizada - Vaca: ${dadosAtualizados.identificacaoVaca}`);
    } else {
        alert('Erro ao atualizar registro. Tente novamente.');
    }
}

/* Remove uma prenhez */
function removerPrenhez(id) {
    const registros = carregarDados(CHAVES_STORAGE.PRENHEZ);
    const registro = registros.find(r => r.id === id);
    
    if (!registro) return;
    
    if (confirm(`Deseja realmente remover o registro da vaca "${registro.identificacaoVaca}"?`)) {
        if (removerItem(CHAVES_STORAGE.PRENHEZ, id)) {
            renderizarListaPrenhez();
            registrarNoHistorico('prenhez', `Prenhez removida - Vaca: ${registro.identificacaoVaca}`);
        } else {
            alert('Erro ao remover registro. Tente novamente.');
        }
    }
}

/* Calcula dias restantes até a data prevista */
function calcularDiasRestantes(dataPrevisao) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const previsao = new Date(dataPrevisao);
    previsao.setHours(0, 0, 0, 0);
    
    const diffTime = previsao - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
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
