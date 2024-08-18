import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { startInstrumentation } from './metrics/instrumentation';

async function bootstrap() {
  startInstrumentation();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
