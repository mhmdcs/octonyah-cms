import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { VideosModule } from './modules/videos/videos.module';
import { Video } from '@octonyah/shared-videos';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from '@octonyah/shared-config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot({ entities: [Video] }),
    VideosModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
