import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { RunnableSequence } from '@langchain/core/runnables';

export const VERSION = process.env.API_VERSION;
export const CHATS : Array<{chat: string, rag: RunnableSequence<any, string>}> = []

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true
  }))
  app.enableCors({
    origin: "*",
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', "x-requested-with"],
    credentials: true,
  })
  app.use(helmet())
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
