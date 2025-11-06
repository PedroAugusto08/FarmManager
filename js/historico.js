/* Módulo de Histórico - Exibe todas as ações registradas no aplicativo */

import { CHAVES_STORAGE, carregarDados } from './storage.js';

/* Inicializa o módulo de histórico */
export function inicializar() {
    renderizarHistorico();
    configurarEventos();
}

/* Configura os eventos */
function configurarEventos() {
    const filtro = document.getElementById('filtro-tipo');
    if (filtro) {
        filtro.addEventListener('change', renderizarHistorico);
    }
}

/* Renderiza o histórico na tela */
export function renderizarHistorico() {
    const container = document.querySelector('.lista-historico');
    const registros = carregarDados(CHAVES_STORAGE.HISTORICO);
    
    if (registros.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhum registro no histórico</p>
                <p class="hint">Suas anotações aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    /* Aplica filtro se houver */
    const filtroTipo = document.getElementById('filtro-tipo')?.value || 'todos';
    const registrosFiltrados = filtroTipo === 'todos' 
        ? registros 
        : registros.filter(r => r.tipo === filtroTipo);
    
    /* Ordena por data (mais recente primeiro) */
    const registrosOrdenados = registrosFiltrados.sort((a, b) => {
        return new Date(b.dataCriacao) - new Date(a.dataCriacao);
    });
    
    if (registrosOrdenados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhum registro encontrado para este filtro</p>
            </div>
        `;
        return;
    }
    
    /* Agrupa por data */
    const registrosAgrupados = agruparPorData(registrosOrdenados);
    
    container.innerHTML = Object.entries(registrosAgrupados)
        .map(([data, items]) => criarGrupoData(data, items))
        .join('');
}

/* Agrupa registros por data */
function agruparPorData(registros) {
    return registros.reduce((grupos, registro) => {
        const data = formatarDataGrupo(registro.dataCriacao);
        if (!grupos[data]) {
            grupos[data] = [];
        }
        grupos[data].push(registro);
        return grupos;
    }, {});
}

/* Cria HTML para um grupo de data */
function criarGrupoData(data, items) {
    return `
        <div class="historico-grupo">
            <h3 class="historico-data">${data}</h3>
            ${items.map(item => criarItemHistorico(item)).join('')}
        </div>
    `;
}

/* Cria HTML para um item de histórico */
function criarItemHistorico(item) {
    const icone = obterIconeTipo(item.tipo);
    const corTipo = obterCorTipo(item.tipo);
    const hora = formatarHora(item.dataCriacao);
    
    return `
        <div class="historico-item">
            <div class="historico-icone" style="background-color: ${corTipo}">
                ${icone}
            </div>
            <div class="historico-conteudo">
                <p class="historico-descricao">${item.descricao}</p>
                <span class="historico-hora">${hora}</span>
            </div>
        </div>
    `;
}

/* Obtém o ícone baseado no tipo de registro */
function obterIconeTipo(tipo) {
    const icones = {
        pasto: '',
        prenhez: '',
        doenca: ''
    };
    return icones[tipo] || '';
}

/* Obtém a cor baseada no tipo de registro */
function obterCorTipo(tipo) {
    const cores = {
        pasto: '#4a7c2c',
        prenhez: '#ff6b35',
        doenca: '#f44336'
    };
    return cores[tipo] || '#666666';
}

/* Formata data para agrupamento */
function formatarDataGrupo(dataISO) {
    const data = new Date(dataISO);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
    /* Normaliza as datas para comparação (remove horas) */
    const dataFormatada = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const hojeFormatada = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const ontemFormatada = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate());
    
    if (dataFormatada.getTime() === hojeFormatada.getTime()) {
        return 'Hoje';
    } else if (dataFormatada.getTime() === ontemFormatada.getTime()) {
        return 'Ontem';
    } else {
        return data.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    }
}

/* Formata hora de um registro */
function formatarHora(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}
