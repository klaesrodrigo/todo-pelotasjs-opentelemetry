FROM node:18

WORKDIR /usr/src/app

COPY yarn.lock ./
COPY .env .
RUN yarn

COPY . .

EXPOSE 3000

CMD ["yarn", "start:dev"]
