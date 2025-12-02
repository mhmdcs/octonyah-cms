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

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    // Return the public URL (MinIO uses path-style URLs)
    const endpoint = this.configService.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    return `${endpoint}/${this.bucket}/${fileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Extract the key from the URL
    const url = new URL(fileUrl);
    const key = url.pathname.replace(`/${this.bucket}/`, '');

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    const url = new URL(fileUrl);
    const key = url.pathname.replace(`/${this.bucket}/`, '');

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Downloads an image from a URL and uploads it to storage.
   * Useful for importing thumbnails from external platforms like YouTube.
   *
   * @param sourceUrl - URL of the image to download
   * @param folder - Folder/prefix in storage (default: 'thumbnails')
   * @returns URL of the uploaded file in our storage
   */
  async downloadAndUpload(
    sourceUrl: string,
    folder: string = 'thumbnails',
  ): Promise<string> {
    try {
      this.logger.debug(`Downloading image from: ${sourceUrl}`);

      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download image: ${response.status} ${response.statusText}`,
        );
      }

      // Get content type from response or default to jpeg
      const contentType =
        response.headers.get('content-type') || 'image/jpeg';

      const extension = EXTENSION_MAP[contentType] || 'jpg';

      // Generate unique filename
      const fileName = `${folder}/${uuidv4()}.${extension}`;

      // Read the image as buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to S3/MinIO
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: fileName,
          Body: buffer,
          ContentType: contentType,
        }),
      );

      // Return the public URL
      const endpoint = this.configService.get<string>(
        'S3_ENDPOINT',
        'http://localhost:9000',
      );
      const uploadedUrl = `${endpoint}/${this.bucket}/${fileName}`;

      this.logger.debug(`Uploaded image to: ${uploadedUrl}`);
      return uploadedUrl;
    } catch (error) {
      this.logger.error(`Failed to download and upload image: ${error}`);
      throw error;
    }
  }

  /**
   * Uploads a buffer directly to storage.
   * Useful when you already have the file content in memory.
   *
   * @param buffer - File content as Buffer
   * @param contentType - MIME type of the file
   * @param folder - Folder/prefix in storage
   * @returns URL of the uploaded file
   */
  async uploadBuffer(
    buffer: Buffer,
    contentType: string,
    folder: string = 'uploads',
  ): Promise<string> {
    const extension = EXTENSION_MAP[contentType] || 'bin';
    const fileName = `${folder}/${uuidv4()}.${extension}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    const endpoint = this.configService.get<string>(
      'S3_ENDPOINT',
      'http://localhost:9000',
    );
    return `${endpoint}/${this.bucket}/${fileName}`;
  }
}

