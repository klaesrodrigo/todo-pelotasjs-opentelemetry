import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { startInstrumentation } from './metrics/instrumentation';

async function bootstrap() {
  startInstrumentation();
  
  // Adicionando um pequeno atraso para garantir que o MySQL esteja pronto
  console.log('Aguardando o MySQL iniciar...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
  console.log(`Aplicação rodando em: http://localhost:3000`);
}
bootstrap();
