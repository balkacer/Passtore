import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity({ name: 'passkey_credentials' })
export class PasskeyCredential {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  /** Base64URL-encoded credential ID */
  @Column({ name: 'credential_id', unique: true })
  credentialId!: string;

  @Column({ name: 'public_key', type: 'bytea' })
  publicKey!: Buffer;

  @Column({ type: 'bigint', default: '0' })
  counter!: string;

  @Column({ type: 'jsonb', nullable: true })
  transports!: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
