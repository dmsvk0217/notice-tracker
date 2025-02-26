import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from './notice/notice.entity';
import { NoticeModule } from './notice/notice.module';

@Module({
  imports: [
    NoticeModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Notice],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
