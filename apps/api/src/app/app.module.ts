import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { backendConfig } from '@challenge/data/backend';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { InvitationModule } from './invitations/invitation.module';
import { WorkspaceModule } from './workspaces/workspace.module';
import { MembersModule } from './members/members.module';
import { TaskModule } from './tasks/task.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env', '../../.env'],
    }),
    // TypeORM disabled since we're using Supabase directly
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: backendConfig.database.host,
    //   port: backendConfig.database.port,
    //   username: backendConfig.database.username,
    //   password: backendConfig.database.password,
    //   database: backendConfig.database.database,
    //   autoLoadEntities: true,
    //   synchronize: process.env.NODE_ENV !== 'production', // Only in development
    // }),
    AuthModule,
    InvitationModule,
    WorkspaceModule,
    TaskModule,
    MembersModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
