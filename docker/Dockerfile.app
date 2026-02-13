FROM node:24-alpine

RUN apk add --no-cache bash
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

COPY docker/scripts/wait-for-it.sh /opt/wait-for-it.sh
COPY docker/scripts/start-app.sh /opt/start-app.sh
RUN if [ ! -f .env ]; then cp env-example-relational .env; fi \
  && chmod +x /opt/wait-for-it.sh /opt/start-app.sh \
  && sed -i 's/\r$//' /opt/wait-for-it.sh /opt/start-app.sh \
  && npm run build

EXPOSE 3000
CMD ["/opt/start-app.sh"]
