import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { metrics, trace } from '@opentelemetry/api';
import { Span } from '@opentelemetry/sdk-trace-node';

@Controller('tasks')
export class TaskController {
  private tracer;
  private meter;
  constructor(private readonly taskService: TaskService) {
    this.tracer = trace.getTracer('get-task');
    this.meter = metrics.getMeter('TLC', '0.1.0');
  }

  @Post()
  @HttpCode(201)
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  async findAll() {
    const span = this.tracer.startSpan('get-tasks');
    const response = await this.taskService.findAll();
    span.end();
    return response;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return await this.tracer.startActiveSpan(
      'update-task',
      async (parentSpan: Span) => {
        const response = await this.taskService.update(+id, updateTaskDto);
        parentSpan.end();
        return response;
      },
    );
  }

  @Patch(':id/archive')
  @HttpCode(204)
  archive(@Param('id') id: string) {
    const counter = this.meter.createCounter('archive_task');
    counter.add(1);
    return this.taskService.archive(+id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.taskService.remove(+id);
  }
}
