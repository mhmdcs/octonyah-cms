import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/gif': 'gif', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm',
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('S3_ENDPOINT', 'http://localhost:9000'),
      region: this.configService.get<string>('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true, // Required for MinIO
    });
    this.bucket = this.configService.get<string>('S3_BUCKET', 'programs-media');
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      // Bucket doesn't exist, create it
      await this.s3Client.send(
        new CreateBucketCommand({
          Bucket: this.bucket,
        }),
      );
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'uploads'): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${ext}`;
    await this.putObject(key, file.buffer, file.mimetype);
    return this.buildPublicUrl(key);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.extractKey(fileUrl) }));
  }

  async getSignedUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(this.s3Client, new GetObjectCommand({ Bucket: this.bucket, Key: this.extractKey(fileUrl) }), { expiresIn });
  }

  private extractKey(fileUrl: string): string {
    return new URL(fileUrl).pathname.replace(`/${this.bucket}/`, '');
  }

  private buildPublicUrl(key: string): string {
    return `${this.configService.get<string>('S3_ENDPOINT', 'http://localhost:9000')}/${this.bucket}/${key}`;
  }

  private async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.s3Client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }

  async downloadAndUpload(sourceUrl: string, folder = 'thumbnails'): Promise<string> {
    try {
      this.logger.debug(`Downloading image from: ${sourceUrl}`);
      const { buffer, contentType } = await this.downloadFile(sourceUrl);
      const key = `${folder}/${uuidv4()}.${EXTENSION_MAP[contentType] || 'jpg'}`;
      await this.putObject(key, buffer, contentType);
      const url = this.buildPublicUrl(key);
      this.logger.debug(`Uploaded image to: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to download and upload image: ${error}`);
      throw error;
    }
  }

  async uploadBuffer(buffer: Buffer, contentType: string, folder = 'uploads'): Promise<string> {
    const key = `${folder}/${uuidv4()}.${EXTENSION_MAP[contentType] || 'bin'}`;
    await this.putObject(key, buffer, contentType);
    return this.buildPublicUrl(key);
  }

  private async downloadFile(url: string): Promise<{ buffer: Buffer; contentType: string }> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return { buffer: Buffer.from(await response.arrayBuffer()), contentType };
  }
}

