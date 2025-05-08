const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const SIMULATION_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos
const USERS = [1, 2, 3]; // IDs dos usuários existentes

// Simulação de uso intensivo
async function runSimulation() {
  console.log('Iniciando simulação para gerar dados de métricas');
  console.log(`A simulação vai durar ${SIMULATION_DURATION / 1000 / 60} minutos`);
  
  // Simular visualizações de usuário (para gerar métricas de atividade)
  const userSimInterval = setInterval(async () => {
    try {
      // Escolher um usuário aleatório
      const userId = USERS[Math.floor(Math.random() * USERS.length)];
      console.log(`Simulando visualização do usuário ${userId}`);
      await axios.get(`${BASE_URL}/users/${userId}`);
    } catch (err) {
      console.error('Erro na simulação de visualização de usuário:', err.message);
    }
  }, 3000); // a cada 3 segundos
  
  // Simular criação de tarefas
  const taskCreateInterval = setInterval(async () => {
    try {
      // Escolher um usuário aleatório
      const userId = USERS[Math.floor(Math.random() * USERS.length)];
      const taskTitle = `Tarefa simulada ${Date.now()}`;
      
      console.log(`Criando tarefa "${taskTitle}" para o usuário ${userId}`);
      await axios.post(`${BASE_URL}/tasks`, {
        title: taskTitle,
        description: `Descrição gerada para a tarefa ${taskTitle}`,
        userId,
        due_date: getRandomFutureDate()
      });
    } catch (err) {
      console.error('Erro na criação de tarefa:', err.message);
    }
  }, 10000); // a cada 10 segundos
  
  // Simular atualização de status
  const statusUpdateInterval = setInterval(async () => {
    try {
      // Buscar tarefas existentes
      const response = await axios.get(`${BASE_URL}/tasks`);
      const tasks = response.data;
      
      if (tasks.length > 0) {
        // Escolher tarefa aleatória
        const randomTaskIndex = Math.floor(Math.random() * tasks.length);
        const taskToUpdate = tasks[randomTaskIndex];
        
        // Definir próximo status
        let newStatus;
        switch (taskToUpdate.status) {
          case 'OPEN':
            newStatus = 'IN_PROGRESS';
            break;
          case 'IN_PROGRESS':
            newStatus = 'DONE';
            break;
          case 'DONE':
            // Já está feita, vamos arquivar
            console.log(`Arquivando tarefa ${taskToUpdate.id}`);
            await axios.patch(`${BASE_URL}/tasks/${taskToUpdate.id}/archive`);
            return;
          default:
            newStatus = 'OPEN';
        }
        
        console.log(`Atualizando tarefa ${taskToUpdate.id} para status ${newStatus}`);
        await axios.patch(`${BASE_URL}/tasks/${taskToUpdate.id}`, {
          status: newStatus
        });
      }
    } catch (err) {
      console.error('Erro na atualização de status:', err.message);
    }
  }, 15000); // a cada 15 segundos
  
  // Visualização de estatísticas
  const statsInterval = setInterval(async () => {
    try {
      console.log('Consultando estatísticas...');
      await axios.get(`${BASE_URL}/tasks/stats`);
      await axios.get(`${BASE_URL}/users/stats`);
    } catch (err) {
      console.error('Erro na consulta de estatísticas:', err.message);
    }
  }, 5000); // a cada 5 segundos
  
  // Encerrar simulação após o tempo definido
  setTimeout(() => {
    clearInterval(userSimInterval);
    clearInterval(taskCreateInterval);
    clearInterval(statusUpdateInterval);
    clearInterval(statsInterval);
    
    console.log('Simulação finalizada com sucesso!');
    console.log('As métricas geradas devem estar visíveis no Grafana');
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