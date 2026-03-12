export type TipoHistorico = 'pasto' | 'prenhez' | 'doenca';

export type StatusDoenca = 'ativo' | 'tratamento' | 'curado';

export interface EntidadeBase {
  id: string;
  dataCriacao: string;
  dataAtualizacao?: string;
}

export interface Fazenda extends EntidadeBase {
  nome: string;
}

export interface Pasto extends EntidadeBase {
  fazendaId: string;
  nome: string;
  animaisGrandes: number;
  animaisPequenos: number;
  observacoes?: string;
}

export interface Prenhez extends EntidadeBase {
  fazendaId: string;
  identificacaoVaca: string;
  identificacaoTouro?: string;
  dataCobertura?: string;
  dataPrevisaoParto?: string;
  observacoes?: string;
  pastoId?: string | null;
}

export interface Doenca extends EntidadeBase {
  fazendaId: string;
  identificacaoAnimal: string;
  nomeDoenca: string;
  dataRegistro: string;
  status: StatusDoenca;
  tratamento?: string;
  observacoes?: string;
  pastoId?: string | null;
}

export interface HistoricoMeta {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Historico extends EntidadeBase {
  fazendaId: string;
  tipo: TipoHistorico;
  descricao: string;
  meta?: HistoricoMeta;
}
