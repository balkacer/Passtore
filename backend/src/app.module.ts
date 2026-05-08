import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/users.module';
import { CredentialsModule } from './credential/credentials.module';
import { User } from './user/user.entity';
import { Credential } from './credential/credential.entity';
import { PasskeyCredential } from './passkey/passkey-credential.entity';
import { PasskeyModule } from './passkey/passkey.module';
import { RegisteredDevice } from './sync/registered-device.entity';
import { SyncEvent } from './sync/sync-event.entity';
import { SyncItemState } from './sync/sync-item-state.entity';
import { SyncModule } from './sync/sync.module';
import { TemporaryAuthModule } from './temporary-auth/temporary-auth.module';
import { TemporaryAuthSession } from './temporary-auth/temporary-auth-session.entity';
import { TemporaryCredentialRequest } from './temporary-auth/temporary-credential-request.entity';
import { TemporaryAuthAudit } from './temporary-auth/temporary-auth-audit.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: parseInt(config.get('DATABASE_PORT', '5432'), 10),
        username: config.get('DATABASE_USER', 'passtore'),
        password: config.get('DATABASE_PASSWORD', 'passtore'),
        database: config.get('DATABASE_NAME', 'passtore'),
        entities: [
          User,
          Credential,
          PasskeyCredential,
          RegisteredDevice,
          SyncEvent,
          SyncItemState,
          TemporaryAuthSession,
          TemporaryCredentialRequest,
          TemporaryAuthAudit,
        ],
        synchronize:
          config.get('NODE_ENV') !== 'production' ||
          config.get('DATABASE_SYNC') === 'true',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    UsersModule,
    AuthModule,
    CredentialsModule,
    PasskeyModule,
    SyncModule,
    TemporaryAuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
