import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { backendConfig } from '@challenge/data/backend';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env', '../../.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: backendConfig.database.host,
      port: backendConfig.database.port,
      username: backendConfig.database.username,
      password: backendConfig.database.password,
      database: backendConfig.database.database,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production', // Only in development
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
