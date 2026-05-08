import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasskeyCredential } from './passkey-credential.entity';
import { PasskeyService } from './passkey.service';
import { PasskeyController } from './passkey.controller';
import { UsersModule } from '../user/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PasskeyCredential]),
    UsersModule,
    AuthModule,
  ],
  controllers: [PasskeyController],
  providers: [PasskeyService],
})
export class PasskeyModule {}
