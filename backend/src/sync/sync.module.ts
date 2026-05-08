import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RegisteredDevice } from './registered-device.entity';
import { SyncEvent } from './sync-event.entity';
import { SyncItemState } from './sync-item-state.entity';
import { SyncService } from './sync.service';
import { DevicesController } from './devices.controller';
import { SyncEventsController } from './sync-events.controller';
import { SyncGateway } from './sync.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegisteredDevice, SyncEvent, SyncItemState]),
    AuthModule,
  ],
  controllers: [DevicesController, SyncEventsController],
  providers: [SyncService, SyncGateway],
  exports: [SyncService],
})
export class SyncModule {}
