FROM node:25-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
RUN apk add --no-cache curl unzip bash
COPY scripts/fetch-mock-frontend.sh scripts/fetch-mock-frontend.sh
COPY scripts/fetch-mock-mods.sh scripts/fetch-mock-mods.sh
RUN chmod +x scripts/fetch-mock-frontend.sh scripts/fetch-mock-mods.sh && ./scripts/fetch-mock-frontend.sh && ./scripts/fetch-mock-mods.sh
RUN npm run build:mock-frontend-bootstrap
RUN npm run build

FROM node:25-alpine

RUN apk add --no-cache bash tini

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /build/dist ./dist
COPY --from=builder /build/vendor ./vendor

COPY server ./server
COPY translations ./translations
COPY bundled ./bundled
COPY config.yaml ./config.yaml

COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 4287

ENV INGRESS_PORT=4287
ENV HA_CONFIG_DIR=/config

ENTRYPOINT ["/sbin/tini", "-s", "--"]
CMD [ "/run.sh" ]
