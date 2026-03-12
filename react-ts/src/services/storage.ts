import type { Doenca, Fazenda, Historico, Pasto, Prenhez } from '../types/domain';

export const STORAGE_KEYS = {
  fazendas: 'fazenda_fazendas',
  pastos: 'fazenda_pastos',
  prenhez: 'fazenda_prenhez',
  doencas: 'fazenda_doencas',
  historico: 'fazenda_historico',
  fazendaAtiva: 'fazenda_ativa'
} as const;

function lerLista<T>(chave: string): T[] {
  try {
    const bruto = localStorage.getItem(chave);
    const parseado = bruto ? (JSON.parse(bruto) as unknown) : [];
    return Array.isArray(parseado) ? (parseado as T[]) : [];
  } catch {
    return [];
  }
}

function salvarLista<T>(chave: string, dados: T[]): void {
  localStorage.setItem(chave, JSON.stringify(dados));
}

function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function carregarSnapshot() {
  const fazendas = lerLista<Fazenda>(STORAGE_KEYS.fazendas);
  const pastos = lerLista<Pasto>(STORAGE_KEYS.pastos);
  const prenhezes = lerLista<Prenhez>(STORAGE_KEYS.prenhez);
  const doencas = lerLista<Doenca>(STORAGE_KEYS.doencas);
  const historico = lerLista<Historico>(STORAGE_KEYS.historico);
  const fazendaAtiva = localStorage.getItem(STORAGE_KEYS.fazendaAtiva);

  return {
    fazendas,
    pastos,
    prenhezes,
    doencas,
    historico,
    fazendaAtiva
  };
}

export function criarFazenda(nome: string): Fazenda | null {
  const valor = nome.trim();
  if (!valor) return null;

  const fazendas = lerLista<Fazenda>(STORAGE_KEYS.fazendas);
  const nova: Fazenda = {
    id: gerarId(),
    nome: valor,
    dataCriacao: new Date().toISOString()
  };

  salvarLista(STORAGE_KEYS.fazendas, [...fazendas, nova]);
  return nova;
}

export function removerFazenda(fazendaId: string): void {
  const fazendas = lerLista<Fazenda>(STORAGE_KEYS.fazendas);
  const filtradas = fazendas.filter((fazenda) => fazenda.id !== fazendaId);
  salvarLista(STORAGE_KEYS.fazendas, filtradas);

  if (localStorage.getItem(STORAGE_KEYS.fazendaAtiva) === fazendaId) {
    localStorage.removeItem(STORAGE_KEYS.fazendaAtiva);
  }
}

export function definirFazendaAtiva(fazendaId: string | null): void {
  if (!fazendaId) {
    localStorage.removeItem(STORAGE_KEYS.fazendaAtiva);
    return;
  }

  localStorage.setItem(STORAGE_KEYS.fazendaAtiva, fazendaId);
}
