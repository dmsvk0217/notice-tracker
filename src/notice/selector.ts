export const SELECTORS = {
  login: {
    username:
      '#loginBoxBg > table:nth-child(2) > tbody > tr > td:nth-child(5) > form > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(1) > td:nth-child(2) > span > input[type=text]',
    password:
      '#loginBoxBg > table:nth-child(2) > tbody > tr > td:nth-child(5) > form > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(3) > td:nth-child(2) > input[type=password]',
    submitButton:
      '#loginBoxBg > table:nth-child(2) > tbody > tr > td:nth-child(5) > form > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > input[type=image]',
  },
  board: {
    notices:
      'body > table:nth-child(12) > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(3) > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(1) > td > table > tbody tr.tr_basic',
    noticeId: 'td:nth-child(1) > div > a',
    noticeTitle: 'td:nth-child(2) > a',
  },
};
