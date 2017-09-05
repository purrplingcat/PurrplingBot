FROM node:8.2.1-alpine

LABEL com.purrplingcat.name="PurrplingBot"
LABEL com.purrplingcat.version="1.2.0"
LABEL com.purrplingcat.vendor="PurrplingCat"
LABEL com.purrplingcat.email="dev@purrplingcat.com"
LABEL com.purrplingcat.github="https://github.com/EllenFawkes/PurrplingBot"

ENV DEBUG=0
ENV APP_DIR="/opt/PurrplingBot"
ENV APP_CONFIG_DIR="/data/config"
ENV APP_LOGS="/data/logs/purrplingbot.log"

# Create app place
RUN mkdir -p $APP_DIR
WORKDIR $APP_DIR

# Install npm dependencies
COPY package.json .
RUN npm install

# Copy app bundle
COPY . .

# Redirect configs to /data/config
RUN mv config/config.example.json extras/config.example.json && \
    rm -rf config && \
    ln -s $APP_CONFIG_DIR config

# Redirect logs to /data/logs
RUN rm -rf purrplingbot.log && \
    ln -s $APP_LOGS purrplingbot.log && \
    ln -s $APP_LOGS /var/log/purrplingbot.log

VOLUME /data/config
VOLUME /data/logs

# Start PurrplingBot
CMD ["npm", "start"]
