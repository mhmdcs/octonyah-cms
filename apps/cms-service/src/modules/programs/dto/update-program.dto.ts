import { PartialType } from '@nestjs/mapped-types';
import { CreateProgramDto } from './create-program.dto';

// Extends PartialType to make all fields optional and inherits validation rules from CreateProgramDto
export class UpdateProgramDto extends PartialType(CreateProgramDto) {}

