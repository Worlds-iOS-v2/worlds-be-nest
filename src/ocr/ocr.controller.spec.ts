import { Test, TestingModule } from '@nestjs/testing';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';

describe('OcrController', () => {
  let controller: OcrController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcrController],
      providers: [OcrService],
    }).compile();

    controller = module.get<OcrController>(OcrController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
