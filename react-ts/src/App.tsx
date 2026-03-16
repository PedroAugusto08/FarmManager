import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  atualizarFazenda,
  atualizarDoenca,
  atualizarPasto,
  atualizarPrenhez,
  carregarSnapshot,
  criarDoenca,
  criarPasto,
  criarPrenhez,
  criarFazenda,
  definirFazendaAtiva,
  registrarHistorico,
  removerDoenca,
  removerPasto,
  removerPrenhez,
  removerFazenda
} from './services/storage';
import type { Doenca, Historico, Pasto, Prenhez, StatusDoenca } from './types/domain';

type Aba = 'pasto' | 'prenhez' | 'doenca' | 'historico';
type ModoPasto = 'novo' | 'editar';
type ModoPrenhez = 'novo' | 'editar';
type ModoDoenca = 'novo' | 'editar';
type FiltroHistorico = 'todos' | 'pasto' | 'prenhez' | 'doenca';
type ValorDetalhe = string | number;
type TipoToast = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  tipo: TipoToast;
  titulo: string;
  descricao?: string;
}

interface DetalhesHistorico {
  antes?: Record<string, ValorDetalhe> | null;
  depois?: Record<string, ValorDetalhe> | null;
  info?: string;
}

interface PastoFormState {
  modo: ModoPasto;
  id?: string;
  nome: string;
  animaisGrandes: string;
  animaisPequenos: string;
  observacoes: string;
}

interface PrenhezFormState {
  modo: ModoPrenhez;
  id?: string;
  identificacaoVaca: string;
  identificacaoTouro: string;
  dataCobertura: string;
  dataPrevisaoParto: string;
  pastoId: string;
  observacoes: string;
}

interface DoencaFormState {
  modo: ModoDoenca;
  id?: string;
  identificacaoAnimal: string;
  nomeDoenca: string;
  dataRegistro: string;
  status: StatusDoenca;
  tratamento: string;
  observacoes: string;
  pastoId: string;
}

const ABAS: Array<{ id: Aba; label: string }> = [
  { id: 'pasto', label: 'Pastos' },
  { id: 'prenhez', label: 'Prenhez' },
  { id: 'doenca', label: 'Doencas' },
  { id: 'historico', label: 'Historico' }
];

const STATUS_DOENCA: Record<StatusDoenca, string> = {
  ativo: 'Ativo',
  tratamento: 'Em tratamento',
  curado: 'Curado'
};

const FILTROS_HISTORICO: Array<{ id: FiltroHistorico; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'pasto', label: 'Pasto' },
  { id: 'prenhez', label: 'Prenhez' },
  { id: 'doenca', label: 'Doenca' }
];

const SIMBOLO_ABA: Record<Aba, string> = {
  pasto: '🌿',
  prenhez: '🐄',
  doenca: '✚',
  historico: '◷'
};

const CHAVE_UI_CONTRASTE = 'farmmanager_ui_contrast';

function criarFormularioPastoInicial(): PastoFormState {
  return {
    modo: 'novo',
    nome: '',
    animaisGrandes: '0',
    animaisPequenos: '0',
    observacoes: ''
  };
}

function criarFormularioPrenhezInicial(): PrenhezFormState {
  return {
    modo: 'novo',
    identificacaoVaca: '',
    identificacaoTouro: '',
    dataCobertura: '',
    dataPrevisaoParto: '',
    pastoId: '',
    observacoes: ''
  };
}

function criarFormularioDoencaInicial(): DoencaFormState {
  return {
    modo: 'novo',
    identificacaoAnimal: '',
    nomeDoenca: '',
    dataRegistro: new Date().toISOString().slice(0, 10),
    status: 'ativo',
    tratamento: '',
    observacoes: '',
    pastoId: ''
  };
}

function mesmoId(valorA: unknown, valorB: unknown): boolean {
  return String(valorA) === String(valorB);
}

function normalizarNumeroInput(valor: string): number {
  const numero = Number.parseInt(valor, 10);
  if (Number.isNaN(numero) || numero < 0) return 0;
  return numero;
}

function calcularPrevisaoParto(dataCobertura: string): string {
  if (!dataCobertura) return '';
  const data = new Date(`${dataCobertura}T00:00:00`);
  if (Number.isNaN(data.getTime())) return '';
  data.setDate(data.getDate() + 283);
  return data.toISOString().slice(0, 10);
}

function formatarData(dataIso?: string): string {
  if (!dataIso) return '--';
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return '--';
  return data.toLocaleDateString('pt-BR');
}

