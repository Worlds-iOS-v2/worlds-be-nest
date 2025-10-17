import { Test, TestingModule } from '@nestjs/testing';
import { BedrockController } from './bedrock.controller';
import { BedrockService } from './bedrock.service';

describe('BedrockController', () => {
  let controller: BedrockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BedrockController],
      providers: [BedrockService],
    }).compile();

    controller = module.get<BedrockController>(BedrockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
