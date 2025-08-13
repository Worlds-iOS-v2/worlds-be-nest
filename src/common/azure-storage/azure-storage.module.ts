// src/common/azure-storage/azure-storage.module.ts
import { Module } from '@nestjs/common';
import { AzureStorageService } from './azure-storage.service';

@Module({
  providers: [AzureStorageService],
  exports: [AzureStorageService],
})
export class AzureStorageModule {}