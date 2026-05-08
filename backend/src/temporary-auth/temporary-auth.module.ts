import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';
import { CredentialsModule } from '../credential/credentials.module';
import { RegisteredDevice } from '../sync/registered-device.entity';
import { TemporaryAuthAudit } from './temporary-auth-audit.entity';
import { TemporaryAuthController } from './temporary-auth.controller';
import { TemporaryAuthService } from './temporary-auth.service';
import { TemporaryAuthSession } from './temporary-auth-session.entity';
import { TemporaryCredentialRequest } from './temporary-credential-request.entity';
import { TemporaryJwtAuthGuard } from './temporary-jwt-auth.guard';
import { TemporaryJwtStrategy } from './temporary-jwt.strategy';

@Module({
  imports: [
    PassportModule,
    AuthModule,
    TypeOrmModule.forFeature([
      TemporaryAuthSession,
      TemporaryCredentialRequest,
      TemporaryAuthAudit,
      RegisteredDevice,
    ]),
    CredentialsModule,
  ],
  controllers: [TemporaryAuthController],
  providers: [TemporaryAuthService, TemporaryJwtStrategy, TemporaryJwtAuthGuard],
})
export class TemporaryAuthModule {}
