FROM node:16

LABEL maintainer="Eyevinn Technology <info@eyevinn.se>"

WORKDIR /app
ADD . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
