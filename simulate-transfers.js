const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const SIMULATION_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos
const USERS = [1, 2, 3]; // IDs dos usuários existentes

// Simulação de transferências de tarefas
async function runSimulation() {
  console.log('Iniciando simulação para gerar dados de transferências de tarefas');
  console.log(`A simulação vai durar ${SIMULATION_DURATION / 1000 / 60} minutos`);
  
  // Buscar todas as tarefas
  let tasks = [];
  try {
    const response = await axios.get(`${BASE_URL}/tasks`);
    tasks = response.data;
    console.log(`Encontradas ${tasks.length} tarefas para simular transferências`);
  } catch (err) {
    console.error('Erro ao buscar tarefas:', err.message);
    return;
  }
  
  if (tasks.length === 0) {
    console.log('Não há tarefas disponíveis. Criando algumas tarefas para simulação...');
    
    // Criar algumas tarefas para simulação
    for (let i = 0; i < 10; i++) {
      try {
        const userId = USERS[Math.floor(Math.random() * USERS.length)];
        const taskTitle = `Tarefa simulada ${i + 1}`;
        
        console.log(`Criando tarefa "${taskTitle}" para o usuário ${userId}`);
        const response = await axios.post(`${BASE_URL}/tasks`, {
          title: taskTitle,
          description: `Descrição da tarefa simulada ${i + 1}`,
          userId,
          due_date: getRandomFutureDate()
        });
        
        tasks.push(response.data);
      } catch (err) {
        console.error(`Erro ao criar tarefa ${i + 1}:`, err.message);
      }
    }
  }
  
  // Simular transferências aleatórias
  const transferInterval = setInterval(async () => {
    try {
      if (tasks.length === 0) {
        console.log('Não há tarefas disponíveis para transferir');
        return;
      }
      
      // Escolher uma tarefa aleatória
      const randomTaskIndex = Math.floor(Math.random() * tasks.length);
      const taskToTransfer = tasks[randomTaskIndex];
      
      // Escolher um usuário de destino diferente do atual
      let newUserId;
      do {
        newUserId = USERS[Math.floor(Math.random() * USERS.length)];
      } while (newUserId === taskToTransfer.userId);
      
      console.log(`Transferindo tarefa ${taskToTransfer.id} do usuário ${taskToTransfer.userId} para o usuário ${newUserId}`);
      
      // Executar a transferência
      await axios.patch(`${BASE_URL}/tasks/${taskToTransfer.id}/transfer`, {
        newUserId,
        message: `Transferência simulada para o usuário ${newUserId}`
      });
      
      // Atualizar o usuário da tarefa no nosso array local
      tasks[randomTaskIndex].userId = newUserId;
      
      // Verificar histórico da tarefa
      console.log(`Verificando histórico da tarefa ${taskToTransfer.id}`);
      const historyResponse = await axios.get(`${BASE_URL}/tasks/${taskToTransfer.id}/history`);
      console.log(`Número de registros no histórico: ${historyResponse.data.length}`);
      
    } catch (err) {
      console.error('Erro na simulação de transferência:', err.message);
    }
  }, 10000); // a cada 10 segundos
  
  // Encerrar simulação após o tempo definido
  setTimeout(() => {
    clearInterval(transferInterval);
    
    console.log('Simulação de transferências finalizada com sucesso!');
    console.log('As métricas de transferência devem estar visíveis no Grafana');
  }, SIMULATION_DURATION);
}

// Gerar data aleatória no futuro (1-30 dias)
function getRandomFutureDate() {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
  return futureDate.toISOString();
}

// Iniciar simulação
runSimulation(); 