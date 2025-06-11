FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

ENV FRED_API_KEY 16507a15eaef58b80ad506fa15032bf8

EXPOSE 3000

CMD ["node", "server.js"]
