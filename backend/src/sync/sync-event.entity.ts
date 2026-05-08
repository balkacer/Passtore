import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { RegisteredDevice } from './registered-device.entity';

@Entity({ name: 'sync_events' })
@Index(['userId', 'createdAt', 'id'])
export class SyncEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  @ManyToOne(() => RegisteredDevice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device!: RegisteredDevice;

  /** Opaque label — matches client protocol (e.g. VAULT_ITEM_UPSERT). */
  @Column({ name: 'event_type' })
  eventType!: string;

  @Column({ name: 'base_revision', type: 'varchar', nullable: true })
  baseRevision!: string | null;

  /** Server never interprets payload — encrypted blob / JSON ciphertext. */
  @Column({ name: 'ciphertext_payload', type: 'text' })
  ciphertextPayload!: string;

  @Column({ name: 'content_hash', type: 'varchar', nullable: true })
  contentHash!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
