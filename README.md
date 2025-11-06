# Farm Manager - Controle de Gado

Aplicativo web mobile para controle e gerenciamento de gado, desenvolvido com foco em simplicidade e usabilidade para fazendeiros.

## Características

- **Design Mobile-First**: Interface otimizada para smartphones, especialmente iOS
- **Funciona Offline**: Todos os dados são salvos localmente no navegador
- **Interface Simples**: Botões grandes, texto claro e navegação intuitiva
- **Sem Dependências**: Desenvolvido em vanilla JavaScript, HTML5 e CSS3

## 🎯 Funcionalidades

### 1. Gerenciamento de Pastos
- Cadastro de pastos com nome, área e quantidade de animais
- Anotações e observações sobre cada pasto
- Edição e remoção de registros

### 2. Controle de Prenhez
- Registro de coberturas com identificação de vaca e touro
- Cálculo automático da previsão de parto (283 dias)
- Contador de dias até o parto
- Alertas visuais para partos próximos (≤30 dias)

### 3. Controle de Doenças
- Registro de doenças com identificação do animal
- Acompanhamento de tratamentos
- Status: Ativo, Em Tratamento ou Curado
- Informações sobre veterinário responsável

### 4. Histórico Geral
- Visualização cronológica de todas as ações
- Filtros por tipo de registro
- Agrupamento por data (Hoje, Ontem, etc.)
- Ícones coloridos por categoria

## Estrutura do Projeto

```
FarmManager/
├── index.html              # Página principal
├── css/
│   └── styles.css         # Estilos responsivos
├── js/
│   ├── app.js            # Módulo principal
│   ├── storage.js        # Gerenciamento de dados (localStorage)
│   ├── pasto.js          # Módulo de pastos
│   ├── prenhez.js        # Módulo de prenhez
│   ├── doenca.js         # Módulo de doenças
│   └── historico.js      # Módulo de histórico
└── README.md             # Documentação
```

## 🚀 Como Usar

### Instalação

1. Clone ou baixe este repositório
2. Abra o arquivo `index.html` em um navegador moderno

### Para iOS (Adicionar à Tela Inicial)

1. Abra o app no Safari
2. Toque no ícone de compartilhamento
3. Selecione "Adicionar à Tela de Início"
4. O app funcionará como um aplicativo nativo

### Uso Básico

1. **Navegar**: Use os botões na parte superior para alternar entre seções
2. **Adicionar Registros**: Clique no botão "+ Adicionar" em cada seção
3. **Editar**: Toque em "✏️ Editar" no card desejado
4. **Remover**: Toque em "🗑️ Remover" (com confirmação)
5. **Histórico**: Visualize todas as ações na aba "Histórico"

## 💾 Armazenamento de Dados

- Todos os dados são salvos localmente usando `localStorage`
- Os dados persistem mesmo após fechar o navegador
- Nenhuma informação é enviada para servidores externos
- **Importante**: Não limpe os dados do navegador para não perder as informações

### Tipografia

- Sistema nativo: `-apple-system, BlinkMacSystemFont, Segoe UI`
- Tamanhos otimizados para legibilidade mobile
- Texto mínimo de 16px (previne zoom no iOS)

## 🔧 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Design responsivo com Grid e Flexbox
- **JavaScript ES6+**: Módulos, Arrow Functions, Destructuring
- **localStorage API**: Persistência de dados
- **PWA Ready**: Preparado para adicionar Service Worker

## 📝 Próximas Fases

- [ ] Implementar Service Worker para funcionamento offline completo
- [ ] Adicionar ícones e splash screens para PWA
- [ ] Sistema de backup e exportação de dados
- [ ] Notificações para partos próximos
- [ ] Gráficos e estatísticas

## 📄 Licença

Projeto desenvolvido para uso pessoal.
