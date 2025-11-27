import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Program } from '@octonyah/shared-programs';
import { AppController } from './app.controller';
import { DiscoveryModule } from './modules/discovery.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: (config.get<string>('DB_TYPE') || 'postgres') as 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'octonyah'),
        entities: [Program],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    DiscoveryModule,
  ],
  controllers: [AppController],
})
export class AppModule {}


