import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';

@Injectable()
export class AzureStorageService {
  private containerClient: ContainerClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  private ensureClient(): ContainerClient {
    if (this.containerClient) {
      return this.containerClient;
    }

    const connectionString = this.configService.get(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    const containerName = this.configService.get(
      'AZURE_STORAGE_CONTAINER_NAME',
    );

    if (!connectionString || !containerName) {
      throw new Error('Azure Storage configuration missing: AZURE_STORAGE_CONNECTION_STRING and AZURE_STORAGE_CONTAINER_NAME are required');
    }

    console.log('Initializing Azure Storage client...');
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
    
    return this.containerClient;
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; fileName: string }> {
    const containerClient = this.ensureClient();
    const blobName = `${uuidv4()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
      },
    });

    return {
      url: blockBlobClient.url,
      fileName: file.originalname,
    };
  }

  async uploadFiles(
    files: Express.Multer.File[],
  ): Promise<{ url: string; fileName: string }[]> {
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        return this.uploadFile(file);
      }),
    );
    return uploadedFiles;
  }

  async deleteFile(blobUrl: string): Promise<void> {
    const containerClient = this.ensureClient();
    const blobName = new URL(blobUrl).pathname.split('/').pop();
    if (!blobName) {
      throw new Error('Invalid blob URL');
    }
    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.delete();
  }
}