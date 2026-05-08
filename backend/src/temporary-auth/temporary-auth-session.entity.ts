import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { TemporaryAuthSessionStatus, TemporaryAuthContextType } from './temporary-auth.enums';
import { TemporaryCredentialRequest } from './temporary-credential-request.entity';

/** Permissions bitmask / JSON — never grants full vault sync; single-credential delivery only. */
export interface TemporarySessionPermissions {
  allowAutofill?: boolean;
  allowCopy?: boolean;
  allowReveal?: boolean;
  /** If true, each sensitive delivery needs an explicit approve from primary device. */
  requireBiometricPerSensitiveRequest?: boolean;
  /** Optional cap on approved credential payloads (not vault rows). */
  maxDeliveries?: number;
}

@Entity({ name: 'temporary_auth_sessions' })
@Index(['userId'])
@Index(['status'])
export class TemporaryAuthSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  /** Registered device id (UUID row in registered_devices) that approved this session. */
  @Column({ name: 'approved_by_device_id', type: 'uuid', nullable: true })
  approvedByDeviceId!: string | null;

  @Column({ name: 'requesting_device_name', type: 'varchar' })
  requestingDeviceName!: string;

  @Column({
    name: 'context_type',
    type: 'enum',
    enum: TemporaryAuthContextType,
  })
  contextType!: TemporaryAuthContextType;

  /** Normalized origin host or full origin string for matching (e.g. https://accounts.google.com). */
  @Column({ name: 'allowed_origin', type: 'varchar' })
  allowedOrigin!: string;

  @Column({ type: 'jsonb', default: {} })
  permissions!: TemporarySessionPermissions;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({
    type: 'enum',
    enum: TemporaryAuthSessionStatus,
    default: TemporaryAuthSessionStatus.PENDING_PAIRING,
  })
  status!: TemporaryAuthSessionStatus;

  /** SHA-256 hex of pairing code + pepper; retained so the requesting client can poll with the same secret. */
  @Column({ name: 'pairing_code_hash', type: 'varchar', nullable: true })
  pairingCodeHash!: string | null;

  @Column({ name: 'pairing_expires_at', type: 'timestamptz', nullable: true })
  pairingExpiresAt!: Date | null;

  @Column({ name: 'delivery_count', type: 'int', default: 0 })
  deliveryCount!: number;

  @OneToMany(() => TemporaryCredentialRequest, (r) => r.session)
  credentialRequests!: TemporaryCredentialRequest[];
}
