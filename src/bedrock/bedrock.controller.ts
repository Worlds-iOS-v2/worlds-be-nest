import { Controller } from '@nestjs/common';
import { BedrockService } from './bedrock.service';

@Controller('bedrock')
export class BedrockController {
  constructor(private readonly bedrockService: BedrockService) {}
}
