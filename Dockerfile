FROM node:lts-alpine
RUN apk add --no-cache g++ make python3
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY ./db ./db
COPY ./lib ./lib
COPY schema.graphql ./
COPY dump_*.json ./
CMD ["sh", "-c", "npx squid-typeorm-migration apply && node lib/main.js"]