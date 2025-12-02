import { PartialType } from '@nestjs/mapped-types';
import { CreateVideoDto } from './create-video.dto';

// Extends PartialType to make all fields optional and inherits validation rules from CreateVideoDto
export class UpdateVideoDto extends PartialType(CreateVideoDto) {}

