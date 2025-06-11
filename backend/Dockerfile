FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# I know, that should not be here (public), but that's a quick project and exposing my api key will not be a security issue for me because I don't care about this key
ENV FRED_API_KEY 16507a15eaef58b80ad506fa15032bf8

EXPOSE 3000

CMD ["node", "server.js"]
