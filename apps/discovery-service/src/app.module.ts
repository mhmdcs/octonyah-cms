import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Video } from '@octonyah/shared-videos';
import { AppController } from './app.controller';
import { DiscoveryModule } from './modules/discovery.module';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '@octonyah/shared-config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot({ entities: [Video] }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
          password: config.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    DiscoveryModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
