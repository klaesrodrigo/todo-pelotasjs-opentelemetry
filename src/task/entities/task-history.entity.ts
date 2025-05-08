import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './task.entity';
import { User } from '../../user/entities/user.entity';

export enum HistoryActionType {
  CREATED = 'CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  TRANSFERRED = 'TRANSFERRED',
  UPDATED = 'UPDATED',
  ARCHIVED = 'ARCHIVED',
}

@Entity()
export class TaskHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  task: Task;

  @Column()
  taskId: number;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column({ nullable: true })
  userId: number;

  @Column({
    type: 'enum',
    enum: HistoryActionType,
  })
  action: HistoryActionType;

  @Column({ type: 'json', nullable: true })
  changes: Record<string, any>;

  @Column({ nullable: true })
  previousOwnerId: number;

  @Column({ nullable: true })
  newOwnerId: number;

  @CreateDateColumn()
  createdAt: Date;
} 