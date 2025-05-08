import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskRepository } from './task.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { trace } from '@opentelemetry/api';

@Injectable()
export class TaskService {
  private tracer;
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: TaskRepository,
  ) {
    this.tracer = trace.getTracer('get-task');
  }

  async create(createTaskDto: CreateTaskDto) {
    return this.taskRepository.save(createTaskDto);
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

  async getStats() {
    const allTasks = await this.taskRepository.find();
    
    const totalTasks = allTasks.length;
    const openTasks = allTasks.filter(task => task.status === TaskStatus.OPEN).length;
    const inProgressTasks = allTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const doneTasks = allTasks.filter(task => task.status === TaskStatus.DONE).length;
    const archivedTasks = allTasks.filter(task => task.is_archived).length;
    
    const tasksPerUser = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.userId')
      .getRawMany();
    
    return {
      totalTasks,
      openTasks,
      inProgressTasks,
      doneTasks,
      archivedTasks,
      tasksPerUser
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

    return this.tracer.startActiveSpan(`update-task: ${id}`, async (span) => {
      const response = await this.taskRepository.update(id, updateTaskDto);
      span.end();
      return response;
    });
  }

  archive(id: number) {
    return this.taskRepository.update(id, { is_archived: true });
  }

  remove(id: number) {
    return this.taskRepository.delete(id);
  }
}
