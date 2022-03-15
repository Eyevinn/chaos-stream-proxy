<<<<<<< HEAD
FROM node:16

WORKDIR /app
ADD . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
=======
FROM node:slim

WORKDIR /app

ADD . .

RUN npm install
RUN npm run build

CMD ["npm", "start"]
>>>>>>> 9d387a8 (chore: fix and move out docker files)
