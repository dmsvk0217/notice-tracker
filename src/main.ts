import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NoticeService } from './notice/notice.service';

global.crypto = require('crypto');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  const noticeService = app.get(NoticeService);
  await noticeService.checkNotices();
}
bootstrap();
