ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest

FROM node:20-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM ${BUILD_FROM}

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apk add --no-cache nodejs npm bash

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /build/dist ./dist

COPY server ./server
COPY translations ./translations
COPY config.yaml ./config.yaml

COPY run.sh /
RUN chmod a+x /run.sh

EXPOSE 8099

ENV INGRESS_PORT=8099
ENV HA_CONFIG_DIR=/config

CMD [ "/run.sh" ]
