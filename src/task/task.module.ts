import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TaskRepository } from './task.repository';

@Module({
  controllers: [TaskController],
  providers: [TaskService, TaskRepository],
})
export class TaskModule {}
