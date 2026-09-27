FROM node:22-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache bash tini

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /build/dist ./dist

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
