import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TemporaryAuthSession } from './temporary-auth-session.entity';
import {
  TemporaryCredentialRequestPurpose,
  TemporaryCredentialRequestStatus,
} from './temporary-auth.enums';

@Entity({ name: 'temporary_credential_requests' })
@Index(['sessionId'])
@Index(['status'])
export class TemporaryCredentialRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @ManyToOne(() => TemporaryAuthSession, (s) => s.credentialRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session!: TemporaryAuthSession;

  @Column({ name: 'requested_origin', type: 'varchar' })
  requestedOrigin!: string;

  @Column({ name: 'credential_id', type: 'uuid' })
  credentialId!: string;

  @Column({
    type: 'enum',
    enum: TemporaryCredentialRequestPurpose,
  })
  purpose!: TemporaryCredentialRequestPurpose;

  @Column({
    type: 'enum',
    enum: TemporaryCredentialRequestStatus,
    default: TemporaryCredentialRequestStatus.PENDING,
  })
  status!: TemporaryCredentialRequestStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  /** Set when ciphertext was handed to the requesting client (single-use guard). */
  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;
}
