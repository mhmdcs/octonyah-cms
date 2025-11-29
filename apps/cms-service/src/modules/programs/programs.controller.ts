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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';


@ApiTags('CMS Programs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cms/programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @Roles('admin', 'editor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new program' })
  @ApiBody({ type: CreateProgramDto })
  @ApiResponse({ status: 201, description: 'Program successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  @Get()
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Get all programs' })
  @ApiResponse({ status: 200, description: 'List of all programs' })
  findAll() {
    return this.programsService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Get a program by ID' })
  @ApiParam({ name: 'id', description: 'Program UUID' })
  @ApiResponse({ status: 200, description: 'Program found' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  findOne(@Param('id') id: string) {
    return this.programsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Update a program' })
  @ApiParam({ name: 'id', description: 'Program UUID' })
  @ApiBody({ type: UpdateProgramDto })
  @ApiResponse({ status: 200, description: 'Program successfully updated' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  update(@Param('id') id: string, @Body() updateProgramDto: UpdateProgramDto) {
    return this.programsService.update(id, updateProgramDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a program' })
  @ApiParam({ name: 'id', description: 'Program UUID' })
  @ApiResponse({ status: 204, description: 'Program successfully deleted' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  remove(@Param('id') id: string) {
    return this.programsService.remove(id);
  }
}

