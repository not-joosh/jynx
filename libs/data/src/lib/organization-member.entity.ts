import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';

export enum OrganizationRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

@Entity('organization_members')
@Unique(['userId', 'organizationId'])
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER
  })
  role!: OrganizationRole;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  joinedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column()
  userId!: string;

  @ManyToOne('User', 'organizationMemberships')
  @JoinColumn({ name: 'userId' })
  user!: any;

  @Column()
  organizationId!: string;

  @ManyToOne('Organization', 'members')
  @JoinColumn({ name: 'organizationId' })
  organization!: any;
}
