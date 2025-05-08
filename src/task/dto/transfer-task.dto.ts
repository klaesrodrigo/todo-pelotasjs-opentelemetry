import { IsNotEmpty, IsNumber } from 'class-validator';

export class TransferTaskDto {
  @IsNotEmpty()
  @IsNumber()
  newUserId: number;
  
  message?: string;
} 