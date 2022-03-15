FROM node:16

WORKDIR /app
ADD . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
