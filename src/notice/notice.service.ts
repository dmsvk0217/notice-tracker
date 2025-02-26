import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as puppeteer from 'puppeteer';
import * as twilio from 'twilio';
import { Repository } from 'typeorm';
import { getNoticeUrls, getTwilioConfig, noticeTypes } from './const';
import { Notice } from './notice.entity';
import { SELECTORS } from './selector';

@Injectable()
export class NoticeService {
  private readonly loginUrl: string;
  private readonly userId: string;
  private readonly userPassword: string;
  private readonly NOTICE_URLS: Record<string, string>;
  private readonly TWILIO_CONFIG: Record<string, string>;

  private browser: puppeteer.Browser;
  private page: puppeteer.Page;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {
    this.loginUrl = this.configService.get<string>('LOGIN_URL');
    this.userId = this.configService.get<string>('USER_ID');
    this.userPassword = this.configService.get<string>('USER_PASSWORD');

    this.NOTICE_URLS = getNoticeUrls(configService);
    this.TWILIO_CONFIG = getTwilioConfig(configService);
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkNotices() {
    await this.initBrowser();
    await this.login();

    for (const type of noticeTypes) {
      console.log('🚀 type:', type);
      const notices = await this.scrapeNotices(this.NOTICE_URLS[type]);
      if (notices.length === 0) return;

      const newNoticesToSend = await this.getNewNotices(type, notices);

      if (newNoticesToSend.length > 0) {
        console.log('🚀 newNoticesToSend:', newNoticesToSend);
        for (const notice of newNoticesToSend) {
          await this.sendSMS(type, notice.title);
        }

        await this.updateLatestNoticeId(type, newNoticesToSend);
      } else {
        console.log('📢 새로운 공지가 없습니다.');
      }
      console.log('\n');
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

  private async scrapeNotices(url: string) {
    console.log('📄 공지 크롤링 중...');
    await this.page.goto(url, { waitUntil: 'networkidle2' });

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

  private async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      console.log('🛑 Puppeteer 브라우저 종료');
    }
  }

  async getLatestNoticeId(type: string): Promise<number> {
    const latestNotice = await this.noticeRepository.findOne({
      where: { type: type },
      order: { id: 'DESC' },
    });

    return latestNotice ? Number(latestNotice.id) : 0;
  }

  async getNewNotices(
    type: string,
    notices: { id: string; title: string }[],
  ): Promise<{ id: string; title: string }[]> {
    const latestNoticeId = await this.getLatestNoticeId(type);
    console.log(`🔎 가장 최근 인식된 ${type} 공지 ID: ${latestNoticeId}`);

    return latestNoticeId
      ? notices.filter((notice) => Number(notice.id) > latestNoticeId)
      : [];
  }

  async updateLatestNoticeId(
    type: string,
    newNotices: { id: string }[],
  ): Promise<void> {
    if (newNotices.length === 0) return;

    const maxId = Math.max(...newNotices.map((notice) => Number(notice.id)));

    await this.noticeRepository.update({ type }, { id: maxId.toString() });

    console.log(`🔄 ${type} 공지 최신 ID 업데이트: ${maxId}`);
  }

  private async sendSMS(type: string, message: string) {
    const client = twilio(
      this.TWILIO_CONFIG.twilioSid,
      this.TWILIO_CONFIG.twilioAuthToken,
    );

    await client.messages.create({
      body: `[${type}] ${message}`,
      from: this.TWILIO_CONFIG.twilioPhone,
      to: this.TWILIO_CONFIG.receiverPhone,
    });

    console.log(`📩 문자 발송 완료: ${message}`);
  }
}
