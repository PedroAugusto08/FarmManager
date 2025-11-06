/* Módulo de armazenamento local usando localStorage - Responsável por salvar e recuperar dados do navegador */

/* Chaves para armazenamento */
const CHAVES_STORAGE = {
    PASTOS: 'fazenda_pastos',
    PRENHEZ: 'fazenda_prenhez',
    DOENCAS: 'fazenda_doencas',
    HISTORICO: 'fazenda_historico'
};

/* Salva dados no localStorage */
export function salvarDados(chave, dados) {
    try {
        const dadosJSON = JSON.stringify(dados);
        localStorage.setItem(chave, dadosJSON);
        return true;
    } catch (erro) {
        console.error('Erro ao salvar dados:', erro);
        return false;
    }
}

/* Carrega dados do localStorage - @param chave: Chave de armazenamento - @returns Dados recuperados ou array vazio */
export function carregarDados(chave) {
    try {
        const dadosJSON = localStorage.getItem(chave);
        return dadosJSON ? JSON.parse(dadosJSON) : [];
    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        return [];
    }
}

/* Adiciona um novo item aos dados existentes */
export function adicionarItem(chave, item) {
    const dados = carregarDados(chave);
    const novoItem = {
        ...item,
        id: gerarId(),
        dataCriacao: new Date().toISOString()
    };
    dados.push(novoItem);
    return salvarDados(chave, dados);
}

/* Atualiza um item existente */
export function atualizarItem(chave, id, dadosAtualizados) {
    const dados = carregarDados(chave);
    const indice = dados.findIndex(item => item.id === id);
    
    if (indice === -1) {
        console.error('Item não encontrado');
        return false;
    }
    
    dados[indice] = {
        ...dados[indice],
        ...dadosAtualizados,
        dataAtualizacao: new Date().toISOString()
    };
    
    return salvarDados(chave, dados);
}

/* Remove um item */
export function removerItem(chave, id) {
    const dados = carregarDados(chave);
    const dadosFiltrados = dados.filter(item => item.id !== id);
    return salvarDados(chave, dadosFiltrados);
}

/* Busca um item específico por ID */
export function buscarItemPorId(chave, id) {
    const dados = carregarDados(chave);
    return dados.find(item => item.id === id) || null;
}

/* Gera um ID único baseado em timestamp e número aleatório */
function gerarId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/* Limpa todos os dados do localStorage */
export function limparTodosDados() {
    if (confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
        Object.values(CHAVES_STORAGE).forEach(chave => {
            localStorage.removeItem(chave);
        });
        return true;
    }
    return false;
}

/* Exporta as chaves para uso em outros módulos */
export { CHAVES_STORAGE };
