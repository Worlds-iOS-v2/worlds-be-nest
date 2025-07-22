import { Controller } from '@nestjs/common';
import { AzureStorageService } from './azure-storage.service';

@Controller('azure-storage')
export class AzureStorageController {
  constructor(private readonly azureStorageService: AzureStorageService) {}
}
