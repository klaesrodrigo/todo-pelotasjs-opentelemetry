# Visualização de Traces com Spans Expandidos

Esta documentação contém instruções para explorar spans e traces detalhados do sistema de tarefas.

## Componentes

O sistema de visualização de traces inclui:

- **Jaeger**: Para armazenamento e visualização de traces
- **Grafana**: Para painéis de visualização integrados
- **OpenTelemetry Collector**: Para coletar e encaminhar os traces

## Iniciar o Ambiente

1. Inicie todos os contêineres:

```bash
sudo docker-compose down
sudo docker-compose up -d
```

2. Inicie a aplicação:

```bash
npm run start:dev
```

3. Execute o simulador para gerar dados:

```bash
node simulate-all.js
```

## Acessar as Visualizações

### Interface do Jaeger

A interface nativa do Jaeger está disponível em:
- http://localhost:16686

Recursos disponíveis:
- Busca por serviço, operação, tags e duração
- Visualização detalhada de spans
- Gráfico de dependências
- Comparação de traces
- Visualizações em Flame Graph

### Dashboard Grafana

O dashboard integrado no Grafana está disponível em:
- http://localhost:3001 (usuário: admin, senha: admin)
- Acesse o dashboard "Explorador de Traces"

Recursos disponíveis:
- Visualização integrada de traces
- Exploração de spans aninhados
- Gráfico de dependências
- Métricas relacionadas

## Explorando Spans

Na interface do Jaeger, você pode:

1. Buscar traces usando diversos filtros
2. Clicar em um trace para ver os detalhes
3. Expandir os spans para visualizar:
   - Estrutura detalhada da requisição
   - Atributos de cada span
   - Eventos e logs
   - Tags e metadados
   
4. Alternar entre diferentes visualizações:
   - Timeline (padrão)
   - Gráfico
   - Tabela de spans
   - Flame Graph

## Correlação com Logs e Métricas

Você pode correlacionar traces com:

1. Logs - visualizando logs associados a um span específico
2. Métricas - verificando métricas relacionadas ao serviço durante o período do trace
3. Métricas de transferência - analisando os padrões de transferência de tarefas

## Dicas para Análise de Traces

- Use a visualização de flame graph para identificar gargalos
- Compare traces similares para identificar diferenças de performance
- Filtre spans por duração para localizar operações lentas
- Examine os metadados dos spans para entender o contexto de execução 