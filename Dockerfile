FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm install --only=production

COPY . .

ENV PORT=8080

CMD ["npm", "start"]
