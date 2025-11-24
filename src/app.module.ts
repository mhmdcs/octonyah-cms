import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CmsModule } from './modules/cms/cms.module';
import { Program } from './modules/cms/programs/entities/program.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'thmanyah.db',
      entities: [Program],
      synchronize: true, // Only for development
    }),
    CmsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
