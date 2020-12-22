FROM node:14

ENV LANG C.UTF-8

RUN curl -L https://yt-dl.org/downloads/latest/youtube-dl -o /usr/local/bin/youtube-dl && chmod a+rx /usr/local/bin/youtube-dl

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /usr/src/app

RUN mkdir /usr/src/app/output

COPY package*.json yarn.lock ./

RUN yarn install

COPY . .

ENTRYPOINT ["yarn", "ts-node", "index.ts"]
