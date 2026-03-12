import { DefaultAzureCredential } from "@azure/identity";
import {
    BlobServiceClient,
    StorageSharedKeyCredential,
} from "@azure/storage-blob";

const accountName = process.env["AZURE_STORAGE_ACCOUNT"]!;
const containerName = process.env["AZURE_STORAGE_CONTAINER"] ?? "user-files";

function createBlobServiceClient(): BlobServiceClient {
  // In production on Azure VM with Managed Identity
  if (process.env["NODE_ENV"] === "production") {
    return new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      new DefaultAzureCredential(),
    );
  }

  // Local dev with connection string
  const connectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"];
  if (connectionString) {
    return BlobServiceClient.fromConnectionString(connectionString);
  }

  // Fallback to account key
  const accountKey = process.env["AZURE_STORAGE_ACCOUNT_KEY"]!;
  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential,
  );
}

const blobServiceClient = createBlobServiceClient();
const containerClient = blobServiceClient.getContainerClient(containerName);

export async function uploadBlob(
  blobName: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
}

export async function downloadBlob(
  blobName: string,
): Promise<NodeJS.ReadableStream> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const response = await blockBlobClient.download(0);
  return response.readableStreamBody!;
}

export async function deleteBlob(blobName: string): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.delete();
}
