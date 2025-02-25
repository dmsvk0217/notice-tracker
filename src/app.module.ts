import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from './notice/notice.entity';
import { NoticeModule } from './notice/notice.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'notices.db',
      entities: [Notice],
      synchronize: true,
    }),
    NoticeModule,
  ],
})
export class AppModule {}
