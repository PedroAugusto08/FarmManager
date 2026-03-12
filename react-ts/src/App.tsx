import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  carregarSnapshot,
  criarFazenda,
  definirFazendaAtiva,
  removerFazenda
} from './services/storage';
import type { Doenca, Historico, Prenhez, StatusDoenca } from './types/domain';

type Aba = 'pasto' | 'prenhez' | 'doenca' | 'historico';

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

function ordenarPorDataDesc<T extends { dataCriacao: string }>(lista: T[]): T[] {
  return [...lista].sort(
    (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
  );
}

function App() {
  const [snapshot, setSnapshot] = useState(() => carregarSnapshot());
  const [abaAtiva, setAbaAtiva] = useState<Aba>('pasto');
  const [nomeNovaFazenda, setNomeNovaFazenda] = useState('');

  const recarregar = useCallback(() => {
    setSnapshot(carregarSnapshot());
  }, []);

  useEffect(() => {
    recarregar();

    const onStorage = () => recarregar();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [recarregar]);

  const fazendaAtivaId = snapshot.fazendaAtiva ?? '';

  const fazendaAtiva = useMemo(
    () => snapshot.fazendas.find((fazenda) => fazenda.id === fazendaAtivaId) ?? null,
    [snapshot.fazendas, fazendaAtivaId]
  );

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
    () => new Map(pastosFiltrados.map((pasto) => [pasto.id, pasto.nome])),
    [pastosFiltrados]
  );

  const qtdTotalAnimais = useMemo(
    () =>
      pastosFiltrados.reduce(
        (acumulador, pasto) => acumulador + (pasto.animaisGrandes || 0) + (pasto.animaisPequenos || 0),
        0
      ),
    [pastosFiltrados]
  );

  const prenhezOrdenadas = useMemo(
    () => ordenarPorDataDesc<Prenhez>(prenhezFiltradas),
    [prenhezFiltradas]
  );

  const doencasOrdenadas = useMemo(
    () => ordenarPorDataDesc<Doenca>(doencasFiltradas),
    [doencasFiltradas]
  );

  const historicoOrdenado = useMemo(
    () => ordenarPorDataDesc<Historico>(historicoFiltrado),
    [historicoFiltrado]
  );

  const prenhezPorPasto = useMemo(() => {
    const contagem = new Map<string, number>();
    prenhezFiltradas.forEach((registro) => {
      if (!registro.pastoId) return;
      contagem.set(registro.pastoId, (contagem.get(registro.pastoId) ?? 0) + 1);
    });
    return contagem;
  }, [prenhezFiltradas]);

  const doencasPorPasto = useMemo(() => {
    const contagem = new Map<string, number>();
    doencasFiltradas.forEach((registro) => {
      if (!registro.pastoId) return;
      contagem.set(registro.pastoId, (contagem.get(registro.pastoId) ?? 0) + 1);
    });
    return contagem;
  }, [doencasFiltradas]);

  function onSelecionarFazenda(evento: React.ChangeEvent<HTMLSelectElement>) {
    const proximoId = evento.target.value || null;
    definirFazendaAtiva(proximoId);
    recarregar();
  }

  function onCriarFazenda(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nova = criarFazenda(nomeNovaFazenda);
    if (!nova) return;

    definirFazendaAtiva(nova.id);
    setNomeNovaFazenda('');
    recarregar();
  }

  function onRemoverFazendaAtual() {
    if (!fazendaAtiva) return;

    const confirmar = window.confirm(
      `Remover a fazenda "${fazendaAtiva.nome}"? Os registros vinculados permanecem salvos no localStorage.`
    );

    if (!confirmar) return;
    removerFazenda(fazendaAtiva.id);
    recarregar();
  }

  const exibirConteudo = Boolean(fazendaAtivaId);

  return (
    <div className="app-shell">
      <header className="hero-header">
        <p className="kicker">Farm Manager · Migracao React + TypeScript</p>
        <h1>Painel de transicao</h1>
        <p className="lead">
          Etapa 1 pronta: leitura e escrita no mesmo localStorage do sistema atual, com tipagem forte e
          interface modular em React.
        </p>

        <form className="farm-form" onSubmit={onCriarFazenda}>
          <label className="field">
            Fazenda ativa
            <select value={fazendaAtivaId} onChange={onSelecionarFazenda}>
              <option value="">Selecione...</option>
              {snapshot.fazendas.map((fazenda) => (
                <option key={fazenda.id} value={fazenda.id}>
                  {fazenda.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Nova fazenda
            <input
              type="text"
              value={nomeNovaFazenda}
              onChange={(evento) => setNomeNovaFazenda(evento.target.value)}
              placeholder="Ex: Fazenda Santa Luzia"
              maxLength={80}
            />
          </label>

          <button className="btn primary" type="submit">
            Adicionar
          </button>

          <button className="btn ghost" type="button" disabled={!fazendaAtiva} onClick={onRemoverFazendaAtual}>
            Remover ativa
          </button>
        </form>
      </header>

      <section className="summary-grid" aria-label="Resumo da fazenda">
        <article className="summary-card">
          <p className="summary-label">Pastos</p>
          <strong>{pastosFiltrados.length}</strong>
        </article>
        <article className="summary-card">
          <p className="summary-label">Animais</p>
          <strong>{qtdTotalAnimais}</strong>
        </article>
        <article className="summary-card">
          <p className="summary-label">Prenhez</p>
          <strong>{prenhezFiltradas.length}</strong>
        </article>
        <article className="summary-card">
          <p className="summary-label">Doencas</p>
          <strong>{doencasFiltradas.length}</strong>
        </article>
        <article className="summary-card">
          <p className="summary-label">Historico</p>
          <strong>{historicoFiltrado.length}</strong>
        </article>
      </section>

      <nav className="tabs" aria-label="Navegacao de modulos">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            className={abaAtiva === aba.id ? 'tab active' : 'tab'}
            type="button"
            onClick={() => setAbaAtiva(aba.id)}
          >
            {aba.label}
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
        <section className="panel-list" aria-label="Lista de pastos">
          {pastosFiltrados.length === 0 && (
            <div className="empty-panel">
              <h2>Sem pastos cadastrados</h2>
              <p>Os dados de pastos desta fazenda aparecerao aqui conforme voce migrar os formularios.</p>
            </div>
          )}

          {pastosFiltrados.map((pasto) => {
            const totalAnimais = (pasto.animaisGrandes || 0) + (pasto.animaisPequenos || 0);
            const qtdPrenhez = prenhezPorPasto.get(pasto.id) ?? 0;
            const qtdDoenca = doencasPorPasto.get(pasto.id) ?? 0;

            return (
              <article className="item-card" key={pasto.id}>
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
                {pasto.observacoes && <p className="muted">{pasto.observacoes}</p>}
              </article>
            );
          })}
        </section>
      )}

      {exibirConteudo && abaAtiva === 'prenhez' && (
        <section className="panel-list" aria-label="Lista de prenhez">
          {prenhezOrdenadas.length === 0 && (
            <div className="empty-panel">
              <h2>Sem registros de prenhez</h2>
              <p>Este modulo ja esta lendo os dados legados e preparado para receber os formularios React.</p>
            </div>
          )}

          {prenhezOrdenadas.map((registro) => {
            const dias = calcularDiasRestantes(registro.dataPrevisaoParto);
            const pasto = registro.pastoId ? mapaPastos.get(registro.pastoId) : null;

            return (
              <article className="item-card" key={registro.id}>
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
        <section className="panel-list" aria-label="Lista de doencas">
          {doencasOrdenadas.length === 0 && (
            <div className="empty-panel">
              <h2>Sem registros de doencas</h2>
              <p>Quando houver dados no legado, eles ja aparecerao aqui automaticamente.</p>
            </div>
          )}

          {doencasOrdenadas.map((registro) => {
            const pasto = registro.pastoId ? mapaPastos.get(registro.pastoId) : null;

            return (
              <article className="item-card" key={registro.id}>
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
        <section className="panel-list" aria-label="Lista de historico">
          {historicoOrdenado.length === 0 && (
            <div className="empty-panel">
              <h2>Sem historico nesta fazenda</h2>
              <p>As acoes salvas pelos modulos legados e migrados ficam concentradas nesta visao.</p>
            </div>
          )}

          {historicoOrdenado.map((item) => (
            <article className="item-card" key={item.id}>
              <header>
                <h3>{item.descricao}</h3>
                <span className="chip">{item.tipo}</span>
              </header>
              <p>Criado em: {formatarData(item.dataCriacao)}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default App;
