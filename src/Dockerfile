FROM node:slim
LABEL maintainer="Eyevinn Technology <info@eyevinn.se>"
RUN apt-get update && apt-get install yarn -y --force-yes
WORKDIR /app
ADD . .
RUN yarn
RUN yarn build
CMD [ "yarn", "start" ]