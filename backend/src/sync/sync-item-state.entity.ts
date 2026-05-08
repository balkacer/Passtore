import { Column, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Last accepted row version per vault item for optimistic locking (metadata only). */
@Entity({ name: 'sync_item_states' })
@Index(['userId'])
export class SyncItemState {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @PrimaryColumn({ name: 'item_key' })
  itemKey!: string;

  @Column({ name: 'row_version', type: 'int' })
  rowVersion!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
