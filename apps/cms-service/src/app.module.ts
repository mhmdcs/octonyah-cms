import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { VideosModule } from './modules/videos/videos.module';
import { Video } from '@octonyah/shared-videos';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from '@octonyah/shared-config';
import { HealthModule } from './health/health.module';
import { ThrottlerRedisModule } from '@octonyah/shared-throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot({ entities: [Video] }),
    ThrottlerRedisModule.forRoot({ serviceType: 'cms' }),
    VideosModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
