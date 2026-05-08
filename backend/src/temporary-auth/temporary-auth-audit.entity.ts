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
import { TemporaryAuthAuditActor } from './temporary-auth.enums';

@Entity({ name: 'temporary_auth_audit' })
@Index(['sessionId', 'createdAt'])
export class TemporaryAuthAudit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @ManyToOne(() => TemporaryAuthSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: TemporaryAuthSession;

  @Column({ type: 'varchar' })
  action!: string;

  @Column({
    name: 'actor_type',
    type: 'enum',
    enum: TemporaryAuthAuditActor,
  })
  actorType!: TemporaryAuthAuditActor;

  @Column({ name: 'actor_ref', type: 'varchar', nullable: true })
  actorRef!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
