import { Optional } from '@nestjs/common';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from '../../task/entities/task.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  @Optional()
  avatar: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Task, task => task.user)
  tasks: Task[];
}
