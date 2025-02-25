import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Notice {
  @PrimaryColumn()
  id: string;

  @PrimaryColumn()
  type: string;
}
