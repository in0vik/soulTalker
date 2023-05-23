FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# ENV BOT_TOKEN=<ваш_токен>
# ENV API_KEY=<ваш_ключ>

ENV PORT=3000

EXPOSE $PORT

CMD ["npm", "start"]
