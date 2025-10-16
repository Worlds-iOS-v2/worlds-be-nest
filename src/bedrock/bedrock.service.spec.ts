import { Test, TestingModule } from '@nestjs/testing';
import { BedrockService } from './bedrock.service';

describe('BedrockService', () => {
  let service: BedrockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BedrockService],
    }).compile();

    service = module.get<BedrockService>(BedrockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
