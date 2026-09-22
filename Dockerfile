ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base-nodejs:20
FROM ${BUILD_FROM}

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .
RUN npm run build

COPY run.sh /
RUN chmod a+x /run.sh

EXPOSE 8099

ENV INGRESS_PORT=8099
ENV HA_CONFIG_DIR=/config

CMD [ "/run.sh" ]
