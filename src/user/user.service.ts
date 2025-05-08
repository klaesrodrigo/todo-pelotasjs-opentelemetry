import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { metrics } from '@opentelemetry/api';

@Injectable()
export class UserService {
  private userActivityCounter;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    // Inicialização do contador de métricas
    const meter = metrics.getMeter('user-activity', '0.1.0');
    this.userActivityCounter = meter.createCounter('user_activity_count', {
      description: 'Contador de atividades por usuário',
    });
  }

  create(createUserDto: CreateUserDto) {
    return this.userRepository.save(createUserDto);
  }

  findAll() {
    return this.userRepository.find({
      relations: ['tasks'],
    });
  }

  async findOne(id: number) {
    // Incrementar contador de atividade para este usuário
    this.userActivityCounter.add(1, { userId: id.toString() });
    
    return this.userRepository.findOne({
      where: { id },
      relations: ['tasks'],
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }

  // Método para obter estatísticas de usuários
  async getUsersStats() {
    const users = await this.userRepository.find({
      relations: ['tasks'],
    });

    const totalUsers = users.length;
    const usersWithTasks = users.filter(user => user.tasks.length > 0).length;
    const totalTasks = users.reduce((sum, user) => sum + user.tasks.length, 0);
    const averageTasksPerUser = totalUsers > 0 ? totalTasks / totalUsers : 0;
    
    const userTaskCounts = users.map(user => ({
      userId: user.id,
      name: user.name,
      taskCount: user.tasks.length
    }));

    return {
      totalUsers,
      usersWithTasks,
      totalTasks,
      averageTasksPerUser,
      userTaskCounts
    };
  }
}