function calcularDiasRestantes(dataIso?: string): number | null {
  if (!dataIso) return null;
  const alvo = new Date(dataIso);
  if (Number.isNaN(alvo.getTime())) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  alvo.setHours(0, 0, 0, 0);

  const diff = alvo.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatarHora(dataIso?: string): string {
  if (!dataIso) return '--';
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return '--';
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatarDataHora(dataIso?: string): string {
  if (!dataIso) return '--';
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return '--';
  return `${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
}

function formatarDataGrupo(dataIso: string): string {
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return 'Data invalida';

  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const dataNormalizada = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const hojeNormalizado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const ontemNormalizado = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate());

  if (dataNormalizada.getTime() === hojeNormalizado.getTime()) return 'Hoje';
  if (dataNormalizada.getTime() === ontemNormalizado.getTime()) return 'Ontem';

  return data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function ehObjetoRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function lerMetaHistorico(registro: Historico): Record<string, unknown> | null {
  return ehObjetoRegistro(registro.meta) ? registro.meta : null;
}

function lerObjetoMeta(meta: Record<string, unknown> | null, chave: 'before' | 'after') {
  const valor = meta?.[chave];
  return ehObjetoRegistro(valor) ? valor : null;
}

function parsePastoDescricao(descricao: string):
  | {
      acao: 'atualizado' | 'cadastrado';
      nome: string;
      after: { animaisGrandes: number; animaisPequenos: number };
    }
  | null {
  const atualizado = descricao.match(
    /^Pasto\s+"(.+?)"\s+atualizado\s*\((\d+)\s+grandes,\s*(\d+)\s+pequenos\)\s*$/i
  );
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

  const cadastrado = descricao.match(
    /^Pasto\s+"(.+?)"\s+cadastrado\s*\((\d+)\s+grandes,\s*(\d+)\s+pequenos\)\s*$/i
  );
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

function resolverNomePasto(pastoId: unknown, mapaPastos: Map<string, string>): string {
  if (pastoId === null || pastoId === undefined || pastoId === '') return '';
  const id = String(pastoId);
  return mapaPastos.get(id) || '';
}

function humanizarChave(chave: string): string {
  return String(chave)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^\w/, (letra) => letra.toUpperCase());
}

function formatarValorDetalhe(valor: unknown, chave: string): ValorDetalhe {
  if (valor === null || valor === undefined) return '--';
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Nao';

  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : '--';

  if (typeof valor === 'string') {
    const limpo = valor.trim();
    if (!limpo) return '--';

    if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) {
      return formatarData(`${limpo}T00:00:00`);
    }

    if (/data/i.test(chave)) {
      const data = new Date(limpo);
      if (!Number.isNaN(data.getTime())) {
        return data.toLocaleDateString('pt-BR');
      }
    }

    return limpo;
  }

  if (Array.isArray(valor)) {
    return valor.length ? valor.join(', ') : '--';
  }

  if (ehObjetoRegistro(valor)) {
    return JSON.stringify(valor);
  }

  return String(valor);
}

function normalizarObjetoDetalhe(
  objeto: Record<string, unknown> | null,
  tipoRegistro: string,
  mapaPastos: Map<string, string>
): Record<string, ValorDetalhe> | null {
  if (!objeto) return null;

  if ('animaisGrandes' in objeto || 'animaisPequenos' in objeto) {
    const grandes = Number(objeto.animaisGrandes) || 0;
    const pequenos = Number(objeto.animaisPequenos) || 0;
    return {
      Grandes: grandes,
      Pequenos: pequenos,
      Total: grandes + pequenos
    };
  }

  const saida: Record<string, ValorDetalhe> = {};
  Object.entries(objeto).forEach(([chave, valor]) => {
    if (valor === undefined) return;

    if (chave === 'pastoId') {
      if (tipoRegistro === 'pasto') return;
      const nomePasto = resolverNomePasto(valor, mapaPastos);
      if (!nomePasto && (valor === null || valor === undefined || String(valor).trim() === '')) return;
      saida.Pasto = nomePasto || String(valor);
      return;
    }

    const chaveHumanizada = humanizarChave(chave);
    saida[chaveHumanizada] = formatarValorDetalhe(valor, chave);
  });

  return Object.keys(saida).length ? saida : null;
}

function extrairSnapshotPasto(registro: Historico): Record<string, ValorDetalhe> | null {
  const meta = lerMetaHistorico(registro);
  const after = lerObjetoMeta(meta, 'after');
  if (after && ('animaisGrandes' in after || 'animaisPequenos' in after)) {
    const grandes = Number(after.animaisGrandes) || 0;
    const pequenos = Number(after.animaisPequenos) || 0;
    return {
      Grandes: grandes,
      Pequenos: pequenos,
      Total: grandes + pequenos
    };
  }

  const before = lerObjetoMeta(meta, 'before');
  if (before && ('animaisGrandes' in before || 'animaisPequenos' in before)) {
    const grandes = Number(before.animaisGrandes) || 0;
    const pequenos = Number(before.animaisPequenos) || 0;
    return {
      Grandes: grandes,
      Pequenos: pequenos,
      Total: grandes + pequenos
    };
  }

  const parsed = parsePastoDescricao(registro.descricao || '');
  if (!parsed) return null;

  const grandes = Number(parsed.after.animaisGrandes) || 0;
  const pequenos = Number(parsed.after.animaisPequenos) || 0;
  return {
    Grandes: grandes,
    Pequenos: pequenos,
    Total: grandes + pequenos
  };
}

function inferirAntesPastoPorHistorico(
  registroAtual: Historico,
  registrosOrdenadosAsc: Historico[]
): Record<string, ValorDetalhe> {
  const indiceAtual = registrosOrdenadosAsc.findIndex((registro) => mesmoId(registro.id, registroAtual.id));
  const anteriores =
    indiceAtual >= 0
      ? registrosOrdenadosAsc.slice(0, indiceAtual).reverse()
      : [...registrosOrdenadosAsc].reverse();

  const parsedAtual = parsePastoDescricao(registroAtual.descricao || '');
  const nomeAtual = parsedAtual?.nome || null;
  const metaAtual = lerMetaHistorico(registroAtual);
  const pastoAtualId =
    metaAtual && metaAtual.pastoId !== null && metaAtual.pastoId !== undefined
      ? String(metaAtual.pastoId)
      : null;

  for (const registro of anteriores) {
    if (registro.tipo !== 'pasto') continue;

    const metaRegistro = lerMetaHistorico(registro);
    const pastoRegistroId =
      metaRegistro && metaRegistro.pastoId !== null && metaRegistro.pastoId !== undefined
        ? String(metaRegistro.pastoId)
        : null;

    if (pastoAtualId && pastoRegistroId && pastoAtualId !== pastoRegistroId) {
      continue;
    }

    if (!pastoAtualId) {
      const parsedNome = parsePastoDescricao(registro.descricao || '')?.nome || null;
      if ((parsedNome || '') !== (nomeAtual || '')) continue;
    } else if (!pastoRegistroId && nomeAtual) {
      const parsedNome = parsePastoDescricao(registro.descricao || '')?.nome || null;
      if (parsedNome && parsedNome !== nomeAtual) continue;
    }

    const snapshot = extrairSnapshotPasto(registro);
    if (snapshot) return snapshot;
  }

  return { Info: 'Nao foi possivel inferir o valor anterior a partir do historico.' };
}

function obterDetalhesHistorico(
  registro: Historico,
  registrosOrdenadosAsc: Historico[],
  mapaPastos: Map<string, string>
): DetalhesHistorico | null {
  const meta = lerMetaHistorico(registro);
  const before = lerObjetoMeta(meta, 'before');
  const after = lerObjetoMeta(meta, 'after');

  if (before || after) {
    const antesNormalizado = normalizarObjetoDetalhe(before, registro.tipo, mapaPastos);
    const depoisNormalizado = normalizarObjetoDetalhe(after, registro.tipo, mapaPastos);

    return {
      antes: antesNormalizado,
      depois: depoisNormalizado
    };
  }

  if (registro.tipo === 'pasto') {
    const parsed = parsePastoDescricao(registro.descricao || '');
    if (parsed && parsed.acao === 'atualizado') {
      const beforeInferido = inferirAntesPastoPorHistorico(registro, registrosOrdenadosAsc);
      const depois = {
        Grandes: parsed.after.animaisGrandes,
        Pequenos: parsed.after.animaisPequenos,
        Total: parsed.after.animaisGrandes + parsed.after.animaisPequenos
      };
      return {
        antes: beforeInferido,
        depois
      };
    }

    if (parsed) {
      return {
        depois: {
          Grandes: parsed.after.animaisGrandes,
          Pequenos: parsed.after.animaisPequenos,
          Total: parsed.after.animaisGrandes + parsed.after.animaisPequenos
        }
      };
    }

    return { info: 'Este registro nao tem numeros associados para detalhar.' };
  }

  return null;
}

function valorVazioDetalhe(valor: unknown): boolean {
  if (valor === null || valor === undefined) return true;
  if (typeof valor === 'string') {
    const limpo = valor.trim();
    return limpo === '' || limpo === '--';
  }
  return false;
}

function filtrarObjetoSemVazios(
  objeto: Record<string, ValorDetalhe>
): Record<string, ValorDetalhe> {
  const saida: Record<string, ValorDetalhe> = {};
  Object.entries(objeto).forEach(([chave, valor]) => {
    if (valorVazioDetalhe(valor)) return;
    saida[chave] = valor;
  });
  return saida;
}

function filtrarDetalhesParaExibicao(
  detalhes: DetalhesHistorico | null,
  tipoRegistro: Historico['tipo']
): DetalhesHistorico | null {
  if (!detalhes) return null;
  if (detalhes.info) return detalhes;

  const tipo = String(tipoRegistro || '').toLowerCase();
  const ocultarCamposVazios = tipo === 'prenhez' || tipo === 'doenca';
  if (!ocultarCamposVazios) return detalhes;

  const antes = detalhes.antes || null;
  const depois = detalhes.depois || null;

  if (antes && depois) {
    const chaves = new Set([...Object.keys(antes), ...Object.keys(depois)]);
    const chavesManter = [...chaves].filter((chave) => {
      return !valorVazioDetalhe(antes[chave]) || !valorVazioDetalhe(depois[chave]);
    });

    const antesFiltrado: Record<string, ValorDetalhe> = {};
    const depoisFiltrado: Record<string, ValorDetalhe> = {};

    chavesManter.forEach((chave) => {
      antesFiltrado[chave] =
        Object.prototype.hasOwnProperty.call(antes, chave) && !valorVazioDetalhe(antes[chave])
          ? antes[chave]
          : '--';
      depoisFiltrado[chave] =
        Object.prototype.hasOwnProperty.call(depois, chave) && !valorVazioDetalhe(depois[chave])
          ? depois[chave]
          : '--';
    });

    return {
      antes: Object.keys(antesFiltrado).length ? antesFiltrado : null,
      depois: Object.keys(depoisFiltrado).length ? depoisFiltrado : null
    };
  }

  if (antes) {
    const antesFiltrado = filtrarObjetoSemVazios(antes);
    return {
      antes: Object.keys(antesFiltrado).length ? antesFiltrado : null
    };
  }

  if (depois) {
    const depoisFiltrado = filtrarObjetoSemVazios(depois);
    return {
      depois: Object.keys(depoisFiltrado).length ? depoisFiltrado : null
    };
  }

  return null;
}

function formatarTipoHistorico(registro: Historico): string {
  const tipo = String(registro.tipo || '').toLowerCase();
  if (tipo === 'pasto') {
    const meta = lerMetaHistorico(registro);
    const after = lerObjetoMeta(meta, 'after');
    const before = lerObjetoMeta(meta, 'before');
    const nome =
      (typeof after?.nome === 'string' ? after.nome : null) ||
      (typeof before?.nome === 'string' ? before.nome : null) ||
      parsePastoDescricao(registro.descricao || '')?.nome ||
      '';

    return nome ? `Pasto - ${nome}` : 'Pasto';
  }

  if (!tipo) return '';
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

function ordenarPorDataDesc<T extends { dataCriacao: string }>(lista: T[]): T[] {
  return [...lista].sort(
    (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
  );
}

function criarEstiloEntrada(indice: number, atrasoBase = 0): React.CSSProperties {
  const atraso = Math.min(indice, 10) * 40 + atrasoBase;
  return { '--enter-delay': `${atraso}ms` } as React.CSSProperties;
}

function App() {
  const [snapshot, setSnapshot] = useState(() => carregarSnapshot());
  const [abaAtiva, setAbaAtiva] = useState<Aba>('pasto');
  const [painelFazendasAberto, setPainelFazendasAberto] = useState(false);
  const [nomeFazendaNovaPainel, setNomeFazendaNovaPainel] = useState('');
  const [nomeFazendaEdicaoPainel, setNomeFazendaEdicaoPainel] = useState('');
  const [erroPainelFazenda, setErroPainelFazenda] = useState<string | null>(null);
  const [pastoForm, setPastoForm] = useState<PastoFormState | null>(null);
  const [erroPasto, setErroPasto] = useState<string | null>(null);
  const [prenhezForm, setPrenhezForm] = useState<PrenhezFormState | null>(null);
  const [erroPrenhez, setErroPrenhez] = useState<string | null>(null);
  const [doencaForm, setDoencaForm] = useState<DoencaFormState | null>(null);
  const [erroDoenca, setErroDoenca] = useState<string | null>(null);
  const [filtroHistorico, setFiltroHistorico] = useState<FiltroHistorico>('todos');
  const [historicoSelecionadoId, setHistoricoSelecionadoId] = useState<string | null>(null);
  const [altoContrasteAtivo, setAltoContrasteAtivo] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(CHAVE_UI_CONTRASTE) === 'high';
    } catch {
      return false;
    }
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removerToast = useCallback((id: string) => {
    setToasts((atual) => atual.filter((toast) => toast.id !== id));
  }, []);

  const mostrarToast = useCallback(
    (tipo: TipoToast, titulo: string, descricao?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((atual) => [...atual, { id, tipo, titulo, descricao }].slice(-4));
      window.setTimeout(() => removerToast(id), 3600);
    },
    [removerToast]
  );

  const recarregar = useCallback(() => {
    setSnapshot(carregarSnapshot());
  }, []);

  useEffect(() => {
    recarregar();

    const onStorage = () => recarregar();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [recarregar]);

  useEffect(() => {
    const raiz = document.documentElement;

    if (altoContrasteAtivo) {
      raiz.setAttribute('data-contrast', 'high');
      try {
        window.localStorage.setItem(CHAVE_UI_CONTRASTE, 'high');
      } catch {
        // Ignora falhas de persistencia para nao quebrar o fluxo da UI.
      }
      return;
    }

    raiz.removeAttribute('data-contrast');
    try {
      window.localStorage.setItem(CHAVE_UI_CONTRASTE, 'normal');
    } catch {
      // Ignora falhas de persistencia para nao quebrar o fluxo da UI.
    }
  }, [altoContrasteAtivo]);

  const fazendaAtivaId = snapshot.fazendaAtiva ?? '';

  const fazendaAtiva = useMemo(
    () => snapshot.fazendas.find((fazenda) => fazenda.id === fazendaAtivaId) ?? null,
    [snapshot.fazendas, fazendaAtivaId]
  );

  const algumOverlayAberto =
    painelFazendasAberto ||
    Boolean(pastoForm) ||
    Boolean(prenhezForm) ||
    Boolean(doencaForm) ||
    Boolean(historicoSelecionadoId);

  useEffect(() => {
    setNomeFazendaEdicaoPainel(fazendaAtiva?.nome ?? '');
  }, [fazendaAtiva]);

  useEffect(() => {
    if (!algumOverlayAberto) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [algumOverlayAberto]);

  const pastosFiltrados = useMemo(
    () => snapshot.pastos.filter((pasto) => pasto.fazendaId === fazendaAtivaId),
    [snapshot.pastos, fazendaAtivaId]
  );

  const prenhezFiltradas = useMemo(
    () => snapshot.prenhezes.filter((registro) => registro.fazendaId === fazendaAtivaId),
    [snapshot.prenhezes, fazendaAtivaId]
  );

  const doencasFiltradas = useMemo(
    () => snapshot.doencas.filter((registro) => registro.fazendaId === fazendaAtivaId),
    [snapshot.doencas, fazendaAtivaId]
  );

  const historicoFiltrado = useMemo(
    () => snapshot.historico.filter((registro) => registro.fazendaId === fazendaAtivaId),
    [snapshot.historico, fazendaAtivaId]
  );

  const mapaPastos = useMemo(
    () => new Map(pastosFiltrados.map((pasto) => [String(pasto.id), pasto.nome])),
    [pastosFiltrados]
  );

  const prenhezOrdenadas = useMemo(
    () =>
      [...prenhezFiltradas].sort((a, b) => {
        const dataA = a.dataPrevisaoParto ? new Date(`${a.dataPrevisaoParto}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        const dataB = b.dataPrevisaoParto ? new Date(`${b.dataPrevisaoParto}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        return dataA - dataB;
      }),
    [prenhezFiltradas]
  );

  const doencasOrdenadas = useMemo(
    () =>
      [...doencasFiltradas].sort((a, b) => {
        const dataA = a.dataRegistro ? new Date(`${a.dataRegistro}T00:00:00`).getTime() : 0;
        const dataB = b.dataRegistro ? new Date(`${b.dataRegistro}T00:00:00`).getTime() : 0;
        return dataB - dataA;
      }),
    [doencasFiltradas]
  );

  const historicoOrdenado = useMemo(
    () => ordenarPorDataDesc<Historico>(historicoFiltrado),
    [historicoFiltrado]
  );

  const historicoFiltradoPorTipo = useMemo(
    () =>
      filtroHistorico === 'todos'
        ? historicoOrdenado
        : historicoOrdenado.filter((registro) => registro.tipo === filtroHistorico),
    [historicoOrdenado, filtroHistorico]
  );

  const historicoAgrupado = useMemo(() => {
    const grupos = new Map<string, Historico[]>();
    historicoFiltradoPorTipo.forEach((registro) => {
      const chave = formatarDataGrupo(registro.dataCriacao);
      const lista = grupos.get(chave);
      if (lista) {
        lista.push(registro);
      } else {
        grupos.set(chave, [registro]);
      }
    });

    return Array.from(grupos.entries()).map(([data, itens]) => ({ data, itens }));
  }, [historicoFiltradoPorTipo]);

  const historicoSelecionado = useMemo(() => {
    if (!historicoSelecionadoId) return null;
    return historicoFiltrado.find((registro) => mesmoId(registro.id, historicoSelecionadoId)) ?? null;
  }, [historicoFiltrado, historicoSelecionadoId]);

  const detalhesHistoricoSelecionado = useMemo(() => {
    if (!historicoSelecionado) return null;
    const registrosOrdenadosAsc = [...historicoFiltrado].sort(
      (a, b) => new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime()
    );
    const detalhes = obterDetalhesHistorico(historicoSelecionado, registrosOrdenadosAsc, mapaPastos);
    return filtrarDetalhesParaExibicao(detalhes, historicoSelecionado.tipo);
  }, [historicoSelecionado, historicoFiltrado, mapaPastos]);

  const prenhezPorPasto = useMemo(() => {
    const contagem = new Map<string, number>();
    prenhezFiltradas.forEach((registro) => {
      if (!registro.pastoId) return;
      const chave = String(registro.pastoId);
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    });
    return contagem;
  }, [prenhezFiltradas]);

  const doencasPorPasto = useMemo(() => {
    const contagem = new Map<string, number>();
    doencasFiltradas.forEach((registro) => {
      if (!registro.pastoId) return;
      const chave = String(registro.pastoId);
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    });
    return contagem;
  }, [doencasFiltradas]);

  function onSelecionarFazenda(evento: React.ChangeEvent<HTMLSelectElement>) {
    const proximoId = evento.target.value || null;
    definirFazendaAtiva(proximoId);
    setErroPainelFazenda(null);
    setPastoForm(null);
    setErroPasto(null);
    setPrenhezForm(null);
    setErroPrenhez(null);
    setDoencaForm(null);
    setErroDoenca(null);
    setFiltroHistorico('todos');
    setHistoricoSelecionadoId(null);
    recarregar();
  }

  function abrirPainelFazendas() {
    setErroPainelFazenda(null);
    setNomeFazendaEdicaoPainel(fazendaAtiva?.nome ?? '');
    setPainelFazendasAberto(true);
  }

  function alternarAltoContraste() {
    const proximo = !altoContrasteAtivo;
    setAltoContrasteAtivo(proximo);
    mostrarToast(
      'info',
      proximo ? 'Alto contraste ativado' : 'Alto contraste desativado',
      proximo ? 'Leitura otimizada para uso sob sol forte.' : 'Visual padrao restaurado.'
    );
  }

  function fecharPainelFazendas() {
    setErroPainelFazenda(null);
    setPainelFazendasAberto(false);
  }

  function onCriarFazendaPainel(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nova = criarFazenda(nomeFazendaNovaPainel);
    if (!nova) {
      setErroPainelFazenda('Nao foi possivel criar a fazenda. Verifique o armazenamento do navegador.');
      mostrarToast('error', 'Falha ao criar fazenda', 'Nao foi possivel salvar no navegador.');
      return;
    }

    definirFazendaAtiva(nova.id);
    setNomeFazendaNovaPainel('');
    setNomeFazendaEdicaoPainel(nova.nome);
    setErroPainelFazenda(null);
    setPastoForm(null);
    setErroPasto(null);
    setPrenhezForm(null);
    setErroPrenhez(null);
    setDoencaForm(null);
    setErroDoenca(null);
    setFiltroHistorico('todos');
    setHistoricoSelecionadoId(null);
    recarregar();
    mostrarToast('success', 'Fazenda criada', `Agora ativa: ${nova.nome}`);
  }

  function onRenomearFazendaAtiva(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!fazendaAtivaId) {
      setErroPainelFazenda('Selecione uma fazenda para editar.');
      mostrarToast('error', 'Sem fazenda ativa', 'Selecione uma fazenda para editar o nome.');
      return;
    }

    const atualizada = atualizarFazenda(fazendaAtivaId, nomeFazendaEdicaoPainel);
    if (!atualizada) {
      setErroPainelFazenda('Nao foi possivel atualizar o nome da fazenda.');
      mostrarToast('error', 'Falha ao atualizar', 'Nao foi possivel atualizar o nome da fazenda.');
      return;
    }

    setNomeFazendaEdicaoPainel(atualizada.nome);
    setErroPainelFazenda(null);
    recarregar();
    mostrarToast('success', 'Fazenda atualizada', `Novo nome: ${atualizada.nome}`);
  }

  function onRemoverFazendaAtual() {
    if (!fazendaAtiva) return;

    const confirmar = window.confirm(
      `Remover a fazenda "${fazendaAtiva.nome}"? Os registros vinculados permanecem salvos no localStorage.`
    );

    if (!confirmar) return;
    removerFazenda(fazendaAtiva.id);
    setNomeFazendaNovaPainel('');
    setNomeFazendaEdicaoPainel('');
    setErroPainelFazenda(null);
    setPainelFazendasAberto(false);
    setPastoForm(null);
    setErroPasto(null);
    setPrenhezForm(null);
    setErroPrenhez(null);
    setDoencaForm(null);
    setErroDoenca(null);
    setFiltroHistorico('todos');
    setHistoricoSelecionadoId(null);
    recarregar();
    mostrarToast('success', 'Fazenda removida', `${fazendaAtiva.nome} foi removida da selecao.`);
  }

  function abrirFormularioNovoPasto() {
    if (!fazendaAtivaId) return;
    setErroPasto(null);
    setPastoForm(criarFormularioPastoInicial());
  }

  function abrirFormularioEditarPasto(pasto: Pasto) {
    setErroPasto(null);
    setPastoForm({
      modo: 'editar',
      id: String(pasto.id),
      nome: pasto.nome,
      animaisGrandes: String(pasto.animaisGrandes || 0),
      animaisPequenos: String(pasto.animaisPequenos || 0),
      observacoes: pasto.observacoes || ''
    });
  }

  function atualizarCampoPasto(
    campo: 'nome' | 'animaisGrandes' | 'animaisPequenos' | 'observacoes',
    valor: string
  ) {
    setPastoForm((atual) => (atual ? { ...atual, [campo]: valor } : atual));
  }

  function fecharFormularioPasto() {
    setPastoForm(null);
    setErroPasto(null);
  }

  function onSalvarPasto(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!pastoForm) return;

    if (!fazendaAtivaId) {
      setErroPasto('Selecione uma fazenda antes de salvar um pasto.');
      mostrarToast('error', 'Sem fazenda ativa', 'Selecione uma fazenda antes de salvar um pasto.');
      return;
    }

    const payload = {
      nome: pastoForm.nome,
      animaisGrandes: normalizarNumeroInput(pastoForm.animaisGrandes),
      animaisPequenos: normalizarNumeroInput(pastoForm.animaisPequenos),
      observacoes: pastoForm.observacoes
    };

    if (!payload.nome.trim()) {
      setErroPasto('Informe o nome do pasto.');
      mostrarToast('error', 'Nome obrigatorio', 'Informe o nome do pasto para continuar.');
      return;
    }

    if (pastoForm.modo === 'novo') {
      const novo = criarPasto(fazendaAtivaId, payload);
      if (!novo) {
        setErroPasto('Nao foi possivel salvar o pasto.');
        mostrarToast('error', 'Falha ao salvar', 'Nao foi possivel salvar o pasto.');
        return;
      }

      registrarHistorico(
        fazendaAtivaId,
        'pasto',
        `Pasto "${novo.nome}" cadastrado (${novo.animaisGrandes} grandes, ${novo.animaisPequenos} pequenos)`,
        {
          acao: 'cadastrar',
          pastoId: novo.id,
          after: {
            nome: novo.nome,
            animaisGrandes: novo.animaisGrandes,
            animaisPequenos: novo.animaisPequenos,
            total: novo.animaisGrandes + novo.animaisPequenos
          }
        }
      );

      recarregar();
      fecharFormularioPasto();
      mostrarToast('success', 'Pasto cadastrado', `${novo.nome} foi adicionado com sucesso.`);
      return;
    }

    if (!pastoForm.id) {
      setErroPasto('Pasto invalido para edicao.');
      mostrarToast('error', 'Pasto invalido', 'Nao foi possivel identificar o pasto para edicao.');
      return;
    }

    const pastoAtual = snapshot.pastos.find((item) => mesmoId(item.id, pastoForm.id));
    if (!pastoAtual) {
      setErroPasto('Pasto nao encontrado.');
      mostrarToast('error', 'Pasto nao encontrado', 'Atualize a tela e tente novamente.');
      return;
    }

    const mudouAnimais =
      (pastoAtual.animaisGrandes || 0) !== payload.animaisGrandes ||
      (pastoAtual.animaisPequenos || 0) !== payload.animaisPequenos;

    const atualizado = atualizarPasto(
      pastoForm.id,
      payload,
      mudouAnimais ? new Date().toISOString() : undefined
    );

    if (!atualizado) {
      setErroPasto('Nao foi possivel atualizar o pasto.');
      mostrarToast('error', 'Falha ao atualizar', 'Nao foi possivel atualizar o pasto.');
      return;
    }

    registrarHistorico(
      fazendaAtivaId,
      'pasto',
      `Pasto "${atualizado.nome}" atualizado (${atualizado.animaisGrandes} grandes, ${atualizado.animaisPequenos} pequenos)`,
      {
        acao: 'atualizar',
        pastoId: atualizado.id,
        before: {
          nome: pastoAtual.nome,
          animaisGrandes: pastoAtual.animaisGrandes || 0,
          animaisPequenos: pastoAtual.animaisPequenos || 0,
          total: (pastoAtual.animaisGrandes || 0) + (pastoAtual.animaisPequenos || 0)
        },
        after: {
          nome: atualizado.nome,
          animaisGrandes: atualizado.animaisGrandes || 0,
          animaisPequenos: atualizado.animaisPequenos || 0,
          total: (atualizado.animaisGrandes || 0) + (atualizado.animaisPequenos || 0)
        }
      }
    );

    recarregar();
    fecharFormularioPasto();
    mostrarToast('success', 'Pasto atualizado', `${atualizado.nome} foi atualizado.`);
  }

  function onRemoverPasto(pastoId: string) {
    const pasto = pastosFiltrados.find((item) => mesmoId(item.id, pastoId));
    if (!pasto) return;

    const confirmar = window.confirm(`Deseja realmente remover o pasto "${pasto.nome}"?`);
    if (!confirmar) return;

    const removido = removerPasto(pastoId);
    if (!removido) {
      mostrarToast('error', 'Falha ao remover', 'Nao foi possivel remover o pasto.');
      return;
    }

    if (fazendaAtivaId) {
      registrarHistorico(fazendaAtivaId, 'pasto', `Pasto "${removido.nome}" removido`, {
        acao: 'remover',
        pastoId: removido.id,
        before: {
          nome: removido.nome,
          animaisGrandes: removido.animaisGrandes || 0,
          animaisPequenos: removido.animaisPequenos || 0,
          total: (removido.animaisGrandes || 0) + (removido.animaisPequenos || 0)
        }
      });
    }

    if (pastoForm?.id && mesmoId(pastoForm.id, removido.id)) {
      fecharFormularioPasto();
    }

    recarregar();
    mostrarToast('success', 'Pasto removido', `${removido.nome} foi removido.`);
  }

  function abrirFormularioNovaPrenhez() {
    if (!fazendaAtivaId) return;
    setErroPrenhez(null);
    setPrenhezForm(criarFormularioPrenhezInicial());
  }

  function abrirFormularioEditarPrenhez(registro: Prenhez) {
    setErroPrenhez(null);
    setPrenhezForm({
      modo: 'editar',
      id: String(registro.id),
      identificacaoVaca: registro.identificacaoVaca,
      identificacaoTouro: registro.identificacaoTouro || '',
      dataCobertura: registro.dataCobertura || '',
      dataPrevisaoParto: registro.dataPrevisaoParto || '',
      pastoId: registro.pastoId ? String(registro.pastoId) : '',
      observacoes: registro.observacoes || ''
    });
  }

  function atualizarCampoPrenhez(
    campo:
      | 'identificacaoVaca'
      | 'identificacaoTouro'
      | 'dataCobertura'
      | 'dataPrevisaoParto'
      | 'pastoId'
      | 'observacoes',
    valor: string
  ) {
    setPrenhezForm((atual) => {
      if (!atual) return atual;

      if (campo === 'dataCobertura') {
        const previsaoAuto = calcularPrevisaoParto(valor);
        return {
          ...atual,
          dataCobertura: valor,
          dataPrevisaoParto: previsaoAuto || atual.dataPrevisaoParto
        };
      }

      return { ...atual, [campo]: valor };
    });
  }

  function fecharFormularioPrenhez() {
    setPrenhezForm(null);
    setErroPrenhez(null);
  }

  function onSalvarPrenhez(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!prenhezForm) return;

    if (!fazendaAtivaId) {
      setErroPrenhez('Selecione uma fazenda antes de salvar uma prenhez.');
      mostrarToast('error', 'Sem fazenda ativa', 'Selecione uma fazenda antes de salvar uma prenhez.');
      return;
    }

    const payload = {
      identificacaoVaca: prenhezForm.identificacaoVaca,
      identificacaoTouro: prenhezForm.identificacaoTouro,
      dataCobertura: prenhezForm.dataCobertura,
      dataPrevisaoParto: prenhezForm.dataPrevisaoParto,
      observacoes: prenhezForm.observacoes,
      pastoId: prenhezForm.pastoId || null
    };

    if (!payload.identificacaoVaca.trim()) {
      setErroPrenhez('Informe a identificacao da vaca.');
      mostrarToast('error', 'Vaca obrigatoria', 'Informe a identificacao da vaca.');
      return;
    }

    if (prenhezForm.modo === 'novo') {
      const novo = criarPrenhez(fazendaAtivaId, payload);
      if (!novo) {
        setErroPrenhez('Nao foi possivel salvar o registro de prenhez.');
        mostrarToast('error', 'Falha ao salvar', 'Nao foi possivel salvar o registro de prenhez.');
        return;
      }

      registrarHistorico(fazendaAtivaId, 'prenhez', `Prenhez registrada - Vaca: ${novo.identificacaoVaca}`, {
        acao: 'cadastrar',
        after: {
          identificacaoVaca: novo.identificacaoVaca,
          identificacaoTouro: novo.identificacaoTouro,
          dataCobertura: novo.dataCobertura,
          dataPrevisaoParto: novo.dataPrevisaoParto,
          pastoId: novo.pastoId,
          observacoes: novo.observacoes
        }
      });

      recarregar();
      fecharFormularioPrenhez();
      mostrarToast('success', 'Prenhez registrada', `Vaca ${novo.identificacaoVaca} registrada com sucesso.`);
      return;
    }

    if (!prenhezForm.id) {
      setErroPrenhez('Registro de prenhez invalido para edicao.');
      mostrarToast('error', 'Registro invalido', 'Nao foi possivel identificar o registro para edicao.');
      return;
    }

    const atual = snapshot.prenhezes.find((item) => mesmoId(item.id, prenhezForm.id));
    if (!atual) {
      setErroPrenhez('Registro de prenhez nao encontrado.');
      mostrarToast('error', 'Registro nao encontrado', 'Atualize a tela e tente novamente.');
      return;
    }

    const atualizado = atualizarPrenhez(prenhezForm.id, payload);
    if (!atualizado) {
      setErroPrenhez('Nao foi possivel atualizar o registro de prenhez.');
      mostrarToast('error', 'Falha ao atualizar', 'Nao foi possivel atualizar o registro de prenhez.');
      return;
    }

    registrarHistorico(fazendaAtivaId, 'prenhez', `Prenhez atualizada - Vaca: ${atualizado.identificacaoVaca}`, {
      acao: 'atualizar',
      prenhezId: atualizado.id,
      before: {
        identificacaoVaca: atual.identificacaoVaca,
        identificacaoTouro: atual.identificacaoTouro,
        dataCobertura: atual.dataCobertura,
        dataPrevisaoParto: atual.dataPrevisaoParto,
        pastoId: atual.pastoId,
        observacoes: atual.observacoes
      },
      after: {
        identificacaoVaca: atualizado.identificacaoVaca,
        identificacaoTouro: atualizado.identificacaoTouro,
        dataCobertura: atualizado.dataCobertura,
        dataPrevisaoParto: atualizado.dataPrevisaoParto,
        pastoId: atualizado.pastoId,
        observacoes: atualizado.observacoes
      }
    });

    recarregar();
    fecharFormularioPrenhez();
    mostrarToast('success', 'Prenhez atualizada', `Vaca ${atualizado.identificacaoVaca} atualizada.`);
  }

  function onRemoverPrenhez(prenhezId: string) {
    const registro = prenhezFiltradas.find((item) => mesmoId(item.id, prenhezId));
    if (!registro) return;

    const confirmar = window.confirm(
      `Deseja realmente remover o registro da vaca "${registro.identificacaoVaca}"?`
    );
    if (!confirmar) return;

    const removido = removerPrenhez(prenhezId);
    if (!removido) {
      mostrarToast('error', 'Falha ao remover', 'Nao foi possivel remover o registro de prenhez.');
      return;
    }

    if (fazendaAtivaId) {
      registrarHistorico(fazendaAtivaId, 'prenhez', `Prenhez removida - Vaca: ${removido.identificacaoVaca}`, {
        acao: 'remover',
        prenhezId: removido.id,
        before: {
          identificacaoVaca: removido.identificacaoVaca,
          identificacaoTouro: removido.identificacaoTouro,
          dataCobertura: removido.dataCobertura,
          dataPrevisaoParto: removido.dataPrevisaoParto,
          pastoId: removido.pastoId,
          observacoes: removido.observacoes
        }
      });
    }

    if (prenhezForm?.id && mesmoId(prenhezForm.id, removido.id)) {
      fecharFormularioPrenhez();
    }

    recarregar();
    mostrarToast('success', 'Prenhez removida', `Registro da vaca ${removido.identificacaoVaca} removido.`);
  }

  function abrirFormularioNovaDoenca() {
    if (!fazendaAtivaId) return;
    setErroDoenca(null);
    setDoencaForm(criarFormularioDoencaInicial());
  }

  function abrirFormularioEditarDoenca(registro: Doenca) {
    setErroDoenca(null);
    setDoencaForm({
      modo: 'editar',
      id: String(registro.id),
      identificacaoAnimal: registro.identificacaoAnimal,
      nomeDoenca: registro.nomeDoenca,
      dataRegistro: registro.dataRegistro || new Date().toISOString().slice(0, 10),
      status: registro.status,
      tratamento: registro.tratamento || '',
      observacoes: registro.observacoes || '',
      pastoId: registro.pastoId ? String(registro.pastoId) : ''
    });
  }

  function atualizarCampoDoenca(
    campo:
      | 'identificacaoAnimal'
      | 'nomeDoenca'
      | 'dataRegistro'
      | 'status'
      | 'tratamento'
      | 'observacoes'
      | 'pastoId',
    valor: string
  ) {
    setDoencaForm((atual) => (atual ? { ...atual, [campo]: valor } : atual));
  }

  function fecharFormularioDoenca() {
    setDoencaForm(null);
    setErroDoenca(null);
  }

  function onSalvarDoenca(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!doencaForm) return;

    if (!fazendaAtivaId) {
      setErroDoenca('Selecione uma fazenda antes de salvar uma doenca.');
      mostrarToast('error', 'Sem fazenda ativa', 'Selecione uma fazenda antes de salvar uma doenca.');
      return;
    }

    const payload = {
      identificacaoAnimal: doencaForm.identificacaoAnimal,
      nomeDoenca: doencaForm.nomeDoenca,
      dataRegistro: doencaForm.dataRegistro,
      status: doencaForm.status,
      tratamento: doencaForm.tratamento,
      observacoes: doencaForm.observacoes,
      pastoId: doencaForm.pastoId || null
    };

    if (!payload.identificacaoAnimal.trim()) {
      setErroDoenca('Informe a identificacao do animal.');
      mostrarToast('error', 'Animal obrigatorio', 'Informe a identificacao do animal.');
      return;
    }

    if (!payload.nomeDoenca.trim()) {
      setErroDoenca('Informe o nome da doenca.');
      mostrarToast('error', 'Doenca obrigatoria', 'Informe o nome da doenca.');
      return;
    }

    if (!payload.dataRegistro) {
      setErroDoenca('Informe a data do registro.');
      mostrarToast('error', 'Data obrigatoria', 'Informe a data do registro da doenca.');
      return;
    }

    if (doencaForm.modo === 'novo') {
      const nova = criarDoenca(fazendaAtivaId, payload);
      if (!nova) {
        setErroDoenca('Nao foi possivel salvar o registro de doenca.');
        mostrarToast('error', 'Falha ao salvar', 'Nao foi possivel salvar o registro de doenca.');
        return;
      }

      registrarHistorico(
        fazendaAtivaId,
        'doenca',
        `Doenca registrada - Animal: ${nova.identificacaoAnimal} - ${nova.nomeDoenca}`,
        {
          acao: 'cadastrar',
          doencaId: nova.id,
          after: {
            identificacaoAnimal: nova.identificacaoAnimal,
            nomeDoenca: nova.nomeDoenca,
            dataRegistro: nova.dataRegistro,
            status: nova.status,
            tratamento: nova.tratamento,
            pastoId: nova.pastoId,
            observacoes: nova.observacoes
          }
        }
      );

      recarregar();
      fecharFormularioDoenca();
      mostrarToast('success', 'Doenca registrada', `${nova.nomeDoenca} registrada para ${nova.identificacaoAnimal}.`);
      return;
    }

    if (!doencaForm.id) {
      setErroDoenca('Registro de doenca invalido para edicao.');
      mostrarToast('error', 'Registro invalido', 'Nao foi possivel identificar o registro para edicao.');
      return;
    }

    const atual = snapshot.doencas.find((item) => mesmoId(item.id, doencaForm.id));
    if (!atual) {
      setErroDoenca('Registro de doenca nao encontrado.');
      mostrarToast('error', 'Registro nao encontrado', 'Atualize a tela e tente novamente.');
      return;
    }

    const atualizada = atualizarDoenca(doencaForm.id, payload);
    if (!atualizada) {
      setErroDoenca('Nao foi possivel atualizar o registro de doenca.');
      mostrarToast('error', 'Falha ao atualizar', 'Nao foi possivel atualizar o registro de doenca.');
      return;
    }

    registrarHistorico(
      fazendaAtivaId,
      'doenca',
      `Doenca atualizada - Animal: ${atualizada.identificacaoAnimal} - ${atualizada.nomeDoenca}`,
      {
        acao: 'atualizar',
        doencaId: atualizada.id,
        before: {
          identificacaoAnimal: atual.identificacaoAnimal,
          nomeDoenca: atual.nomeDoenca,
          dataRegistro: atual.dataRegistro,
          status: atual.status,
          tratamento: atual.tratamento,
          pastoId: atual.pastoId,
          observacoes: atual.observacoes
        },
        after: {
          identificacaoAnimal: atualizada.identificacaoAnimal,
          nomeDoenca: atualizada.nomeDoenca,
          dataRegistro: atualizada.dataRegistro,
          status: atualizada.status,
          tratamento: atualizada.tratamento,
          pastoId: atualizada.pastoId,
          observacoes: atualizada.observacoes
        }
      }
    );

    recarregar();
    fecharFormularioDoenca();
    mostrarToast('success', 'Doenca atualizada', `${atualizada.nomeDoenca} foi atualizada.`);
  }

  function onRemoverDoenca(doencaId: string) {
    const registro = doencasFiltradas.find((item) => mesmoId(item.id, doencaId));
    if (!registro) return;

    const confirmar = window.confirm(
      `Deseja realmente remover o registro de "${registro.nomeDoenca}" do animal "${registro.identificacaoAnimal}"?`
    );
    if (!confirmar) return;

    const removida = removerDoenca(doencaId);
    if (!removida) {
      mostrarToast('error', 'Falha ao remover', 'Nao foi possivel remover o registro de doenca.');
      return;
    }

    if (fazendaAtivaId) {
      registrarHistorico(
        fazendaAtivaId,
        'doenca',
        `Doenca removida - Animal: ${removida.identificacaoAnimal} - ${removida.nomeDoenca}`,
        {
          acao: 'remover',
          doencaId: removida.id,
          before: {
            identificacaoAnimal: removida.identificacaoAnimal,
            nomeDoenca: removida.nomeDoenca,
            dataRegistro: removida.dataRegistro,
            status: removida.status,
            tratamento: removida.tratamento,
            pastoId: removida.pastoId,
            observacoes: removida.observacoes
          }
        }
      );
    }

    if (doencaForm?.id && mesmoId(doencaForm.id, removida.id)) {
      fecharFormularioDoenca();
    }

    recarregar();
    mostrarToast('success', 'Doenca removida', `${removida.nomeDoenca} foi removida.`);
  }

  function abrirDetalhesHistorico(registroId: string) {
    setHistoricoSelecionadoId(registroId);
  }

  function fecharDetalhesHistorico() {
    setHistoricoSelecionadoId(null);
  }

  function onAtalhoCard(
    evento: React.KeyboardEvent<HTMLElement>,
    acao: () => void
  ) {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      acao();
    }
  }

  const exibirConteudo = Boolean(fazendaAtivaId);

  return (
    <div className="app-shell">
      <header className="hero-header">
        <div className="farm-bar">
          <label className="field compact-field farm-active-field">
            <span>Fazenda ativa</span>
            <select value={fazendaAtivaId} onChange={onSelecionarFazenda}>
              <option value="">Selecione...</option>
              {snapshot.fazendas.map((fazenda) => (
                <option key={fazenda.id} value={fazenda.id}>
                  {fazenda.nome}
                </option>
              ))}
            </select>
          </label>

          <div className="farm-actions">
            <button
              className={
                altoContrasteAtivo
                  ? 'btn farm-action farm-contrast-btn contrast-on'
                  : 'btn ghost farm-action farm-contrast-btn'
              }
              type="button"
              onClick={alternarAltoContraste}
              aria-pressed={altoContrasteAtivo}
              title="Alternar alto contraste"
            >
              <span className="farm-action-icon" aria-hidden="true">☀</span>
              <span className="farm-action-text">Contraste</span>
            </button>

            <button className="btn ghost farm-action farm-manage-btn" type="button" onClick={abrirPainelFazendas}>
              <span className="farm-action-icon" aria-hidden="true">⚙</span>
              <span className="farm-action-text">Gerenciar</span>
            </button>
          </div>
        </div>
      </header>

      {painelFazendasAberto && (
        <div
          className="farm-sheet-overlay"
          role="presentation"
          tabIndex={-1}
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) {
              fecharPainelFazendas();
            }
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'Escape') {
              fecharPainelFazendas();
            }
          }}
        >
          <section className="farm-sheet" role="dialog" aria-modal="true" aria-labelledby="farm-modal-title">
            <div className="farm-sheet-handle" aria-hidden="true" />

            <div className="farm-sheet-header">
              <h3 id="farm-modal-title">Gerenciar fazendas</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={fecharPainelFazendas}
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            <form className="farm-manage-form" onSubmit={onRenomearFazendaAtiva}>
              <label className="field compact-field">
                <span>Editar nome da fazenda ativa</span>
                <input
                  type="text"
                  value={nomeFazendaEdicaoPainel}
                  onChange={(evento) => setNomeFazendaEdicaoPainel(evento.target.value)}
                  placeholder="Nome da fazenda"
                  maxLength={80}
                  disabled={!fazendaAtiva}
                />
              </label>
              <button className="btn primary" type="submit" disabled={!fazendaAtiva}>
                Salvar nome
              </button>
            </form>

            <form className="farm-manage-form" onSubmit={onCriarFazendaPainel}>
              <label className="field compact-field">
                <span>Criar nova fazenda</span>
                <input
                  type="text"
                  value={nomeFazendaNovaPainel}
                  onChange={(evento) => setNomeFazendaNovaPainel(evento.target.value)}
                  placeholder="Ex: Santa Luzia"
                  maxLength={80}
                />
              </label>
              <button className="btn primary" type="submit">
                Criar e selecionar
              </button>
            </form>

            <button className="btn danger" type="button" disabled={!fazendaAtiva} onClick={onRemoverFazendaAtual}>
              Remover fazenda ativa
            </button>

            {erroPainelFazenda && <p className="inline-error">{erroPainelFazenda}</p>}
          </section>
        </div>
      )}

      <nav className="tabs" aria-label="Navegacao de modulos">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            className={abaAtiva === aba.id ? 'tab active' : 'tab'}
            type="button"
            onClick={() => setAbaAtiva(aba.id)}
          >
            <span className="tab-icon" aria-hidden="true">{SIMBOLO_ABA[aba.id]}</span>
            <span className="tab-label">{aba.label}</span>
          </button>
        ))}
      </nav>

      {!exibirConteudo && (
        <section className="empty-panel">
          <h2>Nenhuma fazenda selecionada</h2>
          <p>Selecione uma fazenda existente ou crie uma nova para iniciar a migracao.</p>
        </section>
      )}

      {exibirConteudo && abaAtiva === 'pasto' && (
        <section className="panel-list module-panel module-pasto" aria-label="Lista de pastos">
          <div className="section-heading">
            <h2>Pastos da fazenda</h2>
          </div>

          <div className="pasto-toolbar">
            <button className="btn primary" type="button" onClick={abrirFormularioNovoPasto}>
              + Adicionar pasto
            </button>
          </div>


          {pastosFiltrados.length === 0 && (
            <div className="empty-panel">
              <h2>Sem pastos cadastrados</h2>
              <p>Use o botao acima para criar o primeiro pasto desta fazenda.</p>
            </div>
          )}

          {pastosFiltrados.map((pasto, indice) => {
            const totalAnimais = (pasto.animaisGrandes || 0) + (pasto.animaisPequenos || 0);
            const qtdPrenhez = prenhezPorPasto.get(String(pasto.id)) ?? 0;
            const qtdDoenca = doencasPorPasto.get(String(pasto.id)) ?? 0;

            return (
              <article
                className="item-card item-card-clickable list-enter-item"
                style={criarEstiloEntrada(indice)}
                key={pasto.id}
                role="button"
                tabIndex={0}
                aria-label={`Editar pasto ${pasto.nome}`}
                onClick={() => abrirFormularioEditarPasto(pasto)}
                onKeyDown={(evento) => onAtalhoCard(evento, () => abrirFormularioEditarPasto(pasto))}
              >
                <header>
                  <h3>{pasto.nome}</h3>
                  <span className="chip">{totalAnimais} animais</span>
                </header>
                <p>
                  Grandes: <strong>{pasto.animaisGrandes || 0}</strong> · Pequenos:{' '}
                  <strong>{pasto.animaisPequenos || 0}</strong>
                </p>
                <p>
                  Registros vinculados: <strong>{qtdPrenhez}</strong> prenhez · <strong>{qtdDoenca}</strong>{' '}
                  doencas
                </p>
                <p>Ultima atualizacao: {formatarData(pasto.dataAtualizacao || pasto.dataCriacao)}</p>
                {pasto.observacoes && <p className="muted">{pasto.observacoes}</p>}
              </article>
            );
          })}
        </section>
      )}

      {exibirConteudo && abaAtiva === 'prenhez' && (
        <section className="panel-list module-panel module-prenhez" aria-label="Lista de prenhez">
          <div className="section-heading">
            <h2>Controle de prenhez</h2>
          </div>

          <div className="pasto-toolbar">
            <button className="btn primary" type="button" onClick={abrirFormularioNovaPrenhez}>
              + Registrar prenhez
            </button>
          </div>


          {prenhezOrdenadas.length === 0 && (
            <div className="empty-panel">
              <h2>Sem registros de prenhez</h2>
              <p>Use o botao acima para registrar a primeira prenhez desta fazenda.</p>
            </div>
          )}

          {prenhezOrdenadas.map((registro, indice) => {
            const dias = calcularDiasRestantes(registro.dataPrevisaoParto);
            const pasto = registro.pastoId ? mapaPastos.get(String(registro.pastoId)) : null;

            return (
              <article
                className="item-card item-card-clickable list-enter-item"
                style={criarEstiloEntrada(indice, 20)}
                key={registro.id}
                role="button"
                tabIndex={0}
                aria-label={`Editar prenhez da vaca ${registro.identificacaoVaca}`}
                onClick={() => abrirFormularioEditarPrenhez(registro)}
                onKeyDown={(evento) => onAtalhoCard(evento, () => abrirFormularioEditarPrenhez(registro))}
              >
                <header>
                  <h3>Vaca {registro.identificacaoVaca}</h3>
                  <span className={dias !== null && dias <= 30 ? 'chip warning' : 'chip'}>
                    {dias === null ? 'Sem previsao' : dias >= 0 ? `${dias} dias` : 'Parto vencido'}
                  </span>
                </header>
                <p>Touro: {registro.identificacaoTouro || 'Nao informado'}</p>
                <p>Cobertura: {formatarData(registro.dataCobertura)}</p>
                <p>Previsao de parto: {formatarData(registro.dataPrevisaoParto)}</p>
                {pasto && <p>Pasto: {pasto}</p>}
                {registro.observacoes && <p className="muted">{registro.observacoes}</p>}
              </article>
            );
          })}
        </section>
      )}

      {exibirConteudo && abaAtiva === 'doenca' && (
        <section className="panel-list module-panel module-doenca" aria-label="Lista de doencas">
          <div className="section-heading">
            <h2>Saude do rebanho</h2>
          </div>

          <div className="pasto-toolbar">
            <button className="btn primary" type="button" onClick={abrirFormularioNovaDoenca}>
              + Registrar doenca
            </button>
          </div>


          {doencasOrdenadas.length === 0 && (
            <div className="empty-panel">
              <h2>Sem registros de doencas</h2>
              <p>Use o botao acima para registrar a primeira doenca desta fazenda.</p>
            </div>
          )}

          {doencasOrdenadas.map((registro, indice) => {
            const pasto = registro.pastoId ? mapaPastos.get(String(registro.pastoId)) : null;

            return (
              <article
                className="item-card item-card-clickable list-enter-item"
                style={criarEstiloEntrada(indice, 20)}
                key={registro.id}
                role="button"
                tabIndex={0}
                aria-label={`Editar doenca ${registro.nomeDoenca} do animal ${registro.identificacaoAnimal}`}
                onClick={() => abrirFormularioEditarDoenca(registro)}
                onKeyDown={(evento) => onAtalhoCard(evento, () => abrirFormularioEditarDoenca(registro))}
              >
                <header>
                  <h3>{registro.identificacaoAnimal}</h3>
                  <span className={`chip status-${registro.status}`}>{STATUS_DOENCA[registro.status]}</span>
                </header>
                <p>Doenca: {registro.nomeDoenca}</p>
                <p>Data: {formatarData(registro.dataRegistro)}</p>
                {pasto && <p>Pasto: {pasto}</p>}
                {registro.tratamento && <p>Tratamento: {registro.tratamento}</p>}
                {registro.observacoes && <p className="muted">{registro.observacoes}</p>}
              </article>
            );
          })}
        </section>
      )}

      {exibirConteudo && abaAtiva === 'historico' && (
        <section className="panel-list module-panel module-historico" aria-label="Lista de historico">
          <div className="section-heading">
            <h2>Historico geral</h2>
          </div>

          <div className="history-toolbar">
            <label className="field history-filter">
              Filtrar por tipo
              <select
                value={filtroHistorico}
                onChange={(evento) => setFiltroHistorico(evento.target.value as FiltroHistorico)}
              >
                {FILTROS_HISTORICO.map((filtro) => (
                  <option key={filtro.id} value={filtro.id}>
                    {filtro.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {historicoOrdenado.length === 0 && (
            <div className="empty-panel">
              <h2>Sem historico nesta fazenda</h2>
              <p>As acoes salvas pelos modulos legados e migrados ficam concentradas nesta visao.</p>
            </div>
          )}

          {historicoOrdenado.length > 0 && historicoFiltradoPorTipo.length === 0 && (
            <div className="empty-panel">
              <h2>Nenhum registro para este filtro</h2>
              <p>Troque o tipo no seletor para visualizar outros eventos.</p>
            </div>
          )}

          {historicoAgrupado.map((grupo) => (
            <div className="history-group" key={grupo.data}>
              <h3 className="history-date">{grupo.data}</h3>
              <div className="history-group-list">
                {grupo.itens.map((item, indice) => (
                  <button
                    className="history-item list-enter-item"
                    style={criarEstiloEntrada(indice)}
                    type="button"
                    key={item.id}
                    onClick={() => abrirDetalhesHistorico(String(item.id))}
                  >
                    <div className="history-item-main">
                      <p className="history-item-description">{item.descricao}</p>
                      <span className="chip">{formatarTipoHistorico(item)}</span>
                    </div>
                    <span className="history-item-time">{formatarHora(item.dataCriacao)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

        </section>
      )}

      {pastoForm && (
        <div
          className="farm-sheet-overlay"
          role="presentation"
          tabIndex={-1}
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) {
              fecharFormularioPasto();
            }
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'Escape') {
              fecharFormularioPasto();
            }
          }}
        >
          <section className="farm-sheet" role="dialog" aria-modal="true" aria-labelledby="pasto-sheet-title">
            <div className="farm-sheet-handle" aria-hidden="true" />

            <div className="farm-sheet-header">
              <h3 id="pasto-sheet-title">{pastoForm.modo === 'novo' ? 'Novo pasto' : 'Editar pasto'}</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={fecharFormularioPasto}
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            <form className="pasto-form sheet-form" onSubmit={onSalvarPasto}>
              <div className="form-grid">
                <label className="field">
                  Nome do pasto
                  <input
                    type="text"
                    value={pastoForm.nome}
                    onChange={(evento) => atualizarCampoPasto('nome', evento.target.value)}
                    placeholder="Ex: Invernada 1"
                    maxLength={80}
                    required
                  />
                </label>

                <label className="field">
                  Animais grandes
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={pastoForm.animaisGrandes}
                    onChange={(evento) => atualizarCampoPasto('animaisGrandes', evento.target.value)}
                  />
                </label>

                <label className="field">
                  Animais pequenos
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={pastoForm.animaisPequenos}
                    onChange={(evento) => atualizarCampoPasto('animaisPequenos', evento.target.value)}
                  />
                </label>

                <label className="field full">
                  Observacoes
                  <input
                    type="text"
                    value={pastoForm.observacoes}
                    onChange={(evento) => atualizarCampoPasto('observacoes', evento.target.value)}
                    placeholder="Anotacoes sobre o pasto"
                    maxLength={220}
                  />
                </label>
              </div>

              {erroPasto && <p className="inline-error">{erroPasto}</p>}

              <div className="item-actions">
                {pastoForm.modo === 'editar' && pastoForm.id && (
                  <button className="btn danger" type="button" onClick={() => onRemoverPasto(String(pastoForm.id))}>
                    Remover pasto
                  </button>
                )}
                <button className="btn primary" type="submit">
                  {pastoForm.modo === 'novo' ? 'Salvar pasto' : 'Atualizar pasto'}
                </button>
                <button className="btn ghost" type="button" onClick={fecharFormularioPasto}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {prenhezForm && (
        <div
          className="farm-sheet-overlay"
          role="presentation"
          tabIndex={-1}
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) {
              fecharFormularioPrenhez();
            }
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'Escape') {
              fecharFormularioPrenhez();
            }
          }}
        >
          <section className="farm-sheet" role="dialog" aria-modal="true" aria-labelledby="prenhez-sheet-title">
            <div className="farm-sheet-handle" aria-hidden="true" />

            <div className="farm-sheet-header">
              <h3 id="prenhez-sheet-title">{prenhezForm.modo === 'novo' ? 'Nova prenhez' : 'Editar prenhez'}</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={fecharFormularioPrenhez}
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            <form className="pasto-form sheet-form" onSubmit={onSalvarPrenhez}>
              <div className="form-grid">
                <label className="field">
                  Identificacao da vaca
                  <input
                    type="text"
                    value={prenhezForm.identificacaoVaca}
                    onChange={(evento) => atualizarCampoPrenhez('identificacaoVaca', evento.target.value)}
                    placeholder="Ex: Brinco 123"
                    maxLength={120}
                    required
                  />
                </label>

                <label className="field">
                  Identificacao do touro
                  <input
                    type="text"
                    value={prenhezForm.identificacaoTouro}
                    onChange={(evento) => atualizarCampoPrenhez('identificacaoTouro', evento.target.value)}
                    placeholder="Ex: Touro 456"
                    maxLength={120}
                  />
                </label>

                <label className="field">
                  Pasto
                  <select
                    value={prenhezForm.pastoId}
                    onChange={(evento) => atualizarCampoPrenhez('pastoId', evento.target.value)}
                    disabled={pastosFiltrados.length === 0}
                  >
                    <option value="">Selecione um pasto</option>
                    {pastosFiltrados.map((pasto) => (
                      <option key={pasto.id} value={String(pasto.id)}>
                        {pasto.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  Data da cobertura
                  <input
                    type="date"
                    value={prenhezForm.dataCobertura}
                    onChange={(evento) => atualizarCampoPrenhez('dataCobertura', evento.target.value)}
                  />
                </label>

                <label className="field">
                  Previsao de parto
                  <input
                    type="date"
                    value={prenhezForm.dataPrevisaoParto}
                    onChange={(evento) => atualizarCampoPrenhez('dataPrevisaoParto', evento.target.value)}
                  />
                </label>

                <label className="field full">
                  Observacoes
                  <input
                    type="text"
                    value={prenhezForm.observacoes}
                    onChange={(evento) => atualizarCampoPrenhez('observacoes', evento.target.value)}
                    placeholder="Anotacoes sobre a prenhez"
                    maxLength={220}
                  />
                </label>
              </div>

              <p className="hint-line">Gestacao media: 283 dias (9 meses e 10 dias).</p>

              {erroPrenhez && <p className="inline-error">{erroPrenhez}</p>}

              <div className="item-actions">
                {prenhezForm.modo === 'editar' && prenhezForm.id && (
                  <button className="btn danger" type="button" onClick={() => onRemoverPrenhez(String(prenhezForm.id))}>
                    Remover registro
                  </button>
                )}
                <button className="btn primary" type="submit">
                  {prenhezForm.modo === 'novo' ? 'Salvar registro' : 'Atualizar registro'}
                </button>
                <button className="btn ghost" type="button" onClick={fecharFormularioPrenhez}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {doencaForm && (
        <div
          className="farm-sheet-overlay"
          role="presentation"
          tabIndex={-1}
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) {
              fecharFormularioDoenca();
            }
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'Escape') {
              fecharFormularioDoenca();
            }
          }}
        >
          <section className="farm-sheet" role="dialog" aria-modal="true" aria-labelledby="doenca-sheet-title">
            <div className="farm-sheet-handle" aria-hidden="true" />

            <div className="farm-sheet-header">
              <h3 id="doenca-sheet-title">{doencaForm.modo === 'novo' ? 'Nova doenca' : 'Editar doenca'}</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={fecharFormularioDoenca}
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            <form className="pasto-form sheet-form" onSubmit={onSalvarDoenca}>
              <div className="form-grid">
                <label className="field">
                  Identificacao do animal
                  <input
                    type="text"
                    value={doencaForm.identificacaoAnimal}
                    onChange={(evento) => atualizarCampoDoenca('identificacaoAnimal', evento.target.value)}
                    placeholder="Ex: Brinco 123"
                    maxLength={120}
                    required
                  />
                </label>

                <label className="field">
                  Nome da doenca
                  <input
                    type="text"
                    value={doencaForm.nomeDoenca}
                    onChange={(evento) => atualizarCampoDoenca('nomeDoenca', evento.target.value)}
                    placeholder="Ex: Mastite"
                    maxLength={120}
                    required
                  />
                </label>

                <label className="field">
                  Data do registro
                  <input
                    type="date"
                    value={doencaForm.dataRegistro}
                    onChange={(evento) => atualizarCampoDoenca('dataRegistro', evento.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  Status
                  <select
                    value={doencaForm.status}
                    onChange={(evento) => atualizarCampoDoenca('status', evento.target.value)}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="tratamento">Em tratamento</option>
                    <option value="curado">Curado</option>
                  </select>
                </label>

                <label className="field">
                  Pasto
                  <select
                    value={doencaForm.pastoId}
                    onChange={(evento) => atualizarCampoDoenca('pastoId', evento.target.value)}
                    disabled={pastosFiltrados.length === 0}
                  >
                    <option value="">Selecione um pasto</option>
                    {pastosFiltrados.map((pasto) => (
                      <option key={pasto.id} value={String(pasto.id)}>
                        {pasto.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  Tratamento
                  <input
                    type="text"
                    value={doencaForm.tratamento}
                    onChange={(evento) => atualizarCampoDoenca('tratamento', evento.target.value)}
                    placeholder="Ex: Antibiotico"
                    maxLength={160}
                  />
                </label>

                <label className="field full">
                  Observacoes
                  <input
                    type="text"
                    value={doencaForm.observacoes}
                    onChange={(evento) => atualizarCampoDoenca('observacoes', evento.target.value)}
                    placeholder="Sintomas, evolucao e anotacoes"
                    maxLength={220}
                  />
                </label>
              </div>

              {erroDoenca && <p className="inline-error">{erroDoenca}</p>}

              <div className="item-actions">
                {doencaForm.modo === 'editar' && doencaForm.id && (
                  <button className="btn danger" type="button" onClick={() => onRemoverDoenca(String(doencaForm.id))}>
                    Remover registro
                  </button>
                )}
                <button className="btn primary" type="submit">
                  {doencaForm.modo === 'novo' ? 'Salvar registro' : 'Atualizar registro'}
                </button>
                <button className="btn ghost" type="button" onClick={fecharFormularioDoenca}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {historicoSelecionado && (
        <div
          className="history-modal-overlay"
          role="presentation"
          tabIndex={-1}
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) {
              fecharDetalhesHistorico();
            }
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'Escape') {
              fecharDetalhesHistorico();
            }
          }}
        >
          <div className="history-modal" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
            <div className="farm-sheet-handle" aria-hidden="true" />

            <div className="history-modal-header">
              <h3 id="history-modal-title">Detalhes do historico</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={fecharDetalhesHistorico}
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            <p className="history-modal-description">{historicoSelecionado.descricao}</p>

            <div className="history-details-grid">
              <article className="history-details-card">
                <h4>Resumo</h4>
                <div className="history-details-line">
                  <span>Tipo</span>
                  <strong>{formatarTipoHistorico(historicoSelecionado)}</strong>
                </div>
                <div className="history-details-line">
                  <span>Quando</span>
                  <strong>{formatarDataHora(historicoSelecionado.dataCriacao)}</strong>
                </div>
              </article>

              {detalhesHistoricoSelecionado?.antes && (
                <article className="history-details-card">
                  <h4>Antes</h4>
                  {Object.entries(detalhesHistoricoSelecionado.antes).map(([chave, valor]) => (
                    <div className="history-details-line" key={`antes-${chave}`}>
                      <span>{chave}</span>
                      <strong>{String(valor)}</strong>
                    </div>
                  ))}
                </article>
              )}

              {detalhesHistoricoSelecionado?.depois && (
                <article className="history-details-card">
                  <h4>Agora</h4>
                  {Object.entries(detalhesHistoricoSelecionado.depois).map(([chave, valor]) => (
                    <div className="history-details-line" key={`depois-${chave}`}>
                      <span>{chave}</span>
                      <strong>{String(valor)}</strong>
                    </div>
                  ))}
                </article>
              )}
            </div>

            {detalhesHistoricoSelecionado?.info && (
              <p className="history-details-info">{detalhesHistoricoSelecionado.info}</p>
            )}

            {!detalhesHistoricoSelecionado?.info &&
              !detalhesHistoricoSelecionado?.antes &&
              !detalhesHistoricoSelecionado?.depois && (
                <p className="history-details-info">Sem detalhes adicionais salvos para este registro.</p>
              )}
          </div>
        </div>
      )}

      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <article
            key={toast.id}
            className={`toast-item toast-${toast.tipo}`}
            role="status"
            aria-label={toast.titulo}
          >
            <span className="toast-symbol" aria-hidden="true">
              {toast.tipo === 'success' ? '✓' : toast.tipo === 'error' ? '!' : 'i'}
            </span>
            <div className="toast-copy">
              <strong>{toast.titulo}</strong>
              {toast.descricao && <p>{toast.descricao}</p>}
            </div>
            <button
              className="toast-close"
              type="button"
              onClick={() => removerToast(toast.id)}
              aria-label="Fechar notificacao"
            >
              ×
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export default App;
