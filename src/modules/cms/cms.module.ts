import { Module } from '@nestjs/common';
import { ProgramsModule } from './programs/programs.module';

@Module({
  imports: [ProgramsModule],
  exports: [ProgramsModule],
})
export class CmsModule {}

