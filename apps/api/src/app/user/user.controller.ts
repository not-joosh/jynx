import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, CreateUserWithOrgDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto.email, createUserDto.supabaseUserId);
  }

  @Post('with-organization')
  async createUserWithOrganization(@Body() createUserWithOrgDto: CreateUserWithOrgDto) {
    return this.userService.createUserWithOrganization(
      createUserWithOrgDto.email,
      createUserWithOrgDto.supabaseUserId,
      createUserWithOrgDto.organizationName
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }
}
