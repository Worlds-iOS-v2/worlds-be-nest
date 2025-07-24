import { Injectable } from '@nestjs/common';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Injectable()
export class AzureStorageService {
  private containerName = 'images';
  private blobServiceClient: BlobServiceClient;

  constructor() {
    const account = process.env.AZURE_STORAGE_ACCOUNT!;
    const key = process.env.AZURE_STORAGE_ACCESS_KEY!;

    const credential = new StorageSharedKeyCredential(account, key);
    this.blobServiceClient = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      credential,
    );
  }

  async upload(buffer: Buffer, originalName: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const ext = path.extname(originalName);
    const blobName = `${uuid()}${ext}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: 'image/jpeg' },
    });

    return blockBlobClient.url;
  }
}