FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# ENV BOT_TOKEN=<your_bot_token>
# ENV API_KEY=<your_api_key>

ENV PORT=3000

EXPOSE $PORT

CMD ["npm", "start"]
