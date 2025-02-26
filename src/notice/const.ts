import { ConfigService } from '@nestjs/config';

export const noticeTypes = ['general', 'csee', 'law'];

export const getNoticeUrls = (configService: ConfigService) => ({
  general: configService.get<string>('NOTICE_GENERAL_URL'),
  csee: configService.get<string>('NOTICE_CSEE_URL'),
  law: configService.get<string>('NOTICE_LAW_URL'),
});

export const getTwilioConfig = (configService: ConfigService) => ({
  twilioSid: configService.get<string>('TWILIO_SID'),
  twilioAuthToken: configService.get<string>('TWILIO_AUTH_TOKEN'),
  twilioPhone: configService.get<string>('TWILIO_PHONE'),
  receiverPhone: configService.get<string>('RECEIVER_PHONE'),
});
