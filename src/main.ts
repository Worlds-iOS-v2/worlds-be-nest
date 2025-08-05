import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/interceptor/http-exception.filter';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true  }),
  );

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Worlds API')
    .setDescription('World Study API 명세서')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('questions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Azure App Service 포트 설정
  const port = process.env.PORT || 3000;
  console.log(`Server starting on port: ${port}`);
  
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger API docs: http://localhost:${port}/api`);
}
bootstrap();
