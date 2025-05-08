# Sistema de Gerenciamento de Tarefas com OpenTelemetry

Uma aplicação completa para gerenciamento de tarefas com recursos avançados de observabilidade usando OpenTelemetry, permitindo monitoramento detalhado de desempenho, rastreamento de operações e métricas de negócio.

![Todo App OpenTelemetry](https://img.shields.io/badge/Todo%20App-OpenTelemetry-blueviolet)
![NestJS](https://img.shields.io/badge/NestJS-10.0.0-red)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![Grafana](https://img.shields.io/badge/Grafana-Latest-orange)
![Jaeger](https://img.shields.io/badge/Jaeger-Latest-purple)

## 📋 Funcionalidades

- **Gerenciamento de Tarefas**: Criar, editar, atualizar status, arquivar e deletar tarefas
- **Sistema de Usuários**: Múltiplos usuários podem gerenciar suas próprias tarefas
- **Transferência de Tarefas**: Transferir tarefas entre usuários com rastreamento completo
- **Histórico de Ações**: Registro detalhado de todas as modificações nas tarefas
- **Monitoramento em Tempo Real**: Dashboards para visualizar métricas de tarefas
- **Rastreamento Detalhado**: Trace completo de todas as operações no sistema
- **Métricas de Negócio**: Estatísticas de uso, transferências e estados das tarefas

## 🚀 Tecnologias

- **Backend**: NestJS (TypeScript)
- **Banco de Dados**: MySQL
- **Observabilidade**: OpenTelemetry
- **Coleta de Métricas**: Prometheus
- **Visualização**: Grafana
- **Rastreamento**: Jaeger
- **Instrumentação**: Auto-instrumentação do OpenTelemetry para Node.js

## 🔧 Pré-requisitos

- Node.js 16+
- Docker e Docker Compose
- NPM ou Yarn

## 🛠️ Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/todo-pelotasjs-opentelemetry.git
cd todo-pelotasjs-opentelemetry
```

2. **Instale as dependências**

```bash
npm install
# ou
yarn install
```

3. **Inicie os serviços de infraestrutura**

```bash
docker-compose up -d
```

Isso iniciará:
- MySQL (banco de dados)
- Jaeger (rastreamento)
- Prometheus (métricas)
- Grafana (dashboards)
- OpenTelemetry Collector (coleta de telemetria)

4. **Inicie a aplicação**

```bash
npm run start:dev
# ou
yarn start:dev
```

## 📊 Acessando os Dashboards

- **API da Aplicação**: http://localhost:3000
- **Grafana**: http://localhost:3001 (usuário: `admin`, senha: `admin`)
  - Dashboard de Tarefas
  - Dashboard de Transferências 
  - Explorador de Traces
- **Jaeger UI**: http://localhost:16686
- **Prometheus**: http://localhost:9090

## 🔄 Gerando Dados de Simulação

Para popular o sistema com dados e gerar telemetria para visualização:

```bash
node simulate-all.js         # Simulação completa do sistema
node simulate-transfers.js   # Foco em transferências de tarefas
node simulate-metrics.js     # Foco em geração de métricas
```

## 📡 Endpoints da API

### Tarefas
- `GET /tasks` - Listar todas as tarefas
- `GET /tasks/:id` - Obter detalhes de uma tarefa
- `POST /tasks` - Criar uma nova tarefa
- `PATCH /tasks/:id` - Atualizar uma tarefa
- `DELETE /tasks/:id` - Excluir uma tarefa
- `PATCH /tasks/:id/archive` - Arquivar uma tarefa
- `GET /tasks/:id/history` - Obter histórico de uma tarefa
- `PATCH /tasks/:id/transfer` - Transferir tarefa para outro usuário
- `GET /tasks/stats` - Obter estatísticas das tarefas

### Usuários
- `GET /users` - Listar todos os usuários
- `GET /users/:id` - Obter detalhes de um usuário
- `POST /users` - Criar um novo usuário
- `GET /users/stats` - Obter estatísticas dos usuários

## 📈 Monitoramento e Observabilidade

### Métricas Disponíveis
- `task_status_count_total` - Contagem de tarefas por status
- `task_duration_days` - Duração das tarefas em dias
- `task_transfers_count_total` - Contagem de transferências entre usuários
- `user_activity_count_total` - Contagem de atividades por usuário

### Traces
- Rastreamento completo de todas as requisições HTTP
- Spans para operações de banco de dados
- Spans personalizados para operações de negócio
- Propagação de contexto entre componentes

## 📝 Exemplos de Uso

### Criar uma tarefa
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Nova tarefa", "description": "Descrição da tarefa", "userId": 1}'
```

### Transferir uma tarefa
```bash
curl -X PATCH http://localhost:3000/tasks/1/transfer \
  -H "Content-Type: application/json" \
  -d '{"newUserId": 2, "message": "Transferindo para outro time"}'
```

### Obter histórico de uma tarefa
```bash
curl -X GET http://localhost:3000/tasks/1/history
```

## 🧪 Testando a Aplicação

```bash
npm run test        # Executar testes unitários
npm run test:e2e    # Executar testes end-to-end
```

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
