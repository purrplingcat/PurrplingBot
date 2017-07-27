FROM node:8.2.1-alpine

LABEL com.purrplingcat.name="PurrplingBot"
LABEL com.purrplingcat.version="1.0.0"
LABEL com.purrplingcat.vendor="PurrplingCat"
LABEL com.purrplingcat.email="dev@purrplingcat.com"
LABEL com.purrplingcat.github="https://github.com/EllenFawkes/PurrplingBot"

ENV APP_DIR="/opt/PurrplingBot"
ENV APP_LOGS="/var/log/purrplingbot.log"

# Create app place
RUN mkdir -p $APP_DIR
WORKDIR $APP_DIR

# Install npm dependencies
COPY package.json .
RUN npm install

# Copy app bundle
COPY . .

# Redirect logs to /var/log
RUN rm -rf purrplingbot.log && \
    ln -s $APP_LOGS purrplingbot.log
    
VOLUME ./config.json

# Start PurrplingBot
CMD ["npm", "start"]
