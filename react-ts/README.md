# Farm Manager React Migration

Aplicacao React + TypeScript criada para migracao incremental do sistema legado em JavaScript puro.

## Etapa 1 concluida

- Base React + TypeScript com Vite criada em pasta separada.
- Tipagem de dominio para fazendas, pastos, prenhez, doencas e historico.
- Camada de storage compativel com o legado, usando as mesmas chaves do localStorage.
- Painel inicial com:
  - selecao de fazenda ativa;
  - criacao e remocao de fazenda;
  - abas por modulo;
  - leitura dos registros existentes para cada modulo.

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

1. Migrar CRUD completo de Pastos para componentes React.
2. Migrar formularios de Prenhez e Doencas com validacao tipada.
3. Migrar visualizacao detalhada do Historico.
4. Integrar Service Worker e manifesto no app React.
5. Definir estrategia de corte final do app legado.
