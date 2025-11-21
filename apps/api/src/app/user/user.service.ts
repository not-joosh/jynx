import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Organization, OrganizationMember, OrganizationRole } from '@challenge/data';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
  ) {}

  async createUser(email: string, supabaseUserId: string): Promise<User> {
    const user = this.userRepository.create({
      email,
      id: supabaseUserId, // Use Supabase user ID as primary key
    });
    return this.userRepository.save(user);
  }

  async createUserWithOrganization(
    email: string, 
    supabaseUserId: string, 
    organizationName: string
  ): Promise<{ user: User; organization: Organization }> {
    // Create user
    const user = await this.createUser(email, supabaseUserId);
    
    // Create organization
    const organization = this.organizationRepository.create({
      name: organizationName,
      ownerId: user.id,
    });
    const savedOrg = await this.organizationRepository.save(organization);
    
    // Add user as admin member
    const membership = this.memberRepository.create({
      userId: user.id,
      organizationId: savedOrg.id,
      role: OrganizationRole.ADMIN,
    });
    await this.memberRepository.save(membership);
    
    return { user, organization: savedOrg };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}
