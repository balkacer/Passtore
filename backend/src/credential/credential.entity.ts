import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity({ name: 'credentials' })
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (u) => u.credentials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  alias!: string;

  @Column({ name: 'platform_name' })
  platformName!: string;

  @Column({ type: 'varchar', nullable: true })
  url!: string | null;

  /** Login identifier for the saved site/app (not Passtore account username). */
  @Column({ name: 'login_username' })
  loginUsername!: string;

  /**
   * Client-side ciphertext only. The API never decrypts this field.
   * Plain passwords must not be sent or stored on the server.
   */
  @Column({ name: 'encrypted_password', type: 'text' })
  encryptedPassword!: string;

  @Column({ name: 'icon_url', type: 'varchar', nullable: true })
  iconUrl!: string | null;

  @Column({ name: 'notes_encrypted', type: 'text', nullable: true })
  notesEncrypted!: string | null;

  @Column({ name: 'strength_score', type: 'int', nullable: true })
  strengthScore!: number | null;

  @Column({ name: 'is_duplicate', default: false })
  isDuplicate!: boolean;

  @Column({ type: 'varchar', nullable: true })
  category!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
