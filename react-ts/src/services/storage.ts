import type {
  Doenca,
  Fazenda,
  Historico,
  Pasto,
  Prenhez,
  StatusDoenca,
  TipoHistorico
} from '../types/domain';

export const STORAGE_KEYS = {
  fazendas: 'fazenda_fazendas',
  pastos: 'fazenda_pastos',
  prenhez: 'fazenda_prenhez',
  doencas: 'fazenda_doencas',
  historico: 'fazenda_historico',
  fazendaAtiva: 'fazenda_ativa'
} as const;

function lerItem(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function escreverItem(chave: string, valor: string): boolean {
  try {
    localStorage.setItem(chave, valor);
    return true;
  } catch {
    return false;
  }
}

function removerItem(chave: string): boolean {
  try {
    localStorage.removeItem(chave);
    return true;
  } catch {
    return false;
  }
}

function lerLista<T>(chave: string): T[] {
  try {
    const bruto = lerItem(chave);
    const parseado = bruto ? (JSON.parse(bruto) as unknown) : [];
    return Array.isArray(parseado) ? (parseado as T[]) : [];
  } catch {
    return [];
  }
}

function salvarLista<T>(chave: string, dados: T[]): boolean {
  return escreverItem(chave, JSON.stringify(dados));
}

function mesmoId(valorA: unknown, valorB: unknown): boolean {
  return String(valorA) === String(valorB);
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
  const fazendaAtiva = lerItem(STORAGE_KEYS.fazendaAtiva);

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

  const ok = salvarLista(STORAGE_KEYS.fazendas, [...fazendas, nova]);
  if (!ok) return null;
  return nova;
}

export function atualizarFazenda(fazendaId: string, nome: string): Fazenda | null {
  const valor = nome.trim();
  if (!fazendaId || !valor) return null;

  const fazendas = lerLista<Fazenda>(STORAGE_KEYS.fazendas);
  const indice = fazendas.findIndex((item) => mesmoId(item.id, fazendaId));
  if (indice < 0) return null;

  const atualizada: Fazenda = {
    ...fazendas[indice],
    nome: valor,
    dataAtualizacao: new Date().toISOString()
  };

  const copia = [...fazendas];
  copia[indice] = atualizada;
  const ok = salvarLista(STORAGE_KEYS.fazendas, copia);
  if (!ok) return null;
  return atualizada;
}

export interface PastoPayload {
  nome: string;
  animaisGrandes: number;
  animaisPequenos: number;
  observacoes?: string;
}

export interface PrenhezPayload {
  identificacaoVaca: string;
  identificacaoTouro?: string;
  dataCobertura?: string;
  dataPrevisaoParto?: string;
  observacoes?: string;
  pastoId?: string | null;
}

export interface DoencaPayload {
  identificacaoAnimal: string;
  nomeDoenca: string;
  dataRegistro: string;
  status: StatusDoenca;
  tratamento?: string;
  observacoes?: string;
  pastoId?: string | null;
}

export function criarPasto(fazendaId: string, payload: PastoPayload): Pasto | null {
  const nome = payload.nome.trim();
  if (!fazendaId || !nome) return null;

  const novo: Pasto = {
    id: gerarId(),
    fazendaId,
    nome,
    animaisGrandes: Math.max(0, payload.animaisGrandes || 0),
    animaisPequenos: Math.max(0, payload.animaisPequenos || 0),
    observacoes: payload.observacoes?.trim() || '',
    dataCriacao: new Date().toISOString()
  };

  const pastos = lerLista<Pasto>(STORAGE_KEYS.pastos);
  const ok = salvarLista(STORAGE_KEYS.pastos, [...pastos, novo]);
  if (!ok) return null;
  return novo;
}

export function atualizarPasto(
  pastoId: string,
  payload: PastoPayload,
  dataAtualizacao?: string
): Pasto | null {
  const pastos = lerLista<Pasto>(STORAGE_KEYS.pastos);
  const indice = pastos.findIndex((item) => mesmoId(item.id, pastoId));
  if (indice < 0) return null;

  const nome = payload.nome.trim();
  if (!nome) return null;

  const atual: Pasto = {
    ...pastos[indice],
    nome,
    animaisGrandes: Math.max(0, payload.animaisGrandes || 0),
    animaisPequenos: Math.max(0, payload.animaisPequenos || 0),
    observacoes: payload.observacoes?.trim() || ''
  };

  if (dataAtualizacao) {
    atual.dataAtualizacao = dataAtualizacao;
  }

  const copia = [...pastos];
  copia[indice] = atual;
  const ok = salvarLista(STORAGE_KEYS.pastos, copia);
  if (!ok) return null;
  return atual;
}

export function removerPasto(pastoId: string): Pasto | null {
  const pastos = lerLista<Pasto>(STORAGE_KEYS.pastos);
  const alvo = pastos.find((item) => mesmoId(item.id, pastoId)) ?? null;
  if (!alvo) return null;

  const filtrados = pastos.filter((item) => !mesmoId(item.id, pastoId));
  const ok = salvarLista(STORAGE_KEYS.pastos, filtrados);
  if (!ok) return null;
  return alvo;
}

export function criarPrenhez(fazendaId: string, payload: PrenhezPayload): Prenhez | null {
  const identificacaoVaca = payload.identificacaoVaca.trim();
  if (!fazendaId || !identificacaoVaca) return null;

  const novo: Prenhez = {
    id: gerarId(),
    fazendaId,
    identificacaoVaca,
    identificacaoTouro: payload.identificacaoTouro?.trim() || '',
    dataCobertura: payload.dataCobertura || '',
    dataPrevisaoParto: payload.dataPrevisaoParto || '',
    observacoes: payload.observacoes?.trim() || '',
    pastoId: payload.pastoId || null,
    dataCriacao: new Date().toISOString()
  };

  const registros = lerLista<Prenhez>(STORAGE_KEYS.prenhez);
  const ok = salvarLista(STORAGE_KEYS.prenhez, [...registros, novo]);
  if (!ok) return null;
  return novo;
}

export function atualizarPrenhez(prenhezId: string, payload: PrenhezPayload): Prenhez | null {
  const registros = lerLista<Prenhez>(STORAGE_KEYS.prenhez);
  const indice = registros.findIndex((item) => mesmoId(item.id, prenhezId));
  if (indice < 0) return null;

  const identificacaoVaca = payload.identificacaoVaca.trim();
  if (!identificacaoVaca) return null;

  const atual: Prenhez = {
    ...registros[indice],
    identificacaoVaca,
    identificacaoTouro: payload.identificacaoTouro?.trim() || '',
    dataCobertura: payload.dataCobertura || '',
    dataPrevisaoParto: payload.dataPrevisaoParto || '',
    observacoes: payload.observacoes?.trim() || '',
    pastoId: payload.pastoId || null
  };

  const copia = [...registros];
  copia[indice] = atual;
  const ok = salvarLista(STORAGE_KEYS.prenhez, copia);
  if (!ok) return null;
  return atual;
}

export function removerPrenhez(prenhezId: string): Prenhez | null {
  const registros = lerLista<Prenhez>(STORAGE_KEYS.prenhez);
  const alvo = registros.find((item) => mesmoId(item.id, prenhezId)) ?? null;
  if (!alvo) return null;

  const filtrados = registros.filter((item) => !mesmoId(item.id, prenhezId));
  const ok = salvarLista(STORAGE_KEYS.prenhez, filtrados);
  if (!ok) return null;
  return alvo;
}

export function criarDoenca(fazendaId: string, payload: DoencaPayload): Doenca | null {
  const identificacaoAnimal = payload.identificacaoAnimal.trim();
  const nomeDoenca = payload.nomeDoenca.trim();
  if (!fazendaId || !identificacaoAnimal || !nomeDoenca || !payload.dataRegistro) return null;

  const novo: Doenca = {
    id: gerarId(),
    fazendaId,
    identificacaoAnimal,
    nomeDoenca,
    dataRegistro: payload.dataRegistro,
    status: payload.status,
    tratamento: payload.tratamento?.trim() || '',
    observacoes: payload.observacoes?.trim() || '',
    pastoId: payload.pastoId || null,
    dataCriacao: new Date().toISOString()
  };

  const registros = lerLista<Doenca>(STORAGE_KEYS.doencas);
  const ok = salvarLista(STORAGE_KEYS.doencas, [...registros, novo]);
  if (!ok) return null;
  return novo;
}

export function atualizarDoenca(doencaId: string, payload: DoencaPayload): Doenca | null {
  const registros = lerLista<Doenca>(STORAGE_KEYS.doencas);
  const indice = registros.findIndex((item) => mesmoId(item.id, doencaId));
  if (indice < 0) return null;

  const identificacaoAnimal = payload.identificacaoAnimal.trim();
  const nomeDoenca = payload.nomeDoenca.trim();
  if (!identificacaoAnimal || !nomeDoenca || !payload.dataRegistro) return null;

  const atual: Doenca = {
    ...registros[indice],
    identificacaoAnimal,
    nomeDoenca,
    dataRegistro: payload.dataRegistro,
    status: payload.status,
    tratamento: payload.tratamento?.trim() || '',
    observacoes: payload.observacoes?.trim() || '',
    pastoId: payload.pastoId || null
  };

  const copia = [...registros];
  copia[indice] = atual;
  const ok = salvarLista(STORAGE_KEYS.doencas, copia);
  if (!ok) return null;
  return atual;
}

export function removerDoenca(doencaId: string): Doenca | null {
  const registros = lerLista<Doenca>(STORAGE_KEYS.doencas);
  const alvo = registros.find((item) => mesmoId(item.id, doencaId)) ?? null;
  if (!alvo) return null;

  const filtrados = registros.filter((item) => !mesmoId(item.id, doencaId));
  const ok = salvarLista(STORAGE_KEYS.doencas, filtrados);
  if (!ok) return null;
  return alvo;
}

export function registrarHistorico(
  fazendaId: string,
  tipo: TipoHistorico,
  descricao: string,
  meta?: Historico['meta']
): Historico | null {
  if (!fazendaId || !descricao.trim()) return null;

  const historico = lerLista<Historico>(STORAGE_KEYS.historico);
  const novo: Historico = {
    id: gerarId(),
    fazendaId,
    tipo,
    descricao: descricao.trim(),
    dataCriacao: new Date().toISOString(),
    ...(meta ? { meta } : {})
  };

  const ok = salvarLista(STORAGE_KEYS.historico, [...historico, novo]);
  if (!ok) return null;
  return novo;
}

export function removerFazenda(fazendaId: string): void {
  const fazendas = lerLista<Fazenda>(STORAGE_KEYS.fazendas);
  const filtradas = fazendas.filter((fazenda) => fazenda.id !== fazendaId);
  salvarLista(STORAGE_KEYS.fazendas, filtradas);

  if (lerItem(STORAGE_KEYS.fazendaAtiva) === fazendaId) {
    removerItem(STORAGE_KEYS.fazendaAtiva);
  }
}

export function definirFazendaAtiva(fazendaId: string | null): void {
  if (!fazendaId) {
    removerItem(STORAGE_KEYS.fazendaAtiva);
    return;
  }

  escreverItem(STORAGE_KEYS.fazendaAtiva, fazendaId);
}
