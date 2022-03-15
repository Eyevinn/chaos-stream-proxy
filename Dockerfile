FROM node:slim

WORKDIR /app

ADD . .

RUN npm install
RUN npm run build

CMD ["npm", "start"]