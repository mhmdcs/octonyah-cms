import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ProgramsModule } from './modules/programs/programs.module';
import { Program } from '@octonyah/shared-programs';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from '@octonyah/shared-config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot({ entities: [Program] }),
    ProgramsModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
