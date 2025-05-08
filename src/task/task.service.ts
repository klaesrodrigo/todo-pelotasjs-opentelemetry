import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskRepository } from './task.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { metrics, trace } from '@opentelemetry/api';
import { Repository } from 'typeorm';
import { TaskHistory, HistoryActionType } from './entities/task-history.entity';
import { TransferTaskDto } from './dto/transfer-task.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class TaskService {
  private tracer;
  private statusCounter;
  private taskDurationHistogram;
  private transferCounter;
  
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: TaskRepository,
    
    @InjectRepository(TaskHistory)
    private readonly taskHistoryRepository: Repository<TaskHistory>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.tracer = trace.getTracer('get-task');
    
    // Inicialização das métricas
    const meter = metrics.getMeter('task-metrics', '0.1.0');
    
    // Contador para tarefas por status
    this.statusCounter = meter.createCounter('task_status_count', {
      description: 'Contagem de tarefas por status',
    });
    
    // Histograma para duração das tarefas (tempo de vida)
    this.taskDurationHistogram = meter.createHistogram('task_duration_days', {
      description: 'Duração das tarefas em dias',
      unit: 'days',
    });
    
    // Contador para transferências de tarefas
    this.transferCounter = meter.createCounter('task_transfers_count', {
      description: 'Contagem de transferências de tarefas entre usuários',
    });
  }

  async create(createTaskDto: CreateTaskDto) {
    const task = await this.taskRepository.save(createTaskDto);
    
    // Incrementar contador para o status inicial
    this.statusCounter.add(1, { status: task.status });
    
    // Registrar no histórico
    await this.addTaskHistory(
      task.id,
      createTaskDto.userId,
      HistoryActionType.CREATED,
      { task: { ...createTaskDto } }
    );
    
    return task;
  }

  async findAll() {
    return this.taskRepository.find({
      relations: ['user'],
    });
  }

  findOne(id: number) {
    return this.taskRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId: number) {
    return this.taskRepository.find({
      where: { userId },
      relations: ['user'],
    });
  }
  
  async getTaskHistory(taskId: number) {
    const task = await this.taskRepository.findOneBy({ id: taskId });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }
    
    return this.taskHistoryRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStats() {
    const allTasks = await this.taskRepository.find();
    
    const totalTasks = allTasks.length;
    const openTasks = allTasks.filter(task => task.status === TaskStatus.OPEN).length;
    const inProgressTasks = allTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const doneTasks = allTasks.filter(task => task.status === TaskStatus.DONE).length;
    const archivedTasks = allTasks.filter(task => task.is_archived).length;
    
    // Calcular tarefas atrasadas (com data de vencimento no passado e não concluídas)
    const today = new Date();
    const overdueTasks = allTasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < today && 
      task.status !== TaskStatus.DONE
    ).length;
    
    // Calcular tarefas próximas do vencimento (7 dias)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    const nearDueTasks = allTasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) > today &&
      new Date(task.due_date) <= sevenDaysFromNow &&
      task.status !== TaskStatus.DONE
    ).length;
    
    // Idade média das tarefas em dias
    const taskAges = allTasks.map(task => {
      const createdDate = new Date(task.created_at);
      const diffTime = Math.abs(today.getTime() - createdDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Dias
    });
    
    const avgTaskAge = taskAges.reduce((sum, age) => sum + age, 0) / (taskAges.length || 1);
    
    // Calcular tarefas por usuário
    const tasksPerUser = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.userId')
      .getRawMany();
      
    // Buscar estatísticas de transferências
    const transferStats = await this.taskHistoryRepository
      .createQueryBuilder('history')
      .select('COUNT(*)', 'count')
      .where('history.action = :action', { action: HistoryActionType.TRANSFERRED })
      .getRawOne();
    
    return {
      totalTasks,
      openTasks,
      inProgressTasks,
      doneTasks,
      archivedTasks,
      overdueTasks,
      nearDueTasks,
      avgTaskAge,
      tasksPerUser,
      transfers: transferStats ? parseInt(transferStats.count) : 0
    };
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.tracer.startActiveSpan(
      `update-task: find ${id}`,
      async (span) => {
        const response = await this.taskRepository.findOneBy({ id });
        span.end();
        return response;
      },
    );

    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    
    // Se o status está sendo atualizado, registrar a mudança de status nas métricas
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      // Decrementar o contador do status antigo
      this.statusCounter.add(-1, { status: task.status });
      
      // Incrementar o contador do novo status
      this.statusCounter.add(1, { status: updateTaskDto.status });
      
      // Registrar mudança de status no histórico
      await this.addTaskHistory(
        id, 
        task.userId,
        HistoryActionType.STATUS_CHANGED,
        { 
          previousStatus: task.status,
          newStatus: updateTaskDto.status
        }
      );
      
      // Se status mudou para DONE, registrar a duração total da tarefa
      if (updateTaskDto.status === TaskStatus.DONE) {
        const createdDate = new Date(task.created_at);
        const completedDate = new Date();
        const durationDays = (completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        
        this.taskDurationHistogram.record(durationDays, { 
          userId: task.userId?.toString() || 'unknown'
        });
      }
    } else if (updateTaskDto.hasOwnProperty('title') || updateTaskDto.hasOwnProperty('description') || updateTaskDto.hasOwnProperty('due_date')) {
      // Registrar atualização geral no histórico
      await this.addTaskHistory(
        id,
        task.userId,
        HistoryActionType.UPDATED,
        {
          changes: { ...updateTaskDto }
        }
      );
    }

    return this.tracer.startActiveSpan(`update-task: ${id}`, async (span) => {
      const response = await this.taskRepository.update(id, updateTaskDto);
      span.end();
      return response;
    });
  }
  
  async transferTask(id: number, transferTaskDto: TransferTaskDto, currentUserId: number) {
    // Verificar se a tarefa existe
    const task = await this.taskRepository.findOneBy({ id });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    
    // Verificar se o usuário de destino existe
    const targetUser = await this.userRepository.findOneBy({ id: transferTaskDto.newUserId });
    if (!targetUser) {
      throw new NotFoundException(`Target user with id ${transferTaskDto.newUserId} not found`);
    }
    
    // Armazenar o ID do usuário anterior
    const previousUserId = task.userId;
    
    // Atualizar o usuário da tarefa
    await this.taskRepository.update(id, { userId: transferTaskDto.newUserId });
    
    // Incrementar o contador de transferências
    this.transferCounter.add(1, { 
      fromUserId: previousUserId.toString(),
      toUserId: transferTaskDto.newUserId.toString()
    });
    
    // Registrar no histórico
    await this.addTaskHistory(
      id,
      currentUserId,
      HistoryActionType.TRANSFERRED,
      {
        message: transferTaskDto.message || '',
        previousOwnerId: previousUserId,
        newOwnerId: transferTaskDto.newUserId
      },
      previousUserId,
      transferTaskDto.newUserId
    );
    
    return { success: true };
  }

  async archive(id: number) {
    const task = await this.taskRepository.findOneBy({ id });
    if (task) {
      // Registrar o arquivamento na métrica
      this.statusCounter.add(1, { status: 'ARCHIVED' });
      
      // Registrar no histórico
      await this.addTaskHistory(
        id,
        task.userId,
        HistoryActionType.ARCHIVED
      );
    }
    
    return this.taskRepository.update(id, { is_archived: true });
  }

  remove(id: number) {
    return this.taskRepository.delete(id);
  }
  
  // Método auxiliar para adicionar registros ao histórico
  private async addTaskHistory(
    taskId: number,
    userId: number,
    action: HistoryActionType,
    changes: Record<string, any> = null,
    previousOwnerId: number = null,
    newOwnerId: number = null
  ) {
    const historyEntry = this.taskHistoryRepository.create({
      taskId,
      userId,
      action,
      changes,
      previousOwnerId,
      newOwnerId
    });
    
    return this.taskHistoryRepository.save(historyEntry);
  }
}
