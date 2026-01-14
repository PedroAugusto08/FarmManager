/* Módulo de Histórico - Exibe todas as ações registradas no aplicativo */

import { CHAVES_STORAGE, carregarDados } from './storage.js';
import { obterFazendaAtiva } from './fazenda.js';

/* Inicializa o módulo de histórico */
export function inicializar() {
    renderizarHistorico();
    configurarEventos();
    
    /* Recarrega quando a fazenda mudar */
    window.addEventListener('fazendaAlterada', renderizarHistorico);
}

/* Configura os eventos */
function configurarEventos() {
    const filtro = document.getElementById('filtro-tipo');
    if (filtro) {
        filtro.addEventListener('change', renderizarHistorico);
    }

    const container = document.querySelector('.lista-historico');
    if (container) {
        container.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.historico-item');
            if (!itemEl) return;
            const id = itemEl.dataset.id;
            if (!id) return;
            abrirDetalhesHistorico(id);
        });

        container.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const itemEl = e.target.closest('.historico-item');
            if (!itemEl) return;
            const id = itemEl.dataset.id;
            if (!id) return;
            e.preventDefault();
            abrirDetalhesHistorico(id);
        });
    }
}

/* Renderiza o histórico na tela */
export function renderizarHistorico() {
    const container = document.querySelector('.lista-historico');
    const fazendaAtiva = obterFazendaAtiva();
    
    if (!fazendaAtiva) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Selecione uma fazenda para visualizar o histórico</p>
                <p class="hint">Use o seletor no topo da página</p>
            </div>
        `;
        return;
    }
    
    const todosRegistros = carregarDados(CHAVES_STORAGE.HISTORICO);
    const registros = todosRegistros.filter(r => r.fazendaId === fazendaAtiva);
    
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
        <div class="historico-item" role="button" tabindex="0" data-id="${item.id}" aria-label="Ver detalhes do registro">
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

function abrirDetalhesHistorico(registroId) {
    const fazendaAtiva = obterFazendaAtiva();
    if (!fazendaAtiva) return;

    const todosRegistros = carregarDados(CHAVES_STORAGE.HISTORICO);
    const registrosFazenda = todosRegistros
        .filter(r => r.fazendaId === fazendaAtiva)
        .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));

    const registro = registrosFazenda.find(r => r.id === registroId);
    if (!registro) return;

    const titulo = 'Detalhes do Histórico';
    const conteudo = montarConteudoDetalhes(registro, registrosFazenda);
    mostrarModal(titulo, conteudo);
}

function montarConteudoDetalhes(registro, registrosOrdenadosAsc) {
    const data = new Date(registro.dataCriacao);
    const dataStr = data.toLocaleDateString('pt-BR');
    const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const tipoExibicao = formatarTipoParaModal(registro);

    const mapaPastos = criarMapaPastosPorFazenda(registro.fazendaId);

    const detalhes = obterDetalhesRegistro(registro, registrosOrdenadosAsc, { mapaPastos });
    const detalhesFiltrados = filtrarDetalhesParaModal(detalhes, registro?.tipo);
    const blocos = [];

    blocos.push(`
        <div class="historico-detalhes">
            <div class="historico-detalhes-resumo">
                <div class="historico-detalhes-linha"><span class="k">Tipo</span><span class="v">${escapeHtml(tipoExibicao)}</span></div>
                <div class="historico-detalhes-linha"><span class="k">Quando</span><span class="v">${dataStr} ${horaStr}</span></div>
            </div>
        </div>
    `);

    if (detalhesFiltrados?.antes || detalhesFiltrados?.depois) {
        blocos.push('<div class="historico-detalhes-grid">');
        if (detalhesFiltrados.antes) {
            blocos.push(renderizarBlocoKeyValue('Antes', detalhesFiltrados.antes));
        }
        if (detalhesFiltrados.depois) {
            blocos.push(renderizarBlocoKeyValue('Agora', detalhesFiltrados.depois));
        }
        blocos.push('</div>');
    } else if (detalhesFiltrados?.info) {
        blocos.push(`
            <div class="historico-detalhes-info">${escapeHtml(detalhesFiltrados.info)}</div>
        `);
    } else {
        blocos.push('<div class="historico-detalhes-info">Sem detalhes adicionais salvos para este registro.</div>');
    }

    return blocos.join('');
}

function obterDetalhesRegistro(registro, registrosOrdenadosAsc, context = {}) {
    /* Novo formato: meta.before / meta.after */
    if (registro && registro.meta && (registro.meta.before || registro.meta.after)) {
        const antes = normalizarObjetoDetalhe(registro.meta.before, {
            ...context,
            tipoRegistro: registro.tipo
        });
        const depois = normalizarObjetoDetalhe(registro.meta.after, {
            ...context,
            tipoRegistro: registro.tipo
        });
        return {
            antes: antes && Object.keys(antes).length ? antes : null,
            depois: depois && Object.keys(depois).length ? depois : null
        };
    }

    /* Fallback para itens legados: tenta inferir "antes" baseado no histórico */
    if (registro.tipo === 'pasto') {
        const parsed = parsePastoDescricao(registro.descricao || '');
        if (parsed && parsed.acao === 'atualizado' && parsed.after) {
            const before = inferirAntesPastoPorHistorico(registro, registrosOrdenadosAsc, {
                pastoId: registro?.meta?.pastoId || null,
                nomePasto: parsed.nome
            });
            const depois = {
                'Grandes': parsed.after.animaisGrandes,
                'Pequenos': parsed.after.animaisPequenos,
                'Total': (parsed.after.animaisGrandes || 0) + (parsed.after.animaisPequenos || 0)
            };

            return {
                antes: before,
                depois
            };
        }

        if (parsed && parsed.after) {
            const depois = {
                'Grandes': parsed.after.animaisGrandes,
                'Pequenos': parsed.after.animaisPequenos,
                'Total': (parsed.after.animaisGrandes || 0) + (parsed.after.animaisPequenos || 0)
            };
            return { depois };
        }

        return { info: 'Este registro não tem números associados para detalhar.' };
    }

    return null;
}

function parsePastoDescricao(descricao) {
    const atualizado = descricao.match(/^Pasto\s+"(.+?)"\s+atualizado\s*\((\d+)\s+grandes,\s*(\d+)\s+pequenos\)\s*$/i);
    if (atualizado) {
        return {
            acao: 'atualizado',
            nome: atualizado[1],
            after: {
                animaisGrandes: Number(atualizado[2]),
                animaisPequenos: Number(atualizado[3])
            }
        };
    }

    const cadastrado = descricao.match(/^Pasto\s+"(.+?)"\s+cadastrado\s*\((\d+)\s+grandes,\s*(\d+)\s+pequenos\)\s*$/i);
    if (cadastrado) {
        return {
            acao: 'cadastrado',
            nome: cadastrado[1],
            after: {
                animaisGrandes: Number(cadastrado[2]),
                animaisPequenos: Number(cadastrado[3])
            }
        };
    }

    return null;
}

function inferirAntesPastoPorHistorico(registroAtual, registrosOrdenadosAsc, { pastoId = null, nomePasto = null } = {}) {
    const idx = registrosOrdenadosAsc.findIndex(r => r.id === registroAtual.id);
    const anteriores = idx >= 0 ? registrosOrdenadosAsc.slice(0, idx).reverse() : [...registrosOrdenadosAsc].reverse();

    for (const r of anteriores) {
        if (r.tipo !== 'pasto') continue;

        const rPastoId = r?.meta?.pastoId != null ? String(r.meta.pastoId) : null;
        const alvoPastoId = pastoId != null ? String(pastoId) : null;

        /* Se temos pastoId, preferimos match por id (resistente a renome) */
        if (alvoPastoId && rPastoId && rPastoId !== alvoPastoId) {
            continue;
        }

        /* Se não temos id em um dos lados, cai para match por nome (legado) */
        if (!alvoPastoId) {
            const parsedNome = parsePastoDescricao(r.descricao || '')?.nome || null;
            if ((parsedNome || '') !== (nomePasto || '')) continue;
        } else if (!rPastoId && nomePasto) {
            /* Quando alvo tem id mas registro antigo não tem, tenta conferir nome */
            const parsedNome = parsePastoDescricao(r.descricao || '')?.nome || null;
            if (parsedNome && (parsedNome !== nomePasto)) continue;
        }

        const snapshot = extrairSnapshotPasto(r);
        if (!snapshot) continue;

        return snapshot;
    }

    return { info: 'Não foi possível inferir o valor anterior a partir do histórico.' };
}

function extrairSnapshotPasto(registro) {
    /* Preferência: meta.after (estado após ação) */
    const after = registro?.meta?.after;
    if (after && (typeof after.animaisGrandes === 'number' || typeof after.animaisPequenos === 'number')) {
        const grandes = Number(after.animaisGrandes) || 0;
        const pequenos = Number(after.animaisPequenos) || 0;
        return {
            'Grandes': grandes,
            'Pequenos': pequenos,
            'Total': grandes + pequenos
        };
    }

    /* Em remoções, pode existir só meta.before */
    const before = registro?.meta?.before;
    if (before && (typeof before.animaisGrandes === 'number' || typeof before.animaisPequenos === 'number')) {
        const grandes = Number(before.animaisGrandes) || 0;
        const pequenos = Number(before.animaisPequenos) || 0;
        return {
            'Grandes': grandes,
            'Pequenos': pequenos,
            'Total': grandes + pequenos
        };
    }

    /* Legado: tenta parsear a descrição */
    const parsed = parsePastoDescricao(registro?.descricao || '');
    if (parsed?.after) {
        const grandes = Number(parsed.after.animaisGrandes) || 0;
        const pequenos = Number(parsed.after.animaisPequenos) || 0;
        return {
            'Grandes': grandes,
            'Pequenos': pequenos,
            'Total': grandes + pequenos
        };
    }

    return null;
}

function normalizarObjetoDetalhe(obj, context = {}) {
    if (!obj || typeof obj !== 'object') return null;

    /* Se for o formato de pasto, já devolve "bonitinho" */
    if (typeof obj.animaisGrandes === 'number' || typeof obj.animaisPequenos === 'number') {
        const grandes = Number(obj.animaisGrandes) || 0;
        const pequenos = Number(obj.animaisPequenos) || 0;
        return {
            'Grandes': grandes,
            'Pequenos': pequenos,
            'Total': grandes + pequenos
        };
    }

    /* Caso geral: mantém chaves, mas humaniza */
    const saida = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue;

        /* Em prenhez/doença, exibe nome do pasto ao invés do ID */
        if (k === 'pastoId') {
            const tipoRegistro = (context.tipoRegistro || '').toLowerCase();
            if (tipoRegistro !== 'pasto') {
                if (!v) continue;
                const nomePasto = resolverNomePasto(v, context.mapaPastos);
                saida['Pasto'] = nomePasto || String(v);
                continue;
            }
            /* Em registro de pasto, não mostra pastoId */
            continue;
        }

        const key = humanizarChave(k);
        saida[key] = formatarValor(v);
    }
    return saida;
}

function humanizarChave(chave) {
    return String(chave)
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/^\w/, c => c.toUpperCase());
}

function formatarValor(valor) {
    if (valor === null) return '—';
    if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
    if (typeof valor === 'string') return valor.trim() === '' ? '—' : valor;
    if (typeof valor === 'number') return valor;
    if (Array.isArray(valor)) return valor.length ? valor.join(', ') : '—';
    if (typeof valor === 'object') return JSON.stringify(valor);
    return String(valor);
}

function renderizarBlocoKeyValue(titulo, obj) {
    if (!obj || typeof obj !== 'object') return '';
    const linhas = Object.entries(obj)
        .map(([k, v]) => {
            if (k === 'info') {
                return `<div class="historico-detalhes-linha"><span class="k">Info</span><span class="v">${escapeHtml(String(v))}</span></div>`;
            }
            return `<div class="historico-detalhes-linha"><span class="k">${escapeHtml(String(k))}</span><span class="v">${escapeHtml(String(v))}</span></div>`;
        })
        .join('');
    return `
        <div class="historico-detalhes-card">
            <h4 class="historico-detalhes-titulo">${escapeHtml(titulo)}</h4>
            <div class="historico-detalhes-kv">${linhas}</div>
        </div>
    `;
}

function mostrarModal(titulo, conteudo) {
    const modal = document.getElementById('modal-overlay');
    const modalTitulo = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    if (!modal || !modalTitulo || !modalBody) return;

    modalTitulo.textContent = titulo;
    modalBody.innerHTML = conteudo;
    aplicarTecladoNumerico(modalBody);
    modal.classList.add('active');

    /* Fecha modal ao clicar no overlay */
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

function aplicarTecladoNumerico(container) {
    if (!container) return;

    container.querySelectorAll('input[type="number"]').forEach(input => {
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
        if (!input.hasAttribute('step')) input.setAttribute('step', '1');
    });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatarTipoParaModal(registro) {
    const tipo = (registro?.tipo || '').toLowerCase();
    if (tipo === 'pasto') {
        const nome =
            registro?.meta?.after?.nome ||
            registro?.meta?.before?.nome ||
            parsePastoDescricao(registro?.descricao || '')?.nome ||
            '';

        return nome ? `Pasto - ${nome}` : 'Pasto';
    }

    if (!tipo) return '';
    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

function criarMapaPastosPorFazenda(fazendaId) {
    if (!fazendaId) return null;
    const todosPastos = carregarDados(CHAVES_STORAGE.PASTOS);
    const pastos = todosPastos.filter(p => p.fazendaId === fazendaId);
    const mapa = new Map();
    for (const p of pastos) {
        if (!p?.id) continue;
        mapa.set(String(p.id), p.nome || String(p.id));
    }
    return mapa;
}

function resolverNomePasto(pastoId, mapaPastos) {
    if (!pastoId) return '';
    const idStr = String(pastoId);
    if (mapaPastos && mapaPastos instanceof Map) {
        return mapaPastos.get(idStr) || '';
    }
    return '';
}

function filtrarDetalhesParaModal(detalhes, tipoRegistro) {
    if (!detalhes) return null;

    const tipo = String(tipoRegistro || '').toLowerCase();
    const deveOmitirVazios = (tipo === 'prenhez' || tipo === 'doenca');
    if (!deveOmitirVazios) return detalhes;

    if (detalhes.info) return detalhes;

    const antes = detalhes.antes && typeof detalhes.antes === 'object' ? detalhes.antes : null;
    const depois = detalhes.depois && typeof detalhes.depois === 'object' ? detalhes.depois : null;

    if (antes && depois) {
        const chaves = new Set([...Object.keys(antes), ...Object.keys(depois)]);
        const chavesManter = [...chaves].filter((k) => {
            return !valorVazioParaModal(antes[k]) || !valorVazioParaModal(depois[k]);
        });

        const antesFiltrado = {};
        const depoisFiltrado = {};

        for (const k of chavesManter) {
            if (Object.prototype.hasOwnProperty.call(antes, k)) antesFiltrado[k] = antes[k];
            else antesFiltrado[k] = '—';

            if (Object.prototype.hasOwnProperty.call(depois, k)) depoisFiltrado[k] = depois[k];
            else depoisFiltrado[k] = '—';
        }

        return {
            antes: Object.keys(antesFiltrado).length ? antesFiltrado : null,
            depois: Object.keys(depoisFiltrado).length ? depoisFiltrado : null
        };
    }

    if (depois) {
        const depoisFiltrado = filtrarObjetoRemovendoVazios(depois);
        return { depois: Object.keys(depoisFiltrado).length ? depoisFiltrado : null };
    }

    if (antes) {
        const antesFiltrado = filtrarObjetoRemovendoVazios(antes);
        return { antes: Object.keys(antesFiltrado).length ? antesFiltrado : null };
    }

    return null;
}

function filtrarObjetoRemovendoVazios(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (valorVazioParaModal(v)) continue;
        out[k] = v;
    }
    return out;
}

function valorVazioParaModal(v) {
    if (v === null || v === undefined) return true;
    if (typeof v === 'string') {
        const s = v.trim();
        return s === '' || s === '—';
    }
    return false;
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
