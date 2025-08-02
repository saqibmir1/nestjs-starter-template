FROM node:23.9.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install --quiet --no-progress

COPY . .

RUN yarn build

EXPOSE 8002

CMD ["npm", "start:prod"]