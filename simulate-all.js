const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const SIMULATION_DURATION = 10 * 60 * 1000; // 10 minutos em milissegundos
const USERS = [1, 2, 3]; // IDs dos usuários existentes

// Simulação completa do sistema
async function runCompleteSimulation() {
  console.log('=== SIMULAÇÃO COMPLETA DO SISTEMA DE TAREFAS ===');
  console.log(`A simulação vai durar ${SIMULATION_DURATION / 1000 / 60} minutos`);
  console.log('Gerando dados para todos os dashboards e métricas.');
  
  // Criar usuários se não existirem
  try {
    console.log('\n--- Verificando usuários ---');
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    
    if (usersResponse.data.length === 0) {
      console.log('Criando usuários iniciais...');
      
      await axios.post(`${BASE_URL}/users`, { name: 'Maria Silva', email: 'maria@example.com' });
      await axios.post(`${BASE_URL}/users`, { name: 'João Oliveira', email: 'joao@example.com' });
      await axios.post(`${BASE_URL}/users`, { name: 'Ana Santos', email: 'ana@example.com' });
      
      console.log('Usuários criados com sucesso!');
    } else {
      console.log(`${usersResponse.data.length} usuários encontrados no sistema.`);
    }
  } catch (err) {
    console.error('Erro ao verificar/criar usuários:', err.message);
  }

  // === SIMULAÇÕES PERIÓDICAS ===
  
  // 1. Visualizações de usuário (para gerar métricas de atividade)
  const userSimInterval = setInterval(async () => {
    try {
      const userId = USERS[Math.floor(Math.random() * USERS.length)];
      console.log(`⚪ Simulando visualização do usuário ${userId}`);
      await axios.get(`${BASE_URL}/users/${userId}`);
    } catch (err) {
      console.error('❌ Erro na simulação de visualização de usuário:', err.message);
    }
  }, 4000); // a cada 4 segundos
  
  // 2. Criação de tarefas
  const taskCreateInterval = setInterval(async () => {
    try {
      const userId = USERS[Math.floor(Math.random() * USERS.length)];
      const taskTitle = `Tarefa ${Date.now().toString().slice(-6)}`;
      
      console.log(`🆕 Criando tarefa "${taskTitle}" para o usuário ${userId}`);
      await axios.post(`${BASE_URL}/tasks`, {
        title: taskTitle,
        description: `Descrição gerada automaticamente para ${taskTitle}`,
        userId,
        due_date: getRandomFutureDate()
      });
    } catch (err) {
      console.error('❌ Erro na criação de tarefa:', err.message);
    }
  }, 12000); // a cada 12 segundos
  
  // 3. Atualização de status
  const statusUpdateInterval = setInterval(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/tasks`);
      const tasks = response.data;
      
      if (tasks.length > 0) {
        // Escolher tarefas não arquivadas
        const availableTasks = tasks.filter(task => !task.is_archived);
        
        if (availableTasks.length > 0) {
          const randomTaskIndex = Math.floor(Math.random() * availableTasks.length);
          const taskToUpdate = availableTasks[randomTaskIndex];
          
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
              console.log(`📦 Arquivando tarefa ${taskToUpdate.id}`);
              await axios.patch(`${BASE_URL}/tasks/${taskToUpdate.id}/archive`);
              return;
            default:
              newStatus = 'OPEN';
          }
          
          console.log(`🔄 Atualizando status da tarefa ${taskToUpdate.id}: ${taskToUpdate.status} → ${newStatus}`);
          await axios.patch(`${BASE_URL}/tasks/${taskToUpdate.id}`, {
            status: newStatus
          });
        }
      }
    } catch (err) {
      console.error('❌ Erro na atualização de status:', err.message);
    }
  }, 8000); // a cada 8 segundos
  
  // 4. Transferências de tarefas
  const transferInterval = setInterval(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/tasks`);
      const tasks = response.data;
      
      if (tasks.length > 0) {
        // Escolher tarefa não arquivada
        const availableTasks = tasks.filter(task => !task.is_archived);
        
        if (availableTasks.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableTasks.length);
          const taskToTransfer = availableTasks[randomIndex];
          
          // Escolher um usuário diferente do atual
          let newUserId;
          do {
            newUserId = USERS[Math.floor(Math.random() * USERS.length)];
          } while (newUserId === taskToTransfer.userId);
          
          console.log(`↪️ Transferindo tarefa ${taskToTransfer.id} do usuário ${taskToTransfer.userId} para ${newUserId}`);
          
          await axios.patch(`${BASE_URL}/tasks/${taskToTransfer.id}/transfer`, {
            newUserId,
            message: `Transferência automática para demonstração`
          });
          
          // Verificar o histórico após a transferência (ocasionalmente)
          if (Math.random() > 0.7) {
            console.log(`📜 Verificando histórico da tarefa ${taskToTransfer.id}`);
            const historyResponse = await axios.get(`${BASE_URL}/tasks/${taskToTransfer.id}/history`);
            console.log(`   → ${historyResponse.data.length} registros no histórico`);
          }
        }
      }
    } catch (err) {
      console.error('❌ Erro na transferência de tarefa:', err.message);
    }
  }, 15000); // a cada 15 segundos
  
  // 5. Consulta de estatísticas
  const statsInterval = setInterval(async () => {
    try {
      console.log('📊 Consultando estatísticas do sistema...');
      await axios.get(`${BASE_URL}/tasks/stats`);
      await axios.get(`${BASE_URL}/users/stats`);
    } catch (err) {
      console.error('❌ Erro na consulta de estatísticas:', err.message);
    }
  }, 5000); // a cada 5 segundos
  
  // 6. Atualizações de tarefas (sem mudança de status)
  const taskUpdateInterval = setInterval(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/tasks`);
      const tasks = response.data;
      
      if (tasks.length > 0) {
        // Escolher tarefa não arquivada e não concluída
        const availableTasks = tasks.filter(task => !task.is_archived && task.status !== 'DONE');
        
        if (availableTasks.length > 0) {
          const randomTaskIndex = Math.floor(Math.random() * availableTasks.length);
          const taskToUpdate = availableTasks[randomTaskIndex];
          
          console.log(`✏️ Atualizando descrição da tarefa ${taskToUpdate.id}`);
          await axios.patch(`${BASE_URL}/tasks/${taskToUpdate.id}`, {
            description: `Descrição atualizada em ${new Date().toLocaleTimeString()}`
          });
        }
      }
    } catch (err) {
      console.error('❌ Erro na atualização de tarefa:', err.message);
    }
  }, 18000); // a cada 18 segundos
  
  // Encerrar simulação após o tempo definido
  setTimeout(() => {
    clearInterval(userSimInterval);
    clearInterval(taskCreateInterval);
    clearInterval(statusUpdateInterval);
    clearInterval(transferInterval);
    clearInterval(statsInterval);
    clearInterval(taskUpdateInterval);
    
    console.log('\n=== SIMULAÇÃO COMPLETA FINALIZADA ===');
    console.log('Todas as métricas foram geradas com sucesso.');
    console.log('Os dashboards no Grafana devem estar exibindo os dados simulados.');
  }, SIMULATION_DURATION);
}

// Gerar data aleatória no futuro (1-30 dias)
function getRandomFutureDate() {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
  return futureDate.toISOString();
}

// Iniciar simulação completa
runCompleteSimulation(); 