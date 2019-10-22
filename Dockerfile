FROM elixir:1.8-alpine as builder

# elixir expects utf8.
ENV ELIXIR_VERSION="v1.8.1" \
  LANG=C.UTF-8

WORKDIR /root

# Install git so we can install dependencies from GitHub
RUN apk add --no-cache --update git

# Install Hex+Rebar
RUN mix local.hex --force && \
  mix local.rebar --force

RUN apk add --update nodejs nodejs-npm

ENV MIX_ENV=prod

ADD . .

RUN mix do deps.get, deps.compile

WORKDIR /root/assets/
RUN npm ci && npm run deploy

WORKDIR /root
RUN mix phx.digest

WORKDIR /root
RUN mix distillery.release --verbose
