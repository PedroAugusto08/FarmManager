/* Módulo de Gerenciamento de Fazendas - Controla seleção e cadastro de fazendas */

import { CHAVES_STORAGE, adicionarItem, carregarDados, atualizarItem, removerItem } from './storage.js';

const CHAVE_FAZENDA_ATIVA = 'fazenda_ativa';

/* Inicializa o módulo de fazendas */
export function inicializar() {
    popularSelectFazendas();
    configurarEventos();
    restaurarFazendaAtiva();
}

/* Retorna o ID da fazenda atualmente selecionada */
export function obterFazendaAtiva() {
    return localStorage.getItem(CHAVE_FAZENDA_ATIVA);
}

/* Define a fazenda ativa */
export function setarFazendaAtiva(fazendaId) {
    if (fazendaId) {
        localStorage.setItem(CHAVE_FAZENDA_ATIVA, fazendaId);
    } else {
        localStorage.removeItem(CHAVE_FAZENDA_ATIVA);
    }
    /* Dispara evento customizado para outros módulos reagirem */
    window.dispatchEvent(new CustomEvent('fazendaAlterada', { detail: { fazendaId } }));
}

/* Popula o select com as fazendas cadastradas */
export function popularSelectFazendas() {
    const select = document.getElementById('select-fazenda');
    if (!select) return;
    
    const fazendas = carregarDados(CHAVES_STORAGE.FAZENDAS);
    const fazendaAtiva = obterFazendaAtiva();
    
    /* Limpa opções anteriores (exceto a primeira) */
    select.innerHTML = '<option value="">Selecione uma fazenda...</option>';
    
    if (fazendas.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Nenhuma fazenda cadastrada';
        opt.disabled = true;
        select.appendChild(opt);
        return;
    }
    
    fazendas.forEach(fazenda => {
        const opt = document.createElement('option');
        opt.value = fazenda.id;
        opt.textContent = fazenda.nome;
        if (fazenda.id === fazendaAtiva) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
}

/* Restaura a última fazenda selecionada */
function restaurarFazendaAtiva() {
    const fazendaAtiva = obterFazendaAtiva();
    const select = document.getElementById('select-fazenda');
    
    if (fazendaAtiva && select) {
        select.value = fazendaAtiva;
    } else {
        /* Se não tem fazenda ativa, abre o modal de cadastro */
        const fazendas = carregarDados(CHAVES_STORAGE.FAZENDAS);
        if (fazendas.length === 0) {
            setTimeout(() => {
                if (confirm('Você ainda não cadastrou nenhuma fazenda. Deseja cadastrar agora?')) {
                    mostrarModalGerenciarFazendas();
                }
            }, 500);
        }
    }
}

/* Configura eventos do select e botão */
function configurarEventos() {
    const select = document.getElementById('select-fazenda');
    const btnGerenciar = document.getElementById('btn-gerenciar-fazendas');
    
    if (select) {
        select.addEventListener('change', (e) => {
            setarFazendaAtiva(e.target.value);
        });
    }
    
    if (btnGerenciar) {
        btnGerenciar.addEventListener('click', mostrarModalGerenciarFazendas);
    }
}

/* Mostra modal para gerenciar fazendas (adicionar, editar, remover) */
function mostrarModalGerenciarFazendas() {
    const fazendas = carregarDados(CHAVES_STORAGE.FAZENDAS);
    
    const listaHTML = fazendas.length === 0 
        ? '<p class="hint">Nenhuma fazenda cadastrada ainda</p>'
        : fazendas.map(f => `
            <div class="fazenda-item" data-id="${f.id}">
                <div class="fazenda-info">
                    <strong>${f.nome}</strong>
                    ${f.localizacao ? `<span class="hint">${f.localizacao}</span>` : ''}
                </div>
                <div class="fazenda-actions">
                    <button class="btn-mini btn-editar-fazenda" data-id="${f.id}">✏️</button>
                    <button class="btn-mini btn-danger btn-remover-fazenda" data-id="${f.id}">🗑️</button>
                </div>
            </div>
        `).join('');
    
    const conteudoHTML = `
        <div class="gerenciar-fazendas">
            <button class="btn-primary" id="btn-adicionar-fazenda" style="margin-bottom: 1rem;">
                + Adicionar Fazenda
            </button>
            <div class="lista-fazendas">
                ${listaHTML}
            </div>
        </div>
    `;
    
    mostrarModal('Gerenciar Fazendas', conteudoHTML);
    
    /* Adiciona eventos aos botões */
    document.getElementById('btn-adicionar-fazenda')?.addEventListener('click', mostrarFormularioAdicionar);
    
    document.querySelectorAll('.btn-editar-fazenda').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            mostrarFormularioEditar(id);
        });
    });
    
    document.querySelectorAll('.btn-remover-fazenda').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            removerFazenda(id);
        });
    });
}

