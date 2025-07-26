import { Test, TestingModule } from '@nestjs/testing';
import { AzureStorageController } from './azure-storage.controller';
import { AzureStorageService } from './azure-storage.service';

describe('AzureStorageController', () => {
  let controller: AzureStorageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AzureStorageController],
      providers: [AzureStorageService],
    }).compile();

    controller = module.get<AzureStorageController>(AzureStorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
