FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=3000

RUN npm run build

RUN mkdir -p /app/database

CMD ["npm", "run", "start"]