/* Mostra formulário para adicionar fazenda */
function mostrarFormularioAdicionar() {
    const formularioHTML = `
        <form id="form-fazenda">
            <div class="form-group">
                <label class="form-label" for="nome-fazenda">Nome da Fazenda *</label>
                <input 
                    type="text" 
                    id="nome-fazenda" 
                    class="form-input" 
                    placeholder="Ex: Fazenda Santa Rita"
                    required
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="localizacao-fazenda">Localização</label>
                <input 
                    type="text" 
                    id="localizacao-fazenda" 
                    class="form-input" 
                    placeholder="Ex: Município, Estado"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="observacoes-fazenda">Observações</label>
                <textarea 
                    id="observacoes-fazenda" 
                    class="form-textarea" 
                    placeholder="Informações adicionais..."
                ></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn-primary btn-submit">
                    Salvar Fazenda
                </button>
                <button type="button" class="btn-secondary btn-cancel" id="cancelar-form">
                    Cancelar
                </button>
            </div>
        </form>
    `;
    
    mostrarModal('Adicionar Fazenda', formularioHTML);
    
    document.getElementById('form-fazenda').addEventListener('submit', salvarNovaFazenda);
    document.getElementById('cancelar-form').addEventListener('click', () => {
        mostrarModalGerenciarFazendas();
    });
}

/* Mostra formulário para editar fazenda */
function mostrarFormularioEditar(id) {
    const fazendas = carregarDados(CHAVES_STORAGE.FAZENDAS);
    const fazenda = fazendas.find(f => String(f.id) === String(id));
    
    if (!fazenda) {
        alert('Fazenda não encontrada');
        return;
    }
    
    const formularioHTML = `
        <form id="form-fazenda" data-id="${id}">
            <div class="form-group">
                <label class="form-label" for="nome-fazenda">Nome da Fazenda *</label>
                <input 
                    type="text" 
                    id="nome-fazenda" 
                    class="form-input" 
                    value="${fazenda.nome}"
                    required
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="localizacao-fazenda">Localização</label>
                <input 
                    type="text" 
                    id="localizacao-fazenda" 
                    class="form-input" 
                    value="${fazenda.localizacao || ''}"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label" for="observacoes-fazenda">Observações</label>
                <textarea 
                    id="observacoes-fazenda" 
                    class="form-textarea"
                >${fazenda.observacoes || ''}</textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn-primary btn-submit">
                    Atualizar Fazenda
                </button>
                <button type="button" class="btn-secondary btn-cancel" id="cancelar-form">
                    Cancelar
                </button>
            </div>
        </form>
    `;
    
    mostrarModal('Editar Fazenda', formularioHTML);
    
    document.getElementById('form-fazenda').addEventListener('submit', atualizarFazenda);
    document.getElementById('cancelar-form').addEventListener('click', () => {
        mostrarModalGerenciarFazendas();
    });
}

/* Salva nova fazenda */
function salvarNovaFazenda(e) {
    e.preventDefault();
    
    const dadosFazenda = {
        nome: document.getElementById('nome-fazenda').value.trim(),
        localizacao: document.getElementById('localizacao-fazenda').value.trim(),
        observacoes: document.getElementById('observacoes-fazenda').value.trim()
    };
    
    if (adicionarItem(CHAVES_STORAGE.FAZENDAS, dadosFazenda)) {
        popularSelectFazendas();
        mostrarModalGerenciarFazendas();
        
        /* Se é a primeira fazenda, seleciona automaticamente */
        const fazendas = carregarDados(CHAVES_STORAGE.FAZENDAS);
        if (fazendas.length === 1) {
            setarFazendaAtiva(fazendas[0].id);
            document.getElementById('select-fazenda').value = fazendas[0].id;
        }
    } else {
        alert('Erro ao salvar fazenda. Tente novamente.');
    }
}

/* Atualiza fazenda existente */
function atualizarFazenda(e) {
    e.preventDefault();
    
    const form = e.target;
    const id = form.dataset.id;
    
    const dadosAtualizados = {
        nome: document.getElementById('nome-fazenda').value.trim(),
        localizacao: document.getElementById('localizacao-fazenda').value.trim(),
        observacoes: document.getElementById('observacoes-fazenda').value.trim()
    };
    
    if (atualizarItem(CHAVES_STORAGE.FAZENDAS, id, dadosAtualizados)) {
        popularSelectFazendas();
        mostrarModalGerenciarFazendas();
    } else {
        alert('Erro ao atualizar fazenda. Tente novamente.');
    }
}

/* Remove uma fazenda */
function removerFazenda(id) {
    const fazendas = carregarDados(CHAVES_STORAGE.FAZENDAS);
    const fazenda = fazendas.find(f => String(f.id) === String(id));
    
    if (!fazenda) return;
    
    if (confirm(`Deseja realmente remover a fazenda "${fazenda.nome}"?\n\nAtenção: Os dados de pastos, prenhez e doenças vinculados a esta fazenda NÃO serão removidos.`)) {
        if (removerItem(CHAVES_STORAGE.FAZENDAS, id)) {
            /* Se estava selecionada, limpa seleção */
            if (obterFazendaAtiva() === id) {
                setarFazendaAtiva(null);
            }
            popularSelectFazendas();
            mostrarModalGerenciarFazendas();
        } else {
            alert('Erro ao remover fazenda. Tente novamente.');
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
