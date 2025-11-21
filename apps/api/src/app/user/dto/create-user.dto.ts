export class CreateUserDto {
  email: string;
  supabaseUserId: string;
}

export class CreateUserWithOrgDto extends CreateUserDto {
  organizationName: string;
}
