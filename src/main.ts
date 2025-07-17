import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Worlds API')
    .setDescription('질문게시판 API 명세서')
    .setVersion('1.0')
    // .addBearerAuth()
    .addTag('questions') 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // http://localhost:3000/api

  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
