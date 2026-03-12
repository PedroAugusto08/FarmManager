# Farm Manager React Migration

Aplicacao React + TypeScript criada para migracao incremental do sistema legado em JavaScript puro.

## Etapa 6 concluida

- Base React + TypeScript com Vite criada em pasta separada.
- Tipagem de dominio para fazendas, pastos, prenhez, doencas e historico.
- Camada de storage compativel com o legado, usando as mesmas chaves do localStorage.
- CRUD completo de Pastos no React:
  - criar;
  - editar;
  - remover;
  - registrar historico com metadados before/after.
- CRUD completo de Prenhez no React:
  - criar com calculo automatico de previsao de parto (+283 dias);
  - editar;
  - remover;
  - registrar historico com metadados before/after.
- CRUD completo de Doencas no React:
  - criar;
  - editar;
  - remover;
  - registrar historico com metadados before/after.
- Historico detalhado no React:
  - filtro por tipo;
  - agrupamento por data (Hoje/Ontem/dias anteriores);
  - modal com comparativo Antes/Agora e resumo de evento.
- PWA integrada na versao React:
  - `manifest.webmanifest` dedicado na pasta `public`;
  - `sw.js` para cache offline basico de navegacao e assets;
  - registro do service worker no bootstrap da aplicacao.
- Painel com selecao de fazenda ativa, resumo e abas por modulo.

## Como rodar

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev`: inicia ambiente de desenvolvimento
- `npm run build`: valida TypeScript e gera build de producao
- `npm run preview`: serve build localmente

## Proximas etapas sugeridas

1. Definir estrategia de corte final do app legado.
2. Opcional: evoluir para precache automatico de assets com plugin PWA no Vite.
