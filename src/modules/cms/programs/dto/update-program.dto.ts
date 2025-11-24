/**
 * Update Program DTO (Data Transfer Object)
 * 
 * This file defines the data structure for updating an existing program.
 * 
 * It extends CreateProgramDto using PartialType, which makes all fields optional.
 * This allows clients to send only the fields they want to update, rather than
 * requiring all fields to be present (as in the create operation).
 * 
 * The validation rules from CreateProgramDto are inherited, but all fields
 * become optional, allowing partial updates.
 * 
 * This DTO is used when clients send PATCH requests to update programs.
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateProgramDto } from './create-program.dto';

/**
 * DTO for updating an existing program.
 * All fields are optional - only provided fields will be updated.
 * Inherits validation rules from CreateProgramDto.
 */
export class UpdateProgramDto extends PartialType(CreateProgramDto) {}

