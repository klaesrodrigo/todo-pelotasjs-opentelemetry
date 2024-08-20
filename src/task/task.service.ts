import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskRepository } from './task.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
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
    return this.taskRepository.find();
  }

  findOne(id: number) {
    return this.taskRepository.findOneBy({ id });
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
