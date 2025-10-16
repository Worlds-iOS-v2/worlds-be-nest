import { Module } from '@nestjs/common';
import { BedrockService } from './bedrock.service';
import { BedrockController } from './bedrock.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [BedrockController],
  providers: [BedrockService],
  exports: [BedrockService],
})
export class BedrockModule {}
