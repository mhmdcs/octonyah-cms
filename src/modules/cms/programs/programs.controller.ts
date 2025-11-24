/**
 * Programs Controller
 * 
 * This file defines the HTTP endpoints (routes) for program management.
 * Controllers in NestJS handle incoming HTTP requests and return responses.
 * 
 * This controller provides RESTful API endpoints for CRUD operations:
 * - POST   /cms/programs      - Create a new program
 * - GET    /cms/programs      - Get all programs
 * - GET    /cms/programs/:id  - Get a specific program by ID
 * - PATCH  /cms/programs/:id  - Update a program
 * - DELETE /cms/programs/:id  - Delete a program
 * 
 * The controller delegates business logic to ProgramsService and handles
 * HTTP-specific concerns like status codes and request/response formatting.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

/**
 * Controller class for program HTTP endpoints.
 * All routes are prefixed with 'cms/programs'.
 */
@Controller('cms/programs')
export class ProgramsController {
  /**
   * Constructor injects ProgramsService to handle business logic.
   */
  constructor(private readonly programsService: ProgramsService) {}

  /**
   * POST /cms/programs
   * 
   * Creates a new program.
   * Request body is automatically validated against CreateProgramDto.
   * Returns HTTP 201 (Created) status code.
   * 
   * @param createProgramDto - Validated program data from request body
   * @returns The newly created program
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  /**
   * GET /cms/programs
   * 
   * Retrieves all programs.
   * Returns HTTP 200 (OK) with array of programs.
   * 
   * @returns Array of all programs, ordered by publication date (newest first)
   */
  @Get()
  findAll() {
    return this.programsService.findAll();
  }

  /**
   * GET /cms/programs/:id
   * 
   * Retrieves a specific program by its ID.
   * Returns HTTP 200 (OK) if found, or HTTP 404 (Not Found) if not found.
   * 
   * @param id - UUID of the program to retrieve (from URL parameter)
   * @returns The program entity
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findOne(id);
  }

  /**
   * PATCH /cms/programs/:id
   * 
   * Updates an existing program with partial data.
   * Request body is automatically validated against UpdateProgramDto.
   * Only provided fields will be updated (partial update).
   * Returns HTTP 200 (OK) with updated program, or HTTP 404 if not found.
   * 
   * @param id - UUID of the program to update (from URL parameter)
   * @param updateProgramDto - Partial program data from request body
   * @returns The updated program
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProgramDto: UpdateProgramDto) {
    return this.programsService.update(id, updateProgramDto);
  }

  /**
   * DELETE /cms/programs/:id
   * 
   * Deletes a program from the database.
   * Returns HTTP 204 (No Content) on success, or HTTP 404 if not found.
   * 
   * @param id - UUID of the program to delete (from URL parameter)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.programsService.remove(id);
  }
}

