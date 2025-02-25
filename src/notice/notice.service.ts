import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as puppeteer from 'puppeteer';
import * as twilio from 'twilio';
import { Repository } from 'typeorm';
import { Notice } from './notice.entity';
import { SELECTORS } from './selector';

@Injectable()
export class NoticeService {
  private readonly loginUrl: string;
  private readonly boardUrl: string;
  private readonly userId: string;
  private readonly userPassword: string;
  private readonly twilioSid: string;
  private readonly twilioAuthToken: string;
  private readonly twilioPhone: string;
  private readonly receiverPhone: string;

  private browser: puppeteer.Browser;
  private page: puppeteer.Page;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(Notice)
    private readonly noticeRepo: Repository<Notice>,
  ) {
    this.loginUrl = this.configService.get<string>('LOGIN_URL');
    this.boardUrl = this.configService.get<string>('BOARD_URL');
    this.userId = this.configService.get<string>('USER_ID');
    this.userPassword = this.configService.get<string>('USER_PASSWORD');
    this.twilioSid = this.configService.get<string>('TWILIO_SID');
    this.twilioAuthToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE');
    this.receiverPhone = this.configService.get<string>('RECEIVER_PHONE');
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  async checkNotices() {
    console.log('🔍 공지 확인 중...');

    await this.initBrowser();
    await this.login();
    const notices = await this.scrapeNotices();

    const newNotices = [];
    for (const notice of notices) {
      newNotices.push(notice);
    }
    console.log('🚀 ~ NoticeService ~ checkNotices ~ newNotices:', newNotices);

    if (newNotices.length > 0) {
      console.log(`🚀 새로운 공지 발견: ${newNotices.length}개`);
      for (const notice of newNotices) {
        // await this.sendSMS(notice.title);
      }
    } else {
      console.log('📢 새로운 공지가 없습니다.');
    }

    await this.closeBrowser();
  }

  private async initBrowser() {
    this.browser = await puppeteer.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  async login(): Promise<void> {
    console.log('🔑 로그인 중...');
    await this.page.goto(this.loginUrl, { waitUntil: 'networkidle2' });

    await this.page.type(SELECTORS.login.username, this.userId);
    await this.page.type(SELECTORS.login.password, this.userPassword);
    await this.page.click(SELECTORS.login.submitButton);

    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('✅ 로그인 성공, 세션 유지');
  }

  private async scrapeNotices() {
    console.log('📄 공지 크롤링 중...');
    await this.page.goto(this.boardUrl, { waitUntil: 'networkidle2' });

    const notices = await this.page.evaluate((selectors) => {
      const noticeList = [];
      const rows = document.querySelectorAll(selectors.notices);

      rows.forEach((row) => {
        const idElement = row.querySelector(selectors.noticeId);
        const titleElement = row.querySelector(selectors.noticeTitle);

        if (idElement && titleElement) {
          const id = idElement.textContent.trim();
          const title = titleElement.textContent.trim();
          noticeList.push({ id, title });
        }
      });

      return noticeList;
    }, SELECTORS.board);

    console.log(`📄 크롤링 완료, ${notices.length}개 발견`);
    return notices;
  }

  private async sendSMS(message: string) {
    const client = twilio(this.twilioSid, this.twilioAuthToken);

    await client.messages.create({
      body: `📢 새 공지: ${message}`,
      from: this.twilioPhone,
      to: this.receiverPhone,
    });

    console.log(`📩 문자 발송 완료: ${message}`);
  }

  /**
   * Puppeteer 브라우저 종료
   */
  private async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      console.log('🛑 Puppeteer 브라우저 종료');
    }
  }
}
